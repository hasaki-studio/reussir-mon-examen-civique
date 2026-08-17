// src/state/EtatContext.tsx
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
import { STORAGE_KEY_ETAT } from '../config/monetisation';
import { logPalierDebloque, logPurchase } from '../services/analytics';

type CompteurJour = { date: string | null; count: number };

type EtatUtilisateur = {
  palier: number;
  premium: boolean;
  bonusDebloques: string[]; // Question.id est un string (id du doc Firestore)
  sessionsDetailAujourdhui: CompteurJour;
  bonusGratuitsAujourdhui: CompteurJour;
};

const ETAT_PAR_DEFAUT: EtatUtilisateur = {
  palier: 1,
  premium: false,
  bonusDebloques: [],
  sessionsDetailAujourdhui: { date: null, count: 0 },
  bonusGratuitsAujourdhui: { date: null, count: 0 },
};

function cleDuJour(): string {
  return new Date().toISOString().slice(0, 10);
}

type EtatContextValue = {
  etat: EtatUtilisateur;
  pretChargement: boolean;
  debloquerPalierSuivant: (palierMax: number, seuilDeblocageTheme: number) => void;
  activerPremium: (palierMax: number, transactionId: string) => void;
  debloquerBonus: (questionId: string) => void;
  sessionDetailGratuiteDisponible: (sessionsGratuitesParJour: number) => boolean;
  sessionsDetailRestantes: (sessionsGratuitesParJour: number) => number;
  consommerSessionDetailGratuite: () => void;
  bonusGratuitDisponible: (bonusGratuitsParJour: number) => boolean;
  bonusGratuitsRestants: (bonusGratuitsParJour: number) => number;
  consommerBonusGratuit: () => void;
  reinitialiser: () => void;
};

const EtatContext = createContext<EtatContextValue | undefined>(undefined);

export function EtatProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<EtatUtilisateur>(ETAT_PAR_DEFAUT);
  const [pretChargement, setPretChargement] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const brut = await AsyncStorage.getItem(STORAGE_KEY_ETAT);
        if (brut) {
          setEtat({ ...ETAT_PAR_DEFAUT, ...JSON.parse(brut) });
        }
      } catch (e) {
        console.warn('Lecture etat impossible, valeurs par défaut utilisées', e);
      } finally {
        setPretChargement(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!pretChargement) return;
    AsyncStorage.setItem(STORAGE_KEY_ETAT, JSON.stringify(etat)).catch((e:unknown) =>
      console.warn('Sauvegarde etat impossible', e)
    );
  }, [etat, pretChargement]);

  const debloquerPalierSuivant = useCallback((palierMax: number, seuilDeblocageTheme: number) => {
    setEtat((e) => {
      if (e.palier >= palierMax) return e;
      const palierApres = e.palier + 1;
      logPalierDebloque({
        palierAvant: e.palier,
        palierApres,
        palierMax,
        themeDebloque: e.palier < seuilDeblocageTheme && palierApres >= seuilDeblocageTheme,
      });
      return { ...e, palier: palierApres };
    });
  }, []);

  const activerPremium = useCallback((palierMax: number, transactionId: string) => {
    setEtat((e) => {
      // Idempotent : un achat restauré ou rejoué (relance app, listener dupliqué) ne doit
      // ni re-logger un événement d'achat ni re-déclencher d'effet de bord.
      if (e.premium) return e;
      logPurchase({ transactionId });
      return { ...e, premium: true, palier: palierMax };
    });
  }, []);

  const debloquerBonus = useCallback((questionId: string) => {
    setEtat((e) =>
      e.bonusDebloques.includes(questionId)
        ? e
        : { ...e, bonusDebloques: [...e.bonusDebloques, questionId] }
    );
  }, []);

  const sessionDetailGratuiteDisponible = useCallback(
    (sessionsGratuitesParJour: number): boolean => {
      if (etat.premium) return true;
      const { date, count } = etat.sessionsDetailAujourdhui;
      if (date !== cleDuJour()) return true;
      return count < sessionsGratuitesParJour;
    },
    [etat.premium, etat.sessionsDetailAujourdhui]
  );

  const sessionsDetailRestantes = useCallback(
    (sessionsGratuitesParJour: number): number => {
      const { date, count } = etat.sessionsDetailAujourdhui;
      const compteurActuel = date === cleDuJour() ? count : 0;
      return Math.max(0, sessionsGratuitesParJour - compteurActuel);
    },
    [etat.sessionsDetailAujourdhui]
  );

  const consommerSessionDetailGratuite = useCallback(() => {
    setEtat((e) => {
      const aujourdhui = cleDuJour();
      const compteurActuel =
        e.sessionsDetailAujourdhui.date === aujourdhui ? e.sessionsDetailAujourdhui.count : 0;
      return {
        ...e,
        sessionsDetailAujourdhui: { date: aujourdhui, count: compteurActuel + 1 },
      };
    });
  }, []);

  const bonusGratuitDisponible = useCallback(
    (bonusGratuitsParJour: number): boolean => {
      if (etat.premium) return true;
      const { date, count } = etat.bonusGratuitsAujourdhui;
      const compteurActuel = date === cleDuJour() ? count : 0;
      return compteurActuel < bonusGratuitsParJour;
    },
    [etat.premium, etat.bonusGratuitsAujourdhui]
  );

  const bonusGratuitsRestants = useCallback(
    (bonusGratuitsParJour: number): number => {
      const { date, count } = etat.bonusGratuitsAujourdhui;
      const compteurActuel = date === cleDuJour() ? count : 0;
      return Math.max(0, bonusGratuitsParJour - compteurActuel);
    },
    [etat.bonusGratuitsAujourdhui]
  );

  const consommerBonusGratuit = useCallback(() => {
    setEtat((e) => {
      const aujourdhui = cleDuJour();
      const compteurActuel =
        e.bonusGratuitsAujourdhui.date === aujourdhui ? e.bonusGratuitsAujourdhui.count : 0;
      return {
        ...e,
        bonusGratuitsAujourdhui: { date: aujourdhui, count: compteurActuel + 1 },
      };
    });
  }, []);

  const reinitialiser = useCallback(() => {
    setEtat(ETAT_PAR_DEFAUT);
  }, []);

  const value = useMemo(
    () => ({
      etat,
      pretChargement,
      debloquerPalierSuivant,
      activerPremium,
      debloquerBonus,
      sessionDetailGratuiteDisponible,
      sessionsDetailRestantes,
      consommerSessionDetailGratuite,
      bonusGratuitDisponible,
      bonusGratuitsRestants,
      consommerBonusGratuit,
      reinitialiser,
    }),
    [
      etat,
      pretChargement,
      debloquerPalierSuivant,
      activerPremium,
      debloquerBonus,
      sessionDetailGratuiteDisponible,
      sessionsDetailRestantes,
      consommerSessionDetailGratuite,
      bonusGratuitDisponible,
      bonusGratuitsRestants,
      consommerBonusGratuit,
      reinitialiser,
    ]
  );

  return <EtatContext.Provider value={value}>{children}</EtatContext.Provider>;
}

export function useEtat(): EtatContextValue {
  const ctx = useContext(EtatContext);
  if (!ctx) throw new Error("useEtat doit être utilisé à l'intérieur de <EtatProvider>");
  return ctx;
}