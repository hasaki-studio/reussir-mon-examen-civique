# Contexte — Réussir mon test civique

*Dernière mise à jour : 17/08/2026. Remplace la version du 12/08, écrite avant la duplication du dépôt de Nat et avant les quatre décisions actées ci-dessous.*

> **En une phrase** : le dépôt existe désormais — c'est une copie intégrale de Nat, non renommée — et quatre décisions structurantes sont prises. Le goulot d'étranglement reste éditorial : environ 500 questions QCM à écrire, dont rien dans ce dépôt ne dépend techniquement.

---

## Ce qui a changé depuis le 12 août

Le document précédent décrivait Civique comme un prototype HTML sans dépôt. Ce n'est plus vrai : **`hasaki-studio/reussir-mon-examen-civique` a été créé par duplication de Nat**, à son état soumis au Play Store.

Conséquence importante et contre-intuitive : le dépôt n'est pas un point de départ neutre, c'est **l'application Nat qui tourne sous un autre nom de dossier**. Rien n'a été renommé, aucune référence n'a été coupée. Tant que le lot 0 du plan d'adaptation n'est pas exécuté, une compilation de ce dépôt produirait une application qui écrit dans le projet Firebase de Nat, s'annonce sous le package de Nat et envoie ses événements Analytics avec `appli: 'nat'`.

Le détail de ce qui est hérité, et de ce qu'il faut couper en premier, vit dans [`PLAN-ADAPTATION.md`](PLAN-ADAPTATION.md).

---

## Décisions actées le 17/08

Les quatre points laissés ouverts par la version du 12 août sont tranchés.

| Décision | Choix retenu | Ce que cela implique |
|---|---|---|
| **Projet Firebase** | **Séparé** de `nat-sheet` | Nouvelle console, nouveau `google-services.json`, nouvelle configuration App Check, second script de synchronisation, second jeu de règles. Isolation totale des données et des Analytics. |
| **Identifiants** | `com.hasakistudio.examencivique` | Package Android et bundle iOS. **Définitif** : c'est la clé de l'application dans Firebase et dans la Play Console. Retenu plutôt que `civique` parce qu'« examen civique » est le terme officiel depuis le 1ᵉʳ janvier 2026, et parce qu'il colle au nom du dépôt. |
| **Leviers de monétisation** | Déblocage de palier par publicité · Premium (achat unique, débloque les trois quizz) · **Quota d'examens blancs** · **Revue des erreurs par publicité** (ajouté le 22/08) | Quatre leviers, dont deux propres à Civique. Le quota limite le nombre d'examens lancés par jour ; la revue, elle, monétise chaque examen déjà passé, y compris ceux du quota gratuit. **Le score et le verdict restent gratuits** : ils appartiennent à l'utilisateur qui vient de les produire, et les verrouiller est le scénario type de l'avis à une étoile. Seule la revue question par question — bonne réponse et explication — attend la publicité. Réglable par Remote Config (`resultat_verrouille` : `aucun` / `revue` / `tout`), jamais activé en Premium. |
| **Réponses bonus (cachet)** | **Abandonné** | Sur un QCM, l'explication de la bonne réponse est le contenu pédagogique lui-même : la faire payer viderait le produit de son sens. Tout le mécanisme est à supprimer, pas à désactiver. |

### Ce que « projet Firebase séparé » coûte, en clair

C'est la décision qui va à l'encontre de la recommandation du 12 août ; autant en connaître le prix pour ne pas le découvrir en route. Deux consoles à tenir, **deux jetons de debug App Check** à enregistrer, deux jeux de règles Firestore à garder cohérents, et un second script Apps Script. En contrepartie, les données de Civique ne peuvent structurellement pas polluer celles de Nat — ce qui, vu que ce dépôt part d'une copie de Nat, supprime toute une classe d'erreurs silencieuses.

Le paramètre `appli` de Nat n'a plus de raison d'être : les projets étant séparés, la dimension utile n'est plus l'application mais le parcours. Il est remplacé par `quizz` (`csp`, `cr`, `nat`), joint à tous les événements.

### Ce que « Premium débloque les trois quizz » change par rapport au prototype

Le prototype HTML portait `premium` dans chaque clé de quizz. C'est incompatible avec la décision prise : Google Play rattache un achat à une application, pas à un contenu. Le Premium devient donc **un booléen unique à la racine de l'état**, et chaque quizz ne garde que sa progression propre.

---

