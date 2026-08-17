// src/services/appCheck.ts
import { getApp } from '@react-native-firebase/app';
import {
  initializeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check';

let initialise = false;

/**
 * Active Firebase App Check : chaque requête vers Firebase (Firestore, Remote Config)
 * est signée par un jeton d'attestation prouvant qu'elle provient bien de l'application
 * authentique, non tamponnée. C'est la parade contre les bots / scripts qui interrogent
 * directement l'API REST Firestore avec la clé publique (ex. aspiration de la banque de
 * questions).
 *
 * - Android : Play Integrity en production, provider « debug » en développement.
 * - Apple   : App Attest avec repli DeviceCheck en production, « debug » en développement.
 *
 * ⚠️ En développement, le provider « debug » imprime un jeton dans la console au premier
 * lancement (« App Check debug token: XXXX-...»). Il faut le copier dans :
 * Firebase Console → App Check → onglet « Applications » → (⋮) « Gérer les jetons de debug ».
 * Sans cela, une fois l'enforcement activé, l'app de dev sera elle aussi bloquée.
 *
 * À appeler le plus tôt possible, avant toute lecture Firestore / Remote Config.
 */
export function initialiserAppCheck(): void {
  if (initialise) return;
  initialise = true;

  const provider = new ReactNativeFirebaseAppCheckProvider();
  provider.configure({
    android: {
      provider: __DEV__ ? 'debug' : 'playIntegrity',
    },
    apple: {
      provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
    },
    isTokenAutoRefreshEnabled: true,
  });

  try {
    initializeAppCheck(getApp(), {
      provider,
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn('Initialisation App Check impossible', e);
  }
}
