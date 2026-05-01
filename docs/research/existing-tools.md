# Sourcing : outils BOM existants

Benchmark rapide pour comprendre où AUTBOM se positionne. Aucun de ces outils ne couvre simultanément (a) édition BOM ultra-rapide, (b) auto add-to-cart multi-fournisseurs grand public (Amazon, Leroy Merlin, Brico-Vis), (c) workflow validation léger façon Agicap.

## OpenBOM
- SaaS PLM/BOM orienté équipes manufacturing.
- Forces : multi-niveaux d'assemblages, intégrations CAO (SolidWorks, Onshape, Inventor), API.
- Limites : assez "enterprise", UX lourde, pas d'auto-cart sur sites grand public.
- Inspiration UX : éditeur tableur multi-onglets, gestion révisions.

## Bomist (bomist.com)
- Outil BOM orienté électronique (DigiKey/Mouser/LCSC), gestion stock.
- Forces : sourcing automatique des prix électronique, comparaison fournisseurs.
- Limites : pas de mécanique / sur-mesure (Tolery).
- Inspiration : pattern "résoudre une ligne BOM via une API fournisseur".

## AllSpice (allspice.io)
- Versioning Git pour BOMs/PCB.
- Forces : diff entre versions, review workflow.
- Inspiration UX : diff visuel des BomVersion (à reprendre Sprint 5).

## Cofactr / Octopart
- APIs de sourcing composants électroniques (prix temps réel, dispo).
- Pas directement utiles pour méca/Tolery, mais à garder en tête si on étend en élec.

## PartsBox
- BOM électronique + inventaire personnel.
- UX très propre pour la saisie.
- Inspiration : recherche fuzzy multi-fournisseur, raccourcis clavier.

## BOMcheck
- Compliance (REACH, RoHS) — hors scope MVP.

## Différentiateurs AUTBOM (cibles)

1. Tableau BOM "feel Excel" (copier/coller, édition clavier hyper rapide)
2. Workflow validation lightweight via mail (à la Agicap)
3. **Auto add-to-cart via extension** sur sites grand public (Amazon, Leroy Merlin, Brico-Vis, 123Roulements, Norelem) + Tolery/Xometry pour le sur-mesure
4. Centralisation paniers groupés par fournisseur, optimisation frais de port (V1.x)
5. Pas de logique PLM/CAO complexe — focus achat
