# La feuille de contenu — format

*Le code de l'application lit exactement les champs décrits ici (`services/firebase.ts`). Toute divergence entre ce document et la feuille réelle se règle en modifiant les deux.*

La feuille est **la seule source de vérité**. La synchronisation réécrit les documents Firestore : toute correction faite directement dans la console Firebase sera écrasée à la synchronisation suivante, sans avertissement.

---

## Le principe : une question appartient à un seul quizz

Le contenu est **cloisonné par quizz**. Une question sert `csp`, ou `cr`, ou `nat` — jamais deux à la fois.

Un énoncé valable pour plusieurs titres est **dupliqué**, une ligne par quizz, chacune avec ses propres propositions. C'est voulu : les exigences ne sont pas les mêmes selon qu'on demande une carte de séjour pluriannuelle ou la naturalisation, et c'est le jeu de propositions — plus que l'énoncé — qui porte cette différence.

| id | quizz | type | question | choix1 | choix2 | choix3 | choix4 | bonne |
|---|---|---|---|---|---|---|---|---|
| `csp-0014` | `csp` | `simple` | Combien de temps dure le mandat du Président ? | 4 ans | 5 ans | 7 ans | 10 ans | 2 |
| `nat-0031` | `nat` | `simple` | Combien de temps dure le mandat du Président ? | 5 ans, deux fois consécutives au plus | 5 ans, sans limite | 7 ans, renouvelable une fois | 5 ans, une seule fois | 1 |

Ce que cela implique, en clair : corriger une coquille dans un énoncé partagé demande de la corriger dans chaque copie. C'est le prix de la liberté de doser la difficulté titre par titre, et il est assumé.

Côté code, il n'y a rien à savoir de ce cloisonnement : chaque ligne est une question ordinaire, filtrée par sa colonne `quizz`.

---

## Colonnes

Une ligne par question, une ligne d'en-tête. **Un onglet ou trois, au choix** — le script lit la liste d'onglets déclarée dans `FEUILLES_QUESTIONS`. Ce qui range une question dans un parcours est sa colonne `quizz`, jamais l'onglet qui la porte.

Un onglet unique reste ce que je recommande, pour des raisons qui se paient à l'usage :

- **Une seule ligne d'en-tête à maintenir.** Ce format a déjà gagné deux colonnes en cours de route (`type`, `veille`) et en gagnera d'autres. Avec trois onglets, chaque ajout se fait trois fois, et le jour où l'un diverge — une colonne en plus, deux colonnes interverties — la synchronisation se met à lire de travers sans rien signaler.
- **Dupliquer une question pour un autre titre devient un geste.** Copier la ligne juste en dessous, changer `id`, `quizz` et les propositions. Entre onglets, c'est un aller-retour à chaque fois, et le contenu cloisonné rend ce geste fréquent.
- **Les comptes sont immédiats.** « Combien de mises en situation en `nat` ? », « combien de questions au palier 3 en `csp` ? » : un `COUNTIFS` sur une plage unique, ou un tableau croisé. Sur trois onglets, chaque compte devient une somme de trois formules.
- **Le script lit une plage au lieu d'énumérer des onglets** et de décider lesquels sont du contenu — car il y aura d'autres onglets : notes, lexique, brouillons.

L'argument des trois onglets, c'est la lisibilité à 1 500 lignes. Les **vues filtrées** de Google Sheets y répondent sans découper les données : une vue par quizz, chacune avec son propre filtre et son propre tri, sans déranger ni la feuille ni les autres personnes qui la consultent.

Cela dit, aucun de ces arguments n'est bloquant : si trois onglets vous conviennent mieux à la rédaction, déclarez-les et le script s'en accommode — l'unicité des identifiants et la cohérence onglet/quizz restent vérifiées sur l'ensemble.

### Avant d'écrire la première question

- **Figer l'ordre des colonnes** maintenant. Le script s'appuie sur les en-têtes ; les réordonner ensuite est sans risque, en insérer une au milieu d'une synchronisation en cours ne l'est pas.
- **Listes déroulantes** (Données → Validation des données) sur `quizz`, `type`, `theme` et `actif`. C'est ce qui empêche un `NAT` en majuscules ou un thème mal accentué, deux erreurs invisibles à la relecture.
- **Contrôle des doublons d'identifiant** dans une colonne de service : `=COUNTIF($A:$A;$A2)>1`, avec une mise en forme conditionnelle. Un identifiant en double, c'est une question qui en écrase une autre à la synchronisation.
- ⚠️ **L'identifiant ne doit jamais être une formule** — surtout pas une formule dépendant de la position de la ligne, type `="csp-"&TEXTE(LIGNE()-1;"0000")`. Un tri, une insertion, une suppression, et toutes les questions changent d'identifiant d'un coup : la progression des utilisateurs et l'historique des examens partent avec. Écrire les identifiants en dur, ou générer puis coller en valeurs.

Un modèle importable — en-têtes et deux exemples, dont une mise en situation — est fourni : [`modele-feuille.csv`](modele-feuille.csv) (Fichier → Importer → Insérer de nouvelles feuilles).

