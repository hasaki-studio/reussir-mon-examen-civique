import { useMemo, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useEtat } from '../../src/state/EtatContext';
import { useRemoteConfig } from '../../src/state/RemoteConfigContext';
import { useQuizzRoute } from '../../src/hooks/useQuizzRoute';
import { useQuestionsQuizz } from '../../src/hooks/useQuestionsQuizz';
import { questionsDebloquees } from '../../src/utils/filtresQuestions';
import {
  logSessionDetailDemarree,
  logSessionDetailQuotaAtteint,
  logPubSessionDetailVisionnee,
} from '../../src/services/analytics';
import ThemesDetail, { EntreePalier, EntreeTheme } from '../../src/screens/ThemesDetail';
import PubRecompensee from '../../src/components/PubRecompensee';
import { UNITE_PUB_SESSION_DETAIL } from '../../src/services/ads';

type Selection = { titre: string; theme?: string; palier?: number };

export default function ThemesRoute() {
  const router = useRouter();
  const quizz = useQuizzRoute();
  const [pubSessionEnAttente, setPubSessionEnAttente] = useState<Selection | null>(null);
  const {
    etat,
    etatQuizz,
    sessionDetailGratuiteDisponible,
    sessionsDetailRestantes,
    consommerSessionDetailGratuite,
  } = useEtat();
  const { seuilDeblocageTheme, sessionsDetailGratuitesParJour } = useRemoteConfig();
  const { questions, palierMax } = useQuestionsQuizz(quizz ?? 'csp');

  const { palier } = etatQuizz(quizz ?? 'csp');
  const themeDebloque = etat.premium || palier >= Math.min(seuilDeblocageTheme, palierMax);

  // Les thèmes sont comptés sur les seules questions débloquées : l'écran suivant n'affichera
  // que celles-là, annoncer un total plus grand reviendrait à promettre ce qui est verrouillé.
  const themes = useMemo<EntreeTheme[]>(() => {
    const debloquees = questionsDebloquees(questions, palier, etat.premium);
    const compte = new Map<string, number>();
    for (const q of debloquees) compte.set(q.theme, (compte.get(q.theme) ?? 0) + 1);
    return [...compte.entries()].map(([nom, nb]) => ({ nom, nb }));
  }, [questions, palier, etat.premium]);

  const paliers = useMemo<EntreePalier[]>(() => {
    const compte = new Map<number, number>();
    for (const q of questions) compte.set(q.palier, (compte.get(q.palier) ?? 0) + 1);
    return [...compte.entries()]
      .map(([numero, nb]) => ({ numero, nb }))
      .sort((a, b) => a.numero - b.numero);
  }, [questions]);

  if (!quizz) return <Redirect href="/" />;

  const naviguerVersListe = (sel: Selection) => {
    router.push({
      pathname: '/[quizz]/liste',
      params: sel.theme
        ? { quizz, theme: sel.theme, titre: sel.titre }
        : { quizz, palier: String(sel.palier), titre: sel.titre },
    });
  };

  const modeEtValeur = (sel: Selection) => ({
    mode: sel.theme ? 'theme' : 'palier',
    valeur: sel.theme ?? sel.palier ?? '',
  });

  const ouvrirListeDetail = (sel: Selection) => {
    if (sessionDetailGratuiteDisponible(quizz, sessionsDetailGratuitesParJour)) {
      const gratuite = !etat.premium;
      const restantesAvant = sessionsDetailRestantes(quizz, sessionsDetailGratuitesParJour);
      if (gratuite) consommerSessionDetailGratuite(quizz);
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
        palierUtilisateur={palier}
        premium={etat.premium}
        themeDebloque={themeDebloque}
        onSelectionnerTheme={(theme) => ouvrirListeDetail({ titre: theme, theme })}
        onSelectionnerPalier={(numero) =>
          ouvrirListeDetail({ titre: `Niveau ${numero}`, palier: numero })
        }
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
            consommerSessionDetailGratuite(quizz);
            naviguerVersListe(pubSessionEnAttente);
          }
          setPubSessionEnAttente(null);
        }}
        onAnnuler={() => setPubSessionEnAttente(null)}
      />
    </>
  );
}
