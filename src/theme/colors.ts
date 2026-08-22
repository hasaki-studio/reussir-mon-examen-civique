export const couleurs = {
  bleuNuit: '#1C2B49',
  bleuNuit2: '#243a63',
  blancCasse: '#F6F3EC',
  papier: '#FCFAF5',
  rouge: '#A62B2B',
  or: '#9C7A3C',
  ardoise: '#5B6472',
  ligne: '#DEDACD',
  ok: '#3E6B4F',
};

const couleursTheme: Record<string, string> = {
  'Principes et valeurs de la République': '#9C7A3C',
  'Système institutionnel et politique': '#1C2B49',
  'Droits et devoirs des citoyens': '#3E6B4F',
  'Histoire, géographie et culture': '#A62B2B',
  'Vivre dans la société française': '#5B4B8A',
};

export function couleurTheme(theme: string): string {
  return couleursTheme[theme] ?? couleurs.ardoise;
}