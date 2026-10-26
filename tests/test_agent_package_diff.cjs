'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const catalog=require('../docs/catalog.json');
const hierarchy=require('../taxonomy/project-types.json');
const {decide}=require('../tools/projections.cjs');
const {compile,install}=require('../tools/agent_package.cjs');
const {diff,compareDirectories}=require('../tools/agent_package_diff.cjs');
const context={kind:'project_context',version:'1.0.0',
 project_types:['rust_project_from_scratch'],types_exhaustive:true,phase:'implementation',
 axes:{actor:'ai_agent',channel:'git_repository',visibility:'public'},features:{}};
const approval={source_selection_confirmed:true,project_context_reviewed:true,projection_confirmed:true};
function bundle(ids){
 const selection={type:'rules',rule_ids:ids};
 return compile(decide({catalog,hierarchy,selection,context,approval}),catalog);
}
test('identical verified manifest comparisons are nonmutating',()=>{
 const p=bundle(['NOM-0008','NOM-0015']);
 const d=diff(p.manifest,p.manifest);
 assert.equal(d.status,'identical');
 assert.equal(d.export_or_install_authorized,false);
 assert.deepEqual(d.rule_changes,{added:[],removed:[],changed:[]});
});
test('comparison exposes added rule, modified modules and changed selection digest',()=>{
 const earlier=bundle(['NOM-0008','NOM-0015']);
 const later=bundle(['NOM-0008','NOM-0015','NOM-0034']);
 const change=diff(earlier.manifest,later.manifest);
 assert.equal(change.status,'review_required');
 assert.deepEqual(change.rule_changes.added,['NOM-0034']);
 assert.ok(change.file_changes.changed.includes('.nomos/projection.json'));
 assert.ok(change.changed_identity_fields.includes('source_digest_sha256'));
 assert.equal(change.export_or_install_authorized,false);
});
test('offline directories must pass integrity verification before comparison',()=>{
 const old=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-before-'));
 const next=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-after-'));
 try{
  const a=bundle(['NOM-0008','NOM-0015']);
  const b=bundle(['NOM-0008','NOM-0015','NOM-0034']);
  install(a,old,{write:true,confirmedExport:true});
  install(b,next,{write:true,confirmedExport:true});
  const change=compareDirectories(old,next);
  assert.deepEqual(change.rule_changes.added,['NOM-0034']);
  assert.equal(fs.readFileSync(path.join(old,'AGENTS.md'),'utf8'),a.files.get('AGENTS.md'));
  fs.appendFileSync(path.join(next,'AGENTS.md'),'unverified modification');
  assert.throws(()=>compareDirectories(old,next),/changed or stale/);
 }finally{
  fs.rmSync(old,{recursive:true,force:true});
  fs.rmSync(next,{recursive:true,force:true});
 }
});
test('unsupported package schema versions and missing paths cannot pass comparisons',()=>{
 const b=bundle(['NOM-0008']);
 assert.throws(()=>diff({...b.manifest,schema_version:2},b.manifest),/supported/);
 assert.throws(()=>compareDirectories('', ''),/explicit/);
});
