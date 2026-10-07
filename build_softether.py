#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build a small native SoftEther candidate list from verified residential VPN Gate nodes.

SoftEther is not a native Mihomo/Clash proxy type. This file is for the
SoftEther VPN Client / compatible native client, not for Clash import.
"""

import json
import os
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(ROOT, "public")
IN = os.path.join(PUBLIC, "data.json")
OUT = os.path.join(PUBLIC, "softether.txt")

LIMITS = {"JP": 3, "KR": 2}
COUNTRY = {"JP": "日本", "KR": "韩国"}


def main():
    with open(IN, encoding="utf-8") as fh:
        data = json.load(fh)

    rows = []
    for grp in data.get("countries", {}).values():
        code = str(grp.get("code") or "").upper()
        if code not in LIMITS:
            continue
        nodes = [
            n for n in grp.get("nodes", [])
            if n.get("residential") == "residential"
        ]
        nodes.sort(key=lambda n: (
            n.get("latency_ms") is None,
            n.get("latency_ms") or 999999,
            n.get("host") or "",
        ))
        for n in nodes[:LIMITS[code]]:
            rows.append((code, n))

    lines = [
        "# VPN Gate SoftEther 精品候选（原生 SoftEther 客户端使用）",
        "# Clash/Mihomo 不能直接导入 SoftEther；请用 SoftEther VPN Client。",
        "# Virtual Hub: VPNGATE | Username: vpn | Password: vpn",
        f"# generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        "",
    ]
    count = {"JP": 0, "KR": 0}
    for code, n in rows:
        count[code] += 1
        host = str(n.get("host") or "")
        if not host.endswith(".opengw.net"):
            host = host.split(".")[0] + ".opengw.net"
        latency = n.get("latency_ms")
        lat = f"{int(latency)}ms" if isinstance(latency, (int, float)) else "?ms"
        lines += [
            f"{COUNTRY[code]}-SoftEther-{count[code]:02d}",
            f"Server: {host}:443",
            "Hub: VPNGATE",
            "Username: vpn",
            "Password: vpn",
            f"Verified SSTP latency: {lat}",
            "",
        ]

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print(f"softether candidates written: {OUT} ({len(rows)} nodes)")


if __name__ == "__main__":
    main()
