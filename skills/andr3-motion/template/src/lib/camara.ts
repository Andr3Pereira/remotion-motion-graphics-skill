import {Easing, interpolate} from 'remotion';

export type Chave = {f: number; x: number; y: number; z: number};
const ease = Easing.inOut(Easing.cubic);

// Câmara única: foco (x,y) do mundo no centro do ecrã, com zoom z. Chaves repetidas = pausas.
export const camara = (frame: number, chaves: Chave[], vw: number, vh: number) => {
  const T = chaves.map((c) => c.f);
  const o = {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const x = interpolate(frame, T, chaves.map((c) => c.x), o);
  const y = interpolate(frame, T, chaves.map((c) => c.y), o);
  const z = interpolate(frame, T, chaves.map((c) => c.z), o);
  // Transformação Skia: centra o foco e aplica o zoom à volta dele.
  return [{translateX: vw / 2}, {translateY: vh / 2}, {scale: z}, {translateX: -x}, {translateY: -y}];
};
