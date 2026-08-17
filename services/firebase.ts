import { getFirestore, collection, query, where, onSnapshot } from '@react-native-firebase/firestore';
import type { Quizz } from '../src/config/quizz';

/**
 * Une question à choix multiples, telle que synchronisée depuis la feuille de contenu.
 *
 * `explication` remplace le couple `reponse` / `bonus` de l'application sœur : sur un QCM,
 * l'explication de la bonne réponse est le contenu pédagogique lui-même, elle est donc
 * toujours affichée et jamais conditionnée à une publicité.
 */
export interface Question {
  /** Identifiant du document Firestore — stable et explicite, imposé par la synchronisation. */
  id: string;
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
   * Rattache entre elles les variantes d'une même question : même énoncé, propositions plus
   * exigeantes selon le titre visé. Les variantes ont des `applicable` disjoints, donc une
   * seule concerne un quizz donné ; ce champ sert à les retrouver dans la feuille, et de
   * garde-fou au tirage.
   */
  groupe?: string;
  /** Quizz auxquels la question s'applique — l'essentiel du contenu vaut pour les trois. */
  applicable: Quizz[];
  actif: boolean;
}

/**
 * Écarte les documents qu'un écran de QCM ne saurait pas afficher.
 *
 * Le contenu vient d'une feuille de calcul remplie à la main : une ligne peut arriver sans
 * propositions, avec un index de bonne réponse hors bornes, ou sans quizz applicable. Sans ce
 * filtre, une seule cellule mal saisie planterait l'écran de question chez tous les
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
    Array.isArray(q.applicable) &&
    q.applicable.length > 0 &&
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
      const questions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Question[];
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
