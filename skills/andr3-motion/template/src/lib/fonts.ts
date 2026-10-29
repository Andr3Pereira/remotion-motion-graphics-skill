import {Skia, type SkTypeface} from '@shopify/react-native-skia';
import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {FONTES, type NomeFonte} from './tokens';

// Carrega os TTF de public/fonts como typefaces Skia. O render espera até estarem prontos.
export const useTypefaces = (): Record<NomeFonte, SkTypeface> | null => {
  const [faces, setFaces] = useState<Record<NomeFonte, SkTypeface> | null>(null);
  const [handle] = useState(() => delayRender('fontes Skia'));
  useEffect(() => {
    (async () => {
      const out: Partial<Record<NomeFonte, SkTypeface>> = {};
      for (const [nome, ficheiro] of Object.entries(FONTES) as [NomeFonte, string][]) {
        const data = await Skia.Data.fromURI(staticFile(ficheiro));
        const tf = Skia.Typeface.MakeFreeTypeFaceFromData(data);
        if (!tf) throw new Error(`Fonte inválida: ${ficheiro}`);
        out[nome] = tf;
      }
      setFaces(out as Record<NomeFonte, SkTypeface>);
      continueRender(handle);
    })();
  }, [handle]);
  return faces;
};

// Largura de avanço real (não a caixa de tinta), para alinhar marcadores ao texto.
export const larguraTexto = (font: ReturnType<typeof Skia.Font>, texto: string) =>
  font.getGlyphWidths(font.getGlyphIDs(texto)).reduce((a, b) => a + b, 0);

// Quebra de linha por largura. "\n" no texto força quebra (preferir quebras intencionais).
export const quebrar = (font: ReturnType<typeof Skia.Font>, texto: string, max: number): string[] => {
  const out: string[] = [];
  for (const par of texto.split('\n')) {
    let linha = '';
    for (const p of par.split(' ')) {
      const t = linha ? `${linha} ${p}` : p;
      if (linha && larguraTexto(font, t) > max) {
        out.push(linha);
        linha = p;
      } else linha = t;
    }
    out.push(linha);
  }
  return out;
};

// Números à portuguesa: espaço nos milhares, vírgula nas décimas (12 121 · 7,49).
export const numeroPT = (v: number, casas = 0) => {
  const [int, dec] = Math.abs(v).toFixed(casas).split('.');
  const milhares = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${v < 0 ? '−' : ''}${milhares}${dec ? `,${dec}` : ''}`;
};
