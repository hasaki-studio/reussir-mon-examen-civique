// src/utils/filtresQuestions.ts
import { Question } from '../../services/firebase';
import type { Quizz } from '../config/quizz';

/**
 * Restreint le corpus commun aux questions valables pour un quizz donné.
 * S'applique en premier : tous les autres filtres travaillent sur son résultat.
 */
export function questionsDuQuizz(questions: Question[], quizz: Quizz): Question[] {
  return questions.filter((q) => q.applicable.includes(quizz));
}

/**
 * Ne garde qu'une variante par groupe.
 *
 * Deux variantes d'une même question — même énoncé, propositions plus dures pour la carte de
 * résident ou la naturalisation — ne doivent jamais tomber ensemble : l'utilisateur croirait à
 * un bug, et en examen la seconde serait offerte par la première. Les `applicable` disjoints
 * l'empêchent déjà en théorie ; ceci le garantit même si la feuille comporte un doublon, ce
 * qu'aucune validation de tableur ne rend impossible.
 *
 * La variante conservée est la première rencontrée : au sein d'un quizz, les autres n'ont de
 * toute façon rien à y faire.
 */
export function dedupliquerParGroupe(questions: Question[]): Question[] {
  const vus = new Set<string>();
  return questions.filter((q) => {
    // `|| q.id` et non `?? q.id` : une cellule `groupe` vide arrive en chaîne vide, pas en
    // undefined. Avec `??`, toutes les questions sans variante partageraient la clé '' et le
    // tirage n'en retiendrait qu'une — un examen d'une seule question, sans erreur visible.
    const cle = q.groupe || q.id;
    if (vus.has(cle)) return false;
    vus.add(cle);
    return true;
  });
}

export function questionsDebloquees(
  questions: Question[],
  palierUtilisateur: number,
  premium: boolean
): Question[] {
  return premium ? questions : questions.filter((q) => q.palier <= palierUtilisateur);
}

export function questionsParTheme(
  questions: Question[],
  theme: string,
  palierUtilisateur: number,
  premium: boolean
): Question[] {
  return questionsDebloquees(questions, palierUtilisateur, premium).filter((q) => q.theme === theme);
}

export function questionsParPalier(questions: Question[], palier: number): Question[] {
  // le mode "par palier" affiche tout le palier une fois débloqué —
  // l'appelant doit avoir déjà vérifié que ce palier est accessible avant d'appeler cette fonction
  return questions.filter((q) => q.palier === palier);
}