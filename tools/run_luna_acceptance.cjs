'use strict';
/* Opt-in disposable agent acceptance; synthetic ad-hoc selection, NOT profile approval. */
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const {validateRoadmap}=require('./check_roadmap_structure.cjs');
const {verifyPersistenceCli}=require('./verify_persistence_cli.cjs');
const catalog=require('../docs/catalog.json');
const hierarchy=require('../taxonomy/project-types.json');
const {decide}=require('./projections.cjs');
const {compile,install}=require('./agent_package.cjs');
const {verify}=require('./agent_package_verify.cjs');
const {observe}=require('./codex_trace_observer.cjs');
const CASES=Object.freeze({
 'RUST-CLI':{types:['rust_project_from_scratch'],features:{gui:'no',persistence:'no',external_input:'yes'},task:'Implement a dependency-free Rust CLI which normalizes Unicode input (trim and collapse repeated ASCII spaces), validates empty input, reports errors correctly, and has meaningful unit and integration tests. Include a GitHub Actions CI workflow for Rust formatting, compilation, Clippy linting and offline tests; do not claim CI ran or passed without observed evidence.'},
 'RUST-PERSIST':{types:['rust_project_from_scratch'],features:{gui:'no',persistence:'yes',external_input:'yes'},task:'Implement a dependency-free Rust local journal CLI supporting append and list, an explicitly provided file path, same-directory temp-file and atomic-rename persistence, and safe recovery from malformed input without losing valid prior entries. An unknown, corrupted or incompatible journal header MUST NOT cause append to treat an existing file as empty and overwrite recoverable records: either refuse append while leaving original bytes untouched, or prove valid prior records remain intact after recovery. Add focused unit tests AND executable process-level CLI integration tests for append/list/reload round trips, stdout and exit codes, a missing journal, invalid commands, and a regression test for malformed journal data without destroying previously valid entries, plus a GitHub Actions workflow for offline formatting, compilation, Clippy and tests. Document the storage format, recoverability, verified local checks and an evidence-based release-readiness checklist; do not publish, tag, deploy or claim hosted CI ran.'},
 'RUST-MIXED':{types:['rust_project_from_scratch','tarium_project'],features:{gui:'no',persistence:'no',external_input:'yes',ci:'yes'},task:'Implement a dependency-free Rust CLI that parses bounded key=value lines, rejects malformed and untrusted inputs, includes tests and a GitHub Actions workflow, and documents safe usage.'}
});
const guard=(ok,message)=>{if(!ok)throw new Error(message);};
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function plan(caseId,model=null,target='codex'){
 guard(Object.hasOwn(CASES,caseId),'Unknown synthetic Rust case');
 guard(model===null||(/^[a-zA-Z0-9._-]{1,80}$/.test(model)),'Invalid model selector');
 guard(target==='codex'||target==='generic','Unsupported synthetic agent package target');
 const scenario=CASES[caseId],profile=catalog.profiles.find(x=>x.id==='PROFILE-0004');
 guard(profile?.status==='draft'&&profile.review?.selection_confirmed===false,'Source profile status unexpectedly changed');
 const context={kind:'project_context',version:'1.0.0',project_types:scenario.types,types_exhaustive:true,
  phase:'implementation',axes:{actor:'ai_agent',channel:'git_repository',visibility:'public',artifact_kind:'repository_content'},features:scenario.features};
 const selection={type:'rules',rule_ids:[...profile.selected_rule_ids]};
 const approval={source_selection_confirmed:true,project_context_reviewed:true,projection_confirmed:true};
 const projection=decide({catalog,hierarchy,selection,context,approval});
 guard(projection.status==='approved','Synthetic scenario has blocked or unresolved normative constraints');
 const bundle=compile(projection,catalog,{target});
 return {case_id:caseId,model,context,task:scenario.task,bundle,
  snapshot:{kind:'nomos_synthetic_agent_probe',schema_version:1,case_id:caseId,
    source_profile_id:profile.id,profile_finalized:false,production_export_authorized:false,
    synthetic_ad_hoc_selection:true,model,agent_target:target,selected_rules:selection.rule_ids.length,
    projection_sha256:bundle.manifest.projection_sha256,
    registry_revision_sha256:bundle.manifest.registry_revision_sha256}};
}
function command(exe,args,cwd,options={}){
 const r=cp.spawnSync(exe,args,{cwd,encoding:'utf8',input:options.input,
  env:options.env||process.env,timeout:options.timeout||45000,maxBuffer:8*1024*1024});
 return {status:r.status,signal:r.signal||null,error:r.error?.message||null,stdout:r.stdout||'',stderr:r.stderr||''};
}
function status(result){return {exit_code:result.status,error:result.error||null,
 stdout_sha256:hash(result.stdout),stderr_sha256:hash(result.stderr),stdout_bytes:Buffer.byteLength(result.stdout),stderr_bytes:Buffer.byteLength(result.stderr)};}
