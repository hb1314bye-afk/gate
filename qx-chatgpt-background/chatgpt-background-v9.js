// Quantumult X ChatGPT mobile wallpaper BG9
// Your original portrait, hosted on GitHub as a compact WebP.
// Only rewrites CSS files; never touches ChatGPT HTML, APIs or login data.
(function () {
  try {
    var u = String(($request && $request.url) || "");
    if (!/^https:\/\/chatgpt\.com\/(?:cdn\/assets\/root-[^/?]+|unauth-mweb\/assets\/stylex-[^/?]+)\.css(?:\?.*)?$/i.test(u)) return $done({});
    var r = $response || {};
    var h = r.headers || {};
    var typeKey = Object.keys(h).filter(function(k) { return k.toLowerCase() === "content-type"; })[0];
    var code = String(r.statusCode || "");
    if (code && code !== "200" && !/^HTTP\/\S+ 200(?: |$)/.test(code)) return $done({});
    if (!typeKey || !/^text\/css(?:;|$)/i.test(String(h[typeKey]).trim())) return $done({});
    var body = r.body;
    if (typeof body !== "string" || !body.length || /^\s*(?:<!doctype\s+html|<html)/i.test(body) ||
        body.indexOf("qx-chatgpt-wallpaper-BG9") !== -1) return $done({});
    var css = `
/* qx-chatgpt-wallpaper-BG9 */
@media screen and (max-width:1024px) {
  html:root::before {
    content:"" !important;
    display:block !important;
    position:fixed !important;
    inset:0 !important;
    width:100vw !important;
    height:100vh !important;
    z-index:2147483644 !important;
    pointer-events:none !important;
    background-image:linear-gradient(90deg,rgba(0,0,0,.74) 0%,rgba(0,0,0,.69) 52%,rgba(0,0,0,.43) 100%),linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.14)),url("https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp") !important;
    background-repeat:no-repeat !important;
    background-size:cover !important;
    background-position:center center !important;
    mix-blend-mode:lighten !important;
    opacity:1 !important;
  }
  html:root::after {
    content:"BG9" !important;
    display:block !important;
    position:fixed !important;
    right:10px !important;
    bottom:116px !important;
    padding:3px 7px !important;
    border-radius:5px !important;
    font:12px/1.4 sans-serif !important;
    color:#fff !important;
    background:#147d6b !important;
    z-index:2147483646 !important;
    pointer-events:none !important;
  }
  :where(aside,nav,[data-testid="sidebar"],[data-testid="sidebar-scrollable-area"],#stage-slideover-sidebar) { text-shadow:0 1px 4px rgba(0,0,0,.95) !important; }
}`;
    console.log("[QX BG9] wallpaper CSS appended");
    return $done({body:body+"\n"+css});
  } catch(e) {
    console.log("[QX BG9] skipped "+String(e));
    return $done({});
  }
})();