import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useEtat } from '../../src/state/EtatContext';
import { useQuiz, type ModeSession } from '../../src/state/QuizContext';
import { useQuizzRoute } from '../../src/hooks/useQuizzRoute';
import { logReponseChoisie, logSelectContent } from '../../src/services/analytics';
import EcranQuestion from '../../src/screens/Question';

function libelleMode(mode: ModeSession, valeur: string | number | undefined): string {
  switch (mode) {
    case 'examen':
      return 'Examen blanc';
    case 'theme':
      return `Thème · ${valeur}`;
    case 'palier':
      return `Palier ${valeur}`;
    default:
      return 'Mode révision';
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
    />
  );
}
