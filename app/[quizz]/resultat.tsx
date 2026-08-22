import { useEffect, useMemo, useRef, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useEtat } from '../../src/state/EtatContext';
import { useQuiz } from '../../src/state/QuizContext';
import { useRemoteConfig } from '../../src/state/RemoteConfigContext';
import { useQuizzRoute } from '../../src/hooks/useQuizzRoute';
import { useExamenBlanc } from '../../src/hooks/useExamenBlanc';
import { seuilReussite } from '../../src/config/examen';
import {
  logExamenTermine,
  logPubExamenVisionnee,
  logPubResultatVisionnee,
} from '../../src/services/analytics';
import ResultatExamen, { QuestionRatee } from '../../src/screens/ResultatExamen';
import PubRecompensee from '../../src/components/PubRecompensee';
import { UNITE_PUB_EXAMEN, UNITE_PUB_RESULTAT_EXAMEN } from '../../src/services/ads';

export default function ResultatRoute() {
  const router = useRouter();
  const quizz = useQuizzRoute();
  const { etat, enregistrerResultatExamen } = useEtat();
  const { sessionQuiz, score, terminerSession } = useQuiz();
  const { examenNbQuestions, examenSeuilReussite, resultatVerrouille } = useRemoteConfig();
  // `replace` : l'écran de résultat n'a pas à rester sous l'examen suivant.
  const examen = useExamenBlanc(quizz ?? 'csp', 'replace');

  // Le score se calcule et s'enregistre dans tous les cas (voir l'effet plus bas) : seul son
  // affichage dépend de la clé. Jamais rien de masqué en Premium, ni une fois la pub vue.
  const [resultatDevoile, setResultatDevoile] = useState(false);
  const [pubResultatVisible, setPubResultatVisible] = useState(false);
  const masque =
    etat.premium || resultatDevoile || resultatVerrouille === 'aucun' ? 'rien' : resultatVerrouille;

  const total = sessionQuiz?.liste.length ?? 0;
  const seuil = seuilReussite(total, examenNbQuestions, examenSeuilReussite);
  const reussi = score >= seuil;

  const ratees = useMemo<QuestionRatee[]>(() => {
    if (!sessionQuiz) return [];
    return sessionQuiz.reponses
      .filter((r) => !r.correct)
      .map((r) => ({
        question: sessionQuiz.liste.find((q) => q.id === r.questionId),
        choisi: r.choisi,
      }))
      .filter((e): e is QuestionRatee => e.question !== undefined);
  }, [sessionQuiz]);

  // Un examen ne compte qu'une fois. Sans cette garde, un simple re-rendu — changement de
  // Remote Config, retour d'arrière-plan — rejouerait l'événement et empilerait des doublons
  // dans l'historique local.
  const enregistre = useRef(false);
  useEffect(() => {
    if (enregistre.current || !quizz || !sessionQuiz || total === 0) return;
    enregistre.current = true;
    logExamenTermine({ score, total, seuil, reussi });
    enregistrerResultatExamen(quizz, {
      date: new Date().toISOString().slice(0, 10),
      score,
      total,
      seuil,
      reussi,
    });
  }, [quizz, sessionQuiz, score, total, seuil, reussi, enregistrerResultatExamen]);

  if (!quizz) return <Redirect href="/" />;
  // Arrivée sur cette route sans examen terminé (lien direct, relance de l'application) :
  // il n'y a pas de résultat à montrer.
  if (!sessionQuiz || sessionQuiz.mode !== 'examen') {
    return <Redirect href="/" />;
  }

  const retourAuQuizz = () => {
    terminerSession();
    router.replace({ pathname: '/[quizz]', params: { quizz } });
  };

  return (
    <>
      <ResultatExamen
        score={score}
        total={total}
        seuil={seuil}
        reussi={reussi}
        ratees={ratees}
        masque={masque}
        onDevoiler={() => setPubResultatVisible(true)}
        onRecommencer={examen.lancerExamen}
        onRetour={retourAuQuizz}
      />
      <PubRecompensee
        unite={UNITE_PUB_RESULTAT_EXAMEN}
        visible={pubResultatVisible}
        titre={masque === 'tout' ? 'Voir mon résultat' : 'Revoir mes erreurs'}
        description={
          masque === 'tout'
            ? 'Regardez une publicité pour découvrir votre score et revoir vos erreurs.'
            : 'Regardez une publicité pour voir, question par question, la bonne réponse et son explication.'
        }
        onVisionnee={logPubResultatVisionnee}
        onTermine={() => {
          setResultatDevoile(true);
          setPubResultatVisible(false);
        }}
        onAnnuler={() => setPubResultatVisible(false)}
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
