import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd } from 'react-native-google-mobile-ads';
import { useRouter } from 'expo-router';
import { usePublicites } from '../state/PublicitesContext';
import { UNITE_PUB_BANNIERE, TAILLE_BANNIERE } from '../services/ads';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';

interface Props {
  // true pour un utilisateur premium : aucune publicité à afficher.
  masque?: boolean;
}

export default function BandeauPublicitaire({ masque }: Props) {
  const router = useRouter();
  const { publicitesAutorisees } = usePublicites();
  const insets = useSafeAreaInsets();

  if (masque || !publicitesAutorisees) return null;

  return (
    // Ajoutée à paddingBottom, pas substituée : en navigation par gestes, insets.bottom
    // vaut une valeur faible et l'espacement du design d'origine reste dominant.
    <View style={[styles.zone, { paddingBottom: styles.zone.paddingBottom + insets.bottom }]}>
      <View style={styles.entete}>
        <Text style={styles.label}>Publicité</Text>
        {/* Reprend le principe observé chez Citymapper : la pub sert aussi de rappel
            "vous pouvez la retirer" — chaque bandeau est soit un revenu, soit une conversion. */}
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={styles.lienPremium}>Sans pub · Premium</Text>
        </TouchableOpacity>
      </View>
      {/* Largeur fixe (320 dp) : on centre pour éviter un bandeau collé à gauche
          sur les écrans plus larges. */}
      <View style={styles.annonce}>
        <BannerAd unitId={UNITE_PUB_BANNIERE} size={TAILLE_BANNIERE} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    borderTopWidth: 1,
    borderTopColor: couleurs.ligne,
    paddingTop: 6,
    paddingBottom: 4,
    backgroundColor: couleurs.papier,
  },
  entete: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 3,
  },
  annonce: { alignItems: 'center' },
  label: {
    fontSize: 10,
    fontFamily: polices.texte,
    color: couleurs.ardoise,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lienPremium: {
    fontSize: 11.5,
    fontFamily: polices.texteSemiGras,
    color: couleurs.bleuNuit,
    textDecorationLine: 'underline',
  },
});
