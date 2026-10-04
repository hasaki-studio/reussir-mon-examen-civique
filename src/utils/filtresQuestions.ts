// src/utils/filtresQuestions.ts
import { Question } from '../../services/firebase';
import type { Quizz } from '../config/quizz';

/**
 * Restreint le corpus aux questions d'un quizz. Le contenu étant cloisonné — une question
 * appartient à un seul quizz — ce filtre s'applique en premier, et tous les autres travaillent
 * sur son résultat.
 */
export function questionsDuQuizz(questions: Question[], quizz: Quizz): Question[] {
  return questions.filter((q) => q.quizz === quizz);
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