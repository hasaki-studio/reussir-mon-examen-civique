// src/state/PublicitesContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { initialiserPublicites, ouvrirPreferencesPublicitaires } from '../services/ads';

type PublicitesContextValue = {
  // null tant que le parcours de consentement publicitaire (UMP) n'a pas abouti.
  publicitesAutorisees: boolean | null;
  /**
   * Rouvre le formulaire de préférences publicitaires et répercute le choix fait dedans sur
   * `publicitesAutorisees`. Sans ce passage par le contexte, revenir sur son consentement
   * n'aurait aucun effet : `publicitesAutorisees` était jusqu'ici lu une seule fois, au tout
   * premier lancement, puis jamais raffraîchi.
   */
  rafraichirPreferencesPublicitaires: () => Promise<void>;
};

const valeurParDefaut: PublicitesContextValue = {
  publicitesAutorisees: null,
  rafraichirPreferencesPublicitaires: async () => {},
};

const PublicitesContext = createContext<PublicitesContextValue>(valeurParDefaut);

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

  const rafraichirPreferencesPublicitaires = useCallback(async () => {
    const autorisees = await ouvrirPreferencesPublicitaires();
    // `null` : le formulaire n'a pas pu s'ouvrir (voir ads.ts) — on laisse l'état tel quel
    // plutôt que de le remplacer par une valeur qu'on ne connaît pas réellement.
    if (autorisees !== null) setPublicitesAutorisees(autorisees);
  }, []);

  const value = useMemo(
    () => ({ publicitesAutorisees, rafraichirPreferencesPublicitaires }),
    [publicitesAutorisees, rafraichirPreferencesPublicitaires]
  );

  return <PublicitesContext.Provider value={value}>{children}</PublicitesContext.Provider>;
}

export function usePublicites(): PublicitesContextValue {
  return useContext(PublicitesContext);
}
