#!/usr/bin/env bash
# Builds GExam-Setup-<version>.exe (Windows x64 installer) from Linux: bundled Node runtime, server, UI, question bank.
#   ./packaging/build-exe.sh
#   QUESTIONS_DIR=/path/to/gate-questions VERSION=1.2.0 ./packaging/build-exe.sh
# Needs: node, npm, makensis (apt install nsis), curl.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${VERSION:-1.0.1}"
QUESTIONS_DIR="${QUESTIONS_DIR:-../gate-questions}"
NODE_VERSION="${NODE_VERSION:-$(node -p 'process.versions.node')}"
[ -d "$QUESTIONS_DIR" ] || { echo "Question bank not found at $QUESTIONS_DIR (set QUESTIONS_DIR)" >&2; exit 1; }
command -v makensis >/dev/null || { echo "makensis missing: sudo apt install nsis" >&2; exit 1; }

OUT=packaging/build
STAGE="$OUT/win-stage"
CACHE="$OUT/cache"
rm -rf "$STAGE"; mkdir -p "$STAGE" "$CACHE"

NODE_EXE="$CACHE/node-v$NODE_VERSION-win-x64.exe"
if [ ! -f "$NODE_EXE" ]; then
  echo "==> Downloading Windows Node.js v$NODE_VERSION"
  curl -fL -o "$NODE_EXE.part" "https://nodejs.org/dist/v$NODE_VERSION/win-x64/node.exe"
  mv "$NODE_EXE.part" "$NODE_EXE"
fi

echo "==> Building UI"
npm run build

echo "==> Bundling server"
npx esbuild server/index.ts --bundle --platform=node --format=esm --target=node22 \
  --outfile="$STAGE/server.mjs" --external:vite --external:fsevents --log-level=warning \
  --banner:js="import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);"

echo "==> Staging files"
cp "$NODE_EXE" "$STAGE/gexam-node.exe"
cp -r dist "$STAGE/dist"
mkdir -p "$STAGE/gate-questions"
tar -C "$QUESTIONS_DIR" --exclude=.git --exclude=extracted_questions.json -cf - . | tar -C "$STAGE/gate-questions" -xf -
cp packaging/gexam.ico "$STAGE/gexam.ico"

printf '@echo off\r\ntitle GExam Server\r\ncd /d "%%~dp0"\r\nset NODE_ENV=production\r\nset PORT=3000\r\nset DATA_DIR=%%ProgramData%%\\GExam\r\nset QUESTIONS_DIR=%%~dp0gate-questions\r\nif exist "%%ProgramData%%\\GExam\\gexam.bat" call "%%ProgramData%%\\GExam\\gexam.bat"\r\necho GExam is running. Students open  http://YOUR-PC-IP:%%PORT%%   Admin: http://localhost:%%PORT%%/admin\r\necho Close this window to stop the server.\r\necho.\r\nipconfig ^| findstr /C:"IPv4"\r\necho.\r\ngexam-node.exe server.mjs\r\npause\r\n' > "$STAGE/GExam Server.bat"
printf '[InternetShortcut]\r\nURL=http://localhost:3000/admin\r\n' > "$STAGE/GExam Admin.url"

echo "==> Building installer"
OUTFILE="$(pwd)/$OUT/GExam-Setup-$VERSION.exe"
makensis -V2 -DSTAGE="$(pwd)/$STAGE" -DVERSION="$VERSION" -DOUTFILE="$OUTFILE" packaging/gexam.nsi
ls -lh "$OUTFILE"
