# Myninja Simulateur

Simulateur de combat pour le jeu Myninja : deux formations de 5 ninjas (grille 1-3-3 : avant-garde, attaquants, supports),
combat au tour par tour selon la vitesse, journal détaillé et taux de victoire sur des milliers de combats.

## Fichiers

| Fichier | Rôle |
|---|---|
| `formulas.js` | Formules de dégâts, critique, DoT, pénétration, soin et vitesse, reprises du fichier Excel « Damage formula » |
| `engine.js` | Moteur de combat : ordre par vitesse, ciblage, fury, buffs/debuffs, punch (aide), tour bonus, limite de 20 rounds |
| `statuses.js` | Catalogue des états du jeu (Pyroblast, Bond, Corrosion, Weakened, CC…) |
| `data.js` | Base de données : regroupe les ninjas et les équipements |
| `ninjas/` | Fiches des ninjas par poste, depuis le wiki du jeu : `vanguards.js` (29), `assaulters.js` (60), `supporters.js` (60) ; `helpers.js` (raccourcis), `sheet-auras.js` (import du classeur « Formation ninja », plus utilisé par les fiches) |
| `tools/import_sheet.py` | Régénère `ninjas/sheet-auras.js` depuis le classeur : `python3 tools/import_sheet.py <classeur.xlsx>` |
| `equipment.js`, `equipment-extra.js` | Sets d'équipement (bonus à 2/4/6 pièces) et d'accessoires (paires + bonus à 8 pièces) |
| `describe.js` | Retraduit une fiche en français pour vérifier la transcription |
| `index.html`, `app.js` | Interface web |
| `ocr.js`, `vendor/tesseract/` | « Lire une capture des stats » : lecture de l'écran des stats du ninja (tesseract.js, hébergé avec le site) |

## Lancer en local

```sh
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/index.html
```

## Tests

- `node tests/smoke.mjs` : combat d'exemple + 1 000 simulations.
- `node tests/vanguards.mjs` : chaque avant-garde contre chaque autre, pour détecter les erreurs de données.
- `node tests/roster.mjs` : chaque ninja dans des formations aléatoires.
- `node tests/nature.mjs` : règles de nature de chakra et Chaos.
- `node tests/void.mjs` : statut Vide (Hyakki Sasori).
- `node tests/ocr-parse.mjs` : analyse du texte lu sur une capture des stats.
- `node tests/weaken.mjs` : « Weaken enemy's DEF » contre « Weaken enemy's ATK ».
- `node tests/excel-compare.mjs <Damage_formula_En.xlsx> <dossier_temporaire>` : compare `formulas.js` à l'Excel
  recalculé par LibreOffice (nécessite `soffice`, Python et `openpyxl`).

## Règles connues

- Dégâts = (ATK − DEF) × Skill% × (Dégâts − Absorption)% × multiplicateur de fury × (1 + dégâts finaux%) ; chaque terme négatif donne 0.
- Supports : attaque magique contre défense magique ; attaquants et avant-garde : physique contre physique ; personnage principal : au choix.
- Chances opposées : Précision − Esquive, Critique − Contre, Bloquage − Attaque S. Critique et blocage ne se cumulent pas.
- Attaque normale : toute la première ligne ennemie, +50 fury. Spéciale à 100 fury : −100, +33 à toute la formation.
- Durées comptées en tours du porteur. Après 20 rounds, la formation avec le plus de PV restants gagne.

Les hypothèses encore incertaines sont réglables dans la page (section « Règles à confirmer »).
