#!/usr/bin/env bash
#
# Resumen corto del estado del Checador en el EC2 (lo imprime ssm-deploy.sh
# después del deploy: la salida del bootstrap llega truncada por SSM a 24 KB).
# No falla en el primer problema: reporta todo y sale con != 0 si algo falló.
set -uo pipefail

PUBLIC_HOST="${PUBLIC_HOST:-core.lumen-view.com}"
APP_USER="${APP_USER:-ec2-user}"
CORE_PORT="${CORE_PORT:-3001}"
failed=0
check() {
  local label="$1"; shift
  if out="$("$@" 2>&1)"; then echo "OK    ${label}: ${out}"; else echo "FALLA ${label}: ${out}"; failed=1; fi
}

check "pm2 jc-attendance-api" sudo -u "${APP_USER}" bash -c \
  "pm2 jlist | node -e 'let s=\"\";process.stdin.on(\"data\",d=>s+=d).on(\"end\",()=>{const p=JSON.parse(s).find(x=>x.name===\"jc-attendance-api\");if(!p||p.pm2_env.status!==\"online\"){console.log(p?p.pm2_env.status:\"no existe\");process.exit(1)}console.log(p.pm2_env.status+\" reinicios=\"+p.pm2_env.restart_time)})'"
check "API local /health" curl -fsS --max-time 5 http://127.0.0.1:3100/health
check "API vía nginx" curl -fsS --max-time 5 --resolve "${PUBLIC_HOST}:443:127.0.0.1" "https://${PUBLIC_HOST}/attendance/health"
check "PWA vía nginx" curl -fsS --max-time 5 -o /dev/null -w "%{http_code} %{content_type}" --resolve "${PUBLIC_HOST}:443:127.0.0.1" "https://${PUBLIC_HOST}/asistencia/"
check "jc-core local (GET / health)" curl -fsS --max-time 10 "http://127.0.0.1:${CORE_PORT}/"
check "jc-core FHIR (/fhir/metadata)" bash -c "curl -fsS --max-time 10 'http://127.0.0.1:${CORE_PORT}/fhir/metadata' | grep -o '\"fhirVersion\":\"[0-9.]*\"'"
# Vía nginx basta con que jc-core conteste (401/404 incluidos): 502/503/504 = caído.
check "jc-core vía nginx" bash -c "code=\$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' --resolve '${PUBLIC_HOST}:443:127.0.0.1' 'https://${PUBLIC_HOST}/public-viewer'); echo \$code; case \$code in 000|502|503|504) exit 1;; esac"
# Informativo (no falla): `log` = el código solo sale en el log del servidor.
ATT_ENV="/home/${APP_USER}/jc-attendance/apps/api/.env"
echo "INFO  OTP del empleado: $(grep -E '^OTP_PROVIDER=' "${ATT_ENV}" | cut -d= -f2)$(grep -qE '^TWILIO_PHONE_NUMBER=.+' "${ATT_ENV}" && echo ' (con respaldo SMS)' || echo ' (sin respaldo SMS)')"
# Solo nombres de claves (nunca valores): qué falta para WhatsApp con plantilla.
CORE_ENV_FILE="/home/${APP_USER}/jc-core/.env"
for key in TWILIO_WHATSAPP_FROM TWILIO_SIGNUP_OTP_CONTENT_SID TWILIO_PHONE_NUMBER; do
  in_core=$(grep -qE "^${key}=.+" "${CORE_ENV_FILE}" && echo sí || echo no)
  echo "INFO  ${key}: jc-core=${in_core}"
done
# Dominio propio: informativo hasta que su DNS apunte aquí (own-domain.sh).
OWN_HOST="${ATTENDANCE_HOST:-asistencia.lumen-view.com}"
if [ -f /etc/nginx/conf.d/attendance-domain.conf ] && grep -q "listen 443" /etc/nginx/conf.d/attendance-domain.conf; then
  check "PWA en ${OWN_HOST}" curl -fsS --max-time 5 -o /dev/null -w "%{http_code} %{content_type}" --resolve "${OWN_HOST}:443:127.0.0.1" "https://${OWN_HOST}/asistencia/"
else
  echo "INFO  dominio ${OWN_HOST}: inactivo (falta DNS → IP pública del EC2)"
fi
check "nginx -t" nginx -t
check "include en nginx" grep -c "lumen-attendance.conf" /etc/nginx/conf.d/lumenview.conf

exit "${failed}"
