#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build a premium VPN Gate OpenVPN UDP profile for Mihomo/Clash.

Runs after vpngate.py so public/data.json already contains the verified
residential SSTP pool. We prefer UDP servers whose hostname is also verified
as residential, then rank by VPN Gate Speed/Ping/NumVpnSessions.
"""

import base64
import csv
import io
import json
import os
import re
from datetime import datetime, timezone

import requests

API_URL = "http://www.vpngate.net/api/iphone/"
ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(ROOT, "public")
OUT = os.path.join(PUBLIC, "openvpn-udp.yaml")

COUNTRY_ZH = {"JP": "日本", "KR": "韩国"}
LIMITS = {"JP": 3, "KR": 2}


def fetch_rows():
    r = requests.get(API_URL, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    text = r.text
    lines = [ln for ln in text.splitlines() if ln.strip()]
    header_idx = next(i for i, ln in enumerate(lines) if ln.lstrip("#").startswith("HostName"))
    header = [h.strip().lstrip("*").lower() for h in lines[header_idx].lstrip("#").split(",")]
    idx = {name: i for i, name in enumerate(header)}
    rows = []
    for ln in lines[header_idx + 1:]:
        fields = next(csv.reader(io.StringIO(ln)))
        if len(fields) < len(header):
            continue

        def f(name, fallback=""):
            i = idx.get(name)
            return fields[i].strip() if i is not None and i < len(fields) else fallback

        host = f("hostname")
        if not host:
            continue
        try:
            speed = int(f("speed", "0") or 0)
        except Exception:
            speed = 0
        try:
            ping = int(f("ping", "9999") or 9999)
        except Exception:
            ping = 9999
        try:
            sessions = int(f("numvpnsessions", "9999") or 9999)
        except Exception:
            sessions = 9999
        cfg64 = f("openvpn_configdata_base64")
        if not cfg64:
            continue
        try:
            cfg = base64.b64decode(cfg64, validate=False).decode("utf-8", "replace")
        except Exception:
            continue
        rows.append({
            "host": host,
            "country": f("countryshort").upper(),
            "speed": speed,
            "ping": ping,
            "sessions": sessions,
            "cfg": cfg,
        })
    return rows


def residential_hosts():
    path = os.path.join(PUBLIC, "data.json")
    if not os.path.exists(path):
        return set()
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    out = set()
    for grp in data.get("countries", {}).values():
        for n in grp.get("nodes", []):
            if n.get("residential") == "residential":
                h = str(n.get("host") or "").lower().strip()
                if h:
                    out.add(h)
                    out.add(h.split(".")[0])
    return out


def directive(cfg, key):
    m = re.search(r"^\s*" + re.escape(key) + r"\s+([^\r\n#;]+)", cfg, re.M | re.I)
    return m.group(1).strip() if m else ""


def inline_block(cfg, tag):
    m = re.search(r"<" + re.escape(tag) + r">\s*(.*?)\s*</" + re.escape(tag) + r">", cfg, re.S | re.I)
    return m.group(1).strip() if m else ""


def parse_udp(row):
    cfg = row["cfg"]
    proto = directive(cfg, "proto").lower()
    if not proto.startswith("udp"):
        return None

    remote = directive(cfg, "remote").split()
    if not remote:
        return None
    server = remote[0]
    try:
        port = int(remote[1]) if len(remote) > 1 else 1195
    except Exception:
        port = 1195

    ca = inline_block(cfg, "ca")
    cert = inline_block(cfg, "cert")
    key = inline_block(cfg, "key")
    if not (ca and cert and key):
        return None

    cipher = directive(cfg, "cipher")
    if not cipher:
        # VPN Gate configs that rely on negotiated data-ciphers are normally
        # compatible with this common legacy cipher in Mihomo.
        cipher = "AES-128-CBC"
    auth = directive(cfg, "auth") or "SHA1"

    item = dict(row)
    item.update({
        "server": server,
        "port": port,
        "cipher": cipher,
        "auth": auth,
        "ca": ca,
        "cert": cert,
        "key": key,
    })
    return item


def quality(n):
    speed_m = max(1.0, n["speed"] / 1_000_000)
    ping = n["ping"] if 0 < n["ping"] < 9999 else 500
    sessions = n["sessions"] if 0 <= n["sessions"] < 9999 else 500
    residential_bonus = 0.45 if n.get("verified_residential") else 1.0
    return residential_bonus * (ping * 1.5 + sessions * 4.0) / min(speed_m, 1500)


def indent_block(text, spaces=6):
    pad = " " * spaces
    return "\n".join(pad + line for line in text.splitlines())


def q(s):
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'


def main():
    os.makedirs(PUBLIC, exist_ok=True)
    verified = residential_hosts()
    parsed = []
    for row in fetch_rows():
        if row["country"] not in LIMITS:
            continue
        n = parse_udp(row)
        if not n:
            continue
        h = n["host"].lower()
        n["verified_residential"] = (h in verified or h.split(".")[0] in verified)
        parsed.append(n)

    chosen = []
    for code in ("JP", "KR"):
        pool = [n for n in parsed if n["country"] == code]
        verified_pool = [n for n in pool if n["verified_residential"]]
        base = verified_pool if len(verified_pool) >= LIMITS[code] else pool

        strict = [
            n for n in base
            if n["speed"] >= (80_000_000 if code == "JP" else 50_000_000)
            and (n["ping"] <= (100 if code == "JP" else 130) or n["ping"] >= 9999)
            and n["sessions"] <= (40 if code == "JP" else 60)
        ]
        ranked = sorted(strict if len(strict) >= LIMITS[code] else base, key=quality)
        chosen.extend(ranked[:LIMITS[code]])

    if not chosen:
        raise SystemExit("No usable OpenVPN UDP nodes found")

    lines = [
        "# VPN Gate OpenVPN UDP 精品订阅",
        "# 直连 UDP 落地，不经过 Cloudflare/SSTP 套娃；更适合测速、网页和视频。",
        f"# generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        "mixed-port: 7890",
        "allow-lan: false",
        "mode: rule",
        "log-level: info",
        "ipv6: false",
        "unified-delay: true",
        "tcp-concurrent: true",
        "proxies:",
    ]

    names = []
    count = {"JP": 0, "KR": 0}
    for i, n in enumerate(chosen):
        code = n["country"]
        count[code] += 1
        speed_m = max(1, round(n["speed"] / 1_000_000))
        ping_tag = "?" if n["ping"] >= 9999 else str(n["ping"])
        session_tag = "?" if n["sessions"] >= 9999 else str(n["sessions"])
        home = "家宽" if n["verified_residential"] else "候选"
        name = f"{COUNTRY_ZH[code]}-OVPN-UDP-{count[code]:02d} · {home} · {speed_m}M · {ping_tag}ms · {session_tag}人"
        names.append(name)
        lines += [
            f"  - name: {q(name)}",
            "    type: openvpn",
            f"    server: {q(n['server'])}",
            f"    port: {n['port']}",
            "    proto: udp",
            "    username: vpn",
            "    password: vpn",
            f"    cipher: {q(n['cipher'])}",
            f"    auth: {q(n['auth'])}",
            "    udp: true",
            "    handshake-timeout: 15",
            "    remote-dns-resolve: true",
            "    dns: [8.8.8.8, 1.1.1.1]",
            "    ca: |-",
            indent_block(n["ca"], 6),
            "    cert: |-",
            indent_block(n["cert"], 6),
            "    key: |-",
            indent_block(n["key"], 6),
        ]

    lines += [
        "proxy-groups:",
        "  - name: \"🏠 OVPN-UDP自动\"",
        "    type: fallback",
        "    url: https://www.gstatic.com/generate_204",
        "    interval: 300",
        "    lazy: true",
        "    proxies:",
    ]
    lines += [f"      - {q(n)}" for n in names]
    lines += [
        "  - name: \"🚀 节点选择\"",
        "    type: select",
        "    proxies:",
        "      - \"🏠 OVPN-UDP自动\"",
    ]
    lines += [f"      - {q(n)}" for n in names]
    lines += [
        "      - DIRECT",
        "rules:",
        "  - GEOIP,LAN,DIRECT,no-resolve",
        "  - GEOIP,CN,DIRECT,no-resolve",
        "  - MATCH,🚀 节点选择",
        "",
    ]

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print(f"openvpn udp yaml written: {OUT} ({len(chosen)} nodes)")


if __name__ == "__main__":
    main()
