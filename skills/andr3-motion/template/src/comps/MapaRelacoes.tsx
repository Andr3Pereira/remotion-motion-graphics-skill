import {DashPathEffect, Group, Path, RoundedRect, Skia, Text} from '@shopify/react-native-skia';
import {SkiaCanvas} from '@remotion/skia';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {camara, type Chave} from '../lib/camara';
import {larguraTexto, useTypefaces} from '../lib/fonts';
import {FORMATOS, PALETAS, type Formato} from '../lib/tokens';
import {CaixaFonte, FundoCena, Grao, type Fundo} from '../lib/ui';

// Mapa de relações. SÓ arestas provadas (códigos C ou A do ledger), cada uma com tipo, fonte e data.
// "inspirou" é sempre tracejado: inspiração não é financiamento nem comando.
export type TipoAresta = 'organizou' | 'participou' | 'apoiou' | 'convocou' | 'inspirou';
export type PropsMapa = {
  formato: Formato;
  fundo: Fundo;
  nos: {id: string; rotulo: string; x: number; y: number}[]; // coordenadas do mundo
  arestas: {de: string; para: string; tipo: TipoAresta; fonte: string; data: string}[];
};

const ENTRADA = 30, POR_ARESTA = 54, HOLD = 40;
export const metaMapa = ({props}: {props: PropsMapa}) => ({
  ...FORMATOS[props.formato],
  durationInFrames: ENTRADA + props.arestas.length * POR_ARESTA + HOLD,
});

const NO_H = 112;
const clip01 = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const MapaRelacoes = (p: PropsMapa) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const tf = useTypefaces();
  if (!tf) return null;
  const pal = PALETAS[p.formato];
  const fNo = Skia.Font(tf.titulo, 72);
  const fTipo = Skia.Font(tf.ui, 32);
  const fMeta = Skia.Font(tf.ui, 26);
  const no = Object.fromEntries(p.nos.map((n) => [n.id, {...n, w: larguraTexto(fNo, n.rotulo) + 64}]));

  // Ponto onde a linha centro→centro sai da caixa do nó.
  const borda = (a: (typeof no)[string], bx: number, by: number) => {
    const dx = bx - a.x, dy = by - a.y;
    const s = Math.min(Math.abs((a.w / 2 + 14) / (dx || 1e-6)), Math.abs((NO_H / 2 + 14) / (dy || 1e-6)));
    return {x: a.x + dx * s, y: a.y + dy * s};
  };

  const xs = p.nos.map((n) => n.x), ys = p.nos.map((n) => n.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const zFit = Math.min((width * 0.86) / (Math.max(...xs) - Math.min(...xs) + 480), (height * 0.8) / (Math.max(...ys) - Math.min(...ys) + 220));
  // Câmara: deriva suave para cada aresta nova (35% do caminho), nunca salta.
  const chaves: Chave[] = [{f: 0, x: cx, y: cy, z: zFit * 0.95}, {f: ENTRADA, x: cx, y: cy, z: zFit}];
  p.arestas.forEach((a, i) => {
    const mx = (no[a.de].x + no[a.para].x) / 2, my = (no[a.de].y + no[a.para].y) / 2;
    const f0 = ENTRADA + i * POR_ARESTA;
    chaves.push({f: f0 + 16, x: cx + (mx - cx) * 0.35, y: cy + (my - cy) * 0.35, z: zFit * 1.08});
    chaves.push({f: f0 + POR_ARESTA - 4, x: cx + (mx - cx) * 0.35, y: cy + (my - cy) * 0.35, z: zFit * 1.09});
  });
  const fimA = ENTRADA + p.arestas.length * POR_ARESTA;
  chaves.push({f: fimA + 18, x: cx, y: cy, z: zFit}, {f: fimA + HOLD, x: cx, y: cy, z: zFit * 1.005});

  const ativa = Math.min(p.arestas.length - 1, Math.max(0, Math.floor((frame - ENTRADA) / POR_ARESTA)));

  return (
    <SkiaCanvas width={width} height={height}>
      <FundoCena fundo={p.fundo} paleta={pal} />
      <Group transform={camara(frame, chaves, width, height)}>
        {p.arestas.map((a, i) => {
          const f0 = ENTRADA + i * POR_ARESTA + 6;
          const k = interpolate(frame, [f0, f0 + 22], [0, 1], clip01);
          if (k <= 0) return null;
          const A = borda(no[a.de], no[a.para].x, no[a.para].y), B = borda(no[a.para], no[a.de].x, no[a.de].y);
          const linha = Skia.PathBuilder.Make().moveTo(A.x, A.y).lineTo(B.x, B.y).build();
          const ang = Math.atan2(B.y - A.y, B.x - A.x);
          const ponta = Skia.PathBuilder.Make()
            .moveTo(B.x, B.y)
            .lineTo(B.x - 26 * Math.cos(ang - 0.42), B.y - 26 * Math.sin(ang - 0.42))
            .moveTo(B.x, B.y)
            .lineTo(B.x - 26 * Math.cos(ang + 0.42), B.y - 26 * Math.sin(ang + 0.42))
            .build();
          const cor = a.tipo === 'inspirou' ? pal.textoSuave : pal.acento;
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          const et = a.tipo.toUpperCase();
          const meta = `${a.fonte} · ${a.data}`;
          const lw = Math.max(larguraTexto(fTipo, et), larguraTexto(fMeta, meta));
          const tA = interpolate(frame, [f0 + 16, f0 + 28], [0, 1], clip01);
          return (
            <Group key={i}>
              <Path path={linha} style="stroke" strokeWidth={5} color={cor} end={k} strokeCap="round">
                {a.tipo === 'inspirou' ? <DashPathEffect intervals={[18, 14]} /> : null}
              </Path>
              <Path path={ponta} style="stroke" strokeWidth={5} color={cor} strokeCap="round" opacity={k >= 1 ? 1 : 0} />
              <Group opacity={tA}>
                {/* Uma só etiqueta opaca (tipo + fonte/data) para nunca cruzar as linhas. */}
                <RoundedRect x={mx - lw / 2 - 18} y={my - 34} width={lw + 36} height={94} r={4} color={pal.fundo} />
                <Text x={mx - larguraTexto(fTipo, et) / 2} y={my + 4} text={et} font={fTipo} color={cor} />
                <Text x={mx - larguraTexto(fMeta, meta) / 2} y={my + 48} text={meta} font={fMeta} color={pal.textoSuave} />
              </Group>
            </Group>
          );
        })}
        {p.nos.map((n, i) => {
          const a = interpolate(frame, [4 + i * 5, 18 + i * 5], [0, 1], clip01);
          const N = no[n.id];
          return (
            <Group key={n.id} opacity={a} transform={[{translateY: (1 - a) * 18}]}>
              <RoundedRect x={n.x - N.w / 2} y={n.y - NO_H / 2} width={N.w} height={NO_H} r={6} color={pal.papel} />
              <Text x={n.x - N.w / 2 + 32} y={n.y + 26} text={n.rotulo} font={fNo} color={pal.tinta} />
            </Group>
          );
        })}
      </Group>
      {frame >= ENTRADA + 22 ? (
        <CaixaFonte key={ativa} texto={`${p.arestas[ativa].fonte}, ${p.arestas[ativa].data}`} ui={tf.ui} paleta={pal} frame={frame} entra={ENTRADA + ativa * POR_ARESTA + 22} altura={height} formato={p.formato} />
      ) : null}
      <Grao frame={frame} fundo={p.fundo} />
    </SkiaCanvas>
  );
};
