'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validate}=require('../tools/validate_agent_run_evidence.cjs');
const a='a'.repeat(64),b='b'.repeat(64),c='c'.repeat(64);
const manifest={
 kind:'nomos_agent_package',schema_version:1,agent_target:'generic',
 projection_sha256:a,registry_revision_sha256:b,
 files:{'.nomos/rules/testing.md':c},
 phase_routes:{planning:[],testing:['.nomos/rules/testing.md']},
 rules:{'NOM-0008':{path:'.nomos/rules/testing.md'},
   'NOM-0029':{path:'.nomos/rules/testing.md'}}
};
function receipt(phase='testing'){
 return {kind:'nomos_phase_read_receipt',schema_version:1,phase,package_verified:true,
  projection_sha256:a,registry_revision_sha256:b,agent_target:'generic',
  verified_files:6,modules:phase==='testing'?[{relative_path:'.nomos/rules/testing.md',sha256:c,bytes:57}]:[]};
}
function report(){
 return {kind:'nomos_agent_run_evidence',schema_version:1,
  projection_sha256:a,registry_revision_sha256:b,agent_target:'generic',
  expected_phases:['testing'],
  events:[
   {id:'read-testing',kind:'module_read',source:'tool_trace',exit_code:0,output_sha256:a,receipt:receipt()},
   {id:'test-success',kind:'test',source:'tool_trace',exit_code:0,output_sha256:b}
  ],
  rule_assessments:[
   {rule_id:'NOM-0008',disposition:'satisfied',evidence_event_ids:['test-success']},
   {rule_id:'NOM-0029',disposition:'satisfied',evidence_event_ids:['test-success']}
  ]};
}
test('complete synthetic trace is mechanically ready for independent review, never auto-accepted',()=>{
 const v=validate(report(),manifest);
 assert.equal(v.status,'ready_for_independent_review');
 assert.equal(v.agent_compliance_proven,false);
 assert.deepEqual(v.violations,[]);
 assert.deepEqual(v.gaps,[]);
});
test('model text, module reads and missing tool actions cannot independently prove satisfaction',()=>{
 const r=report();
 r.events=r.events.filter(e=>e.kind==='module_read');
 r.rule_assessments[0].evidence_event_ids=['read-testing'];
 r.rule_assessments[1].disposition='unobserved';
 r.rule_assessments[1].evidence_event_ids=[];
 const v=validate(r,manifest);
 assert.equal(v.status,'incomplete');
 assert.ok(v.gaps.some(g=>g.includes('No successful action')));
 assert.ok(v.gaps.some(g=>g.includes('Unobserved rule')));
});
test('recorded violations require remediation even when other signals are successful',()=>{
 const r=report();
 r.rule_assessments[1].disposition='violated';
 assert.equal(validate(r,manifest).status,'requires_remediation');
});
test('unread phases cannot be silently claimed from unrelated tools',()=>{
 const r=report();r.expected_phases=['planning','testing'];
 const result=validate(r,manifest);
 assert.equal(result.status,'incomplete');
 assert.ok(result.gaps.some(x=>x.includes('planning')));
});
test('forged source and missing module fingerprints are rejected',()=>{
 const r=report();r.events[0].receipt.modules[0].sha256='0'.repeat(64);
 assert.throws(()=>validate(r,manifest),/exact source modules/);
 const other=report();other.registry_revision_sha256='0'.repeat(64);
 assert.throws(()=>validate(other,manifest),/pinned package/);
});
test('unobserved textual assertion is not a trusted event',()=>{
 const r=report();r.events[0].source='agent_said_it';
 assert.throws(()=>validate(r,manifest),/tool trace/);
});
test('duplicate rule assessments and missing evidence references fail closed',()=>{
 const r=report();r.rule_assessments.push(structuredClone(r.rule_assessments[0]));
 assert.throws(()=>validate(r,manifest),/duplicate assessed rule/);
 const r2=report();r2.rule_assessments[0].evidence_event_ids=['nonexistent'];
 assert.throws(()=>validate(r2,manifest),/Unbacked evidence/);
});

