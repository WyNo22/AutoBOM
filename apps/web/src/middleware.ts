import { NextResponse, type NextRequest } from "next/server";

/**
 * Dev-only CSRF workaround for Server Actions through a proxy.
 *
 * Next.js 15 rejects Server Action requests if the `Origin` header host does
 * not match the `Host` header (CSRF protection). When developing through the
 * IDE browser preview proxy (e.g. `http://127.0.0.1:62110`), the proxy keeps
 * the original `Origin` while the request reaches Next on `localhost:3000`,
 * so the check fails. `serverActions.allowedOrigins` doesn't help because its
 * pattern matcher does not support port wildcards.
 *
 * Here we rewrite `origin` to match `host` for every request in development,
 * which makes Next's check pass. In production this middleware is a no-op so
 * the real CSRF protection is preserved.
 */
export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.next();
  }

  const host = req.headers.get("host");
  if (!host) return NextResponse.next();

  const headers = new Headers(req.headers);
  const proto = headers.get("x-forwarded-proto") ?? "http";
  headers.set("origin", `${proto}://${host}`);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Apply to everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
