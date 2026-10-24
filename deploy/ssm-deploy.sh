#!/usr/bin/env bash
#
# Lanza deploy/bootstrap-ec2.sh en el EC2 por SSM y espera el resultado.
# Lo usan el deploy.yml de este repo y el workflow «Deploy Checador» de jc-core.
# Requiere credenciales de AWS ya configuradas e INSTANCE_ID.
set -euo pipefail

: "${INSTANCE_ID:?Falta INSTANCE_ID}"
REPO_URL="${REPO_URL:-https://github.com/jcvalderrabanoh/jc-attendance.git}"
BRANCH="${BRANCH:-main}"
DIR=/home/ec2-user/jc-attendance

read -r -d '' REMOTE <<SH || true
set -e
if [ ! -d ${DIR}/.git ]; then sudo -u ec2-user git clone --branch ${BRANCH} ${REPO_URL} ${DIR}; fi
sudo -u ec2-user bash -c 'cd ${DIR} && git fetch origin ${BRANCH} && git reset --hard origin/${BRANCH}'
BRANCH=${BRANCH} bash ${DIR}/deploy/bootstrap-ec2.sh
SH

# Manda un script por SSM, espera y deja su salida en $OUT; devuelve 0 si terminó bien.
run_remote() {
  local script="$1" comment="$2" params command_id status
  params="$(jq -n --arg c "${script}" '{commands: [$c]}')"
  command_id=$(aws ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --timeout-seconds 3600 \
    --comment "${comment}" \
    --parameters "${params}" \
    --query 'Command.CommandId' --output text)
  echo "Command ID: ${command_id}"
  for _ in $(seq 1 120); do
    status=$(aws ssm get-command-invocation --command-id "${command_id}" --instance-id "${INSTANCE_ID}" \
      --query 'Status' --output text 2>/dev/null || echo "InProgress")
    echo "Status: ${status}"
    case "${status}" in
      Success|Failed|Cancelled|TimedOut)
        OUT="$(aws ssm get-command-invocation --command-id "${command_id}" --instance-id "${INSTANCE_ID}" \
          --query '[StandardOutputContent, StandardErrorContent]' --output text)"
        [ "${status}" = "Success" ]
        return
        ;;
    esac
    sleep 10
  done
  OUT="Timeout esperando el comando"
  return 1
}

deploy_ok=0
run_remote "${REMOTE}" "Deploy Checador (jc-attendance ${BRANCH})" || deploy_ok=$?
echo "----- deploy (últimas líneas; SSM trunca la salida a 24 KB) -----"
echo "${OUT}" | tail -60

# Siempre: un resumen corto que SSM no trunca.
verify_ok=0
run_remote "bash ${DIR}/deploy/verify-ec2.sh" "Verificar Checador" || verify_ok=$?
echo "----- verificación -----"
echo "${OUT}"

if [ "${deploy_ok}" -ne 0 ] || [ "${verify_ok}" -ne 0 ]; then exit 1; fi
