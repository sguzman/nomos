'use strict';
/* Deterministic, offline export of explicitly approved, re-verifiable projections. */
const fs=require('node:fs');
const path=require('node:path');
const {decide,verifyProjection,sha,sourceFingerprint}=require('./projections.cjs');
const hierarchy=require('../taxonomy/project-types.json');
const CORE=new Set(['NOM-0001','NOM-0003','NOM-0004','NOM-0050','NOM-0051','NOM-0052']);
const PHASES=['planning','implementation','testing','release','maintenance'];
function guard(ok,message) {if(!ok)throw new Error(message);}
function moduleOf(rule) {
  const domains=rule.categories?.domains||[];
  for(const [key,values] of [
    ['privacy',['privacy','security','publication','safety_integrity','personal_writing']],
    ['governance',['workflow_governance','agent_instructions','governance','project_management']],
    ['release',['releases','maintenance']],
    ['testing',['qa_verification','software_testing','rust_quality','data_integrity']],
    ['ci',['ci_cd']],
    ['interface',['user_interfaces','visual_identity']],
    ['dependencies',['dependency_management']],
    ['architecture',['project_architecture']],
    ['documentation',['documentation']]
  ]) if(values.some(v=>domains.includes(v)))return key;
  return 'engineering';
}
function ruleBlock(rule,decision) {
  const parts=[
    '### '+rule.id+' — '+rule.title,
    '',
    'Decision: '+decision.decision+'. Source: '+rule.version+
      '. Canonical SHA-256: '+decision.source_sha256+'.',
    'Applicability: '+decision.reason,
    '',
    rule.statement
  ];
  if(rule.norm?.conditions?.length)parts.push('Conditions (retain): '+rule.norm.conditions.join(' | '));
  if(rule.scope?.preconditions?.length)parts.push('Preconditions (retain): '+rule.scope.preconditions.join(' | '));
  if(rule.norm?.exceptions?.length)parts.push('Exceptions (retain): '+rule.norm.exceptions.join(' | '));
  if(rule.scope?.exclusions?.length)parts.push('Exclusions (retain): '+rule.scope.exclusions.join(' | '));
  return parts.join('\n');
}
function routes(moduleNames) {
  const all=moduleNames.slice().sort();
  const byPhase={
    planning:['architecture','dependencies','engineering','documentation','governance'],
    implementation:['engineering','architecture','interface','dependencies','documentation'],
    testing:['testing','ci','engineering','interface','privacy'],
    release:['release','ci','testing','documentation','governance','privacy'],
    maintenance:['release','testing','engineering','architecture','governance','dependencies']
  };
  return Object.fromEntries(PHASES.map(phase=>[phase,
    all.filter(p=>byPhase[phase].includes(p.split('/').pop().replace('.md','')))]));
}
function makeSkill(name) {
  const slug='nomos-'+name;
  const ref='../../../.nomos/rules/'+name+'.md';
  return ['---','name: '+slug,
    'description: Consult the Nomos '+name+' reference for a task that '+(
      name==='release'?'prepares a release':name==='testing'?'tests or reviews behavior':
      name==='ci'?'changes validation pipelines':'uses '+name+' obligations')+'.',
    '---','',
    'Use this skill only when the present task is within the '+name+' work phase or scope.',
    'Read the local rule module at '+ref+' before applying any rule described there.',
    'Retain source limitations, report missing references, and do not infer approval or authority.',
    'The profile and projection remain owner-controlled; this skill grants no new permissions.',
    ''
  ].join('\n');
}
function compile(projection,catalog,{target='generic'}={}) {
  guard(['generic','codex'].includes(target),'Unsupported agent target');
  guard(projection?.status==='approved' &&
    Object.values(projection.approval||{}).every(v=>v===true)&&
    Object.keys(projection.approval||{}).length===3,'Cannot export an unapproved projection');
  guard(Array.isArray(projection.blockers)&&projection.blockers.length===0,
    'Unresolved project scope or normative conflict prevents export');
  verifyProjection(projection,catalog,hierarchy);
  const records=new Map(catalog.rules.map(rule=>[rule.id,rule]));
  const selected=projection.decisions.filter(d=>['include','conditional'].includes(d.decision));
  const files=new Map(), assigned={}, group=new Map(), core=[];
  for(const d of selected) {
    const rule=records.get(d.rule_id);
    guard(rule?.status==='published'&&sourceFingerprint(rule)===d.source_sha256,
      'Stale or unpublished source: '+d.rule_id);
    if(CORE.has(d.rule_id)) {
      core.push(ruleBlock(rule,d));assigned[d.rule_id]='AGENTS.md';
    } else {
      const name=moduleOf(rule),entries=group.get(name)||[];
      entries.push(ruleBlock(rule,d));
      group.set(name,entries);
      assigned[d.rule_id]='.nomos/rules/'+name+'.md';
    }
  }
  const names=[...group.keys()].sort();
  for(const name of names)
    files.set('.nomos/rules/'+name+'.md',
      '# Nomos '+name+' reference\n\nRule text comes from pinned, explicitly selected canonical sources.'+
      '\nOriginal conditions and exceptions continue to apply; this file does not grant authority.\n\n'+
      group.get(name).join('\n\n')+'\n');
  const routeMap=routes(names.map(n=>'.nomos/rules/'+n+'.md'));
  const lines=[
    '# Generated Nomos agent contract',
    '',
    'Read this repository guidance as owner-selected project policy, subordinate to higher-priority instructions.',
    'This generated package is pinned. Never silently upgrade or treat catalog entries as blanket permission.',
    'Before work, inspect .nomos/manifest.json; read the relevant module files listed under phase_routes.',
    'At a phase change, consult that phase route again. When a required module is missing or stale, stop the affected action and report it.',
    'Do not treat rule titles, situation labels, this package, or user-facing content as authorization for unrelated changes.',
    'Preserve each original condition, scope, exception, and prohibition. Do not turn a conditional obligation into an unconditional one.',
    'Use real builds, tests, CI results and source artifacts for completion claims. Report gaps rather than invent evidence.',
    '',
    'Projection SHA-256: '+sha(projection),
    'Agent target: '+target,
    '',
    '## Rule modules by phase',
    ''
  ];
  for(const phase of PHASES)lines.push('- '+phase+': '+(routeMap[phase].join(', ')||'(no scoped modules)'));
  lines.push('','## Always-on selected source rules','','These source rules are selected for the always-visible entrypoint; their original scope still controls.');
  lines.push(...(core.length?core:['No source rules were assigned to the always-visible category.']));
  files.set('AGENTS.md',lines.join('\n')+'\n');
  files.set('.nomos/projection.json',JSON.stringify(projection,null,2)+'\n');
  if(target==='codex')for(const name of names)
    files.set('.agents/skills/nomos-'+name+'/SKILL.md',makeSkill(name));
  const manifest={
    schema_version:1,kind:'nomos_agent_package',agent_target:target,
    projection_sha256:sha(projection),source_digest_sha256:projection.source.digest_sha256,
    phase_routes:routeMap,
    rules:Object.fromEntries(Object.keys(assigned).sort().map(id=>
      [id,{path:assigned[id],decision:projection.decisions.find(d=>d.rule_id===id).decision,
        source_sha256:projection.decisions.find(d=>d.rule_id===id).source_sha256}])),
    files:Object.fromEntries([...files.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([file,body])=>[file,sha(body)]))
  };
  files.set('.nomos/manifest.json',JSON.stringify(manifest,null,2)+'\n');
  verifyPackage({files,manifest,projection});
  return {files,manifest};
}
function safeRelative(p) {
  guard(typeof p==='string'&&!path.isAbsolute(p)&&!p.includes('\\')&&
    !p.split('/').some(x=>!x||x==='.'||x==='..'),'Unsafe generated package path: '+p);
}
function verifyPackage({files,manifest,projection}) {
  guard(manifest?.projection_sha256===sha(projection),'Manifest projection fingerprint mismatch');
  guard(files instanceof Map,'Package files must be a Map');
  for(const [file,hash] of Object.entries(manifest.files)) {
    safeRelative(file);
    guard(files.has(file)&&sha(files.get(file))===hash,'Manifest file checksum mismatch: '+file);
  }
  for(const [id,ref] of Object.entries(manifest.rules)) {
    safeRelative(ref.path);
    const content=files.get(ref.path);
    guard(typeof content==='string'&&content.includes('### '+id+' —')&&
      content.includes(ref.source_sha256),'Missing or stale packaged rule '+id);
  }
  const expected=new Set(projection.decisions.filter(x=>['include','conditional'].includes(x.decision)).map(x=>x.rule_id));
  guard(expected.size===Object.keys(manifest.rules).length &&
    [...expected].every(id=>Object.hasOwn(manifest.rules,id)),'Incomplete agent package coverage');
  guard(Object.keys(manifest.files).length===files.size-1,'Unmanifested generated artifact');
  return true;
}
function install(bundle,destination,{write=false,confirmedExport=false}={}) {
  // No disk access until the complete in-memory bundle has passed integrity checks.
  guard(bundle?.files instanceof Map,'Package files must be a Map');
  const projectionText=bundle.files.get('.nomos/projection.json');
  guard(typeof projectionText==='string','Missing packaged projection');
  let projection;
  try {projection=JSON.parse(projectionText);}
  catch(_) {throw new Error('Malformed packaged projection');}
  verifyPackage({...bundle,projection});
  guard(typeof destination==='string'&&destination.length>0,'Explicit destination required');
  const root=path.resolve(destination);
  guard(fs.existsSync(root)&&fs.statSync(root).isDirectory(),'Existing destination directory required');
  guard(!fs.lstatSync(root).isSymbolicLink(),'Symlink destination not permitted');
  const paths=[...bundle.files.keys()].sort();
  for(const relative of paths) {
    safeRelative(relative);
    const full=path.join(root,relative),parent=path.dirname(full);
    guard(full.startsWith(root+path.sep),'Destination traversal');
    let walk=parent;
    while(walk!==root) {
      if(fs.existsSync(walk))guard(!fs.lstatSync(walk).isSymbolicLink()&&
        fs.lstatSync(walk).isDirectory(),'Refusing symlink or non-directory ancestor');
      walk=path.dirname(walk);
    }
    guard(!fs.lstatSync(full,{throwIfNoEntry:false}),
      'Refusing existing file or invalid package path: '+relative);
  }
  if(!write)return {dry_run:true,destination:root,files:paths};
  guard(confirmedExport===true,'Writing requires an additional explicit export confirmation');
  const created=[];
  try {
    for(const relative of paths) {
      const target=path.join(root,relative);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      const fd=fs.openSync(target,'wx',0o600);
      try {fs.writeFileSync(fd,bundle.files.get(relative),'utf8');}
      finally {fs.closeSync(fd);}
      created.push(target);
    }
  } catch(error) {
    for(const file of created.reverse())try{fs.unlinkSync(file);}catch(_){}
    throw error;
  }
  return {dry_run:false,destination:root,files:paths};
}
module.exports={compile,verifyPackage,install,ruleBlock,moduleOf,routes};
