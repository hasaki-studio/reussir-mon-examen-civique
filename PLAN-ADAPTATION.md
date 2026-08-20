# Plan d'adaptation — de Nat vers Civique

*Établi le 17/08/2026, après lecture intégrale du duplicata (≈ 3 500 lignes hors `components/ui`). Mis à jour le même jour : les lots 0, 1 et 2 sont écrits.*

Le dépôt était une copie de « Mon Entretien : Naturalisation » à son état soumis au Play Store. Six lots, dans cet ordre.

---

## État d'avancement

| Lot | État |
|---|---|
| 0 — Couper les liens avec Nat | **Fait côté dépôt.** Les actions en console restent à faire (§ 0.3) |
| 1 — Modèle QCM et trois quizz | **Fait** |
| 2 — Mode examen blanc | **Fait** |
| 3 — Contenu | **Démarré.** 80 questions rédigées sur ~500 (paliers 1-2 des trois quizz, palier 3 amorcé), dans [`docs/feuille-questions-brouillon.csv`](docs/feuille-questions-brouillon.csv) — brouillon à relire avant import dans la feuille Google. 12 mises en situation sur les 36 requises (12 par quizz). Le thème « Livret du citoyen 2026 » n'est pas encore couvert : à écrire une fois son contenu officiel confirmé. Format : [`docs/feuille-questions.md`](docs/feuille-questions.md) |
| 4 — Légal et conformité | À faire |
| 5 — Code croisé, iOS | Reporté |

### Ce qu'il faut pour un premier build sur téléphone

Le projet Firebase est le seul prérequis, et il se règle en dix minutes : créer le projet, y déclarer l'application Android `com.hasakistudio.examencivique`, déposer `google-services.json` à la racine, créer la base Firestore. Ni AdMob, ni Play Console, ni App Check ne sont nécessaires à ce stade — **ne pas activer l'enforcement App Check**, qui bloquerait l'application sur un écran de chargement infini.

Expo Go ne peut pas servir de raccourci : Firebase, AdMob et `expo-iap` sont des modules natifs absents du client Expo Go. Il faut `expo run:android` ou un dev client.

Le contenu, lui, n'est pas un prérequis : `src/config/questionsDemo.ts` fournit quinze questions locales en développement, sans quoi l'application se lancerait sur une liste vide et le mode examen n'aurait rien à montrer. Le garde-fou est `__DEV__` : ce contenu ne peut pas partir en release.

⚠️ **Le dépôt ne compile pas tant que le projet Firebase de Civique n'existe pas**, et c'est voulu : `google-services.json` déclare encore le package de Nat, qui ne correspond plus à `com.hasakistudio.examencivique`. Le build Android s'arrête donc sur « No matching client found for package name » au lieu d'écrire silencieusement dans le projet de l'application sœur. Déposer les deux fichiers du nouveau projet lève le blocage.

### Écarts assumés par rapport au plan initial

Cinq décisions prises à l'écriture, à partir du prototype HTML du 17/08 et des retours qui ont suivi :

1. **Le paramètre Analytics s'appelle `quizz`, pas `appli`.** Les deux applications ayant des projets Firebase distincts, la dimension utile est le parcours, pas le produit.
2. **Le seuil de réussite est proportionnel, pas fixe.** Tant que le corpus compte moins de 40 questions, l'examen en pose moins ; un seuil figé à 32 rendrait l'échec mathématiquement certain. La proportion officielle (80 %) est conservée, arrondie au supérieur.
3. **Retour en arrière autorisé en révision, interdit en examen.** L'examen réel ne permet pas de revenir sur une réponse, et le récapitulatif de fin joue déjà ce rôle ; en révision, relire la question précédente et son explication est au contraire le geste attendu. Le blocage est appliqué dans `QuizContext`, pas seulement à l'affichage.
4. **« Réviser en détail » se débloque au dernier palier** par défaut (`SEUIL_DEBLOCAGE_THEME_DEFAUT = 99`, borné au palier maximal), comme le prototype. Le levier Remote Config reste disponible pour ouvrir plus tôt.
5. **Une question appartient à un seul quizz**, contrairement à l'`applicable[]` partagé du prototype. Un énoncé valable pour plusieurs titres est dupliqué dans la feuille, avec ses propres propositions : c'est le jeu de propositions qui porte la difficulté propre à chaque titre. Le surcoût éditorial est assumé, et le code y gagne — plus aucune logique de partage.

