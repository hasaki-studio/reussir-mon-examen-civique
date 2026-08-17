import { ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';
import { polices } from '../theme/typographie';
import { URL_LIVRET_CITOYEN, URL_ANEF, ouvrirLien } from '../config/liens';

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

// Encart rouge : réservé à ce qui peut faire échouer une démarche, à distinguer visuellement
// des simples informations.
const EncartAlerte = ({ children }: { children: ReactNode }) => (
  <View style={styles.encartAlerte}>
    <Text style={styles.encartTexte}>{children}</Text>
  </View>
);

const Puce = ({ children }: { children: ReactNode }) => (
  <View style={styles.puce}>
    <Text style={styles.puceMarque}>•</Text>
    <Text style={styles.puceTexte}>{children}</Text>
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
      <Text style={styles.sousTitre}>
        Préparer son entretien de naturalisation française en 2026
      </Text>
      <Text style={styles.dateMaj}>Dernière mise à jour : 10 août 2026</Text>

      <Text style={styles.avertissement}>
        Important : cette application est indépendante et n'est pas affiliée au ministère de
        l'Intérieur. Les informations ci-dessous sont données à titre indicatif ; référez-vous
        toujours aux sources officielles pour toute démarche.
      </Text>

      <H1>En attendant la date de l'entretien</H1>
      <P>
        Si vous avez déposé une demande de naturalisation, vous pouvez suivre l'avancement de
        votre démarche sur le site officiel de l'Administration Numérique pour les Étrangers en
        France (ANEF).
      </P>
      <EncartAlerte>
        Le suivi administratif de votre dossier et la préparation de l'entretien sont deux choses
        différentes. Cette application ne permet pas de suivre votre dossier de naturalisation et
        n'accède pas aux données de l'ANEF. Pour vos démarches, utilisez uniquement les services
        officiels de l'État.
      </EncartAlerte>
      <CarteLien
        titre="ANEF — suivi de votre dossier"
        sousTitre="Dépôt et suivi en ligne de vos démarches administratives"
        url={URL_ANEF}
      />
      <P>
        Une fois votre dossier arrivé à l'étape <G>« Confirmation de dépôt »</G>, vous pouvez
        commencer à préparer votre entretien sans nécessairement attendre votre convocation.
      </P>

      <H2>Commencez votre préparation dès maintenant</H2>
      <P>
        N'attendez pas nécessairement de recevoir votre convocation pour commencer à réviser. Une
        préparation régulière permet de revoir progressivement les connaissances nécessaires et
        surtout de vous habituer à <G>comprendre les notions et à formuler vos réponses avec vos
        propres mots</G>.
      </P>

      <Separateur />

      <H1>Que faut-il réviser pour l'entretien ?</H1>
      <P>La préparation ne consiste pas uniquement à apprendre des dates ou des définitions.</P>
      <P>
        Votre préparation s'organise autour de <G>cinq grands thèmes</G> :
      </P>

      <H3>1. Principes et valeurs de la République</H3>
      <P>
        Les principes qui structurent la République française : liberté, égalité, fraternité,
        laïcité, égalité entre les femmes et les hommes, et autres notions essentielles.
      </P>

      <H3>2. Système institutionnel et politique</H3>
      <P>
        Le fonctionnement des institutions françaises, les principaux pouvoirs et le rôle des
        différentes institutions de la République.
      </P>

      <H3>3. Droits et devoirs des citoyens</H3>
      <P>Les principaux droits et devoirs liés à la citoyenneté et à la vie en société.</P>

      <H3>4. Histoire, géographie et culture</H3>
      <P>
        Les grandes connaissances permettant de mieux comprendre la France, son histoire, son
        territoire et sa culture.
      </P>

      <H3>5. Vivre dans la société française</H3>
      <P>
        La vie quotidienne en France, les règles communes et les principes qui permettent de
        vivre ensemble.
      </P>

      <H3>Focus supplémentaire : Livret du citoyen 2026</H3>
      <P>
        Un <G>focus spécifique sur le Livret du citoyen 2026</G> est également intégré, afin de
        mettre en évidence les éléments actualisés de la nouvelle édition.
      </P>

      <Separateur />

      <H1>Les questions ne sont pas seulement des QCM</H1>
      <P>
        Un point essentiel à comprendre avant de commencer : l'entretien de naturalisation ne se
        prépare pas comme un simple questionnaire à choix multiple.
      </P>
      <P>
        Certaines questions demandent de <G>s'exprimer, d'expliquer son point de vue et de
        construire une réponse personnelle</G>. Par exemple :
      </P>

      <H3>« Quelle est la personnalité française qui vous influence ? Et pourquoi ? »</H3>
      <P>
        Il ne suffit pas de connaître un nom. Il faut être capable d'expliquer pourquoi cette
        personne vous influence et de développer une réponse cohérente.
      </P>

      <H3>« Que pensez-vous du port des signes religieux dans les lieux publics ? »</H3>
      <P>
        Cette question peut vous amener à expliquer votre compréhension de la <G>laïcité</G>, de
        la liberté de conscience et des principes républicains.
      </P>

      <H3>« Que pensez-vous de l'égalité entre les femmes et les hommes ? »</H3>
      <P>
        Il faut être capable d'expliquer ce que représente cette égalité et de l'illustrer par des
        exemples.
      </P>

      <Encart>
        L'objectif de votre préparation doit donc être de comprendre les notions et d'être capable
        de les expliquer avec vos propres mots. Une réponse récitée mot pour mot peut être moins
        naturelle qu'une réponse comprise et reformulée personnellement.
      </Encart>

      <Separateur />

      <H1>Comment réviser efficacement ?</H1>

      <H2>1. Révisez régulièrement plutôt que tout d'un coup</H2>
      <P>
        Quinze minutes par jour pendant plusieurs semaines sont plus efficaces qu'une longue
        session la veille. L'objectif est de revenir régulièrement sur les notions afin de les
        mémoriser progressivement.
      </P>
      <P>
        Le mode <G>Révision Express</G> propose une session courte de 15 fiches mélangées, issues
        des différents thèmes, ce qui permet de varier les sujets au fil des sessions.
      </P>
      <Encart>
        💡 Faites une petite session chaque jour plutôt qu'une grosse session uniquement lorsque
        votre entretien approche.
      </Encart>

      <H2>2. Essayez de répondre avant de regarder la réponse</H2>
      <P>
        Ne dévoilez pas immédiatement la réponse. Prenez quelques secondes pour réfléchir et
        formuler la vôtre. Cet effort de rappel vous oblige à mobiliser vos connaissances au lieu
        de simplement reconnaître une réponse déjà lue.
      </P>
      <P>
        Après avoir répondu, l'encart <G>« Info utile »</G> apporte du contexte lorsque c'est
        nécessaire. L'intérêt n'est pas seulement de savoir si votre réponse est correcte : c'est
        aussi de <G>comprendre pourquoi</G>.
      </P>

      <H2>3. Revenez sur ce que vous maîtrisez moins</H2>
      <P>
        Une notion déjà maîtrisée mérite moins d'attention qu'une question sur laquelle vous
        hésitez régulièrement. Identifiez ce qui vous pose problème et revenez-y plusieurs fois.
      </P>
      <P>Deux façons de travailler s'offrent à vous :</P>
      <Puce>
        <G>Révision par thème</G>, pour vous concentrer sur un domaine précis ;
      </Puce>
      <Puce>
        <G>Révision par niveau</G>, pour découvrir les fiches progressivement, au fur et à mesure
        que vous les débloquez.
      </Puce>

      <H2>4. Reformulez avec vos propres mots</H2>
      <P>
        L'entretien est une conversation, pas une récitation. Certaines questions demandent
        d'expliquer une notion, de donner votre opinion ou de développer votre réponse : mieux
        vaut comprendre le sujet qu'apprendre une phrase par cœur.
      </P>
      <P>
        Les <G>réponses bonus</G>, une fois débloquées, restent accessibles hors ligne et peuvent
        apporter :
      </P>
      <Puce>des explications supplémentaires ;</Puce>
      <Puce>des astuces pour mieux comprendre la question ;</Puce>
      <Puce>des éléments à retenir ;</Puce>
      <Puce>des erreurs à éviter.</Puce>
      <P>
        Ces informations vous aident surtout à construire ensuite <G>votre propre réponse</G>.
      </P>

      <H2>5. Reliez les connaissances à votre parcours</H2>
      <P>
        Les valeurs et principes de la République ne sont pas seulement des définitions à
        mémoriser. Réfléchissez à ce qu'ils représentent dans votre vie quotidienne en France et à
        la manière dont vous pourriez les expliquer avec vos mots.
      </P>
      <Encart>
        Pendant vos révisions, demandez-vous : « Est-ce que je serais capable d'expliquer cette
        notion à l'oral ? » C'est cette capacité à comprendre et à s'exprimer naturellement qui
        doit guider votre préparation.
      </Encart>

      <Separateur />

      <H1>Votre parcours personnel compte aussi</H1>
      <P>
        L'entretien peut également porter sur votre propre parcours. Avant votre rendez-vous,
        relisez votre dossier et sachez retrouver facilement :
      </P>
      <Puce>vos dates clés ;</Puce>
      <Puce>vos adresses ;</Puce>
      <Puce>vos emplois ;</Puce>
      <Puce>votre situation familiale ;</Puce>
      <Puce>votre parcours et votre installation en France ;</Puce>
      <Puce>vos attaches et vos projets.</Puce>
      <P>
        Préparez quelques phrases simples pour présenter votre parcours. L'objectif n'est pas
        d'apprendre un texte par cœur, mais de le raconter de manière claire et cohérente.
      </P>

      <Separateur />

      <H1>Après avoir reçu votre convocation</H1>
      <P>Lorsque vous recevez votre convocation, vérifiez attentivement :</P>
      <Etape numero={1}>
        <G>La date et le lieu</G> de l'entretien.
      </Etape>
      <Etape numero={2}>
        <G>Les documents à apporter.</G>
      </Etape>
      <Etape numero={3}>
        <G>Les justificatifs</G> éventuellement demandés.
      </Etape>
      <P>Les délais de traitement peuvent varier selon les préfectures.</P>

      <H3>Que faire en cas d'empêchement ?</H3>
      <P>
        Si vous ne pouvez pas vous présenter au créneau indiqué, consultez attentivement les
        instructions figurant sur la convocation et faites connaître votre demande de report ainsi
        que son motif, selon les modalités indiquées.
      </P>
      <EncartAlerte>
        Une nouvelle convocation peut alors vous être adressée. Elle doit être honorée, sous peine
        de voir votre demande de naturalisation classée sans suite.
      </EncartAlerte>
      <P>
        À partir de la convocation, vous pouvez intensifier votre préparation et vous concentrer
        sur les thèmes que vous maîtrisez le moins.
      </P>

      <Separateur />

      <H1>Livret du citoyen 2026</H1>
      <P>
        Le Livret du citoyen constitue un support de référence pour préparer l'entretien. La
        version 2026 apporte une nouvelle organisation et un contenu actualisé.
      </P>
      <Encart>
        Attention aux versions obsolètes : vérifiez toujours que vous utilisez une source
        officielle, et que l'adresse du site correspond bien à un domaine gouvernemental en
        .gouv.fr.
      </Encart>
      <CarteLien
        titre="Livret du citoyen (édition 2026)"
        sousTitre="Publié gratuitement par le ministère de l'Intérieur"
        url={URL_LIVRET_CITOYEN}
      />
      <P>
        Dans l'application, les fiches du thème <G>« Livret du citoyen 2026 »</G> reprennent les
        nouveaux éléments introduits par cette version. Ce focus est particulièrement utile si
        vous aviez commencé votre préparation avant sa publication.
      </P>

      <Separateur />

      <H1>Entretien et examen civique : quelle différence ?</H1>
      <P>
        Il est important de ne pas confondre <G>l'entretien d'assimilation</G> et <G>l'examen
        civique</G>.
      </P>

      <H2>L'entretien de naturalisation</H2>
      <P>
        C'est celui que prépare cette application. Il porte sur les connaissances relatives à la
        France — histoire, culture, institutions, valeurs — ainsi que sur votre propre parcours.
      </P>
      <P>
        Il comporte aussi une dimension d'échange : certaines questions demandent de donner votre
        opinion, d'expliquer une notion ou de développer une réponse.
      </P>

      <H2>L'examen civique</H2>
      <P>
        C'est un dispositif <G>distinct</G>, présenté sous la forme d'un questionnaire à choix
        multiple de 40 questions, avec un seuil de réussite de 32 bonnes réponses.
      </P>
      <P>
        L'attestation de réussite à l'examen civique et l'entretien d'assimilation correspondent
        donc à deux étapes et à deux préparations différentes.
      </P>
      <Encart>
        🆕 Une application dédiée à la préparation de l'examen civique, orientée vers
        l'entraînement au format QCM, est en préparation. Disponible prochainement.
      </Encart>

      <Separateur />

      <H1>Le niveau de français</H1>
      <P>
        Le niveau de français exigé pour la naturalisation est passé de <G>B1 à B2</G>.
      </P>
      <P>
        Cette évolution renforce l'importance de comprendre les questions et de s'exprimer
        correctement pendant l'entretien. La préparation ne consiste donc pas uniquement à
        mémoriser des connaissances : travaillez aussi votre capacité à <G>comprendre, expliquer
        et répondre avec vos propres mots</G>.
      </P>

      <Separateur />

      <H1>Le jour de l'entretien</H1>
      <P>
        L'agent de préfecture ou consulaire peut vérifier vos connaissances de l'histoire, de la
        culture et des institutions françaises, ainsi que votre adhésion aux valeurs de la
        République.
      </P>
      <P>
        Une hésitation, un mot oublié ou une date approximative ne signifie pas que votre
        entretien est compromis. Il est préférable de reconnaître que vous ne connaissez pas une
        réponse plutôt que d'inventer.
      </P>
      <P>
        La cohérence entre les informations de votre dossier, votre parcours et vos réponses reste
        importante.
      </P>

      <Separateur />

      <H1>Questions fréquentes</H1>

      <H2>Cette application permet-elle de suivre mon dossier ANEF ?</H2>
      <P>
        <G>Non.</G> C'est une application de préparation et de révision. Elle ne permet pas de
        consulter l'avancement d'une demande et n'accède pas aux données de l'ANEF. Pour suivre
        votre démarche administrative, utilisez le site officiel de l'ANEF.
      </P>

      <H2>Prépare-t-elle à l'examen civique ?</H2>
      <P>
        Non. <G>L'entretien de naturalisation et l'examen civique sont deux étapes distinctes.</G>{' '}
        Une application dédiée à l'examen civique est prévue prochainement.
      </P>

      <H2>Remplace-t-elle les sources officielles ?</H2>
      <P>
        Non. C'est un outil de préparation indépendant. Pour toute démarche administrative,
        vérifiez toujours les informations auprès des sources officielles.
      </P>

      <Separateur />

      <H1>Sources officielles</H1>
      <P>Pour toute démarche administrative, utilisez en priorité les sources officielles.</P>
      <CarteLien
        titre="Administration Numérique pour les Étrangers en France"
        sousTitre="Dépôt et suivi de votre dossier"
        url={URL_ANEF}
      />
      <CarteLien
        titre="Livret du citoyen — ministère de l'Intérieur"
        sousTitre="Le support de référence pour l'entretien"
        url={URL_LIVRET_CITOYEN}
      />

      <Separateur />

      <H1>Contact</H1>
      <P>
        Toute question relative à cette page ou à l'application peut être adressée à{' '}
        <G>contact@hasakistudio.fr</G>.
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
  encartAlerte: {
    backgroundColor: 'rgba(166,43,43,0.06)',
    borderLeftWidth: 3,
    borderLeftColor: couleurs.rouge,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  encartTexte: { fontSize: 13.5, fontFamily: polices.texte, lineHeight: 20, color: couleurs.ardoise },
  puce: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingLeft: 4 },
  puceMarque: { fontSize: 14, color: couleurs.or, fontFamily: polices.texte, lineHeight: 21 },
  puceTexte: { flex: 1, fontSize: 14, fontFamily: polices.texte, color: couleurs.ardoise, lineHeight: 21 },
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
