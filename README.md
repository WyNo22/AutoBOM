# AUTBOM

Outil web + extension navigateur pour centraliser la création, validation et achat de BOM (Bill of Materials) multi-fournisseurs.

> **Statut** : Sprint 0 — fondations posées (monorepo, schéma DB, auth, UI squelette).

## Stack

- **Frontend** : Next.js 15 (App Router) + TailwindCSS
- **DB** : Drizzle ORM + libSQL (fichier SQLite local en dev → Turso cloud en prod)
- **Auth** : Auth.js v5 magic link (lien loggué en console en dev)
- **Storage** : FS local en dev → S3-compatible en prod
- **Tableau BOM** (Sprint 1) : TanStack Table + Virtual
- **Extension** (Sprint 3) : Chrome MV3 + Vite

## Quickstart

Prérequis : **Node ≥ 20** et **pnpm ≥ 9** (`npm i -g pnpm`).

```bash
pnpm install

# Copier l'env
cp .env.example apps/web/.env.local

# Générer + appliquer la migration SQLite initiale
pnpm db:generate
pnpm db:migrate

# Lancer
pnpm dev
```

Ouvrir <http://localhost:3000>. Pour te connecter : entre ton email, **le lien magique s'affiche dans la console du serveur** (driver `console`).

## Structure

```
apps/web         — Next.js app (cœur AUTBOM)
apps/extension   — Chrome extension MV3 (Sprint 3)
packages/shared  — types TypeScript partagés
docs/            — specs, ADR, retex, research
```

## Roadmap

Voir `docs/specs/mvp-scope.md`. Sprints :

0. **Fondations** ✅ — monorepo, schéma, auth, UI squelette
1. **Cœur BOM** — tableau éditable, attachments, suppliers, import/export Excel
2. **Multi-fournisseurs & paniers** — vue par supplier, CartBatch, ouverture multi-onglets
3. **Extension navigateur** — auto add-to-cart Tolery + Amazon, fallback sur les autres
4. **Workflow validation** — submit → mail valideur → trigger achat
5. **Historique & polish**

## Confidentialité

Aucune donnée projet réelle ne doit être commitée. Données factices uniquement dans `apps/web/seed/`.
