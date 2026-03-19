# PROJECT CONTEXT — naerod's Catch Calculator (PokeMMO)
> Dernière mise à jour : 2026-03-19
> Ce fichier est destiné à être lu par une IA pour comprendre le projet dans son intégralité.

---

## 1. CONCEPT GÉNÉRAL

**naerod's Catch Calculator** est un outil web communautaire pour le MMORPG **PokeMMO**.
Son but : aider les joueurs à capturer des Pokémon de la manière la plus efficace possible.

PokeMMO utilise la **formule de capture Gen 3-5** des jeux Pokémon officiels. Ce calculateur implémente cette formule et fournit automatiquement :
- La **stratégie la plus rapide** (meilleur taux de capture)
- La **stratégie la plus économique** (coût en Pokéyen le plus bas)

Le projet couvre **650 Pokémon** (Gen 1 à 5 + 2 Gen 6) et **8 types de Pokéballs** avec leurs multiplicateurs et conditions spécifiques à PokeMMO.

### Formule de capture utilisée
```
a = ((3 × MaxHP - 2 × CurrentHP) / (3 × MaxHP)) × CatchRate × BallMultiplier × StatusMultiplier
b = 65535 / (255/a)^0.25
p = (b / 65535)^4
```
MaxHP est fixé à 100. Si p > 1.0, la capture est garantie.

---

## 2. STACK TECHNIQUE

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Backend | **Node.js** + **Express** | Express 4.18.x |
| Base de données | **SQLite** via **sql.js** (in-memory, fichier .db) | sql.js 1.12.x |
| Frontend | **HTML/CSS/JS vanilla** (SPA sans framework) | — |
| Sessions | **express-session** (cookie 24h) | 1.18.x |
| Auth admin | **SHA-256** hash (crypto natif Node.js) | — |
| Sprites Pokémon | **PokeAPI** (CDN GitHub) | — |
| Fonts | **Google Fonts** (Rajdhani + Exo 2) | — |
| Déploiement recommandé | **PM2** sur VPS | — |

Pas de bundler, pas de transpiler, pas de framework frontend. Tout est servi en statique par Express.

---

## 3. ARCHITECTURE DU PROJET

