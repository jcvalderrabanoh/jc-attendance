#!/usr/bin/env bash
#
# Instala o actualiza el Checador en el EC2 de jc-core. Corre como root (SSM).
# Idempotente: la primera vez prepara todo; las siguientes solo despliegan.
#
#   1. Clona/actualiza el repo (público) en /home/ec2-user/jc-attendance.
#   2. Si falta apps/api/.env, lo arma desde el .env de jc-core (misma BD,
#      mismo JWT_SECRET, mismo Redis) con un EMPLOYEE_JWT_SECRET propio.
#   3. API: deploy/release.sh (build fuera del vivo, migraciones del esquema
#      attendance, pm2 reload sin corte).
#   4. PWA: build con base /asistencia/ y copia a /var/www/asistencia.
#   5. nginx: incluye deploy/nginx/attendance.conf en el server 443 de
#      core.lumen-view.com, valida con `nginx -t` y recarga; si falla, revierte.
#   6. Dominio propio (deploy/own-domain.sh), solo si su DNS apunta aquí.
#
# Lo lanza el workflow «Deploy Checador» (jc-core o este repo).
set -euo pipefail

APP_USER="${APP_USER:-ec2-user}"
APP_DIR="${APP_DIR:-/home/${APP_USER}/jc-attendance}"
CORE_ENV="${CORE_ENV:-/home/${APP_USER}/jc-core/.env}"
REPO_URL="${REPO_URL:-https://github.com/jcvalderrabanoh/jc-attendance.git}"
BRANCH="${BRANCH:-main}"
PUBLIC_HOST="${PUBLIC_HOST:-core.lumen-view.com}"
FRONT_ORIGIN="${FRONT_ORIGIN:-https://app.lumen-view.com}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/lumenview.conf}"
NGINX_SNIPPET="/etc/nginx/snippets/lumen-attendance.conf"
WEB_ROOT="/var/www/asistencia"

log() { echo "[bootstrap] $*"; }
as_app() { sudo -u "${APP_USER}" bash -c "$1"; }

# --- 1. Código -----------------------------------------------------------
if [ ! -d "${APP_DIR}/.git" ]; then
  log "clonando ${REPO_URL}"
  as_app "git clone --branch ${BRANCH} ${REPO_URL} ${APP_DIR}"
fi
as_app "cd ${APP_DIR} && git fetch origin ${BRANCH} && git reset --hard origin/${BRANCH}"

# --- 2. .env -------------------------------------------------------------
ENV_FILE="${APP_DIR}/apps/api/.env"
core_value() { grep -E "^$1=" "${CORE_ENV}" | tail -1 | cut -d= -f2- || true; }
if [ ! -f "${ENV_FILE}" ]; then
  [ -f "${CORE_ENV}" ] || { echo "No existe ${CORE_ENV}" >&2; exit 1; }
  log "creando ${ENV_FILE} a partir de ${CORE_ENV}"
  umask 077
  {
    echo "# Generado por deploy/bootstrap-ec2.sh el $(date -u +%FT%TZ)."
    echo "# Misma BD, JWT y Redis que jc-core; EMPLOYEE_JWT_SECRET propio."
    for key in POSTGRES_HOST POSTGRES_PORT POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB \
               JWT_SECRET REDIS_HOST REDIS_PORT REDIS_PASSWORD \
               TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_WHATSAPP_FROM; do
      val="$(core_value "${key}")"
      [ -n "${val}" ] && echo "${key}=${val}"
    done
    echo "EMPLOYEE_JWT_SECRET=$(openssl rand -hex 32)"
    echo "PORT=3100"
    echo "PUBLIC_APP_URL=https://${PUBLIC_HOST}/asistencia"
    echo "CORS_ORIGINS=${FRONT_ORIGIN},https://${PUBLIC_HOST}"
    # otp-setup.py lo cambia a `twilio-messaging` o `twilio` si hay Twilio.
    echo "OTP_PROVIDER=log"
  } > "${ENV_FILE}"
  chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
