/**
 * Synchronisation de la feuille de contenu vers Firestore — script Apps Script.
 *
 * Deux commandes, ajoutées au menu de la feuille :
 *   • « Vérifier la feuille »     — contrôle tout, n'écrit rien. À lancer souvent pendant la rédaction.
 *   • « Synchroniser vers Firestore » — refuse de partir si une erreur subsiste.
 *
 * Authentification : le script s'exécute sous le compte Google qui l'ouvre, avec le jeton
 * OAuth d'Apps Script (portée `datastore` déclarée dans appsscript.json). Aucune clé de compte
 * de service n'est donc stockée ici — ce qui compte doublement, le dépôt étant public.
 * Il faut en contrepartie que ce compte ait les droits d'écriture sur le projet Firebase.
 *
 * Voir docs/feuille-questions.md pour le format attendu.
 */

// ── Configuration ────────────────────────────────────────────────────────────

/** Identifiant du projet Firebase, lu dans les propriétés du script (voir README). */
var CLE_PROJET = 'PROJET_FIRESTORE';

var COLLECTION = 'questions_civique';
// Onglets contenant des questions. Un seul, ou un par quizz — c'est un choix d'organisation
// de la feuille, sans effet sur l'application : ce qui range une question dans un parcours est
// sa colonne `quizz`, jamais l'onglet qui la porte.
//
// Un onglet par quizz : ['CSP', 'CR', 'NAT'].
var FEUILLES_QUESTIONS = ['Questions'];
var FEUILLE_RAPPORT = 'Contrôle';

var QUIZZ_CONNUS = ['csp', 'cr', 'nat'];
var TYPES_CONNUS = ['simple', 'situation'];

// ⚠️ Doit correspondre au caractère près à src/theme/colors.ts : un thème inconnu ne provoque
// aucune erreur dans l'application, la question s'affiche simplement en gris.
var THEMES_CONNUS = [
  'Principes et valeurs de la République',
  'Système institutionnel et politique',
  'Droits et devoirs des citoyens',
  'Histoire, géographie et culture',
  'Vivre dans la société française',
  'Livret du citoyen 2026',
];

/** Colonnes indispensables. L'ordre dans la feuille est libre : tout se lit par nom d'en-tête. */
// Colonnes sans lesquelles une question ne peut pas exister. `palier` et `actif` n'en font
// pas partie : leur absence a une valeur par défaut raisonnable, respectivement le palier
// déduit du type et une question active.
var COLONNES_REQUISES = [
  'id', 'quizz', 'question', 'choix1', 'choix2', 'bonne', 'explication', 'type', 'theme',
];

var COLONNES_CHOIX = ['choix1', 'choix2', 'choix3', 'choix4'];

/** Mises en situation attendues par examen — sert à alerter quand le stock est trop mince. */
var SITUATIONS_PAR_EXAMEN = 12;

/**
 * Marqueur à écrire dans la colonne `veille` d'une question dont le `type` est provisoire —
 * typiquement une question simple étiquetée « situation » pour pouvoir essayer le mode examen
 * avant que les vraies mises en situation soient écrites.
 *
 * Le script les recompte à chaque vérification : un aide-mémoire posé un jour de rédaction ne
 * survit pas trois semaines, une alerte à chaque contrôle si.
 */
var MARQUEUR_TYPE_PROVISOIRE = 'type provisoire';

/** Firestore plafonne une transaction à 500 écritures ; on garde une marge. */
var TAILLE_LOT = 400;

// ── Menu ─────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Contenu Civique')
    .addItem('Vérifier la feuille', 'verifierFeuille')
    .addSeparator()
    .addItem('Synchroniser vers Firestore', 'synchroniserVersFirestore')
    .addToUi();
}

// ── Commandes ────────────────────────────────────────────────────────────────

