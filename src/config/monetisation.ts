// src/config/monetisation.ts

// ⚙️ Palier à partir duquel « Réviser en détail » (par thème ou par palier) se débloque.
// Valeur haute par défaut : le détail s'ouvre donc au dernier palier du quizz, comme dans le
// prototype (la valeur est bornée au palier maximal à l'usage). Abaisser la clé Remote Config
// `seuil_deblocage_theme_defaut` ouvre le mode plus tôt, sans republier — c'est le bon levier
// pour ajuster le rythme pendant la phase de test.
export const SEUIL_DEBLOCAGE_THEME_DEFAUT = 99;

// ⚙️ Nombre de sessions de révision détaillée gratuites par jour et par quizz, avant publicité.
// Valeur par défaut de src/services/remoteConfig.ts, utilisée tant que le fetch n'a pas abouti.
export const SESSIONS_DETAIL_GRATUITES_PAR_JOUR = 1;

// ⚙️ Message affiché sur le bandeau vert de l'écran de sélection. Vide = message par défaut sur
// la disponibilité hors connexion. Pilotable à distance (clé Remote Config "message_accueil")
// afin d'adresser un mot aux testeurs, ou d'annoncer une nouveauté, sans republier l'app.
// Le vider dans la console Firebase restaure le message d'origine.
export const MESSAGE_ACCUEIL_DEFAUT = '';

// Message d'origine, affiché dès que MESSAGE_ACCUEIL_DEFAUT est vide.
export const MESSAGE_ACCUEIL_HORS_LIGNE = 'Questions débloquées disponibles hors connexion';

// Clé de stockage local de la progression.
//
// Le suffixe de version n'est pas décoratif : la forme de l'état a changé en passant de Nat
// (un seul parcours, état plat) à Civique (trois quizz, un compteur d'examens). Une clé
// versionnée permet de repartir proprement le jour où la forme changera de nouveau, plutôt que
// de fusionner silencieusement un objet périmé avec le nouveau schéma.
export const STORAGE_KEY_ETAT = '@etat-civique-v1';

// ⚙️ Identifiant du produit Premium dans Google Play Console (achat non consommable, "managed product").
// Un seul achat débloque les trois quizz : Google Play rattache un achat à une application, pas
// à un contenu, donc découper la vente par quizz supposerait trois produits et trois parcours
// d'achat pour un bénéfice nul.
export const SKU_PREMIUM = 'premium_civique';

// ⚙️ Prix affiché tant que le prix réel n'a pas été récupéré depuis le store (ou si le fetch échoue).
// Le jour où le vrai prix s'affiche, c'est que la facturation est câblée : c'est le test le plus
// fiable de la configuration Play Console.
export const PRIX_PREMIUM_INDICATIF = '4,99 €';
