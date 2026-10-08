/* Quantumult X: YouTube existing subtitles -> Simplified Chinese
 * Google Translate unofficial no-key endpoint (may rate-limit or stop working).
 * Sends only caption text to Google; NO YouTube Cookie/Authorization forwarded.
 * Translation errors and unsupported formats keep original caption response.
 */
(function () {
  "use strict";
  var TAG = "[YT-ZH-Google]";
  var CACHE = "ytzh_google_caption_cache_v1";
  var COOLDOWN = "ytzh_google_cooldown_v1";
  var SOURCE = ($response && typeof $response.body === "string") ? $response.body : "";
  var done = false, timer = null;
  function note(message) { console.log(TAG + " " + message); }
  function finish(body) {
    if (done) return;
    done = true;
    if (timer !== null) clearTimeout(timer);
    $done(typeof body === "string" ? {body:body} : {});
  }
  function pref(key) { try { return $prefs.valueForKey(key) || ""; } catch (_) { return ""; } }
  function store(key,value) { try { $prefs.setValueForKey(String(value),key); } catch (_) {} }
  function getParam(url,key) {
    var m = new RegExp("[?&]" + key + "=([^&#]*)","i").exec(url);
    if (!m) return "";
    try { return decodeURIComponent(m[1].replace(/\+/g," ")); } catch (_) { return m[1]; }
  }
  function checksum(s) {
    var h = 2166136261;
    for (var i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h=Math.imul(h,16777619); }
    return (h>>>0).toString(16) + "_" + s.length;
  }
  function unescapeHTML(s) {
    return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,function(all,key){
      key=key.toLowerCase();
      var dict={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
      if(dict[key]!==undefined)return dict[key];
      var n=key.slice(1,2)==="x"?parseInt(key.slice(2),16):parseInt(key.slice(1),10);
      try{return n>0&&n<=0x10ffff?String.fromCodePoint(n):all;}catch(_){return all;}
    });
  }
  function escapeXML(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function clean(s) { return s.replace(/\s+/g," ").trim(); }
  function parse(body) {
    var clips = [], render;
    if (/^\s*\{/.test(body)) {
      var parsed;
      try { parsed=JSON.parse(body); } catch (_) { return null; }
      if (!parsed || !Array.isArray(parsed.events)) return null;
      parsed.events.forEach(function(evt) {
        if (!evt || !Array.isArray(evt.segs)) return;
        var segments=evt.segs.filter(function(s){return s && typeof s.utf8==="string";});
        if (!segments.length) return;
        var source=clean(segments.map(function(s){return s.utf8;}).join(""));
        if (!source) return;
        clips.push({source:source, set:function(value){
          segments[0].utf8=value;
          for(var i=1;i<segments.length;i++)segments[i].utf8="";
        }});
      });
      render=function(){return JSON.stringify(parsed);};
    } else if (/^\s*(?:<\?xml\b|<(?:transcript|timedtext)\b)/i.test(body)) {
      var regex=/<(p|text)\b[^>]*>[\s\S]*?<\/\1>/gi, match, entries=[];
      while ((match=regex.exec(body))!==null) {
        (function(m){
          var start=m[0].indexOf(">"),tag=m[1];
          var content=m[0].slice(start+1,-(tag.length+3));
          var source=clean(unescapeHTML(content.replace(/<br\s*\/?\s*>/gi," ").replace(/<[^>]+>/g,"")));
          if(!source)return;
          var item={start:m.index,end:m.index+m[0].length,head:m[0].slice(0,start+1),tag:tag,content:content,newText:null};
          entries.push(item);
          clips.push({source:source,set:function(t){item.newText=t;}});
        })(match);
      }
      render=function(){
        var pos=0,out="";
        entries.forEach(function(e){
          out+=body.slice(pos,e.start)+e.head+(e.newText===null?e.content:escapeXML(e.newText))+"</"+e.tag+">";
          pos=e.end;
        });
        return out+body.slice(pos);
      };
    } else if (/^\s*WEBVTT\b/.test(body)) {
      var blocks=body.split(/(\r?\n(?:\r?\n)+)/),map=[];
      for(var b=0;b<blocks.length;b+=2){
        var lines=blocks[b].split(/\r?\n/),breakAt=-1;
        for(var j=0;j<lines.length;j++){if(lines[j].indexOf("-->")>=0){breakAt=j;break;}}
        if(breakAt<0||breakAt+1>=lines.length)continue;
        var text=clean(lines.slice(breakAt+1).join(" ").replace(/<[^>]*>/g,""));
        if(!text)continue;
        (function(idx,head,s){
          var item={idx:idx,head:head,result:null};
          map.push(item);
          clips.push({source:s,set:function(t){item.result=t;}});
        })(b,lines.slice(0,breakAt+1).join("\n"),text);
      }
      render=function(){
        map.forEach(function(item){
          if(item.result!==null)blocks[item.idx]=item.head+"\n"+item.result;
        });
        return blocks.join("");
      };
    } else return null;
    return {clips:clips,render:render};
  }
  function googleTranslation(resp) {
    var data;
    try { data=JSON.parse(resp.body||""); } catch (_) { return null; }
    if(!Array.isArray(data) || !Array.isArray(data[0]))return null;
    var text="";
    data[0].forEach(function(chunk) {
      if(Array.isArray(chunk)&&typeof chunk[0]==="string")text+=chunk[0];
    });
    return text || null;
  }
  try {
    var url=($request && $request.url) || "";
    if (!/^https:\/\/www\.youtube\.com\/api\/timedtext\?/i.test(url)||!SOURCE){finish();return;}
    var inputLang=getParam(url,"lang").toLowerCase().replace(/_/g,"-");
    var outputLang=getParam(url,"tlang").toLowerCase().replace(/_/g,"-");
    if(/^(zh|zh-cn|zh-hans|zh-sg)$/.test(inputLang)||/^(zh|zh-cn|zh-hans|zh-sg)$/.test(outputLang)){
      note("already simplified Chinese; keeping original"); finish();return;
    }
    var supported={ko:1,en:1,ja:1,fr:1,de:1,es:1,ru:1,it:1,pt:1,th:1,vi:1,id:1,hi:1,ar:1,tr:1};
    var from=inputLang.split("-")[0];
    if(inputLang==="zh-hk"||inputLang==="zh-tw"||inputLang==="zh-hant")from="zh-TW";
    else if(!supported[from]){note("unknown language; keeping original");finish();return;}
    if(Date.now()<Number(pref(COOLDOWN)||0)){note("Google cooldown; keeping original");finish();return;}
    var subtitle=parse(SOURCE);
    if(!subtitle||!subtitle.clips.length){note("unsupported subtitle format; keeping original");finish();return;}
    var key=checksum(from+"|"+SOURCE);
    try{
      var hit=JSON.parse(pref(CACHE)||"null");
      if(hit&&hit.key===key&&Date.now()-hit.time<21600000&&typeof hit.body==="string"){
        note("cache hit");finish(hit.body);return;
      }
    }catch(_){}
    var groups=[],group=[],n=0, MAX_GROUPS=18,MAX_CHAR=450,MAX_PER_GROUP=6;
    subtitle.clips.forEach(function(c){
      if(groups.length>=MAX_GROUPS)return;
      if(c.source.length>MAX_CHAR)return;
      if(group.length&&(group.length>=MAX_PER_GROUP||n+c.source.length+1>MAX_CHAR)){
        groups.push(group);group=[];n=0;
        if(groups.length>=MAX_GROUPS)return;
      }
      group.push(c);n+=c.source.length+(group.length>1?1:0);
    });
    if(group.length&&groups.length<MAX_GROUPS)groups.push(group);
    if(!groups.length){note("nothing short enough to translate");finish();return;}
    var next=0,busy=0,finished=0,success=0,failures=0,blocked=false;
    timer=setTimeout(function(){note("timeout; keeping original");finish();},11500);
    note("requesting "+groups.length+" batches, source="+from);
    function finalize(){
      if(done)return;
      if(success){
        var result=subtitle.render();
        try{if(result.length<45000)store(CACHE,JSON.stringify({key:key,time:Date.now(),body:result}));}catch(_){}
        note("success "+success+" batches; skipped/failed "+failures+"; other cues original");
        finish(result);
      }else{note("all Google requests failed; original kept");finish();}
    }
    function pump(){
      if(done)return;
      while(busy<4&&next<groups.length&&!blocked) {
        (function(batch){
          busy++;
          var source=batch.map(function(c){return c.source;}).join("\n");
          var endpoint="https://translate.googleapis.com/translate_a/single?client=gtx&sl="+
            encodeURIComponent(from)+"&tl=zh-CN&dt=t&q="+encodeURIComponent(source);
          $task.fetch({url:endpoint,method:"GET"}).then(function(resp){
            if(done)return;
            var http=Number(resp.statusCode||resp.status||0);
            if(http===429||http===403){blocked=true;store(COOLDOWN,Date.now()+1800000);failures++;return;}
            if(http!==200){failures++;return;}
            var translated=googleTranslation(resp);
            if(!translated){failures++;return;}
            var lines=batch.length===1?[translated]:translated.split(/\r?\n/);
            if(lines.length!==batch.length||lines.some(function(s){return !s.trim();})){
              failures++;return;
            }
            lines.forEach(function(line,i){batch[i].set(unescapeHTML(line.trim()));});
            success++;
          }).catch(function(e){failures++;note("Google request error: "+String(e).slice(0,90));})
          .then(function(){
            if(done)return;
            busy--;finished++;
            if(blocked||finished===groups.length){finalize();return;}
            pump();
          });
        })(groups[next++]);
      }
    }
    pump();
  }catch(e){note("script error: "+String(e).slice(0,100));finish();}
})();