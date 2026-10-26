'use strict';
/* Standalone offline verification for an installed Nomos package; no dependencies. */
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const digest=data=>createHash('sha256').update(data).digest('hex');
function check(ok,message){if(!ok)throw new Error(message);}
function safe(name){
 check(typeof name==='string'&&name.length>0&&!path.isAbsolute(name)&&
   !name.includes('\\')&&!name.split('/').some(p=>!p||p==='.'||p==='..'),
   'Unsafe packaged relative path: '+name);
}
function regularUnder(root,name){
 safe(name);
 const abs=path.join(root,name);
 check(abs.startsWith(root+path.sep),'Package path escaped root: '+name);
 const parts=name.split('/');
 let cursor=root;
 for(const segment of parts){
  cursor=path.join(cursor,segment);
  const st=fs.lstatSync(cursor,{throwIfNoEntry:false});
  check(Boolean(st),'Missing packaged file or parent: '+name);
  check(!st.isSymbolicLink(),'Symlink is forbidden within package: '+name);
  check(segment===parts[parts.length-1]&&cursor===abs ? st.isFile() : st.isDirectory(),
    'Package path has invalid file type: '+name);
 }
 return abs;
}
function verify(root){
 check(typeof root==='string'&&root.length>0,'Explicit installed root required');
 const absolute=path.resolve(root);
 const rootInfo=fs.lstatSync(absolute,{throwIfNoEntry:false});
 check(Boolean(rootInfo)&&rootInfo.isDirectory()&&!rootInfo.isSymbolicLink(),
   'Installed root must be an existing non-symlink directory');
 const manifestPath=regularUnder(absolute,'.nomos/manifest.json');
 const projectionPath=regularUnder(absolute,'.nomos/projection.json');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 const projection=JSON.parse(fs.readFileSync(projectionPath,'utf8'));
 check(manifest?.kind==='nomos_agent_package'&&manifest.schema_version===1,
   'Unsupported package manifest');
 check(projection?.kind==='rule_projection'&&projection.status==='approved',
   'Package projection is not approved');
 check(manifest.projection_sha256===digest(JSON.stringify(projection)),
   'Projection content fingerprint mismatch');
 check(manifest.source_digest_sha256===projection.source?.digest_sha256,
   'Projection selection fingerprint mismatch');
 check(manifest.registry_revision_sha256===projection.source?.registry_revision_sha256,
   'Pinned registry revision mismatch');
 check(manifest.files&&typeof manifest.files==='object'&&!Array.isArray(manifest.files),
   'Manifest files map required');
 const names=Object.keys(manifest.files);
 check(names.includes('AGENTS.md')&&names.includes('.nomos/projection.json'),
   'Required files missing from integrity manifest');
 for(const name of names){
  const expected=manifest.files[name];
  check(/^[a-f0-9]{64}$/.test(expected),'Malformed expected hash for '+name);
  const full=regularUnder(absolute,name);
  check(digest(fs.readFileSync(full))===expected,'Packaged file changed or stale: '+name);
 }
 check(manifest.rules&&typeof manifest.rules==='object','Missing rule coverage map');
 const active=new Set(projection.decisions.filter(d=>
   d.decision==='include'||d.decision==='conditional').map(d=>d.rule_id));
 const refs=Object.entries(manifest.rules);
 check(refs.length===active.size&&refs.every(([id])=>active.has(id)),
   'Incomplete selected rule coverage');
 for(const [id,ref] of refs){
  check(names.includes(ref.path),'Rule module is not fingerprinted: '+id);
  const body=fs.readFileSync(path.join(absolute,ref.path),'utf8');
  check(body.includes('### '+id+' —')&&body.includes(ref.source_sha256),
   'Missing canonical source rule text or fingerprint: '+id);
 }
 return {verified_files:names.length,verified_rules:active.size,
  source_revision:manifest.registry_revision_sha256,agent_target:manifest.agent_target};
}
if(require.main===module){
 try{
  const result=verify(process.argv[2]||'.');
  console.log('Nomos package verified:',JSON.stringify(result));
 }catch(error){console.error('Nomos verification failed:',error.message);process.exitCode=1;}
}
module.exports={verify};
