/* Quantumult X YouTube subtitle translation (zh-Hans, safe fallback).
 * Only fetches from the SAME youtube.com host as the intercepted request.
 * No subtitle recognition: the video must already have a subtitle track.
 */
(function () {
  'use strict';
  var TAG = '[YT-ZH-Safe]';
  var KEY = 'yt_zh_safe_429_until_v2';
  var done = false, timer;
  function finish(text) {
    if (done) return;
    done = true;
    if (timer !== undefined) clearTimeout(timer);
    $done(typeof text === 'string' ? { body: text } : {});
  }
  function param(url, name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)', 'i').exec(url);
    if (!m) return '';
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')); }
    catch (_) { return m[1]; }
  }
  function captions(text) {
    if (typeof text !== 'string' || !text.trim()) return false;
    var s = text.trim();
    if (/^(WEBVTT\b|<\?xml\b|<(?:transcript|timedtext)\b)/i.test(s)) return true;
    if (!/^[\[{]/.test(s)) return false;
    try {
      var data = JSON.parse(s);
      return Array.isArray(data) || Array.isArray(data.events) || !!data.cues;
    } catch (_) { return false; }
  }
  try {
    var request = typeof $request === 'object' ? $request : {};
    var response = typeof $response === 'object' ? $response : {};
    var url = request.url || '';
    if (!/^https:\/\/www\.youtube\.com\/api\/timedtext\?/i.test(url) ||
        param(url, '_qxzh') || !captions(response.body)) { finish(); return; }
    var source = param(url, 'lang');
    var translated = param(url, 'tlang');
    if (/^zh[-_](hans|cn|sg)$/i.test(source) || /^zh[-_](hans|cn|sg)$/i.test(translated)) {
      finish(); return;
    }
    if (Date.now() < Number($prefs.valueForKey(KEY) || 0)) {
      console.log(TAG + ' 429 cooldown; keeping original');
      finish(); return;
    }
    var headers = {}, incoming = request.headers || {};
    Object.keys(incoming).forEach(function (name) {
      if (!/^(host|connection|content-length|transfer-encoding|accept-encoding|if-none-match|if-modified-since)$/i.test(name)) {
        headers[name] = incoming[name];
      }
    });
    var translatedUrl = url.replace(/([?&])tlang=[^&#]*&?/gi, '$1').replace(/[?&]$/, '');
    translatedUrl += (translatedUrl.indexOf('?') === -1 ? '?' : '&') + 'tlang=zh-Hans&_qxzh=1';
    timer = setTimeout(function () {
      console.log(TAG + ' timed out; keeping original');
      finish();
    }, 6500);
    console.log(TAG + ' requesting zh-Hans; original=' + (source || 'unknown'));
    $task.fetch({ url: translatedUrl, method: 'GET', headers: headers }).then(function (result) {
      if (done) return;
      var code = Number(result.statusCode || result.status || 0);
      if (code === 200 && captions(result.body)) {
        console.log(TAG + ' translated successfully');
        finish(result.body);
      } else {
        if (code === 429) {
          $prefs.setValueForKey(String(Date.now() + 1800000), KEY);
          console.log(TAG + ' HTTP 429; paused translations for 30 minutes');
        } else console.log(TAG + ' HTTP ' + code + '; keeping original');
        finish();
      }
    }).catch(function (e) {
      console.log(TAG + ' fetch error; keeping original: ' + String(e));
      finish();
    });
  } catch (e) {
    console.log(TAG + ' error; keeping original: ' + String(e));
    finish();
  }
})();
