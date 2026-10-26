'use strict';
/* Opt-in disposable agent acceptance; synthetic ad-hoc selection, NOT profile approval. */
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const catalog=require('../docs/catalog.json');
const hierarchy=require('../taxonomy/project-types.json');
const {decide}=require('./projections.cjs');
const {compile,install}=require('./agent_package.cjs');
const {verify}=require('./agent_package_verify.cjs');
const CASES=Object.freeze({
 'RUST-CLI':{types:['rust_project_from_scratch'],features:{gui:'no',persistence:'no',external_input:'yes'},task:'Implement a dependency-free Rust CLI which normalizes Unicode input (trim and collapse repeated ASCII spaces), validates empty input, reports errors correctly, and has meaningful unit and integration tests.'},
 'RUST-PERSIST':{types:['rust_project_from_scratch'],features:{gui:'no',persistence:'yes',external_input:'yes'},task:'Implement a dependency-free Rust local journal CLI supporting append and list, an explicitly provided file path, temp-file and atomic-rename persistence, recovery from invalid input, and automated tests.'},
 'RUST-MIXED':{types:['rust_project_from_scratch','tarium_project'],features:{gui:'no',persistence:'no',external_input:'yes',ci:'yes'},task:'Implement a dependency-free Rust CLI that parses bounded key=value lines, rejects malformed and untrusted inputs, includes tests and a GitHub Actions workflow, and documents safe usage.'}
});
const guard=(ok,message)=>{if(!ok)throw new Error(message);};
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function plan(caseId,model=null){
 guard(Object.hasOwn(CASES,caseId),'Unknown synthetic Rust case');
 guard(model===null||(/^[a-zA-Z0-9._-]{1,80}$/.test(model)),'Invalid model selector');
 const scenario=CASES[caseId],profile=catalog.profiles.find(x=>x.id==='PROFILE-0004');
 guard(profile?.status==='draft'&&profile.review?.selection_confirmed===false,'Source profile status unexpectedly changed');
 const context={kind:'project_context',version:'1.0.0',project_types:scenario.types,types_exhaustive:true,
  phase:'implementation',axes:{actor:'ai_agent',channel:'git_repository',visibility:'public',artifact_kind:'repository_content'},features:scenario.features};
 const selection={type:'rules',rule_ids:[...profile.selected_rule_ids]};
 const approval={source_selection_confirmed:true,project_context_reviewed:true,projection_confirmed:true};
 const projection=decide({catalog,hierarchy,selection,context,approval});
 guard(projection.status==='approved','Synthetic scenario has blocked or unresolved normative constraints');
 const bundle=compile(projection,catalog,{target:'codex'});
 return {case_id:caseId,model,context,task:scenario.task,bundle,
  snapshot:{kind:'nomos_synthetic_agent_probe',schema_version:1,case_id:caseId,
    source_profile_id:profile.id,profile_finalized:false,production_export_authorized:false,
    synthetic_ad_hoc_selection:true,model,selected_rules:selection.rule_ids.length,
    projection_sha256:bundle.manifest.projection_sha256,
    registry_revision_sha256:bundle.manifest.registry_revision_sha256}};
}
function command(exe,args,cwd,options={}){
 const r=cp.spawnSync(exe,args,{cwd,encoding:'utf8',input:options.input,timeout:options.timeout||45000,maxBuffer:8*1024*1024});
 return {status:r.status,signal:r.signal||null,error:r.error?.message||null,stdout:r.stdout||'',stderr:r.stderr||''};
}
function status(result){return {exit_code:result.status,error:result.error||null,
 stdout_sha256:hash(result.stdout),stderr_sha256:hash(result.stderr),stdout_bytes:Buffer.byteLength(result.stdout),stderr_bytes:Buffer.byteLength(result.stderr)};}
