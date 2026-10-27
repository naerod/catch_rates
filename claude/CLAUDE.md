# catchr — règles techniques & stack

## Identité
- **Type** : Application web de calcul de taux de capture (PokeMMO)
- **Repo** : `~/workspace/catchr/`
- **Hébergement** : CT110 (à confirmer — voir NOTES.md)
- **Auth** : Authentik OIDC (`auth.naerod.com/application/o/catchr`)
- **Log** : `/var/log/claude_catchr.log`

## Stack
- **Runtime** : Node.js, Express.js
- **Base de données** : SQLite via `sql.js` (chargé en mémoire, sauvegardé sur disque)
- **Frontend** : Vanilla HTML/CSS/JS, servi comme fichiers statiques
- **Auth** : Session Express + OIDC Authentik (redirect → callback → session)
- **Données Pokémon** : `pokemon_data.json` (source de vérité des catch rates)

## Fichiers principaux
```
catchr/
├── server.js           ← Express app (routes, auth OIDC, session, DB)
├── db/
│   ├── catchrates.db   ← SQLite (sql.js)
│   └── images/         ← images Pokéball
├── pokemon_data.json   ← données Pokémon (catch rates, stats)
├── public/             ← frontend statique
└── scripts/            ← scripts utilitaires (seed, etc.)
```

## Auth OIDC Authentik
- Issuer : `https://auth.naerod.com/application/o/catchr`
- Redirect URI : `https://catchr.naerod.com/auth/callback`
- Variables : `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`
- Groupes : `catchr-users` · `catchr-event-managers` · `catchr-admins`
- Sessions Express (secret `SESSION_SECRET` dans `.env`)

## Fonctionnalités
- Recommandation Pokéball (la plus rapide ET la moins chère, calculées séparément)
- Modificateurs HP / statut / niveau
- Détection Quick Ball (1er tour)
- Événements PokeMMO (Pokémon en essaim)
- Multi-langues : EN, FR, JP, PT, ES, KO, ZH, DE, IT, ID
- Thème dark/light

## Conventions
- Lancer avec `npm start` (port 3000 par défaut, configurable via `PORT`)
- Seed : `npm run seed` (peuple la DB depuis `pokemon_data.json`)
- Secrets dans `.env` : `SESSION_SECRET`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`
