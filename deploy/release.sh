#!/usr/bin/env bash
#
# Igual que jc-core/deploy/release.sh: compila FUERA del directorio vivo,
# migra y cambia `node_modules` + los `dist` por rename; luego `pm2 reload`
# sin corte. Si algo falla antes del rename, producción no se toca.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ec2-user/jc-attendance}"
BUILD_DIR="${BUILD_DIR:-${APP_DIR}-build}"
OLD_DIR="${OLD_DIR:-${APP_DIR}-previous}"
SWAPPED_DIRS=(node_modules libs/rules-engine/dist apps/api/dist)
PM2_APP_NAME="jc-attendance-api"

log() { echo "[release] $*"; }

rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"
git -C "${APP_DIR}" archive HEAD | tar -x -C "${BUILD_DIR}"
# Las migraciones leen las credenciales del .env vivo.
ln -s "${APP_DIR}/apps/api/.env" "${BUILD_DIR}/apps/api/.env"

cd "${BUILD_DIR}"
log "npm ci"
npm ci --workspace @jc-attendance/rules-engine --workspace @jc-attendance/api --include-workspace-root
log "build"
npm run build -w @jc-attendance/rules-engine
npm run build -w @jc-attendance/api
log "migraciones (esquema attendance)"
npm run migration:run -w @jc-attendance/api
npm prune --omit=dev

log "swap"
rm -rf "${OLD_DIR}"
for dir in "${SWAPPED_DIRS[@]}"; do
  mkdir -p "$(dirname "${OLD_DIR}/${dir}")"
  if [ -e "${APP_DIR}/${dir}" ]; then mv "${APP_DIR}/${dir}" "${OLD_DIR}/${dir}"; fi
  mkdir -p "$(dirname "${APP_DIR}/${dir}")"
  mv "${BUILD_DIR}/${dir}" "${APP_DIR}/${dir}"
done

cd "${APP_DIR}"
if pm2 describe "${PM2_APP_NAME}" > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
  pm2 save
fi
log "listo"
