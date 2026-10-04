#!/usr/bin/env python3
"""Clash 专用订阅生成器 (YAML)。

Clash 的配置文件订阅必须是 YAML 格式；这里把 vless 节点
(链式代理编码在 ws path) 转成 Clash YAML，供 Clash/Clash Verge
等客户端直接订阅。

用法: 在 vpngate.py 生成 public/data.json 之后运行
    python vpngate.py && python build_clash.py
读取 public/data.json，输出 public/clash.yaml。
"""

import base64
import json
import os
import re
import socket

REPO_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(REPO_DIR, "public")

EDT_UUID = os.environ.get("EDT_UUID", "6ee5c323-a234-41e2-8417-04fe5605bc7a")
EDT_DOMAIN = os.environ.get("EDT_DOMAIN", "edgetunnel.hb1314bye.workers.dev")

COUNTRY_ZH = {
    "JP": "日本", "KR": "韩国", "US": "美国", "CA": "加拿大", "RU": "俄罗斯",
    "RO": "罗马尼亚", "TH": "泰国", "VN": "越南", "DE": "德国", "FR": "法国",
    "GB": "英国", "UK": "英国", "SG": "新加坡", "TW": "台湾", "HK": "香港",
    "CN": "中国", "AU": "澳大利亚", "NL": "荷兰", "SE": "瑞典", "CH": "瑞士",
    "IT": "意大利", "ES": "西班牙", "PL": "波兰", "IN": "印度", "BR": "巴西",
    "MX": "墨西哥", "ID": "印度尼西亚", "MY": "马来西亚", "PH": "菲律宾",
    "TR": "土耳其", "UA": "乌克兰", "CZ": "捷克", "GR": "希腊", "PT": "葡萄牙",
    "FI": "芬兰", "NO": "挪威", "DK": "丹麦", "IE": "爱尔兰", "BE": "比利时",
    "AT": "奥地利", "HU": "匈牙利", "AR": "阿根廷", "CL": "智利", "CO": "哥伦比亚",
    "NZ": "新西兰", "ZA": "南非", "IL": "以色列", "AE": "阿联酋", "SA": "沙特",
    "EG": "埃及", "HR": "克罗地亚", "BY": "白俄罗斯", "GD": "格林纳达",
    "LV": "拉脱维亚", "EE": "爱沙尼亚", "LT": "立陶宛", "SK": "斯洛伐克",
    "SI": "斯洛文尼亚", "BG": "保加利亚", "RS": "塞尔维亚", "GE": "格鲁吉亚",
    "MD": "摩尔多瓦", "AM": "亚美尼亚", "KZ": "哈萨克斯坦", "UZ": "乌兹别克斯坦",
    "MN": "蒙古", "NP": "尼泊尔", "LK": "斯里兰卡", "MM": "缅甸",
}


def _b64_secret_encode(plaintext, secret):
    """复刻 edgetunnel 的 base64SecretEncode: UTF-8 循环密钥 XOR + 标准 base64。"""
    data = plaintext.encode("utf-8")
    key = secret.encode("utf-8")
    mixed = bytes(data[i] ^ key[i % len(key)] for i in range(len(data)))
    return base64.b64encode(mixed).decode("ascii")


def _socks5_account(address, default_port=80):
    """复刻 edgetunnel 的 获取SOCKS5账号: user:pass@host:port -> dict。"""
    address = re.sub(r"^(socks5|http|https|turn|sstp)://", "", address.strip(), flags=re.I).split("#")[0].strip()
    at = address.rfind("@")
    auth, hostpart = (address[:at], address[at + 1:]) if at != -1 else ("", address)
    hostpart = hostpart.split("/")[0]
    username = password = None
    if auth:
        if ":" not in auth:
            try:
                auth = base64.b64decode(auth + "=" * (-len(auth) % 4)).decode("utf-8")
            except Exception:
                pass
        parts = auth.split(":", 1)
        username = parts[0]
        password = parts[1] if len(parts) > 1 else None
    hostname, port = hostpart, default_port
    if hostpart.count(":") == 1 and not hostpart.startswith("["):
        h, p = hostpart.rsplit(":", 1)
        if p.isdigit():
            hostname, port = h, int(p)
    return {"username": username, "password": password, "hostname": hostname, "port": port}


