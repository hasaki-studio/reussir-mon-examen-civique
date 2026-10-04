// src/hooks/useExamenBlanc.ts
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useEtat } from '../state/EtatContext';
import { useQuiz } from '../state/QuizContext';
import { useRemoteConfig } from '../state/RemoteConfigContext';
import { useQuestionsQuizz } from './useQuestionsQuizz';
import { questionsDebloquees } from '../utils/filtresQuestions';
import { tirerExamen } from '../utils/tirageExamen';
import { logExamenDemarre, logExamenQuotaAtteint } from '../services/analytics';
import type { Quizz } from '../config/quizz';

/**
 * Lancement d'un examen blanc, quota compris.
 *
 * Regroupé dans un hook parce que deux écrans y mènent — l'accueil du quizz et l'écran de
 * résultat, qui propose d'enchaîner — et qu'un quota dupliqué à deux endroits finit toujours
 * par diverger.
 *
 * @param naviguer `push` depuis l'accueil du quizz, pour que « Quitter » y ramène ;
 *                 `replace` depuis un écran de résultat, qui n'a pas à rester dans la pile.
 */
export function useExamenBlanc(quizz: Quizz, naviguer: 'push' | 'replace' = 'push') {
  const router = useRouter();
  const { etat, etatQuizz, examenGratuitDisponible, examensRestants, consommerExamenGratuit } =
    useEtat();
  const { examensGratuitsParJour, examenNbQuestions, examenNbSituations } = useRemoteConfig();
  const { questions } = useQuestionsQuizz(quizz);
  const { demarrerSession } = useQuiz();
  const [pubEnAttente, setPubEnAttente] = useState(false);

  const { palier } = etatQuizz(quizz);

  // L'examen blanc ne pioche que dans les questions débloquées : réviser un niveau puis s'y
  // tester doit porter sur le même stock, sinon l'examen interroge sur ce que l'utilisateur
  // n'a pas encore pu travailler. Chaque palier compte assez de questions — mises en situation
  // comprises — pour composer un examen varié. Premium débloque tout, `questionsDebloquees`
  // s'en charge.
  const disponibles = useMemo(
    () => questionsDebloquees(questions, palier, etat.premium),
    [questions, palier, etat.premium]
  );

  const demarrer = useCallback(
    (gratuit: boolean) => {
      const liste = tirerExamen(disponibles, {
        nbQuestions: examenNbQuestions,
        nbSituations: examenNbSituations,
      });
      // Corpus vide : rien à tirer. Se produit avant la première synchronisation du contenu.
      if (liste.length === 0) return;
      logExamenDemarre({
        nbQuestions: liste.length,
        gratuit,
        examensRestantsJour: examensRestants(quizz, examensGratuitsParJour),
      });
      demarrerSession({ quizz, mode: 'examen', liste });
      const cible = { pathname: '/[quizz]/quiz' as const, params: { quizz } };
      if (naviguer === 'replace') router.replace(cible);
      else router.push(cible);
    },
    [
      disponibles,
      examenNbQuestions,
      examenNbSituations,
      examensRestants,
      quizz,
      examensGratuitsParJour,
      demarrerSession,
      naviguer,
      router,
    ]
  );

  const lancerExamen = useCallback(() => {
    if (examenGratuitDisponible(quizz, examensGratuitsParJour)) {
      // Le quota n'est décompté qu'aux non-premium : `examenGratuitDisponible` répond toujours
      // vrai pour un premium, décrémenter son compteur n'aurait aucun effet mais brouillerait
      // la lecture de l'état.
      const gratuit = !etat.premium;
      if (gratuit) consommerExamenGratuit(quizz);
      demarrer(gratuit);
      return;
    }
    logExamenQuotaAtteint();
    setPubEnAttente(true);
  }, [
    examenGratuitDisponible,
    quizz,
    examensGratuitsParJour,
    etat.premium,
    consommerExamenGratuit,
    demarrer,
  ]);

  return {
    lancerExamen,
    /** Vrai quand la modale de publicité doit être affichée (quota du jour épuisé). */
    pubEnAttente,
    /** Publicité regardée jusqu'à la récompense : l'examen part, hors quota. */
    pubTerminee: useCallback(() => {
      setPubEnAttente(false);
      demarrer(false);
    }, [demarrer]),
    pubAnnulee: useCallback(() => setPubEnAttente(false), []),
  };
}