---

## Ce qu'il faut comprendre avant de commencer

L'écart entre Nat et Civique **n'est pas un renommage**, et c'est la principale erreur d'estimation à éviter.

Nat est une application de **fiches à réponse ouverte** : une question, un bouton « Dévoiler la réponse », un texte libre, et un « cachet » Bonus payant par publicité. Son modèle de données est `{question, reponse, bonus?, infoBulle}` et `src/screens/Question.tsx` est construit autour de ce geste.

Civique est un **QCM** : une question, quatre propositions, une bonne réponse, une explication. Le modèle devient `{question, choix[], bonne, explication, quizz}` et l'écran de question est à réécrire, pas à ajuster. Tout ce qui touche la question elle-même suit : `filtresQuestions`, `useQuestions`, `QuizContext`, `ListeQuestions`. Et `EtatContext`, qui porte aujourd'hui un état plat, doit porter un état par quizz.

En revanche, tout ce qui *entoure* la question — conformité, publicité, achat, attestation, pilotage à distance, thème graphique — se reprend tel quel. C'est l'essentiel du travail difficile, et il est déjà fait.

---

## Lot 0 — Couper les liens avec Nat

**Pourquoi en premier, et pourquoi seul :** en l'état, compiler ce dépôt produit une application qui écrit dans le projet Firebase de Nat, se déclare sous le package de Nat et étiquette ses événements `appli: 'nat'`. Ce ne sont pas des détails cosmétiques, ce sont des pollutions silencieuses et difficiles à défaire après coup.

Ce lot touche `app.json`, donc impose un `expo prebuild --clean` et une compilation complète (≈ 1 h). **Le faire en une seule passe.**

### 0.1 — Les huit héritages dangereux

| # | Où | En l'état | Pourquoi c'est grave |
|---|---|---|---|
| 1 | `google-services.json`, `GoogleService-Info.plist` | Configuration du projet `nat-sheet` | Firestore, Analytics et App Check de Civique taperaient dans le projet de Nat. Les événements des deux applications se mélangeraient, sans moyen simple de les démêler a posteriori. **À remplacer par les fichiers du nouveau projet Firebase.** |
| 2 | `app.json` → `extra.eas.projectId` | `153e81c9-…` = projet EAS de Nat | Un `eas build` ou un `eas update` publierait dans le projet de Nat. À supprimer (le build est local) ou à régénérer. |
| 3 | `app.json` → `scheme` | `reussirmonentretien` | Deux applications déclarant le même schéma sur un même appareil : Android affiche un sélecteur, les liens profonds deviennent ambigus. → `examencivique`. |
| 4 | `app.json` → `android.package`, `ios.bundleIdentifier` | `com.hasakistudio.reussirmonentretien` | Identité de l'application, clé Firebase et clé Play Console. → `com.hasakistudio.examencivique`. **Définitif.** |
| 5 | `app.json` → `versionCode: 6`, `ios.buildNumber: "6"` | Compteurs de Nat | Nouvelle fiche Play Store ⇒ repartir à `1`. |
| 6 | `src/services/analytics.ts` | `appli: 'nat'` en dur, `item_id: 'premium_nat'`, `value: 4.99` en dur | Étiquetage faux dès le premier événement. La valeur d'achat en dur diverge du prix réel du store dès qu'il change. |
| 7 | `src/config/monetisation.ts` | `STORAGE_KEY_ETAT = '@etat-naturalisation'`, `SKU_PREMIUM = 'premium_nat'` | Le SKU pointerait vers un produit d'une autre application. |
| 8 | `src/config/liens.ts` | `naturalisation.hasakistudio.fr` | URL de confidentialité vérifiée périodiquement par Google et saisie dans deux consoles. |

### 0.2 — Fichier par fichier

