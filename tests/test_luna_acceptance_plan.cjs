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
  const sourceProfile=require('../docs/catalog.json').profiles.find(x=>x.id==='PROFILE-0004');
  assert.ok(sourceProfile?.selected_rule_ids?.length>0);
  assert.equal(p.selected_rules,sourceProfile.selected_rule_ids.length);
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
   if(exe==='codex'&&args.includes('--json'))return {status:0,signal:null,error:null,stdout:'{"type":"thread.started","thread_id":"synthetic-test"}\n{"type":"turn.completed"}\n',stderr:''};
   return {status:0,signal:null,error:null,stdout:'',stderr:''};
  };
  const report=runner.run(['--case','RUST-CLI','--execute','--model','test-only']);
  try{
   assert.equal(report.agent_invoked,true);
   assert.equal(report.agent_turn_completed,true);
   assert.equal(report.production_accepted,false);
   assert.equal(report.independent_reviewer_accepted,false);
   assert.equal(report.rule_assessments_complete,false);
   assert.match(report.workspace,/nomos-luna-case-/);
   assert.match(report.private_evidence,/nomos-luna-evidence-/);
   assert.ok(fs.existsSync(require('node:path').join(report.workspace,'AGENTS.md')));
   assert.ok(fs.existsSync(require('node:path').join(report.private_evidence,'report.json')));
   const codex=seen.find(c=>c[0]==='codex'&&c.includes('--json'));
   assert.ok(codex,'Expected subprocess-shaped evaluation call');
   assert.deepEqual(codex.slice(1,4),['--ask-for-approval','never','exec']);
   assert.ok(codex.includes('workspace-write'));
   assert.ok(codex.includes('--ephemeral'));
   assert.ok(!codex.includes('--yolo'));
  }finally{
   fs.rmSync(report.workspace,{recursive:true,force:true});
   fs.rmSync(report.private_evidence,{recursive:true,force:true});
  }
 }finally{cp.spawnSync=original;}
});

test('parser failure is launch_failed and cannot claim a live or accepted agent',()=>{
 const fs=require('node:fs'),path=require('node:path'),original=cp.spawnSync,seen=[];
 try{
  cp.spawnSync=(exe,args)=>{
   seen.push([exe,...args]);
   if(exe==='codex'&&args.includes('--json'))return {status:2,signal:null,error:null,stdout:'',stderr:"error: unexpected argument '--ask-for-approval' found"};
   return {status:0,signal:null,error:null,stdout:'ok',stderr:''};
  };
  const report=runner.run(['--case','RUST-CLI','--execute']);
  try{
   assert.equal(report.status,'launch_failed');
   assert.equal(report.invocation_attempted,true);
   assert.equal(report.session_started,false);
   assert.equal(report.agent_invoked,false);
   assert.equal(report.agent_turn_completed,false);
   assert.equal(report.independent_reviewer_accepted,false);
   assert.equal(report.production_accepted,false);
   assert.equal(report.observed_phase_reads,0);
   const codex=seen.find(c=>c[0]==='codex'&&c.includes('--json'));
   assert.deepEqual(codex.slice(1,4),['--ask-for-approval','never','exec']);
   assert.equal(fs.readFileSync(path.join(report.private_evidence,'agent-events.jsonl'),'utf8'),'');
  }finally{fs.rmSync(report.workspace,{recursive:true,force:true});fs.rmSync(report.private_evidence,{recursive:true,force:true});}
 }finally{cp.spawnSync=original;}
});

test('incompatible CLI parser fails before any temporary workspace is created',()=>{
 const original=cp.spawnSync,seen=[];
 try{
  cp.spawnSync=(exe,args)=>{seen.push([exe,...args]);
   if(exe==='codex'&&args[0]==='--ask-for-approval')return {status:2,signal:null,error:null,stdout:'',stderr:'unsupported approval option'};
   return {status:0,signal:null,error:null,stdout:'tool 1.0',stderr:''};};
  assert.throws(()=>runner.run(['--case','RUST-CLI','--execute']),/Codex CLI is incompatible.*unsupported approval option/);
  assert.ok(seen.some(c=>c[0]==='codex'&&c.slice(1).join(' ')==='--ask-for-approval never exec --help'));
  assert.ok(!seen.some(c=>c[0]==='git'&&c.includes('init')));
 }finally{cp.spawnSync=original;}
});

