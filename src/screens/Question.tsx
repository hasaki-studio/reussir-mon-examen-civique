import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { couleurs, couleurTheme } from '../theme/colors';
import { polices } from '../theme/typographie';
import { Question } from '../../services/firebase';
import { logBulleInfoOuverte, logReponseReveillee } from '../services/analytics';
import BandeauPublicitaire from '../components/BandeauPublicitaire';

interface Props {
  question: Question;
  modeLabel: string;
  positionLabel: string;
  bonusDebloque: boolean;
  bonusOffert: boolean;
  masquerPublicite: boolean;
  peutPrecedent: boolean;
  peutSuivant: boolean;
  labelSuivant: string;
  onPrecedent: () => void;
  onSuivant: () => void;
  onDebloquerBonus: () => void;
  onRetour: () => void;
}

export default function EcranQuestion({
  question,
  modeLabel,
  positionLabel,
  bonusDebloque,
  bonusOffert,
  masquerPublicite,
  peutPrecedent,
  peutSuivant,
  labelSuivant,
  onPrecedent,
  onSuivant,
  onDebloquerBonus,
  onRetour,
}: Props) {
  const [bulleVisible, setBulleVisible] = useState(false);
  const [reponseVisible, setReponseVisible] = useState(false);
  const [bonusVisible, setBonusVisible] = useState(false);
  // L'utilisateur a demandé le bonus sur cette fiche et attend la fin de la publicité
  const [attenteDeblocage, setAttenteDeblocage] = useState(false);
  const couleur = couleurTheme(question.theme);

  useEffect(() => {
    setBulleVisible(false);
    setReponseVisible(false);
    setBonusVisible(false);
    setAttenteDeblocage(false);
  }, [question.id]);

  // Le déblocage est traité par l'écran parent (publicité puis mise à jour de l'état) :
  // on révèle le contenu dès qu'il devient accessible, sans second appui sur le cachet.
  // Sans cette attente explicite, ouvrir une fiche déjà débloquée afficherait le bonus
  // d'emblée, alors qu'il doit rester masqué tant que l'utilisateur ne le demande pas.
  useEffect(() => {
    if (bonusDebloque && attenteDeblocage) {
      setBonusVisible(true);
      setAttenteDeblocage(false);
    }
  }, [bonusDebloque, attenteDeblocage]);

  return (
    <View style={styles.pageAvecBandeau}>
    <ScrollView style={styles.container} contentContainerStyle={styles.contenu}>
      <View style={styles.barreNav}>
        <TouchableOpacity
          // Cible tactile élargie sans changer l'apparence : le texte reste petit,
          // mais la zone qui répond au toucher dépasse le cadre visible tout autour.
          onPress={onRetour}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <View style={[styles.themeBadge, { backgroundColor: couleur }]}>
          <Text style={styles.themeBadgeTexte}>{question.theme}</Text>
        </View>
      </View>

      <View style={[styles.carte, { borderLeftColor: couleur }]}>
        <Text style={styles.modeTag}>{modeLabel}</Text>
        <Text style={styles.position}>{positionLabel}</Text>
        <Text style={styles.questionTexte}>{question.question}</Text>

        {question.infoBulle ? (
          <>
            <TouchableOpacity
              style={styles.bulleToggle}
              onPress={() => {
                if (!bulleVisible) logBulleInfoOuverte({ questionId: question.id, theme: question.theme });
                setBulleVisible((v) => !v);
              }}
            >
              <Text style={styles.bulleToggleTexte}>
                {/* Emoji isole dans sa propre police (non graisse) : accole a une police
                    semi-grasse personnalisee, l'emoji se rend en gris delave sur iOS. */}
                <Text style={styles.emoji}>💡</Text> Info utile
              </Text>
            </TouchableOpacity>
            {bulleVisible && (
              <View style={styles.bulleContenu}>
                <Text style={styles.bulleContenuTexte}>{question.infoBulle}</Text>
              </View>
            )}
          </>
        ) : null}

        <View style={styles.reponseZone}>
          <TouchableOpacity
            style={[styles.btnReveler, reponseVisible && styles.btnRevelerMasquer]}
            onPress={() => {
              if (!reponseVisible) logReponseReveillee({ questionId: question.id, theme: question.theme });
              setReponseVisible((v) => !v);
            }}
          >
            <Text style={[styles.btnRevelerTexte, reponseVisible && styles.btnRevelerTexteMasquer]}>
              {reponseVisible ? 'Masquer la réponse' : 'Dévoiler la réponse'}
            </Text>
          </TouchableOpacity>
          {reponseVisible && <Text style={styles.reponseTexte}>{question.reponse}</Text>}
        </View>

        {question.bonus ? (
          <View style={styles.cachetZone}>
            <TouchableOpacity
              style={[styles.cachet, bonusDebloque && styles.cachetDebloque]}
              onPress={() => {
                if (bonusDebloque) {
                  setBonusVisible((v) => !v);
                  return;
                }
                setAttenteDeblocage(true);
                onDebloquerBonus();
              }}
            >
              <Text style={styles.cachetTxt1}>Bonus</Text>
              <Text style={[styles.cachetTxt2, bonusDebloque && styles.cachetTxt2Debloque]}>
                {bonusDebloque ? '✓' : <Text style={styles.emoji}>🔒</Text>}
              </Text>
            </TouchableOpacity>
            <Text style={styles.cachetLabel}>
              {bonusDebloque
                ? 'Débloqué — appuyez pour voir'
                : bonusOffert
                ? 'Réponse bonus — offerte, appuyez pour débloquer'
                : 'Réponse bonus — regardez une pub pour débloquer'}
            </Text>
            {bonusVisible && (
              <View style={styles.bonusContenu}>
                <Text style={styles.bonusContenuTexte}>{question.bonus}</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.navQuestions}>
        <TouchableOpacity
          style={[styles.navBtn, !peutPrecedent && styles.navBtnDesactive]}
          onPress={onPrecedent}
          disabled={!peutPrecedent}
        >
          <Text style={styles.navBtnTexte}>← Précédente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, !peutSuivant && styles.navBtnDesactive]}
          onPress={onSuivant}
          disabled={!peutSuivant}
        >
          <Text style={styles.navBtnTexte}>{labelSuivant}</Text>
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
  carte: { backgroundColor: couleurs.papier, borderWidth: 1, borderColor: couleurs.ligne, borderLeftWidth: 5, borderRadius: 16, padding: 22 },
  modeTag: { fontSize: 11, fontFamily: polices.texte, color: couleurs.ardoise, letterSpacing: 0.4, opacity: 0.8, marginBottom: 6 },
  position: { fontSize: 12, color: couleurs.or, fontFamily: polices.texteSemiGras, letterSpacing: 0.3, marginBottom: 10 },
  questionTexte:{ fontSize: 21, fontFamily: polices.titre, color: couleurs.bleuNuit, lineHeight: 28, marginBottom: 16 },
  bulleToggle: { alignSelf: 'flex-start', backgroundColor: 'rgba(28,43,73,0.06)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 14 },
  bulleToggleTexte: { fontSize: 13, fontFamily: polices.texteSemiGras, color: couleurs.bleuNuit2 },
  // Police non graisse pour tout emoji accole a un texte en semi-gras/gras : sur iOS,
  // un emoji herite d'une police grasse se rend en gris delave au lieu de sa couleur normale.
  emoji: { fontFamily: polices.texte },
  bulleContenu: { backgroundColor: 'rgba(28,43,73,0.04)', borderLeftWidth: 3, borderLeftColor: couleurs.or, borderRadius: 8, padding: 14, marginBottom: 16, marginTop: -6 },
  bulleContenuTexte: { fontSize: 13.5, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 20 },
  reponseZone: { borderTopWidth: 1, borderTopColor: couleurs.ligne, borderStyle: 'dashed', paddingTop: 16, marginTop: 6 },
  btnReveler: { borderWidth: 1.5, borderColor: couleurs.bleuNuit, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnRevelerMasquer: { borderColor: couleurs.ardoise },
  btnRevelerTexte: { fontSize: 14, fontFamily: polices.texteGras, color: couleurs.bleuNuit, letterSpacing: 0.3 },
  btnRevelerTexteMasquer: { color: couleurs.ardoise },
  reponseTexte: { fontSize: 15, fontFamily: polices.texte, lineHeight: 22, color: couleurs.bleuNuit, marginTop: 14 },
  cachetZone: { marginTop: 18, alignItems: 'center' },
  cachet: { width: 74, height: 74, borderRadius: 37, borderWidth: 2.5, borderColor: couleurs.rouge, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(166,43,43,0.03)', transform: [{ rotate: '-8deg' }] },
  cachetDebloque: { backgroundColor: 'rgba(166,43,43,0.06)' },
  cachetTxt1: { fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: polices.titreGras, color: couleurs.rouge },
  cachetTxt2: { fontSize: 15, fontFamily: polices.titreGras, color: couleurs.rouge, marginTop: 1 },
  cachetTxt2Debloque: { color: couleurs.ok },
  cachetLabel: { fontSize: 12, fontFamily: polices.texte, color: couleurs.ardoise, marginTop: 10 },
  bonusContenu: { width: '100%', backgroundColor: 'rgba(166,43,43,0.05)', borderWidth: 1, borderColor: 'rgba(166,43,43,0.25)', borderRadius: 10, padding: 14, marginTop: 12 },
  bonusContenuTexte: { fontSize: 13.5, fontFamily: polices.texte, lineHeight: 20, color: couleurs.bleuNuit },
  navQuestions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  navBtn: { flex: 1, borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: couleurs.papier },
  navBtnDesactive: { opacity: 0.35 },
  navBtnTexte: { fontSize: 13.5, fontFamily: polices.texteSemiGras, color: couleurs.bleuNuit },
});
