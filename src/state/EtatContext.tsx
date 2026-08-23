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
import { QUIZZ_ORDRE, type Quizz } from '../config/quizz';
import { logPalierDebloque, logPurchase } from '../services/analytics';

type CompteurJour = { date: string | null; count: number };

export type ResultatExamen = {
  /** Jour de passage, au format AAAA-MM-JJ. */
  date: string;
  score: number;
  total: number;
  seuil: number;
  reussi: boolean;
};

type EtatQuizz = {
  palier: number;
  sessionsDetailAujourdhui: CompteurJour;
  examensAujourdhui: CompteurJour;
  // Indépendant d'examensAujourdhui : un examen peut être gratuit sans que sa revue le soit —
  // voir REVUES_GRATUITES_PAR_JOUR_DEFAUT dans config/examen.ts.
  revuesAujourdhui: CompteurJour;
  derniersResultats: ResultatExamen[];
};

type EtatUtilisateur = {
  // Premium à la racine, et non par quizz : un achat débloque les trois, Google Play
  // rattachant de toute façon un achat à une application et non à un contenu.
  premium: boolean;
  parQuizz: Record<Quizz, EtatQuizz>;
};

// Au-delà, l'historique n'apprend plus rien à l'utilisateur et grossit indéfiniment un objet
// relu à chaque démarrage.
const MAX_RESULTATS_CONSERVES = 10;

function etatQuizzParDefaut(): EtatQuizz {
  return {
    palier: 1,
    sessionsDetailAujourdhui: { date: null, count: 0 },
    examensAujourdhui: { date: null, count: 0 },
    revuesAujourdhui: { date: null, count: 0 },
    derniersResultats: [],
  };
}

function etatParDefaut(): EtatUtilisateur {
  return {
    premium: false,
    parQuizz: QUIZZ_ORDRE.reduce(
      (acc, quizz) => ({ ...acc, [quizz]: etatQuizzParDefaut() }),
      {} as Record<Quizz, EtatQuizz>
    ),
  };
}

/**
 * Reconstruit un état complet à partir de ce qui a été relu du stockage.
 *
 * Une fusion superficielle (`{ ...defaut, ...relu }`) suffisait quand l'état était plat ; elle
 * ne suffit plus : elle accepterait un `parQuizz` incomplet — un quizz ajouté depuis, un objet
 * tronqué par une écriture interrompue — et l'application planterait plus tard, à la première
 * lecture d'une propriété absente. On reconstruit donc quizz par quizz.
 */
function fusionner(brut: unknown): EtatUtilisateur {
  const defaut = etatParDefaut();
  if (typeof brut !== 'object' || brut === null) return defaut;
  const relu = brut as Partial<EtatUtilisateur>;
  const parQuizzRelu = (relu.parQuizz ?? {}) as Partial<Record<Quizz, Partial<EtatQuizz>>>;

  return {
    premium: relu.premium === true,
    parQuizz: QUIZZ_ORDRE.reduce((acc, quizz) => {
      acc[quizz] = { ...etatQuizzParDefaut(), ...(parQuizzRelu[quizz] ?? {}) };
      return acc;
    }, {} as Record<Quizz, EtatQuizz>),
  };
}