function verifierFeuille() {
  var analyse = analyserFeuille();
  ecrireRapport(analyse);
  var ui = SpreadsheetApp.getUi();
  if (analyse.erreurs.length === 0) {
    ui.alert(
      'Feuille valide',
      analyse.questions.length + ' question(s) prêtes à synchroniser.\n' +
        (analyse.avertissements.length
          ? analyse.avertissements.length + ' avertissement(s) — voir l\'onglet « ' + FEUILLE_RAPPORT + ' ».'
          : 'Aucun avertissement.'),
      ui.ButtonSet.OK
    );
  } else {
    ui.alert(
      'Corrections nécessaires',
      analyse.erreurs.length + ' erreur(s) bloquante(s). Le détail est dans l\'onglet « ' +
        FEUILLE_RAPPORT + ' ».',
      ui.ButtonSet.OK
    );
  }
}

function synchroniserVersFirestore() {
  var ui = SpreadsheetApp.getUi();
  var analyse = analyserFeuille();
  ecrireRapport(analyse);

  // Rien ne part tant qu'une erreur subsiste : une synchronisation partielle laisserait la
  // banque de questions dans un état que personne ne pourrait décrire.
  if (analyse.erreurs.length > 0) {
    ui.alert(
      'Synchronisation annulée',
      analyse.erreurs.length + ' erreur(s) à corriger d\'abord. Détail dans l\'onglet « ' +
        FEUILLE_RAPPORT + ' ».',
      ui.ButtonSet.OK
    );
    return;
  }

  var reponse = ui.alert(
    'Synchroniser ' + analyse.questions.length + ' question(s) ?',
    'Les documents Firestore seront réécrits à partir de la feuille. Toute modification faite ' +
      'directement dans la console Firebase sera perdue.',
    ui.ButtonSet.OK_CANCEL
  );
  if (reponse !== ui.Button.OK) return;

  var projet = idProjet();
  var ecrites = envoyerQuestions(projet, analyse.questions);
  var desactivees = desactiverAbsentes(projet, analyse.questions);

  ui.alert(
    'Synchronisation terminée',
    ecrites + ' question(s) écrite(s).\n' +
      desactivees + ' document(s) absent(s) de la feuille désactivé(s) (jamais supprimé(s)).',
    ui.ButtonSet.OK
  );
}

// ── Lecture et contrôle ──────────────────────────────────────────────────────

/**
 * Lit la feuille et contrôle chaque ligne.
 *
 * Distinction volontaire entre erreurs et avertissements : une erreur produirait une question
 * absente ou fausse dans l'application et bloque la synchronisation ; un avertissement signale
 * ce qui mérite un regard sans empêcher de publier.
 */
function analyserFeuille() {
  var contexte = {
    erreurs: [],
    avertissements: [],
    questions: [],
    // Partagés entre onglets : un identifiant doit être unique dans toute la banque et non
    // dans son seul onglet — deux `cr-0001` sur deux onglets s'écraseraient à l'écriture.
    identifiantsVus: {},
    typesProvisoires: [],
  };

  FEUILLES_QUESTIONS.forEach(function (nomFeuille) {
    analyserOnglet(nomFeuille, contexte);
  });

  if (contexte.typesProvisoires.length > 0) {
    contexte.avertissements.push({
      feuille: '',
      ligne: contexte.typesProvisoires.slice(0, 20).join(', ') +
        (contexte.typesProvisoires.length > 20 ? '…' : ''),
      champ: 'type',
      message: contexte.typesProvisoires.length + ' question(s) au type provisoire — à reclasser ' +
        'avant toute distribution, sans quoi de fausses mises en situation partiront en ' +
        'production. Filtrer la colonne « veille » sur « ' + MARQUEUR_TYPE_PROVISOIRE + ' ».',
    });
  }

  ajouterAvertissementsDEnsemble(contexte.questions, contexte.avertissements);
  return {
    erreurs: contexte.erreurs,
    avertissements: contexte.avertissements,
    questions: contexte.questions,
  };
}

/**
 * Lit et contrôle un onglet, en versant ses résultats dans le contexte commun.
 *
 * Chaque onglet porte ses propres en-têtes : leurs colonnes peuvent donc être ordonnées
 * différemment de l'un à l'autre sans conséquence. L'unicité des identifiants, elle, est
 * vérifiée sur l'ensemble — un identifiant en double écrase un document quel que soit
 * l'onglet d'où il vient.
 */