| Colonne | Type | Obligatoire | Contenu |
|---|---|---|---|
| `id` | texte | **oui** | Identifiant du document Firestore. Stable, jamais réattribué. Voir plus bas. |
| `quizz` | texte | **oui** | `csp`, `cr` ou `nat`. Une seule valeur. |
| `type` | texte | **oui** | `simple` (question de connaissance) ou `situation` (mise en situation). Détermine la composition de l'examen blanc. |
| `question` | texte | **oui** | L'énoncé. Une seule question par ligne, pas de « et » qui en cache deux. |
| `choix1` … `choix4` | texte | **oui** | Une proposition par cellule. Quatre en principe ; le code en accepte au minimum deux. |
| `bonne` | nombre | **oui** | Numéro de la bonne proposition, **de 1 à 4** tel qu'on le lit dans la feuille. Le script le convertit en index 0-3 pour Firestore. |
| `explication` | texte | **oui** | Pourquoi cette réponse est la bonne. C'est le contenu pédagogique du produit : jamais payant, toujours affiché après réponse. |
| `theme` | texte | **oui** | Doit correspondre **au caractère près** à un thème connu (voir plus bas). |
| `palier` | nombre | **oui** | Niveau de déblocage, à partir de 1. |
| `actif` | booléen | **oui** | `FAUX` retire la question de l'application sans la supprimer de la feuille. C'est le bon geste pour une question douteuse. |
| `palierProvisoire` | booléen | non | Marque un palier attribué à la louche, à rééquilibrer quand le corpus aura grandi. Sans effet dans l'application. |
| `veille` | texte | non | Ce qui est à resurveiller sur cette question : une règle susceptible de changer, un chiffre à reconfirmer, une source non recoupée. Colonne éditoriale, **non synchronisée**. |
| `source` | texte | non | D'où vient l'information (Livret du citoyen, service-public.fr, article de loi). Ne part pas dans Firestore, mais rend une relecture possible un an plus tard. |

### `veille` : une colonne pour vous, pas pour l'application

Elle ne part pas dans Firestore et n'a aucun effet à l'écran — c'est délibéré. Une question sous surveillance reste juste jusqu'à preuve du contraire, et la retirer « au cas où » appauvrirait le contenu sans raison.

Le jour où le doute devient sérieux, le geste est `actif = FAUX` : la question disparaît de l'application en quelques secondes, sans republier, et la ligne — avec sa note de veille — reste dans la feuille pour être reprise.

Filtrer la colonne `veille` avant chaque distribution donne la liste de ce qu'il faut revérifier. C'est le complément naturel des `TODO(contenu)` du code.

**Une convention réservée : `TYPE PROVISOIRE`.** Écrire ce marqueur dans `veille` signale une question dont le `type` ne dit pas la vérité — typiquement une question simple étiquetée `situation` pour pouvoir essayer le mode examen avant que les vraies mises en situation soient écrites. C'est un usage légitime, et même nécessaire : sans lui, l'examen blanc reste intestable pendant des semaines.

Le script de vérification recompte ces lignes à chaque passage et le rappelle. Un aide-mémoire posé un jour de rédaction ne survit pas trois semaines ; une alerte à chaque contrôle, si — et c'est ce qui évite que de fausses mises en situation partent en production.

### Une proposition par cellule, et non les quatre dans une seule

Regrouper les propositions dans une cellule unique obligerait à les découper sur un séparateur, et le contenu lui-même en contient déjà : `Oui, sous peine d'amende` se couperait en deux sur la virgule. Il faudrait alors un séparateur exotique — `|` par exemple — dont il faudrait se souvenir de ne jamais l'employer dans un texte, des années durant. Quatre cellules suppriment le problème au lieu de le contourner, et une cellule courte reste lisible et corrigeable à l'œil.

### Ce que le code fait des lignes mal remplies

`services/firebase.ts` écarte silencieusement toute question sans énoncé, avec moins de deux propositions, avec un `bonne` hors bornes, avec un `quizz` inconnu, ou sans palier numérique — et journalise le nombre de lignes écartées. Une cellule mal saisie fait donc disparaître **une** question, elle ne casse pas l'application chez les utilisateurs. Ce filet ne dispense pas d'une validation dans le script de synchronisation, où l'erreur est visible tout de suite.

Une exception : un `type` vide ou inconnu **ne fait pas disparaître la question**, elle compte comme `simple`. Perdre une bonne question parce qu'une case a été oubliée serait disproportionné ; le seul effet est un examen blanc dont la proportion de mises en situation s'écarte un peu de la règle. Une liste déroulante sur la colonne rend le cas improbable.

---

## Les identifiants

L'identifiant est écrit dans la feuille, jamais généré par Firestore. Un simple incrément suffit : l'application ne lui demande que d'être unique et de ne jamais changer.

Format proposé : **préfixe de quizz + numéro**, numéroté indépendamment dans chaque quizz — `csp-0001`, `cr-0001`, `nat-0001`.

Pourquoi le préfixe plutôt qu'un compteur unique sur tout le contenu :

