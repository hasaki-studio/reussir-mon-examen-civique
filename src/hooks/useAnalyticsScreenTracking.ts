// src/hooks/useAnalyticsScreenTracking.ts
import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { logScreenView } from '../services/analytics';

const ECRAN_PAR_ROUTE: Record<string, string> = {
  '/': 'accueil',
  '/mentions': 'mentions_legales',
  '/conseils': 'conseils_revision',
  '/themes': 'themes_detail',
  '/liste': 'liste_questions',
  '/quiz': 'question',
};

export function useAnalyticsScreenTracking() {
  const pathname = usePathname();
  const dernierEcran = useRef<string | null>(null);

  useEffect(() => {
    const ecran = ECRAN_PAR_ROUTE[pathname] ?? pathname;
    if (ecran === dernierEcran.current) return;
    dernierEcran.current = ecran;
    logScreenView(ecran);
  }, [pathname]);
}
