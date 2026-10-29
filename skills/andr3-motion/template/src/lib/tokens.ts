// Tokens visuais do Andr3 News. Uma só fonte de verdade: nenhuma cor ou fonte fora deste ficheiro.
export const FORMATOS = {
  doc: {width: 1920, height: 1080, fps: 30}, // documentários e longos (16:9)
  short: {width: 1080, height: 1920, fps: 30}, // Shorts (9:16)
} as const;
export type Formato = keyof typeof FORMATOS;

export const PALETAS = {
  // Documentários (dark e híbridos): ciano/magenta, sempre planos.
  doc: {fundo: '#111316', papel: '#F4F1EA', tinta: '#15171A', tintaSuave: '#5B5F66', linha: '#3A3E45', texto: '#ECEDEF', textoSuave: '#9AA0A8', acento: '#19B8CC', acento2: '#C2347A', marcador: '#F2D35B'},
  // Shorts e vídeos com cara: amarelo/vermelho.
  short: {fundo: '#141414', papel: '#F6F3EC', tinta: '#141414', tintaSuave: '#5E5E5E', linha: '#3C3C3C', texto: '#F2F2F2', textoSuave: '#A3A3A3', acento: '#F5C518', acento2: '#D7263D', marcador: '#F5D547'},
} as const;
export type Paleta = (typeof PALETAS)[Formato];

// Bebas Neue: títulos e números (Shorts, longos, dark). Anton: títulos dos híbridos.
// Caveat Bold: notas à mão. Source Serif / Inter: só para reconstruir páginas e etiquetas pequenas.
export const FONTES = {
  titulo: 'fonts/BebasNeue-Regular.ttf',
  tituloHibrido: 'fonts/Anton-Regular.ttf',
  nota: 'fonts/Caveat-Bold.ttf',
  serifBold: 'fonts/SourceSerif4-Bold.ttf',
  serif: 'fonts/SourceSerif4-Regular.ttf',
  ui: 'fonts/Inter-SemiBold.ttf',
} as const;
export type NomeFonte = keyof typeof FONTES;

// Cores fixas que não mudam com o formato.
export const FIXAS = {
  caixaFonte: 'rgba(10,11,13,0.88)', // caixa da fonte
  caixaFonteTexto: '#FFFFFF',
  sombra: 'rgba(0,0,0,0.55)', // sombra neutra (nunca colorida)
} as const;
