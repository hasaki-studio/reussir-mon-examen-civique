import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { couleurs, couleurTheme } from '../theme/colors';
import { polices } from '../theme/typographie';
import { Question } from '../../services/firebase';
import type { ReponseDonnee } from '../state/QuizContext';
import BandeauPublicitaire from '../components/BandeauPublicitaire';

interface Props {
  question: Question;
  modeLabel: string;
  numero: number;
  total: number;
  /**
   * Révision : la correction et l'explication s'affichent dès la réponse.
   * Examen : rien n'est révélé avant l'écran de résultat — c'est ce qui en fait un examen.
   */
  correctionImmediate: boolean;
  reponse: ReponseDonnee | undefined;
  masquerPublicite: boolean;
  estDerniere: boolean;
  /** Faux en examen, et sur la première question. */
  peutPrecedent: boolean;
  onRepondre: (choisi: number) => void;
  onSuivant: () => void;
  onPrecedent: () => void;
  onQuitter: () => void;
}

export default function EcranQuestion({
  question,
  modeLabel,
  numero,
  total,
  correctionImmediate,
  reponse,
  masquerPublicite,
  estDerniere,
  peutPrecedent,
  onRepondre,
  onSuivant,
  onPrecedent,
  onQuitter,
}: Props) {
  const couleur = couleurTheme(question.theme);
  const repondu = reponse !== undefined;
  const correction = repondu && correctionImmediate;

  // En révision, la correction s'affiche dès la réponse : le premier appui reste donc immédiat,
  // comme le geste de « dévoiler » une fiche — rien à sélectionner avant.
  // En examen, rien ne s'affiche avant l'écran de résultat : l'appui ne fait que sélectionner,
  // modifiable en touchant une autre proposition, et c'est « Question suivante » qui valide ce
  // choix en même temps qu'il avance. Remis à zéro à chaque nouvelle question.
  const [selection, setSelection] = useState<number | null>(null);
  useEffect(() => {
    setSelection(null);
  }, [question.id]);

  const peutAvancer = correctionImmediate ? repondu : selection !== null;

  const choisir = (index: number) => {
    if (repondu) return;
    if (correctionImmediate) onRepondre(index);
    else setSelection(index);
  };

  const avancer = () => {
    if (!correctionImmediate && selection !== null && !repondu) onRepondre(selection);
    onSuivant();
  };

  const styleChoix = (index: number) => {
    if (!repondu) {
      if (correctionImmediate) return null;
      return index === selection ? styles.choixSelectionne : null;
    }
    if (!correction) return index === reponse.choisi ? styles.choixSelectionne : null;
    if (index === question.bonne) return styles.choixCorrect;
    if (index === reponse.choisi) return styles.choixIncorrect;
    return null;
  };

  const styleChoixTexte = (index: number) => {
    if (!correction) return null;
    if (index === question.bonne) return styles.choixTexteCorrect;
    if (index === reponse.choisi) return styles.choixTexteIncorrect;
    return null;
  };

  return (
    <View style={styles.pageAvecBandeau}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contenu}>
        <View style={styles.barreNav}>
          <TouchableOpacity
            // Cible tactile élargie sans changer l'apparence : le texte reste petit,
            // mais la zone qui répond au toucher dépasse le cadre visible tout autour.
            onPress={onQuitter}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Text style={styles.retour}>← Quitter</Text>
          </TouchableOpacity>
          {/* Le thème n'est pas annoncé en examen : l'examen réel ne le fait pas, et le
              connaître d'avance oriente la réponse. */}
          {correctionImmediate && (
            <View style={[styles.themeBadge, { backgroundColor: couleur }]}>
              <Text style={styles.themeBadgeTexte}>{question.theme}</Text>
            </View>
          )}
        </View>

        <View style={styles.barreProgression}>
          <View style={[styles.barreProgressionFill, { width: `${(numero / total) * 100}%` }]} />
        </View>

        <View style={[styles.carte, { borderLeftColor: couleur }]}>
          <Text style={styles.modeTag}>{modeLabel}</Text>
          <Text style={styles.position}>
            Question {numero} / {total}
          </Text>
          <Text style={styles.questionTexte}>{question.question}</Text>

          {question.choix.map((choix, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.choix, styleChoix(index)]}
              onPress={() => choisir(index)}
              disabled={repondu}
            >
              <Text style={[styles.choixTexte, styleChoixTexte(index)]}>{choix}</Text>
            </TouchableOpacity>
          ))}

          {correction && (
            <View style={styles.explication}>
              <Text style={styles.explicationTexte}>{question.explication}</Text>
            </View>
          )}
        </View>

        <View style={styles.navigation}>
          {peutPrecedent && (
            <TouchableOpacity style={styles.boutonPrecedent} onPress={onPrecedent}>
              <Text style={styles.boutonPrecedentTexte}>← Précédente</Text>
            </TouchableOpacity>
          )}
          {/* Toujours affiché, grisé tant qu'on ne peut pas avancer : un bouton entièrement
              absent se lit comme une erreur, surtout en entrant directement sur une question
              via la liste détaillée. Le blocage reste réel — `disabled` — ce qui change n'est
              que sa visibilité. En révision, avancer suppose d'avoir répondu (la correction
              vient de s'afficher) ; en examen, suppose d'avoir sélectionné une proposition —
              c'est cet appui qui la valide et fait avancer dans le même geste. */}
          <TouchableOpacity
            style={[styles.boutonSuivant, !peutAvancer && styles.boutonSuivantDesactive]}
            onPress={avancer}
            disabled={!peutAvancer}
          >
            <Text
              style={[styles.boutonSuivantTexte, !peutAvancer && styles.boutonSuivantTexteDesactive]}
            >
              {estDerniere
                ? correctionImmediate
                  ? 'Terminer la révision'
                  : 'Voir mon résultat'
                : 'Question suivante →'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BandeauPublicitaire masque={masquerPublicite} />
    </View>
  );
}

