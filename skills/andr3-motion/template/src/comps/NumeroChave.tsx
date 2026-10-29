import {Group, Line, Skia, Text, vec} from '@shopify/react-native-skia';
import {SkiaCanvas} from '@remotion/skia';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {larguraTexto, numeroPT, useTypefaces} from '../lib/fonts';
import {PERFIS, meta} from '../lib/tokens';
import {CaixaFonte, FundoCena, Grao, caber, type Base} from '../lib/ui';

// Número-chave do ledger (só C ou 🟢). Conta até ao valor e assenta; sincroniza com o impacto sonoro.
export type PropsNumero = Base & {
  valor: number;
  casas: number;
  prefixo: string; // ex.: "+"
  sufixo: string; // ex.: "%", " M€"
  rotulo: string; // o que o número mede, curto
};

export const metaNumero = ({props}: {props: PropsNumero}) => ({...meta(props.perfil, props.fps), durationInFrames: 120});

export const NumeroChave = (p: PropsNumero) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const tf = useTypefaces();
  if (!tf) return null;
  const perfil = PERFIS[p.perfil];
  const {cores, seguro} = perfil;
  const tTit = tf[perfil.fontes.titulo], tTxt = tf[perfil.fontes.texto];

  // 0-10 entrada, 8-44 contagem (desacelera), 44 assenta: é aqui que cai o impacto sonoro.
  const k = interpolate(frame, [8, 44], [0, 1], {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const entra = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  const assenta = interpolate(frame, [44, 52], [1.04, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const final = `${p.prefixo}${numeroPT(p.valor, p.casas)}${p.sufixo}`;
  const atual = `${p.prefixo}${numeroPT(p.valor * k, p.casas)}${p.sufixo}`;
  // O número ocupa o mais possível da zona segura, sem passar 340 px de altura de letra.
  const big = Skia.Font(tTit, caber(tTit, 340, final, seguro.w * 0.92));
  const w = larguraTexto(big, final);
  const cx = seguro.x + seguro.w / 2, cy = seguro.y + seguro.h * 0.46;
  const rot = Skia.Font(tTxt, caber(tTxt, 44, p.rotulo, seguro.w * 0.9));
  const linha = interpolate(frame, [40, 58], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rotA = interpolate(frame, [48, 62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const base = cy + big.getSize() * 0.36;

  return (
    <SkiaCanvas width={width} height={height}>
      <FundoCena p={p} />
      <Group opacity={entra} origin={vec(cx, cy)} transform={[{scale: assenta}, {translateY: (1 - entra) * 24}]}>
        {/* Alinhado à direita do valor FINAL: os algarismos crescem para a esquerda e acaba centrado. */}
        <Text x={cx + w / 2 - larguraTexto(big, atual)} y={base} text={atual} font={big} color={cores.texto} />
        <Line p1={vec(cx - w / 2, base + 40)} p2={vec(cx - w / 2 + w * linha, base + 40)} color={cores.acento} strokeWidth={10} />
      </Group>
      <Text x={cx - larguraTexto(rot, p.rotulo) / 2} y={base + 40 + rot.getSize() * 1.8} text={p.rotulo} font={rot} color={cores.textoSuave} opacity={rotA} />
      <CaixaFonte p={p} texto={p.fonte} ui={tTxt} frame={frame} entra={50} />
      <Grao p={p} frame={frame} />
    </SkiaCanvas>
  );
};