function analyserOnglet(nomFeuille, contexte) {
  var erreurs = contexte.erreurs;
  var avertissements = contexte.avertissements;
  var questions = contexte.questions;
  var identifiantsVus = contexte.identifiantsVus;
  var typesProvisoires = contexte.typesProvisoires;

  var feuille = SpreadsheetApp.getActive().getSheetByName(nomFeuille);
  if (!feuille) {
    erreurs.push({
      feuille: nomFeuille,
      ligne: '',
      champ: '',
      message: "Onglet introuvable. Corriger FEUILLES_QUESTIONS en tête du script, ou renommer l'onglet.",
    });
    return;
  }

  var valeurs = feuille.getDataRange().getValues();
  if (valeurs.length < 2) {
    avertissements.push({ feuille: nomFeuille, ligne: '', champ: '', message: 'Onglet vide.' });
    return;
  }

  // Index par nom d'en-tête : l'ordre des colonnes n'a aucune importance, et en réordonner
  // n'oblige à toucher ni ce script ni l'application.
  var index = {};
  var entetes = valeurs[0];
  for (var c = 0; c < entetes.length; c++) {
    var nom = normaliser(entetes[c]);
    if (nom) index[nom] = c;
  }

  var manquantes = 0;
  for (var i = 0; i < COLONNES_REQUISES.length; i++) {
    if (!(COLONNES_REQUISES[i] in index)) {
      erreurs.push({
        feuille: nomFeuille,
        ligne: 1,
        champ: COLONNES_REQUISES[i],
        message: "Colonne absente de l'onglet.",
      });
      manquantes++;
    }
  }
  // Sans en-têtes complets, contrôler les lignes ne produirait que du bruit.
  if (manquantes > 0) return;

  // Sert de contrôle croisé quand l'onglet porte le nom d'un quizz.
  var quizzDeLOnglet = normaliser(nomFeuille);

  for (var l = 1; l < valeurs.length; l++) {
    var ligne = valeurs[l];
    var numero = l + 1; // numéro affiché dans le tableur
    if (estLigneVide(ligne)) continue;

    var erreursAvant = erreurs.length;
    var champ = function (nom) {
      return nom in index ? ligne[index[nom]] : '';
    };

    var id = String(champ('id')).trim();
    if (!id) {
      erreurs.push({ feuille: nomFeuille, ligne: numero, champ: 'id', message: 'Identifiant vide.' });
    } else if (identifiantsVus[id]) {
      // Le cas le plus coûteux : à la synchronisation, le second document écrase le premier
      // et une question disparaît sans le moindre message. L'onglet d'origine est nommé —
      // avec plusieurs onglets, un numéro de ligne seul ne désigne rien.
      var premier = identifiantsVus[id];
      erreurs.push({
        feuille: nomFeuille,
        ligne: numero,
        champ: 'id',
        message: 'Identifiant déjà utilisé — onglet « ' + premier.feuille + ' », ligne ' +
          premier.ligne + '. Une question en écraserait une autre.',
      });
    } else if (!/^[a-z]{2,4}-\d{3,}$/.test(id)) {
      avertissements.push({ feuille: nomFeuille, ligne: numero, champ: 'id', message: 'Format inhabituel (attendu : csp-0001).' });
    }
    if (id) identifiantsVus[id] = { feuille: nomFeuille, ligne: numero };

    var quizz = normaliser(champ('quizz'));
    if (QUIZZ_CONNUS.indexOf(quizz) === -1) {
      erreurs.push({
        feuille: nomFeuille,
        ligne: numero,
        champ: 'quizz',
        message: 'Valeur « ' + champ('quizz') + ' » inconnue (attendu : ' + QUIZZ_CONNUS.join(', ') + ').',
      });
    } else if (quizzDeLOnglet && QUIZZ_CONNUS.indexOf(quizzDeLOnglet) !== -1 && quizz !== quizzDeLOnglet) {
      // L'onglet porte le nom d'un quizz mais la ligne en déclare un autre : signature d'une
      // ligne recopiée d'un onglet à l'autre sans que la colonne ait suivi. La colonne fait
      // foi — c'est elle que lit l'application — mais l'écart mérite un regard.
      avertissements.push({
        feuille: nomFeuille,
        ligne: numero,
        champ: 'quizz',
        message: 'Ligne déclarée « ' + quizz + ' » dans un onglet « ' + quizzDeLOnglet +
          ' » — recopiée d\'un autre onglet ?',
      });
    } else if (id && id.indexOf(quizz + '-') !== 0 && /^[a-z]{2,4}-/.test(id)) {
      // Signature d'une ligne dupliquée depuis un autre quizz dont on a oublié de changer
      // l'identifiant. Un avertissement et non une erreur : seule l'unicité compte vraiment,
      // le préfixe n'est qu'une convention de lecture.
      avertissements.push({
        feuille: nomFeuille,
        ligne: numero,
        champ: 'id',
        message: 'Identifiant « ' + id + ' » sur une question « ' + quizz +
          ' » — ligne recopiée d\'un autre quizz ?',
      });
    }

    var type = normaliser(champ('type'));
    if (TYPES_CONNUS.indexOf(type) === -1) {
      // L'application retombe sur « simple », la question n'est donc pas perdue — mais la
      // composition de l'examen blanc s'écarte de la règle sans que rien ne le signale.
      avertissements.push({
        feuille: nomFeuille,
        ligne: numero,
        champ: 'type',
        message: 'Valeur « ' + champ('type') + ' » inconnue : comptée comme « simple ».',
      });
      type = 'simple';
    }

    var enonce = String(champ('question')).trim();
    if (!enonce) erreurs.push({ feuille: nomFeuille, ligne: numero, champ: 'question', message: 'Énoncé vide.' });

    var choix = [];
    for (var k = 0; k < COLONNES_CHOIX.length; k++) {
      var proposition = String(champ(COLONNES_CHOIX[k])).trim();
      if (proposition) choix.push(proposition);
    }
    if (choix.length < 2) {
      erreurs.push({ feuille: nomFeuille, ligne: numero, champ: 'choix', message: 'Moins de deux propositions.' });
    } else if (choix.length < 4) {
      avertissements.push({ feuille: nomFeuille, ligne: numero, champ: 'choix', message: 'Seulement ' + choix.length + ' propositions.' });
    }
    var doublonChoix = premierDoublon(choix);
    if (doublonChoix) {
      erreurs.push({
        feuille: nomFeuille,
        ligne: numero,
        champ: 'choix',
        message: 'Deux propositions identiques : « ' + doublonChoix + ' ».',
      });
    }

    // Deux écritures acceptées : le numéro de la proposition, ou son texte recopié. La
    // seconde est la plus naturelle à la rédaction — on écrit la bonne réponse, on ne compte
    // pas des colonnes — et c'est ce que produit un contenu saisi sans le format en tête.
    var bonne = numeroBonneReponse(champ('bonne'), choix);
    if (bonne === null) {
      erreurs.push({
        feuille: nomFeuille,
        ligne: numero,
        champ: 'bonne',
        message: 'Doit être un entier entre 1 et ' + choix.length +
          ', ou le texte exact d\'une proposition (valeur lue : « ' + champ('bonne') + ' »).',
      });
    }

    var explication = String(champ('explication')).trim();
    if (!explication) {
      // Sur un QCM, l'explication est le contenu pédagogique : une question sans explication
      // apprend la bonne case, pas la règle.
      erreurs.push({ feuille: nomFeuille, ligne: numero, champ: 'explication', message: 'Explication vide.' });
    }

    var theme = String(champ('theme')).trim();
    if (THEMES_CONNUS.indexOf(theme) === -1) {
      erreurs.push({
        feuille: nomFeuille,
        ligne: numero,
        champ: 'theme',
        message: 'Thème « ' + theme + ' » inconnu — la question s\'afficherait en gris.',
      });
    }

    // Palier vide : déduit du type et marqué provisoire, comme le fait l'application sœur.
    // Rien n'oblige à répartir les paliers dès la rédaction ; ce qui compte est de savoir
    // lesquels restent à trancher, ce que la colonne `palierProvisoire` conserve.
    var palierBrut = String(champ('palier')).trim();
    var palier = palierBrut === '' ? (type === 'situation' ? 2 : 1) : Number(palierBrut);
    var palierDeduit = palierBrut === '';
    if (!estEntier(palier) || palier < 1) {
      erreurs.push({
        feuille: nomFeuille,
        ligne: numero,
        champ: 'palier',
        message: 'Doit être un entier supérieur ou égal à 1 (valeur lue : « ' + palierBrut + ' »).',
      });
    }

    // Cellule vide : la question est active. Écrire une ligne, c'est vouloir la question ;
    // c'est la retirer qui demande un geste explicite (`FAUX`).
    var actifBrut = String(champ('actif')).trim();
    var actif = actifBrut === '' ? true : lireBooleen(actifBrut);
    if (actif === null) {
      erreurs.push({
        feuille: nomFeuille,
        ligne: numero,
        champ: 'actif',
        message: 'Doit valoir VRAI ou FAUX, ou rester vide (valeur lue : « ' + actifBrut + ' »).',
      });
    }

    if (normaliser(champ('veille')).indexOf(MARQUEUR_TYPE_PROVISOIRE) !== -1) {
      typesProvisoires.push(nomFeuille + ' L' + numero);
    }

    if (erreurs.length !== erreursAvant) continue; // ligne invalide : rien à envoyer

    questions.push({
      feuille: nomFeuille,
      ligne: numero,
      id: id,
      quizz: quizz,
      type: type,
      question: enonce,
      choix: choix,
      bonne: bonne - 1, // la feuille compte à partir de 1, l'application indexe à partir de 0
      explication: explication,
      theme: theme,
      palier: palier,
      // Clé en minuscules : `champ()` interroge un index construit par `normaliser()`, qui
      // abaisse la casse des en-têtes. Une clé en casse mixte n'y correspondrait jamais, et
      // la colonne serait silencieusement lue comme vide.
      palierProvisoire: palierDeduit || lireBooleen(champ('palierprovisoire')) === true,
      actif: actif,
    });
  }
}


