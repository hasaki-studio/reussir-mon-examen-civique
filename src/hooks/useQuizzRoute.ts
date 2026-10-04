// src/hooks/useQuizzRoute.ts
import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { estQuizz, type Quizz } from '../config/quizz';
import { definirQuizzAnalytics } from '../services/analytics';

/**
 * Lit le quizz porté par la route (`/[quizz]/…`), le valide, et le déclare à Analytics.
 *
 * Le quizz vit dans l'URL plutôt que dans un contexte global : la navigation reste la seule
 * source de vérité, et un retour arrière ne peut pas désynchroniser l'écran affiché de l'état
 * mesuré. En contrepartie, la valeur est une chaîne quelconque — un lien profond forgé ou
 * périmé peut apporter n'importe quoi — d'où la validation, et le `null` que les écrans
 * traduisent par un retour à la sélection.
 */
export function useQuizzRoute(): Quizz | null {
  const { quizz } = useLocalSearchParams<{ quizz?: string }>();
  const valide = estQuizz(quizz) ? quizz : null;

  useEffect(() => {
    definirQuizzAnalytics(valide);
  }, [valide]);

  return valide;
}
