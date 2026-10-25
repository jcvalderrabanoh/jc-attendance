#!/usr/bin/env bash
#
# Dominio propio del Checador (por defecto asistencia.lumen-view.com). Corre
# como root en cada deploy (bootstrap-ec2.sh) y NUNCA es fatal: si falta algo,
# avisa y deja todo como estaba. core.lumen-view.com/asistencia sigue igual.
#
# Se activa solo cuando el DNS de ATTENDANCE_HOST ya apunta a este EC2:
#   1. server :80 con el webroot de ACME (mismo /var/www/html que jc-core).
#   2. certbot certonly --webroot (no toca lumenview.conf de jc-core).
#   3. server :443 con el mismo snippet del Checador; `/` → `/asistencia/`.
# Cada paso valida con `nginx -t`; si falla, borra el archivo y recarga.
set -uo pipefail

HOST="${ATTENDANCE_HOST:-asistencia.lumen-view.com}"
# Rutas sobreescribibles solo para probar el script fuera del EC2.
CONF="${ATTENDANCE_DOMAIN_CONF:-/etc/nginx/conf.d/attendance-domain.conf}"
SNIPPET="/etc/nginx/snippets/lumen-attendance.conf"
WEBROOT="${ACME_WEBROOT:-/var/www/html}"
LIVE="${LE_LIVE_DIR:-/etc/letsencrypt/live}/${HOST}"

log() { echo "[dominio] $*"; }

# IP pública de esta instancia (IMDSv2) y a dónde apunta el DNS del dominio.
token=$(curl -fsS --max-time 2 -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null || true)
my_ip=$(curl -fsS --max-time 2 -H "X-aws-ec2-metadata-token: ${token}" \
  "http://169.254.169.254/latest/meta-data/public-ipv4" 2>/dev/null || true)
dns_ips=$(getent ahostsv4 "${HOST}" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ')

if [ -z "${my_ip}" ] || ! grep -qw -- "${my_ip}" <<<"${dns_ips}"; then
  log "${HOST} no apunta a este servidor (DNS: ${dns_ips:-sin registro}; EC2: ${my_ip:-?}); se omite"
  exit 0
fi

apply() {
  local content="$1" label="$2" prev=""
  [ -f "${CONF}" ] && prev="$(cat "${CONF}")"
  printf '%s\n' "${content}" > "${CONF}"
  if nginx -t >/dev/null 2>&1 && systemctl reload nginx; then
    log "${label}: nginx recargado"
    return 0
  fi
  log "${label}: nginx -t falló, se revierte"
  if [ -n "${prev}" ]; then printf '%s\n' "${prev}" > "${CONF}"; else rm -f "${CONF}"; fi
  nginx -t >/dev/null 2>&1 && systemctl reload nginx
  return 1
}

HTTP_SERVER="server {
    listen 80;
    server_name ${HOST};
    location /.well-known/acme-challenge/ { root ${WEBROOT}; }
    location / { return 301 https://\$host\$request_uri; }
}"

if [ ! -f "${LIVE}/fullchain.pem" ]; then
  apply "# Generado por jc-attendance/deploy/own-domain.sh (solo HTTP mientras se emite el certificado).
${HTTP_SERVER}" "HTTP de ${HOST}" || exit 0
  mkdir -p "${WEBROOT}"
  if ! certbot certonly --webroot -w "${WEBROOT}" -d "${HOST}" \
      --non-interactive --agree-tos --register-unsafely-without-email --keep-until-expiring >/tmp/certbot-attendance.log 2>&1; then
    log "certbot falló (detalle en /tmp/certbot-attendance.log); queda solo HTTP"
    exit 0
  fi
  log "certificado emitido para ${HOST}"
fi

apply "# Generado por jc-attendance/deploy/own-domain.sh. No editar a mano.
${HTTP_SERVER}
server {
    listen 443 ssl;
    server_name ${HOST};
    ssl_certificate ${LIVE}/fullchain.pem;
    ssl_certificate_key ${LIVE}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location = / { return 302 /asistencia/; }
    location /.well-known/acme-challenge/ { root ${WEBROOT}; }
    include ${SNIPPET};
}" "HTTPS de ${HOST}" || exit 0
log "listo: https://${HOST}/"
