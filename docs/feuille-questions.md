# La feuille de contenu — format

*Le code de l'application lit exactement les champs décrits ici (`services/firebase.ts`). Toute divergence entre ce document et la feuille réelle se règle en modifiant les deux.*

La feuille est **la seule source de vérité**. La synchronisation réécrit les documents Firestore : toute correction faite directement dans la console Firebase sera écrasée à la synchronisation suivante, sans avertissement.

---

## Le principe : une question appartient à un seul quizz

Le contenu est **cloisonné par quizz**. Une question sert `csp`, ou `cr`, ou `nat` — jamais deux à la fois.

Un énoncé valable pour plusieurs titres est **dupliqué**, une ligne par quizz, chacune avec ses propres propositions. C'est voulu : les exigences ne sont pas les mêmes selon qu'on demande une carte de séjour pluriannuelle ou la naturalisation, et c'est le jeu de propositions — plus que l'énoncé — qui porte cette différence.

| id | quizz | question | choix1 | choix2 | choix3 | choix4 | bonne |
|---|---|---|---|---|---|---|---|
| `civ-inst-014-csp` | `csp` | Combien de temps dure le mandat du Président ? | 4 ans | 5 ans | 7 ans | 10 ans | 2 |
| `civ-inst-014-nat` | `nat` | Combien de temps dure le mandat du Président ? | 5 ans, deux fois consécutives au plus | 5 ans, sans limite | 7 ans, renouvelable une fois | 5 ans, une seule fois | 1 |

Ce que cela implique, en clair : corriger une coquille dans un énoncé partagé demande de la corriger dans chaque copie. C'est le prix de la liberté de doser la difficulté titre par titre, et il est assumé.

Côté code, il n'y a rien à savoir de ce cloisonnement : chaque ligne est une question ordinaire, filtrée par sa colonne `quizz`.

---

## Colonnes

Un onglet, une ligne par question, une ligne d'en-tête.

*(Trois onglets — un par quizz — fonctionnent aussi bien : le script les concatène et la colonne `quizz` reste renseignée dans chacun. C'est un choix de confort d'édition, sans effet sur l'application.)*

| Colonne | Type | Obligatoire | Contenu |
|---|---|---|---|
| `id` | texte | **oui** | Identifiant du document Firestore. Stable, explicite, jamais réattribué. Voir plus bas. |
| `quizz` | texte | **oui** | `csp`, `cr` ou `nat`. Une seule valeur. |
| `question` | texte | **oui** | L'énoncé. Une seule question par ligne, pas de « et » qui en cache deux. |
| `choix1` … `choix4` | texte | **oui** | Une proposition par cellule. Quatre en principe ; le code en accepte au minimum deux. |
| `bonne` | nombre | **oui** | Numéro de la bonne proposition, **de 1 à 4** tel qu'on le lit dans la feuille. Le script le convertit en index 0-3 pour Firestore. |
| `explication` | texte | **oui** | Pourquoi cette réponse est la bonne. C'est le contenu pédagogique du produit : jamais payant, toujours affiché après réponse. |
| `theme` | texte | **oui** | Doit correspondre **au caractère près** à un thème connu (voir plus bas). |
| `palier` | nombre | **oui** | Niveau de déblocage, à partir de 1. |
| `actif` | booléen | **oui** | `FAUX` retire la question de l'application sans la supprimer de la feuille. C'est le bon geste pour une question douteuse. |
| `palierProvisoire` | booléen | non | Marque un palier attribué à la louche, à rééquilibrer quand le corpus aura grandi. Sans effet dans l'application. |
| `source` | texte | non | D'où vient l'information (Livret du citoyen, service-public.fr, article de loi). Ne part pas dans Firestore, mais rend une relecture possible un an plus tard. |

### Une proposition par cellule, et non les quatre dans une seule

Regrouper les propositions dans une cellule unique obligerait à les découper sur un séparateur, et le contenu lui-même en contient déjà : `Oui, sous peine d'amende` se couperait en deux sur la virgule. Il faudrait alors un séparateur exotique — `|` par exemple — dont il faudrait se souvenir de ne jamais l'employer dans un texte, des années durant. Quatre cellules suppriment le problème au lieu de le contourner, et une cellule courte reste lisible et corrigeable à l'œil.

### Ce que le code fait des lignes mal remplies

`services/firebase.ts` écarte silencieusement toute question sans énoncé, avec moins de deux propositions, avec un `bonne` hors bornes, avec un `quizz` inconnu, ou sans palier numérique — et journalise le nombre de lignes écartées. Une cellule mal saisie fait donc disparaître **une** question, elle ne casse pas l'application chez les utilisateurs. Ce filet ne dispense pas d'une validation dans le script de synchronisation, où l'erreur est visible tout de suite.

---

## Les identifiants, le point à ne pas rater

L'identifiant est écrit dans la feuille, jamais généré par Firestore.

Format proposé : `civ-<thème abrégé>-<numéro>-<quizz>` — par exemple `civ-institutions-014-nat`. Le suffixe de quizz vient naturellement du cloisonnement : deux copies d'un même énoncé sont deux documents distincts.

La synchronisation doit écrire **sur le document existant** (`set` avec cet identifiant), jamais supprimer puis recréer. Un identifiant qui change casse tout ce qui référence une question : l'historique des examens, la continuité des rapports Analytics, et toute reprise ultérieure des questions ratées. L'application sœur a appris cette leçon dans la douleur, sur un mécanisme voisin.

Corollaire : **on ne réutilise jamais l'identifiant d'une question supprimée** pour une question différente.

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

## Équilibrage

- Viser **8 à 12 questions par palier**, comme l'application sœur.
- Le nombre de paliers n'a pas à être le même d'un quizz à l'autre : il est recalculé par quizz depuis son propre contenu.
- Le tirage de l'examen blanc respecte la **répartition par thème du corpus du quizz** : un thème sur-représenté dans la feuille le sera dans l'examen. L'équilibre entre thèmes se règle donc dans la feuille, pas dans le code.
- Changer le **thème** d'une question est sans conséquence. Changer son **palier** en a : les questions sont filtrées par `palier <= palier de l'utilisateur`, donc déplacer une question vers un palier supérieur la fait disparaître chez ceux qui ne l'ont pas atteint, et leur compteur baisse.

---

## Conversions attendues du script de synchronisation

| Feuille | Firestore |
|---|---|
| `choix1..4` | `choix: string[]`, dans l'ordre, cellules vides ignorées |
| `bonne` (1-4) | `bonne: number` (0-3) — **la conversion se fait ici, une seule fois** |
| `quizz` | `quizz: string`, en minuscules, espaces retirés |
| `actif` (`VRAI`/`FAUX`) | `actif: boolean` |
| `palier`, `bonne` | nombres, jamais des chaînes — l'application compare `palier <= palier utilisateur` |

La collection cible est **`questions_civique`**, dans le projet Firebase propre à Civique.
