// ==UserScript==
// @name         Antigravity 蓝色背景 · Reynard
// @namespace    https://github.com/hb1314bye-afk/gate
// @version      1.2.0
// @description  支持 Antigravity 和 ChatGPT，上半张照片等比例铺满；无需 MITM，请关闭对应的 Surge 背景模块。
// @match        https://chatgpt.com/*
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
  if (location.hostname === 'chatgpt.com') {
    if (window.top !== window.self) return;
    installChatGPT(image);
    return;
  }
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

  function installChatGPT(wallpaper) {
    const styleId = 'chatgpt-reynard-blue-wallpaper';
    const css = `
/* Keep the first 1144 x 710 photograph proportional and hide the collage gutter. */
html:root[data-chatgpt-wallpaper] {
  --reynard-wallpaper-base: #fff;
  --reynard-wallpaper-popup: #fff;
  --reynard-wallpaper-opacity: .45;
  isolation: isolate !important;
  background-color: var(--reynard-wallpaper-base) !important;
}
html:root[data-chatgpt-wallpaper-theme="dark"] {
  --reynard-wallpaper-base: #171717;
  --reynard-wallpaper-popup: #2f2f2f;
  --reynard-wallpaper-opacity: .36;
}
html:root[data-chatgpt-wallpaper]::before {
  content: "" !important;
  display: block !important;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  height: 100dvh !important;
  z-index: -1 !important;
  pointer-events: none !important;
  background-image: url(${JSON.stringify(wallpaper)}) !important;
  background-size: max(100vw, 161.13vh) auto !important;
  background-position: 50% top !important;
  background-repeat: no-repeat !important;
  opacity: var(--reynard-wallpaper-opacity) !important;
}
@supports (height: 100dvh) {
  html:root[data-chatgpt-wallpaper]::before {
    background-size: max(100vw, 161.13dvh) auto !important;
  }
}
html:root[data-chatgpt-wallpaper] :is(
  body, #root, #__next, #web-mobile-root, #thread, main, [role="main"],
  [data-testid="ds-document-layout"],
  #root > div:has(main), #__next > div:has(main),
  #web-mobile-root > div:has(main),
  #thread-bottom-container, #thread-bottom-container > div:has(form),
  main > header, #thread > header
) {
  background-color: transparent !important;
  background-image: none !important;
}
html:root[data-chatgpt-wallpaper] :is(
  [data-message-author-role="user"], [data-testid="user-message"],
  [data-testid="user-message-bubble"], .user-message-bubble-color,
  [data-message-author-role="user"] .bg-token-bg-secondary,
  [data-message-author-role="user"] .bg-token-main-surface-secondary
) {
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  border-color: transparent !important;
}
html:root[data-chatgpt-wallpaper] :is(
  [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"],
  [data-radix-popper-content-wrapper] > div, [data-radix-menu-content]
) {
  background-color: var(--reynard-wallpaper-popup) !important;
  background-image: none !important;
}
`;

    function install() {
      const root = document.documentElement;
      if (root.hasAttribute('data-chatgpt-wallpaper') || document.getElementById(styleId)) return;
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      let body = null;
      let queued = false;

      function theme() {
        for (const node of [root, document.body]) {
          if (!node) continue;
          for (const name of ['data-theme', 'data-color-mode']) {
            const value = node.getAttribute(name);
            if (value === 'dark' || value === 'light') return value;
          }
          if (node.classList.contains('dark')) return 'dark';
          if (node.classList.contains('light')) return 'light';
        }
        // Mobile ChatGPT uses hashed classes. Foreground color survives our background changes.
        if (document.body) {
          const color = getComputedStyle(document.body).color;
          const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(color);
          if (rgb) {
            const brightness = .2126 * Number(rgb[1]) + .7152 * Number(rgb[2]) + .0722 * Number(rgb[3]);
            return brightness > 128 ? 'dark' : 'light';
          }
        }
        return media.matches ? 'dark' : 'light';
      }

      const options = {attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-color-mode']};
      const bodyObserver = new MutationObserver(schedule);
      function sync() {
        queued = false;
        if (document.body !== body) {
          bodyObserver.disconnect();
          body = document.body;
          if (body) bodyObserver.observe(body, options);
        }
        const value = theme();
        if (root.getAttribute('data-chatgpt-wallpaper-theme') !== value) {
          root.setAttribute('data-chatgpt-wallpaper-theme', value);
        }
      }
      function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(sync);
      }

      sync();
      root.setAttribute('data-chatgpt-wallpaper', '1.2.0');
      const sheet = GM_addStyle(css);
      if (sheet) sheet.id = styleId;
      const rootObserver = new MutationObserver(schedule);
      rootObserver.observe(root, Object.assign({childList: true}, options));
      if (media.addEventListener) media.addEventListener('change', schedule);
      else if (media.addListener) media.addListener(schedule);
    }

    if (document.documentElement) install();
    else {
      const ready = new MutationObserver(function () {
        if (!document.documentElement) return;
        ready.disconnect();
        install();
      });
      ready.observe(document, {childList: true});
    }
  }

})();
