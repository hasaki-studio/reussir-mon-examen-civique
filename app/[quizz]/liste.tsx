import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEtat } from '../../src/state/EtatContext';
import { useQuiz } from '../../src/state/QuizContext';
import { useQuizzRoute } from '../../src/hooks/useQuizzRoute';
import { useQuestionsQuizz } from '../../src/hooks/useQuestionsQuizz';
import { questionsParPalier, questionsParTheme } from '../../src/utils/filtresQuestions';
import ListeQuestions from '../../src/screens/ListeQuestions';

export default function ListeRoute() {
  const router = useRouter();
  const quizz = useQuizzRoute();
  const { theme, palier, titre } = useLocalSearchParams<{
    theme?: string;
    palier?: string;
    titre?: string;
  }>();
  const { etat, etatQuizz } = useEtat();
  const { questions } = useQuestionsQuizz(quizz ?? 'csp');
  const { demarrerSession } = useQuiz();

  if (!quizz) return <Redirect href="/" />;

  const palierUtilisateur = etatQuizz(quizz).palier;
  const questionsFiltrees = theme
    ? questionsParTheme(questions, theme, palierUtilisateur, etat.premium)
    : questionsParPalier(questions, Number(palier));

  const onSelectionnerQuestion = (questionId: string) => {
    const depart = questionsFiltrees.findIndex((q) => q.id === questionId);
    if (depart < 0) return;
    // La session couvre toute la liste affichée, en commençant par la question choisie :
    // l'utilisateur a désigné un point d'entrée, pas une question isolée.
    demarrerSession({
      quizz,
      mode: theme ? 'theme' : 'palier',
      valeur: theme ?? Number(palier),
      liste: questionsFiltrees,
      depart,
    });
    router.push({ pathname: '/[quizz]/quiz', params: { quizz } });
  };

  return (
    <ListeQuestions
      titre={titre ?? ''}
      questions={questionsFiltrees}
      onSelectionnerQuestion={onSelectionnerQuestion}
      onRetour={() => router.back()}
    />
  );
}
