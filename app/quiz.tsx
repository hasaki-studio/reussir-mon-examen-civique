import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useEtat } from '../src/state/EtatContext';
import { useQuiz } from '../src/state/QuizContext';
import { useRemoteConfig } from '../src/state/RemoteConfigContext';
import { logSelectContent, logReponseBonusDebloquee, logPubBonusVisionnee } from '../src/services/analytics';
import EcranQuestion from '../src/screens/Question';
import PubRecompensee from '../src/components/PubRecompensee';
import { UNITE_PUB_BONUS } from '../src/services/ads';

export default function QuizRoute() {
  const router = useRouter();
  const [pubBonusEnAttente, setPubBonusEnAttente] = useState<string | null>(null);
  const { etat, debloquerBonus, bonusGratuitDisponible, consommerBonusGratuit } = useEtat();
  const { sessionQuiz, changerQuestion } = useQuiz();
  const { bonusGratuitsParJour } = useRemoteConfig();

  const q = sessionQuiz?.liste[sessionQuiz.index];

  useEffect(() => {
    if (!sessionQuiz || !q) return;
    logSelectContent({
      itemId: q.id,
      theme: q.theme,
      palier: q.palier,
      modeSession: sessionQuiz.mode,
      navigationLibre: sessionQuiz.naviguationLibre,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id]);

  if (!sessionQuiz || !q) return null;
  const modeLabel =
    sessionQuiz.mode === 'aleatoire'
      ? 'Révision aléatoire'
      : sessionQuiz.mode === 'theme'
      ? 'Révision par thème'
      : `Niveau ${sessionQuiz.valeur}`;
  const positionLabel = sessionQuiz.naviguationLibre
    ? `${sessionQuiz.ensembleFiltre.length} question${sessionQuiz.ensembleFiltre.length > 1 ? 's' : ''} débloquée${sessionQuiz.ensembleFiltre.length > 1 ? 's' : ''} dans ${sessionQuiz.mode === 'theme' ? 'ce thème' : 'ce niveau'}`
    : `Fiche ${sessionQuiz.index + 1} / ${sessionQuiz.liste.length}`;
  const labelSuivant = sessionQuiz.naviguationLibre ? 'Question aléatoire →' : 'Suivante →';
  const peutSuivant = sessionQuiz.naviguationLibre || sessionQuiz.index < sessionQuiz.liste.length - 1;

  // Le prochain déblocage de bonus est-il offert (quota du jour non épuisé) ou nécessite-t-il une pub ?
  const bonusOffert = bonusGratuitDisponible(bonusGratuitsParJour);

  const onDebloquerBonus = () => {
    if (bonusOffert) {
      // Déblocage gratuit : on consomme le quota du jour (sauf premium) et on débloque sans pub.
      if (!etat.premium) consommerBonusGratuit();
      debloquerBonus(q.id);
      logReponseBonusDebloquee({
        questionId: q.id,
        theme: q.theme,
        viaPremium: etat.premium,
        gratuit: true,
      });
    } else {
      // Quota épuisé : on passe par la publicité récompensée.
      setPubBonusEnAttente(q.id);
    }
  };

  return (
    <>
      <EcranQuestion
        question={q}
        modeLabel={modeLabel}
        positionLabel={positionLabel}
        bonusDebloque={etat.premium || etat.bonusDebloques.includes(q.id)}
        bonusOffert={bonusOffert}
        masquerPublicite={etat.premium}
        peutPrecedent={sessionQuiz.index > 0}
        peutSuivant={peutSuivant}
        labelSuivant={labelSuivant}
        onPrecedent={() => changerQuestion(-1)}
        onSuivant={() => changerQuestion(1)}
        onDebloquerBonus={onDebloquerBonus}
        onRetour={() => router.back()}
      />
      <PubRecompensee
        unite={UNITE_PUB_BONUS}
        visible={pubBonusEnAttente !== null}
        titre="Débloquer les astuces"
        description="Une courte publicité pour révéler les erreurs à éviter et les astuces de cette fiche."
        onVisionnee={() => {
          if (pubBonusEnAttente) logPubBonusVisionnee({ questionId: pubBonusEnAttente, theme: q.theme });
        }}
        onTermine={() => {
          if (pubBonusEnAttente) {
            debloquerBonus(pubBonusEnAttente);
            logReponseBonusDebloquee({
              questionId: pubBonusEnAttente,
              theme: q.theme,
              viaPremium: etat.premium,
              gratuit: false,
            });
          }
          setPubBonusEnAttente(null);
        }}
        onAnnuler={() => setPubBonusEnAttente(null)}
      />
    </>
  );
}
