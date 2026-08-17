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

export const URL_CONFIDENTIALITE = 'https://civique.hasakistudio.fr/confidentialite';
export const URL_MENTIONS_LEGALES = 'https://civique.hasakistudio.fr/mentions-legales';

// ⚠️ Liens officiels de l'écran Conseils. Les adresses des sites publics changent
// régulièrement : un lien mort vers le Livret du citoyen décrédibilise plus qu'il n'aide.
// Toute entrée laissée vide rend sa carte non cliquable et masque sa flèche — l'app promet
// alors moins, plutôt que de promettre à faux.
// TODO(contenu) : vérifier chaque adresse sur l'appareil avant chaque distribution.
// TODO(contenu) : ces liens ne couvrent que la naturalisation, héritage de l'application
// sœur. Civique prépare aussi à la carte de séjour pluriannuelle et à la carte de résident :
// ajouter les fiches service-public.fr correspondantes.
export const URL_LIVRET_CITOYEN =
  'https://www.immigration.interieur.gouv.fr/documentation/guides-textes-et-brochures/livret-du-citoyen.html';
export const URL_DGEF = 'https://www.immigration.interieur.gouv.fr/';
export const URL_ANEF = 'https://administration-etrangers-en-france.interieur.gouv.fr/';
export const URL_SERVICE_PUBLIC_NATURALISATION =
  'https://www.service-public.fr/particuliers/vosdroits/N111';
export const URL_ANNUAIRE_PREFECTURES = 'https://lannuaire.service-public.fr/';

/**
 * Ouvre une adresse dans le navigateur du système. Un échec — aucun navigateur disponible,
 * adresse rejetée — est journalisé sans remonter en exception : ne pas pouvoir ouvrir un lien
 * n'a pas à interrompre l'utilisation de l'application.
 */
export function ouvrirLien(url: string) {
  Linking.openURL(url).catch((e: unknown) => console.warn('Ouverture du lien impossible', url, e));
}