/** Contrôles qui ne se voient qu'à l'échelle du corpus, pas ligne à ligne. */
function ajouterAvertissementsDEnsemble(questions, avertissements) {
  for (var q = 0; q < QUIZZ_CONNUS.length; q++) {
    var quizz = QUIZZ_CONNUS[q];
    var duQuizz = questions.filter(function (question) {
      return question.quizz === quizz && question.actif;
    });
    if (duQuizz.length === 0) {
      avertissements.push({ feuille: '', ligne: '', champ: quizz, message: 'Aucune question active pour ce quizz.' });
      continue;
    }

    var situations = duQuizz.filter(function (question) {
      return question.type === 'situation';
    }).length;
    if (situations < SITUATIONS_PAR_EXAMEN) {
      avertissements.push({
        feuille: '',
        ligne: '',
        champ: quizz,
        message: situations + ' mise(s) en situation pour ' + SITUATIONS_PAR_EXAMEN +
          ' attendues par examen : l\'examen blanc complétera en questions simples.',
      });
    }

    // Un palier trop maigre se remarque : l'utilisateur débloque un niveau et reçoit deux
    // questions. Un palier trop chargé rend le déblocage suivant très lointain.
    var parPalier = {};
    duQuizz.forEach(function (question) {
      parPalier[question.palier] = (parPalier[question.palier] || 0) + 1;
    });
    Object.keys(parPalier).forEach(function (palier) {
      var nb = parPalier[palier];
      if (nb < 8 || nb > 12) {
        avertissements.push({
          feuille: '',
          ligne: '',
          champ: quizz + ' · palier ' + palier,
          message: nb + ' question(s) — la cible est de 8 à 12.',
        });
      }
    });
  }
}