```
catch_rates/
├── .claude/                    # Configuration Claude Code
│   ├── fichiers/               # (dossier vide, réservé)
│   ├── prompts/                # Historique des prompts utilisés pendant le développement
│   │   ├── prompt              # Premier prompt (corrections de bugs, refonte UI)
│   │   ├── prompt_2            # (prompt suivant)
│   │   ├── prompt_3            # (prompt suivant)
│   │   └── prompt_4            # (prompt suivant)
│   ├── settings.local.json     # Config locale Claude Code
│   └── PROJECT_CONTEXT.md      # ← CE FICHIER (contexte projet pour IA)
│
├── .vscode/
│   └── settings.json           # Config VS Code locale
│
├── db/                         # Couche données
│   ├── seed.js                 # Script d'initialisation de la DB (tables + données)
│   │                             → Crée les tables : pokemon, pokeballs, events,
│   │                               event_pokemon, admin_users, pokemon_recoil_moves
│   │                             → Insère 650 Pokémon, 8 balls, événements par défaut,
│   │                               et les données recoil depuis le CSV
│   │                             Langage : JavaScript (Node.js)
│   │
│   ├── seed-recoil.js          # Script standalone pour re-seeder uniquement les moves recoil
│   │                             → Peut être lancé séparément via `npm run seed:recoil`
│   │                             Langage : JavaScript (Node.js)
│   │
│   ├── catchrates.db           # Base SQLite générée par seed.js (binaire, gitignored)
│   │
│   ├── pokemon_types.json      # Mapping dex_id → [type1, type2] pour les 650 Pokémon
│   │                             Format : { "1": ["grass", "poison"], "4": ["fire", null], ... }
│   │                             Langage : JSON
│   │
│   ├── pokemon_recoil_moves_gen_1_to_5_and_6.csv
│   │                           # CSV des moves recoil/suicide par Pokémon
│   │                             Colonnes : pokemon_name, dex_number, move_name, level, recoil_type
│   │                             Langage : CSV
│   │
│   └── images/                 # Sprites des Pokéballs (PNG)
│       ├── Bag_Beast_Ball_SV_Sprite.png
│       ├── Bag_Dive_Ball_SV_Sprite.png
│       ├── Bag_Great_Ball_SV_Sprite.png
│       ├── Bag_Heal_Ball_SV_Sprite.png
│       ├── Bag_Safari_Ball_SV_Sprite.png
│       ├── Bag_Sport_Ball_ZA_Sprite.png
│       ├── Bag_Strange_Ball_SV_Sprite.png
│       ├── Dream_Cherish_Ball_Sprite.png
│       ├── Dream_Dream_Ball_Sprite.png
│       ├── Dream_Dusk_Ball_Sprite.png
│       ├── Dream_Fast_Ball_Sprite.png
│       ├── Dream_Friend_Ball_Sprite.png
│       ├── Dream_Heavy_Ball_Sprite.png
│       ├── Dream_Level_Ball_Sprite.png
│       ├── Dream_Love_Ball_Sprite.png
│       ├── Dream_Lure_Ball_Sprite.png
│       ├── Dream_Luxury_Ball_Sprite.png
│       ├── Dream_Master_Ball_Sprite.png
│       ├── Dream_Moon_Ball_Sprite.png
│       ├── Dream_Nest_Ball_Sprite.png
│       ├── Dream_Net_Ball_Sprite.png
│       ├── Dream_Park_Ball_Sprite.png
│       ├── Dream_Poké_Ball_Sprite.png
│       ├── Dream_Premier_Ball_Sprite.png
│       ├── Dream_Quick_Ball_Sprite.png
│       ├── Dream_Repeat_Ball_Sprite.png
│       ├── Dream_Timer_Ball_Sprite.png
│       └── Dream_Ultra_Ball_Sprite.png
│         (seules 8 sont utilisées par le site, les autres sont stockées pour usage futur)
│
├── public/                     # Frontend (servi en statique par Express)
│   ├── index.html              # Point d'entrée SPA — structure HTML complète
│   │                             → 4 pages : Calculator, Events, Shiny Helper, Admin
│   │                             → Navigation par onglets (SPA sans router)
│   │                             Langage : HTML5
│   │
│   ├── css/
│   │   └── style.css           # Thème gaming Dark/Light complet
│   │                             → Variables CSS custom (--bg, --accent, --text, etc.)
│   │                             → Responsive (breakpoints 680px et 420px)
│   │                             → Fonts : Rajdhani (headings) + Exo 2 (body)
│   │                             Langage : CSS3
│   │
│   ├── js/
│   │   ├── i18n.js             # Système de traduction multilingue
│   │   │                         → 10 langues : EN, FR, JA, PT, ES, KO, ZH, DE, IT, ID
│   │   │                         → Objet `i18n` global avec méthodes t(), setLang(), applyAll()
│   │   │                         → Traduit tous les éléments via data-i18n et data-i18n-placeholder
│   │   │                         → Noms des Pokéballs traduits via ballName()
│   │   │                         Langage : JavaScript (vanilla, côté client)
│   │   │
│   │   ├── calc.js             # Moteur de calcul des taux de capture
│   │   │                         → Objet `Calc` global
│   │   │                         → probability() : calcul Gen 3-5 pour un lancer
│   │   │                         → computeAll() : calcul pour toutes les balls avec un état donné
│   │   │                         → computeOptimalFastest() : meilleure technique (prob ≥ 95%)
│   │   │                         → computeOptimalCheapest() : technique la moins chère (prob ≥ 75%)
│   │   │                         → _allTechniques() : génère toutes les combinaisons
│   │   │                           ball × HP × status × conditions
│   │   │                         → Gère les types Ghost (besoin de Soak avant False Swipe)
│   │   │                         → Gère les conditions spéciales (Quick=tour1, Dusk=nuit,
│   │   │                           Timer=10 tours, Net=Bug/Water, Love=conditions)
│   │   │                         Langage : JavaScript (vanilla, côté client)
│   │   │
│   │   ├── app.js              # Logique UI principale
│   │   │                         → Objet `state` global (pokemon, balls, hp, status, night, page)
│   │   │                         → Gestion thème Dark/Light (localStorage)
│   │   │                         → Navigation SPA (4 pages)
│   │   │                         → Recherche Pokémon avec autocomplétion (debounce 180ms)
│   │   │                         → Slider HP (5 positions : 1/25/50/75/100%)
│   │   │                         → Toggles status (sleep/freeze/para/poison/burn) + night
│   │   │                         → Rendu des cartes résultat (Fastest + Economical)
│   │   │                         → Grille visuelle de toutes les balls
│   │   │                         → Bannière Quick Ball (si ≥75% au tour 1)
│   │   │                         → Page Events (chargement dynamique depuis l'API)
│   │   │                         → Page Admin complète (CRUD events, ajout Pokémon, auth)
│   │   │                         → Page Shiny Hunter (recherche + onglets spots/calculateur)
│   │   │                         → Support URL param ?pokemon=ID pour lien direct
│   │   │                         Langage : JavaScript (vanilla, côté client)
│   │   │
│   │   ├── warnings.js         # Système d'avertissements de capture
│   │   │                         → Objet `Warnings` global
│   │   │                         → Affiche 2 types d'alertes :
│   │   │                           💀 SUICIDE (Self-Destruct, Explosion, Memento, etc.)
│   │   │                           🟠 RECOIL (Take Down, Double-Edge, etc.)
│   │   │                         → Données venant de l'API /api/pokemon/:id/recoil-warnings
│   │   │                         → Indique le level minimum d'apprentissage de chaque move
│   │   │                         Langage : JavaScript (vanilla, côté client)
│   │   │
│   │   ├── shiny.js            # Assistant de chasse shiny
│   │   │                         → Objet `Shiny` global
│   │   │                         → BASE_RATE : 1/30000 (taux shiny PokeMMO)
│   │   │                         → Bonus multiplicatifs : Charm (+10%), Donator (+5%), Event (+5%)
│   │   │                         → 5 méthodes : horde5, horde3, single, fishing, egg
│   │   │                         → Base de données de spots intégrée (SPOTS{})
│   │   │                           avec ~40 Pokémon populaires, localisation, taux de rencontre
│   │   │                         → Calcul d'efficacité par spot (pokémon/encounter × rate × distance)
│   │   │                         → Calculateur de coût (temps estimé, coût total en Pokéyen)
│   │   │                         Langage : JavaScript (vanilla, côté client)
│   │   │
│   │   └── recoil-data.js      # Données recoil auto-générées depuis PokeAPI
│   │                             → Objet `RECOIL_DATA` : 310 Pokémon avec leurs moves recoil
│   │                             → Généré par scripts/fetch-recoil-data.js
│   │                             → NE PAS ÉDITER MANUELLEMENT
│   │                             Langage : JavaScript (données auto-générées)
│   │
│   └── data/
│       └── recoil-pokemon.json # Copie JSON des données recoil (référence)
│                                 Langage : JSON
│
├── scripts/
│   └── fetch-recoil-data.js    # Script de récupération des données recoil depuis PokeAPI
│                                 → Interroge PokeAPI pour 15 moves recoil/suicide
│                                 → Vérifie la disponibilité Gen 5 pour chaque Pokémon
│                                 → Génère public/js/recoil-data.js et public/data/recoil-pokemon.json
│                                 → Exécution : `node scripts/fetch-recoil-data.js`
│                                 → ~310 Pokémon concernés, ~15 moves trackés
│                                 Langage : JavaScript (Node.js)
│
├── server.js                   # Serveur Express — point d'entrée de l'application
│                                 → Charge la DB SQLite en mémoire au démarrage
│                                 → API REST :
│                                   GET  /api/pokemon/search?q=...     (recherche)
│                                   GET  /api/pokemon                   (liste complète)
│                                   GET  /api/pokemon/:id               (détail)
│                                   GET  /api/pokemon/:id/recoil-warnings (moves dangereux)
│                                   GET  /api/pokeballs                 (liste des balls)
│                                   GET  /api/events                    (liste événements)
│                                   GET  /api/events/:slug              (détail + pokémon)
│                                 → API Admin (authentifiée) :
│                                   POST /api/admin/login
│                                   POST /api/admin/logout
│                                   GET  /api/admin/check
│                                   POST /api/admin/events              (créer)
│                                   PUT  /api/admin/events/:id          (modifier)
│                                   DELETE /api/admin/events/:id        (supprimer)
│                                   POST /api/admin/events/:id/pokemon  (ajouter pokémon)
│                                   DELETE /api/admin/events/:eid/pokemon/:pid (retirer)
│                                   POST /api/admin/change-password
│                                 → Sert les fichiers statiques (public/ et db/images/)
│                                 → Fallback SPA : toute route inconnue → index.html
│                                 Langage : JavaScript (Node.js)
│
├── pokemon_data.json           # Données source des 650 Pokémon
│                                 Format : [{ id, name, catch_rate }, ...]
│                                 Langage : JSON
│
├── package.json                # Métadonnées npm
│                                 → name: "pokecalc"
│                                 → Scripts : start, seed, seed:recoil
│                                 → Dépendances : express, express-session, sql.js
│
├── package-lock.json           # Lockfile npm (versions exactes)
│
├── gitignore                   # Fichier gitignore (note : pas de point devant)
│                                 → Ignore : node_modules/, catchrates.db, .env, *.log
│
├── README.md                   # Documentation du projet
│
└── node_modules/               # Dépendances installées (gitignored)
```

