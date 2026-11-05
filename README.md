# CatchR — PokeMMO

A catch rate calculator for PokeMMO, replacing the old Google Sheets workflow.

## Quick Start

```bash
npm install
npm run seed
npm start
```

Available at `http://localhost:3000`

## Features

- Pokéball recommendation (fastest & cheapest)
- HP / status / level modifiers
- Quick Ball detection
- PokeMMO events (swarm Pokémon)
- Multi-language support (EN, FR, JP, PT, ES, KO, ZH, DE, IT, ID)
- Dark/light theme

## Tests

```bash
npm test
```

Tests `node:test` (sans dépendance) : API, sécurité (redirections, sessions, validation), moteur de capture. Ils travaillent sur une copie temporaire de `db/catchrates.db`.

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `SESSION_SECRET` | Secret des cookies de session (obligatoire en prod) |
| `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`, `OIDC_ISSUER` | SSO Authentik |
| `ALLOW_LOCAL_ADMIN=1` | Réactive la connexion admin locale (désactivée par défaut, le SSO suffit) |
| `ADMIN_PASSWORD` | Mot de passe du compte local créé par `npm run seed` (sinon aléatoire, affiché une fois) |
| `CATCHR_DB_PATH` | Chemin de la base (défaut `db/catchrates.db`) |

Après un `git pull`, lancer `npm ci` : `node_modules/` n'est plus versionné.
