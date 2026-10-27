'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const catalog=require('../docs/catalog.json');
const hierarchy=require('../taxonomy/project-types.json');
const {decide}=require('../tools/projections.cjs');
const {compile,verifyPackage,install}=require('../tools/agent_package.cjs');
const context={kind:'project_context',version:'1.0.0',
 project_types:['rust_project_from_scratch'],types_exhaustive:true,
 phase:'implementation',axes:{actor:'ai_agent',channel:'git_repository',visibility:'public'},features:{gui:'unknown'}};
const approvals={source_selection_confirmed:true,project_context_reviewed:true,projection_confirmed:true};
function approved() {
 return decide({catalog,hierarchy,selection:{type:'rules',
  rule_ids:['NOM-0001','NOM-0008','NOM-0015','NOM-0029','NOM-0034','NOM-0234']},
  context,approval:approvals});
}
test('approved projections compile into compact entrypoint plus scoped rule modules',()=>{
 const projection=approved(), bundle=compile(projection,catalog);
 assert.ok(bundle.files.has('AGENTS.md'));
 assert.ok(bundle.files.has('.nomos/manifest.json'));
 assert.ok(bundle.files.has('.nomos/projection.json'));
 assert.ok([...bundle.files.keys()].some(x=>x.startsWith('.nomos/rules/')));
 const entrypoint=bundle.files.get('AGENTS.md');
 assert.ok(entrypoint.length<10000);
 assert.match(entrypoint,/identify selected conditional rules activated/);
 assert.match(entrypoint,/planning checklist keyed by active source rule ID/);
 assert.match(entrypoint,/revisit that checklist against the committed candidate/);
 assert.match(entrypoint,/check every activated project-bootstrap, documentation, code-quality, CI and Git rule/);
 assert.match(entrypoint,/report any gap as unfinished/);
 assert.equal(verifyPackage({...bundle,projection}),true);
 assert.equal(Object.keys(bundle.manifest.rules).length,
   projection.decisions.filter(d=>['include','conditional'].includes(d.decision)).length);
});
test('one canonical rule has exactly one assigned location, never hidden duplicates',()=>{
 const projection=approved(),bundle=compile(projection,catalog);
 const data=Object.values(bundle.manifest.rules);
 for(const r of data)assert.equal(typeof bundle.files.get(r.path),'string');
 assert.equal(bundle.manifest.rules['NOM-0001'].path,'AGENTS.md');
 assert.ok(bundle.files.get(bundle.manifest.rules['NOM-0234'].path).includes('Decision: conditional'));
});
test('repeated compilations from identical inputs are byte-for-byte stable',()=>{
 const p=approved();
 assert.deepEqual([...compile(p,catalog).files.entries()],[...compile(p,catalog).files.entries()]);
 assert.equal(compile(p,catalog).manifest.projection_sha256,compile(p,catalog).manifest.projection_sha256);
});
test('Codex adapter emits local discoverable Skills, never assumes their actual invocation',()=>{
 const bundle=compile(approved(),catalog,{target:'codex'});
 const files=[...bundle.files.keys()].filter(x=>x.endsWith('/SKILL.md'));
 assert.ok(files.length>=1);
 assert.ok(files.every(x=>bundle.files.get(x).includes('description:')));
 assert.ok(files.every(x=>bundle.files.get(x).includes('Read the local rule module')));
});
test('unconfirmed source profile cannot export and forged decisions are rejected',()=>{
 const draft=decide({catalog,hierarchy,selection:{type:'profile',profile_id:'PROFILE-0004'},context});
 assert.throws(()=>compile(draft,catalog),/unapproved/);
 const p=approved();p.decisions[0].reason='inserted';
 assert.throws(()=>compile(p,catalog),/differs/);
});
test('stale normative statements invalidate otherwise-approved packages',()=>{
 const p=approved(), altered=JSON.parse(JSON.stringify(catalog));
 const r=altered.rules.find(x=>x.id==='NOM-0008');r.statement+=' altered';
 assert.throws(()=>compile(p,altered),/differs|Stale/);
});
test('dry-run install does not create files and actual install requires explicit confirmation',()=>{
 const p=approved(),bundle=compile(p,catalog);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-package-'));
 try {
  const first=install(bundle,root);
  assert.equal(first.dry_run,true);
  assert.equal(fs.readdirSync(root).length,0);
  assert.throws(()=>install(bundle,root,{write:true}),/confirmation/);
  const result=install(bundle,root,{write:true,confirmedExport:true});
  assert.equal(result.dry_run,false);
  assert.equal(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'),bundle.files.get('AGENTS.md'));
  assert.throws(()=>install(bundle,root,{write:true,confirmedExport:true}),/existing file/);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('preexisting AGENTS.md cannot be overwritten even on dry run',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-collision-'));
 try {
  fs.writeFileSync(path.join(root,'AGENTS.md'),'owner instructions');
  assert.throws(()=>install(compile(approved(),catalog),root,{write:true,confirmedExport:true}),/existing file/);
  assert.equal(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'),'owner instructions');
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('symlink ancestors and unknown agent targets are refused',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-link-'));
 try {
  fs.symlinkSync(os.tmpdir(),path.join(root,'.nomos'));
  assert.throws(()=>install(compile(approved(),catalog),root),/symlink/);
  assert.throws(()=>compile(approved(),catalog,{target:'unknown'}),/Unsupported/);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('tampered module content fails manifest verification',()=>{
 const p=approved(),bundle=compile(p,catalog);
 bundle.files.set('AGENTS.md',bundle.files.get('AGENTS.md')+'tampered');
 assert.throws(()=>verifyPackage({...bundle,projection:p}),/checksum/);
});

test('refuses parent traversal even when bundle metadata is tampered',()=>{
  const bundle=compile(approved(),catalog),root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-traversal-'));
  try {
    bundle.files.set('../escape','unsafe');
    assert.throws(()=>install(bundle,root),/Unsafe generated package path/);
    assert.equal(fs.readdirSync(root).length,0);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('Unicode source text is preserved in deterministic package modules',()=>{
  const fake=JSON.parse(JSON.stringify(catalog));
  const rule=fake.rules.find(x=>x.id==='NOM-0008');
  rule.statement+=' — 文章';
  const p=decide({catalog:fake,hierarchy,selection:{type:'rules',rule_ids:['NOM-0008']},
    context,approval:approvals});
  const bundle=compile(p,fake);
  const location=bundle.manifest.rules['NOM-0008'].path;
  assert.ok(bundle.files.get(location).includes('— 文章'));
  assert.equal(verifyPackage({...bundle,projection:p}),true);
});
test('manifest never fabricates hidden unselected catalog rule references',()=>{
  const p=approved(),bundle=compile(p,catalog);
  const projected=new Set(p.decisions.filter(d=>['include','conditional'].includes(d.decision)).map(d=>d.rule_id));
  assert.deepEqual(new Set(Object.keys(bundle.manifest.rules)),projected);
  for(const id of Object.keys(bundle.manifest.rules))
    assert.ok(p.source.rule_ids.includes(id));
});
test('package checksum includes complete source-projection version and context',()=>{
  const p=approved(),bundle=compile(p,catalog);
  const clone=JSON.parse(JSON.stringify(p));
  clone.context.features.gui='yes';
  assert.notEqual(bundle.manifest.projection_sha256,require('../tools/projections.cjs').sha(clone));
  assert.throws(()=>verifyPackage({...bundle,projection:clone}),/fingerprint/);
});

test('installation rejects modified bundles before creating destination artifacts',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-integrity-'));
 try {
  const bundle=compile(approved(),catalog);
  bundle.files.set('AGENTS.md',bundle.files.get('AGENTS.md')+'not authorized');
  assert.throws(()=>install(bundle,root,{write:true,confirmedExport:true}),/checksum/);
  assert.deepEqual(fs.readdirSync(root),[]);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('dangling symlink destination cannot masquerade as an absent target',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-dangling-'));
 try {
  fs.symlinkSync('nonexistent-target',path.join(root,'AGENTS.md'));
  assert.throws(()=>install(compile(approved(),catalog),root),/existing file/);
  assert.equal(fs.lstatSync(path.join(root,'AGENTS.md')).isSymbolicLink(),true);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('manifest bytes and registry revision cannot be detached from approved projection',()=>{
  const p=approved(),bundle=compile(p,catalog);
  assert.equal(bundle.manifest.registry_revision_sha256,p.source.registry_revision_sha256);
  const forged=compile(p,catalog);
  forged.manifest.registry_revision_sha256='0'.repeat(64);
  assert.throws(()=>verifyPackage({...forged,projection:p}),/registry revision/);
  const corrupted=compile(p,catalog);
  corrupted.files.set('.nomos/manifest.json','{}');
  assert.throws(()=>verifyPackage({...corrupted,projection:p}),/Manifest file differs/);
});


test('Codex Skills references and phase routes resolve to packaged files',()=>{
 const bundle=compile(approved(),catalog,{target:'codex'});
 for(const files of Object.values(bundle.manifest.phase_routes))
   for(const file of files)assert.ok(bundle.files.has(file),'Missing phase route: '+file);
 for(const [file,body] of bundle.files){
   if(!file.endsWith('/SKILL.md'))continue;
   const match=body.match(/Read the local rule module at (\.\.\/[^\s]+\.md)/);
   assert.ok(match,'Missing module reference '+file);
   const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));
   assert.ok(bundle.files.has(resolved),'Broken reference: '+resolved);
 }
});
test('synthetic approved ad hoc selection from full 106-rule New Rust proposal covers all applicable members',()=>{
 // This is synthetic QA authorization, not approval/finalization of the actual PROFILE-0004 draft.
 const ids=catalog.profiles.find(p=>p.id==='PROFILE-0004').selected_rule_ids;
 const c=JSON.parse(JSON.stringify(context));
 c.axes={channel:'git_repository',visibility:'public',artifact_kind:'repository_content',actor:'ai_agent'};
 const selection={type:'rules',rule_ids:ids};
 const p=decide({catalog,hierarchy,selection,context:c});
 assert.equal(p.decisions.length,106);
 assert.equal(p.source.rule_ids.length,106);
 const blockers=p.blockers;
 assert.deepEqual(blockers,[],'Unexpected unresolved scope/conflict: '+blockers.join('; '));
 const a=decide({catalog,hierarchy,selection,context:c,approval:approvals});
 const compiled=compile(a,catalog,{target:'codex'});
 assert.ok(compiled.files.get('AGENTS.md').length<12000);
 const applicable=a.decisions.filter(x=>['include','conditional'].includes(x.decision));
 assert.equal(Object.keys(compiled.manifest.rules).length,applicable.length);
 assert.ok(compiled.files.has('.nomos/manifest.json'));
 assert.equal(verifyPackage({...compiled,projection:a}),true);
});

test('privacy and governance modules are routed through every phase',()=>{
 const {routes}=require('../tools/agent_package.cjs');
 const paths=['.nomos/rules/privacy.md','.nomos/rules/governance.md',
   '.nomos/rules/testing.md'];
 const route=routes(paths);
 for(const selected of Object.values(route)){
  assert.ok(selected.includes('.nomos/rules/privacy.md'));
  assert.ok(selected.includes('.nomos/rules/governance.md'));
 }
 assert.ok(route.testing.includes('.nomos/rules/testing.md'));
 assert.throws(()=>routes(['.nomos/rules/unmapped_module.md']),/no phase route/);
});

test('installed packages detect phase-refresh drift with the bundled offline verifier',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-verify-'));
 try {
  const p=approved(),bundle=compile(p,catalog,{target:'generic'});
  assert.ok(bundle.files.has('.nomos/verify.cjs'));
  install(bundle,root,{write:true,confirmedExport:true});
  const {verify}=require('../tools/agent_package_verify.cjs');
  const valid=verify(root);
  assert.equal(valid.verified_rules,Object.keys(bundle.manifest.rules).length);
  const cli=require('node:child_process').execFileSync(process.execPath,
    [path.join(root,'.nomos/verify.cjs'),root],{encoding:'utf8'});
  assert.match(cli,/Nomos package verified/);
  const member=Object.values(bundle.manifest.rules).find(ref=>ref.path!=='AGENTS.md');
  assert.ok(member);
  fs.appendFileSync(path.join(root,member.path),'\nchanged outside package\n');
  assert.throws(()=>verify(root),/changed or stale/);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('runtime verifier refuses missing and symlinked reference modules',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-verify-link-'));
 try {
  const bundle=compile(approved(),catalog);
  install(bundle,root,{write:true,confirmedExport:true});
  const {verify}=require('../tools/agent_package_verify.cjs');
  const target=Object.values(bundle.manifest.rules).find(ref=>ref.path!=='AGENTS.md').path;
  fs.rmSync(path.join(root,target));
  assert.throws(()=>verify(root),/Missing packaged file/);
  fs.symlinkSync(path.join(root,'AGENTS.md'),path.join(root,target));
  assert.throws(()=>verify(root),/Symlink is forbidden/);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('packaged file digests hash actual UTF-8 bytes, not JSON-encoded strings',()=>{
 const bundle=compile(approved(),catalog);
 const {createHash}=require('node:crypto');
 for(const [name,expected] of Object.entries(bundle.manifest.files)){
  assert.equal(expected,createHash('sha256').update(bundle.files.get(name),'utf8').digest('hex'),name);
 }
});

test('review CI and shutdown phases route relevant modules',()=>{
 const {routes}=require('../tools/agent_package.cjs');
 const paths=['.nomos/rules/privacy.md','.nomos/rules/governance.md',
   '.nomos/rules/ci.md','.nomos/rules/testing.md',
   '.nomos/rules/release.md','.nomos/rules/engineering.md'];
 const map=routes(paths);
 assert.deepEqual(Object.keys(map).sort(),
   ['planning','implementation','review','testing','ci','release','shutdown','maintenance'].sort());
 assert.ok(map.review.includes('.nomos/rules/testing.md'));
 assert.ok(map.ci.includes('.nomos/rules/ci.md'));
 assert.ok(map.shutdown.includes('.nomos/rules/release.md'));
 for(const phase of Object.keys(map))for(const name of ['privacy','governance'])
   assert.ok(map[phase].includes('.nomos/rules/'+name+'.md'),phase);
});

test('unknown projection or package schema is refused before installation',()=>{
 const base=compile(approved(),catalog);
 const p=approved();
 const bad=structuredClone(p);bad.schema_version=2;
 assert.throws(()=>verifyPackage({files:base.files,manifest:base.manifest,projection:bad}),
   /Unsupported packaged projection/);
 const badContext=structuredClone(p);badContext.context.version='9.0.0';
 assert.throws(()=>verifyPackage({files:base.files,manifest:base.manifest,projection:badContext}),
   /Unsupported packaged projection/);
 const altered=structuredClone(base.manifest);altered.schema_version=3;
 assert.throws(()=>verifyPackage({files:base.files,manifest:altered,projection:p}),
   /Unsupported agent package/);
 const target=structuredClone(base.manifest);target.agent_target='unknown';
 assert.throws(()=>verifyPackage({files:base.files,manifest:target,projection:p}),
   /Unsupported agent package/);
});
