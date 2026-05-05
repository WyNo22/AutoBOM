"use server";

import { db, users } from "@/lib/db";
import { createAuthSession } from "@/lib/auth-session";
import { sendEmailVerification, sendPasswordReset } from "@/lib/account-email";
import { hashPassword, verifyPassword } from "@/lib/password";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type AuthState = { error: string } | null;

export async function registerWithPassword(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email || !firstName || !lastName) return { error: "Tous les champs sont obligatoires." };
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (password !== confirm) return { error: "Les mots de passe ne correspondent pas." };

  let existing;
  try {
    existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  } catch (e) {
    console.error("[auth] register lookup failed", e);
    return { error: "La base de données n’est pas disponible. Vérifie la configuration Vercel." };
  }
  if (existing) return { error: "Un compte avec cet email existe déjà." };

  let user;
  try {
    [user] = await db
      .insert(users)
      .values({
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        passwordHash: hashPassword(password),
      })
      .returning({ id: users.id });
  } catch (e) {
    console.error("[auth] register insert failed", e);
    return { error: "Impossible de créer le compte. Vérifie que les migrations DB sont appliquées." };
  }

  try { await sendEmailVerification(user.id); } catch (e) { console.error("[email] sendEmailVerification failed", e); }
  redirect(`/login/check-email?email=${encodeURIComponent(email)}`);
}

export async function loginWithPassword(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email et mot de passe requis." };

  let user;
  try {
    user = await db.query.users.findFirst({ where: eq(users.email, email) });
  } catch (e) {
    console.error("[auth] login lookup failed", e);
    return { error: "La base de données n’est pas disponible. Vérifie la configuration Vercel." };
  }
  if (!user || !verifyPassword(password, user.passwordHash ?? "")) return { error: "Email ou mot de passe incorrect." };
  if (!user.emailVerified) {
    try { await sendEmailVerification(user.id); } catch (e) { console.error("[email] sendEmailVerification failed", e); }
    redirect(`/login/check-email?email=${encodeURIComponent(email)}`);
  }

  try {
    await createAuthSession(user.id);
  } catch (e) {
    console.error("[auth] login session creation failed", e);
    return { error: "Impossible de créer la session. Vérifie que les migrations DB sont appliquées." };
  }
  redirect("/projects");
}

export async function requestPasswordReset(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/forgot-password/check-email");
  let user;
  try {
    user = await db.query.users.findFirst({ where: eq(users.email, email) });
  } catch (e) {
    console.error("[auth] password reset lookup failed", e);
    redirect(`/forgot-password/check-email?email=${encodeURIComponent(email)}`);
  }
  if (user) {
    try { await sendPasswordReset(user.id); } catch (e) { console.error("[email] sendPasswordReset failed", e); }
  }
  redirect(`/forgot-password/check-email?email=${encodeURIComponent(email)}`);
}
