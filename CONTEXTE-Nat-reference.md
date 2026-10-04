# Contexte — Mon Entretien : Naturalisation

*Dernière mise à jour : 12/08/2026. Remplace la version du 03/08, dont l'essentiel des « points ouverts » a été traité depuis.*

> **Où en est le projet en une phrase** : l'application est complète et fonctionnelle, elle a été soumise en test fermé sur le Play Store et attend la validation de Google. Il reste à câbler le produit Premium et les identifiants publicitaires réels, deux choses qui dépendent de comptes tiers.

---

## Identité du produit

| | |
|---|---|
| **Nom Play Store** | Mon Entretien : Naturalisation |
| **Nom sous l'icône** | Naturalisation *(le titre complet serait tronqué par le lanceur)* |
| **Titre éditorial de l'accueil** | Réussir mon entretien |
| **Package Android** | `com.hasakistudio.reussirmonentretien` — **définitif**, aussi la clé de l'app dans Firebase |
| **Projet Firebase** | `nat-sheet` |
| **Dépôt** | `hasaki-studio/reussir-mon-entretien-naturalisation` (privé) |
| **Site** | `https://naturalisation.hasakistudio.fr` — mentions légales, confidentialité, contact, conseils |
| **Éditeur** | Achraf AZOUZI, personne physique. « Hasaki Studio » est un nom d'usage, **pas une société immatriculée** |
| **Contact** | contact@hasakistudio.fr |

⚠️ Le nom du dépôt et le package mentionnent « réussir mon entretien », l'ancien nom. Sans importance : le package n'est jamais visible des utilisateurs, et le renommer imposerait de recréer l'application Firebase.

---

## Stack technique — état réel

- **Expo SDK 57**, React Native **0.86.2**, TypeScript, Expo Router.
- **Développement en local**, plus via EAS : Android SDK + JDK 17 installés sur la machine Windows, builds par `gradlew`. EAS n'est plus utilisé.
- **Contenu** servi depuis **Firestore** (`questions_nat`), en écoute temps réel (`onSnapshot` filtré sur `actif == true`). Une modification dans la console se propage en quelques secondes à tous les appareils connectés.
- **Progression** dans `EtatContext` (React Context + AsyncStorage) : palier, premium, bonus débloqués, quotas du jour.
- **Analytics** : Firebase Analytics, implémenté, sous consentement *opt-in*.
- **Remote Config** : implémenté — quatre paramètres pilotables à distance.
- **App Check** : implémenté, `debug` en développement, **Play Integrity** en release.
- **Publicité** : AdMob réel — bandeau et publicités avec récompense, parcours de consentement UMP. Identifiants de **test** pour l'instant.
- **Achat intégré** : `expo-iap`, Google Play Billing, produit non consommable `premium_nat`. **Non fonctionnel** faute de produit créé dans la Play Console.

### Dépendances notables

```
expo-iap@5.0.1
react-native-google-mobile-ads@16.4.0
@react-native-firebase/{app,analytics,app-check,firestore,remote-config}@26.0.0
```

---

## Pièges de build résolus — à ne pas réintroduire

**Conflit Kotlin.** `play-services-ads` 25.4.0 est compilé avec Kotlin 2.3, React Native 0.86 impose Kotlin 2.1.20. Monter le projet en 2.3.20 règle AdMob mais fait planter le compilateur sur `expo-modules-core`, `gesture-handler` et `safe-area-context`. La solution retenue est le plugin `plugins/withCompatMetadonneesKotlin.js`, qui injecte `-Xskip-metadata-version-check`. **Ne pas remplacer par une montée de version de Kotlin.**

**Signature de release.** Le gabarit Expo signe la release avec la clé de **debug**, que Google Play rejette. `plugins/withSignatureRelease.js` injecte une vraie configuration de signature, lisant les identifiants depuis `~/.gradle/gradle.properties` (`HASAKI_UPLOAD_*`), **hors du dépôt**. En leur absence, retour silencieux sur la clé de debug — d'où l'importance de vérifier le certificat de l'AAB avant tout envoi :

```
keytool -printcert -jarfile app-release.aab   # doit afficher CN=Achraf AZOUZI
```

