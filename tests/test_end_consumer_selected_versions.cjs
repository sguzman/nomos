'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const model=require('../docs/end-consumer-profile-model.js');
const root=path.resolve(__dirname,'..');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
const original=json('end-consumer-profiles/project-stewardship/v0/trievium.json');
const profile=json('end-consumer-profiles/project-stewardship/profile.json');
const published=json('docs/data/project-stewardship-published-versions.json');
const final=json('end-consumer-profiles/project-stewardship/v2/selected-versions.json');
const curated=json('docs/exports/project-stewardship-approved-trievium.json');
const draft=json('end-consumer-profiles/project-stewardship/v2/review-candidates.json');
test('Owner-approved version records match source, reviewed wording and exact hashes',()=>{
 assert.deepEqual(published.published_versions.map(x=>x.key),['L','H','F']);
 assert.equal(final.selected_slots.length,10);
 for(let i=0;i<10;i++){
  const s=profile.slots[i],d=final.selected_slots[i],p=published.published_versions.find(x=>x.prompt_id===s.id);
  assert.equal(d.prompt_id,s.id);
  assert.equal(d.source_text_sha256,sha(original.entries[i].text));
  assert.equal(d.selected_version,p?'1':'0');
  assert.equal(d.selected_text_sha256,p?p.sha256:s.text_sha256);
  if(p){
   assert.equal(p.owner_approved,true);
   assert.equal(p.approval_reference,'owner-chat-2026-10-28-approve-all-three');
   assert.equal(p.sha256,sha(p.text));
   assert.equal(p.text,draft.candidates.find(x=>x.prompt_id===s.id).candidate_text);
   assert.equal(published.selected_versions[s.id],'1');
  } else assert.equal(published.selected_versions[s.id],undefined);
 }
});
test('Curated Trievium selects L H F only, preserving the full V0 keyset',()=>{
 const catalog=model.makeCatalog(profile,original,published);
 assert.deepEqual(model.makeTrievium(catalog),curated);
 assert.deepEqual(curated.entries.map(x=>x.key),original.entries.map(x=>x.key));
 assert.deepEqual(curated.entries.filter((x,i)=>x.text!==original.entries[i].text).map(x=>x.key),['L','H','F']);
 const v0=Object.fromEntries(profile.slots.map(x=>[x.id,'0']));
 assert.deepEqual(model.makeTrievium(catalog,v0).entries,original.entries.map(x=>({label:x.label,text:x.text,key:x.key})));
 assert.deepEqual(json('docs/exports/project-stewardship-v0.json'),original);
});
test('Cannot select a successor that is unpublished or no longer approved',()=>{
 const bad={...published,selected_versions:{...published.selected_versions,'EC-PROMPT-0001':'1'}};
 assert.throws(()=>model.makeCatalog(profile,original,bad),/Selected version is not an approved publication/);
 const missing={...published,published_versions:published.published_versions.filter(x=>x.key!=='F')};
 assert.throws(()=>model.makeCatalog(profile,original,missing),/Selected version is not an approved publication/);
 const unapproved={...published,published_versions:published.published_versions.map(x=>x.key==='F'?{...x,owner_approved:false}:x)};
 assert.throws(()=>model.makeCatalog(profile,original,unapproved),/explicit owner approval/);
});
