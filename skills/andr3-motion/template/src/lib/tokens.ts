// Perfis do Andr3 News: um por linha de produção, com os valores das skills de edição.
// Única casa das cores, fontes e medidas. Nenhuma cor ou fonte fora deste ficheiro.
//
// largura/altura: espaço de desenho. O render sai com --scale=2 (escala), a 4K ou 2160x1920.
// fps: cadência da câmara (25 por defeito; os dados podem trocar com "fps": 30).

export const FONTES = {
  bebas: 'fonts/BebasNeue-Regular.ttf',
  caveat: 'fonts/Caveat-Bold.ttf',
  montBlack: 'fonts/Montserrat-Black.ttf',
  montSemi: 'fonts/Montserrat-SemiBold.ttf',
  serifBold: 'fonts/SourceSerif4-Bold.ttf', // só para a página fictícia de teste
  serif: 'fonts/SourceSerif4-Regular.ttf',
} as const;
export type NomeFonte = keyof typeof FONTES;

type Rect = {x: number; y: number; w: number; h: number};
type Perfil = {
  linha: string;
  largura: number;
  altura: number;
  escala: number;
  fps: number;
  // Zona onde o texto pode estar (fora dela, a interface do telemóvel ou as legendas tapam).
  seguro: Rect;
  // Onde vive a captura do Destaque (nos longos é o PiP à direita, a cara fica à esquerda).
  areaCaptura: Rect;
  fundoPadrao: 'escuro' | 'transparente';
  cores: {fundo: string; papel: string; tinta: string; tintaSuave: string; linha: string; texto: string; textoSuave: string; acento: string; destaque: string; marcador: string};
  fontes: {titulo: NomeFonte; texto: NomeFonte; nota: NomeFonte};
  grao: number;
};

// Shorts e longos: marca de notícia (fcp-shorts-noticias / fcp-longos-noticias).
const NOTICIA = {
  cores: {fundo: '#111214', papel: '#F6F3EC', tinta: '#111214', tintaSuave: '#5E5E5E', linha: '#3C3C3C', texto: '#FFFFFF', textoSuave: '#C4C4C4', acento: '#FFD400', destaque: '#E10600', marcador: '#FFD400'},
  fontes: {titulo: 'montBlack', texto: 'montSemi', nota: 'montSemi'},
} as const;

// Documentários (dark e híbridos): ciano/magenta do estúdio e da intro; Bebas + Caveat.
const DOC = {
  cores: {fundo: '#0D0F17', papel: '#F2EEE5', tinta: '#08090E', tintaSuave: '#565B6B', linha: '#2A2F45', texto: '#F2EEE5', textoSuave: '#8A8FA3', acento: '#18C8FF', destaque: '#FF2D78', marcador: '#FF2D78'},
  fontes: {titulo: 'bebas', texto: 'bebas', nota: 'caveat'},
} as const;

export const PERFIS = {
  // Painel da metade de cima do Short (2160x1920). Zona segura: 320 px de lado e capturas a
  // partir dos 390 px do topo (a 2x: 160 e 195). Em baixo fica a linha das legendas: 90 livres.
  short: {linha: 'Shorts', largura: 1080, altura: 960, escala: 2, fps: 25, seguro: {x: 160, y: 195, w: 760, h: 675}, areaCaptura: {x: 0, y: 0, w: 1080, h: 960}, fundoPadrao: 'escuro', ...NOTICIA, grao: 0.1},
  // Longos horizontais (3840x2160). A captura entra no PiP (x 2140..3790 a 4K) com fundo transparente.
  longo: {linha: 'Longos', largura: 1920, altura: 1080, escala: 2, fps: 25, seguro: {x: 96, y: 80, w: 1728, h: 920}, areaCaptura: {x: 1070, y: 70, w: 825, h: 940}, fundoPadrao: 'transparente', ...NOTICIA, grao: 0},
  // Documentários dark (fcp-doc-motion): 1920x1080 a 25p, render a 4K.
  dark: {linha: 'Docs dark', largura: 1920, altura: 1080, escala: 2, fps: 25, seguro: {x: 96, y: 80, w: 1728, h: 920}, areaCaptura: {x: 0, y: 0, w: 1920, h: 1080}, fundoPadrao: 'escuro', ...DOC, grao: 0.13},
  // Documentários híbridos (_kit_hibrido): igual ao dark; os títulos e a fonte vão como títulos do FCP.
  hibrido: {linha: 'Docs híbridos', largura: 1920, altura: 1080, escala: 2, fps: 25, seguro: {x: 96, y: 80, w: 1728, h: 920}, areaCaptura: {x: 0, y: 0, w: 1920, h: 1080}, fundoPadrao: 'escuro', ...DOC, grao: 0.13},
} as const satisfies Record<string, Perfil>;
export type NomePerfil = keyof typeof PERFIS;
export type Cores = (typeof PERFIS)[NomePerfil]['cores'];

// Cores fixas que não mudam com o perfil.
export const FIXAS = {
  caixaFonte: 'rgba(10,11,13,0.88)', // caixa da fonte (só quando desenhada no vídeo)
  caixaFonteTexto: '#FFFFFF',
  sombra: 'rgba(0,0,0,0.55)', // sombra neutra (nunca colorida)
} as const;

// Metadados comuns: dimensões e cadência do perfil (os dados podem trocar a cadência).
export const meta = (perfil: NomePerfil, fps?: number) => {
  const p = PERFIS[perfil];
  return {width: p.largura, height: p.altura, fps: fps ?? p.fps};
};
