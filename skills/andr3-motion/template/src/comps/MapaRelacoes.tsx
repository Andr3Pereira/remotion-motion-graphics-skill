import {DashPathEffect, Group, Path, RoundedRect, Skia, Text} from '@shopify/react-native-skia';
import {SkiaCanvas} from '@remotion/skia';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {camara, type Chave} from '../lib/camara';
import {larguraTexto, useTypefaces} from '../lib/fonts';
import {PERFIS, meta} from '../lib/tokens';
import {CaixaFonte, FundoCena, Grao, type Base} from '../lib/ui';

// Mapa de relações. SÓ arestas provadas (códigos C ou A do ledger), cada uma com tipo, fonte e data.
// "inspirou" é sempre tracejado: inspiração não é financiamento nem comando.
export type TipoAresta = 'organizou' | 'participou' | 'apoiou' | 'convocou' | 'inspirou';
export type PropsMapa = Base & {
  nos: {id: string; rotulo: string; x: number; y: number}[]; // coordenadas do mundo
  arestas: {de: string; para: string; tipo: TipoAresta; fonte: string; data: string}[];
};

const ENTRADA = 30, POR_ARESTA = 54, HOLD = 40;
export const metaMapa = ({props}: {props: PropsMapa}) => ({
  ...meta(props.perfil, props.fps),
  durationInFrames: ENTRADA + props.arestas.length * POR_ARESTA + HOLD,
});
const c01 = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const MapaRelacoes = (p: PropsMapa) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const tf = useTypefaces();
  if (!tf) return null;
  const perfil = PERFIS[p.perfil];
  const {cores, seguro} = perfil;

  // Enquadramento pelas posições dos nós; os tamanhos de letra são de ECRÃ (divididos pelo zoom),
  // para o mapa se ler igual num painel de Short ou num 16:9.
  const xs = p.nos.map((n) => n.x), ys = p.nos.map((n) => n.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const zFit = Math.min(seguro.w / (Math.max(...xs) - Math.min(...xs) + 480), seguro.h / (Math.max(...ys) - Math.min(...ys) + 240));
  const ecra = (px: number) => px / zFit;
  const fNo = Skia.Font(tf[perfil.fontes.titulo], ecra(p.perfil === 'short' ? 40 : 48));
  const fTipo = Skia.Font(tf[perfil.fontes.texto], ecra(p.perfil === 'short' ? 22 : 24));
  const fMeta = Skia.Font(tf[perfil.fontes.texto], ecra(p.perfil === 'short' ? 17 : 19));
  const NO_H = fNo.getSize() * 1.55;
  const no = Object.fromEntries(p.nos.map((n) => [n.id, {...n, w: larguraTexto(fNo, n.rotulo) + fNo.getSize() * 0.9}]));

  // Ponto onde a linha centro→centro sai da caixa do nó.
  const borda = (a: (typeof no)[string], bx: number, by: number) => {
    const dx = bx - a.x, dy = by - a.y;
    const s = Math.min(Math.abs((a.w / 2 + ecra(10)) / (dx || 1e-6)), Math.abs((NO_H / 2 + ecra(10)) / (dy || 1e-6)));
    return {x: a.x + dx * s, y: a.y + dy * s};
  };

  // Câmara: deriva suave para cada aresta nova (35% do caminho), nunca salta.
  const chaves: Chave[] = [{f: 0, x: cx, y: cy, z: zFit * 0.95}, {f: ENTRADA, x: cx, y: cy, z: zFit}];
  p.arestas.forEach((a, i) => {
    const mx = (no[a.de].x + no[a.para].x) / 2, my = (no[a.de].y + no[a.para].y) / 2;
    const f0 = ENTRADA + i * POR_ARESTA;
    chaves.push({f: f0 + 16, x: cx + (mx - cx) * 0.35, y: cy + (my - cy) * 0.35, z: zFit * 1.06});
    chaves.push({f: f0 + POR_ARESTA - 4, x: cx + (mx - cx) * 0.35, y: cy + (my - cy) * 0.35, z: zFit * 1.07});
  });
  const fimA = ENTRADA + p.arestas.length * POR_ARESTA;
  chaves.push({f: fimA + 18, x: cx, y: cy, z: zFit}, {f: fimA + HOLD, x: cx, y: cy, z: zFit * 1.005});
  const ativa = Math.min(p.arestas.length - 1, Math.max(0, Math.floor((frame - ENTRADA) / POR_ARESTA)));
  const traco = ecra(5);

  return (
    <SkiaCanvas width={width} height={height}>
      <FundoCena p={p} />
      <Group transform={[{translateX: seguro.x}, {translateY: seguro.y}, ...camara(frame, chaves, seguro.w, seguro.h)]}>
        {p.arestas.map((a, i) => {
          const f0 = ENTRADA + i * POR_ARESTA + 6;
          const k = interpolate(frame, [f0, f0 + 22], [0, 1], c01);
          if (k <= 0) return null;
          const A = borda(no[a.de], no[a.para].x, no[a.para].y), B = borda(no[a.para], no[a.de].x, no[a.de].y);
          const linha = Skia.PathBuilder.Make().moveTo(A.x, A.y).lineTo(B.x, B.y).build();
          const ang = Math.atan2(B.y - A.y, B.x - A.x), L = ecra(24);
          const ponta = Skia.PathBuilder.Make()
            .moveTo(B.x, B.y).lineTo(B.x - L * Math.cos(ang - 0.42), B.y - L * Math.sin(ang - 0.42))
            .moveTo(B.x, B.y).lineTo(B.x - L * Math.cos(ang + 0.42), B.y - L * Math.sin(ang + 0.42))
            .build();
          const cor = a.tipo === 'inspirou' ? cores.textoSuave : cores.acento;
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          const et = a.tipo.toUpperCase(), metaTxt = `${a.fonte} · ${a.data}`;
          const lw = Math.max(larguraTexto(fTipo, et), larguraTexto(fMeta, metaTxt));
          const tA = interpolate(frame, [f0 + 16, f0 + 28], [0, 1], c01);
          const h = fTipo.getSize() + fMeta.getSize() * 1.9;
          return (
            <Group key={i}>
              <Path path={linha} style="stroke" strokeWidth={traco} color={cor} end={k} strokeCap="round">
                {a.tipo === 'inspirou' ? <DashPathEffect intervals={[ecra(16), ecra(12)]} /> : null}
              </Path>
              <Path path={ponta} style="stroke" strokeWidth={traco} color={cor} strokeCap="round" opacity={k >= 1 ? 1 : 0} />
              {/* Uma só etiqueta opaca (tipo + fonte/data) para nunca cruzar as linhas. */}
              <Group opacity={tA}>
                <RoundedRect x={mx - lw / 2 - ecra(14)} y={my - h / 2} width={lw + ecra(28)} height={h} r={ecra(4)} color={cores.fundo} />
                <Text x={mx - larguraTexto(fTipo, et) / 2} y={my - h / 2 + fTipo.getSize() * 1.05} text={et} font={fTipo} color={cor} />
                <Text x={mx - larguraTexto(fMeta, metaTxt) / 2} y={my + h / 2 - fMeta.getSize() * 0.55} text={metaTxt} font={fMeta} color={cores.textoSuave} />
              </Group>
            </Group>
          );
        })}
        {p.nos.map((n, i) => {
          const a = interpolate(frame, [4 + i * 5, 18 + i * 5], [0, 1], c01);
          const N = no[n.id];
          return (
            <Group key={n.id} opacity={a} transform={[{translateY: (1 - a) * ecra(18)}]}>
              <RoundedRect x={n.x - N.w / 2} y={n.y - NO_H / 2} width={N.w} height={NO_H} r={ecra(6)} color={cores.papel} />
              <Text x={n.x - N.w / 2 + fNo.getSize() * 0.45} y={n.y + fNo.getSize() * 0.36} text={n.rotulo} font={fNo} color={cores.tinta} />
            </Group>
          );
        })}
      </Group>
      {frame >= ENTRADA + 22 ? (
        <CaixaFonte key={ativa} p={p} texto={`${p.arestas[ativa].fonte}, ${p.arestas[ativa].data}`} ui={tf[perfil.fontes.texto]} frame={frame} entra={ENTRADA + ativa * POR_ARESTA + 22} />
      ) : null}
      <Grao p={p} frame={frame} />
    </SkiaCanvas>
  );
};
