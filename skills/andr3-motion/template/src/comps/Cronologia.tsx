import {Circle, Group, Line, Skia, Text, vec} from '@shopify/react-native-skia';
import {SkiaCanvas} from '@remotion/skia';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {camara, type Chave} from '../lib/camara';
import {quebrar, useTypefaces} from '../lib/fonts';
import {PERFIS, meta} from '../lib/tokens';
import {CaixaFonte, FundoCena, Grao, type Base} from '../lib/ui';

// Cronologia: uma linha do tempo num mundo largo; a câmara viaja de data em data.
// Cada evento tem a sua fonte; datas sempre confirmadas no ledger.
export type PropsCronologia = Base & {
  eventos: {data: string; texto: string; fonte: string}[];
};

const POR_EVENTO = 60, HOLD = 30;
export const metaCronologia = ({props}: {props: PropsCronologia}) => ({
  ...meta(props.perfil, props.fps),
  durationInFrames: 20 + props.eventos.length * POR_EVENTO + HOLD,
});
const c01 = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Cronologia = (p: PropsCronologia) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const tf = useTypefaces();
  if (!tf) return null;
  const perfil = PERFIS[p.perfil];
  const {cores, seguro} = perfil;
  const curto = p.perfil === 'short';
  // Medidas em píxeis de ecrã a zoom 1: cada evento ocupa ~43% da zona segura (Short: quase toda).
  const PASSO = curto ? seguro.w * 0.92 : seguro.w * 0.43;
  const fData = Skia.Font(tf[perfil.fontes.titulo], curto ? 130 : 160);
  const fTxt = Skia.Font(tf[perfil.fontes.texto], curto ? 40 : 42);
  const LH = fTxt.getSize() * 1.32;
  const n = p.eventos.length;
  const Y = 0, focoY = Y + fTxt.getSize() * 1.5;
  const dx = PASSO * 0.36; // o foco fica a meio do bloco de texto do evento

  const chaves: Chave[] = [{f: 0, x: -PASSO * 0.25, y: focoY, z: 0.96}];
  p.eventos.forEach((_, i) => {
    const f0 = 20 + i * POR_EVENTO;
    chaves.push({f: f0 + 14, x: i * PASSO + dx, y: focoY, z: 1});
    chaves.push({f: f0 + POR_EVENTO - 6, x: i * PASSO + dx + 16, y: focoY, z: 1.015});
  });
  const fim = 20 + n * POR_EVENTO;
  const meio = ((n - 1) * PASSO) / 2 + dx;
  const zGeral = Math.min(1, seguro.w / (n * PASSO));
  chaves.push({f: fim + 16, x: meio, y: focoY, z: zGeral}, {f: fim + HOLD, x: meio, y: focoY, z: zGeral * 1.01});

  const linhaK = interpolate(frame, [0, fim], [0, 1], c01);
  const atual = Math.min(n - 1, Math.max(0, Math.floor((frame - 20) / POR_EVENTO)));

  return (
    <SkiaCanvas width={width} height={height}>
      <FundoCena p={p} />
      <Group transform={[{translateX: seguro.x}, {translateY: seguro.y}, ...camara(frame, chaves, seguro.w, seguro.h)]}>
        <Line p1={vec(-PASSO * 0.3, Y)} p2={vec(-PASSO * 0.3 + (n * PASSO) * linhaK, Y)} color={cores.linha} strokeWidth={4} />
        {p.eventos.map((e, i) => {
          const f0 = 20 + i * POR_EVENTO;
          const a = interpolate(frame, [f0 + 8, f0 + 22], [0, 1], c01);
          const x = i * PASSO;
          return (
            <Group key={i} opacity={a} transform={[{translateY: (1 - a) * 20}]}>
              <Circle cx={x} cy={Y} r={14} color={cores.acento} />
              <Text x={x} y={Y - 44} text={e.data} font={fData} color={cores.acento} />
              {quebrar(fTxt, e.texto, PASSO * 0.82).map((l, j) => (
                <Text key={j} x={x} y={Y + fTxt.getSize() * 2 + j * LH} text={l} font={fTxt} color={cores.texto} />
              ))}
            </Group>
          );
        })}
      </Group>
      {frame >= 28 ? (
        <CaixaFonte key={atual} p={p} texto={p.eventos[atual].fonte} ui={tf[perfil.fontes.texto]} frame={frame} entra={28 + atual * POR_EVENTO} />
      ) : null}
      <Grao p={p} frame={frame} />
    </SkiaCanvas>
  );
};
