/* Quantumult X one-time local setup for Azure Translator */
(function () {
  'use strict';
  var tag = '[YT-ZH-Azure-Setup]';
  try {
    var path = ($environment && $environment.sourcePath) || '';
    var hash = path.indexOf('#');
    if (hash < 0) throw new Error('未发现配置参数。请在脚本链接后填写 #key=YOUR_KEY&region=global');
    var cfg = {};
    path.slice(hash + 1).split('&').forEach(function (pair) {
      var p = pair.indexOf('=');
      if (p > 0) cfg[decodeURIComponent(pair.slice(0,p))] = decodeURIComponent(pair.slice(p + 1));
    });
    if (cfg.remove === '1') {
      $prefs.removeValueForKey('ytzh_azure_api_key_v1');
      $prefs.removeValueForKey('ytzh_azure_region_v1');
      $prefs.removeValueForKey('ytzh_azure_subtitle_cache_v1');
      $notify('YouTube 中文字幕', '本地 Azure 密钥已清除', '请删除临时配置任务。');
      console.log(tag + ' local credentials removed');
    } else {
      var key = (cfg.key || '').trim();
      var region = (cfg.region || 'global').trim().toLowerCase();
      if (!/^[a-z0-9+\/_=-]{20,256}$/i.test(key) || /your_key/i.test(key)) throw new Error('API Key 格式不正确。');
      if (region !== 'global' && !/^[a-z0-9-]{2,40}$/.test(region)) throw new Error('Region 格式不正确。');
      if ($prefs.setValueForKey(key, 'ytzh_azure_api_key_v1') === false) throw new Error('密钥保存失败。');
      $prefs.setValueForKey(region, 'ytzh_azure_region_v1');
      $prefs.removeValueForKey('ytzh_azure_subtitle_cache_v1');
      $notify('YouTube 中文字幕', 'Azure 密钥保存成功', '密钥仅在 QX 本地保存。请删除临时配置任务。');
      console.log(tag + ' saved credentials locally; key not logged');
    }
  } catch (e) {
    console.log(tag + ' error: ' + String(e.message || e));
    $notify('YouTube 中文字幕', '配置失败', String(e.message || e));
  }
  $done({});
})();