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
 assert.deepEqual(runner.argsOf(['--case','RUST-CLI']),{case_id:'RUST-CLI',model:null,target:'codex',execute:false,probe_sandbox:false});
 assert.deepEqual(runner.argsOf(['--case','RUST-CLI','--execute']).execute,true);
 assert.throws(()=>runner.run([]),/Required/);
 assert.throws(()=>runner.run(['--case','fake']),/Unknown synthetic/);
 assert.throws(()=>runner.run(['--case','RUST-CLI','--model','../../bad']),/model selector/);
 assert.throws(()=>runner.run(['--case','RUST-CLI','--yolo']),/Unknown argument/);
});
test('generic entrypoint evidence requires an actual successful file-tool read',()=>{
 const check=runner.observeGenericEntrypointRead;
 const entry={type:'item.completed',item:{type:'command_execution',exit_code:0,
  command:"/usr/bin/bash -lc 'cat AGENTS.md'",
  aggregated_output:"# Generated Nomos agent contract\nAgent target: generic\n"}};
 const text=JSON.stringify(entry);
 assert.equal(check(text),true);
 assert.equal(check(JSON.stringify({...entry,item:{...entry.item,exit_code:1}})),false);
 assert.equal(check(JSON.stringify({...entry,item:{...entry.item,
  aggregated_output:'# Generated Nomos agent contract\nAgent target: codex\n'}})),false);
 assert.equal(check(JSON.stringify({...entry,item:{...entry.item,command:"echo 'cat AGENTS.md'"}})),false);
 assert.equal(check(JSON.stringify({type:'item.completed',item:{type:'agent_message',
  text:'I read AGENTS.md and followed the generic rules.'}})),false);
 assert.equal(check('broken-jsonl\n'),false);
});

test('mixed-scope generic fallback generates an explicit Markdown-only package',()=>{
 const p=runner.plan('RUST-MIXED',null,'generic');
 assert.equal(p.bundle.manifest.agent_target,'generic');
 assert.equal(p.snapshot.agent_target,'generic');
 assert.ok(p.bundle.files.has('AGENTS.md'));
 assert.ok(p.bundle.files.has('.nomos/read-phase.cjs'));
 assert.equal([...p.bundle.files.keys()].some(x=>x.startsWith('.agents/skills/')),false);
 assert.match(p.bundle.files.get('AGENTS.md'),/Agent target: generic/);
 assert.equal(runner.argsOf(['--case','RUST-MIXED','--target','generic']).target,'generic');
 assert.throws(()=>runner.argsOf(['--case','RUST-MIXED','--target','unknown']),/Invalid agent package target/);
 assert.throws(()=>runner.plan('RUST-MIXED',null,'unknown'),/Unsupported synthetic agent package target/);
 assert.equal(runner.run(['--case','RUST-MIXED','--target','generic']).status,'planning_only');
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
   assert.deepEqual(codex.slice(1,3),['--ask-for-approval','never']);
   assert.ok(codex.includes('exec'));
   assert.ok(codex.includes('default_permissions="nomos_disposable_git"'));
   assert.ok(codex.includes('permissions.nomos_disposable_git.extends=":workspace"'));
   assert.ok(codex.includes('permissions.nomos_disposable_git.filesystem={":workspace_roots"={".git"="write"}}'));
   assert.ok(codex.includes('permissions.nomos_disposable_git.network.enabled=false'));
   assert.ok(codex.includes('--ephemeral'));
   assert.ok(!codex.includes('--yolo'));
   assert.ok(!codex.includes('danger-full-access'));
  }finally{
   fs.rmSync(report.workspace,{recursive:true,force:true});
   fs.rmSync(report.private_evidence,{recursive:true,force:true});
  }
 }finally{cp.spawnSync=original;}
});

