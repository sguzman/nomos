'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Node {
  constructor(tag='div', id='') {
    this.tag=tag;this.id=id;this.children=[];this.listeners={};
    this.className='';this.textContent='';this.value='';
    this.disabled=false;this.dataset={};this.attributes={};this.style={setProperty(){}};
    this.classList={toggle(){},add(){},remove(){}};
    this.options=[];this.selectedIndex=0;this.scrolled=0;
  }
  append(...nodes){this.children.push(...nodes)}
  replaceChildren(...nodes){this.children=nodes}
  setAttribute(name,value){this.attributes[name]=String(value)}
  addEventListener(name,fn){this.listeners[name]=fn}
  scrollIntoView(){this.scrolled++}
  focus(){}
  select(){}
}
const root=path.resolve(__dirname,'..');
const catalog=require('../docs/catalog.json');
const groups=require('../docs/groups.js');
const color=require('../docs/rule-colors.js');
const reasoning=require('../docs/reasoning.js');
const browser=require('../docs/catalog-browser.js');

function launch() {
  const el=new Map();
  function get(id){if(!el.has(id))el.set(id,new Node('div',id));return el.get(id)}
  const sorts=['groups-first','rules-first','name-asc','name-desc','id-asc','id-desc','members-desc','members-asc'];
  const select=get('sort-order');
  select.value='groups-first';
  select.options=sorts.map(s=>({textContent:s}));
  Object.defineProperty(select,'selectedIndex',{get:()=>sorts.indexOf(select.value)});
  get('search').value='';
  get('filter-type').value='all';
  get('filter-status').value='all';
  get('filter-family').value='all';
  get('filter-domain').value='all';
  get('filter-project').value='all';
  get('filter-profile').value='all';
  const document={
    getElementById:get,
    createElement(tag){return new Node(tag)},
    createTextNode(value){const node=new Node('#text');node.textContent=value;return node},
    querySelectorAll(){return []},
    querySelector(){return null},
    documentElement:{dataset:{}}
  };
  let source=fs.readFileSync(path.join(root,'docs/app.js'),'utf8');
  assert.match(source,/init\(\);\s*$/);
  source=source.replace(/init\(\);\s*$/,'');
  const ctx=vm.createContext({
    document,NomosColor:color,NomosGroups:groups,NomosReasoning:reasoning,
    NomosCatalog:browser,console,setTimeout,clearTimeout,
    fetch:async()=>({ok:true,json:async()=>catalog})
  });
  vm.runInContext(source,ctx);
  vm.runInContext('state.rules=__catalog.rules;state.groups=__catalog.groups;state.profiles=__catalog.profiles;state.relationships=__catalog.relationships||[];state.projectHierarchy=__catalog.project_hierarchy||null;state.domainDefinitions=__catalog.domain_definitions||null;',Object.assign(ctx,{__catalog:catalog}));
  vm.runInContext('renderCatalog()',ctx);
  function firstIds(count) {
    const cards=get('catalog-list').children;
    function findIdentity(n) {
      if(n?.className==='rule-id')return n.textContent;
      for(const child of n?.children||[]) {
        const id=findIdentity(child);if(id)return id;
      }
      return null;
    }
    return cards.slice(0,count).map(findIdentity);
  }
  return {get,ctx,firstIds};
}

test('real Sort change event rerenders DOM in the selected order',()=>{
  const app=launch();
  assert.deepEqual(app.firstIds(2),['GROUP-0001','GROUP-0002']);
  app.get('sort-order').value='rules-first';
  app.get('sort-order').listeners.change();
  assert.deepEqual(app.firstIds(2),['NOM-0001','NOM-0002']);
  assert.equal(app.get('filter-form').scrolled,1);
  assert.match(app.get('result-count').textContent,/rules-first/);
  app.get('sort-order').value='id-desc';
  app.get('sort-order').listeners.change();
  const expected=[...catalog.rules,...catalog.groups,...catalog.profiles].map(x=>x.id).sort().reverse().slice(0,2);
  assert.deepEqual(app.firstIds(2),expected);
  app.get('sort-order').value='groups-first';
  app.get('sort-order').listeners.change();
  assert.deepEqual(app.firstIds(2),['GROUP-0001','GROUP-0002']);
});
test('typing and changing entity filters respects selected sorting mode',()=>{
  const app=launch();
  app.get('sort-order').value='id-desc';
  app.get('sort-order').listeners.change();
  app.get('filter-type').value='groups';
  app.get('filter-type').listeners.change();
  assert.deepEqual(app.firstIds(2),['GROUP-0014','GROUP-0013']);
  app.get('search').value='Rust';
  app.get('search').listeners.input();
  assert.deepEqual(app.firstIds(1),['GROUP-0003']);
});
test('reset restores groups-first default and view top',()=>{
  const app=launch();
  app.get('sort-order').value='name-desc';
  app.get('sort-order').listeners.change();
  app.get('clear-filters').listeners.click();
  assert.equal(app.get('sort-order').value,'groups-first');
  assert.deepEqual(app.firstIds(2),['GROUP-0001','GROUP-0002']);
});

