---
name: andr3-mapas
description: Números-chave, mapas de relações e cronologias animados em Skia sem CSS para o Andr3 News, alimentados só por factos do ledger. Usar quando o beat é um número, uma ligação entre pessoas ou organizações, ou uma sequência de datas.
---

# Andr3 Mapas · números, ligações, datas

Lê primeiro `andr3-motion`. Três composições do template, todas por JSON em `dados/`.

## Número-chave (`Numero`)

Para os 2 a 3 números-chave do doc (os mesmos que levam antecipação sonora). Só números com código C (🟢) no ledger.

```json
{"formato": "doc", "fundo": "escuro", "valor": 7.49, "casas": 2, "prefixo": "", "sufixo": " M",
 "rotulo": "utilizadores de YouTube em Portugal", "fonte": "DataReportal, 01/2025"}
```

| Frames | Ação | Som |
|---|---|---|
| 0 a 10 | Entra | riser termina antes |
| 8 a 44 | Conta até ao valor, a desacelerar | silêncio (só a cama) |
| **44** | Assenta com um ligeiro recuo de escala | **impacto + `numero()`** |
| 40 a 58 | Linha de acento por baixo | |
| 48 a 62 | Rótulo | |
| 50 | Caixa de fonte | `fonte()` |

- Números à portuguesa (12 121 · 7,49). Arredonda como a voz diz; o valor exato vai no rótulo ou na fonte se for preciso.
- O rótulo diz o que o número mede, curto. Não repete a frase da narração.
- Percentagem sem a base é meia verdade: se a base importa, põe-a no rótulo ("23% dos internautas").

## Mapa de relações (`Mapa`)

Só **arestas provadas**: código C ou A no ledger, com fonte e data próprias. Uma organização a falar de si prova a agenda dela, não descreve terceiros.

```json
{
  "formato": "doc", "fundo": "escuro",
  "nos": [{"id": "a", "rotulo": "ORGANIZAÇÃO A", "x": 0, "y": 0}, {"id": "x", "rotulo": "EVENTO X", "x": 1300, "y": 0}],
  "arestas": [{"de": "a", "para": "x", "tipo": "organizou", "fonte": "Comunicado A", "data": "02/10/2026"}]
}
```

- Tipos permitidos: `organizou`, `participou`, `apoiou`, `convocou` (linha cheia, acento) e `inspirou` (tracejado, cinzento). Presença, apoio, participação, convocação e organização são coisas diferentes: usa a palavra que a fonte prova, não a mais forte.
- **Financiamento, comando, controlo:** não há tipo. Só se houver documento, e então pede ao André para aprovar um tipo novo.
- Coordenadas em espaço do mundo; a câmara enquadra sozinha. Deixa ~1300 px entre nós na horizontal e ~400 na vertical: setas compridas leem-se melhor do que nós apertados.
- Ordem das arestas = ordem da narração. Cada aresta: 54 frames (linha desenha 22, etiqueta com tipo, fonte e data, caixa de fonte troca).
- Nomes de pessoas privadas não entram no mapa.

## Cronologia (`Cronologia`)

```json
{"formato": "doc", "fundo": "escuro", "eventos": [{"data": "2019", "texto": "O que aconteceu, numa frase.", "fonte": "Diário da República, 2019"}]}
```

- 3 a 6 eventos. Cada um: 60 frames, a câmara viaja da esquerda para a direita e a caixa de fonte acompanha o evento ativo.
- Datas exatas só quando confirmadas; se só se sabe o ano, põe o ano.
- O último evento é o "hoje" que abre a pergunta do doc. Termina com plano geral de todas as datas.

## Render e gate

```bash
G=<skill-andr3-motion>/scripts/andr3-gate.mjs
node $G dados dados/<x>.json && node $G lint .
npx remotion render src/index.ts <Numero|Mapa|Cronologia> out/<x>.mp4 --props=dados/<x>.json --muted
node $G qa out/<x>.mp4 --formato doc
```

O gate `dados` chumba arestas sem fonte ou data, tipos fora da lista, eventos sem fonte e números sem fonte datada.
