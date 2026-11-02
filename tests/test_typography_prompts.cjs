'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const ids=Array.from({length:6},(_,i)=>'NOM-'+String(250+i).padStart(4,'0'));
test('Six typography rules are optional contextual defaults, not font mandates',()=>{
 for(const id of ids){const r=read('rules/'+id+'.json');assert.equal(r.status,'published');assert.equal(r.norm.predicate.action,'consider_and_prefer');assert.match(r.statement,/not a mandatory typeface/);assert.match(r.statement,/alternative/);assert.ok(r.norm.conditions.length);assert.ok(r.norm.exceptions.length);}
});
test('D/S V6 and A V4 are SHA verified, reversible, and currently selected',()=>{
 const m=read('docs/data/project-stewardship-published-versions.json'),revs=read('end-consumer-profiles/project-stewardship/v8/revisions.json');
 for(const r of revs.revisions){const before=m.published_versions.find(x=>x.key===r.key&&x.version===r.prior_version),after=m.published_versions.find(x=>x.key===r.key&&x.version===r.selected_version);
  assert.equal(hash(before.text),r.prior_sha256);assert.equal(hash(after.text),r.selected_sha256);assert.equal(after.text.replace(r.insertion,''),before.text);assert.equal(m.selected_versions[r.prompt_id],{S:'7',D:'7',A:'5'}[r.key]); // V8 text retained; V9 successor selected
  for(const id of ids)assert.match(after.text,new RegExp(id));
 }
});
test('Archived V3 and current V4 outputs verify; all 14 prompts include typography rule statements',()=>{
 const v3=require('../tools/build_project_initializers_v3.cjs'),v4=require('../tools/build_project_initializers_v4.cjs');
 v3.publish(true);v4.publish(true);assert.equal(v4.selected.entries.length,14);
 assert.deepEqual(v4.selected.entries.map(e=>e.key),v3.selected.entries.map(e=>e.key));
 for(let i=0;i<14;i++){const e=v4.selected.entries[i],m=v4.report.entries[i];assert.match(e.text,/D V6/);if(i%2)assert.match(e.text,/A V4/);for(const id of ids){assert.match(e.text,new RegExp(id+' — '));assert.ok(m.rule_ids.includes(id));}assert.equal(m.sha256,hash(e.text));}
});
