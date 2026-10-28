'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const v0=json('end-consumer-profiles/project-stewardship/v0/trievium.json');
const profile=json('end-consumer-profiles/project-stewardship/profile.json');
const meta=json('end-consumer-profiles/project-stewardship/v1/meta-intent-approval.json');
const candidates=json('end-consumer-profiles/project-stewardship/v2/review-candidates.json');
const scenarios=json('end-consumer-profiles/project-stewardship/v2/scenario-specification.json');
const sha=s=>createHash('sha256').update(s).digest('hex');
test('three original reviewed candidates are source-linked and V0 remains immutable',()=>{
 assert.deepEqual(candidates.candidates.map(c=>c.key),['L','H','F']);
 assert.equal(candidates.owner_approval_of_candidates,false);
 assert.equal(candidates.export_selected_version,'0');
 assert.equal(candidates.observed_agent_test_runs,0);
 for(const c of candidates.candidates){
  const i=v0.entries.findIndex(e=>e.key===c.key);
  assert.ok(i>=0);
  assert.equal(c.prompt_id,profile.slots[i].id);
  assert.equal(c.source_text_sha256,sha(v0.entries[i].text));
  assert.equal(c.meta_intent,meta.entries[i].statement);
  assert.equal(meta.entries[i].owner_approved,true);
  assert.equal(c.status,'proposed_unselected_not_published');
  assert.notEqual(c.candidate_text,v0.entries[i].text);
 }
 assert.deepEqual(profile.governance.selected_replacement_versions,[]);
 const selected=json('docs/data/project-stewardship-published-versions.json');
 assert.equal(selected.published_versions.length,3);
 assert.deepEqual(selected.published_versions.map(x=>x.key),['L','H','F']);
 assert.deepEqual(Object.keys(selected.selected_versions),['EC-PROMPT-0002','EC-PROMPT-0004','EC-PROMPT-0008']);
});
test('F revision consists of one targeted insertion without rewriting V0 sentences',()=>{
 const old=v0.entries.find(e=>e.key==='F').text;
 const revised=candidates.candidates.find(e=>e.key==='F').candidate_text;
 const added='Where practical, run or add a focused regression test for the reported defect and check relevant previously working behavior. If reproduction, regression checks, or runtime QA cannot be performed, report exactly what remains unverified; do not claim non-regression without evidence.\n\n';
 assert.equal(revised.replace(added,''),old);
});
test('17 synthetic scenarios are text-contract probes, not observed agent runs',()=>{
 assert.equal(scenarios.cases.length,17);
 assert.equal(scenarios.status,'textual_evidence_only');
 const observed=new Set();
 for(const scenario of scenarios.cases){
  assert.ok(!observed.has(scenario.id));observed.add(scenario.id);
  const c=candidates.candidates.find(x=>x.key===scenario.key);
  assert.ok(c);
  assert.equal(scenario.observed_agent_result,null);
  assert.equal(scenario.evidence,'static_text_contract_only');
  assert.ok(['explicit','contextual','not_explicit'].includes(scenario.original_coverage));
  assert.equal(scenario.candidate_coverage,'explicit_text_contract');
  assert.ok(scenario.original_coverage_rationale.length>=15);
  const original=v0.entries.find(x=>x.key===scenario.key)?.text;
  assert.ok(original,'Scenario must reference a real V0 prompt');
  if(scenario.original_evidence_phrase)assert.ok(original.includes(scenario.original_evidence_phrase),scenario.id);

  assert.ok(c.candidate_text.toLowerCase().includes(scenario.required_text.toLowerCase()),scenario.id);
 }
});

test('textual coverage counts are reproducible, not empirical agent outcomes',()=>{
 const coverage={explicit:0,contextual:0,not_explicit:0};
 for(const s of scenarios.cases)coverage[s.original_coverage]++;
 assert.deepEqual(coverage,scenarios.original_coverage_summary);
 assert.equal(candidates.observed_agent_test_runs,0);
 assert.match(scenarios.review_method,/not independent agent execution/);
});
