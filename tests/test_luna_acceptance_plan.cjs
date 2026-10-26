'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const runner=require('../tools/run_luna_acceptance.cjs');
test('all three Rust acceptance scenarios produce inert full-profile synthetic plans',()=>{
 for(const name of Object.keys(runner.CASES)){
  const p=runner.run(['--case',name]);
  assert.equal(p.kind,'nomos_synthetic_agent_probe');
  assert.equal(p.source_profile_id,'PROFILE-0004');
  assert.equal(p.profile_finalized,false);
  assert.equal(p.production_export_authorized,false);
  assert.equal(p.synthetic_ad_hoc_selection,true);
  assert.equal(p.selected_rules,106);
  assert.match(p.projection_sha256,/^[0-9a-f]{64}$/);
  assert.equal(p.agent_invoked,false);
  assert.equal(p.status,'planning_only');
 }
});
test('planning is offline and never launches a model, cargo or git',()=>{
 const original=cp.spawnSync;let started=false;
 try{
  cp.spawnSync=()=>{started=true;throw new Error('Unexpected subprocess from planning');};
  const p=runner.run(['--case','RUST-CLI','--model','gpt-6']);
  assert.equal(p.model,'gpt-6');assert.equal(started,false);
 }finally{cp.spawnSync=original;}
});
test('isolated Codex agent execution requires explicit opt in',()=>{
 assert.deepEqual(runner.argsOf(['--case','RUST-CLI']),{case_id:'RUST-CLI',model:null,execute:false});
 assert.deepEqual(runner.argsOf(['--case','RUST-CLI','--execute']).execute,true);
 assert.throws(()=>runner.run([]),/Required/);
 assert.throws(()=>runner.run(['--case','fake']),/Unknown synthetic/);
 assert.throws(()=>runner.run(['--case','RUST-CLI','--model','../../bad']),/model selector/);
 assert.throws(()=>runner.run(['--case','RUST-CLI','--yolo']),/Unknown argument/);
});
test('synthetic plans never mutate actual public draft profile',()=>{
 const catalog=require('../docs/catalog.json'),p=catalog.profiles.find(x=>x.id==='PROFILE-0004');
 const before=JSON.stringify(p);
 const output=runner.plan('RUST-PERSIST');
 assert.equal(output.snapshot.profile_finalized,false);
 assert.equal(JSON.stringify(p),before);
 assert.equal(output.bundle.manifest.agent_target,'codex');
 assert.ok(output.bundle.files.has('.nomos/read-phase.cjs'));
});

test('mocked execution proves disposable workspace and private evidence artifacts without contacting a model',()=>{
 const fs=require('node:fs'),original=cp.spawnSync;
 const seen=[];
 try{
  cp.spawnSync=(exe,args,opts)=>{
   seen.push([exe,...args]);
   return {status:0,signal:null,error:null,stdout:'',stderr:''};
  };
  const report=runner.run(['--case','RUST-CLI','--execute','--model','test-only']);
  try{
   assert.equal(report.agent_invoked,true);
   assert.equal(report.production_accepted,false);
   assert.equal(report.independent_reviewer_accepted,false);
   assert.equal(report.rule_assessments_complete,false);
   assert.match(report.workspace,/nomos-luna-case-/);
   assert.match(report.private_evidence,/nomos-luna-evidence-/);
   assert.ok(fs.existsSync(require('node:path').join(report.workspace,'AGENTS.md')));
   assert.ok(fs.existsSync(require('node:path').join(report.private_evidence,'report.json')));
   const codex=seen.find(c=>c[0]==='codex'&&c[1]==='exec');
   assert.ok(codex,'Expected subprocess-shaped evaluation call');
   assert.ok(codex.includes('workspace-write'));
   assert.ok(codex.includes('--ephemeral'));
   assert.ok(!codex.includes('--yolo'));
  }finally{
   fs.rmSync(report.workspace,{recursive:true,force:true});
   fs.rmSync(report.private_evidence,{recursive:true,force:true});
  }
 }finally{cp.spawnSync=original;}
});