def _yaml_str(s):
    """YAML 安全字符串：含中文/特殊字符时加双引号。"""
    s = str(s)
    if re.search(r'[^\w\-. /]', s):
        return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'
    return s


def _resolve_server_ip(domain):
    """Build 时解析出 Cloudflare 真实 IP，绕过被污染的 DNS；失败则回退用域名。"""
    try:
        return socket.gethostbyname(domain)
    except Exception:
        return domain


def build_clash_yaml(data):
    names = []
    proxies = []
    server_ip = _resolve_server_ip(EDT_DOMAIN)
    ordered = sorted(
        data["countries"].items(),
        key=lambda kv: (-int(kv[1].get("count") or 0), str(kv[1].get("code") or kv[0])),
    )
    for cname, grp in ordered:
        code = str(grp.get("code") or "?").upper()
        zh = COUNTRY_ZH.get(code) or (code if code and code != "?" else cname)
        nodes = sorted(
            grp["nodes"],
            key=lambda n: (
                0 if n.get("residential") == "residential" else 1,
                n.get("latency_ms") is None,
                n.get("latency_ms") or 0,
                n.get("host") or "",
            ),
        )
        for i, n in enumerate(nodes, 1):
            tag = "住宅" if n.get("residential") == "residential" else "机房"
            name = f"{zh}-{tag}-{i:02d}"
            chain = {"type": "sstp", **_socks5_account(f"vpn:vpn@{n['host']}:{n['port']}", 443)}
            enc = _b64_secret_encode(json.dumps(chain, separators=(",", ":")), EDT_UUID)
            ws_path = "/video/" + enc
            names.append(name)
            proxies.append(
                f"  - name: {_yaml_str(name)}\n"
                f"    type: vless\n"
                f"    server: {server_ip}\n"
                f"    port: 443\n"
                f"    uuid: {EDT_UUID}\n"
                f"    tls: true\n"
                f"    : {EDT_DOMAIN}\n"
                f"    \n
                f"    network: ws\n"                f"    ws-opts:\n"
                f"      path: {_yaml_str(ws_path)}\n"
                f"      headers:\n"
                f"        Host: {EDT_DOMAIN}\n"
                f"    udp: false"
            )

    proxy_list = "\n".join(f"      - {_yaml_str(n)}" for n in names)
    out = f"""# Clash 订阅 —— 自动更新: {data['generated_at']} (每 30 分钟重新检测)
# 固定地址: https://hb1314bye-afk.github.io/gate/clash.yaml
port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: info
external-controller: 127.0.0.1:9090
dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 1.1.1.1
    - 8.8.8.8
  nameserver:
    - https://1.1.1.1/dns-query
    - https://9.9.9.9/dns-query
    - https://8.8.8.8/dns-query
proxies:
{chr(10).join(proxies)}
proxy-groups:
  - name: 节点选择
    type: url-test
    proxies:
{proxy_list}
    url: http://www.gstatic.com/generate_204
    interval: 300
  - name: PROXY
    type: select
    proxies:
      - 节点选择
      - DIRECT
rules:
  - MATCH,PROXY
"""
    return out


def main():
    data_path = os.path.join(PUBLIC_DIR, "data.json")
    with open(data_path, encoding="utf-8") as f:
        data = json.load(f)
    yaml_path = os.path.join(PUBLIC_DIR, "clash.yaml")
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(build_clash_yaml(data))
    print(f"clash.yaml written: {yaml_path}")


if __name__ == "__main__":
    main()
