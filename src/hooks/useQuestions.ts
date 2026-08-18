// src/hooks/useQuestions.ts
import { useEffect, useState } from 'react';
import { ecouterQuestions, Question } from '../../services/firebase';
import { QUESTIONS_DEMO, QUESTIONS_DEMO_ACTIVES } from '../config/questionsDemo';

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
    // Contenu local en développement : permet d'essayer l'application — et surtout le mode
    // examen, qui ne peut rien montrer sans questions — avant que Firestore soit alimenté.
    // Impossible en release, `QUESTIONS_DEMO_ACTIVES` étant conditionné à __DEV__.
    if (QUESTIONS_DEMO_ACTIVES) {
      console.warn(
        `Contenu de démonstration actif (${QUESTIONS_DEMO.length} questions) — Firestore n'est pas lu. ` +
          'Voir src/config/questionsDemo.ts.'
      );
      setQuestions(QUESTIONS_DEMO);
      setChargement(false);
      return;
    }

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