**Le dossier `android/` est régénéré à chaque `expo prebuild`.** Toute modification native doit donc vivre dans un plugin de configuration, jamais dans le fichier généré.

**Chemins Windows.** Le projet vit dans `C:\dev\naturalisation` et non sous un chemin long : la compilation NDK butait sur la limite de 260 caractères.

---

## Monétisation — état exact

| Levier | État | Bloqué par |
|---|---|---|
| Bandeau publicitaire (écran Question) | Fonctionnel, **ID de test** | Compte AdMob |
| Pub avec récompense — palier | Fonctionnel, **ID de test** | Compte AdMob |
| Pub avec récompense — session détaillée | Fonctionnel, **ID de test** | Compte AdMob |
| Pub avec récompense — réponse bonus | Fonctionnel, **ID de test** | Compte AdMob |
| Premium (achat unique) | Code complet, **échoue à l'exécution** | Produit `premium_nat` absent de la Play Console |

`PubSimulee` a été **supprimé** et remplacé par `PubRecompensee`, adossé à `RewardedAd`. Le déblocage est conditionné à l'événement de récompense émis par Google : fermer l'annonce avant la fin ne débloque rien.

⚠️ **Ne jamais mettre les identifiants AdMob réels dans un build de test.** Un clic sur une vraie annonce depuis un build non publié peut faire bannir le compte AdMob.

### Le Premium, concrètement

Le code est complet et testé : `AchatPremiumContext` gère l'achat, la restauration silencieuse une fois par session, la restauration manuelle depuis les mentions légales, et l'affichage des erreurs. Il ne manque que le produit côté Google.

Aujourd'hui, appuyer sur « Passer en Premium » affiche « L'achat n'a pas pu aboutir » — c'est le comportement attendu, pas un bug. Le prix affiché est `PRIX_PREMIUM_INDICATIF` (4,99 €) parce que `fetchProducts` ne trouve rien ; **le jour où le vrai prix s'affiche, c'est que la facturation est câblée.** C'est le test le plus fiable.

**Ce qu'il faut réellement pour créer `premium_nat`** : un **profil de paiement Google** rattaché au compte développeur. Google interdit de créer un produit payant sans lui. Ce profil se crée **en tant que particulier** — aucune société n'est exigée à ce stade.

Le produit se crée ensuite dans Monétiser avec Play → Produits intégrés, type produit unique (non consommable), identifiant exactement `premium_nat`. Puis s'ajouter dans **Configuration → Test de licence** pour acheter sans être débité : c'est ainsi qu'on teste tout le parcours sans toucher un euro.

La vraie contrainte n'est donc pas technique mais fiscale : **percevoir des revenus commerciaux suppose l'immatriculation**. Elle n'est pas nécessaire pour créer le produit ni pour le tester, mais elle l'est avant de vendre à de vrais utilisateurs.

---

## Conformité — ce qui est en place

- **Consentement Analytics** : écran d'*opt-in* au premier lancement, refus aussi accessible que l'acceptation (exigence CNIL), révocable depuis les mentions légales.
- **Consentement publicitaire** : parcours UMP de Google (IAB TCF v2), distinct du précédent, révocable depuis les mentions légales. Aucune requête publicitaire avant accord.
- **Contenu publicitaire** plafonné à `T` via `setRequestConfiguration`.
- **Mentions légales** complètes dans l'app : éditeur avec domicile et téléphone (obligatoire pour une personne physique), données personnelles, analytics, publicité, achats et rétractation, propriété intellectuelle, liens vers le site.
- **App Check** protège Firestore contre l'aspiration de la banque de questions.

⚠️ **Non vérifié** : les affirmations sur l'examen civique (obligatoire depuis le 1ᵉʳ janvier 2026, QCM de 40 questions, 32 bonnes réponses, français passé de B1 à B2) sont affichées dans l'app et sur le site sans avoir pu être recoupées. À valider avec service-public.fr.

---

## Paramètres pilotables à distance (Remote Config)

| Clé | Effet |
|---|---|
| `seuil_deblocage_theme_defaut` | Palier à partir duquel « Réviser par thème » se débloque |
| `sessions_detail_gratuites_par_jour` | Sessions de révision détaillée gratuites par jour |
| `bonus_gratuits_par_jour` | Réponses bonus offertes par jour, sans publicité |
| `message_accueil` | Remplace le message vert de l'accueil. Vide = message par défaut |

