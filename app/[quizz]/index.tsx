import { useMemo, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useEtat } from '../../src/state/EtatContext';
import { useQuiz } from '../../src/state/QuizContext';
import { useRemoteConfig } from '../../src/state/RemoteConfigContext';
import { useQuizzRoute } from '../../src/hooks/useQuizzRoute';
import { useQuestionsQuizz } from '../../src/hooks/useQuestionsQuizz';
import { useExamenBlanc } from '../../src/hooks/useExamenBlanc';
import { questionsDebloquees } from '../../src/utils/filtresQuestions';
import { melanger } from '../../src/utils/melanger';
import { seuilReussite } from '../../src/config/examen';
import { QUIZZ } from '../../src/config/quizz';
import {
  logPubExamenVisionnee,
  logPubPalierVisionnee,
  logRevisionDemarree,
} from '../../src/services/analytics';
import AccueilQuizz from '../../src/screens/AccueilQuizz';
import PubRecompensee from '../../src/components/PubRecompensee';
import { UNITE_PUB_EXAMEN, UNITE_PUB_PALIER } from '../../src/services/ads';

/** Nombre de questions d'une session de révision rapide. */
const TAILLE_SESSION_REVISION = 15;

export default function AccueilQuizzRoute() {
  const router = useRouter();
  const quizz = useQuizzRoute();
  const [pubPalierVisible, setPubPalierVisible] = useState(false);
  const { etat, etatQuizz, debloquerPalierSuivant, examensRestants } = useEtat();
  const { demarrerSession } = useQuiz();
  const {
    seuilDeblocageTheme,
    examensGratuitsParJour,
    examenNbQuestions,
    examenNbSituations,
    examenSeuilReussite,
  } = useRemoteConfig();
  const { questions, palierMax } = useQuestionsQuizz(quizz ?? 'csp');
  const examen = useExamenBlanc(quizz ?? 'csp');

  const { palier } = etatQuizz(quizz ?? 'csp');

  const debloquees = useMemo(
    () => questionsDebloquees(questions, palier, etat.premium),
    [questions, palier, etat.premium]
  );

  // Après tous les hooks : leur ordre doit rester stable d'un rendu à l'autre, même quand la
  // route porte un quizz inconnu (lien profond forgé ou périmé).
  if (!quizz) return <Redirect href="/" />;

  // Ce qui sera réellement posé, corpus incomplet compris : annoncer 40 questions dont 12 mises
  // en situation quand la feuille n'en contient pas encore autant décrédibiliserait l'écran dès
  // le premier examen.
  //
  // Calculé sur les questions débloquées, et non sur le corpus entier : c'est là-dedans que
  // `useExamenBlanc` tire désormais. Compter sur le corpus complet annoncerait un examen que le
  // palier de l'utilisateur ne permet pas encore de composer.
  const nbQuestionsExamen = Math.min(examenNbQuestions, debloquees.length);
  const nbSituationsExamen = Math.min(
    examenNbSituations,
    nbQuestionsExamen,
    debloquees.filter((q) => q.type === 'situation').length
  );

  const lancerRevision = () => {
    if (debloquees.length === 0) return;
    logRevisionDemarree({ nbQuestionsDispo: debloquees.length });
    demarrerSession({
      quizz,
      mode: 'revision',
      liste: melanger(debloquees).slice(0, TAILLE_SESSION_REVISION),
    });
    router.push({ pathname: '/[quizz]/quiz', params: { quizz } });
  };

  return (
    <>
      <AccueilQuizz
        nom={QUIZZ[quizz].nom}
        couleur={QUIZZ[quizz].couleur}
        palier={palier}
        palierMax={palierMax}
        debloquees={debloquees.length}
        total={questions.length}
        premium={etat.premium}
        nbQuestionsExamen={nbQuestionsExamen}
        nbSituationsExamen={nbSituationsExamen}
        seuilExamen={seuilReussite(nbQuestionsExamen, examenNbQuestions, examenSeuilReussite)}
        examensRestants={examensRestants(quizz, examensGratuitsParJour)}
        onRevision={lancerRevision}
        onExamen={examen.lancerExamen}
        // « Réviser en détail » ouvre toujours l'écran des thèmes/paliers : rien n'y est verrouillé
        // à l'entrée. C'est là-bas, au moment de choisir un thème ou un niveau précis, que la
        // session gratuite du jour se consomme et que la pub apparaît si elle est épuisée.
        onDetail={() => router.push({ pathname: '/[quizz]/themes', params: { quizz } })}
        onDebloquer={() => setPubPalierVisible(true)}
        onRetour={() => router.back()}
      />
      <PubRecompensee
        unite={UNITE_PUB_PALIER}
        visible={pubPalierVisible}
        titre="Débloquer la suite"
        description="Regardez une publicité pour débloquer le palier suivant et de nouvelles questions."
        onVisionnee={() => {
          if (palier < palierMax) {
            logPubPalierVisionnee({ palierAvant: palier, palierApres: palier + 1 });
          }
        }}
        onTermine={() => {
          debloquerPalierSuivant(quizz, palierMax, seuilDeblocageTheme);
          setPubPalierVisible(false);
        }}
        onAnnuler={() => setPubPalierVisible(false)}
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
