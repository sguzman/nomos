'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const catalog=require('../docs/catalog.json');
const hierarchy=require('../taxonomy/project-types.json');
const {decide}=require('../tools/projections.cjs');
const {compile,install}=require('../tools/agent_package.cjs');
const {verify}=require('../tools/agent_package_verify.cjs');
const {readPhase}=require('../tools/agent_phase_reader.cjs');
const context={
 kind:'project_context',version:'1.0.0',
 project_types:['rust_project_from_scratch'],types_exhaustive:true,
 phase:'implementation',axes:{actor:'ai_agent',channel:'git_repository',visibility:'public'},
 features:{gui:'unknown'}
};
const approval={source_selection_confirmed:true,project_context_reviewed:true,projection_confirmed:true};
function fixture(target='generic'){
 const projection=decide({catalog,hierarchy,selection:{type:'rules',
  rule_ids:['NOM-0001','NOM-0008','NOM-0015','NOM-0029','NOM-0034','NOM-0234']},
  context,approval});
 return compile(projection,catalog,{target});
}
function inTemporaryPackage(fn,target='generic'){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-phase-'));
 try{const bundle=fixture(target);install(bundle,root,{write:true,confirmedExport:true});return fn(root,bundle);}
 finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('a real CLI read checks hashes and returns a machine-verifiable phase receipt with actual module contents',()=>{
 inTemporaryPackage((root,bundle)=>{
  const cmd=path.join(root,'.nomos/read-phase.cjs');
  const stdout=execFileSync(process.execPath,[cmd,'implementation'],{encoding:'utf8',cwd:root});
  const header=stdout.split('\n',1)[0];
  assert.ok(header.startsWith('NOMOS_PHASE_READ '));
  const receipt=JSON.parse(header.slice('NOMOS_PHASE_READ '.length));
  assert.equal(receipt.kind,'nomos_phase_read_receipt');
  assert.equal(receipt.phase,'implementation');
  assert.equal(receipt.projection_sha256,bundle.manifest.projection_sha256);
  assert.equal(receipt.registry_revision_sha256,bundle.manifest.registry_revision_sha256);
  assert.equal(receipt.package_verified,true);
  const viaAPI=readPhase(root,'implementation',verify);
  assert.deepEqual(receipt,viaAPI.receipt);
  assert.ok(stdout.includes('### NOM-0008 —'),'Agent receives selected source rule text');
  for(const entry of receipt.modules){
   assert.equal(entry.sha256,bundle.manifest.files[entry.relative_path]);
   assert.ok(stdout.includes('===== '+entry.relative_path+' ====='));
  }
  assert.deepEqual(fs.readdirSync(root).sort(),['.nomos','AGENTS.md'].sort());
 });
});
test('phase lookup refuses unknown phase and modified module before exposing instructions',()=>{
 inTemporaryPackage((root,bundle)=>{
  const cmd=path.join(root,'.nomos/read-phase.cjs');
  assert.throws(()=>readPhase(root,'unknown',verify),/Unsupported work phase/);
  const bad=spawnSync(process.execPath,[cmd,'unknown'],{cwd:root,encoding:'utf8'});
  assert.notEqual(bad.status,0);
  assert.match(bad.stderr,/Unsupported work phase/);
  const member=Object.values(bundle.manifest.rules).find(x=>x.path!=='AGENTS.md');
  fs.appendFileSync(path.join(root,member.path),'\nexternally modified\n');
  const result=spawnSync(process.execPath,[cmd,'implementation'],{cwd:root,encoding:'utf8'});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/changed or stale/);
  assert.ok(!result.stdout.includes('NOMOS_PHASE_READ'));
 });
});
test('Codex and generic phase receipts are independent of automatic Skill discovery',()=>{
 for(const target of ['generic','codex']){
  inTemporaryPackage((root,bundle)=>{
   const summary=readPhase(root,'testing',verify);
   assert.equal(summary.receipt.agent_target,target);
   assert.equal(summary.receipt.package_verified,true);
   assert.deepEqual(summary.receipt.modules.map(x=>x.relative_path),bundle.manifest.phase_routes.testing);
  },target);
 }
});

