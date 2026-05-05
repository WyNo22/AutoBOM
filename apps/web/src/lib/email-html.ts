/**
 * Builds a branded HTML email for AutoBOM.
 * All CSS is inlined for maximum compatibility across email clients.
 */
export function buildEmailHtml(params: {
  heading: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  expiryNote?: string;
}): string {
  const { heading, body, ctaUrl, ctaLabel, expiryNote } = params;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading} — AutoBOM</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f0f0f5;padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,0.09);">

          <!-- Header -->
          <tr>
            <td style="background-color:#07071a;padding:24px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;">
                <tr>
                  <td style="padding-right:8px;vertical-align:middle;">
                    <!-- Triangle logo -->
                    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                      <polygon points="14,2 26,24 2,24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linejoin="round"/>
                      <line x1="7" y1="18" x2="21" y2="18" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
                      <line x1="10.5" y1="11" x2="14" y2="5" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round"/>
                      <line x1="17.5" y1="11" x2="14" y2="5" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;line-height:1;">AutoBOM</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0 0 14px;font-size:22px;font-weight:700;color:#0f0f23;letter-spacing:-0.3px;line-height:1.3;">
                ${heading}
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.65;">
                ${body}
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background-color:#6366f1;">
                    <a href="${ctaUrl}"
                      style="display:inline-block;padding:13px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;border-radius:8px;background-color:#6366f1;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>

              ${expiryNote ? `
              <!-- Expiry note -->
              <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
                ${expiryNote}
              </p>` : ""}

              <!-- Fallback URL -->
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br />
                <a href="${ctaUrl}" style="color:#6366f1;word-break:break-all;text-decoration:none;">${ctaUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;text-align:center;">
              <!-- Mini logo repeat -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;margin-bottom:10px;">
                <tr>
                  <td style="padding-right:5px;vertical-align:middle;">
                    <svg width="14" height="14" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;opacity:0.5;">
                      <polygon points="14,2 26,24 2,24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linejoin="round"/>
                      <line x1="7" y1="18" x2="21" y2="18" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/>
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:12px;font-weight:600;color:#9ca3af;letter-spacing:0.2px;">AutoBOM</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
                Ce message est automatique, merci de ne pas y répondre.<br />
                © ${new Date().getFullYear()} AutoBOM
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}