Délai de propagation : **immédiat en développement, jusqu'à 12 h en release** (`minimumFetchIntervalMillis`).

C'est le bon levier pour ajuster le rythme de déblocage pendant la phase de test, sans republier.

---

## Contenu — règles à respecter

Source éditoriale : Google Sheet *« Nat-test 7310 »*, onglet `NAT`, synchronisé vers Firestore par un script Apps Script.

**La feuille est la seule source de vérité.** La synchronisation réécrit les documents entiers : toute correction faite directement dans la console Firebase sera écrasée à la synchronisation suivante, sans avertissement.

**Deux règles qui protègent la progression des utilisateurs.**

Les bonus débloqués sont stockés par **identifiant de document** (`bonusDebloques: string[]`). Si la synchronisation supprime puis recrée les documents, les identifiants changent et **tous les bonus débloqués deviennent invisibles**. Modifier les documents en place, ou imposer des identifiants stables et explicites.

Changer le **thème** d'une question est sans conséquence. Changer son **palier** en a : les fiches sont filtrées par `palier <= palier de l'utilisateur`, donc déplacer une question vers un palier supérieur la fait disparaître chez ceux qui ne l'ont pas atteint, et leur compteur baisse.

Correspondance des colonnes : `Réponse` → `reponse` (⚠️ **pas** `reponseModele`), `information` → `infoBulle`, `Niveau` → `palier`, `BONUS` → `bonus`.

---

## Arborescence

```
services/firebase.ts              # ecouterQuestions(), API modulaire, onSnapshot filtré actif==true
plugins/
  withCompatMetadonneesKotlin.js  # -Xskip-metadata-version-check (conflit Kotlin AdMob)
  withSignatureRelease.js         # signature release depuis ~/.gradle/gradle.properties
app/                              # routes Expo Router
  _layout.tsx                     # RemoteConfig > Publicites > Consentement > Etat > Questions > AchatPremium
  index.tsx  mentions.tsx  conseils.tsx  themes.tsx  liste.tsx  quiz.tsx
src/
  config/
    monetisation.ts               # SKU, prix indicatif, valeurs par défaut, messages d'accueil
    liens.ts                      # URLs du site + liens officiels + ouvrirLien()
    datesCles.ts                  # dates clés de la République + messages ponctuels datés
  services/
    firebase / analytics.ts  ads.ts  appCheck.ts  remoteConfig.ts
  state/
    EtatContext  QuestionsContext  QuizContext  RemoteConfigContext
    ConsentementContext            # opt-in Analytics
    PublicitesContext              # parcours UMP
    AchatPremiumContext            # Google Play Billing
  components/
    LisereTricolore  EnTeteMarque
    BandeauPublicitaire            # bandeau AdMob, masqué pour les premium
    PubRecompensee                 # remplace PubSimulee (supprimé)
  screens/
    Accueil  MentionsLegales  ThemesDetail  ListeQuestions  Question
    ConseilsRevision  Chargement  PremierLancementHorsLigne  ConsentementRGPD
