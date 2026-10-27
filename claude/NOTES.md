# catchr — Notes d'état

## Statut (vérifié 2026-07-17)
✅ **Déployé et fonctionnel** — prod up depuis ~7 semaines, preprod up depuis ~8 jours.

## Déploiement CT110
- **Prod** : `catchr` container → https://catchr.naerod.com
- **Preprod** : `catchr-preprod` container → https://preprod-catchr.naerod.com
- Dossiers : `/opt/apps/catchr` (prod) · `/opt/apps/catchr-preprod` (preprod)
- Backup compose OIDC : `docker-compose.yml.bak.catchr-oidc.20260708_172515`

## Auth Authentik
✅ **Migration OIDC faite** (backup du 2026-07-08 confirme l'ajout).
L'auth est gérée **côté applicatif** (OIDC redirect dans server.js) et non via nginx forward-auth.
→ Différent du pattern live2mp3 (nginx forward-auth), mais fonctionnel. Les deux approches coexistent.

## Nginx
- Vhost `catchr.naerod.com` et `preprod-catchr.naerod.com` configurés dans `/opt/apps/nginx/nginx.conf`
- Pas de bloc forward-auth nginx (l'app gère tout en interne via OIDC)

## Public cible
Partagé avec la **communauté PokeMMO** internationale (10 langues), mais pas encore de publicité faite.
→ Voir BACKLOG pour la promotion communautaire.

## Stack CT110
- Container Node.js/Express sur port 3000
- SQLite (`sql.js`) pour les données
- Secrets : `/opt/apps/catchr/.env` et `/opt/apps/catchr-preprod.env`

## À faire
- [ ] Tester que l'OIDC Authentik fonctionne bien en prod (login → catchr-users group → accès)
- [ ] Décider si publicité communauté PokeMMO (Reddit, forums officiels) — voir BACKLOG

## Ressource à retenir (2026-09-23)
- https://pokemondb.net/sprites/typhlosion : sprites de toutes les générations par Pokémon, utile pour catchr.
