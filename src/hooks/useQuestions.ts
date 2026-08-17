// src/hooks/useQuestions.ts
import { useEffect, useState } from 'react';
import { ecouterQuestions, Question } from '../../services/firebase';

type UseQuestionsResult = {
  questions: Question[];
  chargement: boolean;
  erreur: Error | null;
};

/**
 * Écoute le corpus complet, tous quizz confondus. Les grandeurs dérivées — palier maximal,
 * thèmes, paliers — dépendent du quizz consulté et vivent donc dans `useQuestionsQuizz`.
 */
export function useQuestions(): UseQuestionsResult {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<Error | null>(null);

  useEffect(() => {
    const desabonner = ecouterQuestions(
      (data) => {
        setQuestions(data);
        setChargement(false);
      },
      (err) => {
        setErreur(err);
        setChargement(false);
      }
    );
    return () => desabonner();
  }, []);

  return { questions, chargement, erreur };
}
