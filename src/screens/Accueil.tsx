import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';
import { MESSAGE_ACCUEIL_HORS_LIGNE } from '../config/monetisation';

interface Props {
  fichesDebloquees: number;
  fichesTotal: number;
  palier: number;
  palierMax: number;
  seuilTheme: number;
  themeDebloque: boolean;
  premium: boolean;
  prixPremium: string;
  achatEnCours: boolean;
  erreurAchat: string | null;
  // Vide = message d'origine sur la disponibilité hors connexion.
  messageAccueil: string;
  onCommencer: () => void;
  onReviserDetail: () => void;
  onDebloquer: () => void;
  onPremium: () => void;
  onConseils: () => void;
  onMentionsLegales: () => void;
  onReinitialiser: () => void;
}

export default function Accueil({
  fichesDebloquees,
  fichesTotal,
  palier,
  palierMax,
  seuilTheme,
  themeDebloque,
  premium,
  prixPremium,
  achatEnCours,
  erreurAchat,
  messageAccueil,
  onCommencer,
  onReviserDetail,
  onDebloquer,
  onPremium,
  onConseils,
  onMentionsLegales,
  onReinitialiser,
}: Props) {
  const pct = fichesTotal ? (fichesDebloquees / fichesTotal) * 100 : 0;
  const insets = useSafeAreaInsets();

  return (
    // Ajoutée à paddingBottom, pas substituée : sur un appareil sans barre système,
    // insets.bottom vaut 0 et l'espacement du design d'origine reste inchangé. Seul cet
    // écran manquait ce traitement — le bandeau publicitaire et la modale de publicité
    // l'ont déjà, cet oubli laissait les liens "Conseils de révision" / "Mentions légales"
    // exposés à la barre de navigation Android à 3 boutons.
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contenu, { paddingBottom: styles.contenu.paddingBottom + insets.bottom }]}
    >
      <View style={styles.illustration}>
  <View style={styles.drapeau}>
    <View style={[styles.bandeDrapeau, { backgroundColor: '#1C2B49' }]} />
    <View style={[styles.bandeDrapeau, { backgroundColor: '#F6F3EC', borderWidth: 1, borderColor: '#DEDACD' }]} />
    <View style={[styles.bandeDrapeau, { backgroundColor: '#A62B2B' }]} />
  </View>
