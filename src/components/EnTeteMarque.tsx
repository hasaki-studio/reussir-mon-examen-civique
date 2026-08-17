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
      <Text style={styles.eyebrow}>Préparation à l'examen civique</Text>
      <Text style={styles.titre}>Réussir mon test civique</Text>
      <Text style={styles.sousTitre}>Réviser à votre rythme, puis se tester</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  drapeau: { flexDirection: 'row', width: 66, height: 56, marginBottom: 18 },
  bande: { width: 22, height: 56 },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: couleurs.or, fontFamily: polices.texteSemiGras, marginBottom: 6 },
  titre: { fontSize: 26, fontFamily: polices.titre, color: couleurs.bleuNuit },
  sousTitre: { fontSize: 14, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 6 },
});
