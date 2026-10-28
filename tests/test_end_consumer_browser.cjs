'use strict';
/* Dependency-free real Chromium verification of immutable end-consumer V0,
   explicit selected exports, and strict owner-publication boundaries. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {spawn,spawnSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const DOCS=path.resolve(__dirname,'..','docs');
const allowed=new Set(['end-consumer-profiles.html','end-consumer-profiles.js',
  'end-consumer-profile-model.js','styles.css',
  'exports/project-stewardship-v0.json',
  'exports/project-stewardship-approved-trievium.json',
  'data/project-stewardship-v0-profile.json',
  'data/project-stewardship-published-versions.json',
  'data/project-stewardship-v1-analysis.json',
  'data/project-stewardship-meta-intent-approval.json',
  'end-consumer-profile-explorer-model.js','end-consumer-profile-explorer.js',
  'end-consumer-profile-explorer.css','catalog.json']);
const sha=text=>createHash('sha256').update(text).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function locateChrome(){
  if(process.env.NOMOS_CHROME_BIN)return process.env.NOMOS_CHROME_BIN;
  for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
    const r=spawnSync('which',[name],{encoding:'utf8'});
    if(r.status===0&&r.stdout.trim())return r.stdout.trim();
  }
  throw new Error('No headless Chromium or Chrome available');
}
async function until(action,{timeout=16000,label='Timed out'}={}){
  const end=Date.now()+timeout;
  while(Date.now()<end){
    const x=await action();if(x)return x;
    await sleep(100);
  }
  throw new Error(label);
}
const getJSON=url=>new Promise((resolve,reject)=>{
  http.get(url,{timeout:8000},res=>{
    let body='';res.on('data',chunk=>body+=chunk);
    res.on('end',()=>{try{resolve(JSON.parse(body));}catch(e){reject(e);}});
  }).on('error',reject);
});
function devtools(ws){
  let next=0;const pending=new Map();
  ws.addEventListener('message',e=>{
    let m;try{m=JSON.parse(e.data);}catch{return;}
    if(!m.id||!pending.has(m.id))return;
    const {resolve,reject,t}=pending.get(m.id);clearTimeout(t);pending.delete(m.id);
    m.error?reject(Error(m.error.message)):resolve(m.result);
  });
  return (method,params={})=>new Promise((resolve,reject)=>{
    const id=++next;
    const t=setTimeout(()=>{pending.delete(id);reject(Error('DevTools '+method+' timed out'));},14000);
    pending.set(id,{resolve,reject,t});
    ws.send(JSON.stringify({id,method,params}));
  });
}
test('real browser: V0 integrity, selected Trievium download, approved alternate and publication veto', {timeout:90000},async()=>{
  const chromeBin=locateChrome();
  const remote=process.env.NOMOS_SITE_URL||'';
  if(remote){
    const u=new URL(remote);
    assert.equal(u.protocol,'https:');
    assert.equal(u.hostname,'sguzman.github.io');
    assert.ok(u.pathname.startsWith('/nomos'));
  }
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-prompts-'));
  const downloads=path.join(dir,'downloads');fs.mkdirSync(downloads);
  const requests=[];let mode='original';
  const alternate='Synthetic approved test prompt: continue only while warranted.';
  const server=http.createServer((req,res)=>{
    const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\/+/, '');
    requests.push({method:req.method,name});
    if(req.method!=='GET'||!allowed.has(name)){res.writeHead(404);res.end();return;}
    let data=fs.readFileSync(path.join(DOCS,name));
    if(name==='data/project-stewardship-published-versions.json'&&mode!=='original'){
      const manifest=JSON.parse(data.toString('utf8'));
      // Test alternate is isolated from any genuine future approved variants.
      manifest.published_versions=[];
      manifest.selected_versions={};
      const profile=JSON.parse(fs.readFileSync(path.join(DOCS,'data/project-stewardship-v0-profile.json'),'utf8'));
      const slot=profile.slots[0];
      manifest.published_versions=[{
        prompt_id:slot.id,key:slot.key,label:slot.label,version:'1',
        publication_state:'approved_public_prompt_version',
        owner_approved:mode!=='unapproved',approval_reference:'synthetic-browser-test',
        text:alternate,sha256:mode==='tampered'?sha('different text'):sha(alternate)
      }];
      data=Buffer.from(JSON.stringify(manifest));
    }
    const mime=name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':
      name.endsWith('.css')?'text/css':'text/html';
    res.writeHead(200,{'Content-Type':mime+'; charset=utf-8','Cache-Control':'no-store'});
    res.end(data);
  });
  let chrome=null,ws=null;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    chrome=spawn(chromeBin,[
      '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
      '--no-first-run','--no-default-browser-check','--remote-allow-origins=*',
      '--remote-debugging-port=0','--user-data-dir='+dir,'about:blank'
    ],{stdio:'ignore'});
    const active=path.join(dir,'DevToolsActivePort');
    const port=await until(()=>{
      if(chrome.exitCode!==null)throw Error('Chromium exited unexpectedly');
      return fs.existsSync(active)?Number(fs.readFileSync(active,'utf8').split('\n')[0]):null;
    },{timeout:20000,label:'Chromium debugging endpoint unavailable'});
    const targets=await getJSON('http://127.0.0.1:'+port+'/json/list');
    const target=targets.find(x=>x.type==='page');
    assert.ok(target?.webSocketDebuggerUrl);
    ws=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{
      ws.addEventListener('open',resolve,{once:true});
      ws.addEventListener('error',reject,{once:true});
    });
    const send=devtools(ws);
    await send('Page.enable');await send('Runtime.enable');
    await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
    const evalJs=async expression=>{
      const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
      if(r.exceptionDetails)throw Error('Browser exception '+JSON.stringify(r.exceptionDetails));
      return r.result?.value;
    };
    const origin=remote?remote.replace(/\/+$/,''):'http://127.0.0.1:'+server.address().port;
    const navigate=async()=>send('Page.navigate',{url:origin+'/end-consumer-profiles.html?test='+mode});
    const ready=async()=>until(()=>evalJs("document.readyState==='complete' && document.querySelector('#download-selected-trievium')?.disabled===false"),{timeout:20000,label:'Version selector did not initialize'});
    await navigate();await ready();
    assert.equal(await evalJs("document.querySelectorAll('section[aria-label=\"Prompt-specific semantic reviews\"] details').length"),10);
    assert.equal(await evalJs("document.querySelectorAll('section[aria-label=\"Prompt-specific semantic reviews\"] select').length"),10);
    assert.equal(await evalJs("document.querySelector('#trievium-selection-status').textContent.includes('3 non-original selected')"),true);
    const published=JSON.parse(fs.readFileSync(path.join(DOCS,'data/project-stewardship-published-versions.json'),'utf8'));
    const approvedSlots=new Set(published.published_versions.map(v=>v.prompt_id)).size;
    assert.equal(await evalJs("document.querySelector('#trievium-selection-status').textContent.includes("+JSON.stringify(approvedSlots+' slots with approved alternatives')+")"),true);
    assert.equal(await evalJs("Boolean(globalThis.crypto?.subtle)"),true);
    await until(()=>evalJs("document.querySelectorAll('.profile-prompt-choice').length===10"),
      {timeout:20000,label:'Profile explorer did not display ten prompts'});
    assert.equal(await evalJs("document.querySelector('#profile-reader').textContent.includes('Atomic objectives and linked intents')"),true);
    assert.equal(await evalJs("document.querySelector('#profile-reader').textContent.includes('Owner-approved meta-intent')"),true);
    assert.equal(await evalJs("document.querySelector('#profile-reader').textContent.includes('NOM-0014')"),true);
    await evalJs("document.querySelector('[data-prompt-key=F]').click();true");
    assert.equal(await evalJs("document.querySelector('#profile-reader').textContent.includes('Fix issue')"),true);
    assert.equal(await evalJs("document.querySelector('#profile-selected h3').textContent.includes('approved prompt')"),true);
    assert.equal(await evalJs("document.querySelector('#profile-selected pre').textContent.includes('focused regression test')"),true);
    assert.equal(await evalJs("document.querySelector('#profile-original pre').textContent.includes('focused regression test')"),false);
    assert.equal(await evalJs("document.querySelector('#profile-reader').textContent.includes('regression')"),true);
    assert.equal(await evalJs("document.querySelector('#profile-reader').textContent.includes('Applicable rule candidates')"),true);
    assert.equal(await evalJs("document.querySelector('#profile-reader').textContent.includes('Execution conditions')"),true);
    assert.equal(await evalJs("document.querySelector('[data-prompt-key=F]').getAttribute('aria-current')"),'true');
    await evalJs("document.querySelector('[data-prompt-key=J]').click();true");
    assert.equal(await evalJs("document.querySelector('#profile-selected')===null"),true);

    async function clickAndRead(){
      // Each click is independent; Chrome may otherwise overwrite a reused name.
      for(const name of fs.readdirSync(downloads))if(name.endsWith('.json'))fs.rmSync(path.join(downloads,name));
      const prior=0;
      await evalJs("document.querySelector('#download-selected-trievium').click();true");
      const file=await until(()=>{
        const names=fs.readdirSync(downloads).filter(x=>x.endsWith('.json'));
        if(names.length<=prior)return null;
        const newest=names.map(name=>({name,mtime:fs.statSync(path.join(downloads,name)).mtimeMs})).sort((a,b)=>b.mtime-a.mtime)[0];
        return path.join(downloads,newest.name);
      },{timeout:12000,label:'No browser keyset download'});
      return JSON.parse(fs.readFileSync(file,'utf8'));
    }
    const originals=JSON.parse(fs.readFileSync(path.join(DOCS,'exports/project-stewardship-v0.json'),'utf8'));
    const selected=await clickAndRead();
    const approvedVersions=published.published_versions;
    const expected={version:1,entries:originals.entries.map(x=>{
      const alternate=approvedVersions.find(v=>v.key===x.key);
      return {label:x.label,text:alternate?alternate.text:x.text,key:x.key};
    })};
    assert.deepEqual(selected,expected);
    const approvedStatic=await evalJs("fetch('./exports/project-stewardship-approved-trievium.json').then(r=>r.json())");
    assert.deepEqual(approvedStatic,selected);
    assert.deepEqual(selected.entries.filter((x,i)=>x.text!==originals.entries[i].text).map(x=>x.key),['L','H','F']);
    // Against the deployed site we cannot inject a synthetic candidate.
    if(!remote){
      mode='approved';await navigate();await ready();
      assert.equal(await evalJs("document.querySelector('#trievium-selection-status').textContent.includes('1 slots with approved alternatives')"),true);
      assert.equal(await evalJs("document.querySelector('section[aria-label=\"Prompt-specific semantic reviews\"] select').options.length"),2);
      await evalJs("(()=>{const s=document.querySelector('section[aria-label=\"Prompt-specific semantic reviews\"] select');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
      assert.equal(await evalJs("document.querySelector('#trievium-selection-status').textContent.includes('1 non-original selected')"),true);
      assert.equal(await evalJs("(()=>{const first=document.querySelector('section[aria-label=\\\"Prompt-specific semantic reviews\\\"] details');const comparison=first.lastElementChild.querySelector('section');return comparison.hidden===false})()"),true);
      const changed=await clickAndRead();
      assert.equal(changed.entries[0].text,alternate);
      assert.deepEqual(changed.entries.slice(1),originals.entries.slice(1).map(x=>({label:x.label,text:x.text,key:x.key})));
      await evalJs("(()=>{const s=document.querySelector('section[aria-label=\"Prompt-specific semantic reviews\"] select');s.value='0';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
      assert.equal(await evalJs("document.querySelector('#trievium-selection-status').textContent.includes('0 non-original selected')"),true);
      const reverted=await clickAndRead();
      assert.equal(reverted.entries[0].text,originals.entries[0].text);
      mode='unapproved';await navigate();
      await until(()=>evalJs("document.querySelector('#trievium-version-export [role=alert]')!==null"),{timeout:20000,label:'Unapproved publication did not fail closed'});
      assert.equal(await evalJs("document.querySelector('#download-selected-trievium').disabled"),true);
      mode='tampered';await navigate();
      await until(()=>evalJs("document.querySelector('#trievium-version-export [role=alert]')?.textContent.includes('checksum mismatch')"),
        {timeout:20000,label:'Tampered approved-version text did not fail closed'});
      assert.equal(await evalJs("document.querySelector('#download-selected-trievium').disabled"),true);
    }
    assert.equal(requests.some(x=>x.method!=='GET'),false,'Unexpected repository mutation request');
  }finally{
    if(ws)ws.close();
    if(chrome&&chrome.exitCode===null){
      const exit=new Promise(resolve=>chrome.once('exit',resolve));
      chrome.kill('SIGTERM');await Promise.race([exit,sleep(1800)]);
      if(chrome.exitCode===null)chrome.kill('SIGKILL');
    }
    await new Promise(resolve=>server.close(resolve));
    fs.rmSync(dir,{recursive:true,force:true,maxRetries:8,retryDelay:125});
  }
});
