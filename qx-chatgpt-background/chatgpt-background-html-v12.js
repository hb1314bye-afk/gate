// Quantumult X fallback for ChatGPT document HTML (BG12H).
// Only the main document is edited; API responses, cookies and CSP headers are untouched.
(function () {
  try {
    var req = typeof $request === 'object' && $request ? $request : {};
    var url = String(req.url || '');
    if (!/^https:\/\/chatgpt\.com\/(?:\?[^#]*|c\/[^?#]+(?:\?[^#]*)?)?$/i.test(url)) return $done({});
    if (req.method && String(req.method).toUpperCase() !== 'GET') return $done({});
    var res = typeof $response === 'object' && $response ? $response : {};
    var headers = res.headers || {};
    var contentType = Object.keys(headers).filter(function(k){return k.toLowerCase()==='content-type';})[0];
    if(!contentType || !/^text\/html(?:;|$)/i.test(String(headers[contentType]).trim())) return $done({});
    var code = String(res.statusCode || '');
    if(code && code!=='200' && !/^HTTP\/\S+ 200(?:\s|$)/.test(code)) return $done({});
    var body = res.body;
    if(typeof body!=='string' || !body.length || !/<\/head\s*>/i.test(body) ||
       !/(?:<!doctype\s+html|<html\b)/i.test(body) ||
       body.indexOf('qx-chatgpt-wallpaper-html-v12')!==-1) return $done({});
    var photo = 'https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp';
    var css = '\n/* qx-chatgpt-wallpaper-html-v12 */\n' +
      '@media screen and (max-width:1024px) {\n' +
      'html:root::before { content:"" !important; display:block !important; position:fixed !important; inset:0 !important;' +
      'width:100vw !important; height:100vh !important; z-index:2147483644 !important; pointer-events:none !important;' +
      'background-image:linear-gradient(90deg,rgba(0,0,0,.76) 0%,rgba(0,0,0,.64) 42%,rgba(0,0,0,.30) 100%),radial-gradient(circle at 58% 62%,rgba(255,255,255,.12) 0%,rgba(255,255,255,.06) 20%,rgba(255,255,255,0) 42%),linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.10)),url("'+photo+'") !important;' +
      'background-repeat:no-repeat !important; background-size:cover !important; background-position:56% 44% !important;' +
      'mix-blend-mode:lighten !important; opacity:1 !important; }\n' +
      'html:root:root::after { content:none !important; display:none !important; }\n' +
      ':where(aside,nav,[data-testid="sidebar"],[data-testid="sidebar-scrollable-area"],#stage-slideover-sidebar) { text-shadow:0 1px 4px rgba(0,0,0,.95) !important; }\n' +
      '/* Light theme fallback: BG11 lighten-on-white made wallpaper invisible. */\n' +
      'html:root:not(.dark):not([data-theme="dark"])::before { mix-blend-mode:multiply !important; background-image:linear-gradient(90deg,rgba(255,255,255,.70) 0%,rgba(255,255,255,.58) 46%,rgba(255,255,255,.48) 100%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.12)),url("'+photo+'") !important; }\n' +
      'main, article, [data-message-author-role], [data-testid="conversation-turns"] { text-shadow:0 1px 3px rgba(0,0,0,.75) !important; }\n}\n';
    var nonceMatch = body.match(/<meta\b[^>]*property=["']csp-nonce["'][^>]*nonce=["']([^"']+)["']/i) ||
      body.match(/<(?:style|script)\b[^>]*\bnonce=["']([^"']+)["']/i);
    var nonce = nonceMatch ? ' nonce="'+nonceMatch[1].replace(/[^a-zA-Z0-9_+\/=.-]/g,'')+'"' : '';
    var tag = '<style id="qx-chatgpt-wallpaper-html-v12"'+nonce+'>'+css+'</style>';
    console.log('[QX BG12H] HTML fallback injected');
    return $done({body:body.replace(/<\/head\s*>/i,tag+'</head>')});
  } catch(e) { console.log('[QX BG12H] unchanged: '+String(e)); return $done({}); }
})();