</View>
      <Text style={styles.eyebrow}>Préparation à l'entretien</Text>
      <Text style={styles.titre}>Réussir mon entretien</Text>
      <Text style={styles.sousTitre}>Réviser par fiches, à votre rythme</Text>

      <View style={styles.progression}>
        <View style={styles.cercleDecor} pointerEvents="none" />
        <Text style={styles.progressionLabel}>Fiches disponibles / total à débloquer</Text>
        <Text style={styles.progressionFiches}>{fichesDebloquees} / {fichesTotal}</Text>
        <View style={styles.barre}>
          <View style={[styles.barreFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.palierInfo}>
          {premium
            ? 'Premium actif — tout est débloqué, mises à jour incluses'
            : palier >= palierMax
            ? 'Toutes les fiches sont débloquées'
            : `Niveau ${palier} sur ${palierMax}`}
        </Text>
      </View>

      <TouchableOpacity style={styles.bouton} onPress={onCommencer}>
        {/* Emoji isole dans sa propre police (non graisse) : accole a une police
            semi-grasse personnalisee, l'emoji se rend en gris delave sur iOS. */}
        <Text style={styles.boutonTexte}><Text style={styles.emoji}>⚡</Text> Révision Express</Text>
        <Text style={styles.sousTexte}>Session de 15 fiches aléatoires</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bouton} onPress={onReviserDetail}>
        <Text style={styles.boutonTexte}><Text style={styles.emoji}>📚</Text> Révision en détail</Text>
        <Text style={styles.sousTexte}>
          {themeDebloque
            ? 'Fiches organisées par niveau ou par thème'
            : `Fiches organisées par niveau ou par thème (à partir du niveau ${seuilTheme})`}
        </Text>
      </TouchableOpacity>

      {!premium && palier < palierMax && (
        <TouchableOpacity style={styles.bouton} onPress={onDebloquer}>
          <Text style={styles.boutonTexte}>Débloquer plus de fiches de révision</Text>
          <Text style={styles.sousTexte}>Regarder une publicité pour débloquer un niveau supplémentaire</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.bouton, (premium || achatEnCours) && styles.boutonDesactive]}
        onPress={onPremium}
        disabled={premium || achatEnCours}
      >
        <Text style={styles.boutonTexte}>Passer en Premium</Text>
        <Text style={styles.sousTexte}>
          {premium
            ? 'Merci pour votre soutien'
            : achatEnCours
            ? 'Achat en cours…'
            : `${prixPremium} · déblocage définitif, mises à jour incluses`}
        </Text>
      </TouchableOpacity>

      {!premium && erreurAchat && (
        <Text style={styles.erreurAchat}>{erreurAchat}</Text>
      )}

      <View style={styles.horsLigne}>
        <View style={styles.pointVert} />
        <Text style={styles.horsLigneTexte}>{messageAccueil || MESSAGE_ACCUEIL_HORS_LIGNE}</Text>
      </View>

      <View style={styles.liensBas}>
        <TouchableOpacity onPress={onConseils}>
          <Text style={styles.lien}>Conseils de révision</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onMentionsLegales}>
          <Text style={styles.lien}>Mentions légales</Text>
        </TouchableOpacity>
      </View>

      {__DEV__ && (
        <TouchableOpacity onPress={onReinitialiser} style={styles.lienReset}>
          <Text style={styles.lienResetTexte}>Réinitialiser (test)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  illustration: { alignItems: 'center', marginBottom: 18 },
drapeau: { flexDirection: 'row', width: 66, height: 56 },
bandeDrapeau: { width: 22, height: 56 },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: couleurs.or, fontFamily: polices.texteSemiGras, marginBottom: 6 },
  titre: { fontSize: 26, fontFamily: polices.titre, color: couleurs.bleuNuit },
  sousTitre: { fontSize: 14, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 6, marginBottom: 18 },
  progression: { backgroundColor: couleurs.bleuNuit, borderRadius: 14, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18, marginBottom: 22, overflow: 'hidden' },
  cercleDecor: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(246,243,236,0.15)',
    top: -30,
    right: -30,
  },
  progressionLabel: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.blancCasse, opacity: 0.75 },
  progressionFiches: { fontSize: 28, fontFamily: polices.titre, color: couleurs.blancCasse, marginTop: 2 },
  barre: { height: 6, backgroundColor: 'rgba(246,243,236,0.18)', borderRadius: 4, marginTop: 14, overflow: 'hidden' },
  barreFill: { height: '100%', backgroundColor: couleurs.or, borderRadius: 4 },
  palierInfo: { fontSize: 11.5, fontFamily: polices.texte, color: couleurs.blancCasse, opacity: 0.7, marginTop: 8 },
  bouton:{ borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 12, padding: 17, marginBottom: 12, backgroundColor: couleurs.papier },
  boutonDesactive: { opacity: 0.6 },
  boutonTexte: { fontFamily: polices.texteSemiGras, fontSize: 15, color: couleurs.bleuNuit },
  emoji: { fontFamily: polices.texte },
  sousTexte: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 3 },
  erreurAchat: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.rouge, marginTop: -4, marginBottom: 12, lineHeight: 18 },
  horsLigne: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pointVert: { width: 6, height: 6, borderRadius: 3, backgroundColor: couleurs.ok, marginRight: 5 },
  horsLigneTexte: { fontSize: 11, color: couleurs.ok, fontFamily: polices.texteSemiGras },
  liensBas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  lien: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.ardoise, textDecorationLine: 'underline' },
  lienReset: { marginTop: 8 },
  lienResetTexte: { fontSize: 12, fontFamily: polices.texte, color: couleurs.rouge, textDecorationLine: 'underline', textAlign: 'center' },
});