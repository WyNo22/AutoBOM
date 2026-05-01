// Auth.js v5 exposes `handlers = { GET, POST }` from the NextAuth() factory.
// Next.js route handlers require named per-method exports, so we destructure.
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