// ── Rapport ──────────────────────────────────────────────────────────────────

function ecrireRapport(analyse) {
  var classeur = SpreadsheetApp.getActive();
  var feuille = classeur.getSheetByName(FEUILLE_RAPPORT);
  if (!feuille) feuille = classeur.insertSheet(FEUILLE_RAPPORT);
  feuille.clear();

  var lignes = [['Gravité', 'Onglet', 'Ligne', 'Champ', 'Message']];
  analyse.erreurs.forEach(function (e) {
    lignes.push(['Erreur', e.feuille || '', e.ligne, e.champ, e.message]);
  });
  analyse.avertissements.forEach(function (a) {
    lignes.push(['Avertissement', a.feuille || '', a.ligne, a.champ, a.message]);
  });

  lignes.push(['', '', '', '', '']);
  lignes.push(['Bilan', '', '', 'Questions valides', analyse.questions.length]);
  QUIZZ_CONNUS.forEach(function (quizz) {
    var duQuizz = analyse.questions.filter(function (q) {
      return q.quizz === quizz && q.actif;
    });
    var situations = duQuizz.filter(function (q) {
      return q.type === 'situation';
    }).length;
    lignes.push([
      'Bilan', '', '', quizz,
      duQuizz.length + ' active(s) · ' + situations + ' situation(s) · ' +
        (duQuizz.length - situations) + ' simple(s)',
    ]);
  });
  lignes.push(['Bilan', '', '', 'Onglets lus', FEUILLES_QUESTIONS.join(', ')]);
  lignes.push(['Bilan', '', '', 'Vérifié le', new Date()]);

  feuille.getRange(1, 1, lignes.length, 5).setValues(lignes);
  feuille.getRange(1, 1, 1, 5).setFontWeight('bold');
  feuille.setColumnWidth(5, 640);
  feuille.setFrozenRows(1);
  classeur.setActiveSheet(feuille);
}

