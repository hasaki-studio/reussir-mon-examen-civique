// src/services/ads.ts
//
// ⚠️ Contrainte de build : le SDK play-services-ads 25.4.0 (épinglé par
// react-native-google-mobile-ads) est compilé avec Kotlin 2.3, alors que React Native 0.86
// utilise Kotlin 2.1.20 — d'où l'échec de :react-native-google-mobile-ads:compileDebugKotlin
// sans réglage. Le contournement vit dans plugins/withCompatMetadonneesKotlin.js (voir les
// explications détaillées qui s'y trouvent). Ne pas le retirer tant que RN n'est pas passé
// à Kotlin ≥ 2.3.
//
// ⚠️ app.json porte désormais le vrai App ID Android (compte AdMob créé, app enregistrée en
// tests fermés). L'iosAppId, lui, reste celui de test : aucun compte AdMob n'existe pour la
// plateforme iOS tant que l'immatriculation DUNS n'a pas abouti.
//
// L'iosAppId n'est pas facultatif : sans lui, le SDK natif fait planter l'app au démarrage
// sur iOS. Il est renseigné dès maintenant (avec l'ID de test) pour que le jour d'un premier
// build iOS ne commence pas par un crash inexpliqué — à remplacer par le vrai le moment venu.
import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import {
  AdsConsent,
  MobileAds,
  TestIds,
  BannerAdSize,
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';

// ⚙️ Emplacement du bandeau publicitaire de l'écran Question.
//
// Unités réelles créées dans la console AdMob, gardées derrière `__DEV__` : Metro et le dev
// client (donc toute session de développement courante) continuent de recevoir les ID de test
// de Google, quel que soit l'état du compte AdMob. Seul un build release — `assembleRelease`,
// `bundleRelease`, ou un build publié — sert les vraies unités. Cliquer sur une vraie pub en
// environnement de test peut faire bannir le compte AdMob ; ce garde-fou rend l'erreur
// impossible plutôt que de compter sur la prudence de qui teste.
export const UNITE_PUB_BANNIERE = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : 'ca-app-pub-2352499055697790/4000356073';

// ⚙️ Emplacements des publicités avec récompense — format distinct du bandeau :
// l'utilisateur regarde volontairement une annonce en échange d'un contenu.
//
// Unités séparées plutôt qu'une seule : les rapports AdMob sont ventilés par unité, ce qui
// montre lequel des déblocages rapporte réellement ; et le format se règle par unité, donc
// l'un d'eux pourra passer en RewardedInterstitial sans toucher aux autres.
export const UNITE_PUB_PALIER = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-2352499055697790/3357443969';
export const UNITE_PUB_SESSION_DETAIL = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-2352499055697790/4052326961';
// Examen blanc au-delà du quota du jour : le levier propre à Civique, celui dont on attend le
// plus. Son unité doit rester distincte pour qu'AdMob dise ce qu'il rapporte réellement.
export const UNITE_PUB_EXAMEN = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-2352499055697790/3829974841';
// Dévoiler le résultat d'un examen déjà passé — quota d'examens et déblocage du résultat sont
// deux leviers distincts : le premier limite le nombre d'examens par jour, le second monétise
// chaque examen déjà passé, y compris ceux du quota gratuit.
export const UNITE_PUB_RESULTAT_EXAMEN = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-2352499055697790/3003978339';

// Format le plus compact du catalogue standard : 320×50 dp, hauteur fixe et prévisible.
// Choisi pour préserver la place laissée à la question, qui est le contenu de l'écran.
//
// Arbitrage assumé : LARGE_ANCHORED_ADAPTIVE_BANNER, utilisé auparavant, est plus haut et
// s'adapte à la largeur de l'appareil ; Google le présente explicitement comme conçu pour
// augmenter l'engagement et le revenu. Passer à BANNER coûte donc du revenu par impression.
// À rebasculer si les revenus publicitaires s'avéraient insuffisants.
export const TAILLE_BANNIERE = BannerAdSize.BANNER;

/**
 * Parcours de consentement publicitaire imposé par Google (UMP / IAB TCF), distinct du
 * consentement Analytics (ConsentementContext) : il couvre l'ensemble des vendeurs
 * publicitaires de la chaîne AdMob, pas seulement Firebase. Doit être exécuté avant toute
 * requête publicitaire ; peut afficher un formulaire natif si l'utilisateur est dans une
 * zone régulée (UE/UK) et n'a pas encore fait de choix.
 *
 * @returns true si l'app peut demander des publicités (consentement obtenu, ou non requis
 * hors zone régulée) ; false si refusé ou si le parcours échoue — par sécurité, on n'affiche
 * alors aucune publicité plutôt que de supposer un consentement implicite.
 */
export async function initialiserPublicites(): Promise<boolean> {
  try {
    const consentInfo = await AdsConsent.gatherConsent();
    if (!consentInfo.canRequestAds) return false;
  } catch (e) {
    console.warn('Parcours de consentement publicitaire impossible', e);
    return false;
  }

  // Apple exige sa propre autorisation avant tout accès à l'identifiant publicitaire (IDFA),
  // en plus du formulaire UMP de Google : deux régimes distincts, pas un doublon. Demandée
  // après l'UMP, qui explique d'abord à quoi sert la publicité — une boîte de dialogue système
  // surgissant sans contexte se fait refuser bien plus souvent.
  //
  // Un refus n'interrompt rien : les publicités restent diffusées, sans personnalisation.
  // Sans appel, iOS ne fournirait aucun identifiant et l'app serait rejetée à la revue.
  if (Platform.OS === 'ios') {
    try {
      await requestTrackingPermissionsAsync();
    } catch (e) {
      console.warn('Demande d\'autorisation de suivi impossible', e);
    }
  }
  try {
    // Plafonne le contenu servi : une app de préparation à un examen civique n'a
    // rien à gagner à afficher des annonces pour adultes. « T » (teen) écarte les catégories
    // les plus crues tout en conservant l'essentiel de l'inventaire — « MA » les autoriserait,
    // « PG » serait plus strict mais réduirait davantage le remplissage.
    await MobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.T });
    await MobileAds().initialize();
    return true;
  } catch (e) {
    console.warn('Initialisation Google Mobile Ads impossible', e);
    return false;
  }
}

/**
 * Réaffiche le formulaire de préférences publicitaires. Point d'ancrage pour un lien
 * "Gérer mes préférences publicitaires" dans les mentions légales — Google impose qu'un
 * utilisateur puisse revenir sur son choix à tout moment, au même titre que pour le
 * consentement Analytics.
 */
export async function ouvrirPreferencesPublicitaires(): Promise<void> {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch (e) {
    console.warn('Ouverture des préférences publicitaires impossible', e);
  }
}
