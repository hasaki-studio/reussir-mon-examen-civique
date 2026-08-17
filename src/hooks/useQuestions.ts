// src/hooks/useQuestions.ts
import { useEffect, useMemo, useState } from 'react';
import { ecouterQuestions, Question } from '../../services/firebase';

type UseQuestionsResult = {
  questions: Question[];
  chargement: boolean;
  erreur: Error | null;
  palierMax: number;
  themes: string[];
  paliers: number[];
};

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

  const palierMax = useMemo(() => {
    if (questions.length === 0) return 1;
    return Math.max(...questions.map((q) => q.palier));
  }, [questions]);

  const themes = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.theme)));
  }, [questions]);

  const paliers = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.palier))).sort((a, b) => a - b);
  }, [questions]);

  return { questions, chargement, erreur, palierMax, themes, paliers };
}