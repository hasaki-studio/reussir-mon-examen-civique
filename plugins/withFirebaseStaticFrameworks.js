const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARQUEUR = '# >>> firebase-static-frameworks';

// Pourquoi ce plugin :
//
// expo-build-properties (ios.useFrameworks: "static") fait générer `use_frameworks! :linkage
// => :static` dans le Podfile — nécessaire pour les pods Swift de Firebase (AppCheckCore,
// FirebaseCoreInternal, FirebaseFirestore, FirebaseRemoteConfig), dont les dépendances
// (GoogleUtilities, RecaptchaInterop, FirebaseFirestoreInternal, FirebaseABTesting) ne
// définissent pas de modules :
//
//   The following Swift pods cannot yet be integrated as static libraries:
//   The Swift pod `AppCheckCore` depends upon `GoogleUtilities` and `RecaptchaInterop`,
//   which do not define modules. [...]
//
// Mais `use_frameworks!` seul ne suffit pas : les podspecs de React Native Firebase
// (RNFBApp, RNFBAnalytics, RNFBAppCheck, RNFBFirestore, RNFBRemoteConfig) ne lisent pas ce
// réglage CocoaPods standard. Ils vérifient une variable globale Ruby propre à RNFB,
// `$RNFirebaseAsStaticFramework`, documentée par React Native Firebase pour ce cas précis :
//
//   if defined?($RNFirebaseAsStaticFramework)
//     s.static_framework = $RNFirebaseAsStaticFramework
//   end
//
// Sans cette variable, les cinq podspecs Firebase ignorent le mode statique et échouent à
// l'identique, que useFrameworks soit réglé ou non. Elle doit être définie en tête du
// Podfile, avant tout `use_frameworks!` ou `require`.
const LIGNE = "$RNFirebaseAsStaticFramework = true\n";

module.exports = function withFirebaseStaticFrameworks(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contenu = fs.readFileSync(podfilePath, 'utf-8');
      if (!contenu.includes(MARQUEUR)) {
        contenu = `${MARQUEUR}\n${LIGNE}\n${contenu}`;
        fs.writeFileSync(podfilePath, contenu);
      }
      return config;
    },
  ]);
};
