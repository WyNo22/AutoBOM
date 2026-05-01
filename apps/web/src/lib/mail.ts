import "server-only";

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
  const driver = process.env.MAIL_DRIVER ?? "console";
  const { identifier, url } = params;

  if (driver === "console") {
    const bar = "─".repeat(72);
    // eslint-disable-next-line no-console
    console.log(
      `\n${bar}\n🔗 AutoBOM magic link\n   to:  ${identifier}\n   url: ${url}\n${bar}\n`
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
      to: identifier,
      subject: "Votre lien de connexion AutoBOM",
      text: `Connectez-vous à AutoBOM :\n\n${url}\n\nCe lien expire bientôt.`,
    });
    return;
  }

  throw new Error(`Unknown MAIL_DRIVER: ${driver}`);
}
