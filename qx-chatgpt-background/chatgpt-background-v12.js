// Quantumult X ChatGPT mobile wallpaper BG12
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
        body.indexOf("qx-chatgpt-wallpaper-BG12") !== -1) return $done({});
    var css = `
/* qx-chatgpt-wallpaper-BG12 */
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
    background-image:linear-gradient(90deg,rgba(0,0,0,.76) 0%,rgba(0,0,0,.64) 42%,rgba(0,0,0,.30) 100%),radial-gradient(circle at 58% 62%,rgba(255,255,255,.12) 0%,rgba(255,255,255,.06) 20%,rgba(255,255,255,0) 42%),linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.10)),url("https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp") !important;
    background-repeat:no-repeat !important;
    background-size:cover !important;
    background-position:56% 44% !important;
    mix-blend-mode:lighten !important;
    opacity:1 !important;
  }
  /* No visible debug marker. Higher specificity hides cached BG10 marker. */
  html:root:root::after { content:none !important; display:none !important; }
  :where(aside,nav,[data-testid="sidebar"],[data-testid="sidebar-scrollable-area"],#stage-slideover-sidebar) { text-shadow:0 1px 4px rgba(0,0,0,.95) !important; }
  main, article, [data-message-author-role], [data-testid="conversation-turns"] { text-shadow:0 1px 3px rgba(0,0,0,.75) !important; }
  /* In light theme, lighten on white hides the portrait: multiply keeps it visible without covering black text. */
  html:root:not(.dark):not([data-theme="dark"])::before {
    mix-blend-mode:multiply !important;
    background-image:linear-gradient(90deg,rgba(255,255,255,.70) 0%,rgba(255,255,255,.58) 46%,rgba(255,255,255,.48) 100%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.12)),url("https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-chatgpt-background/bg8-mobile.webp") !important;
  }
}`;
    console.log("[QX BG12] wallpaper CSS appended");
    return $done({body:body+"\n"+css});
  } catch(e) {
    console.log("[QX BG12] skipped "+String(e));
    return $done({});
  }
})();