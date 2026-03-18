/* ════════════════════════════════════════════
   i18n — EN / FR bilingual system
   ════════════════════════════════════════════ */

const translations = {
  en: {
    nav_calc: 'Calculator',
    nav_events: 'Events',
    nav_admin: 'Admin',

    calc_title: "Catch Rate Calculator",
    calc_subtitle: "PokeMMO — Gen 3-5 formula",
    search_placeholder: "Search Pokémon...",
    catch_rate_label: "Catch Rate",
    gen_label: "Gen",

    quickable_title: "Quick Ball recommended!",
    quickable_desc: "≥95% catch rate on turn 1 — throw it immediately!",
    quickable_title_accessible: "Quick Ball accessible",
    quickable_desc_accessible: "≥75% catch rate on turn 1 — maybe considering it?",

    best_title: "⚡ Fastest",
    cheap_title: "💰 Economical",
    technique_label: "Technique",
    technique_sleep: "Sleep",
    technique_freeze: "Freeze",
    technique_para: "Paralysis",
    technique_poison: "Poison",
    technique_burn: "Burn",
    technique_1hp: "1 HP",
    technique_night: "Night",
    technique_wait10: "Wait 10 turns",
    technique_soak: "Soak",

    more_params: "More parameters",
    hp_label: "Pokémon HP",
    hp_full: "Full HP",
    param_sleep: "Sleep",
    param_night: "Night",
    param_freeze: "Freeze",
    param_para: "Paralysis",
    param_poison: "Poison",
    param_burn: "Burn",

    all_balls_title: "All Pokéballs",
    turn1_badge: "TURN 1",
    cond_none: "—",
    cond_night: "Night only",
    cond_love: "If conditions met",
    cond_bugwater: "Type Bug/Water",
    cond_quick: "Turn 1 only",
    cond_timer: "After 10 turns",
    guaranteed: "Guaranteed!",

    events_title: "PokeMMO Events",
    events_subtitle: "Swarm Pokémon by event",
    no_events: "No events available.",
    event_active: "Active",
    event_inactive: "Inactive",

    admin_login_title: "Admin Login",
    label_username: "Username",
    label_password: "Password",
    btn_login: "Login",
    login_error: "Invalid credentials.",
    admin_title: "Admin Dashboard",
    btn_change_pw: "Change Password",
    btn_logout: "Logout",
    modal_change_pw: "Change Password",
    label_new_password: "New Password",
    btn_save: "Save",
    btn_cancel: "Cancel",
    pw_success: "Password changed successfully.",
    pw_error: "Error changing password.",
    admin_create_event: "Create Event",
    label_name_en: "Name (EN)",
    label_name_fr: "Name (FR)",
    label_active: "Active",
    btn_create_event: "Create Event",
    admin_events_list: "Events",
    btn_edit: "Edit",
    btn_delete: "Delete",
    btn_add_pokemon: "Add",
    add_pokemon_placeholder: "Search Pokémon...",
    confirm_delete_event: "Delete this event?",
    confirm_remove_pokemon: "Remove this Pokémon?",

    footer_disclaimer: "not affiliated with PokeMMO",

    ball_quick_ball: "Quick Ball",
    ball_pokeball: "Poké Ball",
    ball_greatball: "Great Ball",
    ball_ultraball: "Ultra Ball",
    ball_timerball: "Timer Ball",
    ball_loveball: "Love Ball",
    ball_duskball: "Dusk Ball",
    ball_netball: "Net Ball",
  },
  fr: {
    nav_calc: 'Calculateur',
    nav_events: 'Événements',
    nav_admin: 'Admin',

    calc_title: "Calculateur de Taux de Capture",
    calc_subtitle: "PokeMMO — Formule Gen 3-5",
    search_placeholder: "Rechercher un Pokémon...",
    catch_rate_label: "Taux de capture",
    gen_label: "Gén",

    quickable_title: "Quick Ball recommandée !",
    quickable_desc: "≥95% de capture au tour 1 — lancez-la immédiatement !",
    quickable_title_accessible: "Quick Ball accessible",
    quickable_desc_accessible: "≥75% de capture au tour 1 — peut-être à considérer ?",

    best_title: "⚡ Le plus rapide",
    cheap_title: "💰 Économique",
    technique_label: "Technique",
    technique_sleep: "Sommeil",
    technique_freeze: "Gel",
    technique_para: "Paralysie",
    technique_poison: "Poison",
    technique_burn: "Brûlure",
    technique_1hp: "1 PV",
    technique_night: "Nuit",
    technique_wait10: "Attendre 10 tours",
    technique_soak: "Soak",

    more_params: "Plus de paramètres",
    hp_label: "PV du Pokémon",
    hp_full: "PV max",
    param_sleep: "Sommeil",
    param_night: "Nuit",
    param_freeze: "Gel",
    param_para: "Paralysie",
    param_poison: "Poison",
    param_burn: "Brûlure",

    all_balls_title: "Toutes les Pokéballs",
    turn1_badge: "TOUR 1",
    cond_none: "—",
    cond_night: "Nuit uniquement",
    cond_love: "Si conditions remplies",
    cond_bugwater: "Type Insecte/Eau",
    cond_quick: "Tour 1 uniquement",
    cond_timer: "Après 10 tours",
    guaranteed: "Garanti !",

    events_title: "Événements PokeMMO",
    events_subtitle: "Pokémon de swarm par événement",
    no_events: "Aucun événement disponible.",
    event_active: "Actif",
    event_inactive: "Inactif",

    admin_login_title: "Connexion Admin",
    label_username: "Identifiant",
    label_password: "Mot de passe",
    btn_login: "Se connecter",
    login_error: "Identifiants incorrects.",
    admin_title: "Tableau de bord Admin",
    btn_change_pw: "Changer le mot de passe",
    btn_logout: "Déconnexion",
    modal_change_pw: "Changer le mot de passe",
    label_new_password: "Nouveau mot de passe",
    btn_save: "Enregistrer",
    btn_cancel: "Annuler",
    pw_success: "Mot de passe modifié.",
    pw_error: "Erreur lors du changement.",
    admin_create_event: "Créer un événement",
    label_name_en: "Nom (EN)",
    label_name_fr: "Nom (FR)",
    label_active: "Actif",
    btn_create_event: "Créer l'événement",
    admin_events_list: "Événements",
    btn_edit: "Modifier",
    btn_delete: "Supprimer",
    btn_add_pokemon: "Ajouter",
    add_pokemon_placeholder: "Rechercher un Pokémon...",
    confirm_delete_event: "Supprimer cet événement ?",
    confirm_remove_pokemon: "Retirer ce Pokémon ?",

    footer_disclaimer: "non affilié à PokeMMO",

    ball_quick_ball: "Rapide Ball",
    ball_pokeball: "Poké Ball",
    ball_greatball: "Super Ball",
    ball_ultraball: "Hyper Ball",
    ball_timerball: "Chrono Ball",
    ball_loveball: "Love Ball",
    ball_duskball: "Sombre Ball",
    ball_netball: "Filet Ball",
  }
};

const i18n = {
  lang: localStorage.getItem('lang') || 'en',

  t(key) {
    return (translations[this.lang] && translations[this.lang][key]) ||
           (translations['en'] && translations['en'][key]) ||
           key;
  },

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('lang', lang);
    this.applyAll();
    document.documentElement.lang = lang;
    const label = document.getElementById('lang-label');
    if (label) label.textContent = lang === 'fr' ? 'EN' : 'FR';
  },

  toggleLang() {
    this.setLang(this.lang === 'fr' ? 'en' : 'fr');
  },

  applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
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

document.addEventListener('DOMContentLoaded', () => {
  i18n.applyAll();
  document.getElementById('lang-label').textContent = i18n.lang === 'fr' ? 'EN' : 'FR';
  document.getElementById('lang-toggle').addEventListener('click', () => i18n.toggleLang());
});
