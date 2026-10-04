// src/config/questionsDemo.ts
//
// Jeu de questions local, pour essayer l'application avant que le contenu réel existe dans
// Firestore. Une collection vide donne une application vide : impossible de vérifier le mode
// examen, le déblocage de palier ou l'écran de résultat sans quelques questions sous la main.
//
// ⚠️ Ce contenu n'est pas destiné aux utilisateurs. Il ne peut pas partir en production :
// `QUESTIONS_DEMO_ACTIVES` est conditionné à `__DEV__`, faux dans tout build de release.
//
// Pour essayer avec du vrai contenu avant d'avoir câblé la synchronisation, remplacer
// simplement les entrées ci-dessous — le format est celui de la feuille, `bonne` indexée à
// partir de 0 comme dans Firestore.

import { Question } from '../../services/firebase';

/** Mettre à false pour lire Firestore même en développement. */
const ACTIVER_DEMO = false;

export const QUESTIONS_DEMO_ACTIVES = __DEV__ && ACTIVER_DEMO;

const T_PRINCIPES = 'Principes et valeurs de la République';
const T_INSTITUTIONS = 'Système institutionnel et politique';
const T_DROITS = 'Droits et devoirs des citoyens';
const T_HISTOIRE = 'Histoire, géographie et culture';
const T_SOCIETE = 'Vivre dans la société française';