**`app.json`** — au-delà des points 2 à 5 :
- `name` : `"Test civique"` sous l'icône (le titre complet serait tronqué par le lanceur), le titre long allant dans la fiche Play Store.
- `slug` : `reussir-mon-examen-civique`.
- `googleServicesFile` (Android et iOS) : conservés tels quels **en pointant vers les nouveaux fichiers**. Ne pas retirer la ligne iOS : le fichier existe, un pointeur vers un fichier absent ferait échouer le prebuild.
- Les App ID AdMob de test restent en place — c'est volontaire jusqu'à la publication.
- `owner: "hasakistudio"` : à conserver.

**`package.json`** — `"name": "reussir-mon-entretien-naturalisation"` → `"reussir-mon-examen-civique"`. Sans effet fonctionnel, mais c'est ce qui s'affiche dans les traces d'erreur.

**`src/config/monetisation.ts`** :
- `STORAGE_KEY_ETAT` → `'@etat-civique-v1'`. Le suffixe de version n'est pas de la coquetterie : le lot 1 change la forme de l'état, et une clé versionnée permet de repartir proprement au lieu de fusionner un ancien objet avec le nouveau (`{ ...DEFAUT, ...JSON.parse(brut) }` accepte aujourd'hui n'importe quelle forme périmée sans broncher).
- `SKU_PREMIUM` → `'premium_civique'`.
- `SEUIL_DEBLOCAGE_THEME_DEFAUT`, `SESSIONS_DETAIL_GRATUITES_PAR_JOUR` : conservés.
- `BONUS_GRATUITS_PAR_JOUR_DEFAUT` : **supprimé** (lot 1).
- `MESSAGE_ACCUEIL_HORS_LIGNE` : « Fiches débloquées disponibles hors connexion » → parler de *questions*, pas de *fiches*, dans toute l'application.

**`src/config/liens.ts`** :
- `URL_CONFIDENTIALITE`, `URL_MENTIONS_LEGALES` → `civique.hasakistudio.fr`.
- Les cinq liens officiels sont orientés naturalisation. Civique couvre aussi CSP et carte de résident : la liste est à revoir au lot 4, avec les fiches service-public.fr correspondantes. Le mécanisme existant — une entrée vide rend la carte non cliquable — permet d'en désactiver une sans la supprimer, en attendant vérification.

**`src/services/analytics.ts`** :
- `appli: 'nat'` → le quizz courant. C'est le point qui structure toute la mesure de Civique : il faut pouvoir répondre à « lequel des trois quizz est réellement utilisé ». Le plus simple est un `let quizzCourant: Quizz` posé par le contexte de quizz actif, injecté par la fonction `log()` interne, exactement comme `consentementAccorde` l'est déjà.
- `logPurchase` : `item_id` → `premium_civique`, et `value` doit venir du prix réellement récupéré du store plutôt que d'un `4.99` en dur.

**`src/services/ads.ts`** : rien à changer au parcours UMP ni à l'ordre UMP → ATT (Apple rejette l'inverse). Seules les unités bougent, au lot 1.

**`src/config/datesCles.ts`** : la table est bonne telle quelle. Un commentaire mentionne « l'entretien d'assimilation » : à reformuler en « l'examen civique ».

**`src/screens/ConsentementRGPD.tsx`, `PremierLancementHorsLigne.tsx`, `ListeQuestions.tsx`, `components/*`** : une occurrence de vocabulaire chacun (« naturalisation », « fiche »). Passe de relecture, sans logique.

**Ménage** : `notepad` (fichier vide à la racine) et `CONTEXTE.md` — qui décrit Nat et n'a plus de raison d'être ici sous ce nom. Le renommer `CONTEXTE-Nat-reference.md` : il reste précieux comme mémoire des pièges de build et de publication, mais son titre actuel dit qu'il décrit ce dépôt, ce qui est faux.

### 0.3 — Consoles (hors dépôt, mais bloquant)

