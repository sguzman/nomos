'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const source=json('end-consumer-profiles/project-stewardship/v0/trievium.json');
const profile=json('end-consumer-profiles/project-stewardship/profile.json');
const analysis=json('end-consumer-profiles/project-stewardship/v1/analysis.json');
const review=json('end-consumer-profiles/project-stewardship/v1/evaluations/EC-PROMPT-0001.json');
const digest=v=>createHash('sha256').update(v).digest('hex');

test('J provisional assessment is anchored to exact unchanged V0 and proposed V1 semantics',()=>{
  const entry=source.entries.find(e=>e.key==='J');
  const slot=profile.slots.find(e=>e.key==='J');
  const model=analysis.prompts.find(e=>e.source.key==='J');
  assert.equal(entry.text,'continue');
  assert.equal(digest(entry.text),slot.text_sha256);
  assert.equal(review.source_text_sha256,slot.text_sha256);
  assert.equal(review.prompt_id,slot.id);
  assert.equal(review.meta_intent,model.meta_intent.statement);
  assert.equal(review.proposed_verdict,'yes');
  assert.equal(review.evaluation_basis,'textual_semantics_only');
  assert.equal(review.behavioral_test_status,'not_tested');
  assert.equal(review.review_status,'provisional_pending_owner_review');
  assert.equal(review.owner_meta_intent_approved,false);
  assert.equal(review.owner_assessment_approved,false);
  assert.equal(review.owner_decision,null);
  assert.equal(review.disposition,'retain_v0_provisionally_no_rewrite');
  assert.equal(review.selected_prompt_version,'0');
  assert.equal(review.generated_prompt_version,null);
  assert.deepEqual(review.atomic_intent_coverage.map(x=>x.local_id),model.atomic_intents.map(x=>x.local_id));
  assert.ok(review.applicable_preconditions.length>=3);
  assert.ok(review.failure_conditions.length>=3);
  assert.equal(model.selection.evaluation,'not_started');
  assert.equal(model.meta_intent.owner_confirmed,false);
  assert.equal(profile.current_version,'0');
  assert.equal(profile.governance.semantic_enrichment_authorized,false);
});

test('Public profile exposes J draft evaluation without presenting it as approved',()=>{
  const html=fs.readFileSync(path.join(root,'docs/end-consumer-profiles.html'),'utf8');
  assert.match(html,/Provisional text assessment · J/);
  assert.match(html,/Formal satisfaction evaluation:<\/strong> not started/);
  assert.match(html,/Owner decision:<\/strong> pending/);
  assert.match(html,/EC-PROMPT-0001\.json/);
  assert.equal((html.match(/<details(?:\s[^>]*)?>/g)||[]).length,10);
});

