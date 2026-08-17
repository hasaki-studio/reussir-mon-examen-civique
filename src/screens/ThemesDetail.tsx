import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';

type Mode = 'theme' | 'palier';

interface Props {
  themes: string[];
  paliers: number[];
  palierUtilisateur: number;
  premium: boolean;
  themeDebloque: boolean;
  onSelectionnerTheme: (theme: string) => void;
  onSelectionnerPalier: (palier: number) => void;
  onRetour: () => void;
}

export default function ThemesDetail({
  themes,
  paliers,
  palierUtilisateur,
  premium,
  themeDebloque,
  onSelectionnerTheme,
  onSelectionnerPalier,
  onRetour,
}: Props) {
  const [mode, setMode] = useState<Mode>(themeDebloque ? 'theme' : 'palier');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contenu}>
      <TouchableOpacity
        // Cible tactile élargie sans changer l'apparence : le texte reste petit,
        // mais la zone qui répond au toucher dépasse le cadre visible tout autour.
        onPress={onRetour}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
      >
        <Text style={styles.retour}>← Accueil</Text>
      </TouchableOpacity>
      <Text style={styles.titre}>Réviser en détail</Text>

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleOption, mode === 'theme' && styles.toggleOptionActive]}
          onPress={() => themeDebloque && setMode('theme')}
          disabled={!themeDebloque}
        >
          <Text style={[styles.toggleTexte, mode === 'theme' && styles.toggleTexteActif]}>
            Par thème
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, mode === 'palier' && styles.toggleOptionActive]}
          onPress={() => setMode('palier')}
        >
          <Text style={[styles.toggleTexte, mode === 'palier' && styles.toggleTexteActif]}>
            Par niveau
          </Text>
        </TouchableOpacity>
      </View>

      {!themeDebloque && (
        <Text style={styles.avertissement}>
          Le mode par thème se débloquera à un niveau plus avancé, ou avec Premium.
        </Text>
      )}

      {mode === 'theme' ? (
        <View style={styles.liste}>
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme}
              style={styles.carte}
              onPress={() => onSelectionnerTheme(theme)}
            >
              <Text style={styles.carteTexte}>{theme}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.liste}>
          {paliers.map((palier) => {
            const verrouille = !premium && palier > palierUtilisateur;
            return (
              <TouchableOpacity
                key={palier}
                style={[styles.carte, verrouille && styles.carteVerrouillee]}
                onPress={() => !verrouille && onSelectionnerPalier(palier)}
                disabled={verrouille}
              >
                <Text style={[styles.carteTexte, verrouille && styles.carteTexteVerrouille]}>
                  Niveau {palier}
                </Text>
                {verrouille && <Text style={styles.cadenas}>🔒</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  retour: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise, marginBottom: 12 },
  titre: { fontSize: 22, fontFamily: polices.titre, color: couleurs.bleuNuit, marginBottom: 20 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: couleurs.blancCasse,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleOption: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleOptionActive: { backgroundColor: couleurs.bleuNuit },
  toggleTexte: { fontSize: 13.5, fontFamily: polices.texteSemiGras, color: couleurs.ardoise },
  toggleTexteActif: { color: couleurs.papier },
  avertissement: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.or, marginBottom: 16 },
  liste: { gap: 12 },
  carte: {
    borderWidth: 1,
    borderColor: couleurs.ligne,
    borderRadius: 12,
    padding: 17,
    backgroundColor: couleurs.papier,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carteVerrouillee: { backgroundColor: couleurs.blancCasse },
  carteTexte: { fontSize: 15, fontFamily: polices.texteSemiGras, color: couleurs.bleuNuit },
  carteTexteVerrouille: { color: couleurs.ardoise },
  cadenas: { fontSize: 14 },
});
