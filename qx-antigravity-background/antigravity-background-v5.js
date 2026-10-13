// Quantumult X Antigravity Remote Control wallpaper v5.
// Scoped to the remote-control iframe document and its main CSS bundle.
// Does not rewrite RPC, authentication, service worker, or application scripts.
(function () {
  try {
    var req = ($request && typeof $request === 'object') ? $request : {};
    var url = String(req.url || '');
    var re = /^https:\/\/antigravity\.static\.usercontent\.goog\/web\/[^/?]+\/(compiled_tailwind\.css)?(?:\?[^#]*)?$/i;
    var matched = url.match(re);
    if (!matched || (req.method && String(req.method).toUpperCase() !== 'GET')) return $done({});
    var res = ($response && typeof $response === 'object') ? $response : {};
    var status = String(res.statusCode || '');
    if (status && status !== '200' && !/^HTTP\/\S+ 200(?:\s|$)/.test(status)) return $done({});
    var headers = res.headers || {};
    var contentTypeKey = Object.keys(headers).filter(function (key) {return key.toLowerCase() === 'content-type';})[0];
    if (!contentTypeKey) return $done({});
    var contentType = String(headers[contentTypeKey]).trim();
    var isCss = !!matched[1];
    if (isCss ? !/^text\/css(?:;|$)/i.test(contentType) : !/^text\/html(?:;|$)/i.test(contentType)) return $done({});
    var body = res.body;
    if (typeof body !== 'string' || !body.length || body.indexOf('qx-antigravity-wallpaper-v5') !== -1) return $done({});
    if (isCss && /^\s*(?:<!doctype\s+html|<html\b)/i.test(body)) return $done({});
    if (!isCss && (!/<\/head\s*>/i.test(body) || !/(?:<!doctype\s+html|<html\b)/i.test(body))) return $done({});
    var photo = 'https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp';
    var css = '\n/* qx-antigravity-wallpaper-v5 */\n' +
      '@media screen and (max-width:1024px) {\n' +
      'html:root:root::before { content:"" !important; display:block !important; position:fixed !important;' +
      'inset:0 !important; width:100vw !important; height:100vh !important; z-index:9 !important;' +
      'pointer-events:none !important;' +
      'background-image:linear-gradient(90deg,rgba(0,0,0,.76) 0%,rgba(0,0,0,.64) 42%,rgba(0,0,0,.30) 100%),radial-gradient(circle at 58% 62%,rgba(255,255,255,.12) 0%,rgba(255,255,255,.06) 20%,rgba(255,255,255,0) 42%),linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.10)),url("'+photo+'") !important;' +
      'background-repeat:no-repeat !important; background-size:cover !important;' +
      'background-position:56% 44% !important; mix-blend-mode:lighten !important; opacity:1 !important; }\n' +
      'html:root::after { content:none !important; display:none !important; }\n' +
      ':is(main,article,[role="main"]) :is(p,li,h1,h2,h3,h4) { text-shadow:0 1px 3px rgba(0,0,0,.75) !important; }\\n' +
      '}\\n' +
      "\n/* Light mode: 'lighten' on white hides the photo. Use multiply with a pale readability veil. */\n/* Respect explicit dark-mode overrides, including the body theme class. */\n@media screen and (max-width:1024px) and (prefers-color-scheme:light) {\n  html:root:root:not(.dark):not([data-theme=\"dark\"]):not([data-color-scheme=\"dark\"]):not(:has(body.dark)):not(:has(body[data-theme=\"dark\"]))::before {\n    mix-blend-mode:multiply !important; background-image:linear-gradient(90deg,rgba(255,255,255,.65) 0%,rgba(255,255,255,.55) 46%,rgba(255,255,255,.43) 100%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.12)),url(\"https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp\") !important;\n  }\n  html:root:not(.dark):not([data-theme=\"dark\"]):not(:has(body.dark)) :is(main,article,[role=\"main\"]) :is(p,li,h1,h2,h3,h4) {\n    text-shadow:none !important;\n  }\n}\n/* Explicit in-app light setting even if the iOS appearance is dark. */\n@media screen and (max-width:1024px) {\n  html:root:root:is(.light,[data-theme=\"light\"],[data-color-scheme=\"light\"])::before,\n  html:root:root:has(body.light)::before,\n  html:root:root:has(body[data-theme=\"light\"])::before {\n    mix-blend-mode:multiply !important; background-image:linear-gradient(90deg,rgba(255,255,255,.65) 0%,rgba(255,255,255,.55) 46%,rgba(255,255,255,.43) 100%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.12)),url(\"https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp\") !important;\n  }\n  html:root:is(.light,[data-theme=\"light\"],[data-color-scheme=\"light\"]) :is(main,article,[role=\"main\"]) :is(p,li,h1,h2,h3,h4),\n  html:root:has(body.light) :is(main,article,[role=\"main\"]) :is(p,li,h1,h2,h3,h4) {\n    text-shadow:none !important;\n  }\n}\n";
    if (isCss) {
      console.log('[QX Antigravity v5] iframe CSS wallpaper applied');
      return $done({body:body+'\n'+css});
    }
    var nonceMatch = body.match(/<(?:style|script)\b[^>]*\bnonce=["']([^"']+)["']/i);
    var nonce = nonceMatch ? ' nonce="'+nonceMatch[1].replace(/[^a-zA-Z0-9_+\/=.-]/g,'')+'"' : '';
    console.log('[QX Antigravity v5] iframe HTML wallpaper applied');
    return $done({body:body.replace(/<\/head\s*>/i,'<style id="qx-antigravity-wallpaper-v5"'+nonce+'>'+css+'</style></head>')});
  } catch (e) {
    console.log('[QX Antigravity v5] unchanged');
    return $done({});
  }
})();