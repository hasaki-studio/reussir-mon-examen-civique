// src/config/liens.ts
//
// Adresses publiques des pages légales. Regroupées ici plutôt que dispersées dans les écrans :
// elles sont réutilisées par l'app, mais aussi saisies telles quelles dans la Play Console
// (Contenu de l'application → Politique de confidentialité) et dans AdMob (Confidentialité et
// messages), où toute divergence est un motif de rejet.
//
// ⚠️ Google revérifie périodiquement l'URL de confidentialité. Une adresse qui change ou qui
// renvoie une erreur peut entraîner la suspension de la fiche Play Store : ces URL ne doivent
// pas bouger sans mise à jour simultanée des deux consoles.

import { Linking } from 'react-native';

export const URL_CONFIDENTIALITE = 'https://examencivique.hasakistudio.fr/confidentialite';
export const URL_MENTIONS_LEGALES = 'https://examencivique.hasakistudio.fr/mentions-legales';

// ⚠️ Liens officiels de l'écran Conseils. Les adresses des sites publics changent
// régulièrement : un lien mort vers une liste officielle décrédibilise plus qu'il n'aide.
// Toute entrée laissée vide rend sa carte non cliquable et masque sa flèche — l'app promet
// alors moins, plutôt que de promettre à faux.
// TODO(contenu) : vérifier chaque adresse sur l'appareil avant chaque distribution.
export const URL_FORMATION_CIVIQUE = 'https://formation-civique.interieur.gouv.fr/examen-civique/';
// Liste officielle des questions de connaissance, une par démarche : le contenu de l'examen
// diffère selon le titre visé, ce que rappelle l'écran Conseils avant de proposer ces liens.
export const URL_LISTE_QUESTIONS_CSP =
  'https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-csp/';
export const URL_LISTE_QUESTIONS_CR =
  'https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-cr/';
export const URL_LISTE_QUESTIONS_NAT =
  'https://www.immigration.interieur.gouv.fr/documentation/guides-textes-et-brochures/questions-de-connaissance-pour-lexamen-civique-nationalite-francaise.html';
export const URL_ANEF = 'https://administration-etrangers-en-france.interieur.gouv.fr/';
export const URL_SERVICE_PUBLIC = 'https://www.service-public.gouv.fr/';
export const URL_ANNUAIRE_PREFECTURES = 'https://lannuaire.service-public.fr/';

/**
 * Ouvre une adresse dans le navigateur du système. Un échec — aucun navigateur disponible,
 * adresse rejetée — est journalisé sans remonter en exception : ne pas pouvoir ouvrir un lien
 * n'a pas à interrompre l'utilisation de l'application.
 */
export function ouvrirLien(url: string) {
  Linking.openURL(url).catch((e: unknown) => console.warn('Ouverture du lien impossible', url, e));
}