function cleDuJour(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Compteur du jour, remis à zéro dès que la date stockée n'est plus celle d'aujourd'hui. */
function compteurDuJour(compteur: CompteurJour): number {
  return compteur.date === cleDuJour() ? compteur.count : 0;
}

type EtatContextValue = {
  etat: EtatUtilisateur;
  pretChargement: boolean;
  etatQuizz: (quizz: Quizz) => EtatQuizz;
  debloquerPalierSuivant: (quizz: Quizz, palierMax: number, seuilDeblocageTheme: number) => void;
  activerPremium: (transactionId: string, valeurAchat?: number, devise?: string) => void;
  sessionDetailGratuiteDisponible: (quizz: Quizz, sessionsGratuitesParJour: number) => boolean;
  sessionsDetailRestantes: (quizz: Quizz, sessionsGratuitesParJour: number) => number;
  consommerSessionDetailGratuite: (quizz: Quizz) => void;
  examenGratuitDisponible: (quizz: Quizz, examensGratuitsParJour: number) => boolean;
  examensRestants: (quizz: Quizz, examensGratuitsParJour: number) => number;
  consommerExamenGratuit: (quizz: Quizz) => void;
  /** Vrai tant que le quota de revues gratuites du jour n'est pas épuisé. Toujours vrai en Premium. */
  revueGratuiteDisponible: (quizz: Quizz, revuesGratuitesParJour: number) => boolean;
  consommerRevueGratuite: (quizz: Quizz) => void;
  enregistrerResultatExamen: (quizz: Quizz, resultat: ResultatExamen) => void;
  reinitialiser: () => void;
};

const EtatContext = createContext<EtatContextValue | undefined>(undefined);

export function EtatProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<EtatUtilisateur>(etatParDefaut);
  const [pretChargement, setPretChargement] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const brut = await AsyncStorage.getItem(STORAGE_KEY_ETAT);
        if (brut) setEtat(fusionner(JSON.parse(brut)));
      } catch (e) {
        console.warn('Lecture etat impossible, valeurs par défaut utilisées', e);
      } finally {
        setPretChargement(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!pretChargement) return;
    AsyncStorage.setItem(STORAGE_KEY_ETAT, JSON.stringify(etat)).catch((e: unknown) =>
      console.warn('Sauvegarde etat impossible', e)
    );
  }, [etat, pretChargement]);

  /** Applique une transformation à un seul quizz, en laissant les deux autres intacts. */
  const majQuizz = useCallback((quizz: Quizz, transformer: (e: EtatQuizz) => EtatQuizz) => {
    setEtat((precedent) => ({
      ...precedent,
      parQuizz: { ...precedent.parQuizz, [quizz]: transformer(precedent.parQuizz[quizz]) },
    }));
  }, []);

  const etatQuizz = useCallback((quizz: Quizz) => etat.parQuizz[quizz], [etat.parQuizz]);

  const debloquerPalierSuivant = useCallback(
    (quizz: Quizz, palierMax: number, seuilDeblocageTheme: number) => {
      majQuizz(quizz, (e) => {
        if (e.palier >= palierMax) return e;
        const palierApres = e.palier + 1;
        const seuil = Math.min(seuilDeblocageTheme, palierMax);
        logPalierDebloque({
          palierAvant: e.palier,
          palierApres,
          palierMax,
          themeDebloque: e.palier < seuil && palierApres >= seuil,
        });
        return { ...e, palier: palierApres };
      });
    },
    [majQuizz]
  );

  const activerPremium = useCallback(
    (transactionId: string, valeurAchat?: number, devise?: string) => {
      setEtat((precedent) => {
        // Idempotent : un achat restauré ou rejoué (relance app, listener dupliqué) ne doit
        // ni re-logger un événement d'achat ni re-déclencher d'effet de bord.
        if (precedent.premium) return precedent;
        logPurchase({ transactionId, valeur: valeurAchat, devise });
        return { ...precedent, premium: true };
      });
      // Le palier n'est volontairement pas poussé au maximum : « premium ⇒ tout est
      // accessible » est appliqué par les filtres, à la lecture. Écrire le palier maximal dans
      // l'état le figerait au contenu du jour de l'achat, et le contenu ajouté ensuite
      // apparaîtrait verrouillé à quelqu'un qui a précisément payé pour ne plus l'être.
    },
    []
  );

  const sessionDetailGratuiteDisponible = useCallback(
    (quizz: Quizz, sessionsGratuitesParJour: number): boolean => {
      if (etat.premium) return true;
      return compteurDuJour(etat.parQuizz[quizz].sessionsDetailAujourdhui) < sessionsGratuitesParJour;
    },
    [etat.premium, etat.parQuizz]
  );

  const sessionsDetailRestantes = useCallback(
    (quizz: Quizz, sessionsGratuitesParJour: number): number =>
      Math.max(
        0,
        sessionsGratuitesParJour - compteurDuJour(etat.parQuizz[quizz].sessionsDetailAujourdhui)
      ),
    [etat.parQuizz]
  );

  const consommerSessionDetailGratuite = useCallback(
    (quizz: Quizz) => {
      majQuizz(quizz, (e) => ({
        ...e,
        sessionsDetailAujourdhui: {
          date: cleDuJour(),
          count: compteurDuJour(e.sessionsDetailAujourdhui) + 1,
        },
      }));
    },
    [majQuizz]
  );

  const examenGratuitDisponible = useCallback(
    (quizz: Quizz, examensGratuitsParJour: number): boolean => {
      if (etat.premium) return true;
      return compteurDuJour(etat.parQuizz[quizz].examensAujourdhui) < examensGratuitsParJour;
    },
    [etat.premium, etat.parQuizz]
  );

  const examensRestants = useCallback(
    (quizz: Quizz, examensGratuitsParJour: number): number =>
      Math.max(0, examensGratuitsParJour - compteurDuJour(etat.parQuizz[quizz].examensAujourdhui)),
    [etat.parQuizz]
  );

  const consommerExamenGratuit = useCallback(
    (quizz: Quizz) => {
      majQuizz(quizz, (e) => ({
        ...e,
        examensAujourdhui: { date: cleDuJour(), count: compteurDuJour(e.examensAujourdhui) + 1 },
      }));
    },
    [majQuizz]
  );

  const revueGratuiteDisponible = useCallback(
    (quizz: Quizz, revuesGratuitesParJour: number): boolean => {
      if (etat.premium) return true;
      return compteurDuJour(etat.parQuizz[quizz].revuesAujourdhui) < revuesGratuitesParJour;
    },
    [etat.premium, etat.parQuizz]
  );

  const consommerRevueGratuite = useCallback(
    (quizz: Quizz) => {
      majQuizz(quizz, (e) => ({
        ...e,
        revuesAujourdhui: { date: cleDuJour(), count: compteurDuJour(e.revuesAujourdhui) + 1 },
      }));
    },
    [majQuizz]
  );

  const enregistrerResultatExamen = useCallback(
    (quizz: Quizz, resultat: ResultatExamen) => {
      majQuizz(quizz, (e) => ({
        ...e,
        derniersResultats: [resultat, ...e.derniersResultats].slice(0, MAX_RESULTATS_CONSERVES),
      }));
    },
    [majQuizz]
  );

  const reinitialiser = useCallback(() => {
    setEtat(etatParDefaut());
  }, []);

  const value = useMemo(
    () => ({
      etat,
      pretChargement,
      etatQuizz,
      debloquerPalierSuivant,
      activerPremium,
      sessionDetailGratuiteDisponible,
      sessionsDetailRestantes,
      consommerSessionDetailGratuite,
      examenGratuitDisponible,
      examensRestants,
      consommerExamenGratuit,
      revueGratuiteDisponible,
      consommerRevueGratuite,
      enregistrerResultatExamen,
      reinitialiser,
    }),
    [
      etat,
      pretChargement,
      etatQuizz,
      debloquerPalierSuivant,
      activerPremium,
      sessionDetailGratuiteDisponible,
      sessionsDetailRestantes,
      consommerSessionDetailGratuite,
      examenGratuitDisponible,
      examensRestants,
      consommerExamenGratuit,
      revueGratuiteDisponible,
      consommerRevueGratuite,
      enregistrerResultatExamen,
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