function preflight(){
 const versions={};
 for(const cmd of ['git','cargo','codex']){
  const r=command(cmd,['--version'],process.cwd());
  guard(r.status===0,'Missing executable: '+cmd);versions[cmd]=r.stdout.trim()||r.stderr.trim();
 }return versions;
}
function argsOf(argv){
 const args={case_id:null,model:null,execute:false};
 for(let i=0;i<argv.length;i++){
  if(argv[i]==='--execute'){args.execute=true;continue;}
  if(argv[i]==='--case'||argv[i]==='--model'){
   const key=argv[i]==='--case'?'case_id':'model';
   guard(argv[i+1]&&!argv[i+1].startsWith('--'),'Missing value for '+argv[i]);
   args[key]=argv[++i];continue;
  }throw new Error('Unknown argument '+argv[i]);
 }
 guard(args.case_id,'Required: --case RUST-CLI|RUST-PERSIST|RUST-MIXED');
 return args;
}
function privateFile(dir,name,content){fs.writeFileSync(path.join(dir,name),content,{mode:0o600,flag:'wx'});}
function run(argv){
 const flags=argsOf(argv),p=plan(flags.case_id,flags.model);
 if(!flags.execute)return {...p.snapshot,status:'planning_only',agent_invoked:false,
  note:'No user project, paid model, or authentication was touched. Execute only after explicit authorization.'};
 const versions=preflight();
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-luna-case-'));
 const evidence=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-luna-evidence-'));
 fs.chmodSync(root,0o700);fs.chmodSync(evidence,0o700);
 guard(command('git',['init','-b','main'],root).status===0,'Cannot initialize disposable Git');
 guard(command('cargo',['init','--bin','--name','nomos_acceptance','--vcs','none','.'],root).status===0,'Cannot initialize Cargo');
 install(p.bundle,root,{write:true,confirmedExport:true});
 const installed=verify(root);
 guard(command('git',['add','.'],root).status===0,'Cannot stage synthetic baseline');
 guard(command('git',['-c','user.name=Nomos QA','-c','user.email=nomos-qa@example.invalid',
  'commit','-m','test: disposable synthetic baseline'],root).status===0,'Cannot commit synthetic baseline');
 const prompt=[
  'Implement this disposable Rust acceptance exercise:',p.task,
  'Before changing code, execute node .nomos/read-phase.cjs planning.',
  'Read relevant rules at implementation, testing, review and shutdown as phases change.',
  'Run cargo test --offline. Commit verified changes directly to main.',
  'Report only actual tool execution; do not fake source-rule compliance or a release.'
 ].join('\n');
 const commandArgs=['exec','--sandbox','workspace-write','--ask-for-approval','never',
  '--ephemeral','--json','--cd',root];
 if(flags.model)commandArgs.push('--model',flags.model);
 commandArgs.push('-');
 const result=command('codex',commandArgs,root,{input:prompt,timeout:15*60*1000});
 privateFile(evidence,'agent-events.jsonl',result.stdout);
 privateFile(evidence,'agent-stderr.txt',result.stderr);
 const cargoTest=command('cargo',['test','--offline'],root,{timeout:120000});
 const metadata=command('cargo',['metadata','--no-deps','--offline','--format-version','1'],root);
 const gitLog=command('git',['log','--format=%H %s','-4'],root);
 const gitStatus=command('git',['status','--porcelain=v1'],root);
 const report={...p.snapshot,status:'awaiting_independent_review',agent_invoked:true,
  agent_versions:versions,workspace:root,private_evidence:evidence,installed_rules:installed.verified_rules,
  evidence_summary:{codex:status(result),cargo_test:status(cargoTest),cargo_metadata:status(metadata),
   git_log:status(gitLog),git_status:status(gitStatus)},
  phase_tool_reads_independently_verified:false,rule_assessments_complete:false,
  independent_reviewer_accepted:false,production_accepted:false};
 privateFile(evidence,'report.json',JSON.stringify(report,null,2)+'\n');
 return report;
}
if(require.main===module){try{console.log(JSON.stringify(run(process.argv.slice(2)),null,2));}
 catch(error){console.error('Nomos acceptance refused: '+error.message);process.exitCode=1;}}
module.exports={CASES,plan,argsOf,run};
