const { withProjectBuildGradle } = require('expo/config-plugins');

// Marqueur d'idempotence : `expo prebuild` peut rejouer le plugin sur un
// android/build.gradle déjà modifié (sans --clean), on ne veut pas empiler le bloc.
const MARQUEUR = '// >>> compat-metadonnees-kotlin';

// Pourquoi ce contournement :
//
// react-native-google-mobile-ads 16.4.0 épingle le SDK Google play-services-ads 25.4.0,
// que Google compile avec Kotlin 2.3. React Native 0.86 impose Kotlin 2.1.20, et un
// compilateur Kotlin refuse par défaut les métadonnées produites par une version plus
// récente que lui :
//
//   Module was compiled with an incompatible version of Kotlin.
//   The binary version of its metadata is 2.3.0, expected version is 2.1.0.
//
// Monter le projet à Kotlin 2.3.20 règle ce module mais fait planter le compilateur
// ("Internal compiler error") sur expo-modules-core, react-native-gesture-handler et
// react-native-safe-area-context, qui sont compilés depuis les sources et calés sur
// Kotlin 2.1. On reste donc sur 2.1.20 et on lève la seule vérification qui bloque.
//
// Le drapeau désactive un contrôle de version, pas la lecture elle-même : le format des
// métadonnées Kotlin reste compatible à l'intérieur de la ligne 2.x. À retirer dès que
// React Native passera à Kotlin >= 2.3.
//
// Appliqué à tous les modules et non au seul module AdMob : user-messaging-platform
// (dépendance `api`, donc exposée aux modules consommateurs) provient du même lot et
// porte les mêmes métadonnées.
const BLOC = `
${MARQUEUR}
allprojects {
    tasks.configureEach { tache ->
        if (tache.name.startsWith('compile') && tache.name.endsWith('Kotlin')) {
            tache.compilerOptions {
                freeCompilerArgs.add('-Xskip-metadata-version-check')
            }
        }
    }
}
`;

module.exports = function withCompatMetadonneesKotlin(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(
        "withCompatMetadonneesKotlin attend un android/build.gradle en Groovy, reçu : " +
          config.modResults.language
      );
    }
    if (!config.modResults.contents.includes(MARQUEUR)) {
      config.modResults.contents += BLOC;
    }
    return config;
  });
};