- [ ] Créer le projet Firebase Civique, y déclarer l'application Android `com.hasakistudio.examencivique`, télécharger `google-services.json`.
- [ ] Créer la collection `questions_civique` et ses règles de sécurité (lecture seule, écriture interdite depuis le client).
- [ ] Enregistrer le **jeton de debug App Check** du nouveau projet au premier lancement en développement — sinon, une fois l'enforcement activé, l'application de développement se bloque elle aussi sur un écran de chargement infini, sans message.
- [ ] **Ne pas activer l'enforcement App Check** avant d'avoir enregistré le SHA-256 du certificat *de l'application* (Play Console → Configuration → Signature), disponible dès le premier téléversement.
- [ ] Créer la fiche Play Console, y déclarer l'URL de confidentialité.
- [ ] `withSignatureRelease` lit `HASAKI_UPLOAD_*` dans `~/.gradle/gradle.properties`, hors du dépôt : la même clé d'upload peut servir aux deux applications. **Vérifier le certificat avant tout envoi** — en l'absence des identifiants, le plugin retombe silencieusement sur la clé de debug :
  ```
  keytool -printcert -jarfile app-release.aab   # doit afficher CN=Achraf AZOUZI
  ```

---

## Lot 1 — Modèle QCM et trois quizz

Le cœur de l'adaptation. À faire d'un bloc : les changements de `services/firebase.ts` et de `EtatContext` se propagent partout, les étaler laisserait le dépôt non compilable entre deux commits.

### 1.1 — Le modèle de données

`services/firebase.ts` :

```ts
export type Quizz = 'csp' | 'cr' | 'nat';

export interface Question {
  id: string;              // identifiant de document stable et explicite
  question: string;
  choix: string[];         // 4 propositions
  bonne: number;           // index dans choix[]
  explication: string;     // remplace reponse + bonus, toujours gratuite
  theme: string;
  palier: number;
  palierProvisoire?: boolean;
  quizz: Quizz;             // un seul quizz par question
  actif: boolean;
}
```

Disparaissent : `reponse`, `bonus`, `typeQuestion`. `infoBulle` peut rester (indice avant réponse) — c'est un choix éditorial à trancher au lot 3, pas une contrainte technique.

**Une seule écoute pour les trois quizz.** `where('actif', '==', true)` uniquement, filtrage par quizz côté appareil. Filtrer côté serveur obligerait à relancer une écoute — et à repayer des lectures — à chaque changement de quizz, alors que le corpus entier tient sans peine en mémoire et que l'utilisateur navigue entre les quizz.

⚠️ **Identifiants de documents stables**, imposés par le script de synchronisation (type `nat-0031` : préfixe de quizz et incrément, rien de modifiable). Nat a appris la leçon dans l'autre sens : une synchronisation qui supprime puis recrée les documents change les identifiants, et tout ce qui référence une question par son identifiant devient invisible. Même sans le mécanisme de bonus, les identifiants servent à l'analytique, à l'historique des examens et à toute reprise de question ratée.

### 1.2 — L'état

`src/state/EtatContext.tsx`, forme cible :

```ts
type EtatQuizz = {
  palier: number;
  examensAujourdhui: CompteurJour;
  sessionsDetailAujourdhui: CompteurJour;
  derniersResultats: ResultatExamen[];   // lot 2
};

type EtatUtilisateur = {
  premium: boolean;                       // global : un achat débloque les trois
  parQuizz: Record<Quizz, EtatQuizz>;
};
```

Disparaissent : `bonusDebloques`, `bonusGratuitsAujourdhui`, et les six méthodes associées.

Toutes les méthodes restantes prennent un `quizz` en premier argument. `activerPremium(palierMax, transactionId)` posait `palier = palierMax` : avec trois quizz, il doit poser le palier maximal **de chacun**, donc recevoir les trois — ou, plus propre, laisser le calcul de « ce qui est débloqué » au filtre plutôt qu'à l'état (`premium ⇒ tout est accessible`, ce que `filtresQuestions` fait déjà). La seconde voie évite un état qui ment quand du contenu est ajouté après l'achat.

L'idempotence de `activerPremium` (garde `if (e.premium) return e;` avant le `logPurchase`) est à conserver telle quelle : elle protège des achats rejoués au redémarrage.

### 1.3 — Le quizz actif

