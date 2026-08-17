// src/hooks/useQuestionsQuizz.ts
import { useMemo } from 'react';
import { Question } from '../../services/firebase';
import { useQuestionsContext } from '../state/QuestionsContext';
import { questionsDuQuizz } from '../utils/filtresQuestions';
import type { Quizz } from '../config/quizz';

type UseQuestionsQuizzResult = {
  questions: Question[];
  palierMax: number;
  themes: string[];
  paliers: number[];
};

/**
 * Sous-ensemble du corpus applicable à un quizz, et ses grandeurs dérivées.
 *
 * `palierMax` se recalcule ici plutôt que d'être une constante : deux quizz n'ont aucune
 * raison de compter le même nombre de paliers, puisqu'ils ne partagent qu'une partie du
 * contenu. Le figer, c'est promettre à l'utilisateur une progression qui n'existe pas.
 */
export function useQuestionsQuizz(quizz: Quizz): UseQuestionsQuizzResult {
  const { questions } = useQuestionsContext();

  return useMemo(() => {
    const liste = questionsDuQuizz(questions, quizz);
    return {
      questions: liste,
      // 1 et non 0 quand le corpus est vide : le palier de départ de l'utilisateur est 1, et un
      // maximum inférieur ferait afficher « palier 1 sur 0 ».
      palierMax: liste.length === 0 ? 1 : Math.max(...liste.map((q) => q.palier)),
      themes: Array.from(new Set(liste.map((q) => q.theme))),
      paliers: Array.from(new Set(liste.map((q) => q.palier))).sort((a, b) => a - b),
    };
  }, [questions, quizz]);
}
