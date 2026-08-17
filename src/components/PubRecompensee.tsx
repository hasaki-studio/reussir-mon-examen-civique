import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRewardedAd } from 'react-native-google-mobile-ads';
import { ouvrirPreferencesPublicitaires } from '../services/ads';
import { usePublicites } from '../state/PublicitesContext';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';

interface Props {
  visible: boolean;
  /** Unité publicitaire de l'emplacement appelant : le revenu est ventilé par unité. */
  unite: string;
  titre: string;
  description: string;
  /** Appelé uniquement si la publicité a été regardée jusqu'à la récompense. */
  onTermine: () => void;
  /** Appelé si l'utilisateur renonce, ferme l'annonce avant la fin, ou si elle est indisponible. */
  onAnnuler: () => void;
  onVisionnee?: () => void;
}

/**
 * Déblocage de contenu contre visionnage d'une publicité avec récompense (AdMob RewardedAd).
 *
 * Le déblocage est strictement conditionné à l'événement de récompense émis par Google : fermer
 * l'annonce avant la fin ne débloque rien. C'est la contrepartie du modèle — sans quoi la
 * publicité ne serait qu'un délai contournable, et ne rapporterait rien.
 *
 * Conséquence assumée : sans réseau, ou si l'utilisateur a refusé la publicité au parcours de
 * consentement, le déblocage est impossible. Les questions déjà débloquées restent consultables
 * hors ligne, mais en débloquer de nouvelles suppose une connexion.
 */
export default function PubRecompensee(props: Props) {
  // Rien n'est monté tant que la modale est fermée : le hook publicitaire repart donc d'un état
  // vierge à chaque ouverture. Sans cela, ses états (isEarnedReward, isClosed) survivraient à la
  // fermeture, et l'ouverture suivante débloquerait le contenu sur la récompense précédente,
  // sans afficher la moindre publicité.
  if (!props.visible) return null;
  return <ModaleOuverte {...props} />;
}

function ModaleOuverte({ unite, titre, description, onTermine, onAnnuler, onVisionnee }: Props) {
  const { publicitesAutorisees } = usePublicites();
  const insets = useSafeAreaInsets();
  // adUnitId à null tant que le consentement n'est pas acquis : le hook ne crée alors aucune
  // instance et n'émet aucune requête publicitaire, ce qu'impose le parcours UMP.
  const { isLoaded, isClosed, isEarnedReward, isShowing, error, load, show } = useRewardedAd(
    publicitesAutorisees ? unite : null
  );

  // L'issue ne doit être traitée qu'une fois : les états restent vrais sur les rendus suivants.
  const denouementTraite = useRef(false);

  // iOS présente l'annonce depuis le contrôleur de vue racine, déjà occupé à présenter cette
  // modale : demander les deux en même temps leve « Attempt to present ... which is already
  // presenting ... » et fait planter l'application. On ferme donc la modale d'abord, et on
  // n'appelle show() qu'une fois son démontage confirmé par onDismiss.
  //
  // Android n'a pas cette contrainte — show() y lance une Activity — d'où l'appel direct.
  const [attenteFermeture, setAttenteFermeture] = useState(false);

  const lancerAnnonce = () => {
    if (Platform.OS === 'ios') setAttenteFermeture(true);
    else show();
  };

  // Demande l'annonce dès l'ouverture : son chargement prend souvent plusieurs secondes.
  useEffect(() => {
    if (publicitesAutorisees) load();
  }, [publicitesAutorisees, load]);

  useEffect(() => {
    if (denouementTraite.current) return;
    if (isEarnedReward) {
      denouementTraite.current = true;
      onVisionnee?.();
      onTermine();
    } else if (isClosed) {
      // Fermée avant la récompense : on referme sans rien débloquer.
      denouementTraite.current = true;
      onAnnuler();
    }
  }, [isEarnedReward, isClosed, onVisionnee, onTermine, onAnnuler]);

  // Pendant la diffusion, l'annonce occupe tout l'écran : la modale n'a rien à afficher.
  const contenu = () => {
    if (publicitesAutorisees === null) {
      return (
        <>
          <ActivityIndicator size="large" color={couleurs.or} style={styles.spinner} />
          <Text style={styles.texte}>Préparation…</Text>
        </>
      );
    }

    if (publicitesAutorisees === false) {
      return (
        <>
          <Text style={styles.titre}>Publicité indisponible</Text>
          <Text style={styles.texte}>
            Le déblocage par publicité nécessite votre accord pour l'affichage de publicités. Vous
            pouvez revenir sur ce choix, ou passer en Premium pour tout débloquer sans publicité.
          </Text>
          <TouchableOpacity style={styles.btnPub} onPress={() => ouvrirPreferencesPublicitaires()}>
            <Text style={styles.btnPubTexte}>Gérer mes préférences</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAnnuler}>
            <Text style={styles.fermer}>Fermer</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (error) {
      return (
        <>
          <Text style={styles.titre}>Publicité indisponible</Text>
          <Text style={styles.texte}>
            Aucune publicité n'a pu être chargée. Vérifiez votre connexion, puis réessayez.
          </Text>
          <TouchableOpacity style={styles.btnPub} onPress={load}>
            <Text style={styles.btnPubTexte}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAnnuler}>
            <Text style={styles.fermer}>Fermer</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (!isLoaded) {
      return (
        <>
          <ActivityIndicator size="large" color={couleurs.or} style={styles.spinner} />
          <Text style={styles.texte}>Chargement de la publicité…</Text>
          <TouchableOpacity onPress={onAnnuler}>
            <Text style={styles.fermer}>Annuler</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <Text style={styles.titre}>{titre}</Text>
        <Text style={styles.texte}>{description}</Text>
        <TouchableOpacity style={styles.btnPub} onPress={lancerAnnonce}>
          <Text style={styles.btnPubTexte}>Regarder la publicité</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAnnuler}>
          <Text style={styles.fermer}>Annuler</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <Modal
      // Rouvre la modale si la présentation échoue : sans ce repli sur `error`, l'utilisateur
      // resterait devant un écran vide, la modale fermée et aucune annonce affichée.
      visible={!isShowing && (!attenteFermeture || !!error)}
      transparent
      animationType="fade"
      onRequestClose={onAnnuler}
      // iOS uniquement : déclenché une fois la modale réellement démontée.
      onDismiss={() => {
        if (attenteFermeture) show();
      }}
    >
      <View style={styles.overlay}>
        {/* Ajoutée à paddingBottom, pas substituée : sur un appareil sans barre système,
            insets.bottom vaut 0 et l'espacement du design reste inchangé. */}
        <View style={[styles.modale, { paddingBottom: styles.modale.paddingBottom + insets.bottom }]}>
          {contenu()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(28,43,73,0.55)', justifyContent: 'flex-end' },
  modale: {
    backgroundColor: couleurs.papier,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 26,
    paddingBottom: 34,
    alignItems: 'center',
  },
  spinner: { marginBottom: 14 },
  titre: { fontSize: 19, fontFamily: polices.titre, color: couleurs.bleuNuit, marginBottom: 8 },
  texte: { fontSize: 13.5, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  btnPub: { backgroundColor: couleurs.or, borderRadius: 10, paddingVertical: 14, width: '100%', alignItems: 'center' },
  btnPubTexte: { color: '#fff', fontFamily: polices.texteGras, fontSize: 14 },
  fermer: { marginTop: 12, fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise, textDecorationLine: 'underline' },
});
