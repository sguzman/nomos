'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {derive,generate,run,TYPES}=require('../tools/profile_companions.cjs');
const catalog=require('../docs/catalog.json');
test('all 12 rule-profile drafts have two exact inactive companions',()=>{
 const generated=generate();
 assert.equal(generated.size,24);assert.equal(run('--check').size,24);
 assert.equal(catalog.profile_companions.length,24);
 assert.equal(catalog.profiles.length,12);
 for(const [file,raw] of generated){
  const x=JSON.parse(raw);
  const source=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../profiles',x.source_profile.id+'.json'),'utf8'));
  assert.equal(x.status,'derived_inert');
  assert.equal(x.source_profile.selection_confirmed,source.review.selection_confirmed);
  assert.equal(x.source_profile.status,source.status);
  assert.deepEqual(x.source_rule_ids,source.selected_rule_ids);
  assert.ok(file.endsWith(x.id+'.json'));
  assert.deepEqual(x.members.map(m=>m.id),[...x.members.map(m=>m.id)].sort());
  assert.ok(x.members.every(m=>m.via_rules.every(r=>source.selected_rule_ids.includes(r.id))));
  assert.deepEqual(x,catalog.profile_companions.find(p=>p.id===x.id));
 }
});
test('basis of every concept relationship remains traceable to selected rule',()=>{
 const p=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../profiles/PROFILE-0001.json'),'utf8'));
 const links=new Map(catalog.rule_situation_intent_links.map(x=>[x.rule_id,x]));
 const raw=fs.readFileSync(path.resolve(__dirname,'../profiles/PROFILE-0001.json'),'utf8');
 for(const t of TYPES){
  const x=derive(p,links,catalog[t.name],raw,t);
  for(const m of x.members)for(const r of m.via_rules)
   assert.equal(links.get(r.id)[t.name].find(y=>y.id===m.id).basis,r.basis);
 }
 assert.throws(()=>derive({...p,selected_rule_ids:['NOM-0002']},links,catalog.situations,raw,TYPES[0]),/Missing published/);
 assert.throws(()=>derive({...p,selected_rule_ids:['NOM-9999']},links,catalog.situations,raw,TYPES[0]),/Missing published/);
 assert.throws(()=>derive({...p,selected_rule_ids:['NOM-0001','NOM-0001']},links,catalog.situations,raw,TYPES[0]),/Invalid source/);
});
