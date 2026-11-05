# Déploiement de CatchR

## Pourquoi cette procédure

Jusqu'à la version 3.17.37, `db/catchrates.db` était **versionné** dans ce repo public alors que le serveur
le réécrit à chaque démarrage et à chaque modification via l'admin. Conséquences : base de prod divergente
de git, `git pull` qui refuse de s'exécuter (« local changes would be overwritten »), et hash du compte admin
publié.

La base n'est plus suivie. **Le premier `git pull` qui contient ce changement supprime le fichier du dossier
de travail** : il faut donc le sauvegarder avant. `scripts/deploy.sh` le fait automatiquement.

## Mise à jour d'une instance (prod ou preprod)

```bash
cd /chemin/vers/catchr          # dossier de l'instance
scripts/deploy.sh main          # sauvegarde -> pull -> restaure la base -> npm ci
# puis redémarrer le service (docker compose restart catchr, etc.)
```

Le script :
1. copie la base dans `backups/catchrates-AAAAMMJJ-HHMMSS.db` (dossier ignoré par git) ;
2. remet le fichier suivi à l'état de git (sinon le pull est refusé) ;
3. fait `git pull --ff-only` ; en cas d'échec, remet la base et s'arrête ;
4. **remet systématiquement la sauvegarde de ce lancement** à sa place ;
5. lance `npm ci --omit=dev` (`node_modules/` n'est plus versionné non plus).

Le script n'existant pas encore sur `main` avant la fusion, pour **ce premier déploiement** :

```bash
cp db/catchrates.db ~/catchrates-avant-maj.db
git pull
cp ~/catchrates-avant-maj.db db/catchrates.db
npm ci --omit=dev
# redémarrer
```

Si le conteneur monte un volume pour `db/`, vérifier qu'il pointe bien vers la base de prod et non vers le
dossier du repo (non vérifié depuis ce repo : la config docker-compose n'y est pas).

## Nouvelle instance

```bash
git clone https://github.com/naerod/catch_rates.git && cd catch_rates
npm ci --omit=dev
ADMIN_PASSWORD='…' npm run seed      # crée db/catchrates.db (refuse d'écraser une base existante)
npm start
```

`npm run seed` **recrée la base de zéro** : il refuse désormais d'écraser une base existante, sauf
`npm run seed -- --force` (après sauvegarde).

## Sauvegardes

La base vit dans un seul fichier : une copie à froid (`cp`) suffit. Recommandé : copie quotidienne de
`db/catchrates.db` hors du serveur, et rotation des fichiers de `backups/`.

## Variables

Voir le README (`SESSION_SECRET`, `OIDC_*`, `ALLOW_LOCAL_ADMIN`, `ADMIN_PASSWORD`, `CATCHR_DB_PATH`).