test('sandbox permission dry check prepares temporary Git without launching a model',()=>{
 const cp=require('node:child_process'),original=cp.spawnSync,seen=[];
 try{
  cp.spawnSync=(exe,args)=>{seen.push({exe,args});return {status:0,stdout:'',stderr:''};};
  const result=runner.run(['--case','RUST-CLI','--probe-sandbox']);
  assert.equal(result.status,'disposable_git_sandbox_probe_passed');
  assert.equal(result.agent_invoked,false);
  assert.equal(result.production_accepted,false);
  assert.ok(seen.some(x=>x.exe==='git'&&x.args[0]==='init'));
  assert.ok(seen.some(x=>x.exe==='codex'&&x.args.includes('sandbox')&&x.args.includes('--permission-profile')));
  assert.ok(!seen.some(x=>x.exe==='codex'&&x.args.includes('--json')));
  assert.ok(!seen.some(x=>x.exe==='cargo'&&x.args[0]!=='--version'));
  assert.throws(()=>runner.argsOf(['--case','RUST-CLI','--probe-sandbox','--execute']),/cannot combine/);
 }finally{cp.spawnSync=original;}
});
test('temporary Git permission profile stays in Codex invocation only',()=>{
 const argv=runner.codexArgs('/tmp/nomos-luna-case-example','gpt-6-luna');
 assert.deepEqual(argv.slice(0,2),['--ask-for-approval','never']);
 assert.ok(argv.includes('default_permissions="nomos_disposable_git"'));
 assert.ok(argv.includes('permissions.nomos_disposable_git.extends=":workspace"'));
 assert.ok(argv.includes('permissions.nomos_disposable_git.filesystem={":workspace_roots"={".git"="write"}}'));
 assert.ok(argv.includes('permissions.nomos_disposable_git.network.enabled=false'));
 assert.ok(argv.includes('--cd'));
 assert.ok(argv.includes('/tmp/nomos-luna-case-example'));
 assert.ok(argv.includes('gpt-6-luna'));
 assert.ok(!argv.includes('--sandbox'));
 assert.ok(!argv.some(value=>value.includes('filesystem.":workspace_roots"')),'No incorrectly quoted CLI dotted-path');
 assert.ok(!argv.includes('danger-full-access'));
 assert.ok(!argv.includes('--yolo'));
 const help=runner.codexArgs('/tmp/nomos-luna-case-example',null,true);
 assert.equal(help.at(-1),'--help');
 assert.ok(!help.includes('--json'));
});
test('opt-in disposable evaluation disables sccache only inside child process',()=>{
 const fs=require('node:fs'),original=cp.spawnSync,commands=[];
 try{
  cp.spawnSync=(exe,args,options)=>{
   commands.push({exe,args,env:options.env,input:options.input});
   if(exe==='git'&&args[0]==='rev-list')return {status:0,stdout:'2\n',stderr:''};
   if(exe==='codex'&&args.includes('--json'))return {status:0,stdout:'{"type":"thread.started"}\n{"type":"turn.completed"}\n',stderr:''};
   return {status:0,stdout:'',stderr:''};
  };
  const report=runner.run(['--case','RUST-CLI','--execute']);
  try{
   for(const result of commands.filter(x=>x.exe==='codex'&&x.args.includes('--json')||x.exe==='cargo'&&x.args[0]==='test')){
    assert.equal(result.env.RUSTC_WRAPPER,'');
   }
   assert.equal(report.code_test_commit_gate_met,true);
   const invocation=commands.find(x=>x.exe==='codex'&&x.args.includes('--json'));
   assert.match(invocation.input,/new project being created from scratch/);
   assert.match(invocation.input,/temporary cargo-init scaffolding/);
   assert.match(invocation.input,/\.nomos\/projection\.json/);
   assert.match(invocation.input,/reconcile ROADMAP.md status text against the actual committed HEAD/);
   assert.match(invocation.input,/NOM-0068 through NOM-0072/);
   assert.match(invocation.input,/matching visual progress bar/);
   assert.match(invocation.input,/every touched roadmap phase, milestone, feature AND subtask separately/);
   assert.match(invocation.input,/100% AND a matching visual progress bar on the item's OWN line/);
  }finally{fs.rmSync(report.workspace,{recursive:true,force:true});fs.rmSync(report.private_evidence,{recursive:true,force:true});}
 }finally{cp.spawnSync=original;}
});
test('Linux sandbox Git-write probe is model-free, narrow and stops on denial',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-sandbox-probe-test-'));
 const original=cp.spawnSync,seen=[];
 try{
  fs.mkdirSync(path.join(root,'.git'));
  cp.spawnSync=(exe,args)=>{
   seen.push({exe,args});
   return {status:0,stdout:'',stderr:''};
  };
  assert.equal(runner.probeDisposableGitSandbox(root),true);
  assert.equal(seen.length,1);
  const args=seen[0].args;
  assert.equal(seen[0].exe,'codex');
  assert.equal(args[0],'-c');
  assert.equal(args.filter(x=>x==='sandbox').length,1);
  assert.ok(!args.includes('linux'));
  assert.ok(args.indexOf('sandbox')<args.indexOf('--permission-profile'));
  assert.ok(args.indexOf('--')>args.indexOf('--cd'));
  assert.equal(args[args.indexOf('--')+1],'/bin/sh');
  assert.ok(args.includes('--permission-profile'));
  assert.ok(args.includes('nomos_disposable_git'));
  assert.ok(args.includes('permissions.nomos_disposable_git.network.enabled=false'));
  assert.ok(args.includes('/bin/sh'));
  assert.ok(args.includes('nomos-write-permission-probe')===false);
  assert.ok(args.at(-1).includes('nomos-write-permission-probe'));
  assert.ok(!args.includes('--json'));
  assert.ok(!args.includes('--yolo'));
  cp.spawnSync=()=>({status:1,stdout:'',stderr:'Read-only file system'});
  assert.throws(()=>runner.probeDisposableGitSandbox(root),/no model launched.*Read-only file system/);
 }finally{cp.spawnSync=original;fs.rmSync(root,{recursive:true,force:true});}
});
test('post-run reviewer facts distinguish documentation, CI and lint gaps from an agent-turn success',()=>{
 const fs=require('node:fs'),cp=require('node:child_process'),original=cp.spawnSync;
 try{
  cp.spawnSync=(exe,args)=>{
   if(exe==='git'&&args[0]==='rev-list')return {status:0,stdout:'2\n',stderr:''};
   if(exe==='cargo'&&args[0]==='fmt')return {status:1,stdout:'',stderr:'would reformat'};
   if(exe==='cargo'&&args[0]==='clippy')return {status:1,stdout:'',stderr:'component not available'};
   if(exe==='codex'&&args.includes('--json'))return {status:0,stdout:'{"type":"thread.started"}\n{"type":"turn.completed"}\n',stderr:''};
   return {status:0,stdout:'',stderr:''};
  };
  const report=runner.run(['--case','RUST-CLI','--execute']);
  try{
   assert.equal(report.agent_turn_completed,true);
   assert.equal(report.code_test_commit_gate_met,true);
   assert.deepEqual(report.repository_artifact_observations,{
    readme_present:false,roadmap_present:false,ci_workflow_present:false
   });
   assert.deepEqual(report.independent_review_gaps,[
    'missing_readme','missing_roadmap','missing_ci_workflow',
    'cargo_fmt_not_verified','cargo_clippy_not_verified'
   ]);
   assert.equal(report.artifact_preflight_met,false);
   assert.equal(report.status,'requires_artifact_remediation');
   assert.equal(report.evidence_summary.cargo_fmt.exit_code,1);
   assert.equal(report.evidence_summary.cargo_clippy.exit_code,1);
   assert.equal(report.independent_reviewer_accepted,false);
  }finally{fs.rmSync(report.workspace,{recursive:true,force:true});fs.rmSync(report.private_evidence,{recursive:true,force:true});}
 }finally{cp.spawnSync=original;}
});