// ── Écriture Firestore ───────────────────────────────────────────────────────

function idProjet() {
  var projet = PropertiesService.getScriptProperties().getProperty(CLE_PROJET);
  if (!projet) {
    throw new Error(
      'Propriété de script « ' + CLE_PROJET + ' » absente : renseignez l\'identifiant du ' +
        'projet Firebase (Paramètres du projet Apps Script → Propriétés du script).'
    );
  }
  return projet;
}

function envoyerQuestions(projet, questions) {
  var ecrites = 0;
  for (var debut = 0; debut < questions.length; debut += TAILLE_LOT) {
    var lot = questions.slice(debut, debut + TAILLE_LOT);
    var ecritures = lot.map(function (question) {
      return { update: documentFirestore(projet, question.id, champsFirestore(question)) };
    });
    commit(projet, ecritures);
    ecrites += lot.length;
  }
  return ecrites;
}

/**
 * Désactive les documents qui ne sont plus dans la feuille, au lieu de les supprimer.
 *
 * Supprimer libérerait un identifiant qui pourrait être réattribué plus tard à une question
 * différente — et tout ce qui référence l'ancienne (historique d'examens, rapports) pointerait
 * alors sur autre chose. Un document désactivé disparaît de l'application dès le prochain
 * instantané, ce qui suffit.
 */
function desactiverAbsentes(projet, questions) {
  var presents = {};
  questions.forEach(function (question) {
    presents[question.id] = true;
  });

  var ecritures = [];
  listerIdentifiants(projet).forEach(function (id) {
    if (!presents[id]) {
      ecritures.push({
        update: documentFirestore(projet, id, { actif: { booleanValue: false } }),
        updateMask: { fieldPaths: ['actif'] },
      });
    }
  });

  for (var debut = 0; debut < ecritures.length; debut += TAILLE_LOT) {
    commit(projet, ecritures.slice(debut, debut + TAILLE_LOT));
  }
  return ecritures.length;
}

function listerIdentifiants(projet) {
  var identifiants = [];
  var jeton = '';
  do {
    // mask.fieldPaths vide : seuls les noms de documents sont rapatriés, pas leur contenu.
    var url = 'https://firestore.googleapis.com/v1/projects/' + projet +
      '/databases/(default)/documents/' + COLLECTION +
      '?pageSize=300&mask.fieldPaths=_&' + (jeton ? 'pageToken=' + encodeURIComponent(jeton) : '');
    var reponse = appelFirestore(url, 'get', null);
    (reponse.documents || []).forEach(function (document) {
      identifiants.push(document.name.split('/').pop());
    });
    jeton = reponse.nextPageToken || '';
  } while (jeton);
  return identifiants;
}

