# catchr — Vision produit

## Pitch
Calculateur de taux de capture pour PokeMMO : remplace le workflow Google Sheets par une web app rapide, multi-langue, avec recommandation de Pokéball optimale (la plus rapide ET la moins chère).

## Utilisateurs cibles
- Communauté PokeMMO internationale (pas encore publicisé — en cours de finalisation)
- 10 langues supportées : EN, FR, JP, PT, ES, KO, ZH, DE, IT, ID

## Fonctionnalités
- Calcul temps réel du taux de capture selon HP actuel, statut, niveau, Pokéball
- Recommandation intelligente : meilleure Pokéball par critère (rapidité ou économie)
- Gestion des événements PokeMMO (Pokémon en essaim — capture rates modifiés)
- Détection Quick Ball (1er tour)
- Thème dark/light, interface mobile-friendly

## Accès
- Auth Authentik OIDC (groupes : `catchr-users` · `catchr-event-managers` · `catchr-admins`)
- Ouvert à la communauté PokeMMO (pas encore publicisé)

## Perspectives d'évolution
- Mise à jour des données Pokémon à chaque patch PokeMMO
- Historique des captures (par utilisateur authentifié)
- Partage de "builds capture" entre joueurs
- API publique JSON pour outils tiers de la communauté
- Promotion : Reddit PokeMMO, forums officiels, Discord communautaire