test('L, S and H provisional reviews preserve original source, scope and owner decision boundaries',()=>{
  for(const key of ['L','S','H']){
    const entry=source.entries.find(e=>e.key===key);
    const slot=profile.slots.find(e=>e.key===key);
    const model=analysis.prompts.find(e=>e.source.key===key);
    const review=json('end-consumer-profiles/project-stewardship/v1/evaluations/'+slot.id+'.json');
    assert.equal(review.schema_version,1);
    assert.equal(review.kind,'end_consumer_prompt_text_assessment');
    assert.equal(review.profile_id,profile.id);
    assert.equal(review.prompt_id,slot.id);
    assert.equal(review.source_key,key);
    assert.equal(review.source_version,'0');
    assert.equal(review.source_text_sha256,digest(entry.text));
    assert.equal(review.source_text_sha256,slot.text_sha256);
    assert.equal(review.source_text_sha256,model.source.text_sha256);
    assert.equal(review.meta_intent,model.meta_intent.statement);
    assert.equal(review.analyzed_semantic_version,'1');
    assert.equal(review.review_status,'provisional_pending_owner_review');
    assert.equal(review.proposed_verdict,'yes');
    assert.equal(review.owner_meta_intent_approved,false);
    assert.equal(review.owner_assessment_approved,false);
    assert.equal(review.owner_decision,null);
    assert.equal(review.evaluation_basis,'textual_semantics_only');
    assert.equal(review.behavioral_test_status,'not_tested');
    assert.equal(review.effectiveness_claim,'none');
    assert.equal(review.selected_prompt_version,'0');
    assert.equal(review.generated_prompt_version,null);
    assert.equal(review.disposition,'retain_v0_provisionally_no_rewrite');
    assert.deepEqual(review.atomic_intent_coverage.map(x=>x.local_id),model.atomic_intents.map(x=>x.local_id));
    assert.ok(review.atomic_intent_coverage.every(x=>x.assessment.length>6));
    assert.ok(review.applicable_preconditions.length>=3);
    assert.ok(review.failure_conditions.length>=3);
    assert.ok(review.source_text_evidence.every(x=>entry.text.includes(x)));
    assert.equal(model.meta_intent.owner_confirmed,false);
    assert.equal(model.selection.evaluation,'not_started');
    assert.equal(model.selection.generated_prompt_version,null);
  }
  assert.equal(profile.current_version,'0');
  assert.deepEqual(profile.governance.selected_replacement_versions,[]);
});

test('Recovery-family reviews appear individually on the public website as unapproved proposals',()=>{
  const html=fs.readFileSync(path.join(root,'docs/end-consumer-profiles.html'),'utf8');
  for(const key of ['J','L','S','H']){
    const id=profile.slots.find(slot=>slot.key===key).id;
    assert.ok(html.includes('Provisional text assessment · '+key));
    assert.ok(html.includes(id+'.json'));
  }
  assert.equal((html.match(/Formal satisfaction evaluation:<\/strong> not started/g)||[]).length,10);
  assert.equal((html.match(/<details(?:\s[^>]*)?>/g)||[]).length,10);
});

test('D K A assessments remain exact-source-linked, provisional and visible',()=>{
  const html=fs.readFileSync(path.join(root,'docs/end-consumer-profiles.html'),'utf8');
  for(const key of ['D','K','A']){
    const entry=source.entries.find(x=>x.key===key);
    const slot=profile.slots.find(x=>x.key===key);
    const model=analysis.prompts.find(x=>x.source.key===key);
    const review=json('end-consumer-profiles/project-stewardship/v1/evaluations/'+slot.id+'.json');
    assert.equal(review.kind,'end_consumer_prompt_text_assessment');
    assert.equal(review.profile_id,profile.id);
    assert.equal(review.prompt_id,slot.id);
    assert.equal(review.source_key,key);
    assert.equal(review.source_version,'0');
    assert.equal(review.source_text_sha256,digest(entry.text));
    assert.equal(review.source_text_sha256,slot.text_sha256);
    assert.equal(review.source_text_sha256,model.source.text_sha256);
    assert.equal(review.meta_intent,model.meta_intent.statement);
    assert.equal(review.analyzed_semantic_version,'1');
    assert.equal(review.review_status,'provisional_pending_owner_review');
    assert.equal(review.proposed_verdict,'yes');
    assert.equal(review.owner_meta_intent_approved,false);
    assert.equal(review.owner_assessment_approved,false);
    assert.equal(review.owner_decision,null);
    assert.equal(review.evaluation_basis,'textual_semantics_only');
    assert.equal(review.behavioral_test_status,'not_tested');
    assert.equal(review.effectiveness_claim,'none');
    assert.equal(review.selected_prompt_version,'0');
    assert.equal(review.generated_prompt_version,null);
    assert.equal(review.disposition,'retain_v0_provisionally_no_rewrite');
    assert.deepEqual(review.atomic_intent_coverage.map(x=>x.local_id),model.atomic_intents.map(x=>x.local_id));
    assert.ok(review.atomic_intent_coverage.every(x=>x.assessment.length>6));
    assert.ok(review.applicable_preconditions.length>=3);
    assert.ok(review.failure_conditions.length>=3);
    assert.ok(review.source_text_evidence.every(x=>entry.text.includes(x)));
    assert.ok(html.includes('Provisional text assessment · '+key));
    assert.ok(html.includes(slot.id+'.json'));
    assert.equal(model.meta_intent.owner_confirmed,false);
    assert.equal(model.selection.evaluation,'not_started');
  }
  assert.equal(profile.current_version,'0');
  assert.deepEqual(profile.governance.selected_replacement_versions,[]);
  assert.equal((html.match(/<details(?:\s[^>]*)?>/g)||[]).length,10);
});

