// ==UserScript==
// @name         Antigravity 蓝色背景 · Reynard
// @namespace    https://github.com/hb1314bye-afk/gate
// @version      1.1.0
// @description  修复拼图白边和内外页面背景叠加，使用上半张照片等比例铺满；无需 MITM，请关闭 Surge 的 Antigravity 背景模块。
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
  const id = 'antigravity-reynard-blue-wallpaper';
  let image = "https://raw.githubusercontent.com/hb1314bye-afk/gate/main/surge-modules/wallpapers/blue-collage-original.webp";
  try {
    image = GM_getResourceURL('antigravityBlue') || image;
  } catch (_) {}
  const css = "/* Use the top photograph (1144 x 710), excluding the collage gutter. */\n@media screen and (max-width:1024px) {\n  html:root:root::before {\n    content:\"\" !important; display:block !important; visibility:visible !important;\n    position:fixed !important; inset:0 !important;\n    width:100vw !important; height:100vh !important; height:100dvh !important;\n    z-index:9 !important; pointer-events:none !important;\n    background-image:linear-gradient(90deg,rgba(0,0,0,.76),rgba(0,0,0,.64) 42%,rgba(0,0,0,.30)),url(\"__AG_IMAGE__\") !important;\n    background-size:100% 100%,max(100vw,161.13vh) auto !important;\n    background-position:center,50% top !important;\n    background-repeat:no-repeat !important;\n    mix-blend-mode:lighten !important; opacity:1 !important;\n  }\n  html:root:root[data-ag-wallpaper-in-child]::before { display:none !important; }\n  html:root:root::after { content:none !important; display:none !important; }\n  :is(main,article,[role=\"main\"]) :is(p,li,h1,h2,h3,h4) {\n    text-shadow:0 1px 3px rgba(0,0,0,.75) !important;\n  }\n}\n@supports (height:100dvh) {\n  @media screen and (max-width:1024px) {\n    html:root:root::before {\n      background-size:100% 100%,max(100vw,161.13dvh) auto !important;\n    }\n  }\n}\n@media screen and (max-width:1024px) and (prefers-color-scheme:light) {\n  html:root:root::before {\n    mix-blend-mode:multiply !important;\n    background-image:linear-gradient(90deg,rgba(255,255,255,.66),rgba(255,255,255,.58) 45%,rgba(255,255,255,.48)),url(\"__AG_IMAGE__\") !important;\n  }\n  :is(main,article,[role=\"main\"]) :is(p,li,h1,h2,h3,h4) { text-shadow:none !important; }\n}".split('__AG_IMAGE__').join(image);

  function install() {
    const old = document.getElementById(id);
    if (old) old.remove();
    const sheet = GM_addStyle(css);
    if (sheet) sheet.id = id;

    // The remote chat frame paints its own background. Do not paint it twice.
    if (location.hostname !== 'antigravity.google.com') return;
    const root = document.documentElement;
    function updateOwner() {
      const hasRemote = Array.from(document.querySelectorAll('iframe')).some(function (frame) {
        try {
          const url = new URL(frame.src, location.href);
          return url.hostname === 'antigravity.static.usercontent.goog' &&
            url.pathname.startsWith('/web/');
        } catch (_) { return false; }
      });
      root.toggleAttribute('data-ag-wallpaper-in-child', hasRemote);
    }
    function containsFrame(node) {
      return node.nodeType === 1 && (node.localName === 'iframe' || !!node.querySelector('iframe'));
    }
    updateOwner();
    let queued = false;
    const frames = new MutationObserver(function (records) {
      const changed = records.some(function (record) {
        if (record.type === 'attributes') return record.target.localName === 'iframe';
        return Array.from(record.addedNodes).some(containsFrame) ||
          Array.from(record.removedNodes).some(containsFrame);
      });
      if (!changed || queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; updateOwner(); });
    });
    frames.observe(root, {childList:true, subtree:true, attributes:true, attributeFilter:['src']});
  }

  if (document.documentElement) {
    install();
  } else {
    const ready = new MutationObserver(function () {
      if (!document.documentElement) return;
      ready.disconnect();
      install();
    });
    ready.observe(document, {childList:true});
  }
})();
