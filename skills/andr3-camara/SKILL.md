---
name: andr3-camara
description: Câmara contínua num só mundo para inserts do Andr3 News em Remotion + Skia sem CSS: várias provas lado a lado e uma câmara que viaja entre elas com causa. Usar quando um insert junta mais de uma prova ou quando se compõe uma cena nova a partir das peças do template.
---

# Andr3 Câmara · um mundo, uma câmara

Lê primeiro `andr3-motion`. Esta skill é a gramática de movimento de todos os inserts e o guia para compor cenas novas com as peças do template.

## A ideia

Constrói **um mundo maior do que o ecrã** e move **uma câmara** por ele, em vez de fazer aparecer cartões soltos num vazio. Abre perto de uma ação, segura enquanto ela acontece, revela o contexto, viaja para a prova seguinte, assenta.

O caso típico do canal é a **corroboração**: duas ou três capturas de fontes independentes dispostas no mesmo mundo, a câmara passa de uma para a outra e o marcador sublinha a mesma informação em cada uma. É a regra das 2 fontes tornada visível.

## A câmara (`src/lib/camara.ts`)

```ts
const chaves: Chave[] = [
  {f: 0,   x: 1200, y: 800, z: 0.60},   // plano geral, ligeiramente largo
  {f: 40,  x: 1200, y: 800, z: 0.66},   // assenta
  {f: 60,  x: 700,  y: 620, z: 1.25},   // viagem para a prova 1 (20 frames)
  {f: 98,  x: 700,  y: 620, z: 1.27},   // pausa com micro-movimento: a ação acontece aqui
  {f: 120, x: 2300, y: 640, z: 1.20},   // viagem para a prova 2
  {f: 166, x: 2300, y: 640, z: 1.22},
  {f: 190, x: 1500, y: 800, z: 0.72},   // recua
  {f: 216, x: 1500, y: 800, z: 0.73},   // pausa final para o corte
];
<Group transform={camara(frame, chaves, width, height)}>{/* mundo */}</Group>
```

- `x, y`: ponto do mundo que fica no centro do ecrã. `z`: zoom.
- Viagens de 14 a 24 frames com `Easing.inOut(cubic)` (já no `camara()`). Nada de whip pans.
- Pausas com 1 a 2% de zoom a mais: a imagem nunca congela (o crítico chumba imagem parada a meio).
- A ação (traço do marcador, número a contar, aresta a desenhar) acontece **na pausa**, nunca durante a viagem.
- Fim: duas chaves quase iguais, 20 a 30 frames.
- Mundo com 2 a 2,5 vezes a largura do ecrã. Tudo (capturas, setas, marcadores) no mesmo sistema de coordenadas.
- A câmara trabalha dentro de um retângulo do ecrã: a zona segura do perfil (`seguro`) ou o PiP dos longos. Usa `[{translateX: r.x}, {translateY: r.y}, ...camara(frame, chaves, r.w, r.h)]`.
- Com zoom, prende a câmara às margens do conteúdo (função `prende` no `DestaqueCaptura`): nunca mostrar o vazio além da página.
- Elementos de ecrã (grão, caixa de fonte quando existe) ficam **fora** do grupo da câmara.

## Relação com a edição no Final Cut

A regra do zoom 100%/125% alternado é dos **cortes no Final Cut**. Dentro de um insert o movimento é contínuo; não simules cortes com saltos de zoom. Se precisas de um corte, são dois inserts.

## Compor uma cena nova

1. Escreve o beat numa linha: que prova, por que ordem, qual a conclusão visual.
2. Reaproveita peças: `useImagem` + `tracoMarcador` para capturas, `CaixaFonte`, `Grao`, `quebrar`, `numeroPT`. Não inventes estética nova.
3. Desenha o mundo em papel primeiro (posições), depois as chaves da câmara, depois os tempos das ações dentro das pausas.
4. Props + `calculateMetadata`, registo no `Root.tsx`, JSON em `dados/`, gate.

## Chumbo antes de entregar

1. Algum movimento só decora (zoom lento como única ideia, viagem sem destino)?
2. Alguma ação acontece durante uma viagem e perde-se?
3. Há cartões soltos num vazio em vez de um mundo com relações espaciais?
4. A pausa final tem menos de 20 frames?
5. Algum texto essencial fica ilegível no zoom mais largo?
