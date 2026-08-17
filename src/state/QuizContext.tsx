import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { Question } from '../../services/firebase';

type ModeSession = 'aleatoire' | 'theme' | 'palier';

type SessionQuiz = {
  mode: ModeSession;
  valeur?: string | number;
  liste: Question[];
  index: number;
  naviguationLibre: boolean;
  ensembleFiltre: Question[];
};

export function melanger<T>(tableau: T[]): T[] {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

type QuizContextValue = {
  sessionQuiz: SessionQuiz | null;
  demarrerSession: (
    mode: ModeSession,
    valeur: string | number | undefined,
    liste: Question[],
    naviguationLibre: boolean,
    ensembleFiltre: Question[]
  ) => void;
  changerQuestion: (delta: number) => void;
};

const QuizContext = createContext<QuizContextValue | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [sessionQuiz, setSessionQuiz] = useState<SessionQuiz | null>(null);

  const demarrerSession = useCallback(
    (
      mode: ModeSession,
      valeur: string | number | undefined,
      liste: Question[],
      naviguationLibre: boolean,
      ensembleFiltre: Question[]
    ) => {
      setSessionQuiz({ mode, valeur, liste, index: 0, naviguationLibre, ensembleFiltre });
    },
    []
  );

  const changerQuestion = useCallback((delta: number) => {
    setSessionQuiz((s) => {
      if (!s) return s;
      if (delta === 1 && s.naviguationLibre) {
        const liste = s.liste.slice(0, s.index + 1);
        const courante = liste[s.index];
        let pool = s.ensembleFiltre.filter((q) => q.id !== courante.id);
        if (pool.length === 0) pool = s.ensembleFiltre;
        const suivante = pool[Math.floor(Math.random() * pool.length)];
        liste.push(suivante);
        return { ...s, liste, index: s.index + 1 };
      }
      return { ...s, index: s.index + delta };
    });
  }, []);

  return (
    <QuizContext.Provider value={{ sessionQuiz, demarrerSession, changerQuestion }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz doit être utilisé à l'intérieur de <QuizProvider>");
  return ctx;
}
