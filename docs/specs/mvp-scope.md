# MVP Scope

Référence rapide du périmètre fonctionnel pour aligner décisions de design.

## Problèmes ciblés (depuis brief utilisateur)

1. Saisie BOM chronophage / Excel partagé pénible
2. Validation trop lente (attendre la dispo des gens) → workflow façon Agicap
3. Sourcing composant + matching avec la CAO
4. Lier fichiers/liens à une ligne BOM + accès aux versions précédentes
5. Histoire TVA / HT / TTC à clarifier ligne par ligne
6. Upload manuel sur sites types Tolery (cible API/scripts dédiés)
7. Centralisation devis fournisseurs fab classique
8. Multiplicité petits achats sur sites différents
9. Optimisation commandes (ex : éviter livraison pour 1 vis)
10. Mode standby + groupage hebdo
11. Suivi chemin critique des livraisons (live)

## Rôles

| Rôle | Action principale | Outil cible |
|---|---|---|
| Concepteur | Crée et édite la BOM | Tableau type Excel dans AUTBOM |
| Valideur | Approuve / rejette | Lien magic depuis email, page valideur |
| Acheteur petits achats (≤ 250 €) | Carte directe sur site | Extension AUTBOM auto add-to-cart |
| Acheteur gros achats (> 250 €) | Demande d'achat Notion | Handoff manuel (hors MVP) |

## Sprints

| # | Nom | Livrable | Statut |
|---|---|---|---|
| 0 | Fondations | Monorepo, schéma DB, auth magic link, UI squelette | en cours |
| 1 | Cœur BOM | Tableau éditable Excel-like, attachments, suppliers, import/export | à faire |
| 2 | Multi-fournisseurs & paniers | Vue par supplier, CartBatch, totaux, ouverture multi-onglets | à faire |
| 3 | Extension navigateur | Auto add-to-cart Tolery + Amazon, fallback onglets pour les autres | à faire |
| 4 | Workflow validation | Submit → mail valideur → approve/reject → trigger achat | à faire |
| 5 | Historique & polish | BomVersion snapshots, diff, raccourcis Cmd+K, tests E2E | à faire |

## Hors scope MVP (V1.x)

- Mode standby + groupage hebdo
- Optimisation frais de port automatique
- Matching CAO SolidWorks (lecture SLDASM)
- Demande d'achat Notion > 250 €
- Multi-tenant cloud + RBAC fin
