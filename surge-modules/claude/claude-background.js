// Claude WebApp wallpaper for Surge iOS. Response-body CSS/HTML modification only.
// No request payload, cookie, account or RPC modification.
(() => {
  const photo = 'https://raw.githubusercontent.com/hb1314bye-afk/gate/main/surge-modules/claude/claude-wallpaper.webp';
  const css = `
/* surge-claude-wallpaper-v1 */
@media screen and (max-width: 1024px) {
  html:root:root::before {
    content: "" !important;
    display: block !important;
    visibility: visible !important;
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100dvh !important;
    z-index: 2147483400 !important;
    pointer-events: none !important;
    background-image: linear-gradient(90deg, rgba(0,0,0,.68), rgba(0,0,0,.36)), url("${photo}") !important;
    background-position: center, 50% 42% !important;
    background-size: cover !important;
    background-repeat: no-repeat !important;
    mix-blend-mode: lighten !important;
    opacity: .86 !important;
  }
  html:root:not(.dark):not([data-theme="dark"]):not([class*="dark"])::before {
    mix-blend-mode: multiply !important;
    background-image: linear-gradient(90deg, rgba(255,255,255,.64), rgba(255,255,255,.49)), url("${photo}") !important;
    opacity: .63 !important;
  }
  :where(main, article, [role="main"]) :where(p, li, h1, h2, h3, h4) {
    text-shadow: 0 1px 3px rgba(0,0,0,.55) !important;
  }
  html:root:not(.dark):not([data-theme="dark"]):not([class*="dark"]) :where(main,article) :where(p,li,h1,h2,h3,h4) {
    text-shadow: none !important;
  }
}
`;
  try {
    const req = typeof $request === 'object' && $request ? $request : {};
    const url = String(req.url || '');
    if (req.method && String(req.method).toUpperCase() !== 'GET') return $done({});
    const res = typeof $response === 'object' && $response ? $response : {};
    const code = String(res.statusCode || '');
    if (code && code !== '200' && !/^HTTP\/\S+\s+200(?:\s|$)/i.test(code)) return $done({});
    const headers = res.headers || {};
    const getHeader = name => String(headers[Object.keys(headers).find(k => k.toLowerCase() === name)] || '');
    const type = getHeader('content-type');
    if (/challenge/i.test(getHeader('cf-mitigated'))) return $done({});
    let body = res.body;
    if (typeof body !== 'string' || !body || body.includes('surge-claude-wallpaper-v1')) return $done({});
    const isCSS = /\.css(?:\?[^#]*)?$/i.test(url);
    if (isCSS) {
      if (!/^text\/css(?:\s*;|$)/i.test(type) || /^\s*(?:<!doctype\s+html|<html\b)/i.test(body)) return $done({});
      console.log('[Claude Wallpaper] CSS injected');
      return $done({body: body + '\n' + css});
    }
    const allowedDoc = /^https:\/\/claude\.ai\/(?:\?[^#]*|new(?:[/?][^#]*)?|chat(?:[/?][^#]*)?|projects?(?:[/?][^#]*)?|recents?(?:[/?][^#]*)?|settings(?:[/?][^#]*)?)?$/i.test(url);
    if (!allowedDoc || !/^text\/html(?:\s*;|$)/i.test(type) || !/<\/head\s*>/i.test(body) || !/<html\b/i.test(body)) return $done({});
    if (/cf[-_]chl|challenge-platform|challenges\.cloudflare\.com|just a moment\.\.\.|verify you are human|performing security verification|cf-turnstile/i.test(body)) return $done({});
    if (!/claude/i.test(body)) return $done({});
    const nonceTag = body.match(/<(?:style|script)\b[^>]*\bnonce=["']([^"']+)["']/i);
    const nonce = nonceTag ? ' nonce="' + nonceTag[1].replace(/[^\w+\/=.-]/g, '') + '"' : '';
    const tag = '<style id="surge-claude-wallpaper-v1"' + nonce + '>' + css + '</style>';
    console.log('[Claude Wallpaper] HTML injected');
    return $done({body: body.replace(/<\/head\s*>/i, tag + '</head>')});
  } catch (e) {
    console.log('[Claude Wallpaper] unchanged: ' + String(e));
    return $done({});
  }
})();