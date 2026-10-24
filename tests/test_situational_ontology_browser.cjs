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
  assert.equal(all.length,49);
  assert.equal(new Set(all.map(x=>x.id)).size,49);
  assert.equal(browser.search(all,'','situations').length,8);
  assert.equal(browser.search(all,'','intents').length,19);
  assert.equal(browser.search(all,'','intent_families').length,8);
  assert.equal(browser.search(all,'','execution_conditions').length,7);
  assert.equal(browser.search(all,'','evaluation_dimensions').length,7);
  assert.deepEqual(catalog.situational_evaluations,[]);
  assert.equal(browser.search(all,'scope','intents').length>0,true);
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
  assert.equal(get('ontology-count').textContent,'49 of 49 formal objects');
  const entries=get('ontology-results').children;
  assert.equal(entries.length,49);
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
