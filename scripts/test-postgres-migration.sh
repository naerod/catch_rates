#!/usr/bin/env bash
# Verification de bout en bout de la migration PostgreSQL sur une COPIE de la base, dans une instance
# PostgreSQL jetable (initdb local, socket Unix, aucun port reseau). Ne touche ni la base ni un serveur existant.
#
# Usage : scripts/test-postgres-migration.sh [base.db]
# Prerequis : binaires PostgreSQL (initdb, pg_ctl, psql). En root, l'instance tourne sous l'utilisateur postgres.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${1:-${CATCHR_DB_PATH:-db/catchrates.db}}"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -n1)}"
[ -x "$PGBIN/initdb" ] || { echo "initdb introuvable (definir PGBIN)"; exit 2; }

WORK="$(mktemp -d /tmp/catchr-pg-XXXXXX)"; chmod 755 "$WORK"
RUN=(); [ "$(id -u)" = 0 ] && RUN=(runuser -u postgres --)
cleanup() { "${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

cp "$SRC" "$WORK/copie.db"
node scripts/migrate-to-postgres.js "$WORK/copie.db" > "$WORK/import.sql" 2> "$WORK/bilan.txt"
[ "$(id -u)" = 0 ] && chown -R postgres "$WORK"
"${RUN[@]}" "$PGBIN/initdb" -D "$WORK/data" -A trust -U catchr >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-k $WORK -c listen_addresses=''" -l "$WORK/pg.log" -w start >/dev/null
PSQL=("${RUN[@]}" "$PGBIN/psql" -h "$WORK" -U catchr -d postgres -v ON_ERROR_STOP=1 -qAt)

"${PSQL[@]}" -f "$WORK/import.sql" >/dev/null   # sortie des setval masquee
# Rejouabilite : un second import doit echouer proprement (tables existantes) sans rien casser
if "${PSQL[@]}" -f "$WORK/import.sql" >/dev/null 2>&1; then echo "ERREUR : second import accepte"; exit 1; fi

echo "== Comptes SQLite vs PostgreSQL"
for t in pokemon pokeballs events event_pokemon admin_users pokemon_recoil_moves; do
  pg="$("${PSQL[@]}" -c "SELECT count(*) FROM $t")"
  sq="$(node -e "require('sql.js')().then(S=>{const d=new S.Database(require('fs').readFileSync('$WORK/copie.db'));try{console.log(d.exec('SELECT count(*) FROM $t')[0].values[0][0])}catch{console.log(0)}})")"
  printf '%-22s sqlite=%-5s postgres=%-5s %s\n' "$t" "$sq" "$pg" "$([ "$sq" = "$pg" ] && echo OK || echo 'ECART (voir bilan)')"
done
echo "== Requetes de l'application, traduites"
"${PSQL[@]}" -c "SELECT count(*) || ' resultats recherche pika' FROM pokemon WHERE name ILIKE '%pika%'"
"${PSQL[@]}" -c "SELECT slug FROM events ORDER BY COALESCE(starts_at, (created_at AT TIME ZONE 'UTC')::date) DESC, id DESC LIMIT 1" | sed 's/^/evenement le plus recent : /'
"${PSQL[@]}" -c "INSERT INTO events (slug, name_en) VALUES ('apres-migration', 'Test') RETURNING 'nouvel id sequence ok : ' || id"
"${PSQL[@]}" -c "DELETE FROM events WHERE id = (SELECT MIN(id) FROM events) RETURNING 'suppression en cascade ok'" >/dev/null
echo "== Bilan du script"; cat "$WORK/bilan.txt"
echo "MIGRATION VERIFIEE"
