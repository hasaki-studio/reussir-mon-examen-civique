import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';
import EnTeteMarque from '../components/EnTeteMarque';

export default function Chargement() {
  return (
    <View style={styles.container}>
      <EnTeteMarque />
      <ActivityIndicator size="large" color={couleurs.or} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier, alignItems: 'center', justifyContent: 'center', padding: 24 },
  spinner: { marginTop: 24 },
});
