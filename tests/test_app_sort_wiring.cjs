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
  get('filter-domain').value='all';
  const document={
    getElementById:get,
    createElement(tag){return new Node(tag)},
    createTextNode(value){const node=new Node('#text');node.textContent=value;return node},
    querySelectorAll(){return []},
    documentElement:{dataset:{}}
  };
  let source=fs.readFileSync(path.join(root,'docs/app.js'),'utf8');
  assert.match(source,/init\(\);\s*$/);
  source=source.replace(/init\(\);\s*$/,'');
  const ctx=vm.createContext({
    document,NomosColor:color,NomosGroups:groups,NomosReasoning:reasoning,
    NomosCatalog:browser,console,setTimeout,clearTimeout
  });
  vm.runInContext(source,ctx);
  vm.runInContext('state.rules=__catalog.rules;state.groups=__catalog.groups;',Object.assign(ctx,{__catalog:catalog}));
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
  assert.deepEqual(app.firstIds(2), catalog.rules.map(x=>x.id).sort().reverse().slice(0,2));
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
