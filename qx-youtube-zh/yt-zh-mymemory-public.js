/* QX YouTube Simplified Chinese subtitles via MyMemory anonymous API.
   Sends subtitle text only (never YouTube cookies); no API key or account.
   If translation fails, keep the original text. Free daily limits apply. */
(function(){
"use strict";
var TAG="[YT-ZH-MyMemory]",DAY="ytzh_mm_day_2026",CACHE="ytzh_mm_cache_2026";
var raw=$response&&typeof $response.body==="string"?$response.body:"",ended=false,clock=null;
function log(t){console.log(TAG+" "+t);}
function finish(v){if(ended)return;ended=true;if(clock!==null)clearTimeout(clock);$done(typeof v==="string"?{body:v}:{});}
function get(k){try{return $prefs.valueForKey(k)||"";}catch(e){return "";}}
function put(k,v){try{$prefs.setValueForKey(String(v),k);}catch(e){}}
function param(u,k){var m=new RegExp("[?&]"+k+"=([^&#]*)","i").exec(u);if(!m)return"";try{return decodeURIComponent(m[1].replace(/\+/g," "));}catch(e){return m[1];}}
function size(t){var n=0;for(var i=0;i<t.length;i++){var c=t.charCodeAt(i);if(c<128)n++;else if(c<2048)n+=2;else if(c>=0xd800&&c<=0xdbff&&i+1<t.length&&t.charCodeAt(i+1)>=0xdc00&&t.charCodeAt(i+1)<=0xdfff){n+=4;i++;}else n+=3;}return n;}
function fp(s){var n=2166136261;for(var i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return(n>>>0).toString(16)+":"+s.length;}
function unescapeEntities(s){return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,function(all,key){key=key.toLowerCase();var map={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};if(map[key]!==undefined)return map[key];var v=key.charAt(1)==="x"?parseInt(key.substring(2),16):parseInt(key.substring(1),10);try{return v>0&&v<=0x10ffff?String.fromCodePoint(v):all;}catch(e){return all;}});}
function escapeXml(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function clean(s){return s.replace(/\s+/g," ").trim();}
function parse(s){
 var clips=[],render=null,match;
 if(/^\s*\{/.test(s)){
  var json;try{json=JSON.parse(s);}catch(e){return null;}
  if(!json||!Array.isArray(json.events))return null;
  json.events.forEach(function(ev){if(!ev||!Array.isArray(ev.segs))return;
   var seg=ev.segs.filter(function(a){return a&&typeof a.utf8==="string";});
   if(!seg.length)return;var t=clean(seg.map(function(a){return a.utf8;}).join(""));
   if(!t)return;clips.push({text:t,set:function(v){seg[0].utf8=v;for(var i=1;i<seg.length;i++)seg[i].utf8="";}});
  });render=function(){return JSON.stringify(json);};
 }else if(/^\s*(?:<\?xml\b|<(?:transcript|timedtext)\b)/i.test(s)){
  var pattern=/<(p|text)\b[^>]*>[\s\S]*?<\/\1>/gi,pieces=[];
  while((match=pattern.exec(s))!==null){
   (function(m){var pos=m[0].indexOf(">"),tag=m[1];
    var orig=m[0].slice(pos+1,-(tag.length+3));
    var text=clean(unescapeEntities(orig.replace(/<br\s*\/?\s*>/gi," ").replace(/<[^>]*>/g,"")));
    if(!text)return;
    var e={a:m.index,b:m.index+m[0].length,open:m[0].slice(0,pos+1),original:orig,tag:tag,translation:null};
    pieces.push(e);clips.push({text:text,set:function(v){e.translation=v;}});
   })(match);
  }
  render=function(){var out="",cursor=0;pieces.forEach(function(e){
   out+=s.slice(cursor,e.a)+e.open+(e.translation===null?e.original:escapeXml(e.translation))+"</"+e.tag+">";cursor=e.b;
  });return out+s.slice(cursor);};
 }else if(/^\s*WEBVTT\b/.test(s)){
  var blocks=s.split(/(\r?\n(?:\r?\n)+)/),entries=[];
  for(var j=0;j<blocks.length;j+=2){
   var lines=blocks[j].split(/\r?\n/),sep=-1;
   for(var k=0;k<lines.length;k++){if(lines[k].indexOf("-->")>=0){sep=k;break;}}
   if(sep<0||sep+1>=lines.length)continue;
   var text=clean(lines.slice(sep+1).join(" ").replace(/<[^>]*>/g,""));
   if(!text)continue;
   (function(idx,head,t){var e={idx:idx,head:head,translation:null};entries.push(e);
    clips.push({text:t,set:function(v){e.translation=v;}});
   })(j,lines.slice(0,sep+1).join("\n"),text);
  }
  render=function(){entries.forEach(function(e){if(e.translation!==null)blocks[e.idx]=e.head+"\n"+e.translation;});return blocks.join("");};
 }else return null;
 return{clips:clips,render:render};
}
try{
 var url=$request&&$request.url||"";
 if(!/^https:\/\/www\.youtube\.com\/api\/timedtext\?/i.test(url)||!raw){finish();return;}
 var originalLang=param(url,"lang").toLowerCase().replace(/_/g,"-");
 var targetLang=param(url,"tlang").toLowerCase().replace(/_/g,"-");
 if(/^(zh|zh-cn|zh-hans|zh-sg)$/.test(originalLang)||/^(zh|zh-cn|zh-hans|zh-sg)$/.test(targetLang)){finish();return;}
 var src=originalLang.split("-")[0];
 var valid={ko:1,en:1,ja:1,fr:1,de:1,es:1,pt:1,it:1,ru:1,th:1,vi:1,id:1,ar:1,hi:1,tr:1};
 if(originalLang==="zh-tw"||originalLang==="zh-hk"||originalLang==="zh-hant")src="zh-TW";
 else if(!valid[src]){log("source language unsupported; original kept");finish();return;}
 var parsed=parse(raw);if(!parsed||!parsed.clips.length){log("unrecognized caption format");finish();return;}
 var key=fp(raw+"|"+src);
 try{var remembered=JSON.parse(get(CACHE)||"null");
  if(remembered&&remembered.key===key&&Date.now()-remembered.time<43200000&&typeof remembered.body==="string"){
   log("cache hit");finish(remembered.body);return;
  }
 }catch(e){}
 var now=(new Date()).toISOString().slice(0,10),quota;
 try{quota=JSON.parse(get(DAY)||"null");}catch(e){}
 if(!quota||quota.date!==now)quota={date:now,used:0};
 var available=Math.min(2600,4500-quota.used);
 if(available<1){log("local daily budget exhausted");finish();return;}
 var batches=[],bucket=[],usedBytes=0,reserved=0;
 parsed.clips.forEach(function(c){
  var b=size(c.text),chars=c.text.length;
  if(b>440||chars>available-reserved)return;
  if(bucket.length&&(usedBytes+b+1>440||bucket.length>=8)){
   batches.push(bucket);bucket=[];usedBytes=0;
  }
  bucket.push(c);usedBytes+=b+(bucket.length>1?1:0);reserved+=chars;
 });
 if(bucket.length)batches.push(bucket);
 if(batches.length>22)batches=batches.slice(0,22);
 if(!batches.length){log("no eligible text under quota");finish();return;}
 reserved=batches.reduce(function(n,a){return n+a.reduce(function(m,c){return m+c.text.length;},0);},0);
 quota.used+=reserved;put(DAY,JSON.stringify(quota)); // conservatively reserve before requests
 var index=0,active=0,completed=0,translated=0,failed=0,blocked=false;
 clock=setTimeout(function(){log("translation timeout, showing original");finish();},9500);
 log("requesting "+batches.length+" groups, language="+src+", chars="+reserved);
 function conclude(){
  if(ended)return;
  if(translated>0){
   var result=parsed.render();
   if(result.length<120000)put(CACHE,JSON.stringify({key:key,time:Date.now(),body:result}));
   log("translated groups="+translated+" failed="+failed+"; remaining original");
   finish(result);
  }else{log("no translated groups; original preserved");finish();}
 }
 function run(){
  if(ended)return;
  while(active<4&&index<batches.length&&!blocked){
   (function(batch){
    active++;
    var q=batch.map(function(c){return c.text;}).join("\n");
    var endpoint="https://api.mymemory.translated.net/get?q="+encodeURIComponent(q)+"&langpair="+encodeURIComponent(src+"|zh-CN");
    $task.fetch({url:endpoint,method:"GET"}).then(function(res){
     if(ended)return;
     var code=Number(res.statusCode||res.status||0),obj={};
     try{obj=JSON.parse(res.body||"{}");}catch(e){}
     var stat=Number(obj.responseStatus||0);
     if(code===429||code===403||stat===429||stat===403){blocked=true;failed++;return;}
     if(code!==200||stat!==200||!obj.responseData||typeof obj.responseData.translatedText!=="string"){failed++;return;}
     var tr=unescapeEntities(obj.responseData.translatedText),lines=batch.length===1?[tr]:tr.split(/\r?\n/);
     if(lines.length!==batch.length||lines.some(function(s){return !s.trim();})){failed++;return;}
     lines.forEach(function(line,i){batch[i].set(line.trim());});translated++;
    }).catch(function(e){failed++;log("request error; original retained");}).then(function(){
      if(ended)return;active--;completed++;
      if(blocked||completed===batches.length){conclude();return;}
      run();
    });
   })(batches[index++]);
  }
 }
 run();
}catch(e){log("script error; original retained: "+String(e).slice(0,90));finish();}
})();