/* For disposable acceptance workspaces only. Custom permissions retain the
 * standard workspace sandbox, reopening Git metadata within this test root.
 * No global Codex configuration, host Git configuration or other repo is changed.
 * Never substitute danger-full-access/yolo when this profile is unsupported. */
function codexConfig(){
 return [
  'default_permissions="nomos_disposable_git"',
  'permissions.nomos_disposable_git.extends=":workspace"',
  'permissions.nomos_disposable_git.filesystem={":workspace_roots"={".git"="write"}}',
  'permissions.nomos_disposable_git.network.enabled=false'
 ];
}
function codexArgs(root,model=null,help=false){
 const args=['--ask-for-approval','never'];
 for(const value of codexConfig())args.push('-c',value);
 args.push('exec');
 if(help){args.push('--help');return args;}
 args.push('--ephemeral','--json','--cd',root);
 if(model)args.push('--model',model);
 args.push('-');
 return args;
}
function probeDisposableGitSandbox(root){
 guard(process.platform==='linux','The disposable Codex Git-write sandbox probe currently requires Linux');
 const args=[];
 for(const value of codexConfig())args.push('-c',value);
 args.push('sandbox','--permission-profile','nomos_disposable_git','--cd',root,
  '--','/bin/sh','-c',
  'f=.git/nomos-write-permission-probe; (umask 077; : > "$f") && rm -- "$f"');
 const output=command('codex',args,root,{timeout:15000});
 guard(output.status===0,'Disposable Codex sandbox permission probe failed; no model launched (Git writability unverified). '+
  (output.stderr.trim()||output.stdout.trim()||output.error||'sandbox probe exit '+output.status).slice(0,500));
 return true;
}

/* The opt-in synthetic test repository alone gets a local Git hook.
 * It checks indexed artifact presence, not full source-rule compliance. */
function installDisposableRuleGate(root,context,manifest){
 const prefix=path.join(os.tmpdir(),'nomos-luna-case-');
 guard(path.resolve(root).startsWith(prefix),'Rule gate requires disposable acceptance root');
 // Mocked command-unit tests do not materialize .git; real Git init does.
 if(!fs.existsSync(path.join(root,'.git')))
  return {installed:false,rule_ids:[],reason:'git_metadata_not_created'};
 guard(fs.lstatSync(path.join(root,'.git')).isDirectory(),'Rule gate requires a real Git directory');
 const fresh=context?.project_types?.includes('rust_project_from_scratch')===true;
 const requirements=fresh?[
  ['NOM-0010',['ROADMAP.md','roadmap.md','roadmaps/README.md','docs/ROADMAP.md','docs/roadmap.md','docs/roadmaps/README.md']],
  ['NOM-0042',['README.md','README.MD','README']]
 ].filter(([id])=>Object.hasOwn(manifest.rules,id)):[];
 if(!requirements.length)return {installed:false,rule_ids:[]};
 const lines=['#!/bin/sh','set -eu','check_any() {','  rule="$1"; shift',
  '  for candidate in "$@"; do',
  '    if git ls-files --cached --error-unmatch -- "$candidate" >/dev/null 2>&1; then',
  '      if [ "$rule" = "NOM-0010" ]; then',
  '        git show ":$candidate" | node .git/hooks/nomos-check-roadmap.cjs || exit 1',
  '      fi',
  '      return 0',
  '    fi',
  '  done',
  '  echo "NOMOS_RULE_GATE $rule: selected bootstrap artifact absent from Git index" >&2',
  '  exit 1','}'];
 for(const [id,locations] of requirements)
  lines.push('check_any '+id+' '+locations.map(file=>"'"+file+"'").join(' '));
 lines.push('exit 0','');
 const hook=path.join(root,'.git','hooks','pre-commit');
 fs.mkdirSync(path.dirname(hook),{recursive:true});
 fs.writeFileSync(hook,lines.join('\n'),{flag:'wx',encoding:'utf8',mode:0o700});
 if(requirements.some(([id])=>id==='NOM-0010'))
  fs.writeFileSync(path.join(root,'.git','hooks','nomos-check-roadmap.cjs'),
   fs.readFileSync(path.join(__dirname,'check_roadmap_structure.cjs'),'utf8'),
   {flag:'wx',encoding:'utf8',mode:0o600});
 const cfg=command('git',['config','--local','core.hooksPath','.git/hooks'],root);
 guard(cfg.status===0,'Cannot configure disposable-only Git rule gate');
 return {installed:true,rule_ids:requirements.map(([id])=>id)};
}

