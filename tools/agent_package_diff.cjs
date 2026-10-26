'use strict';
/* Compare two independently verified, pinned agent packages. No automatic migration. */
const fs=require('node:fs');
const path=require('node:path');
const {verify}=require('./agent_package_verify.cjs');
function ensure(value,message){if(!value)throw new Error(message);}
function sorted(items){return items.slice().sort();}
function compareEntries(a,b,eq){
 const oldKeys=new Set(Object.keys(a||{})),newKeys=new Set(Object.keys(b||{}));
 const added=sorted([...newKeys].filter(x=>!oldKeys.has(x)));
 const removed=sorted([...oldKeys].filter(x=>!newKeys.has(x)));
 const changed=sorted([...newKeys].filter(x=>oldKeys.has(x)&&!eq(a[x],b[x])));
 return {added,removed,changed};
}
function diff(oldManifest,newManifest){
 for(const m of [oldManifest,newManifest]){
  ensure(m?.kind==='nomos_agent_package'&&m.schema_version===1,
   'Both inputs must be supported pinned package manifests');
  ensure(m.rules&&m.files&&m.phase_routes,'Missing package rules or phase routes');
 }
 const rules=compareEntries(oldManifest.rules,newManifest.rules,
  (a,b)=>JSON.stringify(a)===JSON.stringify(b));
 const files=compareEntries(oldManifest.files,newManifest.files,(a,b)=>a===b);
 const phases=compareEntries(oldManifest.phase_routes,newManifest.phase_routes,
  (a,b)=>JSON.stringify(a)===JSON.stringify(b));
 const fields=['agent_target','source_digest_sha256','registry_revision_sha256','projection_sha256'];
 const changedIdentity=fields.filter(name=>oldManifest[name]!==newManifest[name]);
 const hasChanges=Boolean(changedIdentity.length||Object.values(rules).some(x=>x.length)||
   Object.values(files).some(x=>x.length)||Object.values(phases).some(x=>x.length));
 return {
  kind:'nomos_agent_package_comparison',schema_version:1,
  status:hasChanges?'review_required':'identical',
  old:{target:oldManifest.agent_target,registry_revision_sha256:oldManifest.registry_revision_sha256,
   projection_sha256:oldManifest.projection_sha256},
  next:{target:newManifest.agent_target,registry_revision_sha256:newManifest.registry_revision_sha256,
   projection_sha256:newManifest.projection_sha256},
  changed_identity_fields:changedIdentity,rule_changes:rules,file_changes:files,phase_route_changes:phases,
  export_or_install_authorized:false,
  warning:'Comparison is nonmutating. Changes require separate owner review and explicit installation; never silently replace an existing AGENTS.md.'
 };
}
function compareDirectories(oldRoot,newRoot){
 ensure(typeof oldRoot==='string'&&oldRoot.length>0&&typeof newRoot==='string'&&newRoot.length>0,
  'Two explicit package directories are required');
 verify(oldRoot);verify(newRoot);
 const read=root=>JSON.parse(fs.readFileSync(path.join(path.resolve(root),'.nomos/manifest.json'),'utf8'));
 return diff(read(oldRoot),read(newRoot));
}
if(require.main===module){
 try{
  const [previous,next,...extra]=process.argv.slice(2);
  ensure(previous&&next&&!extra.length,'Usage: node tools/agent_package_diff.cjs <old-package-directory> <new-package-directory>');
  console.log(JSON.stringify(compareDirectories(previous,next),null,2));
 }catch(error){console.error('Nomos package comparison failed:',error.message);process.exitCode=1;}
}
module.exports={diff,compareDirectories};
