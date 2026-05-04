import { NextRequest, NextResponse } from "next/server";
import { sendAccountEmail } from "@/lib/mail";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.TEST_EMAIL_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const to = req.nextUrl.searchParams.get("to");
  if (!to) {
    return NextResponse.json({ error: "missing ?to=email" }, { status: 400 });
  }

  const driver = process.env.MAIL_DRIVER ?? (process.env.SMTP_HOST ? "smtp" : process.env.RESEND_API_KEY ? "resend" : "console");

  try {
    await sendAccountEmail({
      to,
      subject: "Test email AutoBOM",
      text: "Ceci est un email de test. Si vous le recevez, la configuration SMTP fonctionne.",
    });
    return NextResponse.json({ ok: true, driver });
  } catch (err) {
    return NextResponse.json({ ok: false, driver, error: String(err) }, { status: 500 });
  }
}
