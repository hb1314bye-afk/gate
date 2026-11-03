// ==UserScript==
// @name         Antigravity 蓝色背景 · Reynard
// @namespace    https://github.com/hb1314bye-afk/gate
// @version      1.0.0
// @description  沿用 Surge V7 蓝色背景，在浏览器内添加样式，无需 MITM；请先关闭 Surge 的 Antigravity 背景模块。
// @match        https://antigravity.google.com/*
// @match        https://antigravity.static.usercontent.goog/web/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getResourceURL
// @resource     antigravityBlue https://raw.githubusercontent.com/hb1314bye-afk/gate/main/surge-modules/wallpapers/blue-collage-original.webp
// @downloadURL  https://raw.githubusercontent.com/hb1314bye-afk/gate/main/surge-modules/antigravity/antigravity-background-reynard.user.js
// @updateURL    https://raw.githubusercontent.com/hb1314bye-afk/gate/main/surge-modules/antigravity/antigravity-background-reynard.user.js
// ==/UserScript==

(function () {
  'use strict';
  // Includes the remote-control iframe; no API or login request is rewritten.
  const id = 'antigravity-reynard-blue-wallpaper';
  const originalImage = "https://raw.githubusercontent.com/hb1314bye-afk/gate/main/surge-modules/wallpapers/blue-collage-original.webp";
  const originalCss = "/* surge-antigravity-home-wallpaper-v7 */\n@media screen and (max-width:1024px) {\nhtml:root:root::before {\ncontent:\"\" !important; display:block !important; visibility:visible !important;\nposition:fixed !important; inset:0 !important; width:100vw !important; height:100vh !important;\nz-index:9 !important; pointer-events:none !important;\nbackground-image:linear-gradient(90deg,rgba(0,0,0,.76) 0%,rgba(0,0,0,.64) 42%,rgba(0,0,0,.30) 100%),radial-gradient(circle at 58% 62%,rgba(255,255,255,.12) 0%,rgba(255,255,255,.06) 20%,rgba(255,255,255,0) 42%),linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.10)),url(\"https://raw.githubusercontent.com/hb1314bye-afk/gate/main/surge-modules/wallpapers/blue-collage-original.webp\") !important;\nbackground-position:56% 44% !important; background-size:cover !important;\nbackground-repeat:no-repeat !important; mix-blend-mode:lighten !important; opacity:1 !important;\n}\nhtml:root:root::after {content:none !important; display:none !important;}\n:is(main,article,[role=\"main\"]) :is(p,li,h1,h2,h3,h4) { text-shadow:0 1px 3px rgba(0,0,0,.75) !important; }\n}\n@media screen and (max-width:1024px) and (prefers-color-scheme:light) {\nhtml:root:root::before { mix-blend-mode:multiply !important; background-image:linear-gradient(90deg,rgba(255,255,255,.66) 0%,rgba(255,255,255,.58) 45%,rgba(255,255,255,.48) 100%),url(\"https://raw.githubusercontent.com/hb1314bye-afk/gate/main/surge-modules/wallpapers/blue-collage-original.webp\") !important; }\n:is(main,article,[role=\"main\"]) :is(p,li,h1,h2,h3,h4) { text-shadow:none !important; }\n}";
  let image = originalImage;
  try {
    // Cache the image in the userscript manager instead of relying on page fetches.
    image = GM_getResourceURL('antigravityBlue') || originalImage;
  } catch (_) {
    // Fall back to the same public image used by the original Surge module.
  }

  function install() {
    if (document.getElementById(id)) return;
    const sheet = GM_addStyle(originalCss.split(originalImage).join(image));
    if (sheet) sheet.id = id;
  }

  if (document.documentElement) {
    install();
  } else {
    // Only wait for the initial document root, then stop observing.
    const observer = new MutationObserver(function () {
      if (!document.documentElement) return;
      observer.disconnect();
      install();
    });
    observer.observe(document, {childList: true});
  }
})();
