/* QX YouTube timedtext -> MyMemory free translation -> Simplified Chinese
 * Anonymous / no API key. Keeps original subtitles if translation is unavailable.
 * Subtitle text is sent to api.mymemory.translated.net; no YouTube cookies are sent.
 */
(function () {
  "use strict";
  var LOG = "[YT-ZH-MyMemory]";
  var DAILY = "ytzh_mm_daily_v1", CACHE = "ytzh_mm_cache_v1";
  var DEADLINE = 9500, MAX_DAY = 4500, MAX_RESPONSE = 2900;
  var original = ($response && typeof $response.body === "string") ? $response.body : "";
  var completed = false, timer = null;
  function output(body) {
    if (completed) return;
    completed = true;
    if (timer !== null) clearTimeout(timer);
    $done(typeof body === "string" ? { body: body } : {});
  }
  function log(s) { console.log(LOG + " " + s); }
  function value(k) { try { return $prefs.valueForKey(k) || ""; } catch (_) { return ""; } }
  function save(k,v) { try { $prefs.setValueForKey(String(v), k); } catch (_) {} }
  function readParam(url, key) {
    var m = new RegExp("[?&]" + key + "=([^&#]*)", "i").exec(url);
    if (!m) return "";
    try { return decodeURIComponent(m[1].replace(/\+/g, " ")); }
    catch (_) { return m[1]; }
  }
  function digest(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16) + "_" + s.length;
  }
  function bytes(s) {
    var n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 128) n += 1;
      else if (c < 2048) n += 2;
      else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length &&
        s.charCodeAt(i+1) >= 0xdc00 && s.charCodeAt(i+1) <= 0xdfff) { n += 4; i++; }
      else n += 3;
    }
    return n;
  }
  function xmlDecode(s) {
    return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, function (raw,x) {
      x=x.toLowerCase();
      var named={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
      if (named[x] !== undefined) return named[x];
      var v = x.slice(1,2)==="x" ? parseInt(x.slice(2),16) : parseInt(x.slice(1),10);
      try { return v > 0 && v <= 0x10ffff ? String.fromCodePoint(v) : raw; }
      catch (_) { return raw; }
    });
  }
  function xmlEncode(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function normalize(s) { return s.replace(/\s+/g," ").trim(); }
  function parseCaptions(body) {
    var cues=[],render;
    if (/^\s*\{/.test(body)) {
      var obj;
      try { obj=JSON.parse(body); } catch (_) { return null; }
      if (!obj || !Array.isArray(obj.events)) return null;
      obj.events.forEach(function(e) {
        if (!e || !Array.isArray(e.segs)) return;
        var segs=e.segs.filter(function(x){return x && typeof x.utf8 === "string";});
        if (!segs.length) return;
        var text=normalize(segs.map(function(x){return x.utf8;}).join(""));
        if (!text) return;
        cues.push({text:text,apply:function(t){
          segs[0].utf8=t; for(var i=1;i<segs.length;i++)segs[i].utf8="";
        }});
      });
      render=function(){return JSON.stringify(obj);};
    } else if (/^\s*(?:<\?xml\b|<(?:transcript|timedtext)\b)/i.test(body)) {
      var re=/<(text|p)\b[^>]*>[\s\S]*?<\/\1>/gi, m, chunks=[];
      while((m=re.exec(body))!==null) {
        var open=m[0].indexOf(">"),inside=m[0].slice(open+1,-(m[1].length+3));
        var text=normalize(xmlDecode(inside.replace(/<br\s*\/?\s*>/gi," ").replace(/<[^>]*>/g,"")));
        if (!text) continue;
        (function(found, opening, label, text_) {
          var entry={start:found.index,end:found.index+found[0].length,open:found[0].slice(0,opening+1),
            tag:label,translation:null};
          chunks.push(entry);
          cues.push({text:text_,apply:function(t){entry.translation=t;}});
        })(m,open,m[1],text);
      }
      render=function(){
        var pos=0,out="";
        chunks.forEach(function(c){
          out+=body.slice(pos,c.start)+c.open+xmlEncode(c.translation === null ? "" : c.translation)+"</"+c.tag+">";
          pos=c.end;
        });
        return out+body.slice(pos);
      };
    } else if (/^\s*WEBVTT\b/.test(body)) {
      var parts=body.split(/(\r?\n(?:\r?\n)+)/),mapping=[];
      for(var i=0;i<parts.length;i+=2) {
        var lines=parts[i].split(/\r?\n/),line=-1;
        for(var j=0;j<lines.length;j++)if(lines[j].indexOf("-->")!==-1){line=j;break;}
        if(line<0 || line+1>=lines.length)continue;
        var txt=normalize(lines.slice(line+1).join(" ").replace(/<[^>]*>/g,""));
        if(!txt)continue;
        (function(index,head,t){
          var entry={index:index,head:head,translated:null};
          mapping.push(entry);
          cues.push({text:t,apply:function(s){entry.translated=s;}});
        })(i,lines.slice(0,line+1).join("\n"),txt);
      }
      render=function(){
        mapping.forEach(function(e){ if(e.translated!==null)parts[e.index]=e.head+"\n"+e.translated;});
        return parts.join("");
      };
    } else return null;
    return {cues:cues,render:render};
  }
  function resolveLang(url) {
    var s=readParam(url,"lang").toLowerCase().replace(/_/g,"-");
    var target=readParam(url,"tlang").toLowerCase().replace(/_/g,"-");
    if (/^zh(?:$|-)/.test(target) && /^(zh|zh-hans|zh-cn|zh-sg)$/.test(target)) return "";
    if (/^(zh|zh-hans|zh-cn|zh-sg)$/.test(s)) return "";
    var pair={ko:"ko",en:"en",ja:"ja",fr:"fr",de:"de",es:"es",ru:"ru",
      pt:"pt",it:"it",ar:"ar",hi:"hi",th:"th",vi:"vi",id:"id",tr:"tr",
      zh:"zh-TW"};
    var code=s.split("-")[0];
    if (s === "zh-tw" || s === "zh-hant" || s === "zh-hk") return "zh-TW";
    return pair[code]||"";
  }
  try {
    var url=($request && $request.url) || "";
    if (!/^https:\/\/www\.youtube\.com\/api\/timedtext\?/i.test(url) || !original) { output(); return; }
    var language=resolveLang(url);
    if (!language) { log("unsupported/already Chinese; original kept"); output(); return; }
    var parsed=parseCaptions(original);
    if(!parsed || !parsed.cues.length){log("unsupported/empty captions; original kept");output();return;}
    var cacheKey=digest(original+"|"+language);
    try {
      var saved=JSON.parse(value(CACHE)||"null");
      if(saved && saved.key===cacheKey && Date.now()-saved.time<12*3600000 && typeof saved.body==="string"){
        log("cache hit");output(saved.body);return;
      }
    } catch (_){}
    var today=(new Date()).toISOString().slice(0,10),stats;
    try{stats=JSON.parse(value(DAILY)||"null");}catch(_){}
    if(!stats||stats.date!==today)stats={date:today,used:0};
    if(stats.used>=MAX_DAY){log("local daily quota reached; original kept");output();return;}
    var remaining=Math.min(MAX_RESPONSE,MAX_DAY-stats.used);
    var groups=[], current=[], currentBytes=0, currentChars=0, applied=0;
    parsed.cues.forEach(function(c){
      var size=bytes(c.text),n=c.text.length;
      if(size>440 || n>remaining-applied)return;
      if(current.length && (currentBytes+1+size>440 || current.length>=8)) {
        groups.push(current);current=[];currentBytes=0;currentChars=0;
      }
      current.push(c);currentBytes+=size+(current.length>1?1:0);
      currentChars+=n;applied+=n;
    });
    if(current.length)groups.push(current);
    if(!groups.length){log("no captions within free quota; original kept");output();return;}
    // Keep only a moderate number of requests per subtitle response.
    if(groups.length>24)groups=groups.slice(0,24);
    var total=groups.reduce(function(n,g){return n+g.reduce(function(m,c){return m+c.text.length;},0);},0);
    stats.used+=total;save(DAILY,JSON.stringify(stats)); // reserve before network requests
    var success=0, failure=0, next=0, running=0, count=0;
    var allowed=groups.length, retryBlocked=false;
    timer=setTimeout(function(){log("timeout; original kept");output();},DEADLINE);
    log("language="+language+"; "+groups.length+" groups; ~"+total+" chars reserved");
    function finishAll(){
      if(completed)return;
      if(success>0){
        var result=parsed.render();
        if(result.length<120000)save(CACHE,JSON.stringify({key:cacheKey,time:Date.now(),body:result}));
        log("translated groups="+success+", failed="+failure+"; remainder original");
        output(result);
      }else{log("no translation obtained; original kept");output();}
    }
    function start(){
      if(completed)return;
      while(running<4 && next<allowed && !retryBlocked){
        (function(group){
          running++;
          var text=group.map(function(c){return c.text;}).join("\n");
          var endpoint="https://api.mymemory.translated.net/get?q="+encodeURIComponent(text)+
            "&langpair="+encodeURIComponent(language+"|zh-CN");
          $task.fetch({url:endpoint,method:"GET"}).then(function(res){
            if(completed)return;
            var http=Number(res.statusCode||res.status||0),data={};
            try{data=JSON.parse(res.body||"{}");}catch(_){}
            var status=Number(data.responseStatus||0);
            if(http===429 || status===429 || status===403 || http===403){
              retryBlocked=true;log("quota/rate limit reached; stopped additional requests");return;
            }
            if(http!==200 || status!==200 || !data.responseData ||
              typeof data.responseData.translatedText!=="string"){failure++;return;}
            var translated=xmlDecode(data.responseData.translatedText);
            var lines=group.length===1?[translated]:translated.split(/\r?\n/);
            if(lines.length!==group.length || lines.some(function(s){return !s.trim();})){
              failure++;return;
            }
            lines.forEach(function(s,i){group[i].apply(s.trim());});
            success++;
          }).catch(function(e){if(!completed){failure++;log("request failed: "+String(e).slice(0,60));}})
          .then(function(){
            if(completed)return;
            running--;count++;
            if(retryBlocked||count===allowed){finishAll();return;}
            start();
          });
        })(groups[next++]);
      }
    }
    start();
  }catch(e){log("unexpected error: "+String(e).slice(0,100));output();}
})();