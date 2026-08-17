const { withAppBuildGradle } = require('expo/config-plugins');

const MARQUEUR = '// >>> signature-release';

// Pourquoi ce plugin :
//
// Le gabarit Expo signe les builds de release avec la clé de DEBUG (voir le commentaire
// « Caution! In production, you need to generate your own keystore file » dans le fichier
// généré). Google Play rejette tout livrable signé ainsi. Comme android/ est régénéré à chaque
// `expo prebuild`, corriger le fichier à la main serait effacé au build suivant : la correction
// doit donc vivre dans un plugin de configuration.
//
// Les identifiants ne sont volontairement PAS dans le dépôt. Ils sont lus depuis les propriétés
// Gradle, à déclarer dans le fichier utilisateur %USERPROFILE%\.gradle\gradle.properties (ou
// ~/.gradle/gradle.properties), hors du projet : il survit aux prebuild, n'est jamais commité,
// et le magasin de clés reste stocké ailleurs que dans le dépôt.
//
//   HASAKI_UPLOAD_STORE_FILE=C:/dev/cles/hasaki-upload.jks
//   HASAKI_UPLOAD_STORE_PASSWORD=...
//   HASAKI_UPLOAD_KEY_ALIAS=upload
//   HASAKI_UPLOAD_KEY_PASSWORD=...
//
// En l'absence de ces propriétés, la signature retombe sur la clé de debug : un développeur
// sans magasin de clés peut continuer à produire des builds locaux sans rien configurer.

const ANCRE_SIGNING_CONFIGS = `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }`;

const BLOC_SIGNING_CONFIG = `${ANCRE_SIGNING_CONFIGS}
        ${MARQUEUR}
        release {
            if (project.hasProperty('HASAKI_UPLOAD_STORE_FILE')) {
                storeFile file(HASAKI_UPLOAD_STORE_FILE)
                storePassword HASAKI_UPLOAD_STORE_PASSWORD
                keyAlias HASAKI_UPLOAD_KEY_ALIAS
                keyPassword HASAKI_UPLOAD_KEY_PASSWORD
            }
        }`;

const ANCRE_BUILD_TYPE = `            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig = signingConfigs.debug`;

const BLOC_BUILD_TYPE = `            ${MARQUEUR}
            // Clé d'upload si elle est configurée, clé de debug sinon (builds locaux).
            signingConfig = project.hasProperty('HASAKI_UPLOAD_STORE_FILE')
                ? signingConfigs.release
                : signingConfigs.debug`;

module.exports = function withSignatureRelease(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(
        'withSignatureRelease attend un android/app/build.gradle en Groovy, reçu : ' +
          config.modResults.language
      );
    }

    let contenu = config.modResults.contents;
    if (contenu.includes(MARQUEUR)) return config;

    // Échouer bruyamment plutôt que produire un livrable signé en debug sans le dire : une
    // évolution du gabarit Expo doit interrompre le build, pas passer inaperçue.
    if (!contenu.includes(ANCRE_SIGNING_CONFIGS) || !contenu.includes(ANCRE_BUILD_TYPE)) {
      throw new Error(
        "withSignatureRelease : le gabarit Expo a changé, les ancres de signature sont " +
          'introuvables dans android/app/build.gradle. Le plugin doit être mis à jour, sinon ' +
          'la release serait signée avec la clé de debug et rejetée par Google Play.'
      );
    }

    contenu = contenu.replace(ANCRE_SIGNING_CONFIGS, BLOC_SIGNING_CONFIG);
    contenu = contenu.replace(ANCRE_BUILD_TYPE, BLOC_BUILD_TYPE);
    config.modResults.contents = contenu;
    return config;
  });
};