Nouveau `QuizzActifContext` (ou paramètre de route). Deux options :

- **Route dynamique `app/[quizz]/…`** — recommandé. Le quizz est dans l'URL, les liens profonds fonctionnent, l'état de navigation est explicite. Coût : réorganiser six routes et garder l'entrée contre une valeur inconnue.
- **Contexte + route plate** — moins de remaniement, mais le quizz devient un état global invisible dans la navigation, et un retour arrière peut le désynchroniser de l'écran affiché.

Dans les deux cas : nouvel écran de **sélection des trois quizz** en entrée d'application, avec pour chacun sa progression et son nombre de questions.

### 1.4 — L'écran de question

`src/screens/Question.tsx` — réécriture. Ce qui disparaît : le bouton « Dévoiler la réponse », toute la zone `cachetZone` (cachet, `bonusVisible`, `attenteDeblocage`, l'effet qui attend le déblocage). Ce qui arrive : quatre propositions tactiles, sélection, verrouillage après réponse, marquage visuel du bon et du mauvais choix, **explication affichée systématiquement après réponse**.

Les styles existants (carte, badge de thème, bandeau publicitaire en pied, navigation) se conservent : la charte ne change pas.

### 1.5 — Le reste, par effet de bord

| Fichier | Changement |
|---|---|
| `src/hooks/useQuestions.ts` | Prend un `quizz`, filtre sur `quizz`, recalcule `palierMax`, `themes`, `paliers` **sur le sous-ensemble** |
| `src/utils/filtresQuestions.ts` | Ajout de `questionsDuQuizz()`, en amont des filtres existants |
| `src/state/QuizContext.tsx` | `ModeSession` gagne `'examen'` ; la session porte les réponses données et le score |
| `app/quiz.tsx` | Toute la mécanique bonus (≈ 40 lignes, `PubRecompensee` inclus) disparaît |
| `app/index.tsx` | Devient la sélection de quizz ; l'accueil actuel descend d'un cran |
| `app/themes.tsx`, `app/liste.tsx` | Passent le quizz aux filtres |
| `src/state/AchatPremiumContext.tsx` | Nouveau SKU ; `palierMax` n'est plus unique (voir 1.2) |
| `src/services/ads.ts` | `UNITE_PUB_BONUS` → `UNITE_PUB_EXAMEN` |
| `src/services/remoteConfig.ts` | `bonus_gratuits_par_jour` retirée ; trois clés ajoutées (lot 2) |
| `src/services/analytics.ts` | `logReponseBonusDebloquee` et `logPubBonusVisionnee` supprimés ; `logReponseChoisie` ajouté (justesse, thème, palier) |
| `src/screens/ListeQuestions.tsx` | Vocabulaire ; éventuellement l'état « déjà répondue » |

---

## Lot 2 — Mode examen blanc

Aucun équivalent côté Nat. C'est le cœur du produit et le seul levier de monétisation qui lui soit propre.

### 2.1 — Format, et pourquoi il est pilotable à distance

Nouveau `src/config/examen.ts` : `NB_QUESTIONS_EXAMEN = 40`, `SEUIL_REUSSITE = 32`, **tous deux exposés en Remote Config** (`examen_nb_questions`, `examen_seuil_reussite`).

Ce n'est pas de la sur-ingénierie : ces deux nombres ne sont pas vérifiés à ce jour, ils sont affichés à l'utilisateur comme le format officiel, et une correction sans republication vaut mieux qu'une semaine d'attente en cas d'erreur — d'autant que Nat a déjà éprouvé ce mécanisme.

Troisième clé : `examens_gratuits_par_jour` (levier de monétisation, valeur par défaut 1).

### 2.2 — Le tirage, et l'arbitrage qu'il impose

L'examen tire N questions **dans tout le corpus du quizz, tous paliers confondus** : l'examen réel ignore la progression de l'utilisateur, un examen blanc limité aux paliers débloqués mentirait sur le format et raterait sa fonction.

⚠️ **Cet arbitrage a un coût qu'il faut assumer explicitement** : l'examen blanc expose donc du contenu non débloqué, y compris à un utilisateur gratuit. C'est cohérent avec les leviers retenus — le quota d'examens et le Premium jouent le rôle de barrière, pas le contenu — mais cela affaiblit le déblocage de palier par publicité. À surveiller dès les premiers retours : si les utilisateurs ne font que des examens blancs, le levier « palier » ne rapporte rien.

Répartition par thème proportionnelle au corpus, pour ressembler au format réel. À caler quand les thèmes officiels seront confirmés.

### 2.3 — Écrans et mesure

- Écran examen : question, propositions, **aucun retour immédiat** (c'est un examen), progression `n/40`, pas de navigation arrière.
- Écran résultat : score, seuil, réussite ou échec, puis **revue question par question avec les explications** — c'est là que se fait l'apprentissage.
- Événements : `examen_demarre`, `examen_termine` (score, réussi, quizz), `examen_quota_atteint`, `pub_examen_visionnee`.
- Historique local des derniers résultats, dans `EtatQuizz.derniersResultats`.

---

## Lot 3 — Contenu

Le chemin critique, indépendant de tout le reste.

- Feuille Google, une ligne par question, colonnes `id`, `quizz`, `type`, `question`, `choix1..4`, `bonne`, `explication`, `theme`, `palier`, `actif`, plus `veille` et `source` non synchronisées. Format détaillé : [`docs/feuille-questions.md`](docs/feuille-questions.md).
- **12 mises en situation par examen blanc**, pour chacun des trois quizz : c'est la partie la plus coûteuse à écrire, et celle à ne pas laisser pour la fin.
- Script Apps Script vers `questions_civique`, en **écriture sur documents existants** (`set` avec identifiant explicite), jamais en supprimer-recréer.
- **La feuille est la seule source de vérité** : toute correction faite dans la console Firebase est écrasée à la synchronisation suivante, sans avertissement.
- Viser 8 à 12 questions par palier, comme Nat.
- `couleursTheme` dans `src/theme/colors.ts` contient **déjà** les six thèmes civiques : les intitulés de la feuille doivent leur correspondre au caractère près, sinon les questions s'affichent en gris ardoise (repli silencieux).

---

## Lot 4 — Légal et conformité

- `src/screens/MentionsLegales.tsx` : couvrir CSP, carte de résident **et** naturalisation. Éditeur personne physique avec domicile et téléphone, données personnelles, analytics, publicité, achats et rétractation, propriété intellectuelle. Ne pas écrire « micro-entreprise » avant immatriculation.
- `src/screens/ConseilsRevision.tsx` (525 lignes, entièrement orienté entretien de naturalisation) : réécriture éditoriale. Le format QCM change la nature des conseils — réviser pour un QCM n'a rien à voir avec préparer un entretien oral.
- Site `civique.hasakistudio.fr` : mentions, confidentialité, contact. URL de confidentialité saisie à l'identique dans Play Console **et** AdMob.

---

## Lot 5 — Reporté

- **Code de déblocage croisé** Civique → Nat : génération ici, vérification côté Nat. Implique un nouveau build de Nat. Google Play rattachant un achat à une application, c'est le seul mécanisme possible.
- **iOS** : après la mise en production de Nat, et pour les deux applications d'un coup.
- **Compte AdMob et identifiants réels** : jamais avant la publication.

---

## Ordre recommandé et coût

| Lot | Dépendances | Ordre de grandeur |
|---|---|---|
| 0 — Couper les liens | Projet Firebase créé | Une demi-journée, plus 1 h de compilation |
| 1 — QCM et trois quizz | Lot 0 | Le gros du travail de code |
| 2 — Examen blanc | Lot 1 | Significatif, mais bien délimité |
| 3 — Contenu | Aucune | **Le chemin critique** — à mener en parallèle, dès maintenant |
| 4 — Légal | Lot 1 | Éditorial |
| 5 — Croisé, iOS | Nat en production | Reporté |

Le lot 3 ne dépend d'aucun autre et conditionne tous les autres : c'est le seul à démarrer immédiatement, indépendamment de la décision de développer ou non le code de Civique dès maintenant.
