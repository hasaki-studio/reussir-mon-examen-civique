import { View, Text, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';

export default function EnTeteMarque() {
  return (
    <View style={styles.container}>
      <View style={styles.drapeau}>
        <View style={[styles.bande, { backgroundColor: '#1C2B49' }]} />
        <View style={[styles.bande, { backgroundColor: '#F6F3EC', borderWidth: 1, borderColor: '#DEDACD' }]} />
        <View style={[styles.bande, { backgroundColor: '#A62B2B' }]} />
      </View>
      <Text style={styles.accroche}>Réussir</Text>
      <Text style={styles.titre}>Mon examen civique</Text>
      <Text style={styles.sousTitre}>Réviser à votre rythme, puis se tester</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  drapeau: { flexDirection: 'row', width: 66, height: 56, marginBottom: 18 },
  bande: { width: 22, height: 56 },
  accroche: { fontSize: 34, lineHeight: 40, fontFamily: polices.titreGras, color: couleurs.or },
  titre: { fontSize: 25, lineHeight: 31, fontFamily: polices.titreGras, color: couleurs.bleuNuit, textAlign: 'center' },
  sousTitre: { fontSize: 14, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 6 },
});
