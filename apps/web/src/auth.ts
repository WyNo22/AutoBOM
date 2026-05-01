import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { sendMagicLink } from "@/lib/mail";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  providers: [
    Resend({
      // We bypass Resend entirely in dev (MAIL_DRIVER=console) by overriding
      // sendVerificationRequest. The apiKey/from must still be present so the
      // provider initializes — they are unused unless MAIL_DRIVER=resend.
      apiKey: process.env.RESEND_API_KEY ?? "noop-dev-key",
      from: process.env.MAIL_FROM ?? "AUTBOM <noreply@example.com>",
      sendVerificationRequest: sendMagicLink,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
