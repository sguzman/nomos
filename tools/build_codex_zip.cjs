
'use strict';
// Reproducible ZIP of published canonical rules and selected prompt generations.
// Runtime consumers need only Markdown; this build utility runs in Nomos CI.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const ROOT=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=o=>JSON.stringify(o,null,2)+'\n';
const CATEGORIES={
  core:'Workflow, progress reporting, Git and universal project conventions',
  development:'Rust, software architecture and dependencies',
  ports:'Strict behavioral ports and source-language-specific migration',
  forks:'Upstream changes, patch provenance and fork maintenance',
  gui:'Interfaces, typography, themes, accessibility and project identity',
  browser:'Browser extensions, userscripts and browser artifact conventions',
  quality:'Testing, CI, verification and acceptance criteria',
  delivery:'Documentation, releases, packaging and maintenance',
  security:'Privacy, safety and public/private boundaries',
  tarium:'Tarium-specific governance, admission and publications',
  ontology:'Rule, situation, intent and representation ontologies'
};
function classify(r){
 const d=r.categories?.domains||[],t=r.categories?.topics||[],pt=r.scope?.project_types||[];
 const has=(...xs)=>xs.some(x=>d.includes(x)||t.includes(x));
 if(has('progress_reporting','visual_progress_before_after_interval_delta','project_roadmap','roadmap_status','roadmap_structure'))return 'core/progress.md';
 if(has('completion_reporting','evidence_based_status','end_of_work_action_requirement_reporting','unfinished_work_state'))return 'core/reporting.md';
 if(has('git_repository','branch_policy','commit_quality','git_history_verification','committed_state_verification','repository_sync'))return 'core/git.md';
 if(has('workflow_governance','agent_instructions','project_management','yaml_job_workflow','change_scope','workflow_stage','yaml_error_propagation','yaml_script_size','job_script_placement'))return 'core/workflow.md';
 if(has('governance','naming_restrictions'))return 'core/governance.md';
 if(has('privacy','security','safety_integrity','personal_writing','secret_management','safe_operations','private_public_boundary','public_privacy_review','information_disclosure','content_handling'))return has('security','secret_management','safe_operations','safety_integrity')?'security/safety.md':'security/privacy.md';
 if(pt.includes('tarium_project')||t.some(x=>x.startsWith('tarium_')))return has('tarium_membership','tarium_admission_preflight','tarium_autonomy')?'tarium/membership.md':'tarium/standards.md';
 if(has('ontology','ontology_gallery','ontology_representation','representation','rule_composition'))return 'ontology/representation.md';
 if(pt.includes('rust_fork_maintenance')||t.some(x=>x.startsWith('rust_fork_')))return 'forks/upstream.md';
 if(has('software_porting','strict_port_fidelity','port_fidelity','port_coverage_inventory','rust_port_coverage','rust_port_differential','differential_testing','unsafe_ffi_containment')||pt.some(x=>['software_port','python_to_rust_port','cpp_to_rust_port','c_to_rust_port'].includes(x))){
   if(pt.includes('python_to_rust_port')||/python/i.test(r.title)&&/port/i.test(r.title))return 'ports/python-to-rust.md';
   if(pt.includes('cpp_to_rust_port')||/c\+\+/i.test(r.title))return 'ports/cpp-to-rust.md';
   if(pt.includes('c_to_rust_port')||/\bC-to-Rust/i.test(r.title))return 'ports/c-to-rust.md';
   return 'ports/common.md';
 }
 if(pt.includes('browser_userscript')||has('browser_userscript_version'))return 'browser/userscripts.md';
 if(pt.includes('browser_extension')||has('browser_extension_version','browser_artifact_versioning'))return 'browser/extensions.md';
 if(has('user_interfaces','visual_identity','gui_browser_testing','gui_theme_support','theme_control','identity_color','identity_colors')||t.some(x=>x.startsWith('typography_'))){
  if(t.some(x=>x.startsWith('typography_')))return 'gui/typography.md';
  if(has('gui_theme_support','theme_control'))return 'gui/themes.md';
  if(has('identity_color','identity_colors','visual_identity'))return 'gui/visual-identity.md';
  return 'gui/interfaces.md';
 }
 if(has('ci_cd','ci_configuration','ci_quality_gates','ci_repair','ci_result_verification','ci_triggers','ci_workflows'))return 'quality/ci.md';
 if(has('qa_verification','software_testing','rust_quality','data_integrity','unit_testing','integration_testing','regression_testing','smoke_testing','deterministic_testing','edge_case_testing'))return 'quality/testing.md';
 if(has('acceptance_criteria','mvp_acceptance','mvp_evidence_standard'))return 'quality/acceptance.md';
 if(has('releases','release_readiness','release_tagging','release_automation','semantic_versioning','inaugural_release','inaugural_distribution','inaugural_version','post_mvp_releases'))return 'delivery/releases.md';
 if(has('documentation','readme_maintenance','readme_identity','documentation_audit'))return 'delivery/documentation.md';
 if(has('maintenance','artifact_packaging','license_compliance','deployment_workflows'))return 'delivery/packaging.md';
 if(has('dependency_management','lockfile_integrity'))return 'development/dependencies.md';
 if(has('project_architecture','new_rust_project','mvp_definition','mvp_scope_boundary'))return 'development/architecture.md';
 if(has('rust_development','rust_compilation','rust_formatting','rust_linting','edition_selection','rust_preference','implementation_language'))return 'development/rust.md';
 if(has('software_development'))return 'development/engineering.md';
 if(has('publication'))return 'delivery/publication.md';
 return 'core/workflow.md';
}
function block(r){
 return '## '+r.id+' — '+r.title+'\n\n'+
  '**Version:** '+r.version+' · **Kind:** '+r.norm.kind+' · **Authority:** '+r.authority.tier+'\n\n'+
  r.statement+'\n\n'+
  '**Predicate:** '+JSON.stringify(r.norm.predicate)+'\n\n'+
  '**Normative conditions:** '+JSON.stringify(r.norm.conditions||[])+'\n\n'+
  '**Normative exceptions:** '+JSON.stringify(r.norm.exceptions||[])+'\n\n'+
  '**Normative bounds:** '+JSON.stringify(r.norm.bounds||{})+'\n\n'+
  '**Project and context scope:** '+JSON.stringify(r.scope)+'\n\n'+
  '**Authority and overrides:** '+JSON.stringify(r.authority)+'\n\n'+
  '**Relations:** '+JSON.stringify(r.relations)+'\n\n'+
  '**Categories:** '+JSON.stringify(r.categories)+'\n\n'+
  '**Canonical source:** https://github.com/sguzman/nomos/blob/main/rules/'+r.id+'.json\n';
}
function buildFiles({catalog,general,special,combined,profile,published,specialVersion}){
 const publishedRules=catalog.rules.filter(r=>r.registry==='catalog'&&r.status==='published');
 if(!publishedRules.length)throw Error('No published rules');
 if(JSON.stringify(combined.entries)!==JSON.stringify([...general.entries,...special.entries]))throw Error('Combined prompt selection mismatch');
 const modules=new Map(),seen=new Set();
 for(const r of publishedRules){
  if(seen.has(r.id))throw Error('Duplicate rule '+r.id);
  seen.add(r.id);
  const dest=classify(r);
  if(!Object.hasOwn(CATEGORIES,dest.split('/')[0]))throw Error('Invalid category '+dest);
  if(!modules.has(dest))modules.set(dest,[]);
  modules.get(dest).push(r);
 }
 const versions=general.entries.map(e=>{
  const p=profile.slots.find(s=>s.key===e.key);
  if(!p)throw Error('General prompt slot missing: '+e.key);
  const version=published.selected_versions?.[p.id]||'0';
  const pub=published.published_versions.find(x=>x.key===e.key&&x.version===version);
  if(pub?(!pub.owner_approved||sha(e.text)!==pub.sha256):(version!=='0'||sha(e.text)!==p.text_sha256))throw Error('Unapproved/mismatched prompt '+e.key);
  return {key:e.key,version,sha256:sha(e.text)};
 });
 const specialVersions=special.entries.map(e=>({key:e.key,version:specialVersion,sha256:sha(e.text)}));
 const files=new Map();
 const modulePaths=[...modules.keys()].sort();
 const lines=['# Nomos rule library index','',
  'This is a library of **published canonical rules**, not an automatic activation of every rule. Consult original project scope, conditions, exceptions, and authority. An optional preference remains optional; a Tarium-only rule does not govern an unrelated project.','',
  'For project work consult `core/progress.md`, `core/reporting.md` and `core/workflow.md` when available. Read additional modules for the current task. Revisit other categories as work changes. Each rule has one home; related modules can be consulted together.','',
  '## Categories',''];
 for(const [category,description] of Object.entries(CATEGORIES)){
  lines.push('### '+category+'/',description,'');
  const paths=modulePaths.filter(p=>p.startsWith(category+'/'));
  if(!paths.length)lines.push('No published rules assigned.','');
  for(const p of paths)lines.push('- ['+p.slice(category.length+1)+']('+p+') ('+modules.get(p).length+' rules)');
  lines.push('');
 }
 lines.push('## Updates','',
  'See `VERSION.md` for pinned source revisions and `prompts/current-trievium.json` for the **selected approved prompt texts**. That keyset is reference material, not a demand to execute every initializer. Download a new ZIP to update; installed repositories never change themselves.','');
 files.set('.nomos/INDEX.md',lines.join('\n'));
 for(const p of modulePaths)files.set('.nomos/'+p,
  '# Nomos / '+p+'\n\n'+
  'These rule records are reference material. Apply only when their original scope and conditions are met. Keep exceptions and preferences intact.\n\n'+
  modules.get(p).sort((a,b)=>a.id.localeCompare(b.id)).map(block).join('\n---\n\n'));
 const canonical=publishedRules.map(r=>{const {registry,situational_analysis,...source}=r;return {id:r.id,version:r.version,sha256:sha(JSON.stringify(source))};});
 const metadata={schema_version:1,kind:'nomos_codex_modular_reference',published_rule_count:publishedRules.length,
  canonical_source_digest:sha(JSON.stringify(canonical)),combined_prompt_digest:sha(json(combined)),
  selected_general_prompts:versions,selected_specialized_prompts:specialVersions,
  policy:'Reference export only; rule applicability and owner approvals preserved'};
 files.set('.nomos/VERSION.md','# Nomos Codex package provenance\n\n'+
  '- Published canonical rules: **'+metadata.published_rule_count+'**\n'+
  '- Canonical source SHA-256: `'+metadata.canonical_source_digest+'`\n'+
  '- Current combined prompt SHA-256: `'+metadata.combined_prompt_digest+'`\n'+
  '- Selected general versions: '+versions.map(x=>x.key+' V'+x.version).join(', ')+'\n'+
  '- Specialized initializers: V'+specialVersion+' ('+special.entries.length+' prompts)\n\n'+
  'Prompts are stored for version reference only. Their presence does not automatically initiate or authorize work.\n');
 files.set('.nomos/prompts/current-trievium.json',json(combined));
 files.set('.nomos/README.md','# Nomos Codex package\n\n'+
  'Extract this archive in the project root. No Nomos runtime, Node installation or verifier scripts are needed.\n\n'+
  'If an `AGENTS.md` exists, **do not overwrite it**: review and merge the new entrypoint into that file. Existing project instructions remain valid. This package never updates automatically.\n\n'+
  'Start at `.nomos/INDEX.md`, consult applicable core modules and task-specific references, and inspect `.nomos/VERSION.md` to track canonical and prompt revisions.\n');
 files.set('AGENTS.md','# Codex + Nomos repository instructions\n\n'+
  'This repository uses a modular Nomos rule library. Start each task by reading `.nomos/INDEX.md` and available `.nomos/core/progress.md`, `.nomos/core/reporting.md`, and `.nomos/core/workflow.md`.\n\n'+
  'Before specialist work, read relevant modules in `.nomos/gui/`, `.nomos/ports/`, `.nomos/forks/`, `.nomos/development/`, `.nomos/browser/`, `.nomos/quality/`, `.nomos/delivery/`, `.nomos/security/`, `.nomos/tarium/` or `.nomos/ontology/`. Consult new modules if scope changes.\n\n'+
  'Never treat library presence as blanket rule activation. Apply the original canonical statement only to its stated scope, retain its conditions and exceptions, and distinguish preferences from mandates. Follow explicit owner/project instructions and do not invent work outside authorized goals.\n\n'+
  'Report actual verified progress, completion percent, percentage-point delta and relevant blockers, without inventing activity. Once authorized work is 100% verified complete, stop.\n\n'+
  'Selected historical/current prompts in `.nomos/prompts/current-trievium.json` are references, not automatic activation of 24 simultaneous instructions.\n\n'+
  'If a project already has `AGENTS.md`, merge these instructions without overwriting the original.\n');
 return {files,modules,metadata};
}
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let j=0;j<8;j++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);return c>>>0;});
function crc32(b){let c=0xffffffff;for(const x of b)c=crcTable[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function zip(files){
 const local=[],central=[];let offset=0,n=0;
 for(const [name,body] of [...files].sort(([a],[b])=>a.localeCompare(b))){
  if(name.startsWith('/')||name.includes('\\')||name.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Unsafe ZIP name '+name);
  const nameBytes=Buffer.from(name),raw=Buffer.from(body),compressed=zlib.deflateRawSync(raw,{level:9}),c=crc32(raw);
  const h=Buffer.alloc(30),cd=Buffer.alloc(46);
  h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt16LE(0x0800,6);h.writeUInt16LE(8,8);
  h.writeUInt32LE(c,14);h.writeUInt32LE(compressed.length,18);h.writeUInt32LE(raw.length,22);h.writeUInt16LE(nameBytes.length,26);
  cd.writeUInt32LE(0x02014b50,0);cd.writeUInt16LE(20,4);cd.writeUInt16LE(20,6);cd.writeUInt16LE(0x0800,8);
  cd.writeUInt16LE(8,10);cd.writeUInt32LE(c,16);cd.writeUInt32LE(compressed.length,20);cd.writeUInt32LE(raw.length,24);
  cd.writeUInt16LE(nameBytes.length,28);cd.writeUInt32LE(0x81a40000,38);cd.writeUInt32LE(offset,42);
  local.push(h,nameBytes,compressed);central.push(cd,nameBytes);offset+=h.length+nameBytes.length+compressed.length;n++;
 }
 if(n>65535)throw Error('Too many ZIP entries');
 const dir=Buffer.concat(central),end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(n,8);end.writeUInt16LE(n,10);end.writeUInt32LE(dir.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...local,dir,end]);
}
function generate(){
 const versions=fs.readdirSync(path.join(ROOT,'end-consumer-profiles/project-initializers'))
  .filter(v=>/^v\d+$/.test(v)&&fs.existsSync(path.join(ROOT,'end-consumer-profiles/project-initializers',v,'publication.json')))
  .map(v=>load('end-consumer-profiles/project-initializers/'+v+'/publication.json'))
  .filter(p=>p.generated_at_build===true&&p.approval_reference)
  .sort((a,b)=>Number(b.version)-Number(a.version));
 if(!versions.length)throw Error('No approved specialized prompt publication');
 const bundle=buildFiles({catalog:load('docs/catalog.json'),
  general:load('docs/exports/project-stewardship-approved-trievium.json'),
  special:load('docs/exports/project-initializers-trievium.json'),
  combined:load('docs/exports/project-stewardship-with-initializers-trievium.json'),
  published:load('docs/data/project-stewardship-published-versions.json'),
  profile:load('end-consumer-profiles/project-stewardship/profile.json'),specialVersion:versions[0].version});
 const archive=zip(bundle.files);
 const manifest={...bundle.metadata,zip_sha256:sha(archive),zip_bytes:archive.length,
  module_paths:[...bundle.modules.keys()].sort(),archive_paths:[...bundle.files.keys()].sort()};
 return {bundle,archive,manifest};
}
function run(check=process.argv[2]==='--check'){
 const {archive,manifest}=generate();
 const zipPath=path.join(ROOT,'docs/exports/nomos-codex.zip'),mPath=path.join(ROOT,'docs/exports/nomos-codex-manifest.json');
 const expected=json(manifest);
 if(check){
  if(!fs.existsSync(zipPath)||!fs.readFileSync(zipPath).equals(archive)||!fs.existsSync(mPath)||fs.readFileSync(mPath,'utf8')!==expected)
   throw Error('Current Codex ZIP/manifest differs from generated source');
 }else{
  fs.mkdirSync(path.dirname(zipPath),{recursive:true});
  fs.writeFileSync(zipPath,archive);fs.writeFileSync(mPath,expected);
 }
 return {published_rules:manifest.published_rule_count,modules:manifest.module_paths.length,
  files:manifest.archive_paths.length,zip_bytes:archive.length,sha256:manifest.zip_sha256,check};
}
if(require.main===module){try{if(process.argv.length>3||process.argv[2]&&!['--check'].includes(process.argv[2]))throw Error('Usage: node tools/build_codex_zip.cjs [--check]');console.log(JSON.stringify(run()));}catch(e){console.error(e.stack||e);process.exitCode=1;}}
module.exports={classify,buildFiles,zip,generate,run};
