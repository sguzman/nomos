'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {observe}=require('../tools/codex_trace_observer.cjs');
const sha=x=>x.repeat(64);
const manifest={kind:'nomos_agent_package',schema_version:1,agent_target:'codex',
 projection_sha256:sha('a'),registry_revision_sha256:sha('b'),
 files:{'.nomos/rules/testing.md':sha('c')},
 rules:{'NOM-0008':{path:'.nomos/rules/testing.md'}},
 phase_routes:{testing:['.nomos/rules/testing.md'],planning:[],implementation:[],shutdown:[]}};
const receipt={kind:'nomos_phase_read_receipt',schema_version:1,phase:'testing',
 projection_sha256:sha('a'),registry_revision_sha256:sha('b'),
 agent_target:'codex',package_verified:true,verified_files:5,
 modules:[{relative_path:'.nomos/rules/testing.md',sha256:sha('c'),bytes:42}]};
const event=(command,output='',exit_code=0)=>JSON.stringify({
 type:'item.completed',item:{type:'command_execution',command,aggregated_output:output,exit_code}
});
test('observes executed phase-reader events, but never infers applied source-rule compliance',()=>{
 const stream=event('node .nomos/read-phase.cjs testing','NOMOS_PHASE_READ '+JSON.stringify(receipt)+'\nmodule body\n')+
  '\n'+event('cargo test --offline','test result: ok',0);
 const result=observe(stream,manifest,['testing']);
 assert.equal(result.parser_summary.observed_module_reads,1);
 assert.equal(result.parser_summary.cargo_test_events,1);
 assert.equal(result.report.events[0].receipt.package_verified,true);
 assert.equal(result.report.rule_assessments[0].disposition,'unobserved');
 assert.equal(result.review.agent_compliance_proven,false);
 assert.equal(result.review.status,'incomplete');
});
test('assistant statements without tool commands are never counted as phase reads',()=>{
 const stream=JSON.stringify({type:'item.completed',item:{type:'agent_message',
  text:'I used all Nomos phases and everything passed'}})+'\n';
 const result=observe(stream,manifest,['testing']);
 assert.equal(result.parser_summary.recorded_commands,0);
 assert.equal(result.parser_summary.observed_module_reads,0);
 assert.ok(result.review.gaps.some(x=>x.includes('No observed verified module read')));
});
test('mismatched or altered receipt is rejected rather than silently accepted',()=>{
 const bad={...receipt,phase:'planning'};
 assert.throws(()=>observe(event('node .nomos/read-phase.cjs testing',
  'NOMOS_PHASE_READ '+JSON.stringify(bad)),manifest,['testing']),/differ/);
 const altered={...receipt,modules:[{...receipt.modules[0],sha256:sha('0')}]};
 assert.throws(()=>observe(event('node .nomos/read-phase.cjs testing',
  'NOMOS_PHASE_READ '+JSON.stringify(altered)),manifest,['testing']),/exact source modules/);
});
test('unrecognized stream and unsafe format inputs fail closed',()=>{
 assert.throws(()=>observe('{not-json}',manifest,['testing']),/Invalid Codex JSONL/);
 assert.throws(()=>observe('',{...manifest,agent_target:'unknown'},['testing']),/Codex-targeted/);
});
