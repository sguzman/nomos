'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const base=path.resolve(__dirname,'..');
const json=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const source=json('end-consumer-profiles/project-stewardship/v0/trievium.json');
const profile=json('end-consumer-profiles/project-stewardship/profile.json');
const analysis=json('end-consumer-profiles/project-stewardship/v1/analysis.json');
const approvals=json('end-consumer-profiles/project-stewardship/v1/meta-intent-approval.json');
test('owner approval record, V0 source and both semantic projections agree',()=>{
 assert.deepEqual(json('docs/data/project-stewardship-v1-analysis.json'),analysis);
 assert.equal(approvals.status,'approved_meta_intents_only');
 assert.equal(approvals.profile_id,profile.id);
 assert.equal(approvals.entries.length,10);
 for(let i=0;i<10;i++){
  const slot=profile.slots[i],entry=source.entries[i],prompt=analysis.prompts[i],decision=approvals.entries[i];
  assert.equal(decision.prompt_id,slot.id);
  assert.equal(decision.key,entry.key);
  assert.equal(decision.owner_approved,true);
  assert.equal(sha(entry.text),slot.text_sha256);
  assert.equal(decision.source_text_sha256,slot.text_sha256);
  assert.equal(prompt.source.text_sha256,slot.text_sha256);
  assert.equal(decision.statement,prompt.meta_intent.statement);
  assert.equal(prompt.meta_intent.owner_confirmed,true);
  assert.equal(prompt.meta_intent.review_status,'owner_approved');
 }
});
test('meta-intent approval never grants assessment approval, write authorization or version selection',()=>{
 for(let i=0;i<10;i++){
  const slot=profile.slots[i];
  const r=json('end-consumer-profiles/project-stewardship/v1/evaluations/'+slot.id+'.json');
  assert.equal(r.owner_meta_intent_approved,true);
  assert.equal(r.owner_assessment_approved,false);
  assert.equal(r.owner_decision,null);
  assert.equal(r.review_status,'provisional_pending_owner_review');
  assert.equal(r.selected_prompt_version,'0');
  assert.equal(r.generated_prompt_version,null);
  assert.equal(analysis.prompts[i].selection.evaluation,'not_started');
  assert.equal(analysis.prompts[i].selection.semantic_selection_owner_approved,false);
 }
 assert.deepEqual(profile.governance.selected_replacement_versions,[]);
 assert.deepEqual(json('docs/data/project-stewardship-published-versions.json').published_versions,[]);
 assert.equal(json('end-consumer-profiles/project-stewardship/v2/review-candidates.json').owner_approval_of_candidates,false);
});
