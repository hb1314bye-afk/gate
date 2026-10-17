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
        body.indexOf('surge-antigravity-home-wallpaper-v7') !== -1) return $done({});
    var image = 'https://raw.githubusercontent.com/hb1314bye-afk/gate/main/surge-modules/wallpapers/blue-collage-original.webp';
    var css = [
      '/* surge-antigravity-home-wallpaper-v7 */',
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
      '@media screen and (max-width:1024px) and (prefers-color-scheme:light) {',
      'html:root:root::before { mix-blend-mode:multiply !important; background-image:linear-gradient(90deg,rgba(255,255,255,.66) 0%,rgba(255,255,255,.58) 45%,rgba(255,255,255,.48) 100%),url("'+image+'") !important; }',
      ':is(main,article,[role="main"]) :is(p,li,h1,h2,h3,h4) { text-shadow:none !important; }',
      '}'
    ].join('\n');
    var nonceMatch = body.match(/<(?:script|style)\b[^>]*\bnonce=["']([^"']+)["']/i);
    var nonce = nonceMatch ? ' nonce="'+nonceMatch[1].replace(/[^A-Za-z0-9_+\/=.-]/g,'')+'"' : '';
    var style = '<style id="surge-antigravity-home-wallpaper-v7"'+nonce+'>'+css+'</style>';
    console.log('[Antigravity PWA wallpaper v7] HTML injected');
    return $done({body:body.replace(/<\/head\s*>/i,style+'</head>')});
  } catch(e) {
    console.log('[Antigravity PWA wallpaper v7] unchanged');
    return $done({});
  }
})();