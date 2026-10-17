#!/usr/bin/env python3
"""Sync the original PingMe QX script into a Surge-compatible JS file.

No account details are stored in this repository: account captures live in
Surge's on-device $persistentStore.
"""
from pathlib import Path
from urllib.request import Request, urlopen

UPSTREAM = "https://raw.githubusercontent.com/ZenmoFeiShi/Qx/main/PingMe.js"
DEST = Path(__file__).with_name("pingme-surge.js")

SURGE_ADAPTER = r"""// PingMe for Surge 5 - QX compatibility adapter.
// Auto-synced from the author's main branch. Never put account data in GitHub.
// Upstream: https://github.com/ZenmoFeiShi/Qx/blob/main/PingMe.js
//
// Adapted APIs: $prefs -> $persistentStore, $task.fetch -> $httpClient,
// $notify -> $notification.post. Surge supplies $request and $done.
// Both request-capture and cron hooks use this same script path.

const $prefs = {
  valueForKey(key) {
    return $persistentStore.read(key);
  },
  setValueForKey(value, key) {
    return $persistentStore.write(String(value), key);
  }
};

const $task = {
  fetch(options) {
    return new Promise((resolve, reject) => {
      if (!options || !options.url) {
        reject({ error: 'Missing HTTP request URL' });
        return;
      }
      const method = String(options.method || 'GET').toLowerCase();
      if (method !== 'get') {
        reject({ error: 'Unsupported PingMe HTTP method: ' + method });
        return;
      }
      const req = { url: options.url, headers: options.headers || {} };
      try {
        $httpClient.get(req, (error, response, data) => {
          if (error) {
            reject({ error: String(error) });
            return;
          }
          resolve({
            body: typeof data === 'string' ? data : '',
            statusCode: response ? (response.status || response.statusCode) : 0,
            headers: response ? (response.headers || {}) : {}
          });
        });
      } catch (e) {
        reject({ error: String(e) });
      }
    });
  }
};

function $notify(title, subtitle, body) {
  $notification.post(String(title || ''), String(subtitle || ''), String(body || ''));
}

// --------- Original QX script starts below (not edited) ---------

"""

def main():
    req = Request(UPSTREAM, headers={"User-Agent": "Surge-PingMe-Sync/1.0"})
    with urlopen(req, timeout=30) as response:
        original = response.read().decode("utf-8-sig")

    # Avoid silently publishing an unrelated file if the source changes shape.
    required = ("pingme_accounts_v1", "$prefs.valueForKey", "$task.fetch",
                "queryBalanceAndBonus", "checkIn")
    if any(token not in original for token in required):
        raise SystemExit("Upstream changed significantly: manual review required.")

    output = SURGE_ADAPTER + original.rstrip() + "\n"
    if DEST.exists() and DEST.read_text(encoding="utf-8") == output:
        print("PingMe is already current.")
    else:
        DEST.write_text(output, encoding="utf-8")
        print("Updated", DEST)


if __name__ == "__main__":
    main()
