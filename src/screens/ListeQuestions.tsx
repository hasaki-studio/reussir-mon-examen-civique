import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';
import { Question } from '../../services/firebase';

interface Props {
  titre: string;
  questions: Question[];
  onSelectionnerQuestion: (questionId: string) => void;
  onRetour: () => void;
}

export default function ListeQuestions({ titre, questions, onSelectionnerQuestion, onRetour }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contenu}>
      <TouchableOpacity
        // Cible tactile élargie sans changer l'apparence : le texte reste petit,
        // mais la zone qui répond au toucher dépasse le cadre visible tout autour.
        onPress={onRetour}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
      >
        <Text style={styles.retour}>← Réviser en détail</Text>
      </TouchableOpacity>
      <Text style={styles.titre}>{titre}</Text>
      <Text style={styles.compteur}>
        {questions.length} fiche{questions.length > 1 ? 's' : ''} débloquée{questions.length > 1 ? 's' : ''}
      </Text>

      <View style={styles.liste}>
        {questions.map((q, index) => (
          <TouchableOpacity
            key={q.id}
            style={styles.carte}
            onPress={() => onSelectionnerQuestion(q.id)}
          >
            <Text style={styles.numero}>{index + 1}</Text>
            <Text style={styles.carteTexte} numberOfLines={2}>
              {q.question}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  retour: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise, marginBottom: 12 },
  titre: { fontSize: 22, fontFamily: polices.titre, color: couleurs.bleuNuit },
  compteur: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 4, marginBottom: 20 },
  liste: { gap: 10 },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    borderRadius: 12,
    padding: 15,
    backgroundColor: couleurs.papier,
  },
  numero: { fontSize: 12, fontFamily: polices.texteSemiGras, color: couleurs.or, width: 20 },
  carteTexte: { flex: 1, fontSize: 14, color: couleurs.bleuNuit, fontFamily: polices.texteMoyen },
});
