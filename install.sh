#!/usr/bin/env bash
# Cria um projeto de inserts Andr3 Motion pronto a usar.
# uso: bash install.sh [pasta-destino]   (por defeito: ./andr3-motion)
set -euo pipefail
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESTINO="${1:-andr3-motion}"
command -v node >/dev/null || { echo "✗ Precisas do Node.js (https://nodejs.org)."; exit 1; }
command -v ffmpeg >/dev/null || echo "! Sem ffmpeg: o gate 'qa' não vai correr (brew install ffmpeg)."
[ -e "$DESTINO" ] && { echo "✗ $DESTINO já existe."; exit 1; }
cp -R "$AQUI/skills/andr3-motion/template" "$DESTINO"
cd "$DESTINO"
npm install --no-audit --no-fund
npm run exemplo:pagina
node "$AQUI/skills/andr3-motion/scripts/andr3-gate.mjs" lint .
echo "✓ Pronto em $DESTINO. Pré-visualizar: npx remotion studio src/index.ts"
