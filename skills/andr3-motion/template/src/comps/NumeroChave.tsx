import {Group, Line, Text, Skia, vec} from '@shopify/react-native-skia';
import {SkiaCanvas} from '@remotion/skia';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {larguraTexto, numeroPT, useTypefaces} from '../lib/fonts';
import {FORMATOS, PALETAS, type Formato} from '../lib/tokens';
import {CaixaFonte, FundoCena, Grao, type Fundo} from '../lib/ui';

// Número-chave do ledger (só C ou 🟢). Conta até ao valor e assenta; sincroniza com numero() do som.
export type PropsNumero = {
  formato: Formato;
  fundo: Fundo;
  valor: number;
  casas: number;
  prefixo: string; // ex.: "+"
  sufixo: string; // ex.: "%", " M€"
  rotulo: string; // o que o número mede, curto
  fonte: string;
};

export const metaNumero = ({props}: {props: PropsNumero}) => ({...FORMATOS[props.formato], durationInFrames: 120});

export const NumeroChave = (p: PropsNumero) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const tf = useTypefaces();
  if (!tf) return null;
  const pal = PALETAS[p.formato];
  const curto = p.formato === 'short';

  // 0-8 entrada, 8-44 contagem (desacelera), 44+ assenta. O impacto sonoro cai no frame 44.
  const k = interpolate(frame, [8, 44], [0, 1], {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const entra = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  const assenta = interpolate(frame, [44, 52], [1.04, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // Alinhado à direita do valor FINAL: os algarismos crescem para a esquerda, como um contador,
  // e o número acaba centrado sem saltar.
  const big = Skia.Font(tf.titulo, curto ? 300 : 340);
  const final = `${p.prefixo}${numeroPT(p.valor, p.casas)}${p.sufixo}`;
  const atual = `${p.prefixo}${numeroPT(p.valor * k, p.casas)}${p.sufixo}`;
  const w = larguraTexto(big, final);
  const cx = width / 2, cy = height * (curto ? 0.42 : 0.5);
  const rot = Skia.Font(tf.ui, curto ? 44 : 40);
  const linha = interpolate(frame, [40, 58], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rotA = interpolate(frame, [48, 62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <SkiaCanvas width={width} height={height}>
      <FundoCena fundo={p.fundo} paleta={pal} />
      <Group opacity={entra} origin={vec(cx, cy)} transform={[{scale: assenta}, {translateY: (1 - entra) * 24}]}>
        <Text x={cx + w / 2 - larguraTexto(big, atual)} y={cy + 110} text={atual} font={big} color={pal.texto} />
        <Line p1={vec(cx - w / 2, cy + 150)} p2={vec(cx - w / 2 + w * linha, cy + 150)} color={pal.acento} strokeWidth={10} />
      </Group>
      <Text x={cx - larguraTexto(rot, p.rotulo) / 2} y={cy + 230} text={p.rotulo} font={rot} color={pal.textoSuave} opacity={rotA} />
      <CaixaFonte texto={p.fonte} ui={tf.ui} paleta={pal} frame={frame} entra={50} altura={height} formato={p.formato} />
      <Grao frame={frame} fundo={p.fundo} />
    </SkiaCanvas>
  );
};
