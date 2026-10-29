---
name: andr3-destaques
description: Destaque animado com marcador sobre a captura real de uma página (notícia, Diário da República, comunicado), em Skia sem CSS, para os docs e Shorts do Andr3 News. Usar quando a prova de um facto é uma frase escrita numa fonte.
---

# Andr3 Destaques

Lê primeiro `andr3-motion` (intake, regras, gate). Esta skill é a composição `Destaque` do template.

## Quando usar

- A prova é texto escrito numa fonte real e o espectador deve ler a frase exata.
- Uma a três frases por insert. Mais do que isso é um parágrafo: corta ou divide em dois inserts.
- Não usar para repetir o que a voz já leu palavra por palavra sem acrescentar prova. A captura é a prova; o marcador mostra onde.

## Entrada: captura real + caixas medidas

A imagem vem sempre do `capturar.js` do kit (nunca de uma página redesenhada). Grava a captura em `public/capturas/<nome>.png` e o JSON em `dados/<nome>.json`:

```json
{
  "formato": "doc",
  "fundo": "escuro",
  "imagem": "capturas/publico-habitacao.png",
  "largura": 1400,
  "altura": 1100,
  "fonte": "Público, 12/10/2026",
  "destaques": [
    {"grupo": 1, "x": 572, "y": 600, "w": 435, "h": 52},
    {"grupo": 2, "x": 803, "y": 716, "w": 279, "h": 52},
    {"grupo": 2, "x": 110, "y": 774, "w": 455, "h": 52}
  ]
}
```

- Coordenadas em **píxeis da imagem** (já multiplicadas pelo `deviceScaleFactor` da captura).
- Uma caixa por linha de texto. Uma frase partida em duas linhas = duas caixas com o mesmo `grupo`.
- Cada `grupo` é uma paragem da câmara. A ordem dos grupos é a ordem da narração.

Medir as caixas no próprio site (dentro do `capturar.js`, antes do screenshot):

```js
// Devolve uma caixa por linha onde a frase aparece. "clip" é a zona do screenshot.
const caixas = await page.evaluate(({frase, clip, dpr}) => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode()); ) {
    const i = n.textContent.indexOf(frase);
    if (i < 0) continue;
    const r = document.createRange();
    r.setStart(n, i);
    r.setEnd(n, i + frase.length);
    return [...r.getClientRects()].map((b) => ({
      x: Math.round((b.left + scrollX - clip.x) * dpr), y: Math.round((b.top + scrollY - clip.y) * dpr),
      w: Math.round(b.width * dpr), h: Math.round(b.height * dpr),
    }));
  }
  return [];
}, {frase, clip, dpr: 2});
```

Com `fullPage: true` as coordenadas incluem o scroll, como acima; numa captura só do ecrã visível, tira o `scrollX`/`scrollY`. Se a frase atravessar dois nós de texto (negrito, link), mede as partes em separado. Confirma sempre no `08_qa/destaques_web.jpg` antes de renderizar: caixa desalinhada é chumbo.

## O que a composição faz (não mudes sem razão)

| Frames (30 fps) | Ação |
|---|---|
| 0 a 22 | Desfoque → foco; a página assenta com uma rotação mínima. Sem marcador. |
| 30 | Caixa de fonte entra. **Som: `fonte()`.** |
| por grupo | Viagem de 20 frames até ao grupo (fica no terço de cima, longe da caixa de fonte) → 4 de pausa → traços da esquerda para a direita, linha a linha → 12 de pausa. **Som: foley de marcador em cada traço.** |
| fim | Recua para a página inteira e segura 26 frames para o corte. |

- O zoom de cada grupo é calculado para a frase ocupar ~55% da largura, entre o plano geral e 1,9×.
- Marcador em `multiply`: fica por baixo das letras, como tinta. Cor `marcador` da paleta, nunca fluorescente.
- A duração total sai dos dados (`calculateMetadata`); não a fixes à mão.

## Render

```bash
G=<skill-andr3-motion>/scripts/andr3-gate.mjs
node $G dados dados/publico-habitacao.json && node $G lint .
npx remotion render src/index.ts Destaque out/publico-habitacao.mp4 --props=dados/publico-habitacao.json --muted
node $G qa out/publico-habitacao.mp4 --formato doc
```

## Chumbo antes de entregar

1. A captura é real e a fonte na caixa é a mesma página, com data?
2. Cada frase destacada está no ledger com o mesmo sentido (não tirada de contexto)?
3. Algum marcador cobre mais do que a frase, ou aparece antes do foco?
4. A caixa de fonte tapa alguma frase destacada em algum frame?
5. Lê-se no tamanho de destino (doc a meio ecrã; Short no telemóvel)?
6. Rosto de pessoa privada visível na captura sem desfoque?

Qualquer "sim" nas 3, 4 e 6, ou "não" nas 1, 2 e 5: corrige antes do crítico.
