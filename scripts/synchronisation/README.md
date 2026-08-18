# Script de synchronisation — feuille → Firestore

Script Apps Script attaché au classeur de contenu. Deux commandes, dans le menu **Contenu Civique** :

- **Vérifier la feuille** — contrôle tout, n'écrit rien. À lancer souvent pendant la rédaction.
- **Synchroniser vers Firestore** — refuse de partir tant qu'une erreur subsiste.

## Installation

1. Dans le classeur : **Extensions → Apps Script**.
2. Coller `Synchronisation.gs` dans le fichier de code (renommer le fichier par défaut si besoin).
3. Afficher le manifeste (**Paramètres du projet → Afficher « appsscript.json »**) et y coller le contenu d'`appsscript.json`.
4. **Paramètres du projet → Propriétés du script** : ajouter `PROJET_FIRESTORE` = identifiant du projet Firebase de Civique.
5. Recharger le classeur : le menu **Contenu Civique** apparaît.
6. Premier lancement : Google demande les autorisations. Les accorder avec le compte qui **a les droits d'écriture sur le projet Firebase**.

L'onglet des questions doit s'appeler **`Questions`**. L'onglet **`Contrôle`** est créé et réécrit à chaque vérification.

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

Le bilan par quizz — questions actives, mises en situation, questions simples — est écrit en bas de l'onglet `Contrôle`.

## Format attendu

Voir [`docs/feuille-questions.md`](../../docs/feuille-questions.md). **L'ordre des colonnes est libre** : tout est lu par nom d'en-tête, insensible à la casse et aux espaces de bord.
