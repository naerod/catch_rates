/* ════════════════════════════════════════════
   i18n — EN / FR (seules langues traduites en entier)
   ════════════════════════════════════════════ */

const translations = {
  en: {
    "srv_Cannot delete your own account": "Cannot delete your own account", "srv_Default password refused: change it (see README, local admin account)": "Default password refused: change it (see README, local admin account)", "srv_Invalid credentials": "Invalid credentials", "srv_Invalid date (YYYY-MM-DD)": "Invalid date (YYYY-MM-DD)", "srv_Invalid id": "Invalid id", "srv_Invalid name (max 100 chars)": "Invalid name (max 100 chars)", "srv_Invalid slug (a-z, 0-9, -)": "Invalid slug (a-z, 0-9, -)", "srv_Local login disabled, use SSO": "Local login disabled, use SSO", "srv_Market prices unavailable": "Market prices unavailable", "srv_Missing fields": "Missing fields", "srv_Missing or invalid fields": "Missing or invalid fields", "srv_Missing pokemon_id": "Missing pokemon_id", "srv_No local account (password managed by SSO)": "No local account (password managed by SSO)", "srv_Not found": "Not found", "srv_Password too short (min 6 chars)": "Password too short (min 6 chars)", "srv_Session error": "Session error", srv_Forbidden: "Forbidden", srv_Unauthorized: "Unauthorized",
    search_clear: "Clear", loading: "Loading…", money_methods: "Methods", admin_manage_users: "Manage users", admin_users_title: "User management", admin_back: "← Back", label_role: "Role", role_manager: "Manager", role_admin: "Administrator", admin_add_user: "Add user", admin_add_user_plus: "+ Add user", label_slug: "Slug", label_name: "Name", footer_tool: "PokeMMO community tool", admin_error: "Error", admin_users_load_error: "Failed to load users", admin_pw_keep: "(leave empty to keep)", admin_no_users: "No users.", admin_confirm_delete_user: "Delete user \"{user}\"?", admin_fields_required: "All fields are required.", tag_best: "BEST", tag_cheap: "CHEAP", admin_no_events: "No events yet.", warn_tag_suicide: "SUICIDE", warn_tag_recoil: "RECOIL",
    nav_calc: 'Calculator', home_explore: 'Explore', home_favs: 'Favourites', home_suggest: 'Event running', home_suggested: 'Suggested', home_add_method: 'Add a method to your favourites', home_add_event: 'Add an event to your favourites', ev_forecast: 'Forecast', ev_unverified: 'To confirm', ev_unverified_tip: 'Swarm list not officially published: same pool as Xmas 2024, to be confirmed.', ev_empty: 'Swarm list not available yet.', ev_add: 'Add an event', ev_start: 'Start', ev_end: 'End', nav_events: 'Event swarms', nav_admin: 'Admin',
    nrd_login: "Log in / Sign up",
    nav_money: 'Money making', money_title: 'Money making', money_wip: 'This route is being reworked and will be back soon. In the meantime, you can read the original guide.', money_example: 'Example', money_wip_label: 'Work in progress', money_wip_cta: 'Open the original guide', money_guides: 'Guides', money_live: 'Available', money_back: 'All methods', money_fav_add: 'Add to favourites', money_fav_remove: 'Remove from favourites',
    gr_note_pre_nerf: "This guide was made before the 2025 nerf, but it still works. I usually start the charm after the second or third gym, depending on how well you master the run. This makes the run a little longer than an hour if you do all the gyms and the bonus Riches trainer, though you could technically skip one or two gyms. I would recommend skipping Canalave.", gr_note_unova: "Experienced players: you can technically change the order of the gyms in Unova to minimize the number of heals you need, depending on the situation (watch the PP of your main attacks carefully). Just remember to give Blastoise Choice Specs for Driftveil, and to switch back to Choice Scarf afterwards.", gr_name: '6 Pillars - Diabolus (2025)', gr_short: 'Diabolus (2025)', gr_tech_name: '6 Pillars - Technical route (2026)', gr_tech_short: 'Technical route (2026)', gr_team_guide: 'Team building guide', gr_team_guide_soon: 'Pokepaste coming soon', gr_info: 'Run info', gr_prev: 'Previous', gr_next: 'Next', gr_restart: 'Restart', gr_first: 'This is the first region',
    gr_total: 'Total', gr_total_note: 'with Amulet Coin (price not included)', gr_stock: 'Stockpile', gr_team: 'Team',
    gr_ocarina: 'Teleport Ocarina recommended: the only extra purchase, it saves precious seconds to heal your Pokemon (it can be skipped in theory)', gr_hms: 'Fly, Cut and Surf are mandatory: Togekiss learns Fly, Garchomp learns Cut and Blastoise learns Surf', gr_map_of: 'Map to', gr_lvl: 'Lvl.',
    gr_error: "Couldn't load the route. Check your connection, then retry.", gr_retry: 'Retry',
    gr_vs: 'vs.', gr_use: 'use', gr_switch_into: 'switch into', gr_into: 'into', gr_instead_of: 'instead of', gr_instead: 'instead', gr_on: 'on',
    gr_follow_into: 'follow up with', gr_follow_up_with: 'follow up with', gr_switch_out: 'switch out', gr_then: 'then',
    gr_lead_with: 'Lead with', gr_and: 'and', gr_tip_vermilion: 'Use Repel and surf to the left to reach the gym faster',
    item_black_glasses: 'Black Glasses', item_choice_specs: 'Extra Specs', item_choice_scarf: 'Extra Scarf',
    mv_water_spout: 'Water Spout', mv_helping_hand: 'Helping Hand', mv_hyper_voice: 'Hyper Voice', mv_fake_out: 'Fake Out',
    mv_explosion: 'Explosion', mv_eruption: 'Eruption', mv_blizzard: 'Blizzard', mv_dragon_claw: 'Dragon Claw',
    mv_assurance: 'Assurance', mv_rain_dance: 'Rain Dance', mv_earthquake: 'Earthquake',
    mv_swift: 'Swift', mv_incinerate: 'Incinerate', mv_sunny_day: 'Sunny Day',
    it_black_glasses: 'Black Glasses', it_choice_band: 'Choice Band', it_choice_scarf: 'Choice Scarf', it_choice_specs: 'Choice Specs',
    gr_min: 'min', money_mode_grid: 'Grid view', money_mode_linear: 'Linear view', gr_skip: 'Skip? (unconfirmed)', gr_heal_hint_yes: 'Heal your team after this fight.', gr_heal_hint_maybe: 'Heal after this fight only if your team needs it.', gr_heal_hint_required: 'Healing is required before the next fight.', gr_swap_hint: 'Item swap', gr_heal_yes: 'Heal', gr_heal_maybe: 'Heal if needed', gr_heal_required: 'Heal if required',
    gr_requires: 'Requires Vanilluxe to survive a critical Choice Band Earthquake from Garchomp',
    gr_tip_route13: 'With 1:30–2:40 left, head to Route 13 and battle Socialite Marian and Gentleman Yan. About 1:30 left when you fly to Undella for Marian, 1:05 for Yan.',
    gr_follow_with: 'follow up with', gr_prioritize: 'prioritize', gr_prefer: 'prefer', gr_if_available: 'if available', gr_if: 'if', gr_dies_crit_eq: 'dies to a crit Earthquake',
    gr_send_out: 'send out', gr_lead: 'lead', gr_sent_together: 'are sent out together at Turn 2', gr_turns4: '(4 turns)', gr_at_turn1: 'at Turn 1', gr_on_exit: 'on exit', gr_air_balloon: 'Air Balloon', gr_warn_lanturn: 'Lanturn survives and Garchomp dies to Ice Beam',
    gr_warn_cradily: 'Warning: high chance of Cradily surviving', gr_survives_kos: 'survives and KOs', gr_sub_into: 'sub into', gr_faints: 'faints',
    gr_first_slot: 'first slot', gr_second_slot: 'second slot', gr_for: 'for', gr_hard_switches_into: 'hard switches into',
    gr_survives: 'survives', gr_curse_if: 'Low chance of 4 turns if', gr_curse_procs: 'procs Cursed Body', gr_protect_furret: '(Lapras lead has Protect Furret: 4 turns)', mv_shock_wave: 'Shock Wave', mv_surf: 'Surf', mv_cut: 'Cut', mv_fly: 'Fly',
    charm_title: 'Charm calculator', charm_none: 'No charm', charm_amulet: 'Amulet Coin', charm_r75: 'Riches Charm 75%', charm_r100: 'Riches Charm 100%',
    charm_best: 'Best choice', charm_price: 'Price', charm_gain: 'Gains', charm_net: 'Net profit', charm_donator: 'Donator (+5% gains)',
    charm_gyms: 'Gyms in the run', charm_reset: 'Reset to the guide', charm_close: 'Close', charm_use_market: 'Use the market price',
    charm_updated: 'Market prices updated at', charm_loading: 'Loading market prices…', charm_error: 'Market prices unavailable: enter them manually.',
    charm_unavailable: 'Charm calculator (enter prices)',
    gr_t1: 'T1', gr_t2: 'T2', gr_t3: 'T3', gr_air_balloon: 'Air Balloon', gr_vs_rest: 'vs. rest', gr_spam: 'spam', gr_double_hv: 'Double Hyper Voice',
    gr_ko_crit_psychic: "gets KO'd by a crit Psychic", gr_optional: 'Optional gym',
    gr_tn_lavaridge: 'Very low chance to 4-turn, heal if Blastoise is chipped', gr_tn_violet: "Pray not to get flinched by Scarf Aerodactyl's Rock Slide",
    gr_tn_mahogany_req: 'Requires Garchomp to die: skip if it does not', gr_tn_mahogany_pp: "Restore Typhlosion's Eruption PP afterwards",
    gr_tn_nacrene_req: 'Only with 2:45 left. Requires Garchomp to die, Weezing and Typhlosion alive', mv_x_speed: 'X Speed',
    tp_team: 'The team', tp_level: 'Lv.', tp_start_set: 'Items starting set', tp_moves: 'Moves', tp_hm_tip: 'Mandatory HM move\nFree to use something else if you have the Ocarina', tp_free_slot: 'Free to add whatever you want', tp_rec_tip: 'Recommended', tp_unused: 'Unused slot', tp_swaps: 'Item changes', tp_after: 'after',
    money_events: 'Event', mev_halloween: 'Halloween', mev_christmas: 'Christmas', mev_lunar: 'Lunar New Year', mev_empty: 'No guide for this event yet.', pk_name: 'Pumpking Hard Mode - 3 particles', pk_short: 'Pumpking 3 particles', pk5_name: 'Pumpking Hard Mode - 5 Pokemon', pk5_short: 'Pumpking 5 Pokemon', cn_name: 'Pumpking Hard Mode - 5 Pokemon (CNcl)', cn_short: 'Pumpking 5 Pokemon (CNcl)', cn_att_speed: 'Speed order: Excadrill, Krookodile > Hydreigon > Tyranitar > 213', cn_att_iv: 'Smeargle: 0 HP and 0 SpD IVs. Hydreigon: 13 Speed IV', cn_att_items: 'Per run: 1 X Attack, 1 Revive, 1 Shuca Berry. Flying particle: Iron Ball', pk5_att_speed: 'Tyranitar final speed must stay above 213', pk5_att_iv: 'Defensive IVs: 25+ seems stable. Going lower can change Pumpking AI. Krookodile is the most forgiving', pk5_att_items: 'Per run: 1 X Attack, 1 Revive, and 0 or 1 healing berry. Flying or Levitate particle: Iron Ball', pk_slot: 'Slot', pk_order: 'Party order', pk_particle: 'Particle', pk_phase: 'Phase', pk_turn: 'Turn', pk_hp_line: 'HP line', pk_exceptions: 'Exceptions', pk_suggested: 'Tweak suggested on top of the base strategy',
    pk_att_female: 'Honchkrow must be female: Captivate only works on the opposite gender', pk_att_speed: 'Check speeds in game: Honchkrow 178 (slower than Krookodile, so Assurance hits after Earthquake), Krookodile 251', pk_att_items: 'Held items come back at each phase: Fling and the berries can be used again',
    mv_captivate: 'Captivate', mv_crunch: 'Crunch', mv_fling: 'Fling', mv_sleep_talk: 'Sleep Talk', mv_wide_guard: 'Wide Guard', mv_tailwind: 'Tailwind', mv_protect: 'Protect', mv_swords_dance: 'Swords Dance', mv_leer: 'Leer', mv_outrage: 'Outrage', mv_double_edge: 'Double-Edge', mv_heal_block: 'Heal Block', mv_taunt: 'Taunt',
    it_chesto_berry: 'Chesto Berry', it_poison_barb: 'Poison Barb', it_lum_berry: 'Lum Berry', it_x_attack: 'X Attack', it_hyper_potion: 'Hyper Potion', it_revive: 'Revive', it_full_heal: 'Full Heal', it_max_potion: 'Max Potion', it_cat_cookie: 'Cat Cookie', it_pumpkin_cookie: 'Pumpkin Cookie', it_chilan_berry: 'Chilan Berry', it_figy_berry: 'Figy Berry', it_shuca_berry: 'Shuca Berry', it_air_balloon: 'Air Balloon', it_soft_sand: 'Soft Sand', it_iron_ball: 'Iron Ball', it_choice_band: 'Choice Band',
    tp_stock: 'Stockpile to bring', tp_back: 'Back to the route',
    tp_nature: 'Nature', tp_ability: 'Ability', tp_evs: 'EVs', tp_ivs: 'IVs', tp_note: 'Notes',
    ty_fire: 'Fire', ty_normal: 'Normal', ty_flying: 'Flying', ty_water: 'Water', ty_ice: 'Ice', ty_poison: 'Poison', ty_dragon: 'Dragon', ty_ground: 'Ground', ty_dark: 'Dark', ty_grass: 'Grass', ty_steel: 'Steel', ty_rock: 'Rock',
    gr_charm_start: 'Start the Riches Charm here', gr_tip_heal_230: 'With 2:30 left, heal if needed', gr_tip_channel: 'Change channel right after the battle to teleport straight to the exit',
    btn_sso_login: 'Sign in', btn_sso_logout: 'Sign out', btn_sso_admin: 'Sign in with Authentik', or: 'or',
    calc_title: "Catch Rate Calculator", calc_subtitle: "Catch Rate Calculator for PokeMMO — Gen 3-5 formula",
    search_placeholder: "Search Pokemon...", catch_rate_label: "Catch Rate", gen_label: "Gen",
    quickable_title: "Quick Ball recommended!", quickable_desc: "≥95% catch rate on turn 1 — throw it immediately!",
    quickable_title_accessible: "Quick Ball accessible", quickable_desc_accessible: "≥75% catch rate on turn 1 — maybe considering it?",
    best_title: "⚡ Fastest", cheap_title: "💰 Economical", technique_label: "Technique",
    technique_sleep: "Sleep", technique_freeze: "Freeze", technique_para: "Paralysis",
    technique_poison: "Poison", technique_burn: "Burn", technique_1hp: "1 HP", technique_fullhp: "Full HP",
    technique_night: "Night", technique_wait10: "Wait 10 turns", ev_turns10: "10 turns", technique_soak: "Soak",
    more_params: "More parameters", hp_label: "Pokemon HP", hp_full: "Full HP",
    param_sleep: "Sleep", param_night: "Night", param_alpha: "Alpha", param_freeze: "Freeze",
    param_para: "Paralysis", param_poison: "Poison", param_burn: "Burn",
    all_balls_title: "All Pokeballs", turn1_badge: "TURN 1",
    cond_none: "—", cond_night: "Night only", cond_love: "If conditions met",
    cond_bugwater: "Type Bug/Water", cond_quick: "Turn 1 only", cond_timer: "After 10 turns",
    guaranteed: "Guaranteed!",
    events_title: "PokeMMO Events", events_subtitle: "Swarm Pokemon by event",
    no_events: "No events available.", event_active: "Active", event_inactive: "Inactive",
    admin_login_title: "Admin Login", label_username: "Username", label_password: "Password",
    btn_login: "Login", login_error: "Invalid credentials.", admin_title: "Admin Dashboard",
    btn_change_pw: "Change Password", btn_logout: "Logout", modal_change_pw: "Change Password",
    label_new_password: "New Password", btn_save: "Save", btn_cancel: "Cancel",
    pw_success: "Password changed successfully.", pw_error: "Error changing password.",
    admin_create_event: "Create Event", label_name_en: "Name (EN)", label_name_fr: "Name (FR)",
    label_active: "Active", btn_create_event: "Create Event", admin_events_list: "Events",
    btn_edit: "Edit", btn_delete: "Delete", btn_add_pokemon: "Add",
    add_pokemon_placeholder: "Search Pokemon...", confirm_delete_event: "Delete this event?",
    confirm_remove_pokemon: "Remove this Pokemon?",
    footer_disclaimer: "not affiliated with PokeMMO",
    cl_back: "Back to the calculator",
    ball_quick_ball: "Quick Ball", ball_pokeball: "Poke Ball", ball_greatball: "Great Ball",
    ball_ultraball: "Ultra Ball", ball_timerball: "Timer Ball", ball_loveball: "Love Ball",
    ball_duskball: "Dusk Ball", ball_netball: "Net Ball",
    warn_suicide: "Can use {moves} — may KO itself!",
    warn_recoil: "Knows {moves} — takes recoil damage",
    warn_flee: "Knows {moves} — may end the encounter!",
    warn_ghost: "Ghost type — False Swipe has no effect! Use Scrappy or Soak",
    warn_sleep_immune: "{ability} ability — cannot be put to sleep!",
    warn_weather: "{ability} ability — causes passive weather damage",
    nav_shiny: "Shiny Helper",
    // Catch stats
    turns_label: "turns", avg_cost_label: "avg cost",
    // Enhanced warnings
    warn_recoil_critical: "💀 SUICIDE — {moves} (instant KO!)",
    warn_recoil_high: "🔴 RECOIL — {moves} (1/2 damage, high risk)",
    warn_recoil_medium: "🟠 RECOIL — {moves} (1/3 damage, medium risk)",
    warn_recoil_low: "🟡 RECOIL — {moves} (1/4 damage, low risk)",
    if_min_level: "if ≥ Lv.", via_tm: "TM / Tutor",
    history_title: "History",
    history_clear: "Clear history",
    history_empty: "No history yet",
    history_close: "Close",
  },
  fr: {
    search_clear: "Effacer", loading: "Chargement…", money_methods: "Méthodes", admin_manage_users: "Gérer les utilisateurs", admin_users_title: "Gestion des utilisateurs", admin_back: "← Retour", label_role: "Rôle", role_manager: "Gestionnaire", role_admin: "Administrateur", admin_add_user: "Ajouter", admin_add_user_plus: "+ Ajouter un utilisateur", label_slug: "Slug", label_name: "Nom", footer_tool: "outil communautaire PokeMMO", admin_error: "Erreur", admin_users_load_error: "Impossible de charger les utilisateurs", admin_pw_keep: "(laisser vide pour le garder)", admin_no_users: "Aucun utilisateur.", admin_confirm_delete_user: "Supprimer l'utilisateur « {user} » ?", admin_fields_required: "Tous les champs sont obligatoires.", tag_best: "MEILLEURE", tag_cheap: "ÉCO", admin_no_events: "Pas encore d'event.", warn_tag_suicide: "K.O. AUTO", warn_tag_recoil: "CONTRECOUP",
    /* Messages du serveur (renvoyes en anglais) */
    "srv_Cannot delete your own account": "Impossible de supprimer ton propre compte", "srv_Default password refused: change it (see README, local admin account)": "Mot de passe par défaut refusé : change-le (voir README, compte admin local)", srv_Forbidden: "Accès refusé", "srv_Invalid credentials": "Identifiants incorrects", "srv_Invalid date (YYYY-MM-DD)": "Date invalide (AAAA-MM-JJ)", "srv_Invalid id": "Identifiant invalide", "srv_Invalid name (max 100 chars)": "Nom invalide (100 caractères max.)", "srv_Invalid slug (a-z, 0-9, -)": "Slug invalide (a-z, 0-9, -)", "srv_Local login disabled, use SSO": "Connexion locale désactivée : utilise le SSO", "srv_Market prices unavailable": "Prix du marché indisponibles", "srv_Missing fields": "Champs manquants", "srv_Missing or invalid fields": "Champs manquants ou invalides", "srv_Missing pokemon_id": "pokemon_id manquant", "srv_No local account (password managed by SSO)": "Pas de compte local (mot de passe géré par le SSO)", "srv_Not found": "Introuvable", "srv_Password too short (min 6 chars)": "Mot de passe trop court (6 caractères min.)", "srv_Session error": "Erreur de session", srv_Unauthorized: "Non autorisé",
    turns_label: "tours", avg_cost_label: "coût moyen",
    nav_calc: 'Calculateur', home_explore: 'Explorer', home_favs: 'Favoris', home_suggest: 'Évènement en cours', home_suggested: 'Suggestions', home_add_method: 'Ajouter une méthode à vos favoris', home_add_event: 'Ajouter un événement à vos favoris', ev_forecast: 'Prévision', ev_unverified: 'À confirmer', ev_unverified_tip: 'Liste de swarms non publiée officiellement : même lot que Noël 2024, à confirmer.', ev_empty: 'Liste des swarms pas encore disponible.', ev_add: 'Ajouter un événement', ev_start: 'Début', ev_end: 'Fin', nav_events: 'Event swarms', nav_admin: 'Admin',
    nrd_login: "Connexion / Inscription",
    nav_money: 'Money making', money_wip: "Ce parcours est en cours de refonte et reviendra bientôt. En attendant, tu peux lire le guide d'origine.", money_example: 'Exemple', money_wip_label: 'En construction', money_wip_cta: "Ouvrir le guide d'origine", money_guides: 'Guides', money_live: 'Disponible', money_title: "Gagner de l'argent", money_back: 'Toutes les méthodes', money_fav_add: 'Ajouter aux favoris', money_fav_remove: 'Retirer des favoris',
    gr_note_pre_nerf: "Ce guide a été fait avant le nerf de 2025, mais il fonctionne toujours. Je lance généralement le charm après la deuxième ou la troisième arène, selon ta maîtrise du parcours. Cela rend le parcours un peu plus long qu'une heure si tu fais toutes les arènes et le dresseur bonus Riches, même si tu peux techniquement sauter une ou deux arènes. Je te recommande de sauter Joliberges.", gr_note_unova: "Joueurs expérimentés : tu peux techniquement changer l'ordre des arènes à Unys pour réduire le nombre de soins nécessaires, selon la situation (surveille bien les PP de tes attaques principales). Pense seulement à donner les Lunettes Choix à Tortank pour Port Yoneuve, puis à repasser au Mouchoir Choix ensuite.", gr_name: '6 Pillars - Diabolus (2025)', gr_short: 'Diabolus (2025)', gr_tech_name: '6 Pillars - Technical route (2026)', gr_tech_short: 'Technical route (2026)', gr_team_guide: "Guide de construction d'équipe", gr_team_guide_soon: 'Pokepaste bientôt disponible', gr_info: 'Infos du parcours', gr_prev: 'Précédent', gr_next: 'Suivant', gr_restart: 'Recommencer', gr_first: 'Ceci est la première région',
    gr_total: 'Total', gr_total_note: "avec Pièce Rune (prix non inclus)", gr_stock: 'Réserve', gr_team: 'Équipe',
    gr_ocarina: "Ocarina de téléportation conseillé : le seul achat supplémentaire, il fait gagner de précieuses secondes pour soigner les Pokémon (on peut théoriquement s'en passer)", gr_hms: 'Vol, Coupe et Surf sont obligatoires : Togekiss apprend Vol, Carchacrok apprend Coupe et Tortank apprend Surf', gr_map_of: 'Carte vers', gr_lvl: 'Niv.',
    gr_error: "Impossible de charger le parcours. Vérifie ta connexion, puis réessaie.", gr_retry: 'Réessayer',
    gr_vs: 'contre', gr_switch_into: 'passer sur', gr_use: 'utiliser', gr_into: 'puis', gr_instead_of: 'au lieu de', gr_instead: 'à la place', gr_on: 'sur',
    gr_follow_into: 'enchaîner avec', gr_follow_up_with: 'enchaîner avec', gr_switch_out: 'remplacer', gr_then: 'puis',
    gr_lead_with: 'Ouvrir avec', gr_and: 'et', gr_tip_vermilion: "Utiliser un Repousse et surfer vers la gauche pour atteindre l'arène plus vite",
    item_black_glasses: 'Lunettes Noires', item_choice_specs: 'Lunettes Choix en plus', item_choice_scarf: 'Mouchoir Choix en plus',
    mv_water_spout: 'Giclédo', mv_helping_hand: "Coup d'Main", mv_hyper_voice: 'Mégaphone', mv_fake_out: 'Bluff',
    mv_explosion: 'Explosion', mv_eruption: 'Éruption', mv_blizzard: 'Blizzard', mv_dragon_claw: 'Draco-Griffe',
    mv_assurance: 'Assurance', mv_rain_dance: 'Danse Pluie', mv_earthquake: 'Séisme',
    mv_swift: 'Météores', mv_incinerate: 'Calcination', mv_sunny_day: 'Zénith',
    it_black_glasses: 'Lunettes Noires', it_choice_band: 'Bandeau Choix', it_choice_scarf: 'Mouchoir Choix', it_choice_specs: 'Lunettes Choix',
    gr_min: 'min', money_mode_grid: 'Vue grille', money_mode_linear: 'Vue linéaire', gr_skip: 'Passer ? (non confirmé)', gr_heal_hint_yes: 'Soignez votre équipe après ce combat.', gr_heal_hint_maybe: 'Soignez après ce combat seulement si votre équipe en a besoin.', gr_heal_hint_required: 'Le soin est nécessaire avant le prochain combat.', gr_swap_hint: "Changement d'objet", gr_heal_yes: 'Soigner', gr_heal_maybe: 'Soigner si besoin', gr_heal_required: 'Soigner si nécessaire',
    gr_requires: 'Nécessite Vanilluxe pour survivre à un Séisme critique de Garchomp avec Bandeau Choix',
    gr_tip_route13: "Avec 1:30 à 2:40 restantes, aller sur la Route 13 affronter la Mondaine Marian et le Gentleman Yan. Environ 1:30 restantes en arrivant à Undella pour Marian, 1:05 pour Yan.",
    gr_follow_with: 'enchaîner avec', gr_prioritize: 'prioriser', gr_prefer: 'privilégier', gr_if_available: 'si disponible', gr_if: 'si', gr_dies_crit_eq: 'tombe sur un Séisme critique',
    gr_send_out: 'envoyer', gr_lead: 'en lead', gr_sent_together: 'sortent ensemble au tour 2', gr_turns4: '(4 tours)', gr_at_turn1: 'au tour 1', gr_on_exit: 'à la sortie', gr_air_balloon: 'Ballon', gr_warn_lanturn: 'Lanturn survit et Carchacrok meurt à Laser Glace',
    gr_warn_cradily: 'Attention : Vacilys survit souvent', gr_survives_kos: 'survit et met KO', gr_sub_into: 'remplacer par', gr_faints: 'tombe KO',
    gr_first_slot: 'premier slot', gr_second_slot: 'deuxième slot', gr_for: 'par', gr_hard_switches_into: 'switch direct vers',
    gr_survives: 'survit', gr_curse_if: 'Faible chance de 4 tours si', gr_curse_procs: 'déclenche Corps Maudit', gr_protect_furret: '(Furret avec Abri face à Lokhlass en lead : 4 tours)', mv_shock_wave: 'Onde de Choc', mv_surf: 'Surf', mv_cut: 'Coupe', mv_fly: 'Vol',
    charm_title: 'Calculateur de charm', charm_none: 'Sans charm', charm_amulet: 'Pièce Rune', charm_r75: 'Charme Richesse 75 %', charm_r100: 'Charme Richesse 100 %',
    charm_best: 'Meilleur choix', charm_price: 'Prix', charm_gain: 'Gains', charm_net: 'Bénéfice net', charm_donator: 'Donateur (+5 % de gains)',
    charm_gyms: 'Arènes du parcours', charm_reset: 'Revenir au guide', charm_close: 'Fermer', charm_use_market: 'Utiliser le prix du marché',
    charm_updated: 'Prix du marché mis à jour à', charm_loading: 'Chargement des prix du marché…', charm_error: 'Prix du marché indisponibles : saisis-les à la main.',
    charm_unavailable: 'Calculateur de charm (saisir les prix)',
    gr_t1: 'T1', gr_t2: 'T2', gr_t3: 'T3', gr_air_balloon: 'Ballon', gr_vs_rest: 'contre le reste', gr_spam: 'en boucle', gr_double_hv: 'Double Mégaphone',
    gr_ko_crit_psychic: 'tombe sur un Psy critique', gr_optional: 'Arène optionnelle',
    gr_tn_lavaridge: 'Très peu de chances de tenir 4 tours, soigner si Tortank est entamé', gr_tn_violet: "Prier pour ne pas être apeuré par la Lame de Roc d'un Ptéra Mouchoir Choix",
    gr_tn_mahogany_req: 'Nécessite que Carchacrok tombe : passer sinon', gr_tn_mahogany_pp: "Restaurer les PP d'Éruption de Typhlosion ensuite",
    gr_tn_nacrene_req: 'Seulement avec 2:45 restantes. Carchacrok doit tomber, Smogogo et Typhlosion vivants', mv_x_speed: 'Vitesse +',
    tp_team: "L'équipe", tp_level: 'Niv.', tp_start_set: 'Équipement de départ', tp_moves: 'Attaques', tp_hm_tip: "CS obligatoire\nLibre d'utiliser autre chose si tu as l'Ocarina", tp_free_slot: "Libre d'ajouter ce que tu veux", tp_rec_tip: 'Conseillé', tp_unused: 'Emplacement inutilisé', tp_swaps: "Changements d'objet", tp_after: 'après',
    money_events: 'Event', mev_halloween: 'Halloween', mev_christmas: 'Noël', mev_lunar: 'Nouvel An lunaire', mev_empty: 'Pas encore de guide pour cet event.', pk_name: 'Pumpking Hard Mode - 3 particules', pk_short: 'Pumpking 3 particules', pk5_name: 'Pumpking Hard Mode - 5 Pokémon', pk5_short: 'Pumpking 5 Pokémon', cn_name: 'Pumpking Hard Mode - 5 Pokémon (CNcl)', cn_short: 'Pumpking 5 Pokémon (CNcl)', cn_att_speed: 'Ordre de vitesse : Minotaupe, Crocorible > Trioxhydre > Tyranocif > 213', cn_att_iv: 'Queulorior : IV PV et Déf. Spé. à 0. Trioxhydre : IV Vitesse à 13', cn_att_items: 'Par run : 1 Attaque +, 1 Rappel, 1 Baie Jouca. Particule Vol : Balle Fer', pk5_att_speed: 'La vitesse finale de Tyranocif doit rester au-dessus de 213', pk5_att_iv: 'IV défensifs : 25+ semble stable. Descendre plus bas peut changer l\'IA de Pumpking. Crocorible est le plus tolérant', pk5_att_items: 'Par run : 1 Attaque +, 1 Rappel, et 0 ou 1 baie de soin. Particule Vol ou Lévitation : Balle Fer', pk_slot: 'Slot', pk_order: "Ordre de l'équipe", pk_particle: 'Particule', pk_phase: 'Phase', pk_turn: 'Tour', pk_hp_line: 'Seuils de PV', pk_exceptions: 'Imprévus', pk_suggested: 'Modification suggérée par rapport à la stratégie de base',
    pk_att_female: "Corboss doit être femelle : Séduction ne marche que sur le sexe opposé", pk_att_speed: "Vérifie les vitesses en jeu : Corboss 178 (plus lent que Crocorible, pour qu'Assurance frappe après Séisme), Crocorible 251", pk_att_items: 'Les objets tenus reviennent à chaque phase : Dégommage et les baies resservent',
    mv_captivate: 'Séduction', mv_crunch: 'Mâchouille', mv_fling: 'Dégommage', mv_sleep_talk: 'Blabla Dodo', mv_wide_guard: 'Garde Large', mv_tailwind: 'Vent Arrière', mv_protect: 'Abri', mv_swords_dance: 'Danse-Lames', mv_leer: "Groz'Yeux", mv_outrage: 'Colère', mv_double_edge: 'Damoclès', mv_heal_block: 'Anti-Soin', mv_taunt: 'Provoc',
    it_chesto_berry: 'Baie Maron', it_poison_barb: 'Pic Venin', it_lum_berry: 'Baie Prine', it_x_attack: 'Attaque +', it_hyper_potion: 'Hyper Potion', it_revive: 'Rappel', it_full_heal: 'Total Soin', it_max_potion: 'Potion Max', it_cat_cookie: 'Cat Cookie', it_pumpkin_cookie: 'Pumpkin Cookie', it_chilan_berry: 'Baie Zalis', it_figy_berry: 'Baie Figuy', it_shuca_berry: 'Baie Jouca', it_air_balloon: 'Ballon', it_soft_sand: 'Sable Doux', it_iron_ball: 'Balle Fer', it_choice_band: 'Bandeau Choix',
    tp_stock: 'Réserve à emporter', tp_back: 'Retour au parcours',
    tp_nature: 'Nature', tp_ability: 'Talent', tp_evs: 'EV', tp_ivs: 'IV', tp_note: 'Notes',
    ty_fire: 'Feu', ty_normal: 'Normal', ty_flying: 'Vol', ty_water: 'Eau', ty_ice: 'Glace', ty_poison: 'Poison', ty_dragon: 'Dragon', ty_ground: 'Sol', ty_dark: 'Ténèbres', ty_grass: 'Plante', ty_steel: 'Acier', ty_rock: 'Roche',
    gr_charm_start: "Lancer le charme Richesse ici", gr_tip_heal_230: "Avec 2:30 restantes, soigner si besoin", gr_tip_channel: "Changer de channel juste après le combat pour se téléporter directement à la sortie",
    btn_sso_login: 'Connexion', btn_sso_logout: 'Déconnexion', btn_sso_admin: 'Se connecter avec Authentik', or: 'ou',
    calc_title: "Calculateur de Taux de Capture", calc_subtitle: "Calculateur de Taux de Capture — PokeMMO — Formule Gen 3-5",
    search_placeholder: "Rechercher un Pokémon...", catch_rate_label: "Taux de capture", gen_label: "Gén",
    quickable_title: "Quick Ball recommandée !", quickable_desc: "≥95% de capture au tour 1 — lancez-la immédiatement !",
    quickable_title_accessible: "Quick Ball accessible", quickable_desc_accessible: "≥75% de capture au tour 1 — peut-être à considérer ?",
    best_title: "⚡ Le plus rapide", cheap_title: "💰 Économique", technique_label: "Technique",
    technique_sleep: "Sommeil", technique_freeze: "Gel", technique_para: "Paralysie",
    technique_poison: "Poison", technique_burn: "Brûlure", technique_1hp: "1 PV", technique_fullhp: "PV pleins",
    technique_night: "Nuit", technique_wait10: "Attendre 10 tours", ev_turns10: "10 tours", technique_soak: "Soak",
    more_params: "Plus de paramètres", hp_label: "PV du Pokémon", hp_full: "PV max",
    param_sleep: "Sommeil", param_night: "Nuit", param_alpha: "Alpha", param_freeze: "Gel",
    param_para: "Paralysie", param_poison: "Poison", param_burn: "Brûlure",
    all_balls_title: "Toutes les Pokéballs", turn1_badge: "TOUR 1",
    cond_none: "—", cond_night: "Nuit uniquement", cond_love: "Si conditions remplies",
    cond_bugwater: "Type Insecte/Eau", cond_quick: "Tour 1 uniquement", cond_timer: "Après 10 tours",
    guaranteed: "Garanti !",
    events_title: "Événements PokeMMO", events_subtitle: "Pokémon en essaim par événement",
    no_events: "Aucun événement disponible.", event_active: "Actif", event_inactive: "Inactif",
    admin_login_title: "Connexion Admin", label_username: "Identifiant", label_password: "Mot de passe",
    btn_login: "Se connecter", login_error: "Identifiants incorrects.", admin_title: "Tableau de bord Admin",
    btn_change_pw: "Changer le mot de passe", btn_logout: "Déconnexion", modal_change_pw: "Changer le mot de passe",
    label_new_password: "Nouveau mot de passe", btn_save: "Enregistrer", btn_cancel: "Annuler",
    pw_success: "Mot de passe modifié.", pw_error: "Erreur lors du changement.",
    admin_create_event: "Créer un événement", label_name_en: "Nom (EN)", label_name_fr: "Nom (FR)",
    label_active: "Actif", btn_create_event: "Créer l'événement", admin_events_list: "Événements",
    btn_edit: "Modifier", btn_delete: "Supprimer", btn_add_pokemon: "Ajouter",
    add_pokemon_placeholder: "Rechercher un Pokémon...", confirm_delete_event: "Supprimer cet événement ?",
    confirm_remove_pokemon: "Retirer ce Pokémon ?",
    footer_disclaimer: "non affilié à PokeMMO",
    cl_back: "Retour au calculateur",
    ball_quick_ball: "Rapide Ball", ball_pokeball: "Poké Ball", ball_greatball: "Super Ball",
    ball_ultraball: "Hyper Ball", ball_timerball: "Chrono Ball", ball_loveball: "Love Ball",
    ball_duskball: "Sombre Ball", ball_netball: "Filet Ball",
    warn_suicide: "Peut utiliser {moves} — risque de se mettre KO !",
    warn_recoil: "Connaît {moves} — subit des dégâts de recul",
    warn_flee: "Connaît {moves} — peut mettre fin au combat !",
    warn_ghost: "Type Spectre — Faux-Chage sans effet ! Utilisez Querelleur ou Trempage",
    warn_sleep_immune: "Talent {ability} — ne peut pas être endormi !",
    warn_weather: "Talent {ability} — inflige des dégâts passifs de météo",
    warn_recoil_critical: "💀 SUICIDE — {moves} (KO garanti !)",
    warn_recoil_high: "🔴 RECOIL — {moves} (1/2 dégâts, risque élevé)",
    warn_recoil_medium: "🟠 RECOIL — {moves} (1/3 dégâts, risque moyen)",
    warn_recoil_low: "🟡 RECOIL — {moves} (1/4 dégâts, faible risque)",
    if_min_level: "si ≥ Niv.", via_tm: "CT / tuteur",
    history_title: "Historique",
    history_clear: "Effacer l'historique",
    history_empty: "Aucun historique",
    history_close: "Fermer",
    nav_shiny: "Chasseur Shiny",
  },
};

