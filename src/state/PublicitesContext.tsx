// src/state/PublicitesContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initialiserPublicites } from '../services/ads';

type PublicitesContextValue = {
  // null tant que le parcours de consentement publicitaire (UMP) n'a pas abouti.
  publicitesAutorisees: boolean | null;
};

const PublicitesContext = createContext<PublicitesContextValue>({ publicitesAutorisees: null });

export function PublicitesProvider({ children }: { children: ReactNode }) {
  const [publicitesAutorisees, setPublicitesAutorisees] = useState<boolean | null>(null);

  useEffect(() => {
    let annule = false;
    initialiserPublicites().then((autorisees) => {
      if (!annule) setPublicitesAutorisees(autorisees);
    });
    return () => {
      annule = true;
    };
  }, []);

  return (
    <PublicitesContext.Provider value={{ publicitesAutorisees }}>
      {children}
    </PublicitesContext.Provider>
  );
}

export function usePublicites(): PublicitesContextValue {
  return useContext(PublicitesContext);
}
