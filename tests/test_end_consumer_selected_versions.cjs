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
const v2=json('end-consumer-profiles/project-stewardship/v2/selected-versions.json');
const v3=json('end-consumer-profiles/project-stewardship/v3/selected-versions.json');
const final=json('end-consumer-profiles/project-stewardship/v4/selected-versions.json');
const revisions=json('end-consumer-profiles/project-stewardship/v4/revisions.json');
const curated=json('docs/exports/project-stewardship-approved-trievium.json');
const priorRevisions=json('end-consumer-profiles/project-stewardship/v3/revisions.json');
const draft=json('end-consumer-profiles/project-stewardship/v2/review-candidates.json');
const selectedKeys=['L','S','H','D','F'];
test('V2 affects only D/S and preserves every earlier authorized version',()=>{
 assert.deepEqual(published.published_versions.map(x=>x.key+':'+x.version),['L:1','H:1','F:1','S:1','D:1','S:2','D:2']);
 assert.deepEqual(v2.selected_slots.filter(x=>x.selected_version!=='0').map(x=>x.key),['L','H','F']);
 assert.equal(v3.selected_slots.find(x=>x.key==='S').selected_version,'1');
 assert.equal(v3.selected_slots.find(x=>x.key==='D').selected_version,'1');
 assert.equal(final.selected_slots.length,10);
 for(let i=0;i<10;i++){
  const slot=profile.slots[i],s=final.selected_slots[i],key=slot.key;
  const versions=published.published_versions.filter(p=>p.prompt_id===slot.id);
  const selectedVersion=['S','D'].includes(key)?'2':['L','H','F'].includes(key)?'1':'0';
  const pub=versions.find(p=>p.version===selectedVersion);
  assert.equal(s.prompt_id,slot.id);
  assert.equal(s.source_text_sha256,sha(original.entries[i].text));
  assert.equal(s.selected_version,selectedVersion);
  assert.equal(s.selected_text_sha256,pub?pub.sha256:slot.text_sha256);
  assert.equal(published.selected_versions[slot.id],pub?selectedVersion:undefined);
  for(const p of versions){assert.equal(p.owner_approved,true);assert.equal(p.sha256,sha(p.text));}
  if(['L','H','F'].includes(key)){
   assert.equal(versions.length,1);
   assert.equal(pub.text,draft.candidates.find(x=>x.prompt_id===slot.id).candidate_text);
   assert.equal(pub.approval_reference,'owner-chat-2026-10-28-approve-all-three');
  }else if(['S','D'].includes(key)){
   assert.equal(versions.length,2);
   const prior=versions.find(p=>p.version==='1');
   assert.equal(prior.approval_reference,priorRevisions.approval_reference);
   assert.equal(prior.text,original.entries[i].text.replace('## 7. Persistence and Continuity 💾',priorRevisions.insertion+'\n\n## 7. Persistence and Continuity 💾'));
   assert.equal(pub.approval_reference,revisions.approval_reference);
   assert.equal(pub.text,prior.text.replace(revisions.insertion_anchor,revisions.insertion+'\n\n'+revisions.insertion_anchor));
   assert.match(pub.text,/CHANGELOG\.md/);
   assert.match(pub.text,/docs\//);
   assert.match(pub.text,/Never turn the README into an accumulating changelog/);
  } else assert.equal(versions.length,0);
 }
});
test('Curated export selects two V2 prompts, while all prior variants remain selectable',()=>{
 const catalog=model.makeCatalog(profile,original,published);
 assert.deepEqual(model.makeTrievium(catalog),curated);
 assert.deepEqual(curated.entries.map(x=>x.key),original.entries.map(x=>x.key));
 assert.deepEqual(curated.entries.filter((x,i)=>x.text!==original.entries[i].text).map(x=>x.key),selectedKeys);
 const v0=Object.fromEntries(profile.slots.map(x=>[x.id,'0']));
 assert.deepEqual(model.makeTrievium(catalog,v0).entries,original.entries.map(x=>({label:x.label,text:x.text,key:x.key})));
 assert.deepEqual(json('docs/exports/project-stewardship-v0.json'),original);
 for(const key of ['S','D']){
  const slot=catalog.find(x=>x.key===key),prior=published.published_versions.find(x=>x.key===key&&x.version==='1');
  assert.deepEqual(slot.versions.map(x=>x.version),['0','1','2']);
  assert.equal(model.makeTrievium(catalog,{[slot.id]:'1'}).entries.find(x=>x.key===key).text,prior.text);
 }
});
test('Unapproved, missing and duplicate V2 versions are rejected',()=>{
 const bad={...published,selected_versions:{...published.selected_versions,'EC-PROMPT-0001':'1'}};
 assert.throws(()=>model.makeCatalog(profile,original,bad),/Selected version is not an approved publication/);
 const missing={...published,published_versions:published.published_versions.filter(x=>!(x.key==='D'&&x.version==='2'))};
 assert.throws(()=>model.makeCatalog(profile,original,missing),/Selected version is not an approved publication/);
 const unapproved={...published,published_versions:published.published_versions.map(x=>x.key==='S'&&x.version==='2'?{...x,owner_approved:false}:x)};
 assert.throws(()=>model.makeCatalog(profile,original,unapproved),/explicit owner approval/);
 const duplicate={...published,published_versions:[...published.published_versions,published.published_versions.find(x=>x.key==='D'&&x.version==='2')]};
 assert.throws(()=>model.makeCatalog(profile,original,duplicate),/Duplicate version/);
});
