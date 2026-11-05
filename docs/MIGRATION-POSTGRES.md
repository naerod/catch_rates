# Plan de migration SQLite (sql.js) → PostgreSQL

> Statut : **préparé, non activé**. L'application utilise toujours SQLite. Rien dans ce document n'est
> déclenché par un déploiement.

## 1. Faut-il migrer ?

| | SQLite via sql.js (actuel) | PostgreSQL |
| --- | --- | --- |
| Volume | ~1 100 lignes, base de 100 ko | idem |
| Écritures | admin seulement (quelques par mois) | idem |
| Modèle | base entière **en mémoire**, réécrite sur disque à chaque écriture (`saveDb()` × 13) | écritures transactionnelles |
| Risque principal | crash pendant `writeFileSync` = fichier tronqué ; deux instances = la dernière écrase l'autre ; pas de sauvegarde à chaud | un service de plus à opérer |
| Sauvegarde | `cp` à froid | `pg_dump`, PITR possible |

**Avis** : au volume actuel, PostgreSQL n'apporte rien en performance. Le vrai gain est la **robustesse
des écritures** et les **sauvegardes**. Deux options moins chères existent :
- **Option A (recommandée à court terme, ~2 h)** : garder SQLite mais écrire de façon atomique
  (`writeFileSync` dans un fichier temporaire puis `rename`) + sauvegarde quotidienne. Ça règle le seul
  risque concret (fichier tronqué).
- **Option B (~0,5 j)** : passer de `sql.js` (en mémoire) à `better-sqlite3` (fichier, WAL, transactions).
  Requêtes quasi identiques.
- **Option C (ce plan, ~2,5 j)** : PostgreSQL. Pertinent si un PostgreSQL mutualisé existe déjà dans
  l'infra (Authentik en utilise un), ou si d'autres sites doivent partager ces données.

## 2. Chiffrage de l'option C

Estimation pour une personne connaissant le code. Le **coût d'hébergement est nul** si on réutilise une
instance PostgreSQL existante (une base + un rôle dédiés). Sinon, un conteneur `postgres:16-alpine`
demande ~50 Mo de RAM au repos.

| # | Tâche | Charge |
| --- | --- | --- |
| 1 | Couche d'accès : `pg` (node-postgres) + pool, `dbAll`/`dbGet`/`dbRun` rendus `async` | 2 h |
| 2 | Adapter les 46 appels (11 `dbAll`, 10 `dbGet`, 19 `dbRun`, 6 `db.run`) : `?` → `$1…`, `await` dans les routes | 3 h |
| 3 | SQL propre à SQLite : `last_insert_rowid()` → `RETURNING id` ; `INSERT OR IGNORE` → `ON CONFLICT DO NOTHING` ; `LIKE … ESCAPE` → `ILIKE` ; `datetime('now')` → `now()` ; `PRAGMA table_info` → `information_schema` ; booléens 0/1 → `TRUE/FALSE` | 2 h |
| 4 | Retirer `saveDb()` (13 appels) et l'export du fichier | 0,5 h |
| 5 | Migrations de schéma : remplacer les `ALTER` au démarrage par des fichiers versionnés (`migrations/NNN-*.sql` + table `schema_migrations`) | 2 h |
| 6 | Seeds (`db/seed.js`, `db/seed-recoil.js`) en PostgreSQL | 1,5 h |
| 7 | Tests : base PostgreSQL jetable pour `npm test` (même approche que `scripts/test-postgres-migration.sh`) ; les 48 tests existants servent de filet | 3 h |
| 8 | Front : aucune modification (les routes et le JSON ne changent pas, sauf booléens `true/false` au lieu de `1/0` → vérifier `ev.forecast`, `ev.unverified`, `active`) | 1 h |
| 9 | Infra : base + rôle, `DATABASE_URL` dans le `.env` (prod et preprod), sauvegarde `pg_dump` quotidienne | 1,5 h |
| 10 | Bascule preprod, recette, bascule prod, surveillance | 2 h |
| | **Total** | **~18,5 h ≈ 2,5 jours** |

Marge recommandée : +30 % (première migration de ce type sur l'infra) → **3 jours**.

## 3. Ce qui est déjà prêt dans ce repo

- `scripts/migrate-to-postgres.js` : génère un SQL **autonome et transactionnel** depuis n'importe quelle
  version de la base SQLite :
  - schéma typé (`BOOLEAN`, `DATE`, `TIMESTAMPTZ`, clés étrangères — `event_pokemon.pokemon_id` n'en avait pas —,
    contraintes `CHECK` sur slug, rôle, taux de capture) ;
  - colonnes absentes des vieilles bases → valeurs par défaut (même règle de rôle que le serveur) ;
  - lignes orphelines ou slugs invalides **écartés et signalés** ;
  - séquences recalées après import.
- `scripts/test-postgres-migration.sh` : vérification de bout en bout sur une **copie**, dans une instance
  PostgreSQL jetable (socket Unix, aucun port ouvert) : comptes ligne à ligne, requêtes de l'application,
  séquences, cascade, refus d'un second import.
- `test/migrate-postgres.test.js` : cas limites (orphelins, apostrophes, ancien schéma) dans `npm test`.

Résultat sur la base actuelle : 651 Pokémon, 8 balls, 6 événements, 111 liens, 1 compte, 297 attaques —
**100 % importés, 0 écarté**.

## 4. Procédure de bascule (quand on décidera)

1. **Preprod** : `pg_dump` vide de contrôle, puis
   `cp db/catchrates.db /tmp/copie.db && node scripts/migrate-to-postgres.js /tmp/copie.db > catchr.sql`
   et `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f catchr.sql`.
2. Déployer la version de l'application qui lit `DATABASE_URL` (tâches 1 à 8), recette.
3. **Prod** : geler l'admin (aucun ajout d'événement pendant ~5 min), sauvegarder la base SQLite,
   réimporter depuis la base **du moment** (pas une ancienne copie), déployer, vérifier `/api/events`.
4. **Retour arrière** : la base SQLite n'est pas modifiée par la migration ; redéployer la version
   précédente suffit. Les événements saisis entre-temps dans PostgreSQL seraient à ressaisir (voire
   à réexporter, le volume est minime).

## 5. Points ouverts

- Existe-t-il déjà un PostgreSQL mutualisé (celui d'Authentik ?) et peut-on y créer une base dédiée ?
- La preprod doit-elle avoir sa propre base (recommandé) ?
- Si l'option A suffit, ce plan peut rester en réserve.
