'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const model=require('../docs/end-consumer-profile-model.js');
const root=path.resolve(__dirname,'..');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const original=json('end-consumer-profiles/project-stewardship/v0/trievium.json');
const profile=json('end-consumer-profiles/project-stewardship/profile.json');
const live=json('docs/data/project-stewardship-published-versions.json');
const published={...live,published_versions:live.published_versions.filter(p=>!(['S:4','D:4','A:2'].includes(p.key+':'+p.version))),selected_versions:Object.fromEntries(Object.entries(live.selected_versions).map(([id,v])=>[id,id==='EC-PROMPT-0003'||id==='EC-PROMPT-0005'?'3':id==='EC-PROMPT-0007'?'1':v]))};
const previous=json('end-consumer-profiles/project-stewardship/v4/selected-versions.json');
const current=json('end-consumer-profiles/project-stewardship/v5/selected-versions.json');
const revisions=json('end-consumer-profiles/project-stewardship/v5/revisions.json');
const curated={...json('docs/exports/project-stewardship-approved-trievium.json'),entries:json('docs/exports/project-stewardship-approved-trievium.json').entries.map(e=>{const pub=published.published_versions.find(p=>p.key===e.key&&p.version===published.selected_versions[p.prompt_id]);return pub?{...e,text:pub.text}:e;})};
const priorV3=json('end-consumer-profiles/project-stewardship/v3/revisions.json');
const priorV4=json('end-consumer-profiles/project-stewardship/v4/revisions.json');
const reviewed=json('end-consumer-profiles/project-stewardship/v2/review-candidates.json');
const affected=['S','D','A','G'];
const publishedOrder=['L:1','H:1','F:1','S:1','D:1','S:2','D:2','S:3','D:3','A:1','G:1'];
test('Only S/D/A/G change selection; immutable earlier approvals survive',()=>{
 assert.deepEqual(published.published_versions.map(p=>p.key+':'+p.version),publishedOrder);
 assert.equal(current.selected_slots.length,10);
 assert.deepEqual(revisions.selected_keys,affected);
 for(const slot of current.selected_slots){
  const before=previous.selected_slots.find(p=>p.key===slot.key);
  const originalEntry=original.entries.find(e=>e.key===slot.key);
  const selected=published.published_versions.find(p=>p.key===slot.key&&p.version===slot.selected_version);
  assert.equal(slot.prompt_id,before.prompt_id);
  assert.equal(slot.source_text_sha256,sha(originalEntry.text));
  assert.equal(published.selected_versions[slot.prompt_id],selected?slot.selected_version:undefined);
  assert.equal(slot.selected_text_sha256,selected?selected.sha256:sha(originalEntry.text));
  if(!affected.includes(slot.key))assert.deepEqual(slot,before);
  else {
   const r=revisions.revisions.find(x=>x.key===slot.key);
   assert.ok(r);
   assert.equal(slot.selected_version,r.selected_version);
   assert.equal(slot.selected_text_sha256,r.selected_sha256);
   assert.equal(slot.selected_text_sha256,sha(selected.text));
   const predecessor=r.prior_version==='0'?originalEntry.text:published.published_versions.find(x=>x.key===slot.key&&x.version===r.prior_version).text;
   assert.equal(selected.text.split(r.insertion).length,2);
   assert.equal(selected.text.replace(r.insertion+(affected.slice(0,2).includes(slot.key)?'\n\n':''),''),predecessor);
   assert.match(selected.text,/90%/);
   assert.match(selected.text,/remaining/);
  }
 }
 for(const p of published.published_versions){
  assert.equal(p.owner_approved,true);assert.equal(p.sha256,sha(p.text));
 }
 for(const key of ['L','H','F']){
  const p=published.published_versions.find(x=>x.key===key);
  assert.equal(p.text,reviewed.candidates.find(x=>x.key===key).candidate_text);
 }
 for(const key of ['S','D']){
  const v1=published.published_versions.find(x=>x.key===key&&x.version==='1');
  const v2=published.published_versions.find(x=>x.key===key&&x.version==='2');
  const base=original.entries.find(x=>x.key===key).text;
  assert.equal(v1.text,base.replace('## 7. Persistence and Continuity 💾',priorV3.insertion+'\n\n## 7. Persistence and Continuity 💾'));
  assert.equal(v2.text,v1.text.replace(priorV4.insertion_anchor,priorV4.insertion+'\n\n'+priorV4.insertion_anchor));
 }
});
test('Curated export chooses seven successors; V0 and prior versions stay selectable',()=>{
 const catalog=model.makeCatalog(profile,original,published);
 assert.deepEqual(model.makeTrievium(catalog),curated);
 assert.deepEqual(curated.entries.filter((e,i)=>e.text!==original.entries[i].text).map(e=>e.key),['L','S','H','D','A','F','G']);
 assert.deepEqual(catalog.filter(x=>x.defaultVersion!=='0').map(x=>x.key),['L','S','H','D','A','F','G']);
 const v0Selections=Object.fromEntries(profile.slots.map(x=>[x.id,'0']));
 assert.deepEqual(model.makeTrievium(catalog,v0Selections).entries,original.entries.map(e=>({label:e.label,text:e.text,key:e.key})));
 assert.deepEqual(json('docs/exports/project-stewardship-v0.json'),original);
 for(const key of ['S','D']){
  const item=catalog.find(x=>x.key===key);
  assert.deepEqual(item.versions.map(v=>v.version),['0','1','2','3']);
  for(const version of ['1','2'])assert.equal(model.makeTrievium(catalog,{[item.id]:version}).entries.find(e=>e.key===key).text,published.published_versions.find(p=>p.key===key&&p.version===version).text);
 }
});
test('Unknown, missing, duplicate and unapproved selected variants fail closed',()=>{
 const bad={...published,selected_versions:{...published.selected_versions,'EC-PROMPT-0001':'1'}};
 assert.throws(()=>model.makeCatalog(profile,original,bad),/Selected version is not an approved publication/);
 const missing={...published,published_versions:published.published_versions.filter(p=>!(p.key==='D'&&p.version==='3'))};
 assert.throws(()=>model.makeCatalog(profile,original,missing),/Selected version is not an approved publication/);
 const notApproved={...published,published_versions:published.published_versions.map(p=>p.key==='A'&&p.version==='1'?{...p,owner_approved:false}:p)};
 assert.throws(()=>model.makeCatalog(profile,original,notApproved),/explicit owner approval/);
 const duplicate={...published,published_versions:[...published.published_versions,published.published_versions.find(p=>p.key==='G'&&p.version==='1')]};
 assert.throws(()=>model.makeCatalog(profile,original,duplicate),/Duplicate version/);
});
