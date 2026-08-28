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
import ResultatExamen, {
  ComparatifExamens,
  QuestionCorrecte,
  QuestionRatee,
} from '../../src/screens/ResultatExamen';
import PubRecompensee from '../../src/components/PubRecompensee';
import { UNITE_PUB_EXAMEN, UNITE_PUB_RESULTAT_EXAMEN } from '../../src/services/ads';

export default function ResultatRoute() {
  const router = useRouter();
  const quizz = useQuizzRoute();
  const {
    etat,
    etatQuizz,
    enregistrerResultatExamen,
    revueGratuiteDisponible,
    consommerRevueGratuite,
  } = useEtat();
  const { sessionQuiz, score, terminerSession } = useQuiz();
  const { examenNbQuestions, examenSeuilReussite, resultatVerrouille, revuesGratuitesParJour } =
    useRemoteConfig();
  // `replace` : l'écran de résultat n'a pas à rester sous l'examen suivant.
  const examen = useExamenBlanc(quizz ?? 'csp', 'replace');

  // Figé à l'arrivée sur l'écran, pas recalculé à chaque rendu : sans quoi le quota se
  // consommant plus bas verrouillerait l'écran sous les yeux de l'utilisateur en train de le lire.
  const [revueGratuite] = useState(() =>
    revueGratuiteDisponible(quizz ?? 'csp', revuesGratuitesParJour)
  );

  // Photographié au montage, avant que l'effet plus bas n'y ajoute l'examen qu'on vient de
  // passer : sans cela, « meilleur score précédent » inclurait le score courant et l'écran
  // ne pourrait jamais annoncer de record.
  const [comparatif] = useState<ComparatifExamens>(() => {
    // Historique le plus récent en tête (`enregistrerResultatExamen` empile par l'avant).
    const precedents = etatQuizz(quizz ?? 'csp').derniersResultats;
    const pourcentage = (r: { score: number; total: number }) =>
      r.total === 0 ? 0 : Math.round((r.score / r.total) * 100);
    const dernier = precedents[0];
    return {
      nbPrecedents: precedents.length,
      precedent: dernier
        ? {
            score: dernier.score,
            total: dernier.total,
            pourcentage: pourcentage(dernier),
            date: dernier.date,
            reussi: dernier.reussi,
          }
        : null,
      meilleurPrecedent:
        precedents.length > 0 ? Math.max(...precedents.map(pourcentage)) : null,
    };
  });

  // Le score se calcule et s'enregistre dans tous les cas (voir l'effet plus bas) : seul son
  // affichage dépend de la clé. Jamais rien de masqué en Premium, une fois la pub vue, ou tant
  // que le quota de revues gratuites du jour n'est pas épuisé.
  const [resultatDevoile, setResultatDevoile] = useState(false);
  const [pubResultatVisible, setPubResultatVisible] = useState(false);
  const masque =
    etat.premium || resultatDevoile || resultatVerrouille === 'aucun' || revueGratuite
      ? 'rien'
      : resultatVerrouille;

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

  const bonnes = useMemo<QuestionCorrecte[]>(() => {
    if (!sessionQuiz) return [];
    return sessionQuiz.reponses
      .filter((r) => r.correct)
      .map((r) => ({ question: sessionQuiz.liste.find((q) => q.id === r.questionId) }))
      .filter((e): e is QuestionCorrecte => e.question !== undefined);
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
    // Consomme le quota seulement s'il a effectivement servi à cet examen — un Premium ou un
    // quota déjà épuisé n'ont rien à décompter.
    if (!etat.premium && revueGratuite) consommerRevueGratuite(quizz);
  }, [
    quizz,
    sessionQuiz,
    score,
    total,
    seuil,
    reussi,
    enregistrerResultatExamen,
    etat.premium,
    revueGratuite,
    consommerRevueGratuite,
  ]);

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

  // `replace` comme le retour au quizz : l'écran de résultat n'a pas à rester sous la révision.
  // La pile redevient donc « accueil du quizz → thèmes », et le retour depuis les thèmes ramène
  // à l'accueil du quizz, pas à un résultat dont la session vient d'être close.
  const reviserThemes = () => {
    terminerSession();
    router.replace({ pathname: '/[quizz]/themes', params: { quizz } });
  };

  return (
    <>
      <ResultatExamen
        score={score}
        total={total}
        seuil={seuil}
        reussi={reussi}
        ratees={ratees}
        bonnes={bonnes}
        comparatif={comparatif}
        masque={masque}
        onDevoiler={() => setPubResultatVisible(true)}
        onRecommencer={examen.lancerExamen}
        onReviserThemes={reviserThemes}
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