function commit(projet, ecritures) {
  if (ecritures.length === 0) return;
  var url = 'https://firestore.googleapis.com/v1/projects/' + projet +
    '/databases/(default)/documents:commit';
  appelFirestore(url, 'post', { writes: ecritures });
}

function appelFirestore(url, methode, corps) {
  var options = {
    method: methode,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    contentType: 'application/json',
    muteHttpExceptions: true,
  };
  if (corps) options.payload = JSON.stringify(corps);

  var reponse = UrlFetchApp.fetch(url, options);
  var code = reponse.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('Firestore a répondu ' + code + ' : ' + reponse.getContentText());
  }
  return JSON.parse(reponse.getContentText() || '{}');
}

function documentFirestore(projet, id, champs) {
  return {
    name: 'projects/' + projet + '/databases/(default)/documents/' + COLLECTION + '/' + id,
    fields: champs,
  };
}

/**
 * Traduit une question dans le format typé de l'API Firestore.
 *
 * L'écriture n'utilise pas d'updateMask : le document est remplacé en entier, ce qui est la
 * traduction exacte de « la feuille est la seule source de vérité ». Un champ ajouté à la main
 * dans la console disparaît donc à la synchronisation suivante — c'est voulu.
 */
function champsFirestore(question) {
  return {
    quizz: { stringValue: question.quizz },
    type: { stringValue: question.type },
    question: { stringValue: question.question },
    choix: {
      arrayValue: {
        values: question.choix.map(function (proposition) {
          return { stringValue: proposition };
        }),
      },
    },
    // integerValue attend une chaîne : l'API refuse un nombre JSON pour un entier 64 bits.
    bonne: { integerValue: String(question.bonne) },
    explication: { stringValue: question.explication },
    theme: { stringValue: question.theme },
    palier: { integerValue: String(question.palier) },
    palierProvisoire: { booleanValue: question.palierProvisoire },
    actif: { booleanValue: question.actif },
  };
}

// ── Utilitaires ──────────────────────────────────────────────────────────────

function normaliser(valeur) {
  return String(valeur === null || valeur === undefined ? '' : valeur).trim().toLowerCase();
}

function estLigneVide(ligne) {
  for (var i = 0; i < ligne.length; i++) {
    if (String(ligne[i]).trim() !== '') return false;
  }
  return true;
}

function estEntier(valeur) {
  return typeof valeur === 'number' && isFinite(valeur) && Math.floor(valeur) === valeur;
}

/** Accepte la case à cocher (booléen) comme le texte saisi (VRAI/FAUX, TRUE/FALSE, oui/non). */
function lireBooleen(valeur) {
  if (typeof valeur === 'boolean') return valeur;
  var texte = normaliser(valeur);
  if (texte === '') return null;
  if (texte === 'vrai' || texte === 'true' || texte === 'oui' || texte === '1') return true;
  if (texte === 'faux' || texte === 'false' || texte === 'non' || texte === '0') return false;
  return null;
}

/**
 * Numéro (1-based) de la bonne proposition, à partir d'un numéro ou du texte recopié.
 * Renvoie null si la valeur ne désigne aucune proposition.
 */
function numeroBonneReponse(valeur, choix) {
  var brut = String(valeur === null || valeur === undefined ? '' : valeur).trim();
  if (brut === '') return null;

  var nombre = Number(brut);
  if (estEntier(nombre)) {
    return nombre >= 1 && nombre <= choix.length ? nombre : null;
  }

  // Comparaison sur la casse et les espaces uniquement : corriger une faute de frappe dans
  // une proposition ne doit pas casser la correspondance de façon invisible, mais deux
  // propositions différentes ne doivent pas se confondre non plus.
  var cible = normaliser(brut);
  for (var i = 0; i < choix.length; i++) {
    if (normaliser(choix[i]) === cible) return i + 1;
  }
  return null;
}

function premierDoublon(valeurs) {
  var vus = {};
  for (var i = 0; i < valeurs.length; i++) {
    var cle = valeurs[i].toLowerCase();
    if (vus[cle]) return valeurs[i];
    vus[cle] = true;
  }
  return null;
}
