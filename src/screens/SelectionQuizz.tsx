import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';
import { MESSAGE_ACCUEIL_HORS_LIGNE } from '../config/monetisation';
import type { Quizz } from '../config/quizz';

// ⚙️ « Conseils de révision » reste tout orienté naturalisation (lot 4, pas encore fait) :
// masqué le temps de la réécriture pour les trois quizz, à repasser à true une fois prêt pour
// la soumission Play Store.
const AFFICHER_CONSEILS = false;

export type LigneQuizz = {
  cle: Quizz;
  nom: string;
  sousTitre: string;
  couleur: string;
  palier: number;
  palierMax: number;
  debloquees: number;
  total: number;
};

interface Props {
  lignes: LigneQuizz[];
  premium: boolean;
  prixPremium: string;
  achatEnCours: boolean;
  erreurAchat: string | null;
  // Vide = message d'origine sur la disponibilité hors connexion.
  messageAccueil: string;
  onChoisirQuizz: (quizz: Quizz) => void;
  onPremium: () => void;
  onConseils: () => void;
  onMentionsLegales: () => void;
  onReinitialiser: () => void;
}

/**
 * Entrée de l'application : le choix du titre de séjour concerné.
 *
 * Il précède tout le reste parce que les trois parcours ne partagent ni leur progression ni
 * l'intégralité de leur contenu — demander « lequel vous concerne ? » d'emblée évite de faire
 * réviser des questions qui ne tomberont pas.
 */
export default function SelectionQuizz({
  lignes,
  premium,
  prixPremium,
  achatEnCours,
  erreurAchat,
  messageAccueil,
  onChoisirQuizz,
  onPremium,
  onConseils,
  onMentionsLegales,
  onReinitialiser,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contenu,
        { paddingBottom: styles.contenu.paddingBottom + insets.bottom },
      ]}
    >
      <View style={styles.illustration}>
        <View style={styles.drapeau}>
          <View style={[styles.bandeDrapeau, { backgroundColor: '#1C2B49' }]} />
          <View
            style={[
              styles.bandeDrapeau,
              { backgroundColor: '#F6F3EC', borderWidth: 1, borderColor: '#DEDACD' },
            ]}
          />
          <View style={[styles.bandeDrapeau, { backgroundColor: '#A62B2B' }]} />
        </View>
      </View>
      {/* Même hiérarchie que l'application sœur : le verbe en grand et dans la teinte chaude,
          le nom du produit dessous en bleu nuit. Les deux applications se reconnaissent ainsi
          au premier coup d'œil, sans partager autre chose que leur charte. */}
      <Text style={styles.accroche}>Réussir</Text>
      <Text style={styles.titre}>Mon examen civique</Text>
      <Text style={styles.sousTitre}>Choisissez le test que vous souhaitez réussir</Text>

      {lignes.map((ligne) => {
        const pourcentage = ligne.total ? (ligne.debloquees / ligne.total) * 100 : 0;
        return (
          <TouchableOpacity
            key={ligne.cle}
            style={styles.carte}
            onPress={() => onChoisirQuizz(ligne.cle)}
          >
            {/* Badge coloré repris du prototype : le nom du quizz en capsule, dans la couleur
                du quizz, avant le titre en toutes lettres. */}
            <View style={[styles.badge, { backgroundColor: ligne.couleur }]}>
              <Text style={styles.badgeTexte}>{ligne.nom}</Text>
            </View>
            <Text style={styles.carteNom}>{ligne.nom}</Text>
            <Text style={styles.carteSousTitre}>{ligne.sousTitre}</Text>
            <View style={styles.barre}>
              <View
                style={[styles.barreFill, { width: `${pourcentage}%`, backgroundColor: ligne.couleur }]}
              />
            </View>
            <Text style={styles.carteMeta}>
              {premium
                ? `Premium actif — ${ligne.total} question${ligne.total > 1 ? 's' : ''}`
                : `Niveau ${ligne.palier}/${ligne.palierMax} · ${ligne.debloquees}/${ligne.total} question${ligne.total > 1 ? 's' : ''} débloquée${ligne.debloquees > 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        );
      })}

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

      <View style={styles.horsLigne}>
        <View style={styles.pointVert} />
        <Text style={styles.horsLigneTexte}>{messageAccueil || MESSAGE_ACCUEIL_HORS_LIGNE}</Text>
      </View>

      <View style={[styles.liensBas, !AFFICHER_CONSEILS && styles.liensBasSeul]}>
        {AFFICHER_CONSEILS && (
          <TouchableOpacity onPress={onConseils}>
            <Text style={styles.lien}>Conseils de révision</Text>
          </TouchableOpacity>
        )}
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
  accroche: { fontSize: 34, lineHeight: 40, fontFamily: polices.titreGras, color: couleurs.or },
  titre: { fontSize: 25, lineHeight: 31, fontFamily: polices.titreGras, color: couleurs.bleuNuit },
  sousTitre: { fontSize: 14, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 6, marginBottom: 18 },
  carte: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 14, padding: 18, marginBottom: 14, backgroundColor: couleurs.papier },
  badge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 20, marginBottom: 10 },
  badgeTexte: { fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: couleurs.papier, fontFamily: polices.texteSemiGras },
  carteNom: { fontSize: 17, fontFamily: polices.titre, color: couleurs.bleuNuit },
  carteSousTitre: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 4 },
  barre: { height: 5, backgroundColor: couleurs.ligne, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  barreFill: { height: '100%', borderRadius: 4 },
  carteMeta: { fontSize: 12, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 7 },
  bouton: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 12, padding: 17, marginBottom: 12, marginTop: 4, backgroundColor: couleurs.papier },
  boutonDesactive: { opacity: 0.6 },
  boutonTexte: { fontFamily: polices.texteSemiGras, fontSize: 15, color: couleurs.bleuNuit },
  sousTexte: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 3 },
  erreurAchat: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.rouge, marginTop: -4, marginBottom: 12, lineHeight: 18 },
  horsLigne: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pointVert: { width: 6, height: 6, borderRadius: 3, backgroundColor: couleurs.ok, marginRight: 5 },
  horsLigneTexte: { fontSize: 11, color: couleurs.ok, fontFamily: polices.texteSemiGras },
  liensBas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  liensBasSeul: { justifyContent: 'flex-end' },
  lien: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.ardoise, textDecorationLine: 'underline' },
  lienReset: { marginTop: 8 },
  lienResetTexte: { fontSize: 12, fontFamily: polices.texte, color: couleurs.rouge, textDecorationLine: 'underline', textAlign: 'center' },
});
