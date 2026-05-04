import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { db, sessions } from "@/lib/db";

export async function createAuthSession(userId: string) {
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ sessionToken, userId, expires });
  const cookieName = process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token";
  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    expires,
  });
}