test('profile cards browse their exact member sets and clear the member filter',()=>{
  const app=launch();
  app.get('filter-type').value='profiles';
  app.get('filter-type').listeners.change();
  assert.deepEqual(app.firstIds(2),['PROFILE-0001','PROFILE-0002']);
  const card=app.get('catalog-list').children[0];
  const actions=card.children.find(n=>n.className==='group-actions');
  assert.equal(actions.children.length,3);
  assert.equal(actions.children[1].tag,'a'); // Descriptive companion browsing only
  assert.equal(actions.children[1].href,'./profile-companions.html?profile=PROFILE-0001');
  assert.equal(actions.children[2].tag,'span'); // Draft must not expose bulk activation
  actions.children[0].listeners.click();
  assert.equal(app.get('filter-profile').value,'PROFILE-0001');
  assert.equal(app.get('filter-type').value,'rules');
  assert.equal(app.get('catalog-list').children.length,61);
  assert.match(app.get('active-member-filter').textContent,/C-to-Rust Strict Port/);
  assert.equal(vm.runInContext('state.selected.length',app.ctx),0);
  app.get('active-member-filter').listeners.click();
  assert.equal(app.get('filter-profile').value,'all');
  app.get('clear-filters').listeners.click();
  assert.deepEqual(app.firstIds(2),['GROUP-0001','GROUP-0002']);
});
test('profile dropdown selects a profile and resets incompatible filters',()=>{
  const app=launch();
  app.get('filter-status').value='draft';
  app.get('filter-type').value='profiles';
  app.get('filter-type').listeners.change();
  app.get('filter-profile').value='PROFILE-0002';
  app.get('filter-profile').listeners.change();
  assert.equal(app.get('filter-status').value,'all');
  assert.equal(app.get('filter-type').value,'rules');
  assert.equal(app.get('catalog-list').children.length,121);
  assert.equal(vm.runInContext('state.selected.length',app.ctx),0);
});

test('real catalog initialization includes profiles without activating them',async()=>{
  const app=launch();
  await vm.runInContext('init()',app.ctx);
  assert.equal(app.get('count-all').textContent,String(catalog.rules.length+catalog.groups.length+catalog.profiles.length));
  assert.equal(app.get('count-draft').textContent,'13'); // one draft rule and twelve draft profiles
  assert.deepEqual(app.get('filter-profile').children.map(x=>x.value),Array.from({length:12},(_,i)=>'PROFILE-'+String(i+1).padStart(4,'0')));
  assert.equal(vm.runInContext('state.selected.length',app.ctx),0);
  app.get('filter-type').value='profiles';
  app.get('filter-type').listeners.change();
  assert.deepEqual(app.firstIds(2),['PROFILE-0001','PROFILE-0002']);
});

test('project type selector filters the real catalog without altering rule selection',()=>{
  const app=launch();
  app.get('filter-project').value='tarium_project';
  app.get('filter-project').listeners.change();
  assert.deepEqual(app.firstIds(2),['NOM-0006','NOM-0007']);
  assert.equal(app.get('catalog-list').children.length,68); // NOM-0137 adds one applicable project rule
  assert.equal(vm.runInContext('state.selected.length',app.ctx),0);
  app.get('clear-filters').listeners.click();
  assert.equal(app.get('filter-project').value,'all');
});

test('domain-family selector and directory navigate rule classifications without selecting rules',async()=>{
  const app=launch();
  await vm.runInContext('init()',app.ctx);
  assert.ok(app.get('filter-family').children.some(x=>x.value==='Knowledge'));
  assert.ok(app.get('domain-taxonomy').children.length>=7);
  app.get('filter-family').value='Knowledge';
  app.get('filter-family').listeners.change();
  assert.ok(app.firstIds(100).includes('NOM-0006'));
  assert.ok(app.get('catalog-list').children.every(n=>n.className==='rule-card'));
  assert.equal(vm.runInContext('state.selected.length',app.ctx),0);
  app.get('clear-filters').listeners.click();
  assert.equal(app.get('filter-family').value,'all');
});

test('new provisional draft card shows selection-review state and browses the exact member set',()=>{
  const app=launch();
  app.get('filter-type').value='profiles';app.get('filter-type').listeners.change();
  const cards=app.get('catalog-list').children;
  assert.equal(cards.length,12);
  const candidate=cards[2];
  const actions=candidate.children.find(n=>n.className==='group-actions');
  assert.match(JSON.stringify(candidate,(k,v)=>['listeners','style'].includes(k)?undefined:v),/Selection not reviewed/);
  actions.children[0].listeners.click();
  assert.equal(app.get('catalog-list').children.length,45);
  assert.equal(vm.runInContext('state.selected.length',app.ctx),0);
});
