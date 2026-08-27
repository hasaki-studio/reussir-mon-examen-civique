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
  prixPremium: string;
  achatEnCours: boolean;
  erreurAchat: string | null;
  nbQuestionsExamen: number;
  nbSituationsExamen: number;
  seuilExamen: number;
  examensRestants: number;
  onRevision: () => void;
  onExamen: () => void;
  onDetail: () => void;
  onDebloquer: () => void;
  onPremium: () => void;
  onConseils: () => void;
  onMentionsLegales: () => void;
  onRetour: () => void;
}

/**
 * Écran d'un quizz : les deux façons de travailler.
 *
 * Le mode examen est mis en avant parce que c'est l'épreuve réelle, et que s'y confronter tôt
 * est ce qui renseigne le mieux sur le chemin restant. La révision, elle, est le mode où l'on
 * apprend : correction et explication immédiates.
 *
 * Porte aussi l'offre Premium et les liens de bas de page. Ils vivaient sur le menu de
 * sélection, que l'application ne traverse plus à chaque lancement depuis qu'elle retient le
 * dernier quizz ouvert : les y laisser les aurait rendus invisibles aux habitués — soit
 * exactement ceux qui achètent. Le Premium y gagne d'ailleurs son contexte, affiché sous la
 * barre de progression et à côté du déblocage par publicité, les deux façons d'avancer.
 */
export default function AccueilQuizz({
  nom,
  couleur,
  palier,
  palierMax,
  debloquees,
  total,
  premium,
  prixPremium,
  achatEnCours,
  erreurAchat,
  nbQuestionsExamen,
  nbSituationsExamen,
  seuilExamen,
  examensRestants,
  onRevision,
  onExamen,
  onDetail,
  onDebloquer,
  onPremium,
  onConseils,
  onMentionsLegales,
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
        <Text style={styles.retour}>← Revenir au menu de sélection des examens</Text>
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
            : `Niveau ${palier} sur ${palierMax}`}
        </Text>
      </View>

      <TouchableOpacity style={styles.carteExamen} onPress={onExamen}>
        <Text style={styles.carteExamenTitre}>
          <Text style={styles.emoji}>📝</Text> Examen blanc
        </Text>
        <Text style={styles.carteExamenSous}>
          {nbQuestionsExamen} questions dont {nbSituationsExamen} mise
          {nbSituationsExamen > 1 ? 's' : ''} en situation, conditions réelles, {seuilExamen}{' '}
          bonnes réponses exigées
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
          <Text style={styles.emoji}>⚡</Text> Révision express
        </Text>
        <Text style={styles.sousTexte}>15 questions au hasard, corrigées au fur et à mesure</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bouton} onPress={onDetail}>
        <Text style={styles.boutonTexte}>
          <Text style={styles.emoji}>📚</Text> Réviser en détail
        </Text>
        <Text style={styles.sousTexte}>Questions organisées par thème ou par niveau</Text>
      </TouchableOpacity>

      {!premium && palier < palierMax && (
        <TouchableOpacity style={styles.bouton} onPress={onDebloquer}>
          <Text style={styles.boutonTexte}>Débloquer plus de questions</Text>
          <Text style={styles.sousTexte}>
            Regarder une publicité pour débloquer le niveau suivant
          </Text>
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
            ? 'Merci pour votre soutien — les trois quizz sont débloqués'
            : achatEnCours
            ? 'Achat en cours…'
            : `${prixPremium} · débloque les trois quizz, définitivement`}
        </Text>
      </TouchableOpacity>

      {!premium && erreurAchat && <Text style={styles.erreurAchat}>{erreurAchat}</Text>}

      <View style={styles.liensBas}>
        <TouchableOpacity onPress={onConseils}>
          <Text style={styles.lien}>Conseils de révision</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onMentionsLegales}>
          <Text style={styles.lien}>Mentions légales</Text>
        </TouchableOpacity>
      </View>
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
  boutonDesactive: { opacity: 0.6 },
  erreurAchat: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.rouge, marginTop: -4, marginBottom: 12, lineHeight: 18 },
  liensBas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  lien: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.ardoise, textDecorationLine: 'underline' },
});
