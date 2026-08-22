import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';
import type { Consentement } from '../state/ConsentementContext';
import { ouvrirPreferencesPublicitaires } from '../services/ads';
import { URL_CONFIDENTIALITE, URL_MENTIONS_LEGALES, ouvrirLien } from '../config/liens';

interface Props {
  onRetour: () => void;
  consentement: Consentement | null;
  onDefinirConsentement: (valeur: Consentement) => void;
  premium: boolean;
  restaurationEnCours: boolean;
  onRestaurerAchats: () => void;
}

export default function MentionsLegales({
  onRetour,
  consentement,
  onDefinirConsentement,
  premium,
  restaurationEnCours,
  onRestaurerAchats,
}: Props) {
  const analyticsActif = consentement === 'accepte';
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
      <Text style={styles.titre}>Mentions légales</Text>

      <Text style={styles.sectionTitre}>Éditeur</Text>
      <Text style={styles.paragrapheSerre}>
        <Text style={styles.gras}>Achraf AZOUZI</Text> — personne physique. « Hasaki Studio » est un nom d'usage, non une société immatriculée.
      </Text>

      <View style={styles.coordonnees}>
        <Text style={styles.coordonneeLigne}>Domicile : 3 avenue de Choisy, Tour Bergame, BP 2122, 75013 Paris</Text>
        <Text style={styles.coordonneeLigne}>Téléphone : 06 13 66 73 89</Text>
        <Text style={styles.coordonneeLigne}>Contact : contact@hasakistudio.fr</Text>
      </View>

      <Text style={styles.paragraphe}>
        Application indépendante, non affiliée au ministère de l'Intérieur ni à aucune administration.
      </Text>

      <Text style={styles.sectionTitre}>Données personnelles</Text>
      <Text style={styles.paragraphe}>
        Cette application ne collecte aucune donnée personnelle identifiante (nom, prénom, adresse, etc.). Aucun compte utilisateur n'est requis pour utiliser l'application. Votre progression est stockée uniquement sur votre appareil.
      </Text>

      <Text style={styles.paragraphe}>
        Certains traitements techniques et publicitaires sont mis en œuvre, dont plusieurs sont soumis à votre consentement préalable et révocable. Le détail figure dans la politique de confidentialité, qui précise les données traitées, leurs finalités, leurs bases légales, leurs durées de conservation et vos droits.
      </Text>

      <Text style={styles.sectionTitre}>Vos droits</Text>
      <Text style={styles.paragraphe}>
        Vous disposez d'un droit d'accès, de rectification et d'effacement des données vous concernant, ainsi que du droit de retirer votre consentement à tout moment. Votre progression, stockée uniquement sur votre appareil, s'efface en désinstallant l'application ou en vidant ses données depuis les réglages de votre téléphone. Pour toute autre demande — notamment l'effacement des données déjà transmises aux régies publicitaires ou à la mesure d'usage — écrivez à{' '}
        <Text style={styles.gras}>contact@hasakistudio.fr</Text>. Nous y répondons dans un délai d'un mois.
      </Text>

      <Text style={styles.sectionTitre}>Mesure d'usage (Analytics)</Text>
      <Text style={styles.paragraphe}>
        Avec votre consentement, des données d'usage anonymes et agrégées sont collectées à des fins statistiques (ex. : nombre de questions consultées, écrans visités) via Firebase Analytics, sans partage avec des régies publicitaires tierces à des fins de ciblage. Ce recueil est soumis à votre consentement, que vous pouvez donner ou retirer à tout moment ci-dessous.
      </Text>

      <View style={styles.consentEncart}>
        <Text style={styles.consentStatut}>
          {analyticsActif ? '✓ Mesure d\'usage activée' : '✕ Mesure d\'usage désactivée'}
        </Text>
        <TouchableOpacity
          style={styles.consentBouton}
          onPress={() => onDefinirConsentement(analyticsActif ? 'refuse' : 'accepte')}
          activeOpacity={0.85}
        >
          <Text style={styles.consentBoutonTexte}>
            {analyticsActif ? 'Retirer mon consentement' : 'Activer la mesure d\'usage'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitre}>Publicité</Text>
      <Text style={styles.paragraphe}>
        L'application peut afficher des publicités fournies par des régies publicitaires tierces (notamment Google AdMob), permettant de débloquer gratuitement du contenu (nouvelles questions, examens blancs supplémentaires, revue détaillée des résultats) en échange du visionnage d'une annonce. Ces régies peuvent déposer des traceurs sur votre appareil et traiter certaines données (identifiant publicitaire, données techniques de l'appareil) à des fins de diffusion et de mesure de performance des publicités, et le cas échéant de personnalisation. Ces traitements sont soumis à votre consentement, recueilli lors de votre première utilisation de l'application via le formulaire de Google, et vous pouvez revenir sur ce choix à tout moment ci-dessous. L'éditeur de l'application ne vend ni ne transmet aucune donnée personnelle à des fins commerciales en dehors du fonctionnement de ces régies publicitaires.
      </Text>

      <TouchableOpacity
        style={[styles.consentBouton, styles.consentBoutonEspace]}
        onPress={() => {
          ouvrirPreferencesPublicitaires();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.consentBoutonTexte}>Gérer mes préférences publicitaires</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitre}>Achats</Text>
      <Text style={styles.paragraphe}>
        L'option Premium est un achat unique, sans abonnement ni prélèvement récurrent. Elle est rattachée à votre compte Google Play : en cas de réinstallation de l'application ou de changement d'appareil, elle est rétablie automatiquement à l'ouverture, sans démarche de votre part. Le bouton ci-dessous ne sert qu'en secours, si ce rétablissement automatique n'a pas eu lieu.
      </Text>

      <Text style={styles.paragraphe}>
        Le droit de rétractation applicable aux contenus numériques fournis immédiatement est régi par les conditions de Google Play. Toute demande de remboursement relève de Google Play.
      </Text>

      {premium ? (
        <View style={styles.consentEncart}>
          <Text style={styles.consentStatut}>✓ Premium actif sur cet appareil</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.consentBouton, styles.consentBoutonEspace]}
          onPress={onRestaurerAchats}
          disabled={restaurationEnCours}
          activeOpacity={0.85}
        >
          <Text style={styles.consentBoutonTexte}>
            {restaurationEnCours ? 'Restauration en cours…' : 'Restaurer mes achats'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitre}>Propriété intellectuelle</Text>
      <Text style={styles.paragraphe}>
        La structure de l'application, son interface, ses textes rédactionnels et ses éléments graphiques sont la propriété d'Achraf AZOUZI, sauf mention contraire. Toute reproduction ou réutilisation sans autorisation préalable est interdite.
      </Text>

      <Text style={styles.paragraphe}>
        Les questions s'appuient sur les sujets fixés par les listes officielles de l'examen civique (carte de séjour pluriannuelle, carte de résident, naturalisation) et sont rédigées spécifiquement pour l'application, à des fins pédagogiques.
      </Text>

      <Text style={styles.sectionTitre}>Politique de confidentialité</Text>
      <Text style={styles.paragraphe}>
        La politique de confidentialité détaillée précise les données traitées, leurs finalités, leurs bases légales, les durées de conservation et vos droits (accès, rectification, effacement, retrait du consentement).
      </Text>

      <TouchableOpacity
        style={[styles.consentBouton, styles.consentBoutonEspace]}
        onPress={() => ouvrirLien(URL_CONFIDENTIALITE)}
        activeOpacity={0.85}
      >
        <Text style={styles.consentBoutonTexte}>Lire la politique de confidentialité</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitre}>Version en ligne</Text>
      <Text style={styles.paragraphe}>
        Ces mentions légales sont également publiées sur le site de l'éditeur, dans une version complète incluant l'identification de l'hébergeur, la propriété intellectuelle et le droit applicable.
      </Text>

      <TouchableOpacity onPress={() => ouvrirLien(URL_MENTIONS_LEGALES)} activeOpacity={0.85}>
        <Text style={styles.lienTexte}>{URL_MENTIONS_LEGALES}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitre}>Contact</Text>
      <Text style={styles.paragraphe}>contact@hasakistudio.fr</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  retour: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise, marginBottom: 12 },
  titre: { fontSize: 22, fontFamily: polices.titre, color: couleurs.bleuNuit, marginBottom: 20 },
  sectionTitre: { fontSize: 19, fontFamily: polices.titre, color: couleurs.bleuNuit, marginBottom: 10, marginTop: 6 },
  paragraphe: { fontSize: 13.5, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 20, marginBottom: 20 },
  // Variante rapprochée : le bloc de coordonnées qui suit appartient au même paragraphe visuel.
  paragrapheSerre: { fontSize: 13.5, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 20, marginBottom: 12 },
  gras: { fontFamily: polices.texteGras },
  coordonnees: {
    borderLeftWidth: 2,
    borderLeftColor: couleurs.ligne,
    paddingLeft: 12,
    marginBottom: 20,
  },
  coordonneeLigne: { fontSize: 13.5, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 20, marginBottom: 3 },
  consentEncart: { backgroundColor: 'rgba(28,43,73,0.04)', borderRadius: 10, padding: 16, marginBottom: 20 },
  consentStatut: { fontSize: 13.5, fontFamily: polices.texteSemiGras, color: couleurs.bleuNuit, marginBottom: 12 },
  consentBouton: { borderWidth: 1.5, borderColor: couleurs.bleuNuit, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  consentBoutonEspace: { marginBottom: 20 },
  consentBoutonTexte: { fontSize: 13.5, fontFamily: polices.texteSemiGras, color: couleurs.bleuNuit },
  lienTexte: { fontSize: 12.5, fontFamily: polices.texte, color: couleurs.bleuNuit, textDecorationLine: 'underline', marginBottom: 20 },
});