test('started session without turn.completed is not a completed agent turn',()=>{
 const fs=require('node:fs'),cp=require('node:child_process'),original=cp.spawnSync;
 try{
  cp.spawnSync=(exe,args)=>({status:0,signal:null,error:null,
   stdout:exe==='codex'&&args.includes('--json')?'{"type":"thread.started","thread_id":"incomplete"}\n':'ok',stderr:''});
  const report=runner.run(['--case','RUST-CLI','--execute']);
  try{
   assert.equal(report.session_started,true);
   assert.equal(report.agent_turn_completed,false);
   assert.equal(report.status,'agent_turn_failed');
   assert.equal(report.production_accepted,false);
  }finally{fs.rmSync(report.workspace,{recursive:true,force:true});fs.rmSync(report.private_evidence,{recursive:true,force:true});}
 }finally{cp.spawnSync=original;}
});

test('disposable Git identity and post-baseline commit are required for workflow evidence',()=>{
 const fs=require('node:fs'),cp=require('node:child_process'),original=cp.spawnSync,seen=[];
 try{
  cp.spawnSync=(exe,args)=>{
   seen.push([exe,...args]);
   if(exe==='git'&&args[0]==='rev-list')
    return {status:0,signal:null,error:null,stdout:'2\n',stderr:''};
   if(exe==='codex'&&args.includes('--json'))
    return {status:0,signal:null,error:null,stdout:'{"type":"thread.started"}\n{"type":"turn.completed"}\n',stderr:''};
   return {status:0,signal:null,error:null,stdout:'',stderr:''};
  };
  const report=runner.run(['--case','RUST-CLI','--execute']);
  try{
   assert.ok(seen.some(c=>c[0]==='git'&&c.slice(1,5).join(' ')==='config --local user.name Nomos QA'));
   assert.ok(seen.some(c=>c[0]==='git'&&c.slice(1,4).join(' ')==='config --local user.email'));
   assert.equal(report.agent_created_commit_count,1);
   assert.equal(report.worktree_clean,true);
   assert.equal(report.agent_workflow_requirements_met,true);
   assert.equal(report.status,'awaiting_independent_review');
   assert.equal(report.independent_reviewer_accepted,false);
   assert.equal(report.production_accepted,false);
  }finally{fs.rmSync(report.workspace,{recursive:true,force:true});fs.rmSync(report.private_evidence,{recursive:true,force:true});}
 }finally{cp.spawnSync=original;}
});

test('Codex turn with only baseline commit and dirty workspace fails mechanical workflow gate',()=>{
 const fs=require('node:fs'),cp=require('node:child_process'),original=cp.spawnSync;
 try{
  cp.spawnSync=(exe,args)=>{
   if(exe==='git'&&args[0]==='rev-list')
    return {status:0,signal:null,error:null,stdout:'1\n',stderr:''};
   if(exe==='git'&&args[0]==='status')
    return {status:0,signal:null,error:null,stdout:' M src/main.rs\n',stderr:''};
   if(exe==='codex'&&args.includes('--json'))
    return {status:0,signal:null,error:null,stdout:'{"type":"thread.started"}\n{"type":"turn.completed"}\n',stderr:''};
   return {status:0,signal:null,error:null,stdout:'',stderr:''};
  };
  const report=runner.run(['--case','RUST-CLI','--execute']);
  try{
   assert.equal(report.agent_turn_completed,true);
   assert.equal(report.agent_created_commit_count,0);
   assert.equal(report.worktree_clean,false);
   assert.equal(report.agent_workflow_requirements_met,false);
   assert.equal(report.status,'agent_workflow_incomplete');
   assert.equal(report.independent_reviewer_accepted,false);
  }finally{fs.rmSync(report.workspace,{recursive:true,force:true});fs.rmSync(report.private_evidence,{recursive:true,force:true});}
 }finally{cp.spawnSync=original;}
});
