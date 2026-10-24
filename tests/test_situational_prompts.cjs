'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const ns=require('../docs/situational-prompts.js');
const sample={id:'SIT-0001',summary:'An example of a public-safe trigger',
  status:'draft',text:'Sample instruction',situation:{code:'normal_continuation',trigger:'When the operator requests another pass',purpose:'Advance a selected task'},
  intent:{operation:'continue',outcome:'Advance selected work'},
  applicability:{appropriate_when:['Explicitly selected work'],not_appropriate_when:['Diagnostic-only requests'],preconditions:[]},
  execution:{mode:'sustained_execution',objective:'Perform the approved work',handoff:'after_available_work',progress_evidence:true},
  failure_modes:{guards_against:['Premature handoff'],tradeoffs:['May require extended execution']},
  interaction:{invocation:'explicit_only',target:'chatgpt'},
  governance:{review_status:'pending'}};
test('empty registry is valid and shows no results',()=>assert.deepEqual(ns.search([],''),[]));
test('display labels are derived from situation and execution metadata',()=>{
  assert.equal(ns.displayLabel(sample),'Normal Continuation · Sustained Execution');
  assert.equal(ns.displayLabel({...sample,title:'Do not use me'}),'Normal Continuation · Sustained Execution');
});
test('eight published prompts have metadata identities and are copyable',()=>{
  for(let i=1;i<=8;i++){
    const p=require('../situational-prompts/SIT-'+String(i).padStart(4,'0')+'.json');
    assert.equal(p.status,'published');
    assert.equal(p.governance.review_status,'approved');
    assert.equal(ns.copyAllowed(p),true);
    assert.equal(Object.hasOwn(p,'title'),false);
    assert.equal(Object.hasOwn(p,'source_label'),false);
    assert.ok(p.intent.outcome && p.applicability.appropriate_when.length);
  }
  const reinforced=require('../situational-prompts/SIT-0006.json');
  assert.equal(reinforced.execution.mode,'reinforcement_only');
  assert.equal(reinforced.execution.handoff,'no_execution_requested');
});
test('search by trigger, exclusion, hazard, and mode',()=>{
  assert.equal(ns.search([sample],'operator').length,1);
  assert.equal(ns.search([sample],'Diagnostic-only').length,1);
  assert.equal(ns.search([sample],'premature').length,1);
  assert.equal(ns.search([sample],'irrelevant').length,0);
  assert.equal(ns.search([sample],'','diagnosis_only').length,0);
});
test('copy is unavailable without both publication and approval',()=>{
  assert.equal(ns.copyAllowed(sample),false);
  assert.equal(ns.copyAllowed({...sample,status:'published'}),false);
  assert.equal(ns.copyAllowed({...sample,status:'published',governance:{review_status:'approved'}}),true);
});
test('public output is standalone and never modifies rule composition',()=>{
  const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'../docs/situational-prompts.html'),'utf8');
  assert.match(html,/id="situational-list"/);
  assert.match(html,/situational-prompts.js/);
  assert.doesNotMatch(html,/id="selection-list"/);
});

test('real browser renders eight standard entries with working explicit copy',async()=>{
  const fs=require('node:fs');
  const vm=require('node:vm');
  const path=require('node:path');
  const catalog=require('../docs/catalog.json');
  class Element {
    constructor(tag='div'){
      this.tag=tag;this.children=[];this.listeners={};this.value='all';
      this.disabled=false;this.hidden=false;this.open=false;this.textContent='';this.className='';this.attrs={};
    }
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=nodes;}
    addEventListener(type,fn){this.listeners[type]=fn;}
    setAttribute(name,value){this.attrs[name]=value;}
    hasAttribute(name){return Object.hasOwn(this.attrs,name);}
  }
  const nodes=new Map();
  const get=id=>{
    if(!nodes.has(id))nodes.set(id,new Element());
    return nodes.get(id);
  };
  get('situational-search').value='';
  const document={
    getElementById:get,
    createElement:tag=>new Element(tag),
    querySelector:()=>({content:'./catalog.json'})
  };
  let copyCalls=0;
  const navigator={clipboard:{writeText:async()=>{copyCalls++;}}};
  const context={document,navigator,fetch:async()=>({ok:true,json:async()=>catalog})};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../docs/situational-prompts.js'),'utf8'),context);
  // The VM's async fetch chain resolves on the next event-loop turn.
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(get('situational-count').textContent,'8 of 8 situational prompts');
  const cards=get('situational-list').children;
  assert.equal(cards.length,8);
  // The compact cards reveal only identity, summary, tags, copy and a
  // closed native disclosure. Metadata and prompt body are nested inside it.
  assert.ok(cards.every(c=>c.children.some(n=>n.tag==='button'&&!n.disabled)));
  for(const card of cards){
    const metadata=card.children.find(n=>n.tag==='details');
    assert.ok(metadata,'each card offers a details disclosure');
    assert.equal(metadata.open,false,'metadata must start collapsed');
    assert.equal(metadata.attrs.name,'situational-prompt-metadata');
    assert.ok(!card.children.some(n=>n.tag==='dl'),'no expanded metadata in card root');
    assert.equal(metadata.children[0].tag,'summary');
    assert.equal(metadata.children[0].textContent,'Show details');
    assert.ok(metadata.children.some(n=>n.tag==='dl'));
    assert.ok(metadata.children.some(n=>n.tag==='details'));
  }
  const chosen=cards[1].children.find(n=>n.tag==='details');
  chosen.open=true;
  chosen.listeners.toggle();
  assert.equal(chosen.children[0].textContent,'Hide details');
  chosen.open=false;
  chosen.listeners.toggle();
  assert.equal(chosen.children[0].textContent,'Show details');
  const firstCopy=cards[0].children.find(n=>n.tag==='button');
  await firstCopy.listeners.click();
  assert.equal(copyCalls,1);
  assert.match(get('situational-notice').textContent,/Copied SIT-0001/);
  assert.ok(cards.every(c=>c.children.some(n=>n.tag==='h3'&&!/ack work|broke what/i.test(n.textContent))));
  assert.equal(copyCalls,1);
  get('situational-mode').value='reinforcement_only';
  get('situational-mode').listeners.change();
  assert.equal(get('situational-list').children.length,2);
  get('situational-search').value='scope_refocus';
  get('situational-search').listeners.input();
  assert.equal(get('situational-list').children.length,1);
  get('situational-status').value='reviewed';
  get('situational-status').listeners.change();
  assert.equal(get('situational-list').children.length,0);
  assert.equal(get('situational-empty').hidden,false);
  assert.equal(copyCalls,1);
});
