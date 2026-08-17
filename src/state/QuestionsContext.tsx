import React, { createContext, useContext, ReactNode } from 'react';
import { useQuestions } from '../hooks/useQuestions';

type QuestionsContextValue = ReturnType<typeof useQuestions>;

const QuestionsContext = createContext<QuestionsContextValue | undefined>(undefined);

export function QuestionsProvider({ children }: { children: ReactNode }) {
  const value = useQuestions();
  return <QuestionsContext.Provider value={value}>{children}</QuestionsContext.Provider>;
}

export function useQuestionsContext(): QuestionsContextValue {
  const ctx = useContext(QuestionsContext);
  if (!ctx) throw new Error("useQuestionsContext doit être utilisé à l'intérieur de <QuestionsProvider>");
  return ctx;
}