test('all ten provisional review records preserve source and owner-control boundaries',()=>{
  const html=fs.readFileSync(path.join(root,'docs/end-consumer-profiles.html'),'utf8');
  for(const entry of source.entries){
    const slot=profile.slots.find(x=>x.key===entry.key);
    const model=analysis.prompts.find(x=>x.source.key===entry.key);
    const review=json('end-consumer-profiles/project-stewardship/v1/evaluations/'+slot.id+'.json');
    assert.equal(review.kind,'end_consumer_prompt_text_assessment');
    assert.equal(review.profile_id,profile.id);
    assert.equal(review.prompt_id,slot.id);
    assert.equal(review.source_key,entry.key);
    assert.equal(review.source_version,'0');
    assert.equal(review.source_text_sha256,digest(entry.text));
    assert.equal(review.source_text_sha256,slot.text_sha256);
    assert.equal(review.source_text_sha256,model.source.text_sha256);
    assert.equal(review.meta_intent,model.meta_intent.statement);
    assert.equal(review.review_status,'provisional_pending_owner_review');
    assert.equal(review.owner_meta_intent_approved,false);
    assert.equal(review.owner_assessment_approved,false);
    assert.equal(review.owner_decision,null);
    assert.equal(review.evaluation_basis,'textual_semantics_only');
    assert.equal(review.behavioral_test_status,'not_tested');
    assert.equal(review.effectiveness_claim,'none');
    assert.equal(review.selected_prompt_version,'0');
    assert.equal(review.generated_prompt_version,null);
    assert.deepEqual(review.atomic_intent_coverage.map(x=>x.local_id),model.atomic_intents.map(x=>x.local_id));
    assert.ok(review.source_text_evidence ? review.source_text_evidence.every(x=>entry.text.includes(x)) : true);
    assert.ok(review.applicable_preconditions.length>=3);
    assert.ok(review.failure_conditions.length>=3);
    assert.ok(html.includes('Provisional text assessment · '+entry.key));
    assert.ok(html.includes(slot.id+'.json'));
    assert.equal(model.meta_intent.owner_confirmed,false);
    assert.equal(model.selection.evaluation,'not_started');
  }
  assert.equal(profile.current_version,'0');
  assert.deepEqual(profile.governance.selected_replacement_versions,[]);
  assert.equal((html.match(/<details(?:\s[^>]*)?>/g)||[]).length,10);
});

test('F coverage gap remains a candidate without rewriting V0',()=>{
  const entry=source.entries.find(x=>x.key==='F');
  const slot=profile.slots.find(x=>x.key==='F');
  const review=json('end-consumer-profiles/project-stewardship/v1/evaluations/'+slot.id+'.json');
  const html=fs.readFileSync(path.join(root,'docs/end-consumer-profiles.html'),'utf8');
  assert.equal(review.proposed_verdict,'no');
  assert.equal(review.coverage_gaps.length,1);
  assert.equal(review.coverage_gaps[0].kind,'regression_evidence');
  assert.equal(review.disposition,'targeted_refinement_candidate_pending_owner_review');
  assert.equal(review.generated_prompt_version,null);
  assert.equal(review.source_text_sha256,digest(entry.text));
  assert.ok(html.includes('Provisional text assessment · F'));
  assert.ok(html.includes('Proposed verdict: no.'));
});