```

---

## Où en est la publication

Soumise en **test fermé (Alpha)**, en attente de validation par Google. Testeurs définis via la liste « Test 1 du 12 août », 25 pays.

⚠️ **À vérifier** : pour les comptes développeur personnels créés depuis fin 2023, Google exige un test fermé avec au moins **douze testeurs inscrits pendant quatorze jours consécutifs** avant d'autoriser l'accès à la production. Ce point conditionne le calendrier bien plus que la revue en cours.

---

## Actions à faire

### 1. Dès maintenant, sans attendre Google

- [ ] **Récupérer le SHA-256** dans Play Console → Configuration → Signature de l'application (celui du certificat *de l'application*, pas celui d'upload), et l'ajouter dans Firebase → Paramètres du projet → app Android. Disponible dès le téléversement, indépendamment de la revue.
- [ ] **Ne pas activer l'enforcement App Check** avant que ce SHA-256 soit enregistré. Sinon l'app reste sur un écran de chargement infini, sans message d'erreur.
- [ ] **Créer le produit `premium_nat`** dans Play Console → Monétiser avec Play → Produits intégrés. Type : produit unique (non consommable). L'identifiant doit être exactement `premium_nat`. Puis s'ajouter dans Configuration → Test de licence pour acheter sans être débité.
- [ ] **Vérifier les affirmations sur l'examen civique** avec service-public.fr.
- [ ] **Tester les cinq liens officiels** de l'écran Conseils sur l'appareil — celui de service-public.fr en priorité, son identifiant de fiche est le moins sûr.

### 2. Avant la production

- [ ] **Immatriculer la micro-entreprise.** Publicité et achat intégré constituent une activité commerciale. Rétablir ensuite la mention et le SIREN dans l'app **et** sur le site.
- [ ] **Créer le compte AdMob**, puis quatre unités : un bandeau et trois avec récompense. Remplacer les `TODO(monétisation)` de `src/services/ads.ts` et les App IDs d'`app.json`. **Jamais avant la publication.**
- [ ] **Corriger le site** : la politique de confidentialité et la page Contact portent encore `hasaki-studio.contact@gmail.com` et l'ancienne identité « micro-entreprise ».
- [ ] Incrémenter `android.versionCode` à chaque envoi — Google refuse deux fois le même.

### 3. Contenu

- [ ] Retagger les questions en `palierProvisoire: true`.
- [ ] Rééquilibrer les paliers à mesure que le contenu grandit (viser 8 à 12 questions par palier).
- [ ] Ajuster `bonus_gratuits_par_jour` et `seuil_deblocage_theme_defaut` selon les retours des testeurs — sans republier, via Remote Config.

### 4. iOS — en cours

La préparation du code est faite. Ce qui reste dépend du compte Apple.

- [ ] **Ouvrir le compte Apple Developer** (99 €/an, vérification d'identité de quelques jours). Chemin critique : rien ne démarre sans lui.
- [ ] **Ajouter une application iOS dans Firebase** (`com.hasakistudio.reussirmonentretien`), télécharger `GoogleService-Info.plist` à la racine, puis déclarer `"googleServicesFile": "./GoogleService-Info.plist"` dans la section `ios` d'`app.json`. **Non déclaré pour l'instant** : pointer vers un fichier absent ferait échouer le prebuild.
- [ ] **Compléter la liste SKAdNetwork** depuis la documentation AdMob. Seul l'identifiant de Google (`cstr6suwn9.skadnetwork`) est renseigné ; une liste incomplète fait perdre l'attribution des campagnes.
- [ ] **Créer le produit d'achat dans App Store Connect** sous l'identifiant `premium_nat`. Les deux magasins ne partagent rien : un achat Android ne débloque pas un iPhone.
- [ ] **App Check Apple** : renseigner le Team ID dans Firebase et activer App Attest.
- [ ] **Construire via EAS** (`eas build --profile testflight --platform ios`) : macOS est indispensable et la machine est sous Windows.
- [ ] Incrémenter `ios.buildNumber` à chaque envoi TestFlight.

**Ce qui est déjà fait** : `ios.bundleIdentifier`, `buildNumber`, branche `apple` dans `requestPurchase`, App Tracking Transparency (`expo-tracking-transparency`, demandée après le formulaire UMP), texte d'explication du suivi, `eas.json`.

**Avantage de calendrier** : TestFlight n'impose pas l'équivalent des douze testeurs pendant quatorze jours. Les testeurs iPhone peuvent essayer dès le premier build.

### 5. Reporté

- [ ] **Application Civique** : voir `CONTEXTE-Civique.md`.
- [ ] **Application Civique** : toujours en standby, non démarrée.
- [ ] **Premium croisé** entre Nat et Civique par code de déblocage : non implémenté.
- [ ] Feedback visuel en cas d'échec de la **restauration** d'achat (l'échec d'achat, lui, est traité).

---

## Conventions de travail

- Commits et commentaires en **français**, explicitant le *pourquoi* plutôt que le *quoi*.
- Une branche par chantier, partant de `main` ; les branches fusionnées ne sont pas réutilisées.
- `npx tsc --noEmit` avant chaque commit.
- Les modifications TypeScript ne demandent qu'un `assembleRelease` (quelques minutes) ; toucher à `app.json`, aux icônes ou aux plugins impose un `expo prebuild --clean` suivi d'une compilation complète (environ une heure).
