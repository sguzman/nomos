'use strict';
/* Dependency-free, genuine Chromium/Chrome DevTools browser smoke test.
   No npm, no network except an ephemeral localhost server, no user data. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {spawn,spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..','docs');
const assetNames=new Set(['rule-builder.html','rule-builder.css','rule-builder.js',
  'builder-logic.js','reasoning.js','catalog.json']);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function locateBrowser(){
  if(process.env.NOMOS_CHROME_BIN)return process.env.NOMOS_CHROME_BIN;
  for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
    const result=spawnSync('which',[name],{encoding:'utf8'});
    if(result.status===0 && result.stdout.trim())return result.stdout.trim();
  }
  throw new Error('No Chromium or Chrome found; browser QA cannot be claimed');
}
async function waitUntil(fn,{timeout=12000,message='Timed out'}={}){
  const end=Date.now()+timeout;
  while(Date.now()<end){
    const result=await fn();
    if(result)return result;
    await sleep(90);
  }
  throw new Error(message);
}
function requestJSON(url){
  return new Promise((resolve,reject)=>{
    http.get(url,{timeout:8000},res=>{
      let data='';
      res.on('data',buf=>data+=buf);
      res.on('end',()=>{try{resolve(JSON.parse(data));}catch(e){reject(e);}});
    }).on('error',reject);
  });
}
function connect(wsUrl){
  return new Promise((resolve,reject)=>{
    const ws=new WebSocket(wsUrl);
    ws.addEventListener('open',()=>resolve(ws),{once:true});
    ws.addEventListener('error',()=>reject(new Error('Cannot connect to Chrome DevTools')),{once:true});
  });
}
function protocol(ws){
  let seq=0;const pending=new Map();
  ws.addEventListener('message',event=>{
    let message;try{message=JSON.parse(event.data);}catch(_){return;}
    if(!message.id || !pending.has(message.id))return;
    const {resolve,reject,timeout}=pending.get(message.id);
    clearTimeout(timeout);pending.delete(message.id);
    if(message.error)reject(new Error(message.error.message));
    else resolve(message.result);
  });
  return (method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;
    const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('DevTools timeout: '+method));},15000);
    pending.set(id,{resolve,reject,timeout});
    ws.send(JSON.stringify({id,method,params}));
  });
}
test('real headless browser: guided Rust interview, source-backed veto, keyboard navigation and mobile layout', {timeout:90000},async()=>{
  const browser=locateBrowser();
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-chrome-'));
  const downloads=path.join(dir,'downloads');
  fs.mkdirSync(downloads,{recursive:true});
  const requests=[];
  let failCatalogOnce=false;
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');
    const name=decodeURIComponent(url.pathname).replace(/^\/+/,'');
    requests.push({method:req.method,name});
    if(req.method!=='GET'||!assetNames.has(name)){
      res.writeHead(404);res.end();return;
    }
    if(name==='catalog.json' && failCatalogOnce){
      failCatalogOnce=false;res.writeHead(503);res.end('Temporary unavailable');return;
    }
    const mime=name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':
      name.endsWith('.css')?'text/css':'text/html';
    res.writeHead(200,{'Content-Type':mime+'; charset=utf-8','Cache-Control':'no-store'});
    res.end(fs.readFileSync(path.join(ROOT,name)));
  });
  let chrome=null,ws=null;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    chrome=spawn(browser,[
      '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
      '--no-first-run','--no-default-browser-check','--remote-allow-origins=*',
      '--remote-debugging-port=0','--user-data-dir='+dir,'about:blank'
    ],{stdio:'ignore'});
    const debugFile=path.join(dir,'DevToolsActivePort');
    const port=await waitUntil(()=>{
      if(chrome.exitCode!==null)throw new Error('Chrome exited before DevTools was ready');
      if(!fs.existsSync(debugFile))return null;
      return Number(fs.readFileSync(debugFile,'utf8').split('\n')[0]);
    },{timeout:20000,message:'Chrome did not open a DevTools port'});
    const targets=await requestJSON('http://127.0.0.1:'+port+'/json/list');
    const page=targets.find(x=>x.type==='page');
    assert.ok(page?.webSocketDebuggerUrl,'Missing browser page target');
    ws=await connect(page.webSocketDebuggerUrl);
    const send=protocol(ws);
    await send('Page.enable');await send('Runtime.enable');
    await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
    const evaluate=async(source)=>{
      const r=await send('Runtime.evaluate',{expression:source,returnByValue:true,awaitPromise:true});
      if(r.exceptionDetails)throw new Error('Browser exception: '+r.exceptionDetails.text);
      return r.result?.value;
    };
    const origin='http://127.0.0.1:'+server.address().port;
    await send('Page.navigate',{url:origin+'/rule-builder.html'});
    await waitUntil(()=>evaluate("document.readyState==='complete' && document.querySelector('#builder-loading')?.hidden===true"),
      {timeout:20000,message:'Builder did not initialize in the real browser'});
    assert.equal(await evaluate("document.querySelector('#builder-controls').hidden"),false);
    assert.equal(await evaluate("document.querySelector('#builder-body').textContent.includes('What kind of project')"),true);
    await evaluate("(()=>{const s=document.querySelector('select');s.value='PROFILE-0004';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
    assert.equal(await evaluate("document.querySelector('#builder-body').textContent.includes('DRAFT')"),true);
    await evaluate("document.querySelector('#builder-next').click();true");
    const questionCount=await evaluate("Number(document.querySelector('#builder-progress').max)-2");
    assert.ok(questionCount>=5 && questionCount<=12,'Question routing diverged');
    let sawGui=false;
    for(let i=0;i<questionCount;i++){
      const questionText=await evaluate("document.querySelector('#builder-body h2').textContent");
      const selected=/graphical interface/i.test(questionText)?'no':'unknown';
      if(selected==='no')sawGui=true;
      await evaluate("(()=>{const v="+JSON.stringify(selected)+";const r=[...document.querySelectorAll('input[name=\"builder-answer\"]')].find(x=>x.value===v);if(!r)throw Error('Missing answer');r.click();document.querySelector('#builder-next').click();return true})()");
    }
    assert.equal(sawGui,true,'Rust GUI question was skipped unexpectedly');
    assert.equal(await evaluate("document.querySelector('#builder-body h2').textContent"),'Review your proposed rules');
    assert.equal(await evaluate("Boolean([...document.querySelectorAll('input[type=\"checkbox\"]')].find(x=>x.value==='NOM-0234'))"),true);
    assert.equal(await evaluate("document.querySelector('#builder-body').textContent.includes('No profile is finalized')"),true);
    assert.equal(await evaluate("Boolean(document.querySelector('.builder-download'))"),true);
    // Exercise the actual browser Blob download and inspect its authority flags.
    const downloads=path.join(dir,'downloads');
    fs.mkdirSync(downloads,{recursive:true});
    try{
      await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads,eventsEnabled:true});
    }catch(_){
      await send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
    }
    await evaluate("(()=>{const veto=[...document.querySelectorAll('input[type=\\\"checkbox\\\"]')].find(x=>x.value==='NOM-0234');if(!veto)throw Error('Missing vetted GUI proposal');veto.click();document.querySelector('.builder-download').click();return true})()");
    const download=path.join(downloads,'nomos-builder-draft.json');
    await waitUntil(()=>fs.existsSync(download),{timeout:10000,message:'Browser draft download did not complete'});
    const draft=JSON.parse(fs.readFileSync(download,'utf8'));
    assert.equal(draft.status,'unapproved');
    assert.equal(draft.source_profile.status,'draft');
    assert.equal(draft.projection_approved,false);
    assert.equal(draft.export_authorized,false);
    assert.ok(draft.proposed_veto_rule_ids.includes('NOM-0234'));
    // Download unapproved browser draft is inert; it is not an AGENTS.md package.

    await evaluate("(()=>{const box=[...document.querySelectorAll('input[type=checkbox]')].find(x=>x.value==='NOM-0234');box.click();document.querySelector('.builder-download').click();return true})()");
    const saved=path.join(downloads,'nomos-builder-draft.json');
    await waitUntil(()=>fs.existsSync(saved),{timeout:10000,message:'Builder did not download its JSON draft'});
    const exported=JSON.parse(fs.readFileSync(saved,'utf8'));
    assert.equal(exported.kind,'nomos_builder_draft');
    assert.equal(exported.status,'unapproved');
    assert.equal(exported.explicit_selection_confirmed,false);
    assert.equal(exported.projection_approved,false);
    assert.equal(exported.export_authorized,false);
    assert.ok(exported.proposed_veto_rule_ids.includes('NOM-0234'));
    assert.ok(exported.proposed_rule_ids.includes('NOM-0234'));
    const review=await evaluate("document.querySelector('#builder-body').textContent");
    assert.ok(review.includes('NOM-0234') && review.includes('excluded'));
    await evaluate("document.querySelector('#builder-back').focus();true");
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',
      windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
    await send('Input.dispatchKeyEvent',{type:'char',text:'\r',unmodifiedText:'\r',key:'Enter',
      code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',
      windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
    await waitUntil(()=>evaluate("document.querySelector('#builder-body h2').textContent!=='Review your proposed rules'"),
      {message:'Keyboard Back did not work'});
    assert.equal(await evaluate("Boolean(document.querySelector('input[name=\\\"builder-answer\\\"]:checked'))"),true,
      'Returning to a question must preserve the selected answer');
    await evaluate("document.querySelector('#builder-next').click();true");
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await sleep(100);
    const width=await evaluate("({scroll:document.documentElement.scrollWidth, viewport:document.documentElement.clientWidth})");
    assert.ok(width.scroll<=width.viewport+2,'Narrow screen overflow: '+JSON.stringify(width));
    assert.equal(requests.some(x=>x.method!=='GET'),false,'Unexpected network write');
    assert.equal(await evaluate("document.querySelector('input[type=\"checkbox\"]').getAttribute('aria-label')"),null);
    // Label wraps input, so the accessible name is inherited from its visible text.
    assert.equal(await evaluate("document.querySelector('input[type=\"checkbox\"]').closest('label')?.textContent.includes('NOM-0234')"),true);
    assert.equal(await evaluate("Boolean(document.querySelector('.skip-link'))"),true);
    assert.equal(await evaluate("document.querySelector('progress').getAttribute('aria-label')"),'Interview progress');
    // Simulate transient catalog failure, then retry via a fresh page load.
    failCatalogOnce=true;
    await send('Page.navigate',{url:origin+'/rule-builder.html'});
    await waitUntil(()=>evaluate("document.querySelector('#builder-loading')?.textContent.includes('Unable to load the public Nomos catalog')"),
      {timeout:15000,message:'Catalog failure was not reported'});
    assert.equal(await evaluate("document.querySelector('#builder-controls').hidden"),true,
      'Failure should not expose stale approval or navigation controls');
    await send('Page.navigate',{url:origin+'/rule-builder.html'});
    await waitUntil(()=>evaluate("document.querySelector('#builder-loading')?.hidden===true"),
      {timeout:15000,message:'Builder did not recover after retry'});
    assert.equal(await evaluate("document.querySelector('#builder-controls').hidden"),false);
    assert.equal(await evaluate("document.querySelector('#builder-body').textContent.includes('What kind of project')"),true);
  }finally{
    if(ws)ws.close();
    if(chrome && chrome.exitCode===null)chrome.kill('SIGTERM');
    await new Promise(resolve=>server.close(resolve));
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
