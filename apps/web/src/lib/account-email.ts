import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, accountTokens, users } from "@/lib/db";
import { sendAccountEmail } from "@/lib/mail";
import { buildEmailHtml } from "@/lib/email-html";

type AccountTokenType = "email_verification" | "password_reset";

function getBaseUrl() {
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined;
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? vercelProductionUrl ?? vercelUrl ?? "http://localhost:3000";
}

export async function createAccountToken(userId: string, type: AccountTokenType, ttlMs: number) {
  const token = randomBytes(32).toString("hex");
  await db.insert(accountTokens).values({
    token,
    userId,
    type,
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

export async function sendEmailVerification(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.email) return;
  const token = await createAccountToken(userId, "email_verification", 24 * 60 * 60 * 1000);
  const url = `${getBaseUrl()}/verify-email?token=${token}`;
  await sendAccountEmail({
    to: user.email,
    subject: "Valide ton compte AutoBOM",
    text: `Bienvenue sur AutoBOM. Valide ton compte ici :\n\n${url}\n\nCe lien expire dans 24 heures.`,
    html: buildEmailHtml({
      heading: "Valide ton adresse email",
      body: "Tu viens de créer un compte AutoBOM. Clique sur le bouton ci-dessous pour activer ton compte.",
      ctaUrl: url,
      ctaLabel: "Activer mon compte →",
      expiryNote: "Ce lien est valable 24\u00a0heures. Si tu n'es pas à l'origine de cette inscription, tu peux ignorer cet email.",
    }),
  });
}

export async function sendPasswordReset(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.email) return;
  const token = await createAccountToken(userId, "password_reset", 60 * 60 * 1000);
  const url = `${getBaseUrl()}/reset-password?token=${token}`;
  await sendAccountEmail({
    to: user.email,
    subject: "Réinitialise ton mot de passe AutoBOM",
    text: `Tu peux réinitialiser ton mot de passe ici :\n\n${url}\n\nCe lien expire dans 1 heure.`,
    html: buildEmailHtml({
      heading: "Réinitialise ton mot de passe",
      body: "Nous avons reçu une demande de réinitialisation de mot de passe pour ton compte AutoBOM. Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe.",
      ctaUrl: url,
      ctaLabel: "Réinitialiser mon mot de passe →",
      expiryNote: "Ce lien est valable 1\u00a0heure. Si tu n'es pas à l'origine de cette demande, tu peux ignorer cet email.",
    }),
  });
}

export async function consumeAccountToken(token: string, type: AccountTokenType) {
  const row = await db.query.accountTokens.findFirst({
    where: and(eq(accountTokens.token, token), eq(accountTokens.type, type)),
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  await db.update(accountTokens).set({ usedAt: new Date() }).where(eq(accountTokens.token, token));
  return row;
}