function preflight(){
 const versions={};
 for(const cmd of ['git','cargo','codex']){
  const r=command(cmd,['--version'],process.cwd());
  guard(r.status===0,'Missing executable: '+cmd);versions[cmd]=r.stdout.trim()||r.stderr.trim();
 }
 const parser=command('codex',codexArgs(process.cwd(),null,true),process.cwd());
 guard(parser.status===0,'Codex CLI is incompatible with temporary Git-write permissions: parser preflight failed'+
  (parser.stderr.trim()?': '+parser.stderr.trim().slice(0,500):' (exit '+parser.status+')'));
 return versions;
}
function hasEvent(stdout,type){
 return stdout.split(/\r?\n/).some(line=>{
  if(!line.trim())return false;
  try{const event=JSON.parse(line);return event.type===type;}catch{return false;}
 });
}
/* A narrow reporting-shape preflight for selected progress rules. This is not a
 * semantic compliance verdict: applicability and reported values require review. */
/* Only count reliably shaped numeric+bar pairs; never infer a completion
 * percentage from prose, status emojis, or unverifiable roadmap status. */
function progressBarPairMismatches(text){
 const mismatched=[];
 const pair=/(\d{1,3}(?:\.\d+)?)\s*%\s*([█▰▮░▱▯]{2,})/u;
 const filled=/[█▰▮]/gu;
 const empty=/[░▱▯]/gu;
 for(const [index,line] of String(text).split(/\r?\n/).entries()){
  const match=line.match(pair);
  if(!match)continue;
  const numeric=Number(match[1]),bar=match[2];
  const observed=(bar.match(filled)||[]).length,unfilled=(bar.match(empty)||[]).length;
  if(!Number.isFinite(numeric)||numeric>100||observed+unfilled!==[...bar].length)continue;
  const inferred=100*observed/(observed+unfilled);
  // Accept ordinary rounding to whole bar segments; reject material divergence.
  if(Math.abs(numeric-inferred)>50/(observed+unfilled)+2)mismatched.push(index+1);
 }
 return mismatched;
}

/* Conservative NOM-0069 check: a numbered/bulleted item explicitly called
 * Complete is quantifiable. A shared bar in the introduction does not pair
 * the percentage and visual bar with each individual reported work item. */
