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
 phase:'implementation',axes:{actor:'ai_agents',channel:'git_repository',visibility:'public'},features:{gui:'unknown'}};
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
 assert.ok(bundle.files.get('AGENTS.md').length<10000);
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
