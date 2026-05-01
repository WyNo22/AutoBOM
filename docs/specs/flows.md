# Flows clés

## 1. Création / édition d'une BOM (Sprint 1)

```
Concepteur ─> /projects/[id]
            ─> "Nouvelle BOM"
            ─> Tableau Excel-like (TanStack Table)
                 ├─ saisie clavier ligne à ligne
                 ├─ copier/coller depuis Excel (Ctrl+V) → parse rows
                 ├─ attacher fichier (drag & drop sur la cellule)
                 └─ assigner supplier dans dropdown auto-complété
            ─> Auto-save (debounce 500 ms) ou bouton "Enregistrer"
```

## 2. Soumission pour validation (Sprint 4)

```
Concepteur ─> "Soumettre la BOM"
              ├─ snapshot enregistré dans BomVersion (currentVersion++)
              ├─ status BOM: draft → submitted
              ├─ Validation créée (decision = pending)
              └─ email envoyé au valideur (Resend)
                  contenu: lien magic vers /validations/[id]
                            (token court, signe la décision)

Valideur ─> click email
          ─> /validations/[id]
            ─> voit la BOM (version snapshotée), commente
            ─> [Approuver] / [Rejeter]
              ├─ Validation.decision = approved/rejected
              ├─ BOM.status = approved/rejected
              └─ si approved et total ≤ 250 € :
                  → notif acheteur petits achats + CartBatches générés "ready"
                 sinon :
                  → écran "Rediriger vers Notion" (handoff manuel V1.x)
```

## 3. Mise au panier multi-fournisseurs (Sprint 2 + 3)

```
Acheteur ─> /carts
          ─> sélectionne un CartBatch "ready"
          ─> [Ouvrir le panier]
              ├─ si extension AUTBOM installée + site supporté (Tolery, Amazon)
              │    └─ extension reçoit la liste, navigue, click ajouter au panier
              └─ sinon
                   └─ ouverture multi-onglets (1 par produit) — fallback universel

          ─> Acheteur valide le panier sur le site (carte directe ≤ 250 €)
          ─> retour AUTBOM : marque CartBatch "ordered", BomLines.status="ordered"
```

## 4. Suivi des commandes (Sprint 5+)

(à concevoir : ingestion mails de confirmation / API de suivi par fournisseur)
