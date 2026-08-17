// src/utils/tirageExamen.ts
import { Question } from '../../services/firebase';
import { melanger } from './melanger';

export type QuotasExamen = {
  nbQuestions: number;
  /** Mises en situation à poser ; le reste est constitué de questions simples. */
  nbSituations: number;
};

/**
 * Tire `nb` questions en respectant la répartition par thème du corpus fourni.
 *
 * Un tirage purement aléatoire peut livrer douze questions d'histoire et aucune sur les
 * institutions ; deux examens blancs successifs n'auraient alors pas la même difficulté, et le
 * score cesserait de vouloir dire quelque chose.
 */
function tirerParTheme(questions: Question[], nb: number): Question[] {
  if (nb <= 0 || questions.length === 0) return [];
  if (nb >= questions.length) return [...questions];

  const parTheme = new Map<string, Question[]>();
  for (const q of questions) {
    const liste = parTheme.get(q.theme);
    if (liste) liste.push(q);
    else parTheme.set(q.theme, [q]);
  }

  // Quota entier par thème, puis attribution des places restantes aux thèmes dont la part
  // décimale a été le plus rognée — c'est la répartition au plus fort reste, qui évite qu'un
  // arrondi systématique vers le bas ne prive toujours les mêmes thèmes.
  const parts = [...parTheme.entries()].map(([theme, liste]) => {
    const exact = (liste.length / questions.length) * nb;
    return { theme, liste, quota: Math.floor(exact), reste: exact - Math.floor(exact) };
  });

  let placesRestantes = nb - parts.reduce((total, p) => total + p.quota, 0);
  for (const part of [...parts].sort((a, b) => b.reste - a.reste)) {
    if (placesRestantes === 0) break;
    if (part.quota < part.liste.length) {
      part.quota += 1;
      placesRestantes -= 1;
    }
  }

  const tirage = parts.flatMap((p) => melanger(p.liste).slice(0, p.quota));

  // Un thème peut compter moins de questions que son quota (corpus déséquilibré) : on complète
  // alors au hasard dans ce qui n'a pas été retenu, pour poser bien le nombre attendu.
  if (tirage.length < nb) {
    const dejaTire = new Set(tirage.map((q) => q.id));
    const complement = melanger(questions.filter((q) => !dejaTire.has(q.id)));
    tirage.push(...complement.slice(0, nb - tirage.length));
  }

  return tirage;
}

/**
 * Compose un examen blanc.
 *
 * **La règle des deux formes est respectée** : autant de mises en situation que l'examen réel
 * en comporte, le reste en questions de connaissance. C'est ce qui distingue l'examen blanc du
 * mode révision, où le tirage reste libre — s'entraîner ne demande pas de reproduire le format,
 * se tester si.
 *
 * **Tous paliers confondus.** L'examen réel ignore la progression de l'utilisateur : le limiter
 * aux paliers débloqués mentirait sur la difficulté et lui ferait croire qu'il est prêt.
 * Conséquence assumée : l'examen blanc expose du contenu non encore débloqué. C'est le quota
 * d'examens et le Premium qui font barrière, pas le contenu.
 *
 * **Chaque forme est tirée en respectant la répartition par thème de son propre corpus**, et
 * non celle du corpus entier : les mises en situation ne couvrent pas forcément les mêmes
 * thèmes que les questions de connaissance.
 */
export function tirerExamen(questions: Question[], quotas: QuotasExamen): Question[] {
  const total = Math.min(quotas.nbQuestions, questions.length);
  if (total === 0) return [];

  const situations = questions.filter((q) => q.type === 'situation');
  const simples = questions.filter((q) => q.type === 'simple');

  // Le quota est borné par ce que le corpus contient réellement. Tant que les mises en
  // situation ne sont pas toutes écrites, l'examen blanc en pose moins que la règle et se
  // complète en questions simples : mieux vaut un examen au bon format numérique, un peu trop
  // léger sur une forme, qu'un examen tronqué à vingt questions.
  const nbSituations = Math.min(quotas.nbSituations, total, situations.length);
  const nbSimples = Math.min(total - nbSituations, simples.length);

  const tirage = [
    ...tirerParTheme(situations, nbSituations),
    ...tirerParTheme(simples, nbSimples),
  ];

  if (tirage.length < total) {
    const dejaTire = new Set(tirage.map((q) => q.id));
    const complement = melanger(questions.filter((q) => !dejaTire.has(q.id)));
    tirage.push(...complement.slice(0, total - tirage.length));
  }

  // Mélange final : sans lui, l'examen serait servi forme par forme puis thème par thème, ce
  // qui aiderait l'utilisateur autant que cela fausserait la mesure.
  return melanger(tirage);
}
