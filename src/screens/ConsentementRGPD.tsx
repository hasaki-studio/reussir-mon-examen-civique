import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';

interface Props {
  onAccepter: () => void;
  onRefuser: () => void;
}

export default function ConsentementRGPD({ onAccepter, onRefuser }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contenu}>
      <View style={styles.illustration}>
        <View style={styles.drapeau}>
          <View style={[styles.bande, { backgroundColor: couleurs.bleuNuit }]} />
          <View style={[styles.bande, { backgroundColor: couleurs.blancCasse, borderWidth: 1, borderColor: couleurs.ligne }]} />
          <View style={[styles.bande, { backgroundColor: couleurs.rouge }]} />
        </View>
      </View>

      <Text style={styles.eyebrow}>Confidentialité</Text>
      <Text style={styles.titre}>Vos données, votre choix</Text>

      <Text style={styles.paragraphe}>
        Pour améliorer l'application, nous aimerions mesurer son utilisation de façon
        anonyme (par exemple : le nombre de fiches consultées, les écrans visités).
        Ces statistiques sont recueillies via Firebase Analytics (Google).
      </Text>

      <View style={styles.encart}>
        <Text style={styles.encartTexte}>
          • Application indépendante, non affiliée au ministère de l'Intérieur ni à aucune administration.{"\n"}
          • Aucune donnée identifiante (nom, e-mail, adresse) n'est collectée.{"\n"}
          • Votre progression reste stockée uniquement sur votre appareil.{"\n"}
          • Vous pouvez changer d'avis à tout moment depuis les mentions légales.
        </Text>
      </View>

      <Text style={styles.paragraphe}>
        Si vous refusez, l'application fonctionne exactement de la même manière —
        aucune statistique d'usage ne sera envoyée.
      </Text>

      <TouchableOpacity style={styles.boutonAccepter} onPress={onAccepter} activeOpacity={0.85}>
        <Text style={styles.boutonAccepterTexte}>Accepter</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.boutonRefuser} onPress={onRefuser} activeOpacity={0.85}>
        <Text style={styles.boutonRefuserTexte}>Refuser</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { padding: 24, paddingTop: 72, paddingBottom: 40 },
  illustration: { alignItems: 'center', marginBottom: 20 },
  drapeau: { flexDirection: 'row', width: 66, height: 56 },
  bande: { width: 22, height: 56 },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontFamily: polices.texteSemiGras, color: couleurs.or, marginBottom: 6 },
  titre: { fontSize: 24, fontFamily: polices.titre, color: couleurs.bleuNuit, marginBottom: 18 },
  paragraphe: { fontSize: 14, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 21, marginBottom: 16 },
  encart: { backgroundColor: 'rgba(28,43,73,0.04)', borderLeftWidth: 3, borderLeftColor: couleurs.or, borderRadius: 8, padding: 14, marginBottom: 16 },
  encartTexte: { fontSize: 13, fontFamily: polices.texte, color: couleurs.bleuNuit, lineHeight: 21 },
  boutonAccepter: { backgroundColor: couleurs.bleuNuit, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 6, marginBottom: 12 },
  boutonAccepterTexte: { color: couleurs.papier, fontFamily: polices.texteSemiGras, fontSize: 15 },
  boutonRefuser: { borderWidth: 1.5, borderColor: couleurs.bleuNuit, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  boutonRefuserTexte: { color: couleurs.bleuNuit, fontFamily: polices.texteSemiGras, fontSize: 15 },
});
