import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { couleurs, couleurTheme } from '../theme/colors';
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
   * Ce qui reste masqué tant que la publicité n'a pas été regardée :
   * - `rien`  : tout est visible (Premium, pub déjà vue, ou clé Remote Config à « aucun ») ;
   * - `revue` : le score et le verdict s'affichent, la revue des erreurs attend ;
   * - `tout`  : rien n'est visible, score compris.
   *
   * Le score est calculé et enregistré dans l'historique dans tous les cas : seul son affichage
   * dépend de cette valeur.
   */
  masque: 'rien' | 'revue' | 'tout';
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
  masque,
  onDevoiler,
  onRecommencer,
  onRetour,
}: Props) {
  const pourcentage = total === 0 ? 0 : Math.round((score / total) * 100);

  // Aperçu gratuit de la revue verrouillée : la répartition, jamais le contenu (ni la bonne
  // réponse, ni l'explication). De quoi donner envie de regarder la publicité sans vider son
  // intérêt — contrairement à la bonne réponse elle-même, qui reste le vrai motif d'y aller.
  const repartitionTheme = useMemo(() => {
    const compte = new Map<string, number>();
    for (const { question } of ratees) compte.set(question.theme, (compte.get(question.theme) ?? 0) + 1);
    return [...compte.entries()].sort((a, b) => b[1] - a[1]);
  }, [ratees]);
  const nbSituations = useMemo(
    () => ratees.filter(({ question }) => question.type === 'situation').length,
    [ratees]
  );

  if (masque === 'tout') {
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
          <Text style={styles.boutonSecondaireTexte}>Retour au menu de révision</Text>
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
          rien. Chaque question ratée est reprise avec sa bonne réponse et son explication.
          C'est donc elle, et non le score, qui se monnaie : la note appartient à l'utilisateur
          qui vient de la produire, l'explication de ses erreurs est un ajout. */}
      {ratees.length === 0 ? (
        <Text style={styles.aucuneErreur}>Aucune erreur. Rien à revoir.</Text>
      ) : masque === 'revue' ? (
        <View style={styles.verrou}>
          <Text style={styles.verrouEmoji}>🔒</Text>
          <Text style={styles.verrouTexte}>
            {ratees.length} question{ratees.length > 1 ? 's' : ''} à revoir. Regardez une courte
            publicité pour voir, pour chacune, la bonne réponse et son explication.
          </Text>

          <View style={styles.repartition}>
            {repartitionTheme.map(([theme, nb]) => (
              <View key={theme} style={styles.repartitionLigne}>
                <View style={[styles.repartitionPuce, { backgroundColor: couleurTheme(theme) }]} />
                <Text style={styles.repartitionTheme} numberOfLines={1}>
                  {theme}
                </Text>
                <Text style={styles.repartitionNb}>{nb}</Text>
              </View>
            ))}
            {nbSituations > 0 && (
              <Text style={styles.repartitionSituations}>
                dont {nbSituations} mise{nbSituations > 1 ? 's' : ''} en situation
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.boutonVerrou} onPress={onDevoiler}>
            <Text style={styles.boutonPrincipalTexte}>Revoir mes erreurs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.sousTitreListe}>
            {ratees.length} question{ratees.length > 1 ? 's' : ''} à revoir
          </Text>
          {ratees.map(({ question, choisi }) => (
            <View key={question.id} style={styles.carteRatee}>
              <View style={styles.rateeEntete}>
                <Text style={styles.rateeTheme}>{question.theme}</Text>
                {question.type === 'situation' && (
                  <View style={styles.tagSituation}>
                    <Text style={styles.tagSituationTexte}>Mise en situation</Text>
                  </View>
                )}
              </View>
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
        <Text style={styles.boutonSecondaireTexte}>Retour au menu de révision</Text>
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
  boutonVerrou: { backgroundColor: couleurs.bleuNuit, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', marginTop: 18 },
  repartition: { alignSelf: 'stretch', marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: couleurs.ligne },
  repartitionLigne: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  repartitionPuce: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  repartitionTheme: { flex: 1, fontSize: 12.5, fontFamily: polices.texte, color: couleurs.bleuNuit },
  repartitionNb: { fontSize: 12.5, fontFamily: polices.texteSemiGras, color: couleurs.ardoise, marginLeft: 8 },
  repartitionSituations: { fontSize: 11.5, fontFamily: polices.texte, color: couleurs.ardoise, fontStyle: 'italic', marginTop: 4 },
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
  rateeEntete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  rateeTheme: { flexShrink: 1, fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: couleurs.or, fontFamily: polices.texteSemiGras },
  tagSituation: { flexShrink: 0, borderWidth: 1, borderColor: couleurs.ardoise, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8, marginLeft: 8 },
  tagSituationTexte: { fontSize: 9.5, letterSpacing: 0.3, textTransform: 'uppercase', color: couleurs.ardoise, fontFamily: polices.texteSemiGras },
  rateeQuestion: { fontSize: 14.5, fontFamily: polices.texteSemiGras, color: couleurs.bleuNuit, lineHeight: 20, marginBottom: 8 },
  rateeVotre: { fontSize: 13, fontFamily: polices.texte, color: couleurs.rouge, marginBottom: 2 },
  rateeBonne: { fontSize: 13, fontFamily: polices.texteSemiGras, color: couleurs.ok },
  rateeExplication: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 19, marginTop: 8 },
  boutonPrincipal: { backgroundColor: couleurs.bleuNuit, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  boutonPrincipalTexte: { fontSize: 14.5, fontFamily: polices.texteGras, color: couleurs.papier },
  boutonSecondaire: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  boutonSecondaireTexte: { fontSize: 14, fontFamily: polices.texteSemiGras, color: couleurs.bleuNuit },
});
