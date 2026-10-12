// Quantumult X fallback for ChatGPT document HTML (BG9H).
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
       body.indexOf('qx-chatgpt-wallpaper-html-v9')!==-1) return $done({});
    var photo = 'https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp';
    var css = '\n/* qx-chatgpt-wallpaper-html-v9 */\n' +
      '@media screen and (max-width:1024px) {\n' +
      'html:root::before { content:"" !important; display:block !important; position:fixed !important; inset:0 !important;' +
      'width:100vw !important; height:100vh !important; z-index:2147483644 !important; pointer-events:none !important;' +
      'background-image:linear-gradient(90deg,rgba(0,0,0,.74) 0%,rgba(0,0,0,.69) 52%,rgba(0,0,0,.43) 100%),linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.14)),url("'+photo+'") !important;' +
      'background-repeat:no-repeat !important; background-size:cover !important; background-position:center center !important;' +
      'mix-blend-mode:lighten !important; opacity:1 !important; }\n' +
      'html:root::after { content:"BG9H" !important; display:block !important; position:fixed !important;' +
      'right:10px !important; bottom:116px !important; z-index:2147483646 !important;' +
      'padding:3px 7px !important; border-radius:5px !important; font:12px/1.4 sans-serif !important;' +
      'background:#147d6b !important; color:#fff !important; pointer-events:none !important; }\n' +
      ':where(aside,nav,[data-testid="sidebar"],[data-testid="sidebar-scrollable-area"],#stage-slideover-sidebar) { text-shadow:0 1px 4px rgba(0,0,0,.95) !important; }\n}\n';
    var nonceMatch = body.match(/<meta\b[^>]*property=["']csp-nonce["'][^>]*nonce=["']([^"']+)["']/i) ||
      body.match(/<(?:style|script)\b[^>]*\bnonce=["']([^"']+)["']/i);
    var nonce = nonceMatch ? ' nonce="'+nonceMatch[1].replace(/[^a-zA-Z0-9_+\/=.-]/g,'')+'"' : '';
    var tag = '<style id="qx-chatgpt-wallpaper-html-v9"'+nonce+'>'+css+'</style>';
    console.log('[QX BG9H] HTML fallback injected');
    return $done({body:body.replace(/<\/head\s*>/i,tag+'</head>')});
  } catch(e) { console.log('[QX BG9H] unchanged: '+String(e)); return $done({}); }
})();
