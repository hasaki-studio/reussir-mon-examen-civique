import { useRouter } from 'expo-router';
import MentionsLegales from '../src/screens/MentionsLegales';
import { useConsentement } from '../src/state/ConsentementContext';
import { useEtat } from '../src/state/EtatContext';
import { useAchatPremium } from '../src/state/AchatPremiumContext';

export default function MentionsRoute() {
  const router = useRouter();
  const { consentement, definirConsentement } = useConsentement();
  const { etat } = useEtat();
  const { restaurationEnCours, restaurerAchats } = useAchatPremium();
  return (
    <MentionsLegales
      onRetour={() => router.back()}
      consentement={consentement}
      onDefinirConsentement={definirConsentement}
      premium={etat.premium}
      restaurationEnCours={restaurationEnCours}
      onRestaurerAchats={restaurerAchats}
    />
  );
}
