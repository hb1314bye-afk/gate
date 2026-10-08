/* Quantumult X / YouTube subtitles -> Azure Translator -> zh-Hans.
 * Source code public; API key is NEVER in this file.
 * Safe fallback: on any error, preserve the entire original subtitle response.
 */
(function () {
  'use strict';
  var TAG='[YT-ZH-Azure]';
  var KEY='ytzh_azure_api_key_v1', REGION='ytzh_azure_region_v1';
  var PAUSE='ytzh_azure_pause_until_v1', CACHE='ytzh_azure_subtitle_cache_v1';
  var finished=false, timeoutId=null;
  var original=($response && typeof $response.body==='string')?$response.body:'';
  function done(text) {
    if(finished)return; finished=true;
    if(timeoutId!==null)clearTimeout(timeoutId);
    $done(typeof text==='string'?{body:text}:{});
  }
  function log(s){console.log(TAG+' '+s);}
  function pref(k){try{return $prefs.valueForKey(k)||'';}catch(e){return '';}}
  function store(v,k){try{$prefs.setValueForKey(String(v),k);}catch(e){}}
  function qp(url,k){
    var m=new RegExp('[?&]'+k+'=([^&#]*)','i').exec(url);
    if(!m)return '';
    try{return decodeURIComponent(m[1].replace(/\+/g,' '));}catch(e){return m[1];}
  }
  function hash(s){
    var h=2166136261;
    for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(16)+':'+s.length;
  }
  function xmlDecode(s){
    return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,function(raw,p){
      var named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
      p=p.toLowerCase();
      if(Object.prototype.hasOwnProperty.call(named,p))return named[p];
      var code=p.slice(1,2)==='x'?parseInt(p.slice(2),16):parseInt(p.slice(1),10);
      try{return code>0&&code<=0x10ffff?String.fromCodePoint(code):raw;}catch(e){return raw;}
    });
  }
  function xmlEncode(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  }
  function subtitleParser(body) {
    var cues=[],render,parsed;
    if(/^\s*\{/.test(body)) {
      try{parsed=JSON.parse(body);}catch(e){return null;}
      if(!parsed||!Array.isArray(parsed.events))return null;
      parsed.events.forEach(function(event){
        if(!event||!Array.isArray(event.segs))return;
        var segs=event.segs.filter(function(s){return s&&typeof s.utf8==='string';});
        if(!segs.length)return;
        var source=segs.map(function(s){return s.utf8;}).join('');
        if(!source.trim())return;
        cues.push({source:source,apply:function(text){
          segs[0].utf8=text;
          for(var j=1;j<segs.length;j++)segs[j].utf8='';
        }});
      });
      render=function(){return JSON.stringify(parsed);};
    } else if(/^\s*(?:<\?xml\b|<(?:transcript|timedtext)\b)/i.test(body)) {
      var re=/<(p|text)\b[^>]*>([\s\S]*?)<\/\1>/gi,found,matches=[];
      while((found=re.exec(body))!==null){
        var source=xmlDecode(found[2].replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,''));
        if(!source.trim())continue;
        (function(m,s){
          var item={start:m.index,end:m.index+m[0].length,
            opening:m[0].slice(0,m[0].indexOf('>')+1),tag:m[1],translation:null};
          matches.push(item);
          cues.push({source:s,apply:function(t){item.translation=t;}});
        })(found,source);
      }
      render=function(){
        var out='',pos=0;
        matches.forEach(function(m){
          out+=body.slice(pos,m.start)+m.opening+xmlEncode(m.translation)+'</'+m.tag+'>';
          pos=m.end;
        });
        return out+body.slice(pos);
      };
    } else if(/^\s*WEBVTT\b/.test(body)) {
      var sections=body.split(/(\r?\n(?:\r?\n)+)/),mapping=[];
      for(var i=0;i<sections.length;i+=2){
        var part=sections[i];
        if(!/-->/.test(part)||/^\s*(NOTE|STYLE|REGION)\b/.test(part))continue;
        var lines=part.split(/\r?\n/),point=-1;
        for(var j=0;j<lines.length;j++)if(lines[j].indexOf('-->')>=0){point=j;break;}
        if(point<0||point+1>=lines.length)continue;
        (function(index,lines_,at){
          var source=lines_.slice(at+1).join('\n').replace(/<[^>]*>/g,'');
          if(!source.trim())return;
          var item={index:index,header:lines_.slice(0,at+1).join('\n'),translated:null};
          mapping.push(item);
          cues.push({source:source,apply:function(t){item.translated=t;}});
        })(i,lines,point);
      }
      render=function(){
        mapping.forEach(function(m){sections[m.index]=m.header+'\n'+m.translated;});
        return sections.join('');
      };
    } else return null;
    return {cues:cues,render:render};
  }
  try {
    var url=($request&&$request.url)||'';
    if(!/^https:\/\/www\.youtube\.com\/api\/timedtext\?/i.test(url)||!original){done();return;}
    var lang=qp(url,'lang'),translated=qp(url,'tlang');
    if(/^zh(?:-hans|-cn|-sg|$)/i.test(lang)||/^zh(?:-hans|-cn|-sg|$)/i.test(translated)){
      log('already simplified Chinese; untouched');done();return;
    }
    var secret=pref(KEY).trim(),region=pref(REGION).trim().toLowerCase();
    if(!secret){log('Azure key not configured; original kept');done();return;}
    if(region&&region!=='global'&&!/^[a-z0-9-]{2,40}$/.test(region)){
      log('invalid region; original kept');done();return;
    }
    if(Date.now()<Number(pref(PAUSE)||0)){log('Azure cooldown; original kept');done();return;}
    var parser=subtitleParser(original);
    if(!parser){log('unsupported subtitles; original kept');done();return;}
    var cues=parser.cues,chars=cues.reduce(function(sum,c){return sum+c.source.length;},0);
    if(!cues.length||cues.length>700||chars>45000){
      log('no/too many cues: '+cues.length+' ('+chars+' chars); original kept');done();return;
    }
    var cacheID=hash(original+'\n'+url.replace(/([?&])expire=[^&]*/g,'$1')+'\n'+secret.slice(-6));
    try{
      var cached=JSON.parse(pref(CACHE)||'null');
      if(cached&&cached.id===cacheID&&Date.now()-cached.when<12*3600000&&typeof cached.body==='string'){
        log('cache hit');done(cached.body);return;
      }
    }catch(e){}
    var batches=[],batch=[],length=0;
    cues.forEach(function(c){
      if(batch.length>=75||length+c.source.length>16000){batches.push(batch);batch=[];length=0;}
      batch.push(c);length+=c.source.length;
    });
    if(batch.length)batches.push(batch);
    var headers={'Content-Type':'application/json; charset=UTF-8',
      'Ocp-Apim-Subscription-Key':secret};
    if(region&&region!=='global')headers['Ocp-Apim-Subscription-Region']=region;
    timeoutId=setTimeout(function(){log('timeout; original kept');done();},12500);
    log('translating '+cues.length+' cues via '+batches.length+' Azure request(s)');
    var endpoint='https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=zh-Hans';
    var tasks=batches.map(function(group){
      return $task.fetch({url:endpoint,method:'POST',headers:headers,
        body:JSON.stringify(group.map(function(c){return {Text:c.source};}))}).then(function(r){
        var status=Number(r.statusCode||r.status||0);
        if(status!==200){
          if(status===429||status===403)store(Date.now()+600000,PAUSE);
          throw new Error('Azure HTTP '+status);
        }
        var items=JSON.parse(r.body);
        if(!Array.isArray(items)||items.length!==group.length)throw new Error('Azure response incomplete');
        return items.map(function(item){
          var result=item&&item.translations&&item.translations[0]&&item.translations[0].text;
          if(typeof result!=='string')throw new Error('missing translation');
          return result;
        });
      });
    });
    Promise.all(tasks).then(function(results){
      if(finished)return;
      var translated=[].concat.apply([],results);
      if(translated.length!==cues.length)throw new Error('translated count mismatch');
      translated.forEach(function(t,i){cues[i].apply(t);});
      var output=parser.render();
      try{
        if(output.length<150000)store(JSON.stringify({id:cacheID,when:Date.now(),body:output}),CACHE);
      }catch(e){}
      log('success: '+translated.length+' cues');done(output);
    }).catch(function(e){log(String(e.message||e)+'; original kept');done();});
  }catch(e){log('unexpected: '+String(e.message||e)+'; original kept');done();}
})();