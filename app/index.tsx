import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useEtat } from '../src/state/EtatContext';
import { useQuestionsContext } from '../src/state/QuestionsContext';
import { useRemoteConfig } from '../src/state/RemoteConfigContext';
import { useConsentement } from '../src/state/ConsentementContext';
import { useAchatPremium } from '../src/state/AchatPremiumContext';
import { QUIZZ, QUIZZ_ORDRE, type Quizz } from '../src/config/quizz';
import { questionsDebloquees, questionsDuQuizz } from '../src/utils/filtresQuestions';
import { messageDateCle } from '../src/config/datesCles';
import { definirQuizzAnalytics } from '../src/services/analytics';
import SelectionQuizz, { LigneQuizz } from '../src/screens/SelectionQuizz';

export default function SelectionRoute() {
  const router = useRouter();
  const { etat, etatQuizz, reinitialiser } = useEtat();
  const { questions } = useQuestionsContext();
  const { messageAccueil } = useRemoteConfig();
  const { reinitialiserConsentement } = useConsentement();
  const { prixPremium, achatEnCours, erreurAchat, lancerAchatPremium } = useAchatPremium();

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

  return (
    <SelectionQuizz
      lignes={lignes}
      premium={etat.premium}
      prixPremium={prixPremium}
      achatEnCours={achatEnCours}
      erreurAchat={erreurAchat}
      messageAccueil={messageBandeau}
      onChoisirQuizz={(quizz: Quizz) => router.push({ pathname: '/[quizz]', params: { quizz } })}
      onPremium={lancerAchatPremium}
      onConseils={() => router.push('/conseils')}
      onMentionsLegales={() => router.push('/mentions')}
      onReinitialiser={reinitialiserTout}
    />
  );
}
