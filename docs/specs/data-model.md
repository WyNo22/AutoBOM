# Modèle de données

Source de vérité : `apps/web/src/lib/db/schema.ts` (Drizzle SQLite). Ce document décrit l'intention de chaque entité.

## Diagramme

```
User ──< ProjectMember >── Project ──< BOM ──< BomLine ──< Attachment
                                       │           │
                                       │           └─> Supplier
                                       │
                                       ├─< BomVersion (snapshot JSON)
                                       ├─< Validation
                                       └─< CartBatch >── Supplier
                                                │
                                                └─< CartBatchLine ──> BomLine
```

## Entités principales

### `User`
Géré par Auth.js. Champs canon : `id`, `email`, `name`, `image`, `emailVerified`.

### `Project`
- `name` (obligatoire), `description` (optionnel)
- `ownerId` → User créateur (auto-membre admin)
- 1 projet contient N BOMs

### `ProjectMember` (join)
- (`projectId`, `userId`) → `role` parmi `designer | validator | buyer_small | buyer_big | admin`
- Permet de partager un projet avec d'autres utilisateurs et de leur donner un rôle.

### `Supplier`
Référentiel fournisseurs. Champs : `name`, `website`, `defaultShippingHT`, `knownSite` (id ∈ KNOWN_SUPPLIER_SITES pour mapper vers le bon content script de l'extension), `notes`.

### `BOM`
- Rattaché à un `Project`
- `status` : `draft → submitted → approved | rejected → ordered → delivered`
- `currentVersion` (entier) incrémenté à chaque submit (snapshot dans `BomVersion`)

### `BomLine`
La ligne de la BOM, équivalent d'une ligne Excel.
- Champs métier : `position`, `designation`, `qty`, `material`, `supplierRef`, `productUrl`, `unitPriceHT`, `tva`, `leadTimeDays`, `notes`
- `status` ligne : `to_source | to_validate | validated | ordered | received | cancelled`
- `supplierId` → Supplier (optionnel, peut être null tant qu'on n'a pas sourcé)

### `BomVersion`
Snapshot complet de la BOM au moment du submit (champ `snapshot` = JSON sérialisé de BomLine[]). Permet la consultation des anciennes versions.

### `Attachment`
Fichier ou lien attaché à une `BomLine` :
- `type` : `dxf | step | stp | stl | 3mf | pdf | image | url | other`
- `url` : soit clé de storage (driver fs/s3), soit URL externe
- `sizeBytes` (si fichier)

### `Validation`
Demande de validation d'une BOM par un valideur. Décision : `pending | approved | rejected`. Multi-validations possibles si on étend.

### `CartBatch` + `CartBatchLine`
Regroupement par fournisseur d'un sous-ensemble de BomLines à commander.
- `status` : `draft | ready | opened | filled | ordered | cancelled`
- `totalHT`, `totalTTC` (calculés à la création/maj)
- L'extension consomme un CartBatch `ready` et le met dans le panier du site cible.

## Conventions

- IDs = UUID v4 (text), générés côté Drizzle via `$defaultFn(crypto.randomUUID)`.
- Timestamps = entier ms (`unixepoch() * 1000`), pour rester portable SQLite/Postgres.
- TVA stockée en décimale (ex `0.20` pour 20 %).
- Cascade : suppression d'un projet → BOMs → BomLines → Attachments. Suppression de Supplier → null sur BomLine.supplierId (pas de perte de ligne).
