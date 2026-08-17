import { View, Text, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';
import EnTeteMarque from '../components/EnTeteMarque';

export default function PremierLancementHorsLigne() {
  return (
    <View style={styles.container}>
      <EnTeteMarque />
      <View style={styles.message}>
        <Text style={styles.messageTexte}>
          Aucune connexion internet détectée. Le tout premier chargement des fiches nécessite une
          connexion — reconnectez-vous, le chargement reprendra automatiquement.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: {
    marginTop: 24,
    backgroundColor: 'rgba(28,43,73,0.04)',
    borderRadius: 12,
    padding: 16,
  },
  messageTexte: { fontSize: 13.5, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 20, textAlign: 'center' },
});
