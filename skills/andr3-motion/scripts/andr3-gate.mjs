#!/usr/bin/env node
// Gate do Andr3 Motion. Três verificações, todas bloqueantes:
//   lint  <projeto>                     código sem CSS, sem DOM, cores só nos tokens, sem glow
//   dados <ficheiro.json>               dados do insert completos e coerentes (fontes, datas, caixas)
//   qa    <video> --formato doc|short   render certo (dimensões, fps, sem áudio, sem preto, duração) + folha
// Sai com código 1 ao primeiro chumbo. Só "GATE OK" autoriza seguir.
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [cmd, alvo, ...resto] = process.argv.slice(2);
const opt = (n) => {
  const i = resto.indexOf(`--${n}`);
  return i >= 0 ? resto[i + 1] : undefined;
};
const erros = [];
const avisos = [];
const falha = (m) => erros.push(m);
const aviso = (m) => avisos.push(m);
const fim = () => {
  for (const a of avisos) console.log(`AVISO  ${a}`);
  for (const e of erros) console.log(`CHUMBO ${e}`);
  if (erros.length) {
    console.log(`\nGATE CHUMBADO (${erros.length})`);
    process.exit(1);
  }
  console.log('\nGATE OK');
};

const BRASILEIRISMOS = /\b(galera|você|vocês|a gente|ônibus|celular|tela|trem|bacana|legal demais)\b/i;

const ficheiros = (dir) =>
  fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : ficheiros(p);
    return /\.(tsx?|jsx?|mjs)$/.test(e.name) ? [p] : [];
  });

// Texto dentro de strings e JSX, para as regras de escrita (travessões, brasileirismos).
const textos = (src) => [...src.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1|>([^<>{}]+)</g)].map((m) => m[2] ?? m[3] ?? '');

