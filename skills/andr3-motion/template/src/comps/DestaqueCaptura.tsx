import {Blur, Group, Image, Paint, Path, RoundedRect, Shadow, Skia, vec} from '@shopify/react-native-skia';
import {SkiaCanvas} from '@remotion/skia';
import type {CalculateMetadataFunction} from 'remotion';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {camara, type Chave} from '../lib/camara';
import {useTypefaces} from '../lib/fonts';
import {tracoMarcador} from '../lib/marcador';
import {useImagem} from '../lib/media';
import {FIXAS, FORMATOS, PALETAS, type Formato} from '../lib/tokens';
import {CaixaFonte, FundoCena, Grao, type Fundo} from '../lib/ui';

// Destaque sobre uma CAPTURA REAL (saída do capturar.js). As caixas vêm em píxeis da imagem.
export type Caixa = {grupo: number; x: number; y: number; w: number; h: number};
export type PropsDestaque = {
  formato: Formato;
  fundo: Fundo;
  imagem: string; // caminho dentro de public/
  largura: number; // píxeis da captura
  altura: number;
  fonte: string; // "Publicação, DD/MM/AAAA"
  destaques: Caixa[];
};

// Tempos (frames a 30 fps).
const INTRO = 40, VIAGEM = 20, PAUSA = 4, TRACO = 24, FIM_GRUPO = 12, SAIDA = 20, HOLD = 26;

const grupos = (d: Caixa[]) => [...new Set(d.map((c) => c.grupo))].sort((a, b) => a - b).map((g) => d.filter((c) => c.grupo === g));

const plano = (p: PropsDestaque) => {
  const {width: vw, height: vh} = FORMATOS[p.formato];
  const zGeral = Math.min((vw * 0.8) / p.largura, (vh * 0.86) / p.altura);
  const chaves: Chave[] = [
    {f: 0, x: p.largura / 2, y: p.altura / 2, z: zGeral * 0.94},
    {f: INTRO, x: p.largura / 2, y: p.altura / 2, z: zGeral},
  ];
  const tracos: {c: Caixa; ini: number; fim: number}[] = [];
  let f = INTRO;
  for (const g of grupos(p.destaques)) {
    // Zoom pela linha mais larga do grupo (não pela caixa do grupo inteiro): a frase fica
    // grande mesmo quando ocupa duas linhas de ponta a ponta. Entre 1,15x o plano geral e 1,6x.
    const maxW = Math.max(...g.map((c) => c.w)), maxH = Math.max(...g.map((c) => c.h));
    const z = Math.max(zGeral * 1.15, Math.min(1.6, (vw * 0.55) / maxW, (vh * 0.5) / maxH));
    let t = f;
    g.forEach((c, j) => {
      // A câmara segue a linha a ser marcada, como o olho a ler. Desvio vertical: a linha
      // fica no terço de cima, longe da caixa de fonte.
      const foco = {x: c.x + c.w / 2, y: c.y + c.h / 2 + (vh * 0.12) / z, z};
      const viagem = j === 0 ? VIAGEM : 16;
      chaves.push({f: t + viagem, ...foco});
      const ini = t + viagem + PAUSA;
      const dur = Math.max(12, Math.round((TRACO * c.w) / maxW));
      tracos.push({c, ini, fim: ini + dur});
      chaves.push({f: ini + dur, ...foco, z: z * 1.008});
      t = ini + dur;
    });
    const ult = chaves[chaves.length - 1];
    chaves.push({...ult, f: t + FIM_GRUPO, z: z * 1.015});
    f = t + FIM_GRUPO;
  }
  chaves.push({f: f + SAIDA, x: p.largura / 2, y: p.altura / 2, z: zGeral * 1.04});
  chaves.push({f: f + SAIDA + HOLD, x: p.largura / 2, y: p.altura / 2, z: zGeral * 1.05});
  return {chaves, tracos, duracao: f + SAIDA + HOLD + 1};
};

export const metaDestaque: CalculateMetadataFunction<PropsDestaque> = ({props}) => ({
  ...FORMATOS[props.formato],
  durationInFrames: plano(props).duracao,
});

export const DestaqueCaptura = (p: PropsDestaque) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const tf = useTypefaces();
  const img = useImagem(p.imagem);
  if (!tf || !img) return null;

  const pal = PALETAS[p.formato];
  const {chaves, tracos} = plano(p);
  const foco = interpolate(frame, [0, 22], [16, 0], {extrapolateRight: 'clamp'});
  const rot = interpolate(spring({frame, fps, config: {damping: 200}, durationInFrames: 40}), [0, 1], [-0.03, 0]);

  return (
    <SkiaCanvas width={width} height={height}>
      <FundoCena fundo={p.fundo} paleta={pal} />
      <Group transform={camara(frame, chaves, width, height)}>
        <Group layer={<Paint><Blur blur={foco} /></Paint>}>
          <Group origin={vec(p.largura / 2, p.altura / 2)} transform={[{rotate: rot}]}>
            <RoundedRect x={0} y={0} width={p.largura} height={p.altura} r={8} color={pal.papel}>
              <Shadow dx={0} dy={18} blur={36} color={FIXAS.sombra} />
            </RoundedRect>
            <Group clip={Skia.RRectXY(Skia.XYWHRect(0, 0, p.largura, p.altura), 8, 8)}>
              <Image image={img} x={0} y={0} width={p.largura} height={p.altura} fit="fill" />
            </Group>
            {tracos.map(({c, ini, fim}, i) => {
              const k = interpolate(frame, [ini, fim], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              if (k <= 0) return null;
              // Multiply: tinta por baixo do texto da captura (o preto fica preto).
              return (
                <Group key={i} clip={Skia.XYWHRect(c.x - 12, c.y - 10, (c.w + 24) * k, c.h + 20)}>
                  <Path path={tracoMarcador(c.x, c.y, c.w, c.h, 11 + i * 17)} color={pal.marcador} opacity={0.92} blendMode="multiply" />
                </Group>
              );
            })}
          </Group>
        </Group>
      </Group>
      <CaixaFonte texto={p.fonte} ui={tf.ui} paleta={pal} frame={frame} entra={30} altura={height} formato={p.formato} />
      <Grao frame={frame} fundo={p.fundo} />
    </SkiaCanvas>
  );
};
