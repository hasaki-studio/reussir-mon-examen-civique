# Script de synchronisation — feuille → Firestore

Script Apps Script attaché au classeur de contenu. Deux commandes, dans le menu **Contenu Civique** :

- **Vérifier la feuille** — contrôle tout, n'écrit rien. À lancer souvent pendant la rédaction.
- **Synchroniser vers Firestore** — refuse de partir tant qu'une erreur subsiste.

## Installation

1. Dans le classeur : **Extensions → Apps Script**.
2. Coller `Synchronisation.gs` dans le fichier de code (renommer le fichier par défaut si besoin).
3. Afficher le manifeste (**Paramètres du projet → Afficher « appsscript.json »**) et y coller le contenu d'`appsscript.json`.
4. **Paramètres du projet → Propriétés du script** : ajouter `PROJET_FIRESTORE` = **identifiant** du projet Firebase.

   ⚠️ L'identifiant, pas le nom affiché. Un projet nommé « Civique » a souvent un identifiant du type `civique-4f2a1`. Il se lit dans la console Firebase → ⚙️ Paramètres du projet → *ID du projet*. Se tromper ici donne un 403 qui ressemble à un problème de droits.

5. Recharger le classeur : le menu **Contenu Civique** apparaît.
6. Premier lancement : Google demande les autorisations. Les accorder avec le compte qui **a les droits d'écriture sur le projet Firebase**.

   ⚠️ Un écran « Google n'a pas validé cette application » s'affiche : c'est normal pour un script personnel, non publié. **Paramètres avancés** → *Accéder à … (non sécurisé)*. Sans ce passage, l'autorisation n'aboutit pas et la synchronisation échoue sans explication claire.

## Un onglet ou trois ?

Les deux marchent. La constante `FEUILLES_QUESTIONS`, en tête du script, liste les onglets à lire :

```js
var FEUILLES_QUESTIONS = ['Questions'];          // un seul onglet
var FEUILLES_QUESTIONS = ['CSP', 'CR', 'NAT'];   // un onglet par quizz
```

C'est un choix d'organisation de la feuille, sans effet sur l'application : ce qui range une question dans un parcours est sa colonne `quizz`, jamais l'onglet qui la porte. Chaque onglet a ses propres en-têtes, leurs colonnes peuvent donc être ordonnées différemment.

Deux contrôles tiennent compte du découpage :

- **L'unicité des identifiants est vérifiée sur l'ensemble**, pas onglet par onglet. Deux `cr-0001` sur deux onglets s'écraseraient à l'écriture ; l'erreur nomme l'onglet et la ligne de la première occurrence.
- **Quand un onglet porte le nom d'un quizz** (`CSP`, `CR`, `NAT`), une ligne qui en déclare un autre lève un avertissement — signature d'une ligne recopiée d'un onglet à l'autre sans que la colonne ait suivi. La colonne fait foi, c'est elle que lit l'application.

Un onglet listé mais absent du classeur produit une erreur explicite plutôt qu'un silence.

L'onglet **`Contrôle`** est créé et réécrit à chaque vérification.

## Pourquoi pas une clé d'API Web, comme dans l'application sœur

Le script de Nat écrit avec `?key=<clé d'API Web>` et sans en-tête d'autorisation. C'est une
requête **non authentifiée** : elle passe par les règles de sécurité Firestore, exactement
comme l'application. Elle ne peut donc aboutir que si `allow write` est vrai pour la
collection — c'est-à-dire si **n'importe qui** peut réécrire la banque de questions, la clé
d'API Web étant distribuée dans l'APK et lisible par quiconque le décompresse.

Le jeton OAuth utilisé ici est d'une autre nature : c'est un accès **serveur**, rattaché à un
compte Google ayant des droits IAM sur le projet. Il contourne les règles par conception. La
collection peut donc rester en `allow write: if false` tout en étant alimentée depuis la
feuille — c'est ce que fait [`firestore.rules`](../../firestore.rules).

⚠️ **Ne jamais ouvrir l'écriture avant une synchronisation.** L'application sœur impose ce
geste — ouvrir les règles, synchroniser, refermer — parce qu'elle écrit avec une clé d'API Web.
Ici c'est inutile, et contre-productif : pendant ces quelques minutes, la clé distribuée dans
l'APK suffirait à réécrire toute la banque de questions. Si une synchronisation échoue, la
cause est ailleurs — voir plus bas.

## Pourquoi aucune clé de compte de service

Le script s'authentifie avec le jeton OAuth d'Apps Script (portée `datastore`), donc **sous l'identité de la personne qui lance la commande**. Aucun secret n'est stocké dans le script ni dans ce dépôt — qui est public, ce qui rend le point non négociable.

Contrepartie : le compte qui lance la synchronisation doit avoir les droits d'écriture Firestore sur le projet. Pour un projet personnel, c'est le cas du propriétaire.

## Ce que la synchronisation fait, et ne fait pas

**Elle réécrit chaque document en entier**, à l'identifiant porté par la colonne `ID`. C'est la traduction exacte de « la feuille est la seule source de vérité » : un champ ajouté à la main dans la console Firebase disparaît à la synchronisation suivante.

**Elle ne supprime jamais rien.** Un document présent dans Firestore mais absent de la feuille passe simplement à `actif = false` : il disparaît de l'application au prochain instantané, mais son identifiant reste pris — donc jamais réattribué à une question différente, ce qui protège l'historique des examens et la continuité des rapports.

**Elle ne part pas si une erreur subsiste.** Une synchronisation partielle laisserait la banque de questions dans un état que personne ne saurait décrire.

## Erreurs et avertissements

Une **erreur** produirait une question absente ou fausse dans l'application, et bloque la synchronisation : identifiant vide ou en double, quizz inconnu, thème inconnu, énoncé ou explication vide, moins de deux propositions, deux propositions identiques, `bonne` hors bornes, palier non entier, `actif` illisible.

Un **avertissement** mérite un regard sans empêcher de publier : `type` inconnu (compté comme `simple`), identifiant au format inhabituel ou dont le préfixe ne correspond pas au quizz — signature d'une ligne recopiée —, moins de quatre propositions, moins de douze mises en situation pour un quizz, palier hors de la cible de 8 à 12 questions.

Un avertissement particulier compte les lignes portant **`TYPE PROVISOIRE`** dans la colonne `veille` : des questions dont le `type` ne dit pas la vérité, le temps d'essayer le mode examen. Il faut les reclasser avant toute distribution.

Le bilan par quizz — questions actives, mises en situation, questions simples — est écrit en bas de l'onglet `Contrôle`.

## Si la synchronisation répond 403

Deux causes, dans cet ordre de probabilité :

1. **Le compte qui a autorisé le script n'est pas celui qui possède le projet Firebase.**
   Réexécuter la commande et accorder les autorisations avec le bon compte.
2. **La propriété `PROJET_FIRESTORE` désigne un autre projet**, sur lequel ce compte n'a pas
   de droits.

Une réponse 404 sur la collection est normale tant qu'aucun document n'existe : la
synchronisation la crée au premier envoi.

## Format attendu

Voir [`docs/feuille-questions.md`](../../docs/feuille-questions.md). **L'ordre des colonnes est libre** : tout est lu par nom d'en-tête, insensible à la casse et aux espaces de bord.
