# 2026-04-30 — Server Actions bloquées par le proxy IDE

**Symptôme** : `Unhandled Runtime Error — [ Server ] Error: Invalid Server Actions request.` au submit du formulaire `/login` quand on accède à l'app via le proxy de preview de l'IDE (`http://127.0.0.1:62110`) au lieu de `http://localhost:3000`.

**Cause racine** : Next.js 15 applique une protection CSRF sur les Server Actions et compare l'header `Origin` au `Host` (ou `x-forwarded-host`) de la requête. Le proxy IDE tourne sur un port aléatoire (62110, 51234, …) qui ne match pas le host backend `localhost:3000`.

**Faux remède d'abord essayé** : `experimental.serverActions.allowedOrigins: ["localhost:*", "127.0.0.1:*"]`. Ne fonctionne **pas** : le matcher de Next (`matchWildcardDomain` dans `csrf-protection.js`) split sur les `.` et n'autorise les wildcards qu'au niveau **domaine** (`*.example.com`), pas pour les ports.

**Correction qui fonctionne** : un middleware dev-only qui réécrit l'header `origin` pour qu'il matche `host` :

```ts
// apps/web/src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") return NextResponse.next();
  const host = req.headers.get("host");
  if (!host) return NextResponse.next();
  const headers = new Headers(req.headers);
  headers.set("origin", `http://${host}`);
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
```

En prod ce middleware est no-op, le vrai CSRF check est préservé.

**Leçon** :
1. `allowedOrigins` Next.js ne supporte les wildcards **que sur le domaine** (séparateur `.`), pas sur le port.
2. Pour les setups dev derrière un proxy à port dynamique, le contournement propre est un middleware qui aligne `origin` à `host`, plutôt que d'essayer de lister tous les ports.
