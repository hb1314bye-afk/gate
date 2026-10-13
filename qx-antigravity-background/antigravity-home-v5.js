// Quantumult X - Antigravity PWA home/instance-list wallpaper.
// Response-body rewrite ONLY for GET HTML / and /u/{number}/ documents.
// Does not alter remote commands, login, JS, service workers or API responses.
(function () {
  try {
    var req = typeof $request === 'object' && $request ? $request : {};
    var url = String(req.url || '');
    if (!/^https:\/\/antigravity\.google\.com\/(?:u\/[0-9]+\/?)?(?:\?[^#]*)?$/i.test(url)) return $done({});
    if (req.method && String(req.method).toUpperCase() !== 'GET') return $done({});
    var response = typeof $response === 'object' && $response ? $response : {};
    var status = String(response.statusCode || '');
    if (status && status !== '200' && !/^HTTP\/\S+\s+200(?:\s|$)/.test(status)) return $done({});
    var headers = response.headers || {};
    var key = Object.keys(headers).filter(function(k){return k.toLowerCase()==='content-type';})[0];
    if (!key || !/^text\/html(?:;|$)/i.test(String(headers[key]).trim())) return $done({});
    var body = response.body;
    if (typeof body !== 'string' || !/<\/head\s*>/i.test(body) ||
        !/(?:<!doctype\s+html|<html\b)/i.test(body) ||
        body.indexOf('qx-antigravity-home-wallpaper-v5') !== -1) return $done({});
    var image = 'https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp';
    var css = [
      '/* qx-antigravity-home-wallpaper-v5 */',
      '@media screen and (max-width:1024px) {',
      'html:root:root::before {',
      'content:"" !important; display:block !important; visibility:visible !important;',
      'position:fixed !important; inset:0 !important; width:100vw !important; height:100vh !important;',
      'z-index:9 !important; pointer-events:none !important;',
      'background-image:linear-gradient(90deg,rgba(0,0,0,.76) 0%,rgba(0,0,0,.64) 42%,rgba(0,0,0,.30) 100%),radial-gradient(circle at 58% 62%,rgba(255,255,255,.12) 0%,rgba(255,255,255,.06) 20%,rgba(255,255,255,0) 42%),linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.10)),url("'+image+'") !important;',
      'background-position:56% 44% !important; background-size:cover !important;',
      'background-repeat:no-repeat !important; mix-blend-mode:lighten !important; opacity:1 !important;',
      '}',
      'html:root:root::after {content:none !important; display:none !important;}',
      ':is(main,article,[role="main"]) :is(p,li,h1,h2,h3,h4) { text-shadow:0 1px 3px rgba(0,0,0,.75) !important; }',
      '}',
      "\n/* Light mode: 'lighten' on white hides the photo. Use multiply with a pale readability veil. */\n/* Respect explicit dark-mode overrides, including the body theme class. */\n@media screen and (max-width:1024px) and (prefers-color-scheme:light) {\n  html:root:root:not(.dark):not([data-theme=\"dark\"]):not([data-color-scheme=\"dark\"]):not(:has(body.dark)):not(:has(body[data-theme=\"dark\"]))::before {\n    mix-blend-mode:multiply !important; background-image:linear-gradient(90deg,rgba(255,255,255,.65) 0%,rgba(255,255,255,.55) 46%,rgba(255,255,255,.43) 100%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.12)),url(\"https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp\") !important;\n  }\n  html:root:not(.dark):not([data-theme=\"dark\"]):not(:has(body.dark)) :is(main,article,[role=\"main\"]) :is(p,li,h1,h2,h3,h4) {\n    text-shadow:none !important;\n  }\n}\n/* Explicit in-app light setting even if the iOS appearance is dark. */\n@media screen and (max-width:1024px) {\n  html:root:root:is(.light,[data-theme=\"light\"],[data-color-scheme=\"light\"])::before,\n  html:root:root:has(body.light)::before,\n  html:root:root:has(body[data-theme=\"light\"])::before {\n    mix-blend-mode:multiply !important; background-image:linear-gradient(90deg,rgba(255,255,255,.65) 0%,rgba(255,255,255,.55) 46%,rgba(255,255,255,.43) 100%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.12)),url(\"https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp\") !important;\n  }\n  html:root:is(.light,[data-theme=\"light\"],[data-color-scheme=\"light\"]) :is(main,article,[role=\"main\"]) :is(p,li,h1,h2,h3,h4),\n  html:root:has(body.light) :is(main,article,[role=\"main\"]) :is(p,li,h1,h2,h3,h4) {\n    text-shadow:none !important;\n  }\n}\n"

    ].join('\n');
    var nonceMatch = body.match(/<(?:script|style)\b[^>]*\bnonce=["']([^"']+)["']/i);
    var nonce = nonceMatch ? ' nonce="'+nonceMatch[1].replace(/[^A-Za-z0-9_+\/=.-]/g,'')+'"' : '';
    var style = '<style id="qx-antigravity-home-wallpaper-v5"'+nonce+'>'+css+'</style>';
    console.log('[Antigravity PWA wallpaper v5] HTML injected');
    return $done({body:body.replace(/<\/head\s*>/i,style+'</head>')});
  } catch(e) {
    console.log('[Antigravity PWA wallpaper v5] unchanged');
    return $done({});
  }
})();