---

## 4. SCHÉMA DE LA BASE DE DONNÉES (SQLite)

### Table `pokemon`
| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER PK | Numéro Pokédex national |
| name | TEXT UNIQUE | Nom anglais du Pokémon |
| catch_rate | INTEGER | Taux de capture officiel (1-255) |
| generation | INTEGER | Génération (1-6) |
| type1 | TEXT | Type primaire (ex: "fire") |
| type2 | TEXT NULL | Type secondaire (ex: "flying") |

### Table `pokeballs`
| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER PK | Auto-increment |
| key | TEXT UNIQUE | Identifiant interne (ex: "ultraball") |
| name_en | TEXT | Nom anglais |
| name_fr | TEXT | Nom français |
| multiplier | REAL | Multiplicateur de capture |
| cost | INTEGER | Prix en Pokéyen |
| condition_key | TEXT NULL | Condition spéciale (quick/night/love/bugwater/timer) |
| sort_order | INTEGER | Ordre d'affichage |

**Pokéballs incluses :**
| Ball | Multiplicateur | Prix | Condition |
|------|---------------|------|-----------|
| Quick Ball | ×5.0 | 1200¥ | Tour 1 uniquement |
| Poké Ball | ×1.0 | 200¥ | — |
| Great Ball | ×1.5 | 600¥ | — |
| Ultra Ball | ×2.0 | 1200¥ | — |
| Timer Ball | ×4.0 | 1200¥ | Après 10 tours |
| Love Ball | ×8.0 | 1200¥ | Conditions spéciales |
| Dusk Ball | ×2.5 | 1200¥ | Nuit uniquement |
| Net Ball | ×3.5 | 1200¥ | Type Bug ou Water |