## Statut du produit

- **Contenu réel : inexistant.** Six questions d'exemple dans le prototype HTML, environ 500 anticipées. C'est le chemin critique et rien ne le raccourcit.
- **Code : une base Nat complète et éprouvée**, mais bâtie pour un autre format pédagogique (fiches à réponse ouverte, révélées par un bouton), à convertir en QCM.
- **Trois quizz** dans une seule application : carte de séjour pluriannuelle (CSP), carte de résident (CR), test civique de naturalisation (NAT).
- **Mode examen blanc : à écrire intégralement.** C'est le cœur du produit et il n'a aucun équivalent côté Nat.
- Écrans manquants côté Civique par rapport à la maquette : aucun — le duplicata apporte mentions légales et conseils de révision, qui manquaient au prototype. Ils sont à réécrire pour couvrir CSP / CR / naturalisation, pas seulement la naturalisation.

⚠️ **Les chiffres de l'examen ne sont toujours pas vérifiés.** QCM de 40 questions, 32 bonnes réponses exigées, obligatoire depuis le 1ᵉʳ janvier 2026 pour la CSP, la carte de résident et la naturalisation : ces affirmations circulent dans le prototype, dans Nat et sur le site sans avoir été recoupées avec service-public.fr. Elles conditionnent le format du mode examen blanc. Le plan d'adaptation en tire une conséquence technique : **ces deux nombres seront pilotables par Remote Config**, pour qu'une erreur se corrige sans republier l'application.

---

## Ce qui est réutilisable depuis Nat

Confirmé fichier par fichier après lecture complète du duplicata. La colonne de droite dit ce qu'il reste à faire, une fois le renommage du lot 0 effectué.