test('review artifact detection observes populated disposable project without granting conformance',()=>{
 const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),original=cp.spawnSync;
 try{
  cp.spawnSync=(exe,args)=>{
   if(exe==='git'&&args[0]==='rev-list')return {status:0,stdout:'2\n',stderr:''};
   if(exe==='codex'&&args.includes('--json')){
    const root=args[args.indexOf('--cd')+1];
    fs.writeFileSync(path.join(root,'README.md'),'# Synthetic test\n');
    fs.writeFileSync(path.join(root,'ROADMAP.md'),"# Roadmap\n## 🧭 Phase 1 — Core\n### 🏁 Milestone 1 — CLI\n#### 🧩 Features\n- 📝 Normalize input — ✅ done\n#### 🔧 Subtasks\n- 🧪 Write unit tests — ✅ done\n- 🔎 Check integration — ✅ done\n");
    fs.mkdirSync(path.join(root,'.github','workflows'),{recursive:true});
    fs.writeFileSync(path.join(root,'.github','workflows','rust.yml'),'name: CI\n');
    return {status:0,stdout:'{"type":"thread.started"}\n{"type":"turn.completed"}\n',stderr:''};
   }
   return {status:0,stdout:'',stderr:''};
  };
  const report=runner.run(['--case','RUST-CLI','--execute']);
  try{
   assert.deepEqual(report.repository_artifact_observations,{
    readme_present:true,roadmap_present:true,ci_workflow_present:true
   });
   assert.deepEqual(report.independent_review_gaps,[]);
    assert.equal(report.artifact_preflight_met,true);
    assert.equal(report.status,'awaiting_independent_review');
   assert.equal(report.independent_reviewer_accepted,false);
   assert.equal(report.production_accepted,false);
  }finally{fs.rmSync(report.workspace,{recursive:true,force:true});fs.rmSync(report.private_evidence,{recursive:true,force:true});}
 }finally{cp.spawnSync=original;}
});

