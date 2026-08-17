// Import par sous-chemin et non depuis la racine du paquet : l'index racine fait un
// require() de chaque graisse, ce qui embarquerait les 18 fichiers .ttf de chaque famille.
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_400Regular_Italic } from '@expo-google-fonts/inter/400Regular_Italic';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';

// Passé à useFonts() dans app/_layout.tsx : la clé devient la valeur de fontFamily.
export const POLICES_A_CHARGER = {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Inter_400Regular,
  Inter_400Regular_Italic,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
};

// Une famille par graisse : contrairement au web, React Native ne dérive pas
// une graisse d'un fichier de police, il faut désigner le bon fichier.
export const polices = {
  texte: 'Inter_400Regular',
  texteItalique: 'Inter_400Regular_Italic',
  texteMoyen: 'Inter_500Medium',
  texteSemiGras: 'Inter_600SemiBold',
  texteGras: 'Inter_700Bold',
  titre: 'Fraunces_600SemiBold',
  titreGras: 'Fraunces_700Bold',
} as const;
