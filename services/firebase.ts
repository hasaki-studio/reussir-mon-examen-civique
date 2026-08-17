import { getFirestore, collection, query, where, onSnapshot } from '@react-native-firebase/firestore';

export interface Question {
  id: string;
  question: string;
  theme: string;
  palier: number;
  palierProvisoire: boolean;
  reponse: string;
  bonus?: string;
  infoBulle?: string;
  typeQuestion: 'simple' | 'complexe';
  actif: boolean;
}

export function ecouterQuestions(
  onChange: (questions: Question[]) => void,
  onError: (error: Error) => void
) {
  const db = getFirestore();
  const q = query(collection(db, 'questions_nat'), where('actif', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const questions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Question[];
      onChange(questions);
    },
    (error) => onError(error)
  );
}