import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useEtat } from '../../src/state/EtatContext';
import { useQuiz, type ModeSession } from '../../src/state/QuizContext';
import { useQuizzRoute } from '../../src/hooks/useQuizzRoute';
import { useExamenBlanc } from '../../src/hooks/useExamenBlanc';
import {
  logPubExamenVisionnee,
  logReponseChoisie,
  logSelectContent,
} from '../../src/services/analytics';
import EcranQuestion from '../../src/screens/Question';
import PubRecompensee from '../../src/components/PubRecompensee';
import { UNITE_PUB_EXAMEN } from '../../src/services/ads';

function libelleMode(mode: ModeSession, valeur: string | number | undefined): string {
  switch (mode) {
    case 'examen':
      return 'Examen blanc';
    case 'theme':
      return `Thème · ${valeur}`;
    case 'palier':
      return `Niveau ${valeur}`;
    default:
      return 'Révision express';
  }
}

export default function QuizRoute() {
  const router = useRouter();
  const quizz = useQuizzRoute();
  const { etat } = useEtat();
  const {
    sessionQuiz,
    repondre,
    questionSuivante,
    questionPrecedente,
    terminerSession,
    reponseCourante,
  } = useQuiz();
  // `replace` : la révision qu'on vient de terminer n'a pas à rester sous l'examen.
  const examen = useExamenBlanc(quizz ?? 'csp', 'replace');

  const question = sessionQuiz?.liste[sessionQuiz.index];
  const enExamen = sessionQuiz?.mode === 'examen';

  useEffect(() => {
    if (!sessionQuiz || !question) return;
    logSelectContent({
      itemId: question.id,
      theme: question.theme,
      palier: question.palier,
      modeSession: sessionQuiz.mode,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  // Fin de session. L'examen part vers son écran de résultat — c'est là que se fait
  // l'apprentissage — tandis qu'une révision, déjà corrigée question par question, n'a rien de
  // plus à montrer et rend la main à l'écran d'où elle a été lancée.
  useEffect(() => {
    if (!sessionQuiz?.terminee || !quizz) return;
    if (sessionQuiz.mode === 'examen') {
      router.replace({ pathname: '/[quizz]/resultat', params: { quizz } });
    } else {
      terminerSession();
      router.back();
    }
  }, [sessionQuiz?.terminee, sessionQuiz?.mode, quizz, router, terminerSession]);

  if (!quizz) return <Redirect href="/" />;
  // Session absente (relance de l'application sur cette route) ou déjà terminée : l'écran ne
  // rend rien, l'effet ci-dessus s'occupe de la navigation.
  if (!sessionQuiz || !question || sessionQuiz.terminee) return null;

  const onRepondre = (choisi: number) => {
    repondre(choisi);
    logReponseChoisie({
      questionId: question.id,
      theme: question.theme,
      palier: question.palier,
      modeSession: sessionQuiz.mode,
      correct: choisi === question.bonne,
    });
  };

  return (
    <>
      <EcranQuestion
        question={question}
        modeLabel={libelleMode(sessionQuiz.mode, sessionQuiz.valeur)}
        numero={sessionQuiz.index + 1}
        total={sessionQuiz.liste.length}
        correctionImmediate={!enExamen}
        reponse={reponseCourante}
        masquerPublicite={etat.premium}
        estDerniere={sessionQuiz.index === sessionQuiz.liste.length - 1}
        peutPrecedent={!enExamen && sessionQuiz.index > 0}
        onRepondre={onRepondre}
        onSuivant={questionSuivante}
        onPrecedent={questionPrecedente}
        onQuitter={() => {
          terminerSession();
          router.back();
        }}
        // `replace` : la révision terminée n'a pas à rester dans la pile sous l'écran des
        // thèmes. Celle-ci redevient « accueil du quizz → thèmes », et le retour depuis les
        // thèmes ramène à l'accueil du quizz.
        onReviserTheme={() => {
          terminerSession();
          router.replace({ pathname: '/[quizz]/themes', params: { quizz } });
        }}
        // Sans terminerSession() : `lancerExamen` ouvre une session qui remplace celle-ci.
        // Fermer d'abord ferait passer l'écran par un rendu sans session, donc par l'effet de
        // sortie qui renvoie en arrière.
        onExamenBlanc={examen.lancerExamen}
      />
      <PubRecompensee
        unite={UNITE_PUB_EXAMEN}
        visible={examen.pubEnAttente}
        titre="Passer un examen blanc de plus"
        description="Vous avez déjà utilisé votre examen blanc du jour. Regardez une publicité pour en repasser un aujourd'hui."
        onVisionnee={logPubExamenVisionnee}
        onTermine={examen.pubTerminee}
        onAnnuler={examen.pubAnnulee}
      />
    </>
  );
}