const styles = StyleSheet.create({
  pageAvecBandeau: { flex: 1, backgroundColor: couleurs.papier },
  container: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  barreNav: { flexDirection: 'column', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  retour: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise },
  themeBadge: { alignSelf: 'flex-start', maxWidth: '100%', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20 },
  themeBadgeTexte: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: couleurs.papier, fontFamily: polices.texteSemiGras },
  barreProgression: { height: 5, backgroundColor: couleurs.ligne, borderRadius: 4, overflow: 'hidden', marginBottom: 18 },
  barreProgressionFill: { height: '100%', backgroundColor: couleurs.bleuNuit, borderRadius: 4 },
  carte: { backgroundColor: couleurs.papier, borderWidth: 1, borderColor: couleurs.ligne, borderLeftWidth: 5, borderRadius: 16, padding: 22 },
  modeTag: { fontSize: 11, fontFamily: polices.texte, color: couleurs.ardoise, letterSpacing: 0.4, opacity: 0.8, marginBottom: 6 },
  position: { fontSize: 12, color: couleurs.or, fontFamily: polices.texteSemiGras, letterSpacing: 0.3, marginBottom: 10 },
  questionTexte: { fontSize: 20, fontFamily: polices.titre, color: couleurs.bleuNuit, lineHeight: 27, marginBottom: 18 },
  choix: { borderWidth: 1.5, borderColor: couleurs.ligne, borderRadius: 11, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10, backgroundColor: couleurs.papier },
  choixSelectionne: { borderColor: couleurs.bleuNuit, backgroundColor: 'rgba(28,43,73,0.05)' },
  choixCorrect: { borderColor: couleurs.ok, backgroundColor: 'rgba(62,107,79,0.10)' },
  choixIncorrect: { borderColor: couleurs.rouge, backgroundColor: 'rgba(166,43,43,0.08)' },
  choixTexte: { fontSize: 14.5, fontFamily: polices.texte, color: couleurs.bleuNuit, lineHeight: 20 },
  choixTexteCorrect: { color: couleurs.ok, fontFamily: polices.texteSemiGras },
  choixTexteIncorrect: { color: couleurs.rouge, fontFamily: polices.texteSemiGras },
  explication: { backgroundColor: 'rgba(28,43,73,0.04)', borderLeftWidth: 3, borderLeftColor: couleurs.or, borderRadius: 8, padding: 14, marginTop: 8 },
  explicationTexte: { fontSize: 13.5, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 20 },
  navigation: { flexDirection: 'row', gap: 10, marginTop: 18 },
  boutonPrecedent: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 10, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center', backgroundColor: couleurs.papier },
  boutonPrecedentTexte: { fontSize: 13.5, fontFamily: polices.texteSemiGras, color: couleurs.bleuNuit },
  boutonSuivant: { flex: 1, backgroundColor: couleurs.bleuNuit, borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  boutonSuivantDesactive: { backgroundColor: couleurs.ligne },
  boutonSuivantTexte: { fontSize: 14.5, fontFamily: polices.texteGras, color: couleurs.papier, letterSpacing: 0.3 },
  boutonSuivantTexteDesactive: { color: couleurs.ardoise },
});
