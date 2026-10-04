import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';

/**
 * Cet écran est le seul qui puisse s'afficher avant que les polices personnalisées soient
 * chargées (app/_layout.tsx : `if (!policesPretes) contenu = <Chargement />`). Il ne doit donc
 * rendre aucun texte en police maison — la police de repli du système, différente selon les
 * appareils, peut le tronquer ou le déformer le temps que la vraie police prenne le relais.
 * Le drapeau (simples aplats de couleur, sans texte) reste sans risque.
 */
export default function Chargement() {
  return (
    <View style={styles.container}>
      <View style={styles.drapeau}>
        <View style={[styles.bande, { backgroundColor: '#1C2B49' }]} />
        <View style={[styles.bande, { backgroundColor: '#F6F3EC', borderWidth: 1, borderColor: '#DEDACD' }]} />
        <View style={[styles.bande, { backgroundColor: '#A62B2B' }]} />
      </View>
      <ActivityIndicator size="large" color={couleurs.or} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier, alignItems: 'center', justifyContent: 'center', padding: 24 },
  drapeau: { flexDirection: 'row', width: 66, height: 56 },
  bande: { width: 22, height: 56 },
  spinner: { marginTop: 24 },
});
