import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { Question } from '../../services/firebase';
import type { Quizz } from '../config/quizz';

export type ModeSession = 'revision' | 'theme' | 'palier' | 'examen';

export type ReponseDonnee = {
  questionId: string;
  /** Index choisi dans `Question.choix`. */
  choisi: number;
  correct: boolean;
};

export type SessionQuiz = {
  quizz: Quizz;
  mode: ModeSession;
  /** Thème ou palier d'origine, pour l'étiquetage et le retour à la bonne liste. */
  valeur?: string | number;
  liste: Question[];
  index: number;
  reponses: ReponseDonnee[];
  /** Passe à true quand la dernière question a été dépassée. */
  terminee: boolean;
};

type QuizContextValue = {
  sessionQuiz: SessionQuiz | null;
  demarrerSession: (params: {
    quizz: Quizz;
    mode: ModeSession;
    valeur?: string | number;
    liste: Question[];
    /** Index de départ, pour une session ouverte depuis une question précise de la liste. */
    depart?: number;
  }) => void;
  /** Enregistre la réponse à la question courante. Sans effet si elle a déjà été répondue. */
  repondre: (choisi: number) => void;
  questionSuivante: () => void;
  terminerSession: () => void;
  /** Réponse déjà donnée à la question courante, ou undefined. */
  reponseCourante: ReponseDonnee | undefined;
  score: number;
};

const QuizContext = createContext<QuizContextValue | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [sessionQuiz, setSessionQuiz] = useState<SessionQuiz | null>(null);

  const demarrerSession = useCallback<QuizContextValue['demarrerSession']>(
    ({ quizz, mode, valeur, liste, depart = 0 }) => {
      setSessionQuiz({
        quizz,
        mode,
        valeur,
        liste,
        index: Math.min(Math.max(0, depart), Math.max(0, liste.length - 1)),
        reponses: [],
        terminee: false,
      });
    },
    []
  );

  const repondre = useCallback((choisi: number) => {
    setSessionQuiz((s) => {
      if (!s) return s;
      const question = s.liste[s.index];
      if (!question) return s;
      // Une question déjà répondue ne se rejoue pas : les propositions sont désactivées à
      // l'écran, mais un double appui peut arriver avant le rendu suivant, et compterait deux
      // fois dans le score d'un examen.
      if (s.reponses.some((r) => r.questionId === question.id)) return s;
      return {
        ...s,
        reponses: [
          ...s.reponses,
          { questionId: question.id, choisi, correct: choisi === question.bonne },
        ],
      };
    });
  }, []);

  const questionSuivante = useCallback(() => {
    setSessionQuiz((s) => {
      if (!s) return s;
      // Aucun retour en arrière n'est proposé, dans aucun mode : en examen parce que le format
      // réel ne le permet pas, en révision par cohérence — une correction déjà affichée ne se
      // révise pas une seconde fois.
      if (s.index >= s.liste.length - 1) return { ...s, terminee: true };
      return { ...s, index: s.index + 1 };
    });
  }, []);

  const terminerSession = useCallback(() => setSessionQuiz(null), []);

  const reponseCourante = useMemo(() => {
    if (!sessionQuiz) return undefined;
    const question = sessionQuiz.liste[sessionQuiz.index];
    if (!question) return undefined;
    return sessionQuiz.reponses.find((r) => r.questionId === question.id);
  }, [sessionQuiz]);

  const score = useMemo(
    () => (sessionQuiz ? sessionQuiz.reponses.filter((r) => r.correct).length : 0),
    [sessionQuiz]
  );

  const value = useMemo(
    () => ({
      sessionQuiz,
      demarrerSession,
      repondre,
      questionSuivante,
      terminerSession,
      reponseCourante,
      score,
    }),
    [sessionQuiz, demarrerSession, repondre, questionSuivante, terminerSession, reponseCourante, score]
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz doit être utilisé à l'intérieur de <QuizProvider>");
  return ctx;
}
