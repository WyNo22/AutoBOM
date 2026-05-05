import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";

/**
 * Admin bypass: creates a real DB session for ADMIN_EMAIL without going
 * through the magic-link flow. Only enabled when ADMIN_EMAIL is set.
 */
export async function POST(req: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json({ error: "ADMIN_EMAIL not set" }, { status: 404 });
    }

    // Find or create the admin user
    let user = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (!user) {
      const id = randomUUID();
      await db.insert(users).values({
        id,
        email: adminEmail,
        name: "Admin",
        emailVerified: new Date(),
      });
      user = {
        id,
        email: adminEmail,
        name: "Admin",
        firstName: null,
        lastName: null,
        passwordHash: null,
        emailVerified: new Date(),
        image: null,
        aiSourcingEnabled: true,
      };
    }

    if (!user) {
      return NextResponse.json({ error: "Unable to create admin user" }, { status: 500 });
    }

    // Create a session row
    const sessionToken = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await db.insert(sessions).values({
      sessionToken,
      userId: user.id,
      expires,
    });

    // Set the Auth.js session cookie. Cookie name differs between http and https.
    const isProd = process.env.NODE_ENV === "production";
    const cookieName = isProd ? "__Secure-authjs.session-token" : "authjs.session-token";

    const cookieStore = await cookies();
    cookieStore.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      expires,
    });

    return NextResponse.redirect(new URL("/projects", req.url));
  } catch (error) {
    console.error("Admin bypass failed", error);
    return NextResponse.json({ error: "Admin bypass failed" }, { status: 500 });
  }
}
