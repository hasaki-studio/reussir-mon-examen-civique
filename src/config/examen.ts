// src/config/examen.ts
//
// Format de l'examen blanc. Depuis le 1ᵉʳ janvier 2026, un examen civique conditionne la
// délivrance de la carte de séjour pluriannuelle, de la carte de résident et de la
// naturalisation.
//
// ⚠️ Les nombres ci-dessous — 40 questions dont 12 mises en situation, 32 bonnes réponses
// exigées — n'ont pas été recoupés
// avec service-public.fr. Ils sont pourtant présentés à l'utilisateur comme le format
// officiel. C'est la raison pour laquelle ils sont pilotables par Remote Config
// (`examen_nb_questions`, `examen_seuil_reussite`) : une erreur se corrige alors en quelques
// heures, sans republier l'application ni attendre une revue du Play Store.

// ⚙️ Nombre de questions tirées pour un examen blanc.
export const EXAMEN_NB_QUESTIONS_DEFAUT = 40;

// ⚙️ Nombre de bonnes réponses exigées sur EXAMEN_NB_QUESTIONS_DEFAUT.
export const EXAMEN_SEUIL_BONNES_DEFAUT = 32;

// ⚙️ Part de mises en situation dans l'examen : 12 sur 40, le reste étant des questions de
// connaissance. Une seule valeur pilotée plutôt que deux — le nombre de questions simples s'en
// déduit — pour qu'aucune saisie ne puisse produire un total différent de l'examen annoncé.
export const EXAMEN_NB_SITUATIONS_DEFAUT = 12;

// ⚙️ Examens blancs offerts par jour et par quizz. Au-delà : publicité avec récompense,
// ou Premium. C'est le levier de monétisation propre à Civique.
export const EXAMENS_GRATUITS_PAR_JOUR_DEFAUT = 1;

/**
 * Ce que l'écran de résultat verrouille derrière une publicité.
 *
 * - `aucun`  : tout est affiché librement.
 * - `revue`  : le score et le verdict s'affichent, la revue question par question attend la pub.
 * - `tout`   : rien n'est affiché avant la pub, score compris.
 *
 * ⚠️ `tout` verrouille la performance que l'utilisateur vient lui-même de produire, sans autre
 * issue que Premium — le scénario qui attire les avis à une étoile (« j'ai passé l'examen et on
 * me réclame une pub pour connaître ma note »). `revue` garde l'essentiel de la conversion — après
 * un échec, savoir *ce qu'on a raté* est ce qui motive — en ne monnayant qu'un ajout pédagogique
 * réel, pas un dû.
 *
 * Pilotable à distance (`resultat_verrouille`) : l'arbitrage se tranchera sur les chiffres du
 * test fermé (`pub_resultat_visionnee` rapporté à `examen_termine`), pas sur une intuition, et
 * sans republier.
 */
export type ResultatVerrouille = 'aucun' | 'revue' | 'tout';

export const RESULTAT_VERROUILLE_DEFAUT: ResultatVerrouille = 'revue';

/** Écarte une valeur Remote Config mal saisie plutôt que de verrouiller au hasard. */
export function normaliserResultatVerrouille(valeur: string): ResultatVerrouille {
  const v = valeur.trim().toLowerCase();
  return v === 'aucun' || v === 'revue' || v === 'tout' ? v : RESULTAT_VERROUILLE_DEFAUT;
}

/**
 * Seuil de réussite ramené au nombre de questions réellement posées.
 *
 * Tant que le contenu n'est pas complet, un quizz peut compter moins de 40 questions : le
 * tirage en pose alors moins, et un seuil fixe à 32 serait mathématiquement inatteignable —
 * l'examen blanc afficherait un échec systématique. On conserve donc la proportion officielle
 * (32/40, soit 80 %) plutôt que le nombre brut, arrondie au supérieur pour ne jamais être
 * plus indulgent que l'examen réel.
 */
export function seuilReussite(
  nbQuestionsPosees: number,
  nbQuestionsReference: number,
  seuilReference: number
): number {
  if (nbQuestionsPosees >= nbQuestionsReference) return seuilReference;
  return Math.ceil((nbQuestionsPosees * seuilReference) / nbQuestionsReference);
}
