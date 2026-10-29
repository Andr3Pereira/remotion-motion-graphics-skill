---
name: andr3-motion
description: Núcleo dos inserts de motion do Andr3 News (destaques de capturas, números-chave, mapas de relações, cronologias) em Remotion + Skia, sem CSS. Usar antes de qualquer gráfico animado em código para documentários, longos ou Shorts do canal.
---

# Andr3 Motion · núcleo

Inserts curtos (4 a 15 s) para o Final Cut, feitos em código e desenhados em **Skia**, nunca em HTML/CSS. Esta skill manda no intake, nos dados, no motor, no gate e na entrega. As outras três dizem como fazer cada tipo de insert:

| Precisas de mostrar | Skill | Composição |
|---|---|---|
| Uma frase numa página real (artigo, Diário da República, comunicado) | `andr3-destaques` | `Destaque` |
| Um número do ledger | `andr3-mapas` | `Numero` |
| Quem se liga a quem, com prova | `andr3-mapas` | `Mapa` |
| Datas em sequência | `andr3-mapas` | `Cronologia` |
| Várias provas num só espaço, câmara a viajar entre elas | `andr3-camara` | composição nova a partir das peças |

Se o beat não pede nenhum destes, não faças insert. Um corte para TH ou para o clip mudo diz mais do que um gráfico de enfeite.

## 1. Intake (pergunta só o que faltar)

1. **Formato:** `doc` 1920×1080 (dark, híbridos, longos) ou `short` 1080×1920. Deduz pelo contexto: fábrica de docs → `doc`; Shorts → `short`.
2. **Fundo:** `escuro` (charcoal com grão, insert de ecrã inteiro) ou `transparente` (vai por cima de TH ou clip no Final Cut, render em ProRes 4444).
3. **Factos:** só entram no ecrã factos do ledger do doc. Números: código C (🟢). Alegações: A, sempre atribuídas na etiqueta. N, H e O nunca entram.
4. **Fonte:** cada insert tem fonte com data na caixa de fonte. Sem fonte, não há insert.

## 2. Projeto

Uma vez por doc (ou um projeto partilhado na raiz dos docs):

```bash
cp -R <skill>/template <pasta-do-doc>/motion && cd <pasta-do-doc>/motion
npm install
npm run exemplo:pagina          # gera a captura fictícia de teste
npx remotion studio src/index.ts  # pré-visualização
```

`<skill>` é a pasta desta skill (Claude Code: `.claude/skills/andr3-motion`; outros agentes: `.agents/skills/andr3-motion`).

As fontes do canal já vêm em `template/public/fonts` (Bebas Neue, Anton, Caveat Bold, Source Serif 4, Inter; licença OFL). Antes de mexer em código, lê `references/motor-skia.md`.

## 3. Regras do motor (o gate impõe-as)

- **Raiz de cada composição: `<SkiaCanvas>`.** Nada de `div`, `AbsoluteFill`, `Img`, `Video`, `style={{}}`, `className`, `.css`, Tailwind ou `@keyframes`.
- **Animação só por frame:** `useCurrentFrame()`, `interpolate()`, `spring()`. Nunca CSS animation.
- **Cores e fontes só em `src/lib/tokens.ts`.** Doc: ciano/magenta planos. Short: amarelo/vermelho planos. A caixa de fonte é sempre branco sobre escuro, canto inferior esquerdo (nos Shorts sobe para fora da interface).
- **Proibido:** brilho, néon, bloom, auras, gradientes radiais, sombras coloridas, glassmorphism, partículas de enfeite. Sombra só `FIXAS.sombra`. Desfoque só como foco ótico na entrada.
- **Texto:** português de Portugal, sem travessões, sem brasileirismos, sem repetir em letras o que a voz diz. Números à portuguesa (`numeroPT`: 12 121 · 7,49).
- **Inserts mudos.** O som (`numero()`, `fonte()`, foley) entra na mistura do `demo_som.py`, sincronizado com os frames indicados em cada skill.
- **Movimento com causa:** cada movimento leva o olho à prova seguinte. Pausa → viagem → pausa. Fim com 20 a 30 frames estáveis para o corte.

## 4. Fluxo e gate

O gate é `scripts/andr3-gate.mjs`. Um chumbo é paragem obrigatória.

```bash
G=<skill>/scripts/andr3-gate.mjs
node $G dados dados/<insert>.json          # 1. dados completos e coerentes
node $G lint .                             # 2. código sem CSS nem DOM
npx tsc --noEmit                           # 3. tipos
npx remotion render src/index.ts <Comp> out/<insert>.mp4 --props=dados/<insert>.json --muted   # 4. render
node $G qa out/<insert>.mp4 --formato doc   # 5. dimensões, fps, sem áudio, sem preto, duração + folha
```

Fundo transparente (para sobrepor no Final Cut):

```bash
npx remotion render src/index.ts <Comp> out/<insert>.mov --props=dados/<insert>.json --muted \
  --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png
```

6. **Crítico independente:** quem fez não aprova. Um agente separado (ou o André) vê a `_folha.jpg` e o MP4 com `references/critico.md` e devolve aprovado/rejeitado. Sem crítico disponível, mostra a folha ao André e para.
7. **Entrega:** ficheiro na pasta de inserts do doc (híbrido: `04_inserts/`), com uma linha: duração, formato, onde entra no guião e em que frame cai o som.

## 5. O que nunca fazer

- Inventar página, logo, número, data, citação ou ligação. Se a prova não existe, o insert não existe.
- Recriar à mão uma página real. A página vem da captura (`capturar.js`); a reconstrução só serve para testes e diz "exemplo fictício".
- Seta de financiamento ou comando sem documento. Inspiração é tracejado.
- Rosto de pessoa privada sem desfoque (CC art. 79.º).
- Áudio de terceiros (Content ID).
