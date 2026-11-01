'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const model=require('../docs/end-consumer-profile-model.js');
const original=json('end-consumer-profiles/project-stewardship/v0/trievium.json');
const profile=json('end-consumer-profiles/project-stewardship/profile.json');
const manifest=json('docs/data/project-stewardship-published-versions.json');
const old=json('end-consumer-profiles/project-stewardship/v5/selected-versions.json');
const current=json('end-consumer-profiles/project-stewardship/v6/selected-versions.json');
const revision=json('end-consumer-profiles/project-stewardship/v6/revisions.json');
const curated=json('docs/exports/project-stewardship-approved-trievium.json');
test('Only D/S/A receive successor versions and their predecessors remain byte-for-byte',()=>{
 assert.equal(manifest.published_versions.length,14);
 assert.deepEqual(revision.selected_keys,['S','D','A']);
 assert.deepEqual(manifest.published_versions.slice(-3).map(p=>p.key+':'+p.version),['S:4','D:4','A:2']);
 for(const s of current.selected_slots){
  const previous=old.selected_slots.find(p=>p.key===s.key);
  if(!['S','D','A'].includes(s.key)){assert.deepEqual(s,previous);continue;}
  const r=revision.revisions.find(x=>x.key===s.key),before=manifest.published_versions.find(p=>p.key===s.key&&p.version===r.prior_version);
  const after=manifest.published_versions.find(p=>p.key===s.key&&p.version===r.selected_version);
  assert.equal(previous.selected_version,r.prior_version);
  assert.equal(s.selected_version,r.selected_version);
  assert.equal(s.selected_text_sha256,r.selected_sha256);
  assert.equal(before.sha256,r.prior_sha256);
  assert.equal(after.sha256,sha(after.text));
  assert.equal(after.text.split(r.insertion).length,2);
  assert.equal(after.text.replace(r.insertion,''),before.text);
  assert.match(after.text,/MIT/);
  assert.match(after.text,/AGPL/);
 }
 for(const p of manifest.published_versions)assert.equal(p.sha256,sha(p.text));
});
test('Selected export and all historical versions remain available',()=>{
 const catalog=model.makeCatalog(profile,original,manifest);
 assert.deepEqual(model.makeTrievium(catalog),curated);
 assert.deepEqual(catalog.map(p=>p.key+':'+p.defaultVersion),['J:0','L:1','S:4','H:1','D:4','K:0','A:2','F:1','G:1','U:0']);
 for(const [key,versions] of [['S',['0','1','2','3','4']],['D',['0','1','2','3','4']],['A',['0','1','2']]]){
  const slot=catalog.find(p=>p.key===key);
  assert.deepEqual(slot.versions.map(v=>v.version),versions);
  for(const v of versions){
   const text=v==='0'?original.entries.find(e=>e.key===key).text:manifest.published_versions.find(p=>p.key===key&&p.version===v).text;
   assert.equal(model.makeTrievium(catalog,{[slot.id]:v}).entries.find(e=>e.key===key).text,text);
  }
 }
 assert.deepEqual(json('docs/exports/project-stewardship-v0.json'),original);
});
test('Missing and unapproved versions are rejected',()=>{
 const missing={...manifest,published_versions:manifest.published_versions.filter(p=>!(p.key==='D'&&p.version==='4'))};
 assert.throws(()=>model.makeCatalog(profile,original,missing),/Selected version is not an approved publication/);
 const noApproval={...manifest,published_versions:manifest.published_versions.map(p=>p.key==='A'&&p.version==='2'?{...p,owner_approved:false}:p)};
 assert.throws(()=>model.makeCatalog(profile,original,noApproval),/explicit owner approval/);
});
