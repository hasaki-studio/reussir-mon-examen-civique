// src/config/quizz.ts
//
// Les trois parcours de l'application. Un seul corpus de questions les alimente : chaque
// question porte la liste des quizz auxquels elle s'applique (`applicable`), ce qui évite de
// tripler le contenu commun — l'essentiel des questions vaut pour les trois titres.
//
// ⚠️ Les clés `csp` / `cr` / `nat` sont écrites telles quelles dans la colonne `applicable`
// de la feuille de contenu, dans l'état stocké sur l'appareil et dans les événements
// Analytics. Les renommer invaliderait les trois à la fois.

import { couleurs } from '../theme/colors';

export type Quizz = 'csp' | 'cr' | 'nat';

/** Ordre d'affichage sur l'écran de sélection : du titre le plus courant au plus engageant. */
export const QUIZZ_ORDRE: readonly Quizz[] = ['csp', 'cr', 'nat'] as const;

type InfoQuizz = {
  /** Intitulé complet, affiché en titre d'écran. */
  nom: string;
  /** Intitulé court, pour les emplacements contraints (badge, fil d'ariane). */
  nomCourt: string;
  /** Une ligne sur ce que le titre permet — l'utilisateur ne sait pas toujours lequel le concerne. */
  sousTitre: string;
  couleur: string;
};

export const QUIZZ: Record<Quizz, InfoQuizz> = {
  csp: {
    nom: 'Carte de séjour pluriannuelle',
    nomCourt: 'Séjour pluriannuel',
    sousTitre: 'Titre de plusieurs années, après une première carte de séjour',
    couleur: couleurs.bleuNuit,
  },
  cr: {
    nom: 'Carte de résident',
    nomCourt: 'Résident',
    sousTitre: 'Titre de dix ans, renouvelable',
    couleur: couleurs.rouge,
  },
  nat: {
    nom: 'Naturalisation',
    nomCourt: 'Naturalisation',
    sousTitre: 'Acquisition de la nationalité française',
    couleur: couleurs.or,
  },
};

/**
 * Valide un paramètre d'URL. Les routes portent le quizz dans leur chemin (`/csp`, `/cr`,
 * `/nat`) : un lien profond forgé ou périmé peut donc apporter n'importe quelle chaîne, et
 * l'application doit y répondre par un retour à l'accueil plutôt que par un écran vide.
 */
export function estQuizz(valeur: string | undefined): valeur is Quizz {
  return valeur === 'csp' || valeur === 'cr' || valeur === 'nat';
}
