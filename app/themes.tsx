import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useEtat } from '../src/state/EtatContext';
import { useQuestionsContext } from '../src/state/QuestionsContext';
import { useRemoteConfig } from '../src/state/RemoteConfigContext';
import {
  logSessionDetailDemarree,
  logSessionDetailQuotaAtteint,
  logPubSessionDetailVisionnee,
} from '../src/services/analytics';
import ThemesDetail from '../src/screens/ThemesDetail';
import PubRecompensee from '../src/components/PubRecompensee';
import { UNITE_PUB_SESSION_DETAIL } from '../src/services/ads';

type Selection = { titre: string; theme?: string; palier?: number };

export default function ThemesRoute() {
  const router = useRouter();
  const [pubSessionEnAttente, setPubSessionEnAttente] = useState<Selection | null>(null);
  const {
    etat,
    sessionDetailGratuiteDisponible,
    sessionsDetailRestantes,
    consommerSessionDetailGratuite,
  } = useEtat();
  const { themes, paliers, palierMax } = useQuestionsContext();
  const { seuilDeblocageTheme, sessionsDetailGratuitesParJour } = useRemoteConfig();

  const themeDebloque = useMemo(() => {
    if (etat.premium) return true;
    const seuil = Math.min(seuilDeblocageTheme, palierMax);
    return etat.palier >= seuil;
  }, [etat.premium, etat.palier, palierMax, seuilDeblocageTheme]);

  const naviguerVersListe = (sel: Selection) => {
    if (sel.theme) {
      router.push({ pathname: '/liste', params: { theme: sel.theme, titre: sel.titre } });
    } else {
      router.push({ pathname: '/liste', params: { palier: String(sel.palier), titre: sel.titre } });
    }
  };

  const modeEtValeur = (sel: Selection) => ({
    mode: sel.theme ? 'theme' : 'palier',
    valeur: sel.theme ?? sel.palier ?? '',
  });

  const ouvrirListeDetail = (sel: Selection) => {
    if (sessionDetailGratuiteDisponible(sessionsDetailGratuitesParJour)) {
      const gratuite = !etat.premium;
      const restantesAvant = sessionsDetailRestantes(sessionsDetailGratuitesParJour);
      if (gratuite) consommerSessionDetailGratuite();
      logSessionDetailDemarree({
        ...modeEtValeur(sel),
        gratuite,
        sessionsRestantesJour: gratuite ? Math.max(0, restantesAvant - 1) : restantesAvant,
      });
      naviguerVersListe(sel);
    } else {
      logSessionDetailQuotaAtteint(modeEtValeur(sel));
      setPubSessionEnAttente(sel);
    }
  };

  return (
    <>
      <ThemesDetail
        themes={themes}
        paliers={paliers}
        palierUtilisateur={etat.palier}
        premium={etat.premium}
        themeDebloque={themeDebloque}
        onSelectionnerTheme={(theme) => ouvrirListeDetail({ titre: theme, theme })}
        onSelectionnerPalier={(palier) => ouvrirListeDetail({ titre: `Niveau ${palier}`, palier })}
        onRetour={() => router.back()}
      />
      <PubRecompensee
        unite={UNITE_PUB_SESSION_DETAIL}
        visible={pubSessionEnAttente !== null}
        titre="Continuer la révision détaillée"
        description="Vous avez déjà utilisé votre session gratuite du jour. Regardez une publicité pour continuer à réviser par thème ou par niveau aujourd'hui."
        onVisionnee={() => {
          if (pubSessionEnAttente) logPubSessionDetailVisionnee(modeEtValeur(pubSessionEnAttente));
        }}
        onTermine={() => {
          if (pubSessionEnAttente) {
            consommerSessionDetailGratuite();
            naviguerVersListe(pubSessionEnAttente);
          }
          setPubSessionEnAttente(null);
        }}
        onAnnuler={() => setPubSessionEnAttente(null)}
      />
    </>
  );
}
