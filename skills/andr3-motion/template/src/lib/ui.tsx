import {Fill, Group, Rect, Shader, Skia, Text, type SkTypeface} from '@shopify/react-native-skia';
import {interpolate} from 'remotion';
import {larguraTexto} from './fonts';
import {GRAO} from './grao';
import {FIXAS, PERFIS, type NomePerfil} from './tokens';

export type Fundo = 'escuro' | 'transparente';

// Campos comuns a todos os inserts.
export type Base = {
  perfil: NomePerfil;
  fundo?: Fundo; // por defeito, o do perfil (longos: transparente para o PiP)
  fps?: number; // por defeito, o do perfil (25)
  fonte: string; // "Publicação, DD/MM/AAAA": obrigatória, vai para a lane de fonte do FCP
  fonteNoEcra?: boolean; // desenhar a caixa de fonte no próprio vídeo (por defeito não: é a lane do FCP)
};

export const fundoDe = (p: Base): Fundo => p.fundo ?? PERFIS[p.perfil].fundoPadrao;

export const FundoCena = ({p}: {p: Base}) => (fundoDe(p) === 'escuro' ? <Fill color={PERFIS[p.perfil].cores.fundo} /> : null);

// Grão neutro de película por cima de tudo. Nunca com cor, nunca com brilho. Só em fundo escuro.
export const Grao = ({p, frame}: {p: Base; frame: number}) => {
  const forca = PERFIS[p.perfil].grao;
  return fundoDe(p) === 'escuro' && forca > 0 ? (
    <Fill blendMode="overlay" opacity={0.55}>
      <Shader source={GRAO} uniforms={{t: frame, forca: forca * 1.2}} />
    </Fill>
  ) : null;
};

// Tamanho de letra que cabe em "max" px (encolhe, nunca cresce acima de "base").
export const caber = (tf: SkTypeface, base: number, texto: string, max: number) => {
  const w = larguraTexto(Skia.Font(tf, 100), texto) / 100;
  return Math.min(base, max / Math.max(w, 1e-6));
};

// Caixa de fonte no vídeo: só com fonteNoEcra. Por defeito a fonte vai na lane do FCP.
// Branco sobre escuro, canto inferior esquerdo da zona segura.
export const CaixaFonte = ({p, texto, ui, frame, entra}: {p: Base; texto: string; ui: SkTypeface; frame: number; entra: number}) => {
  if (!p.fonteNoEcra) return null;
  const perfil = PERFIS[p.perfil];
  const a = interpolate(frame, [entra, entra + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const font = Skia.Font(ui, 30);
  const t = `FONTE · ${texto}`;
  const x = perfil.seguro.x;
  const y = perfil.seguro.y + perfil.seguro.h - 68;
  return (
    <Group opacity={a} transform={[{translateY: (1 - a) * 16}]}>
      <Rect x={x} y={y} width={larguraTexto(font, t) + 56} height={68} color={FIXAS.caixaFonte} />
      <Rect x={x} y={y} width={6} height={68} color={perfil.cores.acento} />
      <Text x={x + 28} y={y + 45} text={t} font={font} color={FIXAS.caixaFonteTexto} />
    </Group>
  );
};
