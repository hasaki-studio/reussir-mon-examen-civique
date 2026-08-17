import { getFirestore, collection, query, where, onSnapshot } from '@react-native-firebase/firestore';
import { estQuizz, type Quizz } from '../src/config/quizz';

/**
 * Une question à choix multiples, telle que synchronisée depuis la feuille de contenu.
 *
 * `explication` remplace le couple `reponse` / `bonus` de l'application sœur : sur un QCM,
 * l'explication de la bonne réponse est le contenu pédagogique lui-même, elle est donc
 * toujours affichée et jamais conditionnée à une publicité.
 */
/**
 * L'examen réel mêle deux formes : des questions de connaissance et des mises en situation.
 * Le mode examen blanc respecte leur proportion officielle, ce qui suppose de savoir à quelle
 * forme appartient chaque question.
 */
export type TypeQuestion = 'simple' | 'situation';

export interface Question {
  /** Identifiant du document Firestore — stable et explicite, imposé par la synchronisation. */
  id: string;
  type: TypeQuestion;
  question: string;
  /** Propositions, dans l'ordre d'affichage. */
  choix: string[];
  /** Index de la bonne proposition dans `choix`. */
  bonne: number;
  explication: string;
  theme: string;
  palier: number;
  palierProvisoire?: boolean;
  /**
   * Le quizz — et un seul — auquel la question appartient.
   *
   * Un énoncé valable pour plusieurs titres est dupliqué dans la feuille, une ligne par quizz,
   * avec ses propres propositions : les exigences ne sont pas les mêmes selon qu'on demande une
   * carte de séjour pluriannuelle ou la naturalisation, et c'est le jeu de propositions qui
   * porte cette différence. Le contenu est donc entièrement cloisonné par quizz.
   */
  quizz: Quizz;
  actif: boolean;
}

/**
 * Écarte les documents qu'un écran de QCM ne saurait pas afficher.
 *
 * Le contenu vient d'une feuille de calcul remplie à la main : une ligne peut arriver sans
 * propositions, avec un index de bonne réponse hors bornes, ou avec un quizz mal orthographié.
 * Sans ce filtre, une seule cellule mal saisie planterait l'écran de question chez tous les
 * utilisateurs, en production, jusqu'à la synchronisation suivante. Mieux vaut une question
 * manquante qu'une application qui se ferme.
 */
function estQuestionAffichable(q: Question): boolean {
  return (
    typeof q.question === 'string' &&
    q.question.length > 0 &&
    Array.isArray(q.choix) &&
    q.choix.length >= 2 &&
    typeof q.bonne === 'number' &&
    q.bonne >= 0 &&
    q.bonne < q.choix.length &&
    estQuizz(q.quizz) &&
    typeof q.palier === 'number'
  );
}

export function ecouterQuestions(
  onChange: (questions: Question[]) => void,
  onError: (error: Error) => void
) {
  const db = getFirestore();
  // Une seule écoute sert les trois quizz : le tri par quizz se fait sur l'appareil, sur un
  // corpus déjà en mémoire. Filtrer côté serveur (`array-contains`) obligerait à relancer une
  // écoute — et à repayer les lectures — à chaque changement de quizz, alors que l'utilisateur
  // passe volontiers de l'un à l'autre.
  const q = query(collection(db, 'questions_civique'), where('actif', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const questions = snapshot.docs.map((doc) => {
        const donnees = doc.data();
        return {
          ...donnees,
          id: doc.id,
          // Une cellule `type` oubliée ne doit pas faire disparaître une question par ailleurs
          // correcte : elle compte alors comme question simple, la forme la plus courante. Le
          // seul effet est un examen blanc dont la proportion de mises en situation s'écarte
          // un peu de la règle — préférable à un trou dans le contenu.
          type: donnees.type === 'situation' ? 'situation' : 'simple',
        };
      }) as Question[];
      const affichables = questions.filter(estQuestionAffichable);
      if (affichables.length !== questions.length) {
        console.warn(
          `${questions.length - affichables.length} question(s) écartée(s) : format invalide`
        );
      }
      onChange(affichables);
    },
    (error) => onError(error)
  );
}
