'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const browser=require('../docs/rule-concepts.js');
const catalog=require('../docs/catalog.json');

test('all rules have coherent situation and intent links',()=>{
  const list=browser.linkedRules(catalog),lookup=browser.indexes(catalog);
  assert.equal(list.length,199);
  assert.equal(lookup.situations.size,70);
  assert.equal(lookup.intents.size,104);
  assert.equal(list.filter(x=>x.rule.status==='draft').length,1);
  assert.equal(browser.search(list,{status:'draft'}).length,1);
  assert.equal(browser.search(list,{situation:'SITU-0045'}).some(x=>x.rule.id==='NOM-0137'),true);
  assert.equal(browser.search(list,{intent:'INTENT-0063'}).some(x=>x.rule.id==='NOM-0137'),true);
  assert.equal(browser.search(list,{text:'NOM-0114'}).length,1);
  assert.equal(browser.search(list,{text:'comparative_progress_round'},lookup).some(x=>x.rule.id==='NOM-0137'),true);
  assert.equal(browser.search(list,{text:'evidence_based_interval_progress'},lookup).some(x=>x.rule.id==='NOM-0137'),true);
  assert.equal(lookup.intents.get('INTENT-0063').atomicity,'single_intent_candidate');
});

test('read-only UI exposes full source context and never applies a rule',async()=>{
  class Element{
    constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.value='';
      this.textContent='';this.hidden=false;this.href='';this.rel='';this.title='';}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=nodes;}
    addEventListener(type,fn){this.listeners[type]=fn;}
  }
  const elements=new Map(),get=id=>{
    if(!elements.has(id))elements.set(id,new Element());
    return elements.get(id);
  };
  const doc={
    getElementById:get,createElement:tag=>new Element(tag),
    querySelector:()=>({content:'./catalog.json'})
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../docs/rule-concepts.js'),'utf8'),
    {document:doc,fetch:async()=>({ok:true,json:async()=>catalog})});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(get('study-count').textContent,'199 of 199 analyzed rules');
  assert.equal(get('study-results').children.length,199);
  const first=get('study-results').children[0];
  assert.ok(first.children.some(n=>n.tag==='details'));
  const details=first.children.find(n=>n.tag==='details');
  assert.ok(details.children.some(n=>n.tag==='a'&&n.href.includes('/ontology/rule-links/RLINK-0001.json')));
  const labels=first.children.find(n=>n.tag==='div');
  assert.ok(labels.children[0].children[1].children[0].children.some(n=>n.tag==='small'&&n.textContent.includes('context')));
  assert.ok(labels.children[1].children[1].children[0].children.some(n=>n.tag==='small'&&n.textContent.includes('candidate')));
  get('study-situation').value='SITU-0045';
  get('study-situation').listeners.change();
  assert.equal(get('study-results').children.some(x=>x.children.some(c=>c.textContent?.includes('NOM-0137'))),true);
  get('study-status').value='draft';
  get('study-status').listeners.change();
  assert.equal(get('study-results').children.length,0);
  assert.equal(get('study-empty').hidden,false);
});
