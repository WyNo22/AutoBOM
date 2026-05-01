// Augment Auth.js Session.user with our `id` field, so server components can do
// session.user.id without TS errors.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
