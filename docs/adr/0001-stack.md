# ADR 0001 — Stack technique du MVP

- **Statut** : accepté
- **Date** : 2026-04-30

## Contexte

L'utilisateur veut "le plus simple et scalable" pour livrer un MVP rapidement, accessible localement d'abord, mais qui pourra évoluer vers un déploiement cloud sans refactor profond. L'app doit gérer petits et gros fichiers (DXF, STEP, 3MF) et permettre à terme l'auto add-to-cart sur des sites fournisseurs (Tolery, Xometry, Amazon, Leroy Merlin, Brico-Vis, 123Roulements, Norelem).

## Décision

| Couche | Choix | Alternatives écartées |
|---|---|---|
| Frontend | Next.js 15 App Router + React 19 + Tailwind v3 | SvelteKit (moins d'écosystème), Vite SPA (perd le serveur) |
| Tableau BOM | TanStack Table v8 + Virtual | AG Grid (lourd), Handsontable (licence) |
| DB | libSQL : fichier SQLite local en dev → Turso (libSQL cloud) en prod, via Drizzle ORM. Choix dicté aussi par le fait que `better-sqlite3` n'a pas de binaires précompilés pour Node 24 ; libSQL via `@libsql/client` les a. | Postgres dès le dev (Docker requis), `better-sqlite3` (build-fail Node 24), Prisma (plus opaque) |
| Auth | Auth.js v5 magic link, en dev le lien est loggué dans la console (driver `console`), en prod via Resend | Clerk (vendor lock-in, payant à l'échelle), Lucia (plus de DIY), credentials email+password (UX moins bonne) |
| Storage | Local FS en dev, S3-compatible (Supabase Storage / R2) en prod, derrière une interface unique | Supabase d'office (oblige Postgres dès le dev) |
| Mailing | Driver `console` en dev, Resend en prod | Nodemailer + SMTP (config plus lourde) |
| Monorepo | pnpm workspaces + Turborepo | npm workspaces (perfs), Nx (overkill) |
| Extension | Chrome MV3 + Vite | Plasmo (couche d'abstraction inutile) |

## Conséquences

### Positives
- Démarrage zéro friction : aucun service à installer (pas de Docker, pas de SMTP).
- Migration cloud : modifier 2 variables d'env (`DB_DRIVER=postgres`, `STORAGE_DRIVER=s3`, `MAIL_DRIVER=resend`) et déployer.
- Schéma Drizzle SQL-first portable SQLite ↔ Postgres (timestamps en `unixepoch() * 1000`, IDs texte UUID).
- Magic link en console = onboarding dev en 30 secondes.

### Risques
- SQLite ≠ Postgres sur quelques détails (collation, types JSON, contraintes différées). On évite les fonctionnalités spécifiques (pas de JSONB, pas de partial index Postgres-only).
- Auth.js v5 encore en beta : surveiller breaking changes. Pinner à `5.0.0-beta.25`.
- Auto add-to-cart via extension dépend de la stabilité du DOM des sites cibles. Prévoir un fallback "ouverture multi-onglets" universel.
