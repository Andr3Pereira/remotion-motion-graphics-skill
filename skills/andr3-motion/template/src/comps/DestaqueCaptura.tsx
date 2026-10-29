import {Blur, Group, Image, Paint, Path, RoundedRect, Shadow, Skia, vec} from '@shopify/react-native-skia';
import {SkiaCanvas} from '@remotion/skia';
import type {CalculateMetadataFunction} from 'remotion';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {camara, type Chave} from '../lib/camara';
import {useTypefaces} from '../lib/fonts';
import {tracoMarcador} from '../lib/marcador';
import {useImagem} from '../lib/media';
import {FIXAS, PERFIS, meta} from '../lib/tokens';
import {CaixaFonte, FundoCena, Grao, type Base} from '../lib/ui';

// Destaque sobre uma CAPTURA REAL (saída do capturar.js). As caixas vêm em píxeis da imagem.
export type Caixa = {grupo: number; x: number; y: number; w: number; h: number};
export type PropsDestaque = Base & {
  imagem: string; // caminho dentro de public/
  largura: number; // píxeis da captura
  altura: number;
  destaques: Caixa[];
};

// Tempos (frames). Pensados a 25-30 fps; a diferença não se nota.
const INTRO = 40, VIAGEM = 20, PAUSA = 4, TRACO = 24, FIM_GRUPO = 12, SAIDA = 20, HOLD = 26;

const grupos = (d: Caixa[]) => [...new Set(d.map((c) => c.grupo))].sort((a, b) => a - b).map((g) => d.filter((c) => c.grupo === g));

// Retângulo onde a captura tem de caber: a zona segura (ecrã inteiro) ou o PiP (longos).
const alvoDe = (p: PropsDestaque) => {
  const perfil = PERFIS[p.perfil];
  const a = perfil.areaCaptura;
  const ecraInteiro = a.w === perfil.largura && a.h === perfil.altura;
  return {area: a, ecraInteiro, alvo: ecraInteiro ? perfil.seguro : {x: a.x + 24, y: a.y + 24, w: a.w - 48, h: a.h - 48}};
};

// Mantém a vista dentro da captura: com zoom, a câmara nunca mostra o vazio além da página.
const prende = (c: number, vista: number, total: number, z: number) => {
  const meio = vista / z / 2;
  return meio * 2 >= total ? total / 2 : Math.min(total - meio, Math.max(meio, c));
};

const plano = (p: PropsDestaque) => {
  const {alvo} = alvoDe(p);
  const zGeral = Math.min(alvo.w / p.largura, alvo.h / p.altura);
  const chaves: Chave[] = [
    {f: 0, x: p.largura / 2, y: p.altura / 2, z: zGeral * 0.94},
    {f: INTRO, x: p.largura / 2, y: p.altura / 2, z: zGeral},
  ];
  const tracos: {c: Caixa; ini: number; fim: number}[] = [];
  let f = INTRO;
  for (const g of grupos(p.destaques)) {
    // Zoom pela linha mais larga do grupo: a frase fica grande mesmo em duas linhas de ponta a ponta.
    const maxW = Math.max(...g.map((c) => c.w)), maxH = Math.max(...g.map((c) => c.h));
    const z = Math.max(zGeral * 1.15, Math.min(zGeral * 3, (alvo.w * 0.62) / maxW, (alvo.h * 0.4) / maxH));
    let t = f;
    g.forEach((c, j) => {
      // A câmara segue a linha a ser marcada, como o olho a ler.
      const foco = {x: prende(c.x + c.w / 2, alvo.w, p.largura, z), y: prende(c.y + c.h / 2, alvo.h, p.altura, z), z};
      const viagem = j === 0 ? VIAGEM : 16;
      chaves.push({f: t + viagem, ...foco});
      const ini = t + viagem + PAUSA;
      const dur = Math.max(12, Math.round((TRACO * c.w) / maxW));
      tracos.push({c, ini, fim: ini + dur});
      chaves.push({f: ini + dur, ...foco, z: z * 1.008});
      t = ini + dur;
    });
    chaves.push({...chaves[chaves.length - 1], f: t + FIM_GRUPO, z: z * 1.015});
    f = t + FIM_GRUPO;
  }
  chaves.push({f: f + SAIDA, x: p.largura / 2, y: p.altura / 2, z: zGeral * 1.0});
  chaves.push({f: f + SAIDA + HOLD, x: p.largura / 2, y: p.altura / 2, z: zGeral * 1.01});
  return {chaves, tracos, duracao: f + SAIDA + HOLD + 1};
};

export const metaDestaque: CalculateMetadataFunction<PropsDestaque> = ({props}) => ({
  ...meta(props.perfil, props.fps),
  durationInFrames: plano(props).duracao,
});

export const DestaqueCaptura = (p: PropsDestaque) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const tf = useTypefaces();
  const img = useImagem(p.imagem);
  if (!tf || !img) return null;

  const perfil = PERFIS[p.perfil];
  const {area, ecraInteiro, alvo} = alvoDe(p);
  const {chaves, tracos} = plano(p);
  const foco = interpolate(frame, [0, 22], [16, 0], {extrapolateRight: 'clamp'});
  const rot = interpolate(spring({frame, fps, config: {damping: 200}, durationInFrames: 40}), [0, 1], [-0.03, 0]);
  // PiP (longos): janela com cantos de 12 px e entrada a deslizar da direita, como os PiP do FCP.
  const entra = ecraInteiro ? 0 : interpolate(spring({frame, fps, config: {damping: 16, stiffness: 140}}), [0, 1], [area.w + 120, 0]);
  const janela = Skia.RRectXY(Skia.XYWHRect(area.x, area.y, area.w, area.h), 12, 12);

  const mundo = (
    <Group transform={[{translateX: alvo.x}, {translateY: alvo.y}, ...camara(frame, chaves, alvo.w, alvo.h)]}>
      <Group layer={<Paint><Blur blur={foco} /></Paint>}>
        <Group origin={vec(p.largura / 2, p.altura / 2)} transform={[{rotate: rot}]}>
          <RoundedRect x={0} y={0} width={p.largura} height={p.altura} r={8} color={perfil.cores.papel}>
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
                <Path path={tracoMarcador(c.x, c.y, c.w, c.h, 11 + i * 17)} color={perfil.cores.marcador} opacity={0.9} blendMode="multiply" />
              </Group>
            );
          })}
        </Group>
      </Group>
    </Group>
  );

  return (
    <SkiaCanvas width={width} height={height}>
      <FundoCena p={p} />
      {ecraInteiro ? (
        mundo
      ) : (
        <Group transform={[{translateX: entra}]}>
          <RoundedRect rect={janela} color={perfil.cores.fundo}>
            <Shadow dx={0} dy={14} blur={30} color={FIXAS.sombra} />
          </RoundedRect>
          <Group clip={janela}>{mundo}</Group>
        </Group>
      )}
      <CaixaFonte p={p} texto={p.fonte} ui={tf[perfil.fontes.texto]} frame={frame} entra={30} />
      <Grao p={p} frame={frame} />
    </SkiaCanvas>
  );
};
