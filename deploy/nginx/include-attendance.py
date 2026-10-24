#!/usr/bin/env python3
"""Añade `include <snippet>;` a los server de nginx que atienden <host> por 443.

Idempotente. Uso: include-attendance.py <conf> <host> <snippet>
Sale con 0 y sin tocar nada si ya estaba incluido; con 2 si no encontró el server.
"""
import sys

conf_path, host, snippet = sys.argv[1:4]
include = f"include {snippet};"
text = open(conf_path).read()
if include in text:
    print("ya incluido")
    sys.exit(0)

out, i, changed = [], 0, 0
while i < len(text):
    start = text.find("server", i)
    if start == -1:
        out.append(text[i:])
        break
    brace = text.find("{", start)
    between = text[start + len("server"):brace] if brace != -1 else "x"
    if brace == -1 or between.strip():
        out.append(text[i:start + len("server")])
        i = start + len("server")
        continue
    depth, j = 0, brace
    while j < len(text):
        if text[j] == "{":
            depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0:
                break
        j += 1
    block = text[start:j]
    out.append(text[i:start])
    if host in block and "443" in block:
        out.append(block + f"    {include}\n")
        changed += 1
    else:
        out.append(block)
    i = j

if not changed:
    print(f"no hay server 443 para {host}", file=sys.stderr)
    sys.exit(2)
open(conf_path, "w").write("".join(out))
print(f"include agregado en {changed} server(s)")