else
  log "${ENV_FILE} ya existe; no se toca"
fi

# Código de acceso del empleado: plantilla de WhatsApp de jc-core o Twilio
# Verify (idempotente, no fatal: si no se puede, sale en el log del servidor).
python3 "${APP_DIR}/deploy/otp-setup.py" "${ENV_FILE}" "${CORE_ENV}" || true

# --- 3. API --------------------------------------------------------------
log "desplegando el API"
as_app "cd ${APP_DIR} && bash deploy/release.sh"

# --- 4. PWA --------------------------------------------------------------
# No fatal: si la PWA no compila, el API ya quedó arriba con la versión nueva.
log "compilando la PWA"
PWA_BUILD="${APP_DIR}-pwa-build"
if as_app "rm -rf ${PWA_BUILD} && mkdir -p ${PWA_BUILD} && git -C ${APP_DIR} archive HEAD | tar -x -C ${PWA_BUILD} \
    && cd ${PWA_BUILD} && npm ci --workspace @jc-attendance/pwa --include-workspace-root \
    && NODE_OPTIONS=--max-old-space-size=2048 npm run build:prod -w @jc-attendance/pwa"; then
  mkdir -p "${WEB_ROOT}.new"
  cp -a "${PWA_BUILD}/apps/pwa/dist/pwa/browser/." "${WEB_ROOT}.new/"
  rm -rf "${WEB_ROOT}.old"
  [ -d "${WEB_ROOT}" ] && mv "${WEB_ROOT}" "${WEB_ROOT}.old"
  mv "${WEB_ROOT}.new" "${WEB_ROOT}"
  rm -rf "${WEB_ROOT}.old"
  chmod -R a+rX "${WEB_ROOT}"
  log "PWA publicada en ${WEB_ROOT}"
else
  echo "[bootstrap] AVISO: la PWA no compiló; se mantiene la versión anterior" >&2
fi
rm -rf "${PWA_BUILD}"

# --- 5. nginx ------------------------------------------------------------
log "nginx"
mkdir -p "$(dirname "${NGINX_SNIPPET}")"
cp "${APP_DIR}/deploy/nginx/attendance.conf" "${NGINX_SNIPPET}.new"
BACKUP="${NGINX_CONF}.bak-attendance"
cp -a "${NGINX_CONF}" "${BACKUP}"
[ -f "${NGINX_SNIPPET}" ] && cp -a "${NGINX_SNIPPET}" "${NGINX_SNIPPET}.prev"
mv "${NGINX_SNIPPET}.new" "${NGINX_SNIPPET}"
python3 "${APP_DIR}/deploy/nginx/include-attendance.py" "${NGINX_CONF}" "${PUBLIC_HOST}" "${NGINX_SNIPPET}"
if nginx -t; then
  systemctl reload nginx
  log "nginx recargado"
else
  echo "[bootstrap] nginx -t falló: se revierte" >&2
  cp -a "${BACKUP}" "${NGINX_CONF}"
  if [ -f "${NGINX_SNIPPET}.prev" ]; then mv "${NGINX_SNIPPET}.prev" "${NGINX_SNIPPET}"; else rm -f "${NGINX_SNIPPET}"; fi
  nginx -t && systemctl reload nginx
  exit 1
fi
rm -f "${NGINX_SNIPPET}.prev"

# Dominio propio (asistencia.lumen-view.com): solo si su DNS ya apunta aquí.
bash "${APP_DIR}/deploy/own-domain.sh" || true

# --- Verificación --------------------------------------------------------
sleep 2
curl -fsS "http://127.0.0.1:3100/health" && echo
curl -fsS -o /dev/null -w "[bootstrap] https://${PUBLIC_HOST}/attendance/health → %{http_code}\n" \
  --resolve "${PUBLIC_HOST}:443:127.0.0.1" "https://${PUBLIC_HOST}/attendance/health" || true
log "listo"
