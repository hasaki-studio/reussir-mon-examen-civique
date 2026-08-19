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
  // Distingue pourquoi la pub palier a été ouverte : depuis « Débloquer plus de questions »
  // (aucune suite automatique attendue) ou depuis « Réviser en détail » alors que ce mode est
  // encore verrouillé — auquel cas regarder la pub sans être emmené vers le détail une fois
  // débloqué laisserait l'utilisateur revenu exactement là d'où il est parti, sans la moindre
  // suite visible à son geste.
  const [intentionPubPalier, setIntentionPubPalier] = useState<'detail' | 'debloquer' | null>(null);
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
  const seuilTheme = Math.min(seuilDeblocageTheme, palierMax);
  const detailDebloque = etat.premium || palier >= seuilTheme;

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
  const nbQuestionsExamen = Math.min(examenNbQuestions, questions.length);
  const nbSituationsExamen = Math.min(
    examenNbSituations,
    nbQuestionsExamen,
    questions.filter((q) => q.type === 'situation').length
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
        detailDebloque={detailDebloque}
        seuilTheme={seuilTheme}
        nbQuestionsExamen={nbQuestionsExamen}
        nbSituationsExamen={nbSituationsExamen}
        seuilExamen={seuilReussite(nbQuestionsExamen, examenNbQuestions, examenSeuilReussite)}
        examensRestants={examensRestants(quizz, examensGratuitsParJour)}
        onRevision={lancerRevision}
        onExamen={examen.lancerExamen}
        onDetail={() =>
          detailDebloque
            ? router.push({ pathname: '/[quizz]/themes', params: { quizz } })
            : setIntentionPubPalier('detail')
        }
        onDebloquer={() => setIntentionPubPalier('debloquer')}
        onRetour={() => router.back()}
      />
      <PubRecompensee
        unite={UNITE_PUB_PALIER}
        visible={intentionPubPalier !== null}
        titre="Débloquer la suite"
        description={
          intentionPubPalier === 'detail'
            ? 'Regardez une publicité pour progresser vers la révision en détail.'
            : 'Regardez une publicité pour débloquer le palier suivant et de nouvelles questions.'
        }
        onVisionnee={() => {
          if (palier < palierMax) {
            logPubPalierVisionnee({ palierAvant: palier, palierApres: palier + 1 });
          }
        }}
        onTermine={() => {
          debloquerPalierSuivant(quizz, palierMax, seuilDeblocageTheme);
          // Le palier n'est pas encore reflété dans `palier` à ce rendu-ci (la mise à jour de
          // l'état est asynchrone) : on calcule la valeur qu'il aura pour décider s'il faut
          // enchaîner vers le détail, plutôt que de se fier à une valeur qui n'a pas bougé.
          const palierApres = Math.min(palier + 1, palierMax);
          const detailDebloqueApres = etat.premium || palierApres >= seuilTheme;
          if (intentionPubPalier === 'detail' && detailDebloqueApres) {
            router.push({ pathname: '/[quizz]/themes', params: { quizz } });
          }
          setIntentionPubPalier(null);
        }}
        onAnnuler={() => setIntentionPubPalier(null)}
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
