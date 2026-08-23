// src/state/ConsentementContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appliquerConsentementAnalytics } from '../services/analytics';

export type Consentement = 'accepte' | 'refuse';

const STORAGE_KEY_CONSENTEMENT = '@consentement-civique';

type ConsentementContextValue = {
  // null tant que l'utilisateur n'a pas fait de choix (premier lancement).
  consentement: Consentement | null;
  // Passe à true une fois la valeur stockée lue (évite d'afficher l'écran avant de savoir).
  pretConsentement: boolean;
  definirConsentement: (valeur: Consentement) => void;
  // Efface le choix (utilisé par le bouton de reset en dev) : réaffiche l'écran de consentement.
  reinitialiserConsentement: () => void;
};

const ConsentementContext = createContext<ConsentementContextValue | undefined>(undefined);

export function ConsentementProvider({ children }: { children: ReactNode }) {
  const [consentement, setConsentement] = useState<Consentement | null>(null);
  const [pretConsentement, setPretConsentement] = useState(false);

  useEffect(() => {
    // Par sécurité, la collecte est coupée immédiatement, avant même la lecture du stockage.
    appliquerConsentementAnalytics(false);
    (async () => {
      try {
        const brut = await AsyncStorage.getItem(STORAGE_KEY_CONSENTEMENT);
        const valeur: Consentement | null =
          brut === 'accepte' || brut === 'refuse' ? brut : null;
        setConsentement(valeur);
        appliquerConsentementAnalytics(valeur === 'accepte');
      } catch (e) {
        console.warn('Lecture consentement impossible', e);
      } finally {
        setPretConsentement(true);
      }
    })();
  }, []);

  const definirConsentement = useCallback((valeur: Consentement) => {
    setConsentement(valeur);
    appliquerConsentementAnalytics(valeur === 'accepte');
    AsyncStorage.setItem(STORAGE_KEY_CONSENTEMENT, valeur).catch((e: unknown) =>
      console.warn('Sauvegarde consentement impossible', e)
    );
  }, []);

  const reinitialiserConsentement = useCallback(() => {
    setConsentement(null);
    appliquerConsentementAnalytics(false);
    AsyncStorage.removeItem(STORAGE_KEY_CONSENTEMENT).catch((e: unknown) =>
      console.warn('Réinitialisation consentement impossible', e)
    );
  }, []);

  const value = useMemo(
    () => ({ consentement, pretConsentement, definirConsentement, reinitialiserConsentement }),
    [consentement, pretConsentement, definirConsentement, reinitialiserConsentement]
  );

  return <ConsentementContext.Provider value={value}>{children}</ConsentementContext.Provider>;
}

export function useConsentement(): ConsentementContextValue {
  const ctx = useContext(ConsentementContext);
  if (!ctx) throw new Error("useConsentement doit être utilisé à l'intérieur de <ConsentementProvider>");
  return ctx;
}
