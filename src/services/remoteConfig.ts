// src/services/remoteConfig.ts
import { getRemoteConfig, fetchAndActivate, getNumber, getString } from '@react-native-firebase/remote-config';
import {
  SEUIL_DEBLOCAGE_THEME_DEFAUT,
  SESSIONS_DETAIL_GRATUITES_PAR_JOUR,
  MESSAGE_ACCUEIL_DEFAUT,
} from '../config/monetisation';
import {
  EXAMEN_NB_QUESTIONS_DEFAUT,
  EXAMEN_NB_SITUATIONS_DEFAUT,
  EXAMEN_SEUIL_BONNES_DEFAUT,
  EXAMENS_GRATUITS_PAR_JOUR_DEFAUT,
  RESULTAT_VERROUILLE_DEFAUT,
  normaliserResultatVerrouille,
  type ResultatVerrouille,
} from '../config/examen';

const CLE_SEUIL_DEBLOCAGE_THEME = 'seuil_deblocage_theme_defaut';
const CLE_SESSIONS_DETAIL_GRATUITES = 'sessions_detail_gratuites_par_jour';
const CLE_MESSAGE_ACCUEIL = 'message_accueil';
// Format de l'examen : pilotable à distance parce que les deux nombres officiels n'ont pas
// été vérifiés et sont pourtant présentés à l'utilisateur comme tels.
const CLE_EXAMEN_NB_QUESTIONS = 'examen_nb_questions';
const CLE_EXAMEN_NB_SITUATIONS = 'examen_nb_situations';
const CLE_EXAMEN_SEUIL_REUSSITE = 'examen_seuil_reussite';
const CLE_EXAMENS_GRATUITS = 'examens_gratuits_par_jour';
// Ce que l'écran de résultat verrouille : 'aucun' | 'revue' | 'tout'. Voir config/examen.ts —
// l'arbitrage se tranchera sur les chiffres du test fermé, sans republier.
const CLE_RESULTAT_VERROUILLE = 'resultat_verrouille';

export type ValeursRemoteConfig = {
  seuilDeblocageTheme: number;
  sessionsDetailGratuitesParJour: number;
  // Vide = on retombe sur le message d'origine (disponibilité hors connexion).
  messageAccueil: string;
  examenNbQuestions: number;
  examenNbSituations: number;
  examenSeuilReussite: number;
  examensGratuitsParJour: number;
  resultatVerrouille: ResultatVerrouille;
};

export const VALEURS_PAR_DEFAUT: ValeursRemoteConfig = {
  seuilDeblocageTheme: SEUIL_DEBLOCAGE_THEME_DEFAUT,
  sessionsDetailGratuitesParJour: SESSIONS_DETAIL_GRATUITES_PAR_JOUR,
  messageAccueil: MESSAGE_ACCUEIL_DEFAUT,
  examenNbQuestions: EXAMEN_NB_QUESTIONS_DEFAUT,
  examenNbSituations: EXAMEN_NB_SITUATIONS_DEFAUT,
  examenSeuilReussite: EXAMEN_SEUIL_BONNES_DEFAUT,
  examensGratuitsParJour: EXAMENS_GRATUITS_PAR_JOUR_DEFAUT,
  resultatVerrouille: RESULTAT_VERROUILLE_DEFAUT,
};

export async function chargerRemoteConfig(): Promise<ValeursRemoteConfig> {
  const remoteConfig = getRemoteConfig();
  remoteConfig.defaultConfig = {
    [CLE_SEUIL_DEBLOCAGE_THEME]: SEUIL_DEBLOCAGE_THEME_DEFAUT,
    [CLE_SESSIONS_DETAIL_GRATUITES]: SESSIONS_DETAIL_GRATUITES_PAR_JOUR,
    [CLE_MESSAGE_ACCUEIL]: MESSAGE_ACCUEIL_DEFAUT,
    [CLE_EXAMEN_NB_QUESTIONS]: EXAMEN_NB_QUESTIONS_DEFAUT,
    [CLE_EXAMEN_NB_SITUATIONS]: EXAMEN_NB_SITUATIONS_DEFAUT,
    [CLE_EXAMEN_SEUIL_REUSSITE]: EXAMEN_SEUIL_BONNES_DEFAUT,
    [CLE_EXAMENS_GRATUITS]: EXAMENS_GRATUITS_PAR_JOUR_DEFAUT,
    [CLE_RESULTAT_VERROUILLE]: RESULTAT_VERROUILLE_DEFAUT,
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
  const examenNbQuestions = getNumber(remoteConfig, CLE_EXAMEN_NB_QUESTIONS);
  const examenSeuilReussite = getNumber(remoteConfig, CLE_EXAMEN_SEUIL_REUSSITE);

  return {
    seuilDeblocageTheme: getNumber(remoteConfig, CLE_SEUIL_DEBLOCAGE_THEME),
    sessionsDetailGratuitesParJour: getNumber(remoteConfig, CLE_SESSIONS_DETAIL_GRATUITES),
    messageAccueil: getString(remoteConfig, CLE_MESSAGE_ACCUEIL),
    examenNbQuestions,
    // Mêmes garde-fous, même raison : la console Remote Config ne valide aucune cohérence entre
    // clés. Un seuil supérieur au nombre de questions rendrait l'examen impossible à réussir
    // chez tous les utilisateurs, et un nombre de mises en situation supérieur au total ne
    // laisserait aucune place aux questions simples — dans les deux cas sans erreur visible.
    examenNbSituations: Math.min(getNumber(remoteConfig, CLE_EXAMEN_NB_SITUATIONS), examenNbQuestions),
    examenSeuilReussite: Math.min(examenSeuilReussite, examenNbQuestions),
    examensGratuitsParJour: getNumber(remoteConfig, CLE_EXAMENS_GRATUITS),
    // Normalisée plutôt que lue telle quelle : une faute de frappe dans la console ne doit pas
    // produire un verrouillage arbitraire, mais retomber sur la valeur par défaut.
    resultatVerrouille: normaliserResultatVerrouille(getString(remoteConfig, CLE_RESULTAT_VERROUILLE)),
  };
}
