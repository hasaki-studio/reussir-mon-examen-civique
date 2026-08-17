// src/config/datesCles.ts
//
// Dates clés de la République affichées sur le bandeau de l'accueil le jour dit.
//
// Table locale plutôt que Remote Config : le message change tous les jours, or Remote Config
// demanderait une édition manuelle quotidienne et n'atteindrait les appareils qu'après un
// délai pouvant aller jusqu'à 12 h — le 14 juillet arriverait le 15. Évaluée sur l'appareil,
// la table fonctionne hors connexion et ne demande aucun entretien.
//
// Clés au format MM-JJ. Seules les dates fixes figurent ici : les fêtes mobiles (Pâques,
// Ascension, Pentecôte) supposeraient un calcul calendaire pour un intérêt pédagogique faible
// dans le cadre de l'entretien d'assimilation.
//
// ⚠️ Le bandeau est une ligne courte en petits caractères. Au-delà d'une soixantaine de
// caractères, le texte passe à la ligne et déséquilibre le bas de l'écran.
const DATES_CLES: Record<string, string> = {
  '01-01': "Aujourd'hui, 1er janvier : jour de l'An",
  '01-27': "Aujourd'hui : mémoire des victimes de l'Holocauste",
  '03-08': "Aujourd'hui : journée des droits des femmes",
  '04-21': '21 avril 1944 : les Françaises obtiennent le droit de vote',
  '05-01': "Aujourd'hui, 1er mai : fête du Travail",
  '05-08': '8 mai 1945 : victoire des Alliés en Europe',
  '05-09': "9 mai : journée de l'Europe (déclaration Schuman, 1950)",
  '05-10': "Aujourd'hui : mémoire de l'esclavage et de son abolition",
  '05-27': "Aujourd'hui : journée nationale de la Résistance",
  '06-06': '6 juin 1944 : débarquement de Normandie',
  '06-18': '18 juin 1940 : appel du général de Gaulle',
  '07-14': "Aujourd'hui, 14 juillet : fête nationale",
  '08-26': "26 août 1789 : Déclaration des droits de l'homme",
  '09-21': '21 septembre 1792 : la royauté est abolie',
  '10-04': '4 octobre 1958 : Constitution de la Ve République',
  '11-11': '11 novembre 1918 : armistice de la Grande Guerre',
  '12-09': "9 décembre 1905 : séparation des Églises et de l'État",
  '12-10': "10 décembre : Déclaration universelle des droits de l'homme",
};

// Messages ponctuels, datés à l'année près (AAAA-MM-JJ), pour une occasion qui ne se répète
// pas : un mot aux testeurs, l'annonce d'une nouveauté. Ils s'éteignent d'eux-mêmes une fois
// la date passée — contrairement à une entrée de DATES_CLES, qui reviendrait chaque année et
// s'adresserait un jour à des utilisateurs qui n'y comprendraient rien.
//
// Les entrées périmées peuvent être supprimées au fil de l'eau ; les laisser est sans effet.
const MESSAGES_PONCTUELS: Record<string, string> = {
  '2026-08-18': "Merci beaucoup à mes testeurs, l'appli vit grâce à vous",
  '2026-08-21': 'Bon week-end à mes chers testeurs, profitez bien !',
};

/**
 * Message associé à la date du jour, ou null si elle n'a rien de particulier.
 *
 * Un message ponctuel l'emporte sur une date clé récurrente : s'il a été posé pour une date
 * précise, c'est qu'il concerne cette occasion-là.
 *
 * @param maintenant injectable pour les tests ; par défaut la date locale de l'appareil,
 * qui est bien la référence attendue — c'est le calendrier de l'utilisateur qui compte.
 */
export function messageDateCle(maintenant: Date = new Date()): string | null {
  const annee = String(maintenant.getFullYear());
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');
  return (
    MESSAGES_PONCTUELS[`${annee}-${mois}-${jour}`] ?? DATES_CLES[`${mois}-${jour}`] ?? null
  );
}
