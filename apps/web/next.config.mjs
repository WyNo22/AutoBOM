/** @type {import('next').NextConfig} */
const nextConfig = {
  // libSQL ships native bindings; keep them external so Next doesn't try to bundle.
  serverExternalPackages: ["@libsql/client", "libsql"],
  transpilePackages: ["@autbom/shared"],
  experimental: {
    typedRoutes: false,
    // Note: Next.js `allowedOrigins` does NOT support port wildcards (matcher
    // splits on `.`, not `:`). To allow the IDE preview proxy with its dynamic
    // port, see `src/middleware.ts` which aligns `origin` to `host` in dev.
  },
};

export default nextConfig;
