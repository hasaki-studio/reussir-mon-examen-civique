import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useEtat } from '../src/state/EtatContext';
import { useQuestionsContext } from '../src/state/QuestionsContext';
import { useQuiz, melanger } from '../src/state/QuizContext';
import { useRemoteConfig } from '../src/state/RemoteConfigContext';
import { useConsentement } from '../src/state/ConsentementContext';
import { useAchatPremium } from '../src/state/AchatPremiumContext';
import { logRevisionAleatoireDemarree, logPubPalierVisionnee } from '../src/services/analytics';
import Accueil from '../src/screens/Accueil';
import { messageDateCle } from '../src/config/datesCles';
import PubRecompensee from '../src/components/PubRecompensee';
import { UNITE_PUB_PALIER } from '../src/services/ads';

export default function AccueilRoute() {
  const router = useRouter();
  const [pubPalierEnAttente, setPubPalierEnAttente] = useState(false);
  const { etat, debloquerPalierSuivant, reinitialiser } = useEtat();
  const { questions, palierMax } = useQuestionsContext();
  const { demarrerSession } = useQuiz();
  const { seuilDeblocageTheme, messageAccueil } = useRemoteConfig();
  const { reinitialiserConsentement } = useConsentement();
  const { prixPremium, achatEnCours, erreurAchat, lancerAchatPremium } = useAchatPremium();

  // Bouton "Réinitialiser (test)" en dev : remet à zéro progression + consentement
  // (réaffiche l'écran de consentement), sans toucher au jeton App Check.
  const reinitialiserTout = () => {
    reinitialiser();
    reinitialiserConsentement();
  };

  const seuilTheme = Math.min(seuilDeblocageTheme, palierMax);

  const themeDebloque = useMemo(() => {
    if (etat.premium) return true;
    return etat.palier >= seuilTheme;
  }, [etat.premium, etat.palier, seuilTheme]);

  const fichesDebloquees = useMemo(() => {
    return etat.premium ? questions.length : questions.filter((q) => q.palier <= etat.palier).length;
  }, [questions, etat.premium, etat.palier]);

  // Priorité : un message posé à distance l'emporte sur la date du jour, qui l'emporte
  // elle-même sur le message par défaut (résolu dans Accueil). Cet ordre laisse la main :
  // une annonce ponctuelle ne doit pas être masquée parce que c'est le 14 juillet.
  const messageBandeau = messageAccueil || messageDateCle() || '';

  const onCommencer = () => {
    const base = etat.premium ? questions : questions.filter((q) => q.palier <= etat.palier);
    const liste = melanger(base).slice(0, 15);
    if (liste.length === 0) return;
    logRevisionAleatoireDemarree({ nbFichesDispo: base.length });
    demarrerSession('aleatoire', undefined, liste, false, liste);
    router.push('/quiz');
  };

  return (
    <>
      <Accueil
        fichesDebloquees={fichesDebloquees}
        fichesTotal={questions.length}
        palier={etat.palier}
        palierMax={palierMax}
        seuilTheme={seuilTheme}
        themeDebloque={themeDebloque}
        premium={etat.premium}
        prixPremium={prixPremium}
        achatEnCours={achatEnCours}
        erreurAchat={erreurAchat}
        messageAccueil={messageBandeau}
        onCommencer={onCommencer}
        onReviserDetail={() => router.push('/themes')}
        onDebloquer={() => setPubPalierEnAttente(true)}
        onPremium={lancerAchatPremium}
        onConseils={() => router.push('/conseils')}
        onMentionsLegales={() => router.push('/mentions')}
        onReinitialiser={reinitialiserTout}
      />
      <PubRecompensee
        unite={UNITE_PUB_PALIER}
        visible={pubPalierEnAttente}
        titre="Débloquer la suite"
        description="Regardez une publicité pour débloquer le niveau suivant et de nouvelles fiches à réviser."
        onVisionnee={() => {
          if (etat.palier < palierMax) {
            logPubPalierVisionnee({ palierAvant: etat.palier, palierApres: etat.palier + 1 });
          }
        }}
        onTermine={() => {
          debloquerPalierSuivant(palierMax, seuilDeblocageTheme);
          setPubPalierEnAttente(false);
        }}
        onAnnuler={() => setPubPalierEnAttente(false)}
      />
    </>
  );
}
