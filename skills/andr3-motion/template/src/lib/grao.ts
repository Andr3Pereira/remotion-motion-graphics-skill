import {Skia} from '@shopify/react-native-skia';

// Grão de película animado (shader SkSL). Neutro, sem cor, sem brilho.
export const GRAO = Skia.RuntimeEffect.Make(`
uniform float t;
uniform float forca;
float h(float2 p){ return fract(sin(dot(p, float2(12.9898,78.233)) + t*7.13) * 43758.5453); }
half4 main(float2 xy){
  float n = h(floor(xy)) - 0.5;
  return half4(half3(0.5 + n*forca), 1.0);
}`)!;