export const QUESTIONS_DEMO: Question[] = [
  // ── Carte de séjour pluriannuelle ──────────────────────────────────────────
  {
    id: 'demo-csp-0001', quizz: 'csp', type: 'simple', palier: 1, actif: true, theme: T_PRINCIPES,
    question: 'Quelle est la devise de la République française ?',
    choix: ['Paix, Travail, Patrie', 'Liberté, Égalité, Fraternité', 'Unité, Justice, Progrès', 'Ordre et Progrès'],
    bonne: 1,
    explication: "« Liberté, Égalité, Fraternité » est la devise de la République, inscrite à l'article 2 de la Constitution.",
  },
  {
    id: 'demo-csp-0002', quizz: 'csp', type: 'simple', palier: 1, actif: true, theme: T_INSTITUTIONS,
    question: 'Quelle est la capitale de la France ?',
    choix: ['Lyon', 'Marseille', 'Paris', 'Bordeaux'],
    bonne: 2,
    explication: 'Paris est la capitale de la France et le siège des principales institutions nationales.',
  },
  {
    id: 'demo-csp-0003', quizz: 'csp', type: 'simple', palier: 2, actif: true, theme: T_DROITS,
    question: 'Le vote est-il obligatoire en France ?',
    choix: ['Oui, sous peine d\'amende', 'Non, c\'est un droit et non une obligation', 'Oui, mais seulement à l\'élection présidentielle', 'Non, le vote est réservé aux plus de 25 ans'],
    bonne: 1,
    explication: "Voter est un droit civique, pas une obligation légale — contrairement à la Belgique ou au Luxembourg, où l'abstention est sanctionnée.",
  },
  {
    id: 'demo-csp-0004', quizz: 'csp', type: 'situation', palier: 2, actif: true, theme: T_SOCIETE,
    question: "Votre employeur vous demande de travailler le 1er mai. Que dit la loi ?",
    choix: [
      'Le 1er mai est un jour férié chômé : le travail n\'y est possible que dans les établissements qui ne peuvent pas interrompre leur activité',
      'Le 1er mai est un jour ordinaire, l\'employeur décide librement',
      'Le travail y est interdit sans aucune exception',
      'Le 1er mai n\'est férié que dans la fonction publique',
    ],
    bonne: 0,
    explication: "Le 1er mai est le seul jour férié obligatoirement chômé et payé. Seuls les établissements dont l'activité ne peut être interrompue (hôpitaux, transports) peuvent y faire travailler, avec une majoration de salaire.",
  },
  {
    id: 'demo-csp-0005', quizz: 'csp', type: 'simple', palier: 3, actif: true, theme: T_HISTOIRE,
    question: 'Que célèbre-t-on le 14 juillet ?',
    choix: ['L\'armistice de 1918', 'La prise de la Bastille et la fête de la Fédération', 'La libération de Paris', 'L\'abolition de l\'esclavage'],
    bonne: 1,
    explication: "La fête nationale commémore la prise de la Bastille du 14 juillet 1789 et la fête de la Fédération du 14 juillet 1790.",
  },

  // ── Carte de résident ──────────────────────────────────────────────────────
  {
    id: 'demo-cr-0001', quizz: 'cr', type: 'simple', palier: 1, actif: true, theme: T_INSTITUTIONS,
    question: 'Combien de temps dure le mandat du Président de la République ?',
    choix: ['4 ans', '5 ans, deux fois consécutives au plus', '7 ans, renouvelable une fois', '5 ans, une seule fois dans une vie'],
    bonne: 1,
    explication: "Depuis la réforme de 2000, le mandat est de cinq ans. La Constitution interdit d'exercer plus de deux mandats consécutifs.",
  },
  {
    id: 'demo-cr-0002', quizz: 'cr', type: 'simple', palier: 1, actif: true, theme: T_PRINCIPES,
    question: 'Que signifie la laïcité en France ?',
    choix: [
      'L\'interdiction de toute religion dans l\'espace public',
      'La neutralité de l\'État, qui garantit la liberté de croire ou de ne pas croire',
      'La reconnaissance officielle des principaux cultes',
      'L\'obligation pour chacun de déclarer sa religion',
    ],
    bonne: 1,
    explication: "La loi de 1905 sépare les Églises et l'État : l'État ne reconnaît ni ne salarie aucun culte, et garantit à chacun la liberté de conscience.",
  },
  {
    id: 'demo-cr-0003', quizz: 'cr', type: 'simple', palier: 2, actif: true, theme: T_DROITS,
    question: 'À partir de quel âge la scolarité est-elle obligatoire en France ?',
    choix: ['3 ans', '5 ans', '6 ans', '7 ans'],
    bonne: 0,
    explication: "Depuis la rentrée 2019, l'instruction est obligatoire dès 3 ans, et jusqu'à 16 ans.",
  },
  {
    id: 'demo-cr-0004', quizz: 'cr', type: 'situation', palier: 2, actif: true, theme: T_DROITS,
    question: "Un propriétaire refuse de vous louer un logement en invoquant votre origine. Que pouvez-vous faire ?",
    choix: [
      'Rien, un propriétaire choisit librement son locataire',
      'Saisir le Défenseur des droits ou porter plainte : la discrimination au logement est un délit',
      'Négocier un loyer plus élevé pour le convaincre',
      'Attendre un an avant de pouvoir agir',
    ],
    bonne: 1,
    explication: "Refuser un logement en raison de l'origine est une discrimination punie par la loi. Le Défenseur des droits peut être saisi gratuitement, et une plainte pénale reste possible.",
  },
  {
    id: 'demo-cr-0005', quizz: 'cr', type: 'simple', palier: 3, actif: true, theme: T_HISTOIRE,
    question: 'Qui était Marianne ?',
    choix: ['Une reine de France', 'La représentation symbolique de la République', 'Une résistante de 1944', 'La première femme ministre'],
    bonne: 1,
    explication: "Marianne incarne la République depuis 1792. Son buste figure dans les mairies et son profil sur les timbres.",
  },

  // ── Naturalisation ─────────────────────────────────────────────────────────
  {
    id: 'demo-nat-0001', quizz: 'nat', type: 'simple', palier: 1, actif: true, theme: T_INSTITUTIONS,
    question: 'Qui vote les lois en France ?',
    choix: ['Le Président seul', 'Le Parlement, composé de l\'Assemblée nationale et du Sénat', 'Le Conseil constitutionnel', 'Le Premier ministre'],
    bonne: 1,
    explication: "Le Parlement vote la loi. L'Assemblée nationale, élue au suffrage direct, a le dernier mot en cas de désaccord avec le Sénat.",
  },
  {
    id: 'demo-nat-0002', quizz: 'nat', type: 'simple', palier: 1, actif: true, theme: T_PRINCIPES,
    question: 'Quels sont les trois pouvoirs de la République ?',
    choix: ['Militaire, civil et religieux', 'Législatif, exécutif et judiciaire', 'National, régional et communal', 'Économique, social et culturel'],
    bonne: 1,
    explication: "La séparation des pouvoirs — faire la loi, l'appliquer, la faire respecter — protège les citoyens de l'arbitraire.",
  },
  {
    id: 'demo-nat-0003', quizz: 'nat', type: 'simple', palier: 2, actif: true, theme: T_HISTOIRE,
    question: 'En quelle année les femmes ont-elles obtenu le droit de vote en France ?',
    choix: ['1918', '1936', '1944', '1958'],
    bonne: 2,
    explication: "L'ordonnance du 21 avril 1944 accorde le droit de vote aux femmes ; elles votent pour la première fois en avril 1945.",
  },
  {
    id: 'demo-nat-0004', quizz: 'nat', type: 'situation', palier: 2, actif: true, theme: T_SOCIETE,
    question: "Votre voisin vous demande de signer une pétition contre l'ouverture d'un lieu de culte dans le quartier. Que faites-vous ?",
    choix: [
      'Vous signez : la majorité du quartier doit décider',
      'Vous refusez : la liberté de culte est garantie par la loi et ne dépend pas d\'un vote de voisinage',
      'Vous signez sans donner votre nom',
      'Vous demandez au maire d\'interdire le projet',
    ],
    bonne: 1,
    explication: "La liberté de conscience et de culte est garantie par la loi de 1905. Une pétition de voisinage n'a aucune valeur juridique dès lors que le projet respecte les règles d'urbanisme et d'ordre public.",
  },
  {
    id: 'demo-nat-0005', quizz: 'nat', type: 'situation', palier: 3, actif: true, theme: T_DROITS,
    question: "Un collègue tient des propos racistes de façon répétée au travail. Quelle est la bonne démarche ?",
    choix: [
      'Ignorer : les propos tenus entre collègues ne regardent pas l\'employeur',
      'Alerter l\'employeur, tenu de protéger ses salariés ; les propos racistes sont par ailleurs punis par la loi',
      'Répondre sur le même ton pour rétablir l\'équilibre',
      'Attendre d\'avoir réuni au moins trois témoins avant d\'en parler',
    ],
    bonne: 1,
    explication: "L'employeur a une obligation de sécurité qui couvre le harcèlement discriminatoire. Les injures racistes sont en outre pénalement réprimées, et le CSE ou l'inspection du travail peuvent être saisis.",
  },
];