- **Chaque onglet numérote à partir de 1**, sans coordonner un compteur global entre trois onglets qui grandissent à des rythmes différents.
- **Un copier-coller entre onglets se voit.** Un `nat-0042` au milieu des `csp-` saute aux yeux ; deux `0042` identiques, non. Or un identifiant dupliqué, à la synchronisation, c'est un document qui en écrase un autre : une question disparaît sans la moindre erreur.

⚠️ **Ne rien mettre de modifiable dans l'identifiant** — ni le thème, ni le palier. Les deux peuvent changer, l'identifiant non : les faire cohabiter finirait par produire un `civ-institutions-014` rangé dans « Histoire ».

La synchronisation doit écrire **sur le document existant** (`set` avec cet identifiant), jamais supprimer puis recréer. Un identifiant qui change casse tout ce qui référence une question : l'historique des examens, la continuité des rapports Analytics, et toute reprise ultérieure des questions ratées. L'application sœur a appris cette leçon dans la douleur, sur un mécanisme voisin.

Deux corollaires : **on ne réutilise jamais l'identifiant d'une question supprimée**, et le script de synchronisation doit **s'arrêter en erreur sur un identifiant en double** plutôt que d'écraser.

---

## Les thèmes

Six thèmes sont déjà connus du code, avec leur couleur (`src/theme/colors.ts`) :

- Principes et valeurs de la République
- Système institutionnel et politique
- Droits et devoirs des citoyens
- Histoire, géographie et culture
- Vivre dans la société française
- Livret du citoyen 2026

⚠️ La correspondance est exacte, accents et majuscules compris. Un thème mal orthographié ne provoque aucune erreur : la question s'affiche en gris ardoise, le repli silencieux prévu pour les thèmes inconnus. C'est le genre d'écart qu'on ne remarque qu'en production — une liste déroulante dans la feuille (validation des données) le rend impossible. Même remarque pour la colonne `quizz`.

Ces intitulés sont une reprise de l'application sœur : ils sont à confirmer une fois les thèmes officiels de l'examen vérifiés sur service-public.fr.

---

## Les deux formes de questions, et où la règle s'applique

L'examen réel mêle **28 questions de connaissance et 12 mises en situation**, sur 40. La colonne `type` porte cette distinction.

**Le mode examen blanc respecte la règle**, et c'est ce qui le distingue du reste : il tire 12 `situation` et 28 `simple`, chaque forme étant elle-même tirée en respectant la répartition par thème de son propre corpus — les mises en situation ne couvrent pas forcément les mêmes thèmes que les questions de connaissance.

**Le mode révision ne la respecte pas**, volontairement : s'entraîner ne demande pas de reproduire le format, se tester si. Le tirage y reste libre sur les questions débloquées.

Tant que les mises en situation ne sont pas toutes écrites, l'examen blanc en pose moins que la règle et complète en questions simples : mieux vaut un examen au bon nombre de questions, un peu léger sur une forme, qu'un examen tronqué à vingt questions. La règle se rétablit d'elle-même dès que le corpus suffit.

Les deux nombres sont pilotables à distance (`examen_nb_questions`, `examen_nb_situations`) : si la règle officielle s'avère différente, la correction prend quelques heures et ne demande pas de republier.

⚠️ Conséquence pour la rédaction : il faut **12 mises en situation par examen, donc un stock suffisant pour qu'ils ne se répètent pas** — et ce, pour chacun des trois quizz, puisque le contenu est cloisonné. C'est la partie la plus coûteuse à écrire, et celle à ne pas laisser pour la fin.

---

## Équilibrage

- Viser **8 à 12 questions par palier**, comme l'application sœur.
- Le nombre de paliers n'a pas à être le même d'un quizz à l'autre : il est recalculé par quizz depuis son propre contenu.
- Le tirage de l'examen blanc respecte la **répartition par thème du corpus du quizz** : un thème sur-représenté dans la feuille le sera dans l'examen. L'équilibre entre thèmes se règle donc dans la feuille, pas dans le code — et quizz par quizz, puisqu'ils ne partagent rien.
- Changer le **thème** d'une question est sans conséquence. Changer son **palier** en a : les questions sont filtrées par `palier <= palier de l'utilisateur`, donc déplacer une question vers un palier supérieur la fait disparaître chez ceux qui ne l'ont pas atteint, et leur compteur baisse.

---

## Conversions attendues du script de synchronisation

| Feuille | Firestore |
|---|---|
| `choix1..4` | `choix: string[]`, dans l'ordre, cellules vides ignorées |
| `bonne` (1-4) | `bonne: number` (0-3) — **la conversion se fait ici, une seule fois** |
| `quizz` | `quizz: string`, en minuscules, espaces retirés |
| `type` | `type: string`, en minuscules, espaces retirés |
| `veille`, `source` | **non synchronisées** — colonnes éditoriales |
| `actif` (`VRAI`/`FAUX`) | `actif: boolean` |
| `palier`, `bonne` | nombres, jamais des chaînes — l'application compare `palier <= palier utilisateur` |

La collection cible est **`questions_civique`**, dans le projet Firebase propre à Civique.
