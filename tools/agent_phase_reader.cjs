'use strict';
/* Local, read-only, verifiable phase instruction delivery. No agent-compliance claim. */
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const digest=s=>createHash('sha256').update(s,'utf8').digest('hex');
const fail=(condition,message)=>{if(!condition)throw new Error(message);};
function readPhase(root,phase,verify){
  fail(typeof phase==='string'&&/^[a-z_]+$/.test(phase),'A supported phase name is required');
  fail(typeof root==='string'&&root.length>0,'A package root is required');
  // Verify every package byte and rule coverage before returning any phase instructions.
  const verified=verify(root);
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'.nomos','manifest.json'),'utf8'));
  fail(manifest.schema_version===1&&manifest.kind==='nomos_agent_package',
    'Unsupported agent package manifest');
  fail(Object.hasOwn(manifest.phase_routes,phase),'Unsupported work phase: '+phase);
  const paths=manifest.phase_routes[phase];
  fail(Array.isArray(paths)&&new Set(paths).size===paths.length,'Duplicate or missing phase module path');
  const active=new Set(Object.values(manifest.rules).map(ref=>ref.path));
  const records=paths.map(relative=>{
    fail(active.has(relative),'Phase route references unselected rules: '+relative);
    fail(/^\.nomos\/rules\/[a-z0-9_-]+\.md$/.test(relative),
      'Phase route must refer to a scoped module');
    const text=fs.readFileSync(path.join(root,relative),'utf8');
    fail(digest(text)===manifest.files[relative],'Phase module fingerprint drift: '+relative);
    return {relative_path:relative,sha256:digest(text),bytes:Buffer.byteLength(text),content:text};
  });
  return {
    receipt:{kind:'nomos_phase_read_receipt',schema_version:1,phase,
      projection_sha256:manifest.projection_sha256,
      registry_revision_sha256:manifest.registry_revision_sha256,
      agent_target:manifest.agent_target,
      package_verified:true,
      verified_files:verified.verified_files,
      modules:records.map(({relative_path,sha256,bytes})=>({relative_path,sha256,bytes}))},
    contents:records
  };
}
function run(argv,{verify,root=path.resolve(__dirname,'..')}={}){
  if(!verify)throw new Error('An independent offline verifier is required');
  if(argv.length!==1)throw new Error('Usage: node .nomos/read-phase.cjs <planning|implementation|review|testing|ci|release|shutdown|maintenance>');
  return readPhase(root,argv[0],verify);
}
if(require.main===module){
  try{
    const {verify}=require(path.join(__dirname,'verify.cjs'));
    const result=run(process.argv.slice(2),{verify});
    process.stdout.write('NOMOS_PHASE_READ '+JSON.stringify(result.receipt)+'\n');
    for(const entry of result.contents){
      process.stdout.write('\n===== '+entry.relative_path+' =====\n'+entry.content+'\n');
    }
  }catch(error){
    process.stderr.write('Nomos phase read refused: '+error.message+'\n');
    process.exitCode=1;
  }
}
module.exports={readPhase,run};
