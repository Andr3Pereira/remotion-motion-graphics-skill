import {Circle, Group, Line, Skia, Text, vec} from '@shopify/react-native-skia';
import {SkiaCanvas} from '@remotion/skia';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {camara, type Chave} from '../lib/camara';
import {quebrar, useTypefaces} from '../lib/fonts';
import {FORMATOS, PALETAS, type Formato} from '../lib/tokens';
import {CaixaFonte, FundoCena, Grao, type Fundo} from '../lib/ui';

// Cronologia: uma linha do tempo num mundo largo; a câmara viaja de data em data.
// Cada evento tem a sua fonte; datas sempre confirmadas no ledger.
export type PropsCronologia = {
  formato: Formato;
  fundo: Fundo;
  eventos: {data: string; texto: string; fonte: string}[];
};

const PASSO = 820, POR_EVENTO = 60, HOLD = 30;
export const metaCronologia = ({props}: {props: PropsCronologia}) => ({
  ...FORMATOS[props.formato],
  durationInFrames: 20 + props.eventos.length * POR_EVENTO + HOLD,
});
const c01 = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Cronologia = (p: PropsCronologia) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const tf = useTypefaces();
  if (!tf) return null;
  const pal = PALETAS[p.formato];
  const curto = p.formato === 'short';
  const fData = Skia.Font(tf.titulo, curto ? 150 : 170);
  const fTxt = Skia.Font(tf.ui, curto ? 46 : 44);
  const Y = 0;
  const n = p.eventos.length;

  const chaves: Chave[] = [{f: 0, x: -120, y: Y + 70, z: curto ? 0.9 : 1.05}];
  p.eventos.forEach((_, i) => {
    const f0 = 20 + i * POR_EVENTO;
    chaves.push({f: f0 + 14, x: i * PASSO + 300, y: Y + 70, z: curto ? 0.95 : 1.1});
    chaves.push({f: f0 + POR_EVENTO - 6, x: i * PASSO + 316, y: Y + 70, z: curto ? 0.96 : 1.12});
  });
  const fim = 20 + n * POR_EVENTO;
  const meio = ((n - 1) * PASSO) / 2 + 300;
  const zGeral = Math.min(1, (width * 0.92) / (n * PASSO));
  chaves.push({f: fim + 16, x: meio, y: Y + 70, z: zGeral}, {f: fim + HOLD, x: meio, y: Y + 70, z: zGeral * 1.01});

  const linhaK = interpolate(frame, [0, fim], [0, 1], c01);
  const atual = Math.min(n - 1, Math.max(0, Math.floor((frame - 20) / POR_EVENTO)));

  return (
    <SkiaCanvas width={width} height={height}>
      <FundoCena fundo={p.fundo} paleta={pal} />
      <Group transform={camara(frame, chaves, width, height)}>
        <Line p1={vec(-200, Y)} p2={vec(-200 + (n * PASSO + 200) * linhaK, Y)} color={pal.linha} strokeWidth={4} />
        {p.eventos.map((e, i) => {
          const f0 = 20 + i * POR_EVENTO;
          const a = interpolate(frame, [f0 + 8, f0 + 22], [0, 1], c01);
          const x = i * PASSO;
          return (
            <Group key={i} opacity={a} transform={[{translateY: (1 - a) * 20}]}>
              <Circle cx={x} cy={Y} r={14} color={pal.acento} />
              <Text x={x} y={Y - 44} text={e.data} font={fData} color={pal.acento} />
              {quebrar(fTxt, e.texto, PASSO - 180).map((l, j) => (
                <Text key={j} x={x} y={Y + 90 + j * (curto ? 60 : 58)} text={l} font={fTxt} color={pal.texto} />
              ))}
            </Group>
          );
        })}
      </Group>
      {frame >= 28 ? (
        <CaixaFonte key={atual} texto={p.eventos[atual].fonte} ui={tf.ui} paleta={pal} frame={frame} entra={28 + atual * POR_EVENTO} altura={height} formato={p.formato} />
      ) : null}
      <Grao frame={frame} fundo={p.fundo} />
    </SkiaCanvas>
  );
};
