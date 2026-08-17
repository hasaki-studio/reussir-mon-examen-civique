import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEtat } from '../src/state/EtatContext';
import { useQuestionsContext } from '../src/state/QuestionsContext';
import { useQuiz } from '../src/state/QuizContext';
import { questionsParTheme, questionsParPalier } from '../src/utils/filtresQuestions';
import ListeQuestions from '../src/screens/ListeQuestions';

export default function ListeRoute() {
  const router = useRouter();
  const { theme, palier, titre } = useLocalSearchParams<{ theme?: string; palier?: string; titre?: string }>();
  const { etat } = useEtat();
  const { questions } = useQuestionsContext();
  const { demarrerSession } = useQuiz();

  const questionsFiltrees = theme
    ? questionsParTheme(questions, theme, etat.palier, etat.premium)
    : questionsParPalier(questions, Number(palier));

  const onSelectionnerQuestion = (questionId: string) => {
    const q = questionsFiltrees.find((x) => x.id === questionId) ?? questionsFiltrees[0];
    if (!q) return;
    demarrerSession(theme ? 'theme' : 'palier', theme ?? Number(palier), [q], true, questionsFiltrees);
    router.push('/quiz');
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
