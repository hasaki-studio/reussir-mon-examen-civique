import { useEffect, useMemo, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useEtat } from '../src/state/EtatContext';
import { useQuestionsContext } from '../src/state/QuestionsContext';
import { useRemoteConfig } from '../src/state/RemoteConfigContext';
import { useConsentement } from '../src/state/ConsentementContext';
import { QUIZZ, QUIZZ_ORDRE, type Quizz } from '../src/config/quizz';
import { questionsDebloquees, questionsDuQuizz } from '../src/utils/filtresQuestions';
import { messageDateCle } from '../src/config/datesCles';
import { definirQuizzAnalytics } from '../src/services/analytics';
import SelectionQuizz, { LigneQuizz } from '../src/screens/SelectionQuizz';

/**
 * Passe à vrai après la redirection automatique du lancement.
 *
 * Un module n'est évalué qu'une fois par démarrage de l'application : c'est exactement la
 * portée voulue. Sans ce garde-fou, revenir volontairement au menu depuis un quizz relancerait
 * la redirection vers ce même quizz, et le choix deviendrait impossible à changer.
 *
 * Il double `oublierDernierQuizz()`, appelé au retour au menu : celui-ci donne la bonne
 * sémantique (repartir de l'application depuis le menu si on l'a quittée là), mais reste une
 * mise à jour d'état, donc sujette à l'ordre dans lequel React la traite par rapport à la
 * navigation. Le drapeau, lui, est immédiat.
 */
let redirectionInitialeFaite = false;

export default function SelectionRoute() {
  const router = useRouter();
  const { etat, etatQuizz, reinitialiser } = useEtat();
  const { questions } = useQuestionsContext();
  const { messageAccueil } = useRemoteConfig();
  const { reinitialiserConsentement } = useConsentement();

  // Décidé une fois au montage, pas à chaque rendu : la valeur ne doit pas changer sous l'effet
  // d'un re-rendu déclenché par autre chose (arrivée des questions, message distant).
  const [redirigerVers] = useState<Quizz | null>(() =>
    redirectionInitialeFaite ? null : etat.dernierQuizz
  );

  useEffect(() => {
    redirectionInitialeFaite = true;
  }, []);

  // Hors d'un quizz : les événements de cet écran ne doivent pas rester attribués au dernier
  // quizz consulté, ce qui gonflerait ses chiffres d'un trafic qui ne le concerne pas.
  useEffect(() => {
    definirQuizzAnalytics(null);
  }, []);

  const lignes = useMemo<LigneQuizz[]>(
    () =>
      QUIZZ_ORDRE.map((cle) => {
        const duQuizz = questionsDuQuizz(questions, cle);
        const { palier } = etatQuizz(cle);
        const palierMax = duQuizz.length === 0 ? 1 : Math.max(...duQuizz.map((q) => q.palier));
        return {
          cle,
          nom: QUIZZ[cle].nom,
          sousTitre: QUIZZ[cle].sousTitre,
          couleur: QUIZZ[cle].couleur,
          palier,
          palierMax,
          debloquees: questionsDebloquees(duQuizz, palier, etat.premium).length,
          total: duQuizz.length,
        };
      }),
    [questions, etatQuizz, etat.premium]
  );

  // Bouton "Réinitialiser (test)" en dev : remet à zéro progression + consentement
  // (réaffiche l'écran de consentement), sans toucher au jeton App Check.
  const reinitialiserTout = () => {
    reinitialiser();
    reinitialiserConsentement();
  };

  // Priorité : un message posé à distance l'emporte sur la date du jour, qui l'emporte
  // elle-même sur le message par défaut (résolu dans l'écran). Cet ordre laisse la main :
  // une annonce ponctuelle ne doit pas être masquée parce que c'est le 14 juillet.
  const messageBandeau = messageAccueil || messageDateCle() || '';

  // Après tous les hooks, dont l'ordre doit rester stable d'un rendu à l'autre.
  // `replace` et non `push` : le menu ne reste pas dans la pile, sinon le bouton retour
  // d'Android y ramènerait à chaque fois au lieu de quitter l'application.
  if (redirigerVers) {
    return <Redirect href={{ pathname: '/[quizz]', params: { quizz: redirigerVers } }} />;
  }

  return (
    <SelectionQuizz
      lignes={lignes}
      premium={etat.premium}
      messageAccueil={messageBandeau}
      onChoisirQuizz={(quizz: Quizz) => router.push({ pathname: '/[quizz]', params: { quizz } })}
      onReinitialiser={reinitialiserTout}
    />
  );
}