test('Rust CLI acceptance scenario requires a real CI workflow to satisfy EVAL-08',()=>{
 const task=runner.CASES['RUST-CLI'].task;
 assert.match(task,/GitHub Actions CI workflow/);
 assert.match(task,/formatting/);
 assert.match(task,/Clippy/);
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
   assert.deepEqual(codex.slice(1,3),['--ask-for-approval','never']);
   assert.ok(codex.includes('default_permissions="nomos_disposable_git"'));
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
  assert.ok(seen.some(c=>c[0]==='codex'&&c.includes('--help')&&c.includes('default_permissions="nomos_disposable_git"')));
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
   assert.equal(report.code_test_commit_gate_met,true);
   assert.equal(report.artifact_preflight_met,false);
    assert.equal(report.status,'requires_artifact_remediation');
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
   assert.equal(report.code_test_commit_gate_met,false);
   assert.equal(report.status,'agent_workflow_incomplete');
   assert.equal(report.independent_reviewer_accepted,false);
  }finally{fs.rmSync(report.workspace,{recursive:true,force:true});fs.rmSync(report.private_evidence,{recursive:true,force:true});}
 }finally{cp.spawnSync=original;}
});


test('private review archive preserves evidence and project source but excludes Git internals and build output',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const cp=require('node:child_process');
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-review-archive-test-'));
 const root=path.join(base,'project'),evidence=path.join(base,'evidence');
 try{
  fs.mkdirSync(root);fs.mkdirSync(evidence,{mode:0o700});
  fs.mkdirSync(path.join(root,'.git'));fs.mkdirSync(path.join(root,'target'));
  fs.mkdirSync(path.join(root,'src'));
  fs.writeFileSync(path.join(root,'.git','secret'),'private git data');
  fs.writeFileSync(path.join(root,'target','debug'),'build binary');
  fs.writeFileSync(path.join(root,'src','main.rs'),'fn main() {}\\n');
  fs.writeFileSync(path.join(evidence,'README-review.txt'),'Private: inspect before sharing\\n');
  fs.writeFileSync(path.join(evidence,'report.json'),'{"synthetic":true}\\n');
  fs.writeFileSync(path.join(evidence,'agent-events.jsonl'),'{"type":"thread.started"}\\n');
  fs.writeFileSync(path.join(evidence,'agent-commit.patch'),'diff --git a/src/main.rs b/src/main.rs\\n');
  const archive=runner.createReviewBundle(root,evidence);
  assert.ok(archive.sha256.match(/^[a-f0-9]{64}$/));
  assert.ok(archive.bytes>0);
  assert.equal(fs.statSync(archive.path).mode&0o777,0o600);
  const listing=cp.spawnSync('tar',['-tzf',archive.path],{encoding:'utf8'});
  assert.equal(listing.status,0);
  assert.ok(listing.stdout.includes('src/main.rs'));
  assert.ok(listing.stdout.includes('agent-events.jsonl'));
  assert.ok(listing.stdout.includes('agent-commit.patch'));
  assert.ok(!listing.stdout.includes('.git/secret'));
  assert.ok(!listing.stdout.includes('target/debug'));
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
test('review archive requires a private report and warning before packaging',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-review-archive-deny-'));
 const root=path.join(base,'project'),evidence=path.join(base,'evidence');
 try{
  fs.mkdirSync(root);fs.mkdirSync(evidence);
  fs.writeFileSync(path.join(evidence,'report.json'),'{}');
  assert.throws(()=>runner.createReviewBundle(root,evidence),/privacy notice/);
  assert.equal(fs.existsSync(path.join(evidence,'review-bundle.tar.gz')),false);
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});


test('disposable Git rule gate rejects missing staged roadmap without touching user repositories',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const originalGit=require('node:child_process').spawnSync;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-luna-case-'));
 const git=(...args)=>originalGit('git',args,{cwd:root,encoding:'utf8'});
 try{
  assert.equal(git('init','-b','main').status,0);
  assert.equal(git('config','--local','user.name','Synthetic Test').status,0);
  assert.equal(git('config','--local','user.email','synthetic@example.invalid').status,0);
  const gate=runner.installDisposableRuleGate(root,
   {project_types:['rust_project_from_scratch']},
   {rules:{'NOM-0010':{},'NOM-0042':{}}});
  assert.equal(gate.installed,true);
  assert.deepEqual(gate.rule_ids,['NOM-0010','NOM-0042']);
  const hook=path.join(root,'.git','hooks','pre-commit');
  assert.ok(fs.statSync(hook).mode&0o100);
  fs.writeFileSync(path.join(root,'README.md'),'# Synthetic test\n');
  assert.equal(git('add','README.md').status,0);
  const refused=git('commit','-m','synthetic test');
  assert.notEqual(refused.status,0);
  assert.match(refused.stderr,/NOMOS_RULE_GATE NOM-0010/);
  assert.equal(git('rev-list','--count','HEAD').status,128);
  fs.writeFileSync(path.join(root,'ROADMAP.md'),'# Roadmap\n## 🧭 Initial CLI\n- ✅ one item\n');
  assert.equal(git('add','ROADMAP.md').status,0);
  const shallow=git('commit','-m','shallow-roadmap');
  assert.notEqual(shallow.status,0);
  assert.match(shallow.stderr,/NOMOS_RULE_GATE NOM-0010: roadmap structure incomplete/);
  fs.writeFileSync(path.join(root,'ROADMAP.md'),"# Roadmap\n## 🧭 Phase 1 — Core\n### 🏁 Milestone 1 — CLI\n#### 🧩 Features\n- 📝 Normalize input — ✅ done\n#### 🔧 Subtasks\n- 🧪 Write unit tests — ✅ done\n- 🔎 Check integration — ✅ done\n");
  assert.equal(git('add','ROADMAP.md').status,0);
  const accepted=git('commit','-m','synthetic test');
  assert.equal(accepted.status,0,accepted.stderr);
  assert.equal(git('status','--porcelain').stdout.trim(),'');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('disposable rule gate is inert without the applicable selected source rule',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const cp=require('node:child_process');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-luna-case-'));
 try{
  assert.equal(cp.spawnSync('git',['init','-b','main'],{cwd:root,encoding:'utf8'}).status,0);
  const gate=runner.installDisposableRuleGate(root,
   {project_types:['rust_project']},{rules:{'NOM-0010':{}}});
  assert.equal(gate.installed,false);
  assert.equal(fs.existsSync(path.join(root,'.git','hooks','pre-commit')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});


test('selected NOM-0010 roadmap structure requires phases, milestones, subtasks, features and unique item identities',()=>{
 const {validateRoadmap}=require('../tools/check_roadmap_structure.cjs');
 const weak='# Roadmap\n\n## 🧭 Initial CLI\n\n- ✅ Normalize text\n- ✅ Run tests\n';
 const bad=validateRoadmap(weak);
 assert.equal(bad.ok,false);
 assert.ok(bad.gaps.includes('missing_milestones'));
 assert.ok(bad.gaps.includes('missing_subtasks'));
 assert.ok(bad.gaps.some(x=>x.startsWith('missing_stable_item_emoji')));
 const valid=validateRoadmap("# Roadmap\n## 🧭 Phase 1 — Core\n### 🏁 Milestone 1 — CLI\n#### 🧩 Features\n- 📝 Normalize input — ✅ done\n#### 🔧 Subtasks\n- 🧪 Write unit tests — ✅ done\n- 🔎 Check integration — ✅ done\n");
 assert.equal(valid.ok,true,valid.gaps.join(','));
 const duplicated=validateRoadmap("# Roadmap\n## 🧭 Phase 1 — Core\n### 🏁 Milestone 1 — CLI\n#### 🧩 Features\n- 📝 Normalize input — ✅ done\n#### 🔧 Subtasks\n- 🧪 Write unit tests — ✅ done\n- 🔎 Check integration — ✅ done\n".replace('🔎 Check integration','🧪 Check integration'));
 assert.equal(duplicated.ok,false);
 assert.ok(duplicated.gaps.some(x=>x.startsWith('duplicate_emoji_identity')));
});


test('final progress preflight distinguishes missing visuals from a scoped quantified report',()=>{
 const manifest={rules:{'NOM-0068':{},'NOM-0069':{},'NOM-0070':{},'NOM-0071':{}}};
 const lines=text=>[
  JSON.stringify({type:'thread.started'}),
  JSON.stringify({type:'item.completed',item:{type:'agent_message',text}}),
  JSON.stringify({type:'turn.completed'})
 ].join('\n');
 const incomplete=runner.handoffProgressPreflight(lines('Implemented CLI, tests and docs.'),manifest);
 assert.equal(incomplete.inspected,true);
 assert.equal(incomplete.percentage_present,false);
 assert.equal(incomplete.visual_bar_present,false);
 assert.equal(incomplete.overall_progress_present,false);
 assert.equal(incomplete.quantifiability,'requires_independent_review');
 assert.equal(incomplete.item_coverage,'requires_independent_review');
 assert.equal(incomplete.first_completion,'requires_independent_review');
 const complete=runner.handoffProgressPreflight(lines(
  'Overall project progress: 50% █████░░░░░; phase one: 100% ██████████'),manifest);
 assert.deepEqual(complete,{inspected:true,selected_rules:[
  'NOM-0068','NOM-0069','NOM-0070','NOM-0071'],
  percentage_present:true,visual_bar_present:true,mismatched_visual_progress_lines:[],
  completed_item_progress_gaps:[],
  overall_progress_present:true,quantifiability:'reported_quantification',
  item_coverage:'requires_independent_review',
  first_completion:'requires_independent_review'});
 const numberOnly=runner.handoffProgressPreflight(lines('Overall project progress: 50%. Phase A: unknown.'),manifest);
 assert.equal(numberOnly.quantifiability,'reported_quantification');
 assert.equal(numberOnly.visual_bar_present,false);
 const unknownDenominator=runner.handoffProgressPreflight(lines(
  'Overall project progress is not objectively quantifiable. We verified Rust tests and a commit; remaining external validation is unobserved.'),manifest);
 assert.equal(unknownDenominator.quantifiability,'requires_independent_review');
 assert.equal(unknownDenominator.percentage_present,false);
 assert.equal(unknownDenominator.visual_bar_present,false);
 assert.equal(unknownDenominator.overall_progress_present,true);
 const outOfScope=runner.handoffProgressPreflight(lines('Implemented CLI.'),{rules:{}});
 assert.equal(outOfScope.inspected,false);
 const scopePhrase=runner.handoffProgressPreflight(lines(
  'The requested implementation scope is complete: 100% [##########]. Hosted CI remains unrun.'),manifest);
 assert.equal(scopePhrase.overall_progress_present,true);
 const unknown=runner.handoffProgressPreflight('{"type":"turn.completed"}',manifest);
 assert.equal(unknown.inspected,false);
});


test('NOM-0043 post-commit preflight catches only evidenced stale Git milestone state',()=>{
 const road='# Roadmap\n- 🚀 **Milestone: Commit on main** — Status: in progress.\n';
 const args={agent_created_commits:1,worktree_clean:true,rule_selected:true};
 assert.deepEqual(runner.roadmapCommitStatusPreflight(road,args),{
  inspected:true,stale_commit_milestone_lines:[2]});
 assert.deepEqual(runner.roadmapCommitStatusPreflight(road.replace('in progress','complete'),args),{
  inspected:true,stale_commit_milestone_lines:[]});
 assert.equal(runner.roadmapCommitStatusPreflight(road,{...args,agent_created_commits:0})
  .stale_commit_milestone_lines.length,0);
 assert.equal(runner.roadmapCommitStatusPreflight(road,{...args,rule_selected:false}).inspected,false);
 assert.equal(runner.roadmapCommitStatusPreflight(road,{...args,worktree_clean:false}).inspected,false);
 assert.deepEqual(runner.roadmapCommitStatusPreflight(
  '# Roadmap\n- 🚀 **Milestone: Deploy to cloud** — Status: in progress.\n',args),{
   inspected:true,stale_commit_milestone_lines:[]});
});


test('visual progress bars are checked only when quantified and recognizably paired',()=>{
 const f=runner.progressBarPairMismatches;
 assert.deepEqual(f('Overall project progress: 50% █████░░░░░'),[]);
 assert.deepEqual(f('Feature A: 33% ███░░░░░░░'),[]);
 assert.deepEqual(f('Feature B: 80% ██░░░░░░░░'),[1]);
 assert.deepEqual(f('Work A: unknown progress; tests passed.'),[]);
 assert.deepEqual(f('Overall project progress: unavailable (CI not observed)'),[]);
 const manifest={rules:{'NOM-0069':{},'NOM-0070':{}}};
 const jsonl=JSON.stringify({type:'item.completed',
  item:{type:'agent_message',text:'Overall project progress: 80% ██░░░░░░░░'}});
 const checked=runner.handoffProgressPreflight(jsonl,manifest);
 assert.deepEqual(checked.mismatched_visual_progress_lines,[1]);
 assert.equal(checked.quantifiability,'reported_quantification');
});


test('persistence acceptance task requires a genuine alternate lifecycle without unauthorized release',()=>{
 const task=runner.CASES['RUST-PERSIST'].task;
 assert.match(task,/atomic-rename persistence/);
 assert.match(task,/recovery from malformed input without losing valid prior entries/);
 assert.match(task,/unknown, corrupted or incompatible journal header MUST NOT/);
 assert.match(task,/leaving original bytes untouched/);
 assert.match(task,/executable process-level CLI integration tests/);
 assert.match(task,/stdout and exit codes/);
 assert.match(task,/missing journal, invalid commands/);
 assert.match(task,/regression test for malformed journal data/);
 assert.match(task,/GitHub Actions workflow/);
 assert.match(task,/release-readiness checklist/);
 assert.match(task,/do not publish, tag, deploy or claim hosted CI ran/);
 const scope=runner.plan('RUST-PERSIST');
 assert.equal(scope.context.features.persistence,'yes');
 assert.equal(scope.context.features.gui,'no');
 assert.equal(scope.snapshot.production_export_authorized,false);
});


test('independent persistence smoke exercises public CLI boundary and malformed recovery',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-luna-case-'));
 const binary=path.join(root,'fixture-cli');
 const fake=String.raw`#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const args=process.argv.slice(2);
const [verb,file,entry]=args;
const decode=data=>data.toString('utf8').split('\n').filter(Boolean).flatMap(line=>{
 if(!/^(?:[0-9a-f]{2})+$/i.test(line))return [];
 try{return [Buffer.from(line,'hex').toString('utf8')];}catch{return [];}
});
if(verb==='list'&&args.length===2){
 if(!fs.existsSync(file))process.exit(0);
 for(const line of decode(fs.readFileSync(file)))console.log(line);
}else if(verb==='append'&&args.length===3){
 if(!fs.existsSync(path.dirname(file)))process.exit(2);
 const items=fs.existsSync(file)?decode(fs.readFileSync(file)):[];
 items.push(entry);
 const temp=file+'.temporary';
 fs.writeFileSync(temp,items.map(x=>Buffer.from(x).toString('hex')).join('\n')+'\n');
 fs.renameSync(temp,file);
}else{console.error('usage');process.exit(2);}
`;
 try{
  fs.writeFileSync(binary,fake,{mode:0o700});
  const {verifyPersistenceCli}=require('../tools/verify_persistence_cli.cjs');
  const success=verifyPersistenceCli(root,{binaryPath:binary,skipBuild:true});
  assert.equal(success.ok,true,JSON.stringify(success));
  assert.equal(success.command_count,12);
  assert.equal(Object.keys(success.checks).length,11);
  assert.equal(success.checks.durable_on_disk_roundtrip,true);
  assert.equal(Object.hasOwn(success.checks,'durable_hex_records'),false);
  // The exercise requires durable data, not a particular storage encoding.
  // An equally correct base64 journal must pass the same external smoke.
  const base64=fake
   .replace("if(!/^(?:[0-9a-f]{2})+$/i.test(line))return [];",
    "if(!/^[A-Za-z0-9+/]+={0,2}$/.test(line)||line.length%4!==0)return [];")
   .replace("Buffer.from(line,'hex')","Buffer.from(line,'base64')")
   .replace("Buffer.from(x).toString('hex')","Buffer.from(x).toString('base64')");
  assert.notEqual(base64,fake);
  fs.writeFileSync(binary,base64,{mode:0o700});
  const alternate=verifyPersistenceCli(root,{binaryPath:binary,skipBuild:true});
  assert.equal(alternate.ok,true,JSON.stringify(alternate));
  assert.equal(alternate.checks.durable_on_disk_roundtrip,true);
  // A CLI may reject invalid bytes without touching the original file.
  // Refusal is safe and is not a failure of malformed-input preservation.
  const strict=fake.replace(
   "if(!/^(?:[0-9a-f]{2})+$/i.test(line))return [];",
   "if(!/^(?:[0-9a-f]{2})+$/i.test(line))throw new Error('malformed journal record');");
  assert.notEqual(strict,fake);
  fs.writeFileSync(binary,strict,{mode:0o700});
  const refusing=verifyPersistenceCli(root,{binaryPath:binary,skipBuild:true});
  assert.equal(refusing.ok,true,JSON.stringify(refusing));
  assert.equal(refusing.checks.malformed_records_read_recovery,true);
  assert.equal(refusing.checks.append_after_malformed_preserves_valid_records,true);
  // A format-header implementation that treats a damaged header as an
  // empty journal and overwrites its entries must fail, even though its
  // ordinary append/list tests pass.
  const headered=fake
   .replace("const decode=data=>data.toString('utf8').split('\\n').filter(Boolean).flatMap(line=>{",
    "const decode=data=>{const lines=data.toString('utf8').split('\\n');if(lines.shift()!=='LOCAL-JOURNAL\\t1')return [];return lines.filter(Boolean).flatMap(line=>{")
   .replace("});\\nif(verb==='list'", "});};\\nif(verb==='list'")
   .replace("fs.writeFileSync(temp,items.map(x=>Buffer.from(x).toString('hex')).join('\\n')+'\\n');",
    "fs.writeFileSync(temp,'LOCAL-JOURNAL\\t1\\n'+items.map(x=>Buffer.from(x).toString('hex')).join('\\n')+'\\n');");
  // Use explicit newlines because the source of fake is a raw template literal.
  const badHeader=headered.replace("});\nif(verb==='list'","});};\nif(verb==='list'");
  assert.notEqual(badHeader,fake);
  fs.writeFileSync(binary,badHeader,{mode:0o700});
  const destructive=verifyPersistenceCli(root,{binaryPath:binary,skipBuild:true});
  assert.equal(destructive.ok,false);
  assert.deepEqual(destructive.failed,['corrupted_prefix_preserves_valid_entries_or_refuses']);
  // Broken public list CLI must fail independent smoke regardless of unit test claims.
  fs.writeFileSync(binary,"#!/usr/bin/env node\nif(process.argv[2]==='list'){console.log('broken')}\n");
  const bad=verifyPersistenceCli(root,{binaryPath:binary,skipBuild:true});
  assert.equal(bad.ok,false);
  assert.ok(bad.failed.includes('missing_journal_lists_empty'));
  assert.ok(bad.failed.includes('list_public_cli_output'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});


test('NOM-0069 does not demand 100 percent of an accurately quantified unfinished parent',()=>{
 const f=runner.completedItemProgressGaps;
 const line='17. **Phase — Verify and commit:** 75% `███████░░░` — local verification and commit are complete; hosted CI is pending.';
 assert.deepEqual(f(line),[]);
 assert.deepEqual(runner.progressBarPairMismatches(line),[]);
 const complete='17. **Phase — Verify and commit:** Complete `██████████`';
 assert.deepEqual(f(complete).map(x=>x.line),[1]);
});
test('source NOM-0069 requires each completed item to pair its own percent and bar',()=>{
 const {completedItemProgressGaps}=runner;
 const shared='Each below 100% ██████████\n1. 🧭 **Phase** — Complete\n2. 🧪 **Tests** — Complete';
 assert.deepEqual(completedItemProgressGaps(shared).map(x=>x.line),[2,3]);
 const paired='1. 🧭 Phase — Complete: 100% ██████████\n2. 🧪 Tests — Complete: 100% ██████████';
 assert.deepEqual(completedItemProgressGaps(paired),[]);
 const pending='- ☁️ Hosted CI — Not run; percentage cannot be verified';
 assert.deepEqual(completedItemProgressGaps(pending),[]);
});

test('persistence smoke follows the current Cargo executable after package rename',()=>{
 const path=require('node:path'),os=require('node:os');
 const {binaryFromCargoMetadata}=require('../tools/verify_persistence_cli.cjs');
 const root=path.join(os.tmpdir(),'nomos-luna-case-renamed-cargo');
 const metadata={
  packages:[{name:'local-journal',manifest_path:path.join(root,'Cargo.toml'),
   targets:[{kind:['bin'],name:'local-journal'}]}],
  target_directory:path.join(root,'target')
 };
 const target=binaryFromCargoMetadata(JSON.stringify(metadata),root);
 assert.equal(target.name,'local-journal');
 assert.equal(target.path,path.join(root,'target','debug','local-journal'));
 assert.notEqual(target.path,path.join(root,'target','debug','nomos_acceptance'));
 const multiple={...metadata,packages:[{...metadata.packages[0],
  targets:[{kind:['bin'],name:'one'},{kind:['bin'],name:'two'}]}]};
 assert.throws(()=>binaryFromCargoMetadata(JSON.stringify(multiple),root),/exactly one/);
 const foreign={...metadata,packages:[{...metadata.packages[0],
  manifest_path:'/unrelated/Cargo.toml'}]};
 assert.throws(()=>binaryFromCargoMetadata(JSON.stringify(foreign),root),/exactly one/);
});
