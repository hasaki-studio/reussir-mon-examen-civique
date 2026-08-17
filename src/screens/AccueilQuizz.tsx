import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';

interface Props {
  nom: string;
  couleur: string;
  palier: number;
  palierMax: number;
  debloquees: number;
  total: number;
  premium: boolean;
  detailDebloque: boolean;
  seuilTheme: number;
  nbQuestionsExamen: number;
  seuilExamen: number;
  examensRestants: number;
  onRevision: () => void;
  onExamen: () => void;
  onDetail: () => void;
  onDebloquer: () => void;
  onRetour: () => void;
}

/**
 * Écran d'un quizz : les deux façons de travailler.
 *
 * Le mode examen est mis en avant parce que c'est l'épreuve réelle, et que s'y confronter tôt
 * est ce qui renseigne le mieux sur le chemin restant. La révision, elle, est le mode où l'on
 * apprend : correction et explication immédiates.
 */
export default function AccueilQuizz({
  nom,
  couleur,
  palier,
  palierMax,
  debloquees,
  total,
  premium,
  detailDebloque,
  seuilTheme,
  nbQuestionsExamen,
  seuilExamen,
  examensRestants,
  onRevision,
  onExamen,
  onDetail,
  onDebloquer,
  onRetour,
}: Props) {
  const insets = useSafeAreaInsets();
  const pourcentage = total ? (debloquees / total) * 100 : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contenu,
        { paddingBottom: styles.contenu.paddingBottom + insets.bottom },
      ]}
    >
      <TouchableOpacity onPress={onRetour} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
        <Text style={styles.retour}>← Choisir un autre quizz</Text>
      </TouchableOpacity>

      <View style={[styles.pastille, { backgroundColor: couleur }]} />
      <Text style={styles.titre}>{nom}</Text>

      <View style={styles.progression}>
        <View style={styles.cercleDecor} pointerEvents="none" />
        <Text style={styles.progressionLabel}>Questions débloquées / total</Text>
        <Text style={styles.progressionChiffres}>
          {debloquees} / {total}
        </Text>
        <View style={styles.barre}>
          <View style={[styles.barreFill, { width: `${pourcentage}%` }]} />
        </View>
        <Text style={styles.palierInfo}>
          {premium
            ? 'Premium actif — tout est débloqué, mises à jour incluses'
            : palier >= palierMax
            ? 'Toutes les questions sont débloquées'
            : `Palier ${palier} sur ${palierMax}`}
        </Text>
      </View>

      <TouchableOpacity style={styles.carteExamen} onPress={onExamen}>
        <Text style={styles.carteExamenTitre}>Examen blanc</Text>
        <Text style={styles.carteExamenSous}>
          {nbQuestionsExamen} questions, conditions réelles, {seuilExamen} bonnes réponses exigées
        </Text>
        <Text style={styles.carteExamenQuota}>
          {premium
            ? 'Illimité avec Premium'
            : examensRestants > 0
            ? `${examensRestants} examen${examensRestants > 1 ? 's' : ''} offert${examensRestants > 1 ? 's' : ''} aujourd'hui`
            : 'Quota du jour atteint — une publicité pour continuer'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bouton} onPress={onRevision}>
        {/* Emoji isole dans sa propre police (non graisse) : accole a une police
            semi-grasse personnalisee, l'emoji se rend en gris delave sur iOS. */}
        <Text style={styles.boutonTexte}>
          <Text style={styles.emoji}>⚡</Text> Mode révision
        </Text>
        <Text style={styles.sousTexte}>15 questions au hasard, corrigées au fur et à mesure</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bouton} onPress={onDetail}>
        <Text style={styles.boutonTexte}>
          <Text style={styles.emoji}>📚</Text> Réviser en détail
        </Text>
        <Text style={styles.sousTexte}>
          {detailDebloque
            ? 'Questions organisées par thème ou par palier'
            : `Questions organisées par thème ou par palier (à partir du palier ${seuilTheme})`}
        </Text>
      </TouchableOpacity>

      {!premium && palier < palierMax && (
        <TouchableOpacity style={styles.bouton} onPress={onDebloquer}>
          <Text style={styles.boutonTexte}>Débloquer plus de questions</Text>
          <Text style={styles.sousTexte}>
            Regarder une publicité pour débloquer le palier suivant
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  retour: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise, marginBottom: 14 },
  pastille: { width: 30, height: 4, borderRadius: 2, marginBottom: 10 },
  titre: { fontSize: 23, fontFamily: polices.titre, color: couleurs.bleuNuit, marginBottom: 18 },
  progression: { backgroundColor: couleurs.bleuNuit, borderRadius: 14, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18, marginBottom: 22, overflow: 'hidden' },
  cercleDecor: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: 'rgba(246,243,236,0.15)', top: -30, right: -30 },
  progressionLabel: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.blancCasse, opacity: 0.75 },
  progressionChiffres: { fontSize: 28, fontFamily: polices.titre, color: couleurs.blancCasse, marginTop: 2 },
  barre: { height: 6, backgroundColor: 'rgba(246,243,236,0.18)', borderRadius: 4, marginTop: 14, overflow: 'hidden' },
  barreFill: { height: '100%', backgroundColor: couleurs.or, borderRadius: 4 },
  palierInfo: { fontSize: 11.5, fontFamily: polices.texte, color: couleurs.blancCasse, opacity: 0.7, marginTop: 8 },
  carteExamen: { borderWidth: 1.5, borderColor: couleurs.bleuNuit, borderRadius: 14, padding: 18, marginBottom: 14, backgroundColor: 'rgba(28,43,73,0.04)' },
  carteExamenTitre: { fontSize: 16.5, fontFamily: polices.titre, color: couleurs.bleuNuit },
  carteExamenSous: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 5, lineHeight: 18 },
  carteExamenQuota: { fontSize: 11.5, fontFamily: polices.texteSemiGras, color: couleurs.or, marginTop: 8 },
  bouton: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 12, padding: 17, marginBottom: 12, backgroundColor: couleurs.papier },
  boutonTexte: { fontFamily: polices.texteSemiGras, fontSize: 15, color: couleurs.bleuNuit },
  emoji: { fontFamily: polices.texte },
  sousTexte: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 3 },
});