const REGRAS = [
  [/\bstyle\s*=\s*\{/, 'style={...} é CSS. Desenha em Skia (posição, cor e tamanho são props do Skia).'],
  [/\bclassName\s*=/, 'className é CSS. Proibido.'],
  [/import\s[^;]*\.(css|scss|sass|less)['"]/, 'Import de folha de estilo. Proibido.'],
  [/@keyframes|styled-components|@emotion|tailwind/i, 'Animação/estilo CSS. A animação é sempre por frame (interpolate/spring).'],
  [/<(div|span|p|h[1-6]|img|svg|section|button|ul|li|a|canvas)\b/, 'Elemento DOM. Tudo o que se vê é desenhado dentro do <SkiaCanvas>.'],
  [/<AbsoluteFill\b/, 'AbsoluteFill traz estilo. Usa <SkiaCanvas> como raiz.'],
  [/<(Img|Video|OffthreadVideo|Html5Video|IFrame)\b/, 'Imagem/vídeo DOM. Imagens via useImagem() em Skia; clips entram no Final Cut, não no insert.'],
  [/<Audio\b|<Html5Audio\b/, 'Áudio no insert. Os inserts são mudos; o som é feito no demo_som.py (Content ID).'],
  [/\b(RadialGradient|SweepGradient|TwoPointConicalGradient|BlurMask)\b/, 'Gradiente radial/brilho. Proibido (glow, orbs, auras).'],
];

if (cmd === 'lint') {
  const raiz = path.resolve(alvo ?? '.');
  const src = path.join(raiz, 'src');
  if (!fs.existsSync(src)) falha(`Não encontro ${src}.`);
  else
    for (const f of ficheiros(src)) {
      const rel = path.relative(raiz, f);
      const s = fs.readFileSync(f, 'utf8');
      const linhas = s.split('\n');
      linhas.forEach((l, i) => {
        if (/^\s*\/\//.test(l)) return;
        for (const [re, msg] of REGRAS) if (re.test(l)) falha(`${rel}:${i + 1} ${msg}`);
        if (/<Sequence\b/.test(l) && !/layout=["']none["']/.test(l)) falha(`${rel}:${i + 1} <Sequence> sem layout="none" cria um div com estilo.`);
        if (!rel.endsWith(path.join('lib', 'tokens.ts')) && /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(l.replace(/\/\/.*$/, '')))
          falha(`${rel}:${i + 1} Cor fora dos tokens. Usa PALETAS/FIXAS de lib/tokens.ts.`);
        if (/<Shadow\b/.test(l) && !/FIXAS\.sombra/.test(l)) falha(`${rel}:${i + 1} Sombra tem de ser FIXAS.sombra (neutra, nunca colorida).`);
        if (/\bLinearGradient\b/.test(l)) aviso(`${rel}:${i + 1} Gradiente linear: só se for material real (papel, luz natural), nunca "AI glow".`);
      });
      for (const t of textos(s)) {
        if (t.includes('—')) falha(`${rel}: travessão em texto ("${t.slice(0, 40)}"). Usa vírgulas.`);
        if (BRASILEIRISMOS.test(t)) falha(`${rel}: brasileirismo em texto ("${t.slice(0, 40)}").`);
      }
    }
  fim();
} else if (cmd === 'dados') {
  const d = JSON.parse(fs.readFileSync(alvo, 'utf8'));
  const tudo = JSON.stringify(d);
  if (!['doc', 'short'].includes(d.formato)) falha('formato tem de ser "doc" (16:9) ou "short" (9:16).');
  if (!['escuro', 'transparente'].includes(d.fundo)) falha('fundo tem de ser "escuro" ou "transparente".');
  if (tudo.includes('—')) falha('Travessão nos dados. Usa vírgulas.');
  if (BRASILEIRISMOS.test(tudo)) falha('Brasileirismo nos dados.');
  const dataOk = (s) => /\d{4}/.test(s ?? '');
  if ('destaques' in d) {
    if (!d.fonte || !dataOk(d.fonte)) falha('Destaque sem fonte com data ("Publicação, DD/MM/AAAA").');
    if (!d.destaques.length) falha('Destaque sem caixas.');
    d.destaques.forEach((c, i) => {
      if (c.x < 0 || c.y < 0 || c.x + c.w > d.largura || c.y + c.h > d.altura) falha(`Caixa ${i} sai da captura (${d.largura}x${d.altura}).`);
      if (c.w > d.largura * 0.8) aviso(`Caixa ${i} quase da largura toda: destaca frases, não parágrafos.`);
    });
    if (d.destaques.length > 6) aviso('Mais de 6 destaques: o espectador deixa de ler. Corta.');
  }
  if ('arestas' in d) {
    const ids = new Set(d.nos.map((n) => n.id));
    const tipos = ['organizou', 'participou', 'apoiou', 'convocou', 'inspirou'];
    d.arestas.forEach((a, i) => {
      if (!ids.has(a.de) || !ids.has(a.para)) falha(`Aresta ${i} liga a um nó que não existe.`);
      if (!tipos.includes(a.tipo)) falha(`Aresta ${i}: tipo "${a.tipo}" não permitido (${tipos.join(', ')}). Financiamento/comando só com documento e tipo novo aprovado.`);
      if (!a.fonte || !dataOk(a.data)) falha(`Aresta ${i} sem fonte ou data. Só arestas provadas entram no mapa.`);
    });
  }
  if ('eventos' in d) d.eventos.forEach((e, i) => (!e.fonte || !e.data) && falha(`Evento ${i} sem data ou fonte.`));
  if ('valor' in d && (!d.fonte || !dataOk(d.fonte))) falha('Número-chave sem fonte com data.');
  fim();
} else if (cmd === 'qa') {
  const formato = opt('formato');
  const esperado = {doc: [1920, 1080], short: [1080, 1920]}[formato];
  if (!esperado) falha('Indica --formato doc ou --formato short.');
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,pix_fmt:format=duration', '-of', 'json', alvo]).toString());
  const v = probe.streams.find((s) => s.codec_type === 'video');
  if (probe.streams.some((s) => s.codec_type === 'audio')) falha('O insert tem áudio. Renderiza com --muted (o som entra na mistura, não no insert).');
  if (esperado && (v.width !== esperado[0] || v.height !== esperado[1])) falha(`Dimensões ${v.width}x${v.height}, esperado ${esperado.join('x')}.`);
  if (v.r_frame_rate !== '30/1') falha(`fps ${v.r_frame_rate}, esperado 30.`);
  const dur = Number(probe.format.duration);
  // O ffmpeg escreve o detetor no stderr. (Sem freezedetect: o grão mexe em todos os frames
  // e o teste nunca falharia; pausas e imagem parada são verificadas pelo crítico.)
  const saida = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', alvo, '-vf', 'blackdetect=d=0.4:pix_th=0.04', '-an', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
  // Com alfa (ProRes 4444) o transparente lê-se como preto: aí o teste não se aplica.
  if (!/^yuva|^rgba|^argb|^bgra/.test(v.pix_fmt ?? '') && /black_start/.test(saida)) falha('Frames pretos acima de 0,4 s.');
  if (dur < 2 || dur > 20) aviso(`Duração ${dur.toFixed(1)} s: um insert costuma ter 4 a 15 s.`);
  const folha = alvo.replace(/\.[^.]+$/, '_folha.jpg');
  const n = Math.max(4, Math.ceil(dur));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', alvo, '-vf', `fps=1,scale=${formato === 'short' ? 270 : 480}:-1,tile=${Math.min(n, 6)}x${Math.ceil(n / 6)}:padding=8:color=white`, '-frames:v', '1', folha]);
  console.log(`Folha: ${folha} · ${v.width}x${v.height} · ${dur.toFixed(2)} s`);
  fim();
} else {
  console.log('uso: andr3-gate.mjs lint <projeto> | dados <ficheiro.json> | qa <video> --formato doc|short');
  process.exit(2);
}
