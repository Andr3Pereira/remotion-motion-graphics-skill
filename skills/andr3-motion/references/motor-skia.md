# Motor Skia · como funciona e armadilhas conhecidas

Testado com Remotion 4.0.539, @shopify/react-native-skia 2.14.0, React 19.3 (29/10/2026). Todos os pacotes `remotion` e `@remotion/*` têm de ter **a mesma versão exata**.

## Peças do template

| Ficheiro | Faz |
|---|---|
| `remotion.config.ts` | `enableSkia()` + alias `react-native → react-native-web` |
| `src/index.ts` | `LoadSkia()` antes do `registerRoot` (carrega o CanvasKit WASM) |
| `src/lib/tokens.ts` | formatos, paletas, fontes, cores fixas. Única casa das cores |
| `src/lib/fonts.ts` | `useTypefaces()` (espera pelas fontes), `larguraTexto`, `quebrar`, `numeroPT` |
| `src/lib/media.ts` | `useImagem()` para capturas e logos em Skia |
| `src/lib/camara.ts` | câmara única: chaves `{f, x, y, z}` em coordenadas do mundo |
| `src/lib/marcador.ts` | traço de marcador irregular e determinístico |
| `src/lib/grao.ts` | grão de película em SkSL, neutro |
| `src/lib/ui.tsx` | `FundoCena`, `Grao`, `CaixaFonte` |
| `src/comps/*` | Destaque, Numero, Mapa, Cronologia (+ página fictícia de teste) |
| `dados/*.json` | um JSON por insert; a composição calcula a duração a partir dele |

## Armadilhas (todas aconteceram no teste)

1. **"Can't resolve 'react-native'"**: falta o alias para `react-native-web` no `remotion.config.ts`.
2. **Skia 2.x: os paths são imutáveis.** `Skia.Path.Make().moveTo()` não existe. Usa `Skia.PathBuilder.Make().moveTo(...).lineTo(...).build()`.
3. **Fontes variáveis** (Caveat, Inter, Source Serif vêm assim do Google Fonts) não dão o peso certo. Gera instâncias estáticas:
   `fonttools varLib.instancer Caveat[wght].ttf wght=700 -o Caveat-Bold.ttf`
4. **Medir texto:** `larguraTexto()` soma os avanços dos glifos. `measureText()` devolve a caixa de tinta e desalinha marcadores.
5. **`<Text>` do Skia não quebra linhas.** Usa `quebrar(font, texto, max)` ou quebras `\n` intencionais.
6. **`style="stroke"` num `<Path>` é uma prop do Skia, não CSS.** O gate só chumba `style={...}`.
7. **Ordem da transformação:** `[{translateX: vw/2}, {translateY: vh/2}, {scale: z}, {translateX: -x}, {translateY: -y}]` põe o ponto (x, y) do mundo no centro do ecrã com zoom z. Está em `camara()`; não reinventes.
8. **Marcador por baixo do texto:** desenha-o por cima com `blendMode="multiply"`. O preto fica preto, o papel fica amarelo, como tinta real. Funciona igual sobre capturas.
9. **Tudo o que é assíncrono** (fontes, imagens) passa por `delayRender`/`continueRender`, senão o render apanha frames vazios.
10. **`--concurrency`** não pode passar o número de núcleos. Em CPU, o Skia corre a ~1 s por frame com 2 núcleos; no Mac é muito mais rápido. Se estiver lento, experimenta `--gl=angle`.
11. **`<Sequence>`** cria um div com estilo. Usa `layout="none"` ou, melhor, controla tempos por `frame` dentro do mesmo `<SkiaCanvas>`.

## Juntar uma composição nova

1. Props tipadas + `calculateMetadata` que devolve `FORMATOS[formato]` e a duração calculada dos dados.
2. Raiz `<SkiaCanvas width height>`; dentro: `FundoCena` → `Group` da câmara → conteúdo → `CaixaFonte` → `Grao`.
3. Regista em `src/Root.tsx` com um JSON de exemplo em `dados/`.
4. `node <skill>/scripts/andr3-gate.mjs lint .` antes do primeiro render.
