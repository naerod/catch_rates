#!/usr/bin/env bash
# Mise a jour d'une instance CatchR (prod ou preprod) sans perdre la base.
#
# db/catchrates.db n'est plus versionne : le premier pull qui contient ce changement
# SUPPRIME le fichier du dossier de travail. Ce script le sauvegarde avant, puis le remet.
#
# Usage : scripts/deploy.sh [branche]      (defaut : branche courante)
# Le redemarrage (docker compose restart, systemctl...) reste a faire ensuite.
set -euo pipefail

cd "$(dirname "$0")/.."
DB="${CATCHR_DB_PATH:-db/catchrates.db}"
BACKUP_DIR="${CATCHR_BACKUP_DIR:-backups}"
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"

mkdir -p "$BACKUP_DIR"
BACKUP=""
if [ -f "$DB" ]; then
  BACKUP="$BACKUP_DIR/catchrates-$(date +%Y%m%d-%H%M%S).db"
  cp -p "$DB" "$BACKUP"
  echo "Sauvegarde : $BACKUP"
else
  echo "Aucune base a $DB : rien a sauvegarder." >&2
fi

# Tant que la base est suivie par git et modifiee localement, git refuse le pull :
# on la remet a l'etat de HEAD, la sauvegarde ci-dessus faisant foi.
if git ls-files --error-unmatch "$DB" >/dev/null 2>&1; then
  git checkout -- "$DB"
fi

if ! git pull --ff-only origin "$BRANCH"; then
  [ -n "$BACKUP" ] && cp -p "$BACKUP" "$DB" && echo "Pull en echec : base remise depuis $BACKUP" >&2
  exit 1
fi

# Toujours remettre la base de CE lancement (le pull a pu la supprimer ou la remettre a l'etat de HEAD)
if [ -n "$BACKUP" ]; then
  cp -p "$BACKUP" "$DB"
  echo "Base restauree depuis $BACKUP"
fi

npm ci --omit=dev
echo "OK. Redemarrer le service maintenant."