/* La liste des langues et le selecteur vivent dans <naerod-header>
   (depot naerod-ui). Ce fichier ne garde que le dictionnaire de catchr :
   le contenu reste au site, l interface est partagee. */


const i18n = {
  lang: (() => { try { return localStorage.getItem('lang') === 'fr' ? 'fr' : 'en'; } catch { return 'en'; } })(),   // stockage bloque ou langue retiree -> anglais

  t(key) {
    return (translations[this.lang] && translations[this.lang][key]) ||
           (translations['en'] && translations['en'][key]) ||
           key;
  },

  setLang(lang) {
    if (!translations[lang]) lang = 'en';
    this.lang = lang;
    try { localStorage.setItem('lang', lang); } catch { /* stockage indisponible */ }
    this.applyAll();
    document.documentElement.lang = lang;
  },

  applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-label]').forEach(el => {    // libelle accessible + infobulle
      const v = this.t(el.getAttribute('data-i18n-label'));
      el.setAttribute('aria-label', v);
      if (el.hasAttribute('title')) el.title = v;
      if (el.hasAttribute('data-tip')) el.dataset.tip = v;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
    });
    document.dispatchEvent(new CustomEvent('langchange'));
  },

  ballName(key) {
    return this.t('ball_' + key) || key;
  }
};

/* ── Pont avec <naerod-header> ──
   Le header pilote le choix de langue et interroge le site pour traduire ses
   propres libelles (nav_calc, btn_login…). Aucune chaine n est dupliquee. */
document.addEventListener('naerod:langchange', e => i18n.setLang(e.detail.lang));

document.addEventListener('naerod:i18n', e => {
  const v = translations[e.detail.lang || i18n.lang]?.[e.detail.key] ?? translations.en?.[e.detail.key];
  if (v) e.detail.text = v;
});

document.addEventListener('DOMContentLoaded', () => {
  i18n.applyAll();
});
