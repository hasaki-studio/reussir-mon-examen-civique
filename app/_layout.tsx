import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { EtatProvider, useEtat } from '../src/state/EtatContext';
import { QuestionsProvider, useQuestionsContext } from '../src/state/QuestionsContext';
import { QuizProvider } from '../src/state/QuizContext';
import { RemoteConfigProvider } from '../src/state/RemoteConfigContext';
import { ConsentementProvider, useConsentement } from '../src/state/ConsentementContext';
import { AchatPremiumProvider } from '../src/state/AchatPremiumContext';
import { PublicitesProvider } from '../src/state/PublicitesContext';
import { useReseau } from '../src/hooks/useReseau';
import { useAnalyticsScreenTracking } from '../src/hooks/useAnalyticsScreenTracking';
import { couleurs } from '../src/theme/colors';
import { POLICES_A_CHARGER } from '../src/theme/typographie';
import LisereTricolore from '../src/components/LisereTricolore';
import Chargement from '../src/screens/Chargement';
import PremierLancementHorsLigne from '../src/screens/PremierLancementHorsLigne';
import ConsentementRGPD from '../src/screens/ConsentementRGPD';
import { initialiserAppCheck } from '../src/services/appCheck';

// Attestation anti-bots : doit s'exécuter avant toute requête Firestore / Remote Config,
// donc au chargement du module racine (avant le premier rendu et les effets des providers).
initialiserAppCheck();

function ContenuRacine() {
  useAnalyticsScreenTracking();
  const { pretChargement } = useEtat();
  const { chargement: chargementQuestions } = useQuestionsContext();
  const { consentement, pretConsentement, definirConsentement } = useConsentement();
  const connecte = useReseau();
  const [policesChargees, erreurPolices] = useFonts(POLICES_A_CHARGER);
  // En cas d'échec de chargement des polices, on n'immobilise pas l'app :
  // React Native retombe sur la police système.
  const policesPretes = policesChargees || !!erreurPolices;
  // Attend AsyncStorage (progression) + premier snapshot Firestore (contenu)
  const donneesPretes = pretChargement && !chargementQuestions;
  const pret = donneesPretes && policesPretes;
  // Premier lancement : aucun cache Firestore, le chargement resterait bloqué sans réseau.
  // Basé sur les seules données : les polices sont locales, l'absence de réseau n'y change rien.
  const bloqueSansReseau = !donneesPretes && !connecte;
  // Consentement RGPD : au premier lancement (aucun choix stocké), on le demande avant
  // d'entrer dans l'app. L'écran est local (ne dépend que des polices), donc affichable
  // même hors ligne et sans attendre Firestore.
  const doitDemanderConsentement = pretConsentement && consentement === null;

  let contenu;
  if (!policesPretes) {
    contenu = <Chargement />;
  } else if (doitDemanderConsentement) {
    contenu = (
      <ConsentementRGPD
        onAccepter={() => definirConsentement('accepte')}
        onRefuser={() => definirConsentement('refuse')}
      />
    );
  } else if (pret) {
    contenu = (
      <QuizProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </QuizProvider>
    );
  } else if (bloqueSansReseau) {
    contenu = <PremierLancementHorsLigne />;
  } else {
    contenu = <Chargement />;
  }

  return (
    <View style={styles.pageWrapper}>
      <LisereTricolore />
      {contenu}
    </View>
  );
}

export default function RootLayout() {
  return (
    // Requis par useSafeAreaInsets (BandeauPublicitaire, PubRecompensee) : sans lui, en
    // navigation Android à 3 boutons, ces éléments seraient masqués par la barre système.
    <SafeAreaProvider>
      <RemoteConfigProvider>
        <PublicitesProvider>
          <ConsentementProvider>
            <EtatProvider>
              <QuestionsProvider>
                <AchatPremiumProvider>
                  <ContenuRacine />
                </AchatPremiumProvider>
              </QuestionsProvider>
            </EtatProvider>
          </ConsentementProvider>
        </PublicitesProvider>
      </RemoteConfigProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  pageWrapper: { flex: 1, backgroundColor: couleurs.papier },
});
