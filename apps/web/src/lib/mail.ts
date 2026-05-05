import "server-only";
import { buildEmailHtml } from "./email-html";

async function sendViaSmtp(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM ?? user ?? "AutoBOM <noreply@example.com>";
  if (!host || !user || !pass) {
    throw new Error("MAIL_DRIVER=smtp but SMTP_HOST/SMTP_USER/SMTP_PASS are not set");
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    ...(params.html ? { html: params.html } : {}),
  });
}

function getMailDriver() {
  if (process.env.MAIL_DRIVER) return process.env.MAIL_DRIVER;
  if (process.env.SMTP_HOST) return "smtp";
  if (process.env.RESEND_API_KEY) return "resend";
  return "console";
}

/**
 * Magic link email sender. In dev (MAIL_DRIVER=console) the link is just
 * printed to the server stdout — no SMTP/Resend account required.
 *
 * Signature matches Auth.js' `sendVerificationRequest` callback.
 */
export async function sendMagicLink(params: {
  identifier: string;
  url: string;
  expires?: Date;
}) {
  const driver = getMailDriver();
  const { identifier, url } = params;

  if (driver === "console") {
    const bar = "─".repeat(72);
    // eslint-disable-next-line no-console
    console.log(
      `\n${bar}\n🔗 AutoBOM magic link\n   to:  ${identifier}\n   url: ${url}\n${bar}\n`
    );
    return;
  }

  const magicLinkHtml = buildEmailHtml({
    heading: "Connectez-vous à AutoBOM",
    body: "Cliquez sur le bouton ci-dessous pour accéder à votre compte. Ce lien est à usage unique.",
    ctaUrl: url,
    ctaLabel: "Se connecter →",
    expiryNote: "Ce lien expire bientôt. Si vous n'avez pas demandé cet accès, ignorez cet email.",
  });

  if (driver === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM ?? "AutoBOM <noreply@autobom.app>";
    if (!apiKey) {
      throw new Error("MAIL_DRIVER=resend but RESEND_API_KEY is not set");
    }
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: identifier,
      subject: "Votre lien de connexion AutoBOM",
      text: `Connectez-vous à AutoBOM :\n\n${url}\n\nCe lien expire bientôt.`,
      html: magicLinkHtml,
    });
    return;
  }

  if (driver === "smtp") {
    await sendViaSmtp({
      to: identifier,
      subject: "Votre lien de connexion AutoBOM",
      text: `Connectez-vous à AutoBOM :\n\n${url}\n\nCe lien expire bientôt.`,
      html: magicLinkHtml,
    });
    return;
  }

  throw new Error(`Unknown MAIL_DRIVER: ${driver}`);
}

export async function sendAccountEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const driver = getMailDriver();

  if (driver === "console") {
    const bar = "─".repeat(72);
    console.log(
      `\n${bar}\n✉️  AutoBOM email\n   to:      ${params.to}\n   subject: ${params.subject}\n\n${params.text}\n${bar}\n`
    );
    return;
  }

  if (driver === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM ?? "AutoBOM <noreply@autobom.app>";
    if (!apiKey) {
      throw new Error("MAIL_DRIVER=resend but RESEND_API_KEY is not set");
    }
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      ...(params.html ? { html: params.html } : {}),
    });
    return;
  }

  if (driver === "smtp") {
    await sendViaSmtp(params);
    return;
  }

  throw new Error(`Unknown MAIL_DRIVER: ${driver}`);
}
