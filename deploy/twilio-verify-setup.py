#!/usr/bin/env python3
"""Activa Twilio Verify para el OTP del Checador. Idempotente y no fatal.

Uso: twilio-verify-setup.py <ruta del .env del API>

- Toma TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN del .env (los copia el
  bootstrap desde el .env de jc-core). Sin credenciales, no hace nada.
- Si falta TWILIO_VERIFY_SERVICE_SID, reutiliza el servicio Verify llamado
  SERVICE_NAME o lo crea, y lo guarda en el .env.
- Con servicio, deja OTP_PROVIDER=twilio. Si algo falla, no cambia el
  proveedor (sigue en `log`) y sale con 0 para no detener el deploy.
- Reescribe el .env en su lugar: conserva dueño y permisos (600).
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

SERVICE_NAME = "Checador"
API = os.environ.get("TWILIO_VERIFY_API", "https://verify.twilio.com/v2")


def log(msg):
    print(f"[twilio-verify] {msg}")


def read_env(path):
    values = {}
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip().strip("'\"")
    return values


def upsert_env(path, updates):
    with open(path) as fh:
        lines = fh.read().splitlines()
    pending = dict(updates)
    for i, line in enumerate(lines):
        key = line.split("=", 1)[0].strip()
        if key in pending:
            lines[i] = f"{key}={pending.pop(key)}"
    lines += [f"{k}={v}" for k, v in pending.items()]
    # Escribir sobre el mismo inodo conserva dueño y permisos.
    with open(path, "r+") as fh:
        fh.seek(0)
        fh.write("\n".join(lines) + "\n")
        fh.truncate()


def request(method, path, auth, data=None):
    body = urllib.parse.urlencode(data).encode() if data else None
    req = urllib.request.Request(f"{API}{path}", data=body, method=method)
    req.add_header("Authorization", f"Basic {auth}")
    if body:
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=20) as res:
        return json.loads(res.read().decode())


def find_or_create_service(auth):
    services = request("GET", "/Services?PageSize=100", auth).get("services", [])
    for service in services:
        if service.get("friendly_name") == SERVICE_NAME:
            log(f"reutilizando servicio {service['sid']}")
            return service["sid"]
    created = request("POST", "/Services", auth, {"FriendlyName": SERVICE_NAME, "CodeLength": "6"})
    log(f"servicio creado {created['sid']}")
    return created["sid"]


def main(env_path):
    env = read_env(env_path)
    account, token = env.get("TWILIO_ACCOUNT_SID"), env.get("TWILIO_AUTH_TOKEN")
    if not account or not token:
        log("sin credenciales de Twilio en el .env: el OTP sigue en el log del servidor")
        return 0
    auth = base64.b64encode(f"{account}:{token}".encode()).decode()
    service = env.get("TWILIO_VERIFY_SERVICE_SID")
    try:
        if not service:
            service = find_or_create_service(auth)
            upsert_env(env_path, {"TWILIO_VERIFY_SERVICE_SID": service})
    except (urllib.error.URLError, KeyError, ValueError) as err:
        log(f"AVISO: no se pudo preparar Twilio Verify ({err}); el OTP sigue en el log")
        return 0
    if env.get("OTP_PROVIDER") != "twilio":
        upsert_env(env_path, {"OTP_PROVIDER": "twilio"})
        log("OTP_PROVIDER=twilio")
    else:
        log(f"listo ({service})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
