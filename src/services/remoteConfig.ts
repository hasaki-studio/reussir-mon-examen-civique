// src/services/remoteConfig.ts
import { getRemoteConfig, fetchAndActivate, getNumber, getString } from '@react-native-firebase/remote-config';
import {
  SEUIL_DEBLOCAGE_THEME_DEFAUT,
  SESSIONS_DETAIL_GRATUITES_PAR_JOUR,
  BONUS_GRATUITS_PAR_JOUR_DEFAUT,
  MESSAGE_ACCUEIL_DEFAUT,
} from '../config/monetisation';

const CLE_SEUIL_DEBLOCAGE_THEME = 'seuil_deblocage_theme_defaut';
const CLE_SESSIONS_DETAIL_GRATUITES = 'sessions_detail_gratuites_par_jour';
const CLE_BONUS_GRATUITS = 'bonus_gratuits_par_jour';
const CLE_MESSAGE_ACCUEIL = 'message_accueil';

export type ValeursRemoteConfig = {
  seuilDeblocageTheme: number;
  sessionsDetailGratuitesParJour: number;
  bonusGratuitsParJour: number;
  // Vide = on retombe sur le message d'origine (disponibilité hors connexion).
  messageAccueil: string;
};

export const VALEURS_PAR_DEFAUT: ValeursRemoteConfig = {
  seuilDeblocageTheme: SEUIL_DEBLOCAGE_THEME_DEFAUT,
  sessionsDetailGratuitesParJour: SESSIONS_DETAIL_GRATUITES_PAR_JOUR,
  bonusGratuitsParJour: BONUS_GRATUITS_PAR_JOUR_DEFAUT,
  messageAccueil: MESSAGE_ACCUEIL_DEFAUT,
};

export async function chargerRemoteConfig(): Promise<ValeursRemoteConfig> {
  const remoteConfig = getRemoteConfig();
  remoteConfig.defaultConfig = {
    [CLE_SEUIL_DEBLOCAGE_THEME]: SEUIL_DEBLOCAGE_THEME_DEFAUT,
    [CLE_SESSIONS_DETAIL_GRATUITES]: SESSIONS_DETAIL_GRATUITES_PAR_JOUR,
    [CLE_BONUS_GRATUITS]: BONUS_GRATUITS_PAR_JOUR_DEFAUT,
    [CLE_MESSAGE_ACCUEIL]: MESSAGE_ACCUEIL_DEFAUT,
  };
  // En dev, on veut voir l'effet d'un changement de valeur immédiatement (pas d'attente 12h).
  remoteConfig.settings = {
    minimumFetchIntervalMillis: __DEV__ ? 0 : 43200000,
    fetchTimeoutMillis: 60000,
  };

  try {
    await fetchAndActivate(remoteConfig);
  } catch (e) {
    console.warn('Remote Config fetch impossible, valeurs par défaut utilisées', e);
  }

  // getNumber renvoie le default déjà appliqué ci-dessus même si le fetch a échoué.
  return {
    seuilDeblocageTheme: getNumber(remoteConfig, CLE_SEUIL_DEBLOCAGE_THEME),
    sessionsDetailGratuitesParJour: getNumber(remoteConfig, CLE_SESSIONS_DETAIL_GRATUITES),
    bonusGratuitsParJour: getNumber(remoteConfig, CLE_BONUS_GRATUITS),
    messageAccueil: getString(remoteConfig, CLE_MESSAGE_ACCUEIL),
  };
}
