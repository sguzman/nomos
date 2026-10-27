'use strict';
/* Model-free independent CLI smoke test for the disposable RUST-PERSIST case.
 * Only synthetic temp files. This does not substitute for agent-authored tests
 * or human source-rule acceptance. */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const cp=require('node:child_process');

function binaryFromCargoMetadata(text,root){
 const metadata=JSON.parse(text);
 const manifest=path.join(path.resolve(root),'Cargo.toml');
 const pkg=metadata.packages?.find(p=>path.resolve(p.manifest_path)===manifest);
 const bins=pkg?.targets?.filter(target=>target.kind?.includes('bin'))||[];
 if(bins.length!==1||!bins[0].name||!metadata.target_directory)
  throw new Error('Expected exactly one current Cargo binary target');
 const name=bins[0].name;
 return {name,path:path.join(metadata.target_directory,'debug',name+(process.platform==='win32'?'.exe':''))};
}

function verifyPersistenceCli(root,options={}){
 const prefix=path.join(os.tmpdir(),'nomos-luna-case-');
 if(!path.resolve(root).startsWith(prefix))throw new Error('Persistence smoke requires disposable case root');
 let binary=options.binaryPath||null;
 let cargoTarget=options.binaryPath?'explicit_test_fixture':null;
 const skipBuild=options.skipBuild===true;
 const commands=[];
 const call=(exe,args)=>{
  const r=cp.spawnSync(exe,args,{cwd:root,encoding:'utf8',timeout:15000,maxBuffer:1024*1024,env:{...process.env,RUSTC_WRAPPER:''}});
  commands.push({command:path.basename(exe),args:args.map((arg,i)=>arg===binary?'[binary]':arg.includes('nomos-persist-smoke-')?'[private temporary journal]':arg),exit_code:r.status});
  return {ok:r.status===0,error:r.error?.message||null,stdout:r.stdout||'',stderr:r.stderr||''};
 };
 const checks={};
 const failed=[];
 const check=(name,pass)=>{checks[name]=Boolean(pass);if(!pass)failed.push(name);};
 let smokeRoot=null;
 try{
  if(!binary){
   const metadata=call('cargo',['metadata','--no-deps','--offline','--format-version','1']);
   if(!metadata.ok)return {inspected:true,ok:false,failed:['cargo_target_metadata_failed'],
    checks,command_count:commands.length,error:metadata.error||metadata.stderr.slice(0,250)};
   const target=binaryFromCargoMetadata(metadata.stdout,root);
   binary=target.path;
   cargoTarget=target.name;
  }
  if(!skipBuild){
   const build=call('cargo',['build','--offline','--quiet','--bin',cargoTarget]);
   check('rust_binary_build',build.ok);
   if(!build.ok)return {inspected:true,ok:false,failed,checks,command_count:commands.length,error:'cargo_build_failed'};
  }
  if(!fs.existsSync(binary))return {inspected:true,ok:false,failed:['missing_binary'],
   checks,command_count:commands.length,binary_target:cargoTarget};
  smokeRoot=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-persist-smoke-'));
  fs.chmodSync(smokeRoot,0o700);
  const journal=path.join(smokeRoot,'entries.log');
  const absent=path.join(smokeRoot,'absent.log');
  const missing=call(binary,['list',absent]);
  check('missing_journal_lists_empty',missing.ok&&missing.stdout===''&&!fs.existsSync(absent));
  const first=call(binary,['append',journal,'first entry']);
  const firstBytes=fs.existsSync(journal)?fs.readFileSync(journal):Buffer.alloc(0);
  check('append_creates_file',first.ok&&firstBytes.length>0);
  const second=call(binary,['append',journal,'snowman ☃']);
  const secondBytes=fs.existsSync(journal)?fs.readFileSync(journal):Buffer.alloc(0);
  check('append_utf8_roundtrip',second.ok);
  const third=call(binary,['append',journal,'line one\nline two']);
  const thirdBytes=fs.existsSync(journal)?fs.readFileSync(journal):Buffer.alloc(0);
  check('append_embedded_newline',third.ok);
  const listing=call(binary,['list',journal]);
  check('list_public_cli_output',listing.ok&&listing.stdout==='first entry\nsnowman ☃\nline one\nline two\n');
  // Filesystem evidence plus a fresh CLI process establishes persisted data.
  // No part of the authorized task requires hex, base64, JSON or any other
  // particular on-disk representation.
  check('durable_on_disk_roundtrip',firstBytes.length>0&&secondBytes.length>0&&
   thirdBytes.length>0&&!firstBytes.equals(secondBytes)&&
   !secondBytes.equals(thirdBytes)&&
   fs.readFileSync(journal).equals(thirdBytes)&&listing.ok);
  // Invalid UTF-8 is synthetic corruption for this text-journal exercise.
  // Reviewers still judge documented corruption semantics independently.
  fs.appendFileSync(journal,Buffer.from([0xff,0xfe,0x0a]));
  const malformed=call(binary,['list',journal]);
  check('malformed_records_read_recovery',malformed.ok&&malformed.stdout===listing.stdout);
  const recovery=call(binary,['append',journal,'after recovery']);
  const recovered=call(binary,['list',journal]);
  check('append_after_malformed_preserves_valid_records',
   recovery.ok&&recovered.ok&&
   recovered.stdout===listing.stdout+'after recovery\n');
  // A corrupted prefix/version marker must never make append silently erase
  // valid later entries. On an unrecognizable file the implementation may
  // refuse to append and leave bytes untouched, or recover valid records.
  const intact=fs.readFileSync(journal);
  const damaged=Buffer.from(intact);
  if(damaged.length)damaged[0]^=0x80;
  fs.writeFileSync(journal,damaged);
  const corruptedAppend=call(binary,['append',journal,'after corruption']);
  const afterCorruption=fs.readFileSync(journal);
  let protectedData=!corruptedAppend.ok&&afterCorruption.equals(damaged);
  if(corruptedAppend.ok){
   const restored=call(binary,['list',journal]);
   protectedData=restored.ok&&
    restored.stdout.includes('snowman ☃\n')&&
    restored.stdout.includes('line one\nline two\n')&&
    restored.stdout.includes('after corruption\n');
  }
  check('corrupted_prefix_preserves_valid_entries_or_refuses',protectedData);
  const syntax=call(binary,['bogus',journal]);
  check('invalid_command_rejected',!syntax.ok);
  const noParent=call(binary,['append',path.join(smokeRoot,'missing-parent','blocked.log'),'do not write']);
  check('missing_parent_write_rejected',!noParent.ok&&
   !fs.existsSync(path.join(smokeRoot,'missing-parent')));
  return {inspected:true,ok:failed.length===0,checks,failed,
   command_count:commands.length,binary_target:cargoTarget};
 }catch(error){
  return {inspected:true,ok:false,checks,failed:[...failed,'smoke_execution_error'],
   command_count:commands.length,binary_target:cargoTarget,error:String(error?.message||error).slice(0,350)};
 }finally{
  if(smokeRoot)fs.rmSync(smokeRoot,{recursive:true,force:true,maxRetries:3,retryDelay:100});
 }
}
module.exports={verifyPersistenceCli,binaryFromCargoMetadata};
if(require.main===module){
 const root=process.argv[2];
 if(!root){console.error('Required: disposable case directory');process.exitCode=2;}
 else{
  const result=verifyPersistenceCli(root);
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
 }
}
