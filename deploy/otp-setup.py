#!/usr/bin/env python3
"""Elige cómo sale el código de acceso del empleado. Idempotente y no fatal.

Uso: otp-setup.py <.env del API> [<.env de jc-core>]

1. Copia del .env de jc-core las claves de Twilio que falten (SYNC_KEYS).
2. Con la plantilla de WhatsApp AUTHENTICATION aprobada de jc-core
   (TWILIO_SIGNUP_OTP_CONTENT_SID + TWILIO_WHATSAPP_FROM) deja
   OTP_PROVIDER=twilio-messaging: la misma vía que ya entrega el código de
   alta de jc-core.
3. Si no, intenta Twilio Verify: reutiliza o crea el servicio SERVICE_NAME y
   deja OTP_PROVIDER=twilio. (Verify por WhatsApp exige ligar un remitente
   en la consola; sin eso no entrega.)
4. Si nada aplica o algo falla, no cambia el proveedor y sale con 0.

Reescribe el .env en su lugar: conserva dueño y permisos (600).
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

SERVICE_NAME = "Checador"
SYNC_KEYS = (
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_FROM",
    "TWILIO_SIGNUP_OTP_CONTENT_SID",
    "TWILIO_PHONE_NUMBER",
)
API = os.environ.get("TWILIO_VERIFY_API", "https://verify.twilio.com/v2")


def log(msg):
    print(f"[otp] {msg}")


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


def set_provider(env_path, env, provider):
    if env.get("OTP_PROVIDER") != provider:
        upsert_env(env_path, {"OTP_PROVIDER": provider})
    log(f"OTP_PROVIDER={provider}")


def main(env_path, core_env_path=None):
    env = read_env(env_path)
    if core_env_path and os.path.exists(core_env_path):
        core = read_env(core_env_path)
        missing = {k: core[k] for k in SYNC_KEYS if core.get(k) and not env.get(k)}
        if missing:
            upsert_env(env_path, missing)
            log("copiadas de jc-core: " + ", ".join(sorted(missing)))
            env.update(missing)
    account, token = env.get("TWILIO_ACCOUNT_SID"), env.get("TWILIO_AUTH_TOKEN")
    if not account or not token:
        log("sin credenciales de Twilio en el .env: el OTP sigue en el log del servidor")
        return 0
    if env.get("TWILIO_SIGNUP_OTP_CONTENT_SID") and env.get("TWILIO_WHATSAPP_FROM"):
        set_provider(env_path, env, "twilio-messaging")
        if not env.get("TWILIO_PHONE_NUMBER"):
            log("AVISO: sin TWILIO_PHONE_NUMBER no hay respaldo por SMS si WhatsApp falla")
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
    set_provider(env_path, env, "twilio")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None))
