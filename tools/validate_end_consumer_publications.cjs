'use strict';
// Release-time integrity check, independent of the browser's SHA-256 gate.
// Does not infer or fabricate approval: only validates recorded publication fields.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const model=require('../docs/end-consumer-profile-model.js');
const root=path.resolve(__dirname,'..');
const bytes=p=>fs.readFileSync(path.join(root,p));
const json=p=>JSON.parse(bytes(p).toString('utf8'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function validate(){
  const sourcePath='end-consumer-profiles/project-stewardship/v0/trievium.json';
  const publishedPath='docs/exports/project-stewardship-v0.json';
  const profile=json('end-consumer-profiles/project-stewardship/profile.json');
  const source=json(sourcePath);
  const manifest=json('docs/data/project-stewardship-published-versions.json');
  const raw=bytes(sourcePath);
  if(!raw.equals(bytes(publishedPath)))throw Error('Exact V0 public download diverges from original');
  if(profile.current_version!=='0'||sha(raw)!==profile.versions[0].source_sha256)
    throw Error('V0 version/source hash changed unexpectedly');
  const catalog=model.makeCatalog(profile,source,manifest);
  if(catalog.length!==profile.slots.length)throw Error('Slot count differs');
  for(const slot of catalog){
    if(slot.versions[0].version!=='0')
      throw Error('Original prompt was no longer the default');
    for(const version of slot.versions){
      if(sha(version.text)!==version.sha256)throw Error('Published text SHA mismatch: '+slot.id+' v'+version.version);
      if(version.origin==='owner_approved' && /^(synthetic|fixture|test)(?:[-_:]|$)/i.test(version.approvalReference))
        throw Error('Synthetic test approval reference cannot be published: '+slot.id);
    }
  }
  const total=catalog.reduce((n,slot)=>n+slot.versions.length-1,0);
  if(total!==manifest.published_versions.length)throw Error('Published version count mismatch');
  const original=model.makeTrievium(catalog);
  if(JSON.stringify(original)!==JSON.stringify({version:1,entries:source.entries.map(e=>({label:e.label,text:e.text,key:e.key}))}))
    throw Error('Default selected keyset is no longer V0');
  return {slots:catalog.length,approvedSuccessors:total,sourceSha256:sha(raw)};
}
if(require.main===module){
  try{console.log('Publication integrity passed:',JSON.stringify(validate()));}
  catch(e){console.error('Publication integrity FAILED:',e.message);process.exitCode=1;}
}
module.exports={validate};
