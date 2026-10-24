#!/usr/bin/env bash
#
# Resumen corto del estado del Checador en el EC2 (lo imprime ssm-deploy.sh
# después del deploy: la salida del bootstrap llega truncada por SSM a 24 KB).
# No falla en el primer problema: reporta todo y sale con != 0 si algo falló.
set -uo pipefail

PUBLIC_HOST="${PUBLIC_HOST:-core.lumen-view.com}"
APP_USER="${APP_USER:-ec2-user}"
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
check "jc-core vía nginx (GET /)" curl -fsS --max-time 5 -o /dev/null -w "%{http_code}" --resolve "${PUBLIC_HOST}:443:127.0.0.1" "https://${PUBLIC_HOST}/"
check "nginx -t" nginx -t
check "include en nginx" grep -c "lumen-attendance.conf" /etc/nginx/conf.d/lumenview.conf

exit "${failed}"