### Table `events`
| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER PK | Auto-increment |
| slug | TEXT UNIQUE | Identifiant URL (ex: "xmas-2024") |
| name_en | TEXT | Nom anglais |
| name_fr | TEXT | Nom français |
| active | INTEGER | 0 ou 1 |
| created_at | TEXT | Date de création |

### Table `event_pokemon`
| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER PK | Auto-increment |
| event_id | INTEGER FK → events | Événement parent |
| pokemon_id | INTEGER | Numéro Pokédex du Pokémon |

### Table `admin_users`
| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER PK | Auto-increment |
| username | TEXT UNIQUE | Nom d'utilisateur |
| password_hash | TEXT | Hash SHA-256 du mot de passe |

### Table `pokemon_recoil_moves`
| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER PK | Auto-increment |
| dex_number | INTEGER | Numéro Pokédex |
| pokemon_name | TEXT | Nom du Pokémon |
| move_name | TEXT | Nom de l'attaque (ex: "Double-Edge") |
| level | INTEGER | Niveau d'apprentissage |
| recoil_type | TEXT | Type de recul (ex: "1/3 damage dealt") |

---

## 5. FONCTIONNALITÉS PAR PAGE

### Page 1 : Calculator (page principale)
- Recherche Pokémon avec autocomplétion en temps réel
- Affiche la carte Pokémon (sprite, nom, ID, génération, catch rate)
- **Bannière Quick Ball** : si le Pokémon est "quickable" (≥75% de capture au tour 1 avec Quick Ball)
- **2 cartes résultat automatiques** :
  - ⚡ Fastest : meilleure probabilité (explore toutes les combinaisons ball × HP × status)
  - 💰 Economical : coût moyen le plus bas
  - Chaque carte affiche : ball recommandée, % de capture, technique (chips : 1HP, Sleep, Night, etc.), estimation tours + coût
