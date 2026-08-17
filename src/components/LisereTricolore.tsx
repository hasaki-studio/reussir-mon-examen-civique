import { View, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';

export default function LisereTricolore() {
  return (
    <View style={styles.liseret}>
      <View style={[styles.bande, { backgroundColor: couleurs.bleuNuit }]} />
      <View style={[styles.bande, { backgroundColor: couleurs.papier }]} />
      <View style={[styles.bande, { backgroundColor: couleurs.rouge }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  liseret: { flexDirection: 'row', height: 5 },
  bande: { flex: 1 },
});
