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
