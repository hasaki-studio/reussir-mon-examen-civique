import { ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';
import {
  URL_FORMATION_CIVIQUE,
  URL_LISTE_QUESTIONS_CSP,
  URL_LISTE_QUESTIONS_CR,
  URL_LISTE_QUESTIONS_NAT,
  URL_ANEF,
  URL_SERVICE_PUBLIC,
  URL_ANNUAIRE_PREFECTURES,
  ouvrirLien,
} from '../config/liens';

// Petits composants de mise en forme : le contenu de cet écran est rédactionnel et long,
// les factoriser évite de répéter les styles à chaque paragraphe.
const P = ({ children }: { children: ReactNode }) => <Text style={styles.paragraphe}>{children}</Text>;
const G = ({ children }: { children: ReactNode }) => <Text style={styles.gras}>{children}</Text>;
const H1 = ({ children }: { children: ReactNode }) => <Text style={styles.h1}>{children}</Text>;
const H2 = ({ children }: { children: ReactNode }) => <Text style={styles.h2}>{children}</Text>;
const H3 = ({ children }: { children: ReactNode }) => <Text style={styles.h3}>{children}</Text>;
const Separateur = () => <View style={styles.separateur} />;

const Encart = ({ children }: { children: ReactNode }) => (
  <View style={styles.encart}>
    <Text style={styles.encartTexte}>{children}</Text>
  </View>
);

const Etape = ({ numero, children }: { numero: number; children: ReactNode }) => (
  <View style={styles.etape}>
    <View style={styles.etapeNum}>
      <Text style={styles.etapeNumTexte}>{numero}</Text>
    </View>
    <Text style={styles.etapeTexte}>{children}</Text>
  </View>
);

// Une url vide rend la carte non cliquable et masque sa flèche : mieux vaut ne rien promettre
// qu'ouvrir un lien mort vers un site officiel.
const CarteLien = ({ titre, sousTitre, url }: { titre: string; sousTitre: string; url: string }) => (
  <TouchableOpacity
    style={styles.lienCard}
    onPress={() => ouvrirLien(url)}
    disabled={!url}
    activeOpacity={0.7}
  >
    <View style={styles.lienCardTexte}>
      <Text style={styles.lienCardTitre}>{titre}</Text>
      <Text style={styles.lienCardSub}>{sousTitre}</Text>
    </View>
    {!!url && <Text style={styles.lienCardFleche}>→</Text>}
  </TouchableOpacity>
);

interface Props {
  onRetour: () => void;
}

export default function ConseilsRevision({ onRetour }: Props) {
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
      <Text style={styles.titre}>Conseils de révision</Text>
      <Text style={styles.sousTitre}>Préparer l'examen civique — carte de séjour, carte de résident, naturalisation</Text>
      <Text style={styles.dateMaj}>Dernière mise à jour : 24 août 2026</Text>

      <Text style={styles.avertissement}>
        Important : cette application est indépendante et n'est pas affiliée au ministère de
        l'Intérieur. Les informations ci-dessous sont données à titre indicatif ; référez-vous
        toujours aux sources officielles pour toute démarche.
      </Text>

      <H1>Ce qu'est l'examen civique</H1>
      <P>
        Depuis le <G>1er janvier 2026</G>, la réussite à l'examen civique conditionne la
        délivrance de la <G>carte de séjour pluriannuelle</G>, de la <G>carte de résident</G> et
        de la <G>naturalisation</G>. C'est un questionnaire à choix multiple de <G>40 questions</G>,
        dont il faut obtenir au moins <G>32 bonnes réponses</G> pour valider.
      </P>
      <P>
        Il porte sur cinq thèmes : les principes et valeurs de la République, le fonctionnement
        des institutions, les droits et devoirs des citoyens, l'histoire et la géographie, et la
        vie dans la société française.
      </P>
      <Encart>
        Dans les conditions réelles, vous disposez de 45 minutes pour ces 40 questions — un peu
        plus d'une minute par question. L'application ne minute pas encore vos sessions, mais
        gardez ce rythme en tête pendant vos examens blancs.
      </Encart>

      <Separateur />

      <H1>Où trouver la liste officielle des questions</H1>
      <P>
        Les questions de l'examen civique sont publiées par le ministère de l'Intérieur.{' '}
        <G>La liste dépend de la démarche pour laquelle vous passez l'examen</G> : vérifiez
        d'abord laquelle vous concerne, puis révisez à partir de celle-là.
      </P>
      <CarteLien
        titre="Carte de séjour pluriannuelle"
        sousTitre="Liste officielle des questions de connaissance — CSP"
        url={URL_LISTE_QUESTIONS_CSP}
      />
      <CarteLien
        titre="Carte de résident"
        sousTitre="Liste officielle des questions de connaissance — CR"
        url={URL_LISTE_QUESTIONS_CR}
      />
      <CarteLien
        titre="Naturalisation"
        sousTitre="Questions de connaissance pour la nationalité française"
        url={URL_LISTE_QUESTIONS_NAT}
      />

      <Separateur />

      <H1>Comment réviser efficacement</H1>

      <H3>Étalez plutôt que de concentrer</H3>
      <P>
        Quinze minutes par jour pendant trois semaines ancrent davantage qu'une journée entière la
        veille. La mémoire consolide pendant les intervalles, pas pendant l'effort. C'est ce que
        permet <G>Révision express</G> : quelques questions tirées au hasard, le temps d'un trajet.
      </P>

      <H3>Passez des séries en conditions réelles</H3>
      <P>
        40 questions, 32 bonnes réponses exigées : entraînez-vous dans ces conditions avant le jour
        J, pour ne pas découvrir le format le jour de l'examen. <G>Examen blanc</G> reproduit
        exactement cette contrainte.
      </P>

      <H3>Revenez sur ce qui résiste</H3>
      <P>
        Un thème déjà maîtrisé n'apprend plus rien. Les questions qui vous mettent en difficulté
        méritent d'être revues plusieurs fois, à quelques jours d'écart. <G>Réviser en détail</G>{' '}
        sert précisément à ça : reprendre un thème ou un niveau précis sans refaire tout le
        programme.
      </P>

      <H3>Réfléchissez avant de répondre</H3>
      <P>
        Il faut choisir une réponse pour avancer — autant que ce soit un choix réfléchi. Une bonne
        partie des questions se raisonnent par élimination même sans connaître la réponse exacte :
        l'explication qui suit chaque réponse indique pourquoi les autres propositions sont
        fausses, c'est souvent là que se construit ce raisonnement.
      </P>

      <H3>Méfiez-vous des réponses absolues</H3>
      <P>
        Les questions du QCM piègent souvent sur les propositions trop tranchées — « jamais »,
        « toujours », « automatiquement ». Une réponse aussi catégorique est souvent la mauvaise.
      </P>

      <Separateur />

      <H1>Les trois modes, et quand les utiliser</H1>
      <P>
        Connaître ces principes ne suffit pas : encore faut-il savoir quoi ouvrir un mardi soir
        quand il reste vingt minutes. Les trois modes ne servent pas au même moment de la
        préparation.
      </P>

      <H2>⚡ Révision express — entretenir, tous les jours</H2>
      <P>
        Quinze questions tirées au hasard dans l'ensemble du programme, corrigées au fur et à
        mesure. Le tirage mélange les thèmes, ce qui vous oblige à identifier de quoi parle la
        question avant d'y répondre — un effort que la révision par thème escamote, et qui est
        précisément celui demandé le jour de l'examen.
      </P>
      <P>À utiliser du premier jour jusqu'à la veille de l'épreuve, sans chercher à faire de longues sessions.</P>

      <H2>📚 Réviser en détail — construire les bases</H2>
      <P>
        Les questions organisées par thème ou par niveau. C'est le mode du début de préparation,
        quand le programme est encore neuf : cinq thèmes d'un coup découragent, un thème à la fois
        se termine. C'est aussi le mode de la réparation : après un examen blanc raté sur un thème
        précis, on y revient ici plutôt que de tout recommencer.
      </P>

      <H2>📝 Examen blanc — se mettre en conditions</H2>
      <P>
        40 questions dont des mises en situation, sans correction avant la fin — les conditions les
        plus proches de l'épreuve réelle que propose l'application.
      </P>
      <P>
        Son intérêt n'est pas d'apprendre, mais de <G>mesurer</G>. Tant que vous ne passez pas
        régulièrement la barre des 32 bonnes réponses sur 40, la préparation n'est pas terminée,
        quel que soit le sentiment de maîtrise.
      </P>
      <Encart>Comptez-en au moins deux avant l'examen, à quelques jours d'intervalle.</Encart>

      <Separateur />

      <H1>Un plan sur quatre semaines</H1>
      <Etape numero={1}>
        <G>Semaines 1 et 2 :</G> Réviser en détail, pour parcourir tout le programme une première
        fois. En parallèle chaque jour, Révision express pour entretenir et mélanger les thèmes.
      </Etape>
      <Etape numero={2}>
        <G>Semaine 3 :</G> premier examen blanc, pour situer son niveau réel, sans complaisance.
      </Etape>
      <Etape numero={3}>
        <G>Semaine 4 :</G> examen blanc, puis retour sur les thèmes faibles, pour viser 32/40 de
        façon régulière.
      </Etape>
      <P>
        Quatre semaines est un ordre de grandeur, pas une règle : ajustez selon votre point de
        départ et la date de votre convocation.
      </P>

      <Separateur />

      <H1>Le jour de l'examen</H1>
      <P>
        Vérifiez la convocation : date, lieu, pièce d'identité et documents demandés. Arrivez en
        avance. 45 minutes passent vite sur 40 questions — ne restez pas bloqué trop longtemps sur
        une seule, passez à la suite et revenez-y si le temps le permet.
      </P>

      <Separateur />

      <H1>Liens utiles</H1>
      <CarteLien
        titre="Portail officiel de l'examen civique"
        sousTitre="Les ressources de préparation publiées par le ministère de l'Intérieur"
        url={URL_FORMATION_CIVIQUE}
      />
      <CarteLien
        titre="ANEF"
        sousTitre="Dépôt et suivi de votre dossier en ligne"
        url={URL_ANEF}
      />
      <CarteLien
        titre="Service-public.fr"
        sousTitre="Conditions, pièces justificatives et démarches"
        url={URL_SERVICE_PUBLIC}
      />
      <CarteLien
        titre="Votre préfecture"
        sousTitre="Prise de rendez-vous et questions sur votre dossier"
        url={URL_ANNUAIRE_PREFECTURES}
      />

      <Separateur />

      <H1>Questions fréquentes</H1>

      <H2>L'examen civique est-il obligatoire ?</H2>
      <P>
        Oui. Depuis le 1er janvier 2026, sa réussite conditionne la délivrance de la carte de
        séjour pluriannuelle, de la carte de résident et de la naturalisation. La liste de
        questions à réviser dépend de la démarche concernée.
      </P>

      <H2>Quelle différence entre l'examen civique et l'entretien de naturalisation ?</H2>
      <P>
        Ce sont deux étapes distinctes. L'examen civique est un QCM de 40 questions avec un seuil
        de réussite chiffré. L'entretien d'assimilation est un échange oral avec un agent, qui
        porte aussi sur votre parcours personnel. Réussir l'un ne dispense pas de l'autre.
      </P>

      <H2>En combien de temps peut-on être prêt ?</H2>
      <P>
        Cela dépend de votre point de départ, et aucune durée ne garantit la réussite. En
        pratique, une préparation régulière — une quinzaine de minutes par jour pendant trois à
        quatre semaines — laisse le temps de parcourir tous les thèmes, puis de revenir deux ou
        trois fois sur les questions qui résistent. Le meilleur indicateur reste vos résultats en
        examen blanc.
      </P>

      <H2>L'application est-elle gratuite ?</H2>
      <P>
        Le téléchargement est gratuit. Une partie du contenu se débloque en regardant une courte
        publicité. Un achat unique et facultatif donne accès à l'intégralité du contenu, sans
        publicité et mises à jour incluses. Il n'y a pas d'abonnement.
      </P>

      <H2>L'application remplace-t-elle les sources officielles ?</H2>
      <P>
        Non. C'est un outil d'entraînement indépendant. Pour toute démarche administrative —
        conditions, pièces à fournir, inscription, convocation — référez-vous aux sources
        officielles listées plus haut.
      </P>

      <H2>Comment obtenir de l'aide ?</H2>
      <P>
        Pour une question sur l'application, une erreur repérée dans une question ou une demande
        liée à vos données, écrivez à <G>contact@hasakistudio.fr</G>.
      </P>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  retour: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise, marginBottom: 12 },
  titre: { fontSize: 22, fontFamily: polices.titre, color: couleurs.bleuNuit, marginBottom: 6 },
  sousTitre: { fontSize: 14, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 20, marginBottom: 4 },
  dateMaj: { fontSize: 11.5, fontFamily: polices.texte, color: couleurs.ardoise, opacity: 0.7, marginBottom: 20 },
  avertissement: {
    fontSize: 13,
    // Fichier italique dédié : React Native n'incline pas une police custom lui-même
    fontFamily: polices.texteItalique,
    color: couleurs.ardoise,
    backgroundColor: 'rgba(28,43,73,0.04)',
    borderRadius: 12,
    padding: 16,
    lineHeight: 19,
    marginBottom: 26,
  },
  h1: { fontSize: 20, fontFamily: polices.titre, color: couleurs.bleuNuit, marginBottom: 14 },
  h2: { fontSize: 16.5, fontFamily: polices.titre, color: couleurs.bleuNuit, marginTop: 8, marginBottom: 10 },
  h3: { fontSize: 14.5, fontFamily: polices.texteGras, color: couleurs.bleuNuit, marginTop: 6, marginBottom: 8, lineHeight: 21 },
  paragraphe: { fontSize: 14, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 21, marginBottom: 14 },
  gras: { fontFamily: polices.texteGras },
  separateur: { height: 1, backgroundColor: couleurs.ligne, marginTop: 14, marginBottom: 26 },
  encart: {
    backgroundColor: 'rgba(156,122,60,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: couleurs.or,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  encartTexte: { fontSize: 13.5, fontFamily: polices.texte, lineHeight: 20, color: couleurs.ardoise },
  etape: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  etapeNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: couleurs.bleuNuit,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etapeNumTexte: { color: couleurs.papier, fontFamily: polices.titreGras, fontSize: 13 },
  etapeTexte: { flex: 1, fontSize: 14.5, fontFamily: polices.texte, lineHeight: 21, color: couleurs.bleuNuit, paddingTop: 2 },
  lienCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    borderRadius: 14,
    marginBottom: 16,
  },
  lienCardTexte: { flex: 1 },
  lienCardTitre: { fontFamily: polices.titre, fontSize: 15.5, color: couleurs.bleuNuit, marginBottom: 4 },
  lienCardSub: { fontSize: 13, fontFamily: polices.texte, color: couleurs.ardoise },
  lienCardFleche: { color: couleurs.ardoise, fontSize: 16, fontFamily: polices.texte },
});
