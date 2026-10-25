'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const browser=require('../docs/profile-companions.js');
const catalog=require('../docs/catalog.json');
test('companion browser covers 12 sources, keeping intent and situation provenance',()=>{
 const data=browser.index(catalog);
 assert.equal(data.profiles.size,12);assert.equal(data.companions.size,24);
 for(const p of catalog.profiles){
  for(const type of ['situations','intents']){
   const item=browser.results(data,p.id,type);
   assert.ok(item.members.length>0);
   assert.ok(item.members.every(m=>m.via_rules.every(r=>p.selected_rule_ids.includes(r.id))));
   assert.ok(item.members.every(m=>data[type].has(m.id)));
  }
 }
 assert.equal(browser.results(data,'PROFILE-0001','situations').members.length,30);
 assert.equal(browser.results(data,'PROFILE-0001','intents').members.length,45);
 assert.ok(browser.results(data,'PROFILE-0001','intents','atomic').members.length>0);
});
test('browser rejects profile review drift without interpreting it as owner approval',()=>{
 const altered={...catalog,profile_companions:catalog.profile_companions.map(x=>
  x.source_profile.id==='PROFILE-0001'?{...x,source_profile:{...x.source_profile,selection_confirmed:true}}:x)};
 assert.throws(()=>browser.index(altered),/Stale source profile/);
});
test('profile cards link to companions and viewer supports direct source selection',async()=>{
 assert.match(fs.readFileSync(path.join(__dirname,'../docs/app.js'),'utf8'),/profile-companions\.html\?profile=/);
 class E {
  constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.value='';this.textContent='';this.hidden=false;this.href='';}
  append(...xs){this.children.push(...xs);if(this.tag==='select'&&!this.value&&xs.length)this.value=xs[0].value;}
  replaceChildren(...xs){this.children=xs;}
  addEventListener(t,f){this.listeners[t]=f;}
 }
 const lookup=new Map(),get=id=>{if(!lookup.has(id))lookup.set(id,new E());return lookup.get(id);};
 const document={createElement:tag=>new E(tag),getElementById:get,querySelector:()=>({content:'./catalog.json'})};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../docs/profile-companions.js'),'utf8'),{
  document,URLSearchParams,encodeURIComponent,
  window:{location:{search:'?profile=PROFILE-0001&type=intents'}},
  fetch:async()=>({ok:true,json:async()=>catalog})
 });
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(get('companion-profile').value,'PROFILE-0001');
 assert.equal(get('companion-type').value,'intents');
 assert.equal(get('companion-results').children.length,45);
 assert.match(get('companion-source').textContent,/Provisional source rule selection/);
 get('companion-profile').value='PROFILE-0003';get('companion-profile').listeners.change();
 assert.match(get('companion-source').textContent,/Provisional source rule selection/);
});
