'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const {validate}=require('../tools/validate_end_consumer_publications.cjs');
const src=fs.readFileSync(path.resolve(__dirname,'../docs/end-consumer-profile-model.js'),'utf8');
const model=require('../docs/end-consumer-profile-model.js');
const profile=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../end-consumer-profiles/project-stewardship/profile.json'),'utf8'));
const original=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../end-consumer-profiles/project-stewardship/v0/trievium.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../docs/data/project-stewardship-published-versions.json'),'utf8'));
const sha=t=>createHash('sha256').update(t).digest('hex');
test('Published catalog, original bytes, and all actual versions satisfy release integrity',()=>{
  const result=validate();
  assert.equal(result.slots,10);
  assert.equal(result.approvedSuccessors,manifest.published_versions.length);
  assert.equal(result.sourceSha256.length,64);
});
test('Two distinct approved synthetic successors can be selected without changing defaults',()=>{
  const f=profile.slots[0],g=profile.slots[1];
  const approvals=[{prompt_id:f.id,key:f.key,label:f.label,version:'1',text:'Sample version one',owner_approved:true,approval_reference:'owner-review-1',publication_state:'approved_public_prompt_version'},
    {prompt_id:g.id,key:g.key,label:g.label,version:'2',text:'Sample version two',owner_approved:true,approval_reference:'owner-review-2',publication_state:'approved_public_prompt_version'}].map(x=>({...x,sha256:sha(x.text)}));
  const catalog=model.makeCatalog(profile,original,{...manifest,selected_versions:{},published_versions:approvals});
  const selected=model.makeTrievium(catalog,{[f.id]:'1',[g.id]:'2'});
  assert.equal(selected.entries[0].text,'Sample version one');
  assert.equal(selected.entries[1].text,'Sample version two');
  assert.deepEqual(model.makeTrievium(catalog).entries,original.entries.map(e=>({label:e.label,text:e.text,key:e.key})));
});
