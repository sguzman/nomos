'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {check}=require('../tools/validate_strict_port_coverage.cjs');
const a=require('../audits/strict-port-coverage-2026-10-25.json');
test('profile audit anchors 25 evidence-labelled candidate obligations',()=>{
 const info=check();
 assert.equal(info.candidate_count,25);assert.equal(info.general,7);assert.equal(info.python,18);
 assert.equal(a.reviewed_profile.id,'PROFILE-0012');
 assert.equal(a.candidates.filter(x=>x.disposition==='unrepresented_as_atomic_rule').length+
   a.candidates.filter(x=>x.disposition==='partially_covered_by_existing_rules').length,25);
});
test('reusable port candidates never misrepresent Python rules as C-specific',()=>{
 for(const row of a.candidates){
  if(row.applicability_scope==='software_port')
   assert.equal(row.transfer_to_profiles.length,6);
  else assert.deepEqual(row.transfer_to_profiles,['PROFILE-0011','PROFILE-0012']);
  assert.ok(row.existing_support_ids.every(id=>/^NOM-\d{4}$/.test(id)));
 }
 for(const x of a.shared_analogues)
  assert.equal(x.disposition,'not_directly_applicable_to_python');
});
test('review artifacts do not change or finalize unconfirmed profile or ontology',()=>{
 const profile=require('../profiles/PROFILE-0012.json');
 assert.equal(profile.status,'draft');assert.equal(profile.review.selection_confirmed,false);
 assert.equal(profile.review.finalization_confirmed,false);
 assert.equal(a.reviewed_profile.selected_rule_count,90); // Historic review baseline
 assert.equal(profile.selected_rule_ids.length,132); // Subsequently authorized remediation
 assert.equal(a.boundaries.no_new_rule_records,true);
 assert.equal(a.boundaries.no_new_formal_situations_or_intents,true);
 assert.equal(a.boundaries.no_profile_membership_changes,true);
});

test('atomicity review covers every original candidate without publishing duplicate rules',()=>{
 const items=a.atomicity_review.entries;
 assert.equal(items.length,25);
 assert.equal(new Set(items.map(x=>x.id)).size,25);
 const counts={single_candidate:7,decompose:16,reuse_existing:2};
 for(const [kind,n] of Object.entries(counts))assert.equal(items.filter(x=>x.disposition===kind).length,n);
 assert.equal(items.find(x=>x.id==='PORT-05').disposition,'reuse_existing');
 assert.equal(items.find(x=>x.id==='PY-17').disposition,'reuse_existing');
 assert.ok(items.find(x=>x.id==='PORT-01').normalized_parts.some(p=>p.includes('Python')));
 assert.ok(items.every(x=>x.status==='proposed_not_authorized_to_publish'));
});
