# La feuille de contenu — format proposé

*Proposition, à confronter à la feuille réelle avant d'écrire le script de synchronisation. Le code de l'application lit déjà exactement les champs décrits ici (`services/firebase.ts`).*

La feuille est **la seule source de vérité**. La synchronisation réécrit les documents Firestore : toute correction faite directement dans la console Firebase sera écrasée à la synchronisation suivante, sans avertissement.

---

## Colonnes

Un onglet, une ligne par question, une ligne d'en-tête.

| Colonne | Type | Obligatoire | Contenu |
|---|---|---|---|
| `id` | texte | **oui** | Identifiant du document Firestore. Stable, explicite, jamais réattribué. Voir plus bas. |
| `question` | texte | **oui** | L'énoncé. Une seule question par ligne, pas de « et » qui en cache deux. |
| `choix1` … `choix4` | texte | **oui** | Les propositions. Quatre en principe ; le code en accepte au minimum deux. |
| `bonne` | nombre | **oui** | Numéro de la bonne proposition, **de 1 à 4** tel qu'on le lit dans la feuille. Le script le convertit en index 0-3 pour Firestore. |
| `explication` | texte | **oui** | Pourquoi cette réponse est la bonne. C'est le contenu pédagogique du produit : jamais payant, toujours affiché après réponse. |
| `theme` | texte | **oui** | Doit correspondre **au caractère près** à un thème connu (voir plus bas). |
| `palier` | nombre | **oui** | Niveau de déblocage, à partir de 1. |
| `applicable` | texte | **oui** | Quizz concernés, séparés par des virgules : `csp`, `cr`, `nat`. Ex. `csp,cr,nat`. |
| `actif` | booléen | **oui** | `FAUX` retire la question de l'application sans la supprimer de la feuille. C'est le bon geste pour une question douteuse. |
| `groupe` | texte | non | Rattache les variantes d'un même énoncé (voir la section suivante). Vide pour une question sans variante. |
| `palierProvisoire` | booléen | non | Marque un palier attribué à la louche, à rééquilibrer quand le corpus aura grandi. Sans effet dans l'application. |
| `source` | texte | non | D'où vient l'information (Livret du citoyen, service-public.fr, article de loi). Ne part pas dans Firestore, mais rend une relecture possible un an plus tard. |

### Ce que le code fait des lignes mal remplies

`services/firebase.ts` écarte silencieusement toute question sans énoncé, avec moins de deux propositions, avec un `bonne` hors bornes, ou sans quizz applicable — et journalise le nombre de lignes écartées. Une cellule mal saisie fait donc disparaître **une** question, elle ne casse pas l'application chez les utilisateurs. Ce filet ne dispense pas d'une validation dans le script de synchronisation, où l'erreur est visible tout de suite.

---

## Les identifiants, le point à ne pas rater

L'identifiant est écrit dans la feuille, jamais généré par Firestore.

Format proposé : `civ-<thème abrégé>-<numéro>` — par exemple `civ-institutions-014`.

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

⚠️ La correspondance est exacte, accents et majuscules compris. Un thème mal orthographié ne provoque aucune erreur : la question s'affiche en gris ardoise, le repli silencieux prévu pour les thèmes inconnus. C'est le genre d'écart qu'on ne remarque qu'en production — une liste déroulante dans la feuille (validation des données) le rend impossible.

Ces intitulés sont une reprise de l'application sœur : ils sont à confirmer une fois les thèmes officiels de l'examen vérifiés sur service-public.fr.

---

## `applicable` : la colonne qui évite de tripler le travail

L'essentiel des questions vaut pour les trois titres. Une seule ligne les sert toutes :

| question | applicable |
|---|---|
| Quelle est la devise de la République française ? | `csp,cr,nat` |
| Quelle est la durée du mandat présidentiel ? | `cr,nat` |
| Quelles conditions faut-il remplir pour demander la naturalisation ? | `nat` |

