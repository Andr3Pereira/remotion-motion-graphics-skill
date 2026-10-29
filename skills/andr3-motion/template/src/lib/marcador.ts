import {Skia, type SkPath} from '@shopify/react-native-skia';

// PRNG determinístico: o mesmo seed dá sempre o mesmo traço (renders reproduzíveis).
const prng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// Traço de marcador irregular, como tinta física: bordas tremidas, pontas arredondadas a direito.
export const tracoMarcador = (x: number, y: number, w: number, h: number, seed = 7): SkPath => {
  const r = prng(seed);
  const p = Skia.PathBuilder.Make();
  const passos = Math.max(6, Math.round(w / 40));
  const j = h * 0.12;
  p.moveTo(x - 6 + r() * 4, y + h * 0.18 + (r() - 0.5) * j);
  for (let i = 1; i <= passos; i++) p.lineTo(x + (w * i) / passos + (i === passos ? 3 : 0), y + h * 0.12 + (r() - 0.5) * j);
  p.lineTo(x + w + 4, y + h * 0.5);
  for (let i = passos; i >= 0; i--) p.lineTo(x + (w * i) / passos + (i === 0 ? -8 : 0), y + h * 0.92 + (r() - 0.5) * j);
  p.close();
  return p.build();
};
