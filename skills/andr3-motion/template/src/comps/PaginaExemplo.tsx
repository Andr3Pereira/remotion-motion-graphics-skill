import {Fill, Line, Skia, Text, vec} from '@shopify/react-native-skia';
import {SkiaCanvas} from '@remotion/skia';
import {useTypefaces} from '../lib/fonts';
import {PALETAS} from '../lib/tokens';

// Página FICTÍCIA usada só para testar o template sem depender da internet.
// Nos docs, a imagem vem sempre de uma captura real feita pelo capturar.js.
export const PAGINA = {w: 1400, h: 1100};
export const CORPO = [
  'Este texto é um exemplo e não descreve factos reais.',
  'Serve apenas para testar o destaque sobre uma captura.',
  'Na produção, a imagem vem sempre de uma página real,',
  'capturada pelo capturar.js e citada na caixa de fonte,',
  'com as caixas de destaque medidas no próprio site.',
];

export const PaginaExemplo = () => {
  const tf = useTypefaces();
  if (!tf) return null;
  const P = PALETAS.doc;
  const f = (n: keyof typeof tf, s: number) => Skia.Font(tf[n], s);
  return (
    <SkiaCanvas width={PAGINA.w} height={PAGINA.h}>
      <Fill color={P.papel} />
      <Text x={110} y={120} text="JORNAL EXEMPLO" font={f('serifBold', 52)} color={P.tinta} />
      <Line p1={vec(110, 160)} p2={vec(1290, 160)} color={P.tinta} strokeWidth={3} />
      <Text x={110} y={240} text="EXEMPLO · PÁGINA DE TESTE" font={f('ui', 24)} color={P.tintaSuave} />
      <Text x={110} y={350} text="Uma página fictícia para" font={f('serifBold', 84)} color={P.tinta} />
      <Text x={110} y={450} text="testar os destaques" font={f('serifBold', 84)} color={P.tinta} />
      <Text x={110} y={530} text="Por Andr3 News · ficheiro de teste" font={f('ui', 24)} color={P.tintaSuave} />
      {CORPO.map((l, i) => (
        <Text key={i} x={110} y={640 + i * 58} text={l} font={f('serif', 38)} color={P.tinta} />
      ))}
    </SkiaCanvas>
  );
};
