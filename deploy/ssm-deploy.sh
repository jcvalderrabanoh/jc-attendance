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

PARAMS="$(jq -n --arg c "${REMOTE}" '{commands: [$c]}')"
COMMAND_ID=$(aws ssm send-command \
  --instance-ids "${INSTANCE_ID}" \
  --document-name "AWS-RunShellScript" \
  --timeout-seconds 3600 \
  --comment "Deploy Checador (jc-attendance ${BRANCH})" \
  --parameters "${PARAMS}" \
  --query 'Command.CommandId' --output text)
echo "Command ID: ${COMMAND_ID}"

for _ in $(seq 1 120); do
  STATUS=$(aws ssm get-command-invocation --command-id "${COMMAND_ID}" --instance-id "${INSTANCE_ID}" \
    --query 'Status' --output text 2>/dev/null || echo "InProgress")
  echo "Status: ${STATUS}"
  case "${STATUS}" in
    Success|Failed|Cancelled|TimedOut)
      aws ssm get-command-invocation --command-id "${COMMAND_ID}" --instance-id "${INSTANCE_ID}" \
        --query 'StandardOutputContent' --output text | tail -60
      if [ "${STATUS}" = "Success" ]; then exit 0; fi
      aws ssm get-command-invocation --command-id "${COMMAND_ID}" --instance-id "${INSTANCE_ID}" \
        --query 'StandardErrorContent' --output text | tail -60
      exit 1
      ;;
  esac
  sleep 10
done
echo "Timeout esperando el deploy"; exit 1
