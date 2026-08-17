// src/config/monetisation.ts

// ⚙️ Palier à partir duquel le mode "Réviser par thème" se débloque.
// Valeur par défaut de src/services/remoteConfig.ts, utilisée tant que le fetch n'a pas abouti.
export const SEUIL_DEBLOCAGE_THEME_DEFAUT = 3;

// ⚙️ Nombre de sessions de révision détaillée gratuites par jour avant publicité.
// Valeur par défaut de src/services/remoteConfig.ts, utilisée tant que le fetch n'a pas abouti.
export const SESSIONS_DETAIL_GRATUITES_PAR_JOUR = 1;

// ⚙️ Nombre de réponses bonus débloquées gratuitement par jour (sans publicité).
// Au-delà, le déblocage d'un bonus passe par une publicité récompensée.
// Valeur par défaut de src/services/remoteConfig.ts, utilisée tant que le fetch n'a pas abouti.
export const BONUS_GRATUITS_PAR_JOUR_DEFAUT = 1;

// ⚙️ Message affiché sur le bandeau vert de l'accueil. Vide = message par défaut sur la
// disponibilité hors connexion. Pilotable à distance (clé Remote Config "message_accueil")
// afin d'adresser un mot aux testeurs, ou d'annoncer une nouveauté, sans republier l'app.
// Le vider dans la console Firebase restaure le message d'origine.
export const MESSAGE_ACCUEIL_DEFAUT = '';

// Message d'origine, affiché dès que MESSAGE_ACCUEIL_DEFAUT est vide.
export const MESSAGE_ACCUEIL_HORS_LIGNE = 'Fiches débloquées disponibles hors connexion';

export const STORAGE_KEY_ETAT = '@etat-naturalisation';

// ⚙️ Identifiant du produit Premium dans Google Play Console (achat non consommable, "managed product").
export const SKU_PREMIUM = 'premium_nat';

// ⚙️ Prix affiché tant que le prix réel n'a pas été récupéré depuis le store (ou si le fetch échoue).
export const PRIX_PREMIUM_INDICATIF = '4,99 €';