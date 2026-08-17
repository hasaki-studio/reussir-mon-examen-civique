// src/utils/tirageExamen.ts
import { Question } from '../../services/firebase';
import { melanger } from './melanger';

/**
 * Tire les questions d'un examen blanc.
 *
 * Deux partis pris, qui tiennent à ce qu'est un examen blanc.
 *
 * **Tous paliers confondus.** L'examen réel ignore la progression de l'utilisateur : le
 * limiter aux paliers débloqués mentirait sur la difficulté et lui ferait croire qu'il est
 * prêt. Conséquence assumée : l'examen blanc expose du contenu non encore débloqué. C'est le
 * quota d'examens et le Premium qui font barrière, pas le contenu.
 *
 * **Répartition par thème proportionnelle au corpus.** Un tirage purement aléatoire peut
 * livrer douze questions d'histoire et aucune sur les institutions ; deux examens blancs
 * successifs n'auraient alors pas la même difficulté, et le score cesserait de vouloir dire
 * quelque chose.
 */
export function tirerExamen(questions: Question[], nbVoulu: number): Question[] {
  const nb = Math.min(nbVoulu, questions.length);
  if (nb === 0) return [];

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
  // alors au hasard dans ce qui n'a pas été retenu, pour poser bien le nombre annoncé.
  if (tirage.length < nb) {
    const dejaTire = new Set(tirage.map((q) => q.id));
    const complement = melanger(questions.filter((q) => !dejaTire.has(q.id)));
    tirage.push(...complement.slice(0, nb - tirage.length));
  }

  // Mélange final : sans lui, l'examen serait servi thème par thème, ce qui aiderait
  // l'utilisateur autant que cela fausserait la mesure.
  return melanger(tirage);
}
