// Quantumult X Antigravity Remote Control wallpaper v1.
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
    if (typeof body !== 'string' || !body.length || body.indexOf('qx-antigravity-wallpaper-v1') !== -1) return $done({});
    if (isCss && /^\s*(?:<!doctype\s+html|<html\b)/i.test(body)) return $done({});
    if (!isCss && (!/<\/head\s*>/i.test(body) || !/(?:<!doctype\s+html|<html\b)/i.test(body))) return $done({});
    var photo = 'https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp';
    var css = '\n/* qx-antigravity-wallpaper-v1 */\n' +
      '@media screen and (max-width:1024px) {\n' +
      'html:root::before { content:"" !important; display:block !important; position:fixed !important;' +
      'inset:0 !important; width:100vw !important; height:100vh !important; z-index:2147483644 !important;' +
      'pointer-events:none !important;' +
      'background-image:linear-gradient(90deg,rgba(0,0,0,.62),rgba(0,0,0,.36)),' +
      'linear-gradient(180deg,rgba(0,0,0,.09),rgba(0,0,0,.21)),url("'+photo+'") !important;' +
      'background-repeat:no-repeat !important; background-size:cover !important;' +
      'background-position:56% 44% !important; mix-blend-mode:lighten !important; opacity:1 !important; }\n' +
      'html:root::after { content:none !important; display:none !important; }\n' +
      '}\n';
    if (isCss) {
      console.log('[QX Antigravity v1] iframe CSS wallpaper applied');
      return $done({body:body+'\n'+css});
    }
    var nonceMatch = body.match(/<(?:style|script)\b[^>]*\bnonce=["']([^"']+)["']/i);
    var nonce = nonceMatch ? ' nonce="'+nonceMatch[1].replace(/[^a-zA-Z0-9_+\/=.-]/g,'')+'"' : '';
    console.log('[QX Antigravity v1] iframe HTML wallpaper applied');
    return $done({body:body.replace(/<\/head\s*>/i,'<style id="qx-antigravity-wallpaper-v1"'+nonce+'>'+css+'</style></head>')});
  } catch (e) {
    console.log('[QX Antigravity v1] unchanged');
    return $done({});
  }
})();