| Domaine | Fichiers | Effort restant |
|---|---|---|
| Contournements de build | `plugins/withCompatMetadonneesKotlin.js`, `withSignatureRelease.js`, `withFirebaseStaticFrameworks.js` | **Aucun — ne pas y toucher** |
| Anti-robots | `src/services/appCheck.ts` | Aucun (code), console à refaire |
| Consentement RGPD | `ConsentementContext`, `screens/ConsentementRGPD` | Aucun |
| Consentement publicitaire | `PublicitesContext`, `ads.ts` (parcours UMP + ATT) | Aucun |
| Publicité | `BandeauPublicitaire`, `PubRecompensee` | Retirer l'unité « bonus », ajouter l'unité « examen » |
| Achat intégré | `AchatPremiumContext` | Changer le SKU ; `palierMax` devient dépendant du quizz |
| Pilotage à distance | `remoteConfig.ts`, `RemoteConfigContext` | Retirer une clé, en ajouter trois |
| Analytics | `analytics.ts`, `useAnalyticsScreenTracking` | `appli` devient le quizz ; événements bonus à supprimer, examen à ajouter |
| Contenu distant | `services/firebase.ts` | Collection et modèle de données à refondre |
| Écrans structurels | `Chargement`, `PremierLancementHorsLigne` | Aucun |
| Design | `theme/colors.ts`, `typographie.ts`, `LisereTricolore`, `EnTeteMarque` | Quasi aucun — les thèmes de `couleursTheme` sont **déjà** les thèmes civiques |
| Dates clés | `config/datesCles.ts` | Une tournure à corriger (« entretien d'assimilation ») |

**Les trois plugins de build sont à conserver impérativement.** Sans `withCompatMetadonneesKotlin`, Civique ne compilera pas davantage que Nat : `play-services-ads` est compilé avec Kotlin 2.3 quand React Native 0.86 impose 2.1.20, et monter Kotlin fait planter le compilateur sur trois autres modules. Sans `withSignatureRelease`, la release est signée avec la clé de debug et Google Play la rejette.

---

## Architecture des trois quizz

Un seul état local, `premium` à la racine, une entrée par quizz (`csp`, `cr`, `nat`) portant la progression et les compteurs du jour.

Chaque question appartient à **un seul quizz** (`quizz: "csp" | "cr" | "nat"`). C'est un revirement par rapport au prototype, qui prévoyait un `applicable[]` partagé : un énoncé valable pour plusieurs titres est désormais dupliqué dans la feuille, avec des propositions ajustées à ce que chaque titre exige. Le surcoût éditorial — corriger une coquille dans chaque copie — est assumé en échange de la liberté de doser la difficulté titre par titre.

Une seule écoute Firestore sert malgré tout les trois quizz : le filtrage se fait côté appareil, sur un corpus déjà en mémoire.

`palierMax` n'est plus une constante : il se recalcule **par quizz**, depuis le contenu réellement applicable à ce quizz. Deux quizz peuvent donc avoir un nombre de paliers différent, et c'est normal.

---

## Conventions reprises de Nat

**Éditeur.** Achraf AZOUZI, personne physique, `contact@hasakistudio.fr`. Ne pas écrire « micro-entreprise » tant que l'immatriculation n'a pas eu lieu.

**Pages légales.** `examencivique.hasakistudio.fr` — mentions légales, confidentialité, contact, **en ligne depuis le 20/08**. L'URL de confidentialité est exigée à deux endroits, Play Console et AdMob, et Google la revérifie périodiquement : elle ne doit pas bouger sans mise à jour simultanée des deux consoles.

**Identifiants publicitaires de test jusqu'à la publication.** Un clic sur une vraie annonce depuis un build non publié peut faire bannir le compte AdMob.

**Build en local**, plus via EAS : Android SDK et JDK 17 sur la machine Windows, `gradlew`. Chemin court obligatoire, type `C:\dev\civique`, à cause de la limite de 260 caractères.

**Commits et commentaires en français**, expliquant le *pourquoi*. Une branche par chantier, partant de `main`. `npx tsc --noEmit` avant chaque commit.

**Coût de compilation.** Une modification TypeScript ne demande qu'un `assembleRelease` (quelques minutes) ; toucher à `app.json`, aux icônes ou aux plugins impose un `expo prebuild --clean` puis une compilation complète (environ une heure). Le lot 0 du plan touche `app.json` : le regrouper en une seule passe évite de payer cette heure plusieurs fois.

⚠️ **Ce dépôt est public**, contrairement à celui de Nat. Le `google-services.json` qui s'y trouvera n'est pas un secret au sens strict — c'est une configuration client, protégée par App Check et les règles Firestore — mais la marge d'erreur est nulle sur le reste : le keystore, `gradle.properties` et les clés de service n'ont rien à y faire. Le `.gitignore` hérité couvre déjà `*.jks`, `*.p8`, `*.p12`, `*.key` : ne pas l'alléger.

---

## Actions à faire

### 1. Maintenant — sans code

- [ ] **Écrire le contenu.** Environ 500 questions au format `{id, quizz, question, choix1..4, bonne, explication, theme, palier, actif}` — voir [`docs/feuille-questions.md`](docs/feuille-questions.md). Rien ne le remplace et tout en dépend.
- [ ] **Vérifier le format officiel de l'examen** — nombre de questions, seuil, thèmes couverts — sur service-public.fr. Le mode examen doit refléter le format réel.
- [ ] **Créer le projet Firebase Civique**, y déclarer l'application Android `com.hasakistudio.examencivique`, récupérer `google-services.json`.
- [ ] **Créer la fiche Play Console** de la nouvelle application (nécessaire pour le SHA-256 et le produit Premium).

### 2. Code — voir `PLAN-ADAPTATION.md`

Le plan découpe le chantier en six lots ordonnés, du renommage qui coupe les liens avec Nat jusqu'au code de déblocage croisé. Le lot 0 est le seul urgent : tant qu'il n'est pas fait, toute compilation de ce dépôt est une compilation de Nat sous un faux nom.

### 3. Plus tard

- [ ] Code de déblocage croisé Civique → Nat (génération ici, vérification côté Nat, donc nouveau build de Nat).
- [ ] iOS — après la mise en production de Nat, et pour les deux applications d'un coup.

---

## Recommandation d'ordre inchangée

Terminer la boucle de lancement de Nat, écrire le contenu de Civique pendant l'attente, et ne développer le code de Civique qu'une fois Nat en production et commenté par ses testeurs. Le rythme de déblocage, l'équilibre publicité/Premium et la lisibilité des fiches vont probablement bouger avec les retours : copier aujourd'hui une base non validée, c'est copier ses erreurs et devoir les corriger deux fois.

Une nuance introduite par la duplication du dépôt : **le lot 0 échappe à ce raisonnement**. Renommer, couper les liens avec le projet Firebase de Nat et retirer les leviers abandonnés ne dépend d'aucun retour d'utilisateur et ne périmera pas. C'est du travail sûr, faisable dès maintenant, et il a un bénéfice immédiat — il rend le dépôt inoffensif. En l'état, il ne l'est pas.