Écrire trois fois la même question, une par quizz, coûterait trois corrections à chaque relecture — et les trois divergeraient.

---

## Les variantes : même énoncé, propositions plus dures

Le besoin est réel : une question peut valoir pour les trois titres, mais mériter des propositions plus subtiles pour la carte de résident et la naturalisation, dont les exigences sont plus élevées.

**Une ligne par variante, reliées par la colonne `groupe`.**

| id | groupe | question | choix1 | choix2 | choix3 | choix4 | bonne | applicable |
|---|---|---|---|---|---|---|---|---|
| `civ-inst-014-a` | `inst-014` | Combien de temps dure le mandat du Président ? | 4 ans | 5 ans | 7 ans | 10 ans | 2 | `csp` |
| `civ-inst-014-b` | `inst-014` | Combien de temps dure le mandat du Président ? | 5 ans, deux fois consécutives au plus | 5 ans, sans limite | 7 ans, renouvelable une fois | 5 ans, une seule fois | 1 | `cr,nat` |

Pourquoi des lignes plutôt que des colonnes supplémentaires (`choix1_dur`, `choix2_dur`…) :

- **La difficulté ne se limite pas aux propositions.** Une variante exigeante appelle souvent une explication plus fournie, parfois un palier différent. Des colonnes « dures » supposeraient de dupliquer aussi `explication` et `palier`, et la feuille deviendrait illisible.
- **Le code n'a rien à apprendre.** Chaque ligne est une question ordinaire, filtrée par `applicable` comme les autres. Aucune logique de variante à écrire, donc aucune à déboguer.
- **On peut avoir deux variantes ou cinq** sans retoucher la structure.

### Les trois règles à tenir

1. **Les `applicable` d'un même groupe sont disjoints.** `csp` d'un côté, `cr,nat` de l'autre : jamais un quizz dans deux variantes du même groupe. C'est ce qui garantit qu'un utilisateur ne voit qu'une version.
2. **`groupe` n'est pas un identifiant de document.** Chaque variante garde son `id` propre, stable et unique.
3. **L'énoncé reste identique entre variantes.** Si l'énoncé change, ce sont deux questions différentes, pas deux variantes — et le groupe n'a plus lieu d'être.

Filet de sécurité côté application : les tirages (examen blanc et révision) ne retiennent **qu'une variante par groupe**, même si la règle 1 a été enfreinte dans la feuille. Un doublon éditorial fait donc perdre une question à l'examen, il ne pose pas deux fois la même en donnant la réponse au passage.

Une formule de contrôle dans la feuille vaut mieux que ce filet : pour chaque groupe, vérifier qu'aucun quizz n'apparaît deux fois.

---

## Équilibrage

- Viser **8 à 12 questions par palier**, comme l'application sœur.
- Le nombre de paliers n'a pas à être le même d'un quizz à l'autre : il est recalculé par quizz depuis le contenu réellement applicable.
- Changer le **thème** d'une question est sans conséquence. Changer son **palier** en a : les questions sont filtrées par `palier <= palier de l'utilisateur`, donc déplacer une question vers un palier supérieur la fait disparaître chez ceux qui ne l'ont pas atteint, et leur compteur baisse.

---

## Conversions attendues du script de synchronisation

| Feuille | Firestore |
|---|---|
| `choix1..4` | `choix: string[]`, dans l'ordre, cellules vides ignorées |
| `bonne` (1-4) | `bonne: number` (0-3) — **la conversion se fait ici, une seule fois** |
| `applicable` (`csp,cr,nat`) | `applicable: string[]`, découpé sur la virgule, espaces retirés |
| `actif` (`VRAI`/`FAUX`) | `actif: boolean` |
| `groupe` vide | champ omis, et non chaîne vide — une chaîne vide regrouperait toutes les questions sans variante |
| `palier`, `bonne` | nombres, jamais des chaînes — l'application compare `palier <= palier utilisateur` |

La collection cible est **`questions_civique`**, dans le projet Firebase propre à Civique.
