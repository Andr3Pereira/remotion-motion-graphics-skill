import {Fill, Group, Rect, Shader, Skia, Text, type SkTypeface} from '@shopify/react-native-skia';
import {interpolate} from 'remotion';
import {larguraTexto} from './fonts';
import {GRAO} from './grao';
import {FIXAS, type Formato, type Paleta} from './tokens';

export type Fundo = 'escuro' | 'transparente';

// Fundo do insert. "transparente" serve para sobrepor no Final Cut (render em ProRes 4444).
export const FundoCena = ({fundo, paleta}: {fundo: Fundo; paleta: Paleta}) =>
  fundo === 'escuro' ? <Fill color={paleta.fundo} /> : null;

// Grão neutro de película por cima de tudo. Nunca com cor, nunca com brilho.
export const Grao = ({frame, fundo, forca = 0.16}: {frame: number; fundo: Fundo; forca?: number}) =>
  fundo === 'escuro' ? (
    <Fill blendMode="overlay" opacity={0.55}>
      <Shader source={GRAO} uniforms={{t: frame, forca}} />
    </Fill>
  ) : null;

// Caixa de fonte do Andr3 News: branco sobre caixa escura, sempre no canto inferior esquerdo.
// Nos Shorts sobe para fora da zona da interface do YouTube (título, botões, legendas).
export const CaixaFonte = ({texto, ui, paleta, frame, entra, altura, formato}: {
  texto: string; ui: SkTypeface; paleta: Paleta; frame: number; entra: number; altura: number; formato: Formato;
}) => {
  const escala = formato === 'short' ? 1.25 : 1;
  const a = interpolate(frame, [entra, entra + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const font = Skia.Font(ui, 30 * escala);
  const t = `FONTE · ${texto}`;
  const h = 68 * escala;
  const x = 64 * escala;
  const y = formato === 'short' ? altura - 560 : altura - 140;
  return (
    <Group opacity={a} transform={[{translateY: (1 - a) * 16}]}>
      <Rect x={x} y={y} width={larguraTexto(font, t) + 56 * escala} height={h} color={FIXAS.caixaFonte} />
      <Rect x={x} y={y} width={6 * escala} height={h} color={paleta.acento} />
      <Text x={x + 28 * escala} y={y + 45 * escala} text={t} font={font} color={FIXAS.caixaFonteTexto} />
    </Group>
  );
};