- **Avertissements** : SUICIDE (moves qui KO le Pokémon) et RECOIL (dégâts de recul)
- **Section avancée dépliable** "More parameters" :
  - Slider HP (1% / 25% / 50% / 75% / 100%)
  - Toggles : Sleep (×2), Night (×2.5), Freeze (×2), Paralysis (×1.5), Poison (×1.5), Burn (×1.5)
  - Grille visuelle de toutes les balls avec leur catch rate dans les conditions choisies

### Page 2 : Events
- Liste des événements PokeMMO (XMAS 2024, LNY 2025, etc.)
- Chaque événement affiche ses Pokémon de swarm avec sprite, nom et catch rate
- Clic sur un Pokémon → redirige vers le Calculator avec ce Pokémon sélectionné

### Page 3 : Shiny Hunter Helper
- Recherche de Pokémon
- **Onglet "Best Spots"** : tableau des meilleurs spots de chasse shiny par Pokémon
  (méthode, localisation, région, taux de rencontre, score d'efficacité)
- **Onglet "Cost Calculator"** : estimation du temps et coût pour trouver un shiny
  - Méthode : Horde ×5, Horde ×3, Solo, Pêche, Œuf
  - Bonus : Shiny Charm (+10%), Donator (+5%), Event (+5%)
  - Paramètres : temps par encounter, prix de la ball
  - Résultat : taux effectif, encounters moyens, temps estimé, coût total

### Page 4 : Admin
- Connexion par username/password (session cookie)
- Dashboard admin :
  - Créer/modifier/supprimer des événements
  - Ajouter/retirer des Pokémon dans chaque événement
  - Changer le mot de passe admin
- Identifiants par défaut : `naerod` / `admin123`

---

## 6. INTERNATIONALISATION

Le système i18n supporte **10 langues** : EN (défaut), FR, JA, PT, ES, KO, ZH, DE, IT, ID.
Les traductions couvrent l'intégralité de l'interface (navigation, labels, messages d'erreur, noms des balls, warnings, etc.).
Le changement de langue est instantané via un `<select>` dans le header, avec persistance en localStorage.

---

## 7. THÈMES

Deux thèmes disponibles : **Dark** (défaut, gaming neon blue) et **Light**.
Basculement via un bouton dans le header, persisté en localStorage.
Implémenté avec des variables CSS custom sur `[data-theme="dark"]` / `[data-theme="light"]`.

---

## 8. COMMANDES UTILES

```bash
npm install              # Installer les dépendances
npm run seed             # Initialiser la base de données (tables + données + recoil)
npm run seed:recoil      # Re-seeder uniquement les données recoil
npm start                # Lancer le serveur (http://localhost:3000)
node scripts/fetch-recoil-data.js  # Récupérer les données recoil depuis PokeAPI
```

---

## 9. POINTS D'ATTENTION POUR LES MODIFICATIONS

- **Pas de framework frontend** : tout est en vanilla JS. Les modifications UI se font directement dans app.js / index.html / style.css.
- **SPA sans router** : la navigation est gérée par `showPage()` dans app.js, pas de hash ou pushState.
- **Base de données en mémoire** : sql.js charge le fichier .db en RAM. Les modifications admin appellent `saveDb()` pour écrire sur disque.
- **Sprites Pokémon** : chargés depuis le CDN PokeAPI GitHub (`raw.githubusercontent.com/PokeAPI/sprites/`).
- **Sprites Pokéballs** : servis localement depuis `db/images/` via la route Express `/ball-images/`.
- **Le fichier `gitignore` n'a pas de point** devant (devrait être `.gitignore`).
- **Le calcul optimal** (`computeOptimalFastest` / `computeOptimalCheapest`) explore TOUTES les combinaisons possibles (5 HP × 6 status × 8 balls × conditions) et est indépendant des sliders UI.
- **Les données recoil** proviennent de deux sources : le CSV dans db/ (pour la DB côté serveur) et le fichier recoil-data.js auto-généré (pour le client, actuellement non utilisé directement par warnings.js qui préfère l'API).
