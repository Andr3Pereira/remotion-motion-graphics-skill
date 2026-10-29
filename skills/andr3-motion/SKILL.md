---
name: andr3-motion
description: Núcleo dos inserts de motion do Andr3 News (destaques de capturas, números-chave, mapas de relações, cronologias) em Remotion + Skia, sem CSS, com um perfil por linha de produção (Shorts, longos, docs dark, docs híbridos). Usar antes de qualquer gráfico animado em código para o canal.
---

# Andr3 Motion · núcleo

Inserts curtos (4 a 15 s) para o Final Cut, feitos em código e desenhados em **Skia**, nunca em HTML/CSS. Esta skill manda no perfil, nos dados, no motor, no gate e na entrega. As outras três dizem como fazer cada tipo de insert:

| Precisas de mostrar | Skill | Composição |
|---|---|---|
| Uma frase numa página real (artigo, Diário da República, comunicado) | `andr3-destaques` | `Destaque` |
| Um número do ledger | `andr3-mapas` | `Numero` |
| Quem se liga a quem, com prova | `andr3-mapas` | `Mapa` |
| Datas em sequência | `andr3-mapas` | `Cronologia` |
| Várias provas num só espaço, câmara a viajar entre elas | `andr3-camara` | composição nova a partir das peças |

Se o beat não pede nenhum destes, não faças insert. Um corte para a cara ou para o clip mudo diz mais do que um gráfico de enfeite.

## 1. Perfil (decide tudo o resto)

Cada linha de produção tem o seu perfil em `src/lib/tokens.ts`, com os valores da skill de edição dessa linha. O JSON do insert diz `"perfil"`; não se misturam marcas.

| Perfil | Skill de edição | Sai (render `--scale=2`) | Fontes | Cores | Onde entra no FCP |
|---|---|---|---|---|---|
| `short` | `fcp-shorts-noticias` | painel 2160×1920 (metade de cima) | Montserrat Black / SemiBold | branco, `#FFD400`, `#E10600` | lane 5 (painéis), no lugar de um painel |
| `longo` | `fcp-longos-noticias` | 3840×2160 com alfa; a captura vai no PiP à direita | Montserrat | branco, `#FFD400`, `#E10600` | lane 1 (PiP ou ecrã inteiro) |
| `dark` | `fcp-doc-motion` | 3840×2160 | Bebas Neue + Caveat Bold | `#18C8FF`, `#FF2D78`, fundo `#0D0F17` | camada acima da spine |
| `hibrido` | `_kit_hibrido` (`/hib-inserts`) | 3840×2160 | Bebas Neue + Caveat Bold | `#18C8FF`, `#FF2D78` | `04_inserts/`, na timeline do FCPXML |

- **Cadência:** 25p por defeito. Se a câmara da linha estiver a 30p, o JSON leva `"fps": 30`. Nunca misturar cadências no mesmo projeto.
- **Fundo:** o do perfil (longos: transparente, para cair por cima da cara). Troca-se com `"fundo": "escuro" | "transparente"`.
- **Zona segura:** já está no perfil. Shorts: 320 px de lado e capturas a partir dos 390 px do topo (no painel a 2×), e a linha das legendas livre em baixo.
- **Fonte:** cada JSON tem `"fonte"` com data (mapas e cronologias: uma por aresta/evento). **Não é desenhada no vídeo**: vai para a lane de fonte do FCP da linha ("Fonte: dono"), como sempre. Só com `"fonteNoEcra": true` aparece a caixa no próprio insert.

## 2. Dados

Só entram no ecrã factos do ledger do vídeo. Números: código C (🟢). Alegações: A, sempre atribuídas na etiqueta. N, H e O nunca entram. Sem fonte, não há insert.

## 3. Projeto

Uma vez por máquina (um projeto partilhado chega para todas as linhas):

```bash
bash <repo>/install.sh /Volumes/Disco_3/02.Conteúdo/Andr3\ News/_motion
cd /Volumes/Disco_3/02.Conteúdo/Andr3\ News/_motion
npx remotion studio src/index.ts      # pré-visualização
```

Os JSON de cada vídeo ficam em `dados/<vídeo>-<insert>.json`; as capturas em `public/capturas/`. As fontes do canal já vêm no template (licença OFL). Antes de mexer em código, lê `references/motor-skia.md`.

## 4. Regras do motor (o gate impõe-as)

- **Raiz de cada composição: `<SkiaCanvas>`.** Nada de `div`, `AbsoluteFill`, `Img`, `Video`, `style={{}}`, `className`, `.css`, Tailwind ou `@keyframes`.
- **Animação só por frame:** `useCurrentFrame()`, `interpolate()`, `spring()`.
- **Cores e fontes só em `src/lib/tokens.ts`**, dentro do perfil. Nunca usar a marca de uma linha noutra.
- **Proibido:** brilho, néon, bloom, auras, gradientes radiais, sombras coloridas, glassmorphism, partículas de enfeite. Sombra só `FIXAS.sombra`. Desfoque só como foco ótico na entrada.
- **Texto:** português de Portugal, sem travessões, sem brasileirismos, sem repetir em letras o que a voz diz. Números à portuguesa (`numeroPT`: 12 121 · 7,49).
- **Inserts mudos.** O som é o da linha: SFX da tabela da skill de edição (Shorts e longos) ou `demo_som.py` (docs), no frame que cada skill indica (ex.: número-chave assenta no frame 44).
- **Movimento com causa:** pausa → viagem → pausa; a ação acontece na pausa. Fim com 20 a 30 frames estáveis para o corte.

## 5. Fluxo e gate

O gate é `scripts/andr3-gate.mjs`. Um chumbo é paragem obrigatória.

```bash
G=<skill>/scripts/andr3-gate.mjs
node $G dados dados/<insert>.json                          # 1. dados completos e coerentes
node $G lint .                                             # 2. código sem CSS nem DOM
npx tsc --noEmit                                           # 3. tipos
# 4. render a 4K (ou 2160x1920 nos Shorts)
npx remotion render src/index.ts <Comp> out/<insert>.mp4 --props=dados/<insert>.json --scale=2 --muted
node $G qa out/<insert>.mp4 --perfil <perfil> [--fps 30]   # 5. dimensões, fps, sem áudio, sem preto, duração + folha
```

Com fundo transparente (longos por defeito, ou qualquer insert por cima de imagem):

```bash
npx remotion render src/index.ts <Comp> out/<insert>.mov --props=dados/<insert>.json --scale=2 --muted \
  --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png
```

6. **Crítico independente:** quem fez não aprova. Um agente separado (ou o André) vê a `_folha.jpg` e o vídeo com `references/critico.md` e devolve aprovado/rejeitado. Sem crítico disponível, mostra a folha ao André e para.
7. **Entrega:** ficheiro na pasta de media do vídeo (Shorts: `paineis/`; longos: `media/`; dark: `out/m/`; híbridos: `04_inserts/`), com uma linha: duração, perfil, onde entra no guião, em que frame cai o som e o texto da lane de fonte.

## 6. O que nunca fazer

- Inventar página, logo, número, data, citação ou ligação. Se a prova não existe, o insert não existe.
- Recriar à mão uma página real. A página vem da captura (`capturar.js` / `captura3.mjs`); a reconstrução só serve para testes e diz "exemplo fictício".
- Seta de financiamento ou comando sem documento. Inspiração é tracejado.
- Rosto de pessoa privada sem desfoque (CC art. 79.º).
- Áudio de terceiros (Content ID).
