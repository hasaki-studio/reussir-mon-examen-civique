// src/hooks/useAnalyticsScreenTracking.ts
import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { logScreenView } from '../services/analytics';
import { estQuizz } from '../config/quizz';

const ECRAN_PAR_ROUTE: Record<string, string> = {
  '/': 'selection_quizz',
  '/mentions': 'mentions_legales',
  '/conseils': 'conseils_revision',
  '/[quizz]': 'accueil_quizz',
  '/[quizz]/themes': 'themes_detail',
  '/[quizz]/liste': 'liste_questions',
  '/[quizz]/quiz': 'question',
  '/[quizz]/resultat': 'resultat_examen',
};

/**
 * Remplace le quizz par son emplacement dans le chemin : `/cr/quiz` devient `/[quizz]/quiz`.
 *
 * Sans cette normalisation, chaque écran existerait en trois versions dans les rapports, et il
 * faudrait les additionner à la main pour savoir combien de personnes ont vu l'écran de
 * question. Le quizz n'est pas perdu pour autant : il est joint à chaque événement en
 * paramètre, ce qui permet de ventiler quand on le souhaite.
 */
function normaliser(pathname: string): string {
  const segments = pathname.split('/');
  if (estQuizz(segments[1])) segments[1] = '[quizz]';
  return segments.join('/');
}

export function useAnalyticsScreenTracking() {
  const pathname = usePathname();
  const dernierEcran = useRef<string | null>(null);

  useEffect(() => {
    const route = normaliser(pathname);
    const ecran = ECRAN_PAR_ROUTE[route] ?? route;
    if (ecran === dernierEcran.current) return;
    dernierEcran.current = ecran;
    logScreenView(ecran);
  }, [pathname]);
}
