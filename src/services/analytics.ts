// src/services/analytics.ts
import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';

// Consentement RGPD : la collecte est coupée par défaut. Tant que l'utilisateur
// n'a pas explicitement accepté, aucun événement n'est envoyé (garde JS ci-dessous)
// et la collecte Firebase est désactivée au niveau natif (setAnalyticsCollectionEnabled).
let consentementAccorde = false;

/**
 * Applique le choix de consentement à Firebase Analytics.
 * Appelé par ConsentementContext au démarrage (valeur stockée) et à chaque changement.
 * - false : coupe la collecte (défaut, avant tout choix, ou refus).
 * - true  : réactive la collecte après acceptation.
 */
export function appliquerConsentementAnalytics(accorde: boolean) {
  consentementAccorde = accorde;
  setAnalyticsCollectionEnabled(getAnalytics(), accorde).catch((e: unknown) =>
    console.warn('Application du consentement Analytics impossible', e)
  );
}

function log(nom: string, params: Record<string, string | number | boolean> = {}) {
  if (!consentementAccorde) return;
  logEvent(getAnalytics(), nom, { ...params, appli: 'nat' });
}

export function logScreenView(screenName: string) {
  log('screen_view', { screen_name: screenName });
}

export function logSelectContent(params: {
  itemId: string;
  theme: string;
  palier: number;
  modeSession: string;
  navigationLibre: boolean;
}) {
  log('select_content', {
    content_type: 'question',
    item_id: params.itemId,
    theme: params.theme,
    palier: params.palier,
    mode_session: params.modeSession,
    navigation_libre: params.navigationLibre,
  });
}

export function logBulleInfoOuverte(params: { questionId: string; theme: string }) {
  log('bulle_info_ouverte', { question_id: params.questionId, theme: params.theme });
}

export function logReponseReveillee(params: { questionId: string; theme: string }) {
  log('reponse_reveillee', { question_id: params.questionId, theme: params.theme });
}

export function logReponseBonusDebloquee(params: {
  questionId: string;
  theme: string;
  viaPremium: boolean;
  gratuit: boolean;
}) {
  log('reponse_bonus_debloquee', {
    question_id: params.questionId,
    theme: params.theme,
    via_premium: params.viaPremium,
    gratuit: params.gratuit,
  });
}

export function logPubBonusVisionnee(params: { questionId: string; theme: string }) {
  log('pub_bonus_visionnee', { question_id: params.questionId, theme: params.theme });
}

export function logPubPalierVisionnee(params: { palierAvant: number; palierApres: number }) {
  log('pub_palier_visionnee', { palier_avant: params.palierAvant, palier_apres: params.palierApres });
}

export function logPubSessionDetailVisionnee(params: { mode: string; valeur: string | number }) {
  log('pub_session_detail_visionnee', { mode: params.mode, valeur: params.valeur });
}

export function logPalierDebloque(params: {
  palierAvant: number;
  palierApres: number;
  palierMax: number;
  themeDebloque: boolean;
}) {
  log('palier_debloque', {
    palier_avant: params.palierAvant,
    palier_apres: params.palierApres,
    palier_max: params.palierMax,
    theme_debloque: params.themeDebloque,
  });
}

export function logSessionDetailDemarree(params: {
  mode: string;
  valeur: string | number;
  gratuite: boolean;
  sessionsRestantesJour: number;
}) {
  log('session_detail_demarree', {
    mode: params.mode,
    valeur: params.valeur,
    gratuite: params.gratuite,
    sessions_restantes_jour: params.sessionsRestantesJour,
  });
}

export function logSessionDetailQuotaAtteint(params: { mode: string; valeur: string | number }) {
  log('session_detail_quota_atteint', { mode: params.mode, valeur: params.valeur });
}

export function logRevisionAleatoireDemarree(params: { nbFichesDispo: number }) {
  log('revision_aleatoire_demarree', { nb_fiches_dispo: params.nbFichesDispo });
}

export function logPurchase(params: { transactionId: string }) {
  log('purchase', {
    value: 4.99,
    currency: 'EUR',
    transaction_id: params.transactionId,
    item_id: 'premium_nat',
  });
}

export function logAchatPremiumAnnule() {
  log('achat_premium_annule');
}
