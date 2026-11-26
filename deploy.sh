#!/usr/bin/env bash
set -euo pipefail

REMOTE="guraouml@premium212.web-hosting.com"
PORT=21098
API_URL="https://api.guraaha.com"
APP_ROOT="repositories/GuraAha/backend"
NODE_VER="24"
SSH="ssh -p $PORT"
ROOT="$(git rev-parse --show-toplevel)"

[ "$(git branch --show-current)" = "main" ] || { echo "Switch to main first"; exit 1; }
git fetch origin
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || { echo "Local main is not up to date with origin/main"; exit 1; }

echo "==> Frontend"
cd "$ROOT/frontend"
npm ci
VITE_API_URL="$API_URL" npm run build
rsync -avz -e "$SSH" --delete dist/assets/ "$REMOTE:public_html/assets/"
rsync -avz -e "$SSH" --exclude assets/ dist/ "$REMOTE:public_html/"

echo "==> Backend"
cd "$ROOT/backend"
npm ci
npm run build
[ -f dist/server.js ] || { echo "dist/server.js missing, check your build"; exit 1; }
rsync -avz -e "$SSH" --delete dist/ "$REMOTE:$APP_ROOT/dist/"
rsync -avz -e "$SSH" package.json package-lock.json "$REMOTE:$APP_ROOT/"
rsync -avz -e "$SSH" database/ "$REMOTE:$APP_ROOT/database/"

if [ "${1:-}" = "--install" ]; then
  $SSH "$REMOTE" "source ~/nodevenv/$APP_ROOT/$NODE_VER/bin/activate && cd ~/$APP_ROOT && npm install --omit=dev"
fi

$SSH "$REMOTE" "mkdir -p ~/$APP_ROOT/tmp && touch ~/$APP_ROOT/tmp/restart.txt"

echo "==> Checks"
sleep 3
curl -s -o /dev/null -w "site: %{http_code}\n" https://guraaha.com
curl -s https://api.guraaha.com/health; echo
