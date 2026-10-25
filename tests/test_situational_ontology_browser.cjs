'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const browser=require('../docs/situational-ontology.js');

test('formal catalog has stable distinct identities and closed evidence claims',()=>{
  const catalog=require('../docs/catalog.json');
  const all=browser.flatten(catalog);
  assert.equal(all.length,196);
  assert.equal(new Set(all.map(x=>x.id)).size,196);
  assert.equal(browser.search(all,'','situations').length,70);
  assert.equal(browser.search(all,'','intents').length,104);
  assert.equal(browser.search(all,'','intent_families').length,8);
  assert.equal(browser.search(all,'','execution_conditions').length,7);
  assert.equal(browser.search(all,'','evaluation_dimensions').length,7);
  assert.deepEqual(catalog.situational_evaluations,[]);
  assert.equal(browser.search(all,'scope','intents').length>0,true);
});
test('homepage directly exposes both ontology collections and all mappings',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');
  assert.match(html,/href="\.\/situational-ontology\.html\?type=situations"/);
  assert.match(html,/href="\.\/situational-ontology\.html\?type=intents"/);
  assert.match(html,/href="\.\/rule-concepts\.html"/);
  assert.match(html,/70 situations/);
  assert.match(html,/104 intents/);
  assert.match(html,/199 rule mappings/);
});

test('ontology UI renders one collapsed detail per object without executing prompts',async()=>{
  const catalog=require('../docs/catalog.json');
  class Element {
    constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.value='all';
      this.hidden=false;this.textContent='';this.href='';this.className='';}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=nodes;}
    addEventListener(event,fn){this.listeners[event]=fn;}
  }
  const nodes=new Map();
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
  get('ontology-query').value='';
  const document={
    getElementById:get,
    createElement:tag=>new Element(tag),
    querySelector:()=>({content:'./catalog.json'})
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../docs/situational-ontology.js'),'utf8'),
    {document,fetch:async()=>({ok:true,json:async()=>catalog})});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(get('ontology-count').textContent,'196 of 196 formal objects');
  const entries=get('ontology-results').children;
  assert.equal(entries.length,196);
  assert.ok(entries.every(x=>x.children.some(y=>y.tag==='details')));
  assert.match(get('ontology-evaluation-count').textContent,/No real-world effectiveness results/);
  get('ontology-type').value='intent_families';
  get('ontology-type').listeners.change();
  assert.equal(get('ontology-results').children.length,8);
  const family=get('ontology-results').children[0];
  const link=family.children.find(c=>c.tag==='a');
  assert.equal(link.href,'./situational-prompts.html#prompt-SIT-0001');
  get('ontology-query').value='nonexistentobject';
  get('ontology-query').listeners.input();
  assert.equal(get('ontology-results').children.length,0);
  assert.equal(get('ontology-empty').hidden,false);
});

test('direct ontology links open the requested collection without loading unrelated results',async()=>{
  const catalog=require('../docs/catalog.json');
  const source=fs.readFileSync(path.join(__dirname,'../docs/situational-ontology.js'),'utf8');
  for(const [kind,expected] of [['situations',70],['intents',104]]){
    class Element {
      constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.value='';this.hidden=false;this.textContent='';}
      append(...nodes){this.children.push(...nodes);}
      replaceChildren(...nodes){this.children=nodes;}
      addEventListener(evt,cb){this.listeners[evt]=cb;}
    }
    const elements=new Map(),get=id=>{
      if(!elements.has(id))elements.set(id,new Element());
      return elements.get(id);
    };
    const document={getElementById:get,createElement:tag=>new Element(tag),
      querySelector:()=>({content:'./catalog.json'})};
    vm.runInNewContext(source,{document,URLSearchParams,window:{location:{search:'?type='+kind}},
      fetch:async()=>({ok:true,json:async()=>catalog})});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(get('ontology-type').value,kind);
    assert.equal(get('ontology-results').children.length,expected);
    assert.equal(get('ontology-count').textContent,expected+' of 196 formal objects');
  }
});