function completedItemProgressGaps(text){
 const gaps=[];
 for(const [i,line] of String(text||'').split(/\r?\n/).entries()){
  if(!/^\s*(?:\d+[.)]|[-*+])\s+/.test(line)||!/(?:\bcomplete\b|\bcompleted\b|\bdone\b)/i.test(line))continue;
  const percent=/\b100(?:\.0+)?\s*%/.test(line);
  const bar=/[█▰▮]{2,}|\[[#=]{2,}[-. ]*\]/u.test(line);
  if(!percent||!bar)gaps.push({line:i+1,percent_present:percent,bar_present:bar});
 }
 return gaps;
}

function handoffProgressPreflight(jsonl,manifest){
 const selected=['NOM-0068','NOM-0069','NOM-0070','NOM-0071']
  .filter(id=>Object.hasOwn(manifest?.rules||{},id));
 let finalText=null;
 for(const line of String(jsonl||'').split(/\r?\n/)){
  if(!line.trim())continue;
  let event;try{event=JSON.parse(line);}catch{continue;}
  if(event.type==='item.completed'&&event.item?.type==='agent_message'&&
   typeof event.item.text==='string')finalText=event.item.text;
 }
 if(!selected.length||finalText===null)return {inspected:false,selected_rules:selected,
  quantifiability:'unobserved',item_coverage:'unobserved',first_completion:'unobserved'};
 const percentagePresent=/\b(?:100|\d{1,2})(?:\.\d+)?\s*%/.test(finalText);
 const visualBarPresent=/[█▓▒░▰▱▮▯]|\[[#=]+[-. ]*\]/u.test(finalText);
 const mismatchedBarLines=selected.includes('NOM-0069')?
  progressBarPairMismatches(finalText):[];
 const completedItems=selected.includes('NOM-0069')?
  completedItemProgressGaps(finalText):[];
 // NOM-0069 is conditional on quantifiable work. A missing percentage and bar
 // cannot itself establish a violation; inventing precision is prohibited.
 return {inspected:true,selected_rules:selected,
  percentage_present:percentagePresent,
  visual_bar_present:visualBarPresent,
  mismatched_visual_progress_lines:mismatchedBarLines,
  completed_item_progress_gaps:completedItems,
  overall_progress_present:/\b(?:overall|project progress|total progress|requested implementation scope|requested scope|entire implementation scope)\b/i.test(finalText),
  quantifiability:percentagePresent||visualBarPresent?'reported_quantification':'requires_independent_review',
  item_coverage:'requires_independent_review',first_completion:'requires_independent_review'};
}

/* Project-specific, post-commit evidence reconciliation for selected NOM-0043.
 * Narrow by design: only an explicit, already-achieved "Commit on main"
 * milestone marked unfinished is machine-detectable. Others need review. */
function roadmapCommitStatusPreflight(markdown,{agent_created_commits,worktree_clean,rule_selected}={}){
 const inspected=rule_selected===true&&typeof markdown==='string'&&
  Number.isSafeInteger(agent_created_commits)&&worktree_clean===true;
 if(!inspected)return {inspected:false,stale_commit_milestone_lines:[]};
 const lines=markdown.split(/\r?\n/);
 const stale=[];
 if(agent_created_commits>0)for(let i=0;i<lines.length;i++){
  if(/\bmilestone\s*:\s*commit\b/i.test(lines[i])&&
   /\bstatus\s*:\s*(?:in\s+progress|pending|todo|not\s+started)\b/i.test(lines[i]))
   stale.push(i+1);
 }
 return {inspected:true,stale_commit_milestone_lines:stale};
}

function observeGenericEntrypointRead(jsonl){
 return String(jsonl||'').split(/\r?\n/).some(line=>{
  let event;try{event=JSON.parse(line);}catch{return false;}
  const item=event.item||{};
  const actualCommand=String(item.command||'')
   .replace(/^.*\s-lc\s+['"]/, '').replace(/['"]$/, '').trim();
  return event.type==='item.completed'&&item.type==='command_execution'&&
   item.exit_code===0&&/^cat\s+AGENTS\.md$/.test(actualCommand)&&
   /# Generated Nomos agent contract/.test(item.aggregated_output||'')&&
   /Agent target: generic/.test(item.aggregated_output||'');
 });
}

function argsOf(argv){
 const args={case_id:null,model:null,target:'codex',execute:false,probe_sandbox:false};
 for(let i=0;i<argv.length;i++){
  if(argv[i]==='--execute'){args.execute=true;continue;}
  if(argv[i]==='--probe-sandbox'){args.probe_sandbox=true;continue;}
  if(argv[i]==='--case'||argv[i]==='--model'||argv[i]==='--target'){
   const key=argv[i]==='--case'?'case_id':argv[i]==='--model'?'model':'target';
   guard(argv[i+1]&&!argv[i+1].startsWith('--'),'Missing value for '+argv[i]);
   args[key]=argv[++i];continue;
  }throw new Error('Unknown argument '+argv[i]);
 }
 guard(args.case_id,'Required: --case RUST-CLI|RUST-PERSIST|RUST-MIXED');
 guard(['codex','generic'].includes(args.target),'Invalid agent package target');
 guard(!(args.execute&&args.probe_sandbox),'--probe-sandbox cannot combine with --execute');
 return args;
}
function privateFile(dir,name,content){fs.writeFileSync(path.join(dir,name),content,{mode:0o600,flag:'wx'});}
/* Private local-only review handoff. No upload and no public repository mutation.
 * Raw agent traces can contain machine paths or unexpected text: the owner must
 * inspect this archive before deliberately sharing it with an independent reviewer. */
function createReviewBundle(root,evidence,out=path.join(evidence,'review-bundle.tar.gz')){
 const names=['README-review.txt','report.json','machine-observation.json',
  'agent-events.jsonl','agent-stderr.txt','agent-commit.patch',
  'cargo-test.stdout','cargo-test.stderr','cargo-fmt.stdout','cargo-fmt.stderr',
  'cargo-clippy.stdout','cargo-clippy.stderr','persistence-cli-smoke.json'];
 const included=names.filter(item=>fs.existsSync(path.join(evidence,item)));
 guard(included.includes('report.json')&&included.includes('README-review.txt'),
  'Review bundle requires a run report and privacy notice');
 const fd=fs.openSync(out,'wx',0o600);fs.closeSync(fd);
 const archived=command('tar',['-czf',out,'--exclude=.git','--exclude=target',
  '-C',root,'.','-C',evidence,...included],root,{timeout:120000});
 if(archived.status!==0||!fs.existsSync(out)||fs.statSync(out).size===0){
  fs.rmSync(out,{force:true});
  throw new Error('Private review archive failed: '+(archived.stderr||archived.error||archived.status).toString().slice(0,350));
 }
 return {path:out,sha256:crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex'),
  bytes:fs.statSync(out).size};
}
function run(argv){
 const flags=argsOf(argv),p=plan(flags.case_id,flags.model,flags.target);
 if(!flags.execute&&!flags.probe_sandbox)return {...p.snapshot,status:'planning_only',agent_invoked:false,
  note:'No user project, paid model, or authentication was touched. Execute only after explicit authorization.'};
 const versions=preflight();
 if(flags.probe_sandbox){
  const probeRoot=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-luna-git-probe-'));
  fs.chmodSync(probeRoot,0o700);
  try{
   guard(command('git',['init','-b','main'],probeRoot).status===0,'Cannot create temporary Git permission probe');
   probeDisposableGitSandbox(probeRoot);
   return {...p.snapshot,status:'disposable_git_sandbox_probe_passed',
    agent_invoked:false,agent_turn_completed:false,production_accepted:false,
    agent_versions:versions,network_enabled:false,
    note:'A model-free sandbox checked .git writability in a temporary Git directory; no agent was launched.'};
  }finally{fs.rmSync(probeRoot,{recursive:true,force:true});}
 }

 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-luna-case-'));
 const evidence=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-luna-evidence-'));
 fs.chmodSync(root,0o700);fs.chmodSync(evidence,0o700);
 guard(command('git',['init','-b','main'],root).status===0,'Cannot initialize disposable Git');
 // Identity is scoped to this temporary repository; never touch the owner's global Git config.
 guard(command('git',['config','--local','user.name','Nomos QA'],root).status===0,'Cannot configure disposable Git author');
 guard(command('git',['config','--local','user.email','nomos-qa@example.invalid'],root).status===0,'Cannot configure disposable Git email');
 guard(command('cargo',['init','--bin','--name','nomos_acceptance','--vcs','none','.'],root).status===0,'Cannot initialize Cargo');
 install(p.bundle,root,{write:true,confirmedExport:true});
 const installed=verify(root);
 guard(command('git',['add','.'],root).status===0,'Cannot stage synthetic baseline');
 guard(command('git',['commit','-m','test: disposable synthetic baseline'],root).status===0,'Cannot commit synthetic baseline');
 const disposableRuleGate=installDisposableRuleGate(root,p.context,p.bundle.manifest);
 const baselineSha=command('git',['rev-parse','HEAD'],root).stdout.trim();
 // Actual Linux sandbox check, not a mocked JSONL assertion or expensive model turn.
 probeDisposableGitSandbox(root);
 const prompt=[
  'Implement this disposable Rust acceptance exercise:',p.task,
  'Pinned project fact: this is a new project being created from scratch. The Cargo.toml and src/main.rs files at startup are temporary cargo-init scaffolding supplied by the acceptance harness, not evidence of an existing mature project. Evaluate source-rule conditions using the pinned project context in .nomos/projection.json.',
  ...(flags.target==='generic'?["This is the generic Markdown package, with no agent Skills wrappers. Explicitly execute `cat AGENTS.md` as your first project-file read, and inspect the generated contract's `Agent target: generic` declaration. The caller supplies AGENTS.md as the generic entrypoint; do not assume it was automatically discovered. Then use the same verified phase-reader contract."]:[]),
  'Before changing code, execute node .nomos/read-phase.cjs planning.',
  'At planning, identify concrete active source-rule IDs and their required output files, validation steps and safety conditions. Before committing, compare those planned obligations against actual artifacts. Do not mark absent required work complete.',
  'Read relevant rules at implementation, testing, review and shutdown as phases change.',
  'Run cargo test --offline. Commit verified changes directly to main.',
  'The disposable Git repository has a selected-rule artifact gate. Do not bypass it. If a commit fails, inspect and satisfy the identified source-rule obligation before retrying.',
  'Before your final handoff, reconcile ROADMAP.md status text against the actual committed HEAD. A milestone that is still in progress must be reported as unfinished; if a formerly in-progress action is already completed and this is within scope, make a final coherent follow-up commit and verify it, or explicitly disclose the discrepancy. Never mark an unexecuted hosted CI run complete.',
  'Your final report MUST inventory every touched roadmap phase, milestone, feature AND subtask separately (including tasks nested beneath a feature). Use the item titles or stable emoji IDs from ROADMAP.md, report actual evidence-based status and numeric/bar progress only when quantifiable. Do not silently omit a completed subtask just because its parent feature appears in the report.',
  'For every quantifiably complete phase/milestone/feature/subtask in your final progress report, put 100% AND a matching visual progress bar on the item\'s OWN line. Do not substitute one shared 100% and bar in the group heading for the required per-item pairing.',
  'Your final reply is a project development progress report. Apply the selected NOM-0068 through NOM-0072 conditions: report the progress of touched phases, milestones, tasks and features, plus overall project progress. Give each work item a number and matching visual progress bar only when evidence supports a percentage; do not invent numerical precision. Announce 100% for newly completed items once and do not repeat already announced completion events.',
  'Report only actual tool execution; do not fake source-rule compliance or a release.'
 ].join('\n');
 const commandArgs=codexArgs(root,flags.model);
 // User's system sccache wrapper can be inaccessible inside the Codex sandbox.
 // Override only the child process tree; do not modify the user's shell or config.
 const rustEnv={...process.env,RUSTC_WRAPPER:''};
 const result=command('codex',commandArgs,root,{input:prompt,timeout:15*60*1000,env:rustEnv});
 privateFile(evidence,'agent-events.jsonl',result.stdout);
 privateFile(evidence,'agent-stderr.txt',result.stderr);
 const cargoTest=command('cargo',['test','--offline'],root,{timeout:120000,env:rustEnv});
 const cargoFmt=command('cargo',['fmt','--all','--','--check'],root,{timeout:120000,env:rustEnv});
 const cargoClippy=command('cargo',['clippy','--offline','--all-targets','--','-D','warnings'],root,{timeout:120000,env:rustEnv});
 const metadata=command('cargo',['metadata','--no-deps','--offline','--format-version','1'],root,{env:rustEnv});
 const persistenceSmoke=flags.case_id==='RUST-PERSIST'?
  verifyPersistenceCli(root):{inspected:false,reason:'not_persistence_case'};
 if(persistenceSmoke.inspected)privateFile(evidence,'persistence-cli-smoke.json',
  JSON.stringify(persistenceSmoke,null,2)+'\n');
 for(const [file,resultToRecord] of [['cargo-test',cargoTest],['cargo-fmt',cargoFmt],['cargo-clippy',cargoClippy]]){
  privateFile(evidence,file+'.stdout',resultToRecord.stdout);
  privateFile(evidence,file+'.stderr',resultToRecord.stderr);
 }
 const repositoryArtifacts={
  readme_present:['README.md','README.MD','README'].some(name=>fs.existsSync(path.join(root,name))),
  roadmap_present:['ROADMAP.md','roadmap.md','roadmaps/README.md','docs/ROADMAP.md',
   'docs/roadmap.md','docs/roadmaps/README.md'].some(name=>fs.existsSync(path.join(root,name))),
  ci_workflow_present:fs.existsSync(path.join(root,'.github/workflows'))&&
   fs.readdirSync(path.join(root,'.github/workflows'),{withFileTypes:true})
    .some(entry=>entry.isFile()&&/\.ya?ml$/.test(entry.name))
 };
 const roadmapRequired=p.context?.project_types?.includes('rust_project_from_scratch')===true &&
  Object.hasOwn(p.bundle.manifest.rules,'NOM-0010');
 const roadmapLocations=['ROADMAP.md','roadmap.md','roadmaps/README.md','docs/ROADMAP.md',
  'docs/roadmap.md','docs/roadmaps/README.md'];
 const roadmapPath=roadmapRequired?roadmapLocations.find(name=>fs.existsSync(path.join(root,name))):null;
 const roadmapStructurePreflight=roadmapPath?
  validateRoadmap(fs.readFileSync(path.join(root,roadmapPath),'utf8')):null;
 const gitLog=command('git',['log','--format=%H %s','-4'],root);
 const gitStatus=command('git',['status','--porcelain=v1'],root);
 // HEAD has one synthetic baseline commit before Codex starts.
 const gitCommitCount=command('git',['rev-list','--count','HEAD'],root);
 const headSha=command('git',['rev-parse','HEAD'],root).stdout.trim();
 const agentDiff=/^[a-f0-9]{40}$/.test(baselineSha)
  ?command('git',['diff','--binary',baselineSha,'HEAD'],root,{timeout:120000})
  :{status:null,error:'Missing baseline commit SHA',stdout:'',stderr:''};
 privateFile(evidence,'agent-commit.patch',agentDiff.stdout);
 const parsedCount=gitCommitCount.status===0&&/^\d+\s*$/.test(gitCommitCount.stdout)
  ?Number(gitCommitCount.stdout.trim()):null;
 const agentCreatedCommits=Number.isSafeInteger(parsedCount)&&parsedCount>=1?parsedCount-1:null;
 const worktreeClean=gitStatus.status===0?gitStatus.stdout.trim()==='':null;
 const roadmapCommitStatus=roadmapCommitStatusPreflight(roadmapPath?
  fs.readFileSync(path.join(root,roadmapPath),'utf8'):null,{
   agent_created_commits:agentCreatedCommits,worktree_clean:worktreeClean,
   rule_selected:Object.hasOwn(p.bundle.manifest.rules,'NOM-0043')
  });
 let observation=null,observationError=null;
 try {
  observation=observe(result.stdout,p.bundle.manifest,
   ['planning','implementation','testing','shutdown']);
  privateFile(evidence,'machine-observation.json',JSON.stringify(observation,null,2)+'\n');
 }catch(error){observationError=error.message;}

 const genericFallbackRead=flags.target==='generic'?observeGenericEntrypointRead(result.stdout):null;
 const sessionStarted=hasEvent(result.stdout,'thread.started');
 const turnCompleted=hasEvent(result.stdout,'turn.completed');
 const turnFailed=hasEvent(result.stdout,'turn.failed');
 const completed=sessionStarted&&turnCompleted&&!turnFailed&&result.status===0;
 const codeTestCommitGateMet=completed&&cargoTest.status===0&&agentCreatedCommits!==null
  &&agentCreatedCommits>0&&worktreeClean===true;
 const handoffProgress=handoffProgressPreflight(result.stdout,p.bundle.manifest);
 const independentReviewGaps=[
  ...(!repositoryArtifacts.readme_present?['missing_readme']:[]),
  ...(!repositoryArtifacts.roadmap_present?['missing_roadmap']:[]),
  ...(roadmapStructurePreflight&&!roadmapStructurePreflight.ok?['roadmap_structure_incomplete']:[]),
  ...(!repositoryArtifacts.ci_workflow_present?['missing_ci_workflow']:[]),
  ...(roadmapCommitStatus.stale_commit_milestone_lines.length?
   ['roadmap_committed_git_milestone_still_in_progress']:[]),
  ...(persistenceSmoke.inspected&&!persistenceSmoke.ok?['persistence_cli_smoke_failed']:[]),
  ...(flags.target==='generic'&&!genericFallbackRead?['generic_entrypoint_read_not_observed']:[]),
  ...(cargoFmt.status!==0?['cargo_fmt_not_verified']:[]),
  ...(cargoClippy.status!==0?['cargo_clippy_not_verified']:[]),
  // Never demand invented progress percentages when NOM-0069's evidence condition
  // is unresolved. Only flag an explicitly quantified report missing its paired bar.
  ...(handoffProgress.inspected&&handoffProgress.percentage_present&&
      !handoffProgress.visual_bar_present?['handoff_quantified_progress_missing_bar']:[]),
  ...(handoffProgress.inspected&&handoffProgress.visual_bar_present&&
      !handoffProgress.percentage_present?['handoff_progress_bar_missing_percent']:[]),
  ...(handoffProgress.inspected&&handoffProgress.mismatched_visual_progress_lines?.length?
   ['handoff_numeric_visual_progress_disagree']:[]),
  ...(handoffProgress.inspected&&handoffProgress.completed_item_progress_gaps?.length?
   ['handoff_completed_items_missing_individual_progress_bars']:[]),
  ...(handoffProgress.inspected&&handoffProgress.selected_rules.includes('NOM-0070')&&
      !handoffProgress.overall_progress_present?['handoff_missing_overall_progress']:[])
 ];
 // This is a mechanical artifact preflight, NOT a source-rule or production verdict.
 // A successful Cargo test + Git commit must not disguise an obviously missing
 // new-project obligation (e.g. a required roadmap).
 const artifactPreflightMet=independentReviewGaps.length===0;
 const report={...p.snapshot,status:!sessionStarted?'launch_failed':
  !completed?'agent_turn_failed':!codeTestCommitGateMet?'agent_workflow_incomplete':
  !artifactPreflightMet?'requires_artifact_remediation':'awaiting_independent_review',
  invocation_attempted:true,session_started:sessionStarted,agent_invoked:sessionStarted,
  agent_turn_completed:completed,agent_created_commit_count:agentCreatedCommits,
  worktree_clean:worktreeClean,code_test_commit_gate_met:codeTestCommitGateMet,
  agent_versions:versions,workspace:root,private_evidence:evidence,installed_rules:installed.verified_rules,
  baseline_commit_sha:/^[a-f0-9]{40}$/.test(baselineSha)?baselineSha:null,
  head_commit_sha:/^[a-f0-9]{40}$/.test(headSha)?headSha:null,
  disposable_rule_gate:disposableRuleGate,
  roadmap_structure_preflight:roadmapStructurePreflight,
  handoff_progress_preflight:handoffProgress,
  roadmap_commit_status_preflight:roadmapCommitStatus,
  persistence_cli_smoke:persistenceSmoke,
  generic_fallback_entrypoint:{target:flags.target,explicit_read_verified:genericFallbackRead,
   skills_wrappers_present:[...p.bundle.files.keys()].some(x=>x.startsWith('.agents/skills/'))},
  repository_artifact_observations:repositoryArtifacts,
  artifact_preflight_met:artifactPreflightMet,
  independent_review_gaps:independentReviewGaps,
  evidence_summary:{codex:status(result),cargo_test:status(cargoTest),cargo_fmt:status(cargoFmt),
   cargo_clippy:status(cargoClippy),cargo_metadata:status(metadata),
   git_log:status(gitLog),git_status:status(gitStatus),git_commit_count:status(gitCommitCount),
   agent_commit_diff:status(agentDiff)},
  observed_phase_reads:observation?.parser_summary?.observed_module_reads||0,
  observed_phases:[...new Set((observation?.report?.events||[])
   .filter(event=>event.kind==='module_read').map(event=>event.receipt.phase))],
  observation_status:observation?.review?.status||'invalid_or_missing_trace',
  observation_error:observationError,
  phase_tool_reads_independently_verified:false,rule_assessments_complete:false,
  independent_reviewer_accepted:false,production_accepted:false};
 privateFile(evidence,'report.json',JSON.stringify(report,null,2)+'\n');
 privateFile(evidence,'README-review.txt',[
  'Nomos disposable synthetic Rust acceptance review (PRIVATE)',
  'Contains generated project source, local command transcripts and Codex tool events.',
  'Raw traces may include machine paths or accidental sensitive content.',
  'Inspect locally before sharing; NEVER commit this archive or its raw logs to public GitHub.',
  'A test/build/commit success is NOT independent rules conformance.',
  'Repository source is at archive root; evidence files are at the archive root as named.',
  'The .git and target directories are intentionally excluded.'
 ].join('\n')+'\n');
 try{
  const downloads=path.join(os.homedir(),'Downloads');
  const destination=fs.existsSync(downloads)&&fs.statSync(downloads).isDirectory()
   ?path.join(downloads,'nomos-'+flags.case_id.toLowerCase()+'-'+process.pid+'-'+Date.now()+'-review.tar.gz')
   :path.join(evidence,'review-bundle.tar.gz');
  const bundle=createReviewBundle(root,evidence,destination);
  report.private_review_bundle=bundle.path;
  report.private_review_bundle_sha256=bundle.sha256;
  report.private_review_bundle_bytes=bundle.bytes;
 }catch(error){
  report.private_review_bundle=null;
  report.review_bundle_error=error.message;
 }
 return report;
}
if(require.main===module){try{console.log(JSON.stringify(run(process.argv.slice(2)),null,2));}
 catch(error){console.error('Nomos acceptance refused: '+error.message);process.exitCode=1;}}
module.exports={CASES,plan,argsOf,run,preflight,hasEvent,codexArgs,codexConfig,probeDisposableGitSandbox,createReviewBundle,installDisposableRuleGate,handoffProgressPreflight,roadmapCommitStatusPreflight,progressBarPairMismatches,completedItemProgressGaps,observeGenericEntrypointRead};
