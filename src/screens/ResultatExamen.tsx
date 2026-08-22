import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';
import { Question } from '../../services/firebase';

export type QuestionRatee = { question: Question; choisi: number };

interface Props {
  score: number;
  total: number;
  seuil: number;
  reussi: boolean;
  ratees: QuestionRatee[];
  /**
   * Vrai tant que le résultat n'a pas été dévoilé (publicité avec récompense non encore
   * regardée). Le score reste calculé et enregistré dans tous les cas — seul son affichage
   * attend le geste. Toujours faux en Premium : `onDevoiler` n'est alors jamais appelé.
   */
  verrouille: boolean;
  onDevoiler: () => void;
  onRecommencer: () => void;
  onRetour: () => void;
}

export default function ResultatExamen({
  score,
  total,
  seuil,
  reussi,
  ratees,
  verrouille,
  onDevoiler,
  onRecommencer,
  onRetour,
}: Props) {
  const pourcentage = total === 0 ? 0 : Math.round((score / total) * 100);

  if (verrouille) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contenu}>
        <TouchableOpacity onPress={onRetour} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Examen terminé</Text>

        <View style={styles.verrou}>
          <Text style={styles.verrouEmoji}>🔒</Text>
          <Text style={styles.verrouTexte}>
            Votre résultat est prêt. Regardez une courte publicité pour le découvrir, avec le
            détail de vos erreurs.
          </Text>
        </View>

        <TouchableOpacity style={styles.boutonPrincipal} onPress={onDevoiler}>
          <Text style={styles.boutonPrincipalTexte}>Voir mon résultat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.boutonSecondaire} onPress={onRetour}>
          <Text style={styles.boutonSecondaireTexte}>Revenir au quizz</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contenu}>
      <TouchableOpacity onPress={onRetour} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
        <Text style={styles.retour}>← Retour</Text>
      </TouchableOpacity>
      <Text style={styles.titre}>Résultat de l'examen</Text>

      <View style={[styles.badge, reussi ? styles.badgeReussi : styles.badgeEchoue]}>
        <Text style={[styles.score, reussi ? styles.texteReussi : styles.texteEchoue]}>
          {score}/{total}
        </Text>
        <Text style={styles.pourcentage}>{pourcentage} % de bonnes réponses</Text>
        <Text style={[styles.verdict, reussi ? styles.texteReussi : styles.texteEchoue]}>
          {reussi
            ? `Réussi — ${seuil} bonnes réponses exigées`
            : `Non atteint — ${seuil} bonnes réponses exigées`}
        </Text>
      </View>

      {/* La revue des erreurs est le véritable contenu de cet écran : le score seul n'apprend
          rien. Chaque question ratée est reprise avec sa bonne réponse et son explication. */}
      {ratees.length === 0 ? (
        <Text style={styles.aucuneErreur}>Aucune erreur. Rien à revoir.</Text>
      ) : (
        <>
          <Text style={styles.sousTitreListe}>
            {ratees.length} question{ratees.length > 1 ? 's' : ''} à revoir
          </Text>
          {ratees.map(({ question, choisi }) => (
            <View key={question.id} style={styles.carteRatee}>
              <Text style={styles.rateeTheme}>{question.theme}</Text>
              <Text style={styles.rateeQuestion}>{question.question}</Text>
              <Text style={styles.rateeVotre}>Votre réponse : {question.choix[choisi]}</Text>
              <Text style={styles.rateeBonne}>Bonne réponse : {question.choix[question.bonne]}</Text>
              <Text style={styles.rateeExplication}>{question.explication}</Text>
            </View>
          ))}
        </>
      )}

      <TouchableOpacity style={styles.boutonPrincipal} onPress={onRecommencer}>
        <Text style={styles.boutonPrincipalTexte}>Refaire un examen blanc</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.boutonSecondaire} onPress={onRetour}>
        <Text style={styles.boutonSecondaireTexte}>Revenir au quizz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  retour: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise, marginBottom: 12 },
  titre: { fontSize: 22, fontFamily: polices.titre, color: couleurs.bleuNuit, marginBottom: 20 },
  verrou: { alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: couleurs.ligne, backgroundColor: couleurs.blancCasse, paddingVertical: 34, paddingHorizontal: 24, marginBottom: 24 },
  verrouEmoji: { fontSize: 32, marginBottom: 14 },
  verrouTexte: { fontSize: 14, fontFamily: polices.texte, color: couleurs.ardoise, textAlign: 'center', lineHeight: 20 },
  badge: { alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingVertical: 30, paddingHorizontal: 20, marginBottom: 24 },
  badgeReussi: { backgroundColor: 'rgba(62,107,79,0.08)', borderColor: couleurs.ok },
  badgeEchoue: { backgroundColor: 'rgba(166,43,43,0.06)', borderColor: couleurs.rouge },
  score: { fontSize: 40, fontFamily: polices.titreGras },
  texteReussi: { color: couleurs.ok },
  texteEchoue: { color: couleurs.rouge },
  pourcentage: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 4 },
  verdict: { fontSize: 15, fontFamily: polices.texteGras, marginTop: 10, textAlign: 'center' },
  aucuneErreur: { fontSize: 13.5, fontFamily: polices.texte, color: couleurs.ardoise, textAlign: 'center', marginBottom: 20 },
  sousTitreListe: { fontSize: 13, fontFamily: polices.texteSemiGras, color: couleurs.ardoise, marginBottom: 12 },
  carteRatee: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 12, padding: 15, marginBottom: 10 },
  rateeTheme: { fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: couleurs.or, fontFamily: polices.texteSemiGras, marginBottom: 6 },
  rateeQuestion: { fontSize: 14.5, fontFamily: polices.texteSemiGras, color: couleurs.bleuNuit, lineHeight: 20, marginBottom: 8 },
  rateeVotre: { fontSize: 13, fontFamily: polices.texte, color: couleurs.rouge, marginBottom: 2 },
  rateeBonne: { fontSize: 13, fontFamily: polices.texteSemiGras, color: couleurs.ok },
  rateeExplication: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 19, marginTop: 8 },
  boutonPrincipal: { backgroundColor: couleurs.bleuNuit, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  boutonPrincipalTexte: { fontSize: 14.5, fontFamily: polices.texteGras, color: couleurs.papier },
  boutonSecondaire: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  boutonSecondaireTexte: { fontSize: 14, fontFamily: polices.texteSemiGras, color: couleurs.bleuNuit },
});
