// src/services/analytics.ts
import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';
import type { Quizz } from '../config/quizz';

// Consentement RGPD : la collecte est coupée par défaut. Tant que l'utilisateur
// n'a pas explicitement accepté, aucun événement n'est envoyé (garde JS ci-dessous)
// et la collecte Firebase est désactivée au niveau natif (setAnalyticsCollectionEnabled).
let consentementAccorde = false;

// Quizz consulté au moment de l'événement, joint à tous les envois.
//
// L'application sœur étiquetait ses événements `appli: 'nat'`, un projet Firebase étant
// envisagé pour les deux produits. Civique a le sien : la dimension utile n'est plus
// l'application mais le parcours, et c'est la seule façon de répondre à « lequel des trois
// quizz est réellement utilisé ». Posé par la route (useQuizzRoute), null hors d'un quizz.
let quizzCourant: Quizz | null = null;

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

/** Déclare le quizz consulté. Appelé par la route, pas par les écrans. */
export function definirQuizzAnalytics(quizz: Quizz | null) {
  quizzCourant = quizz;
}

function log(nom: string, params: Record<string, string | number | boolean> = {}) {
  if (!consentementAccorde) return;
  logEvent(getAnalytics(), nom, { ...params, quizz: quizzCourant ?? 'aucun' });
}

export function logScreenView(screenName: string) {
  log('screen_view', { screen_name: screenName });
}

export function logSelectContent(params: {
  itemId: string;
  theme: string;
  palier: number;
  modeSession: string;
}) {
  log('select_content', {
    content_type: 'question',
    item_id: params.itemId,
    theme: params.theme,
    palier: params.palier,
    mode_session: params.modeSession,
  });
}

/**
 * Réponse à une question. C'est l'événement qui porte la valeur pédagogique de la mesure :
 * croisé avec le thème et le palier, il désigne les notions sur lesquelles les utilisateurs
 * échouent, donc le contenu à réécrire en priorité.
 */
export function logReponseChoisie(params: {
  questionId: string;
  theme: string;
  palier: number;
  modeSession: string;
  correct: boolean;
}) {
  log('reponse_choisie', {
    question_id: params.questionId,
    theme: params.theme,
    palier: params.palier,
    mode_session: params.modeSession,
    correct: params.correct,
  });
}

export function logRevisionDemarree(params: { nbQuestionsDispo: number }) {
  log('revision_demarree', { nb_questions_dispo: params.nbQuestionsDispo });
}

export function logExamenDemarre(params: {
  nbQuestions: number;
  gratuit: boolean;
  examensRestantsJour: number;
}) {
  log('examen_demarre', {
    nb_questions: params.nbQuestions,
    gratuit: params.gratuit,
    examens_restants_jour: params.examensRestantsJour,
  });
}

export function logExamenTermine(params: {
  score: number;
  total: number;
  seuil: number;
  reussi: boolean;
}) {
  log('examen_termine', {
    score: params.score,
    total: params.total,
    seuil: params.seuil,
    reussi: params.reussi,
  });
}

export function logExamenQuotaAtteint() {
  log('examen_quota_atteint');
}

export function logPubExamenVisionnee() {
  log('pub_examen_visionnee');
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

/**
 * Achat abouti. La valeur vient du prix réellement facturé par le store, transmis par
 * AchatPremiumContext : un montant écrit en dur diverge du chiffre d'affaires réel dès le
 * premier changement de prix ou de devise, et fausse silencieusement tout calcul de retour sur
 * investissement publicitaire. Quand le store ne l'a pas fourni, on préfère un événement sans
 * montant à un montant faux.
 */
export function logPurchase(params: { transactionId: string; valeur?: number; devise?: string }) {
  log('purchase', {
    transaction_id: params.transactionId,
    item_id: 'premium_civique',
    ...(params.valeur !== undefined
      ? { value: params.valeur, currency: params.devise ?? 'EUR' }
      : {}),
  });
}

export function logAchatPremiumAnnule() {
  log('achat_premium_annule');
}
