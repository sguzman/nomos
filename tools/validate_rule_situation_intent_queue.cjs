'use strict';
// Integrity validation only. No extraction, LLM invocation, or ontology modification.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const ROOT=path.resolve(__dirname,'..');
const QUEUE='queues/rule-situation-intent';
const TARGETS=[
  'applicable_situations',
  'desired_outcomes',
  'atomicity_and_nonintent_roles',
  'existing_ontology_reuse',
  'candidate_semantic_links'
];
const APPROVALS={
  intake_authorized:true,
  processing_authorized:false,
  normalization_authorized:false,
  publication_authorized:false,
  canonical_rule_edit_authorized:false,
  profile_edit_authorized:false
};
const KEYS={
  top:['id','kind','status','source','requested_analysis','authorization','governance','processing'],
  source:['rule_id','path','version','status_at_snapshot','snapshot_commit','git_blob_sha'],
  governance:['queued_on','source_basis']
};
const expectedIds=Array.from({length:137},(_,i)=>'RIA-'+String(i+1).padStart(4,'0'));
function identicalKeys(a,expected) {
  return a!==null && typeof a==='object' && !Array.isArray(a)
    && Object.keys(a).sort().join('|')===expected.slice().sort().join('|');
}
function blobHash(bytes){
  return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
    .update(bytes).digest('hex');
}
function verify(root=ROOT){
  const errors=[],drifted=[];
  const dir=path.join(root,QUEUE);
  let names=[];
  try{names=fs.readdirSync(dir).filter(x=>/^RIA-\d{4}\.json$/.test(x)).sort();}
  catch(e){return {count:0,errors:[String(e)],drifted};}
  const expectedNames=expectedIds.map(id=>id+'.json');
  if(names.join('|')!==expectedNames.join('|'))
    errors.push('Expected exactly 137 distinct intake files from RIA-0001 to RIA-0137');
  const seenSources=new Set(),commits=new Set();
  for(const name of names){
    const pathname=path.join(dir,name);
    let record;
    try{record=JSON.parse(fs.readFileSync(pathname,'utf8'));}
    catch(e){errors.push(name+': unreadable JSON: '+e.message);continue;}
    const err=msg=>errors.push(name+': '+msg);
    if(!identicalKeys(record,KEYS.top)){err('unapproved or missing top-level fields');continue;}
    if(record.id!==name.slice(0,-5)||record.kind!=='rule_situation_intent_analysis_intake'
      ||record.status!=='processed'){err('invalid queue identity or state');continue;}
    if(!record.processing || record.processing.state!=='closed' || record.processing.record!=='processing/rule-situation-intent/PROC-'+record.id+'.json' || record.processing.authorization!=='owner_explicit_full_processing_request')err('missing authorized processing reference');
    if(!identicalKeys(record.source,KEYS.source)){err('source fields mismatch');continue;}
    const src=record.source;
    const ruleId='NOM-'+record.id.slice(4);
    if(src.rule_id!==ruleId||src.path!=='rules/'+ruleId+'.json'){err('nonmatching canonical source identity');continue;}
    if(seenSources.has(ruleId))err('duplicate rule source');
    seenSources.add(ruleId);
    if(!/^\d+\.\d+\.\d+$/.test(src.version))err('invalid source version');
    if(!['published','draft','reviewed','deprecated'].includes(src.status_at_snapshot))err('invalid original editorial status');
    if(!/^[0-9a-f]{40}$/.test(src.snapshot_commit)||!/^[0-9a-f]{40}$/.test(src.git_blob_sha))
      err('source snapshot/blob hashes must be full git SHA-1 strings');
    commits.add(src.snapshot_commit);
    if(!Array.isArray(record.requested_analysis)||
      record.requested_analysis.length!==TARGETS.length||
      record.requested_analysis.some((v,i)=>v!==TARGETS[i]))
      err('analysis targets differ from the authorized study scope');
    if(!identicalKeys(record.authorization,Object.keys(APPROVALS))||
      Object.keys(APPROVALS).some(k=>record.authorization[k]!==APPROVALS[k]))
      err('analysis/normalization/publication or canonical edit was implicitly authorized');
    if(!identicalKeys(record.governance,KEYS.governance)||
      record.governance.queued_on!=='2026-10-24'||
      record.governance.source_basis!=='existing_public_canonical_rule')
      err('unexpected provenance/governance');
    const current=path.join(root,src.path);
    try{
      const data=fs.readFileSync(current),hash=blobHash(data);
      if(hash!==src.git_blob_sha){
        // Snapshot is immutable provenance, not a permanent lock on legitimate future rule edits.
        drifted.push(ruleId);
      }else{
        const rule=JSON.parse(data.toString('utf8'));
        if(rule.id!==ruleId||rule.version!==src.version||rule.status!==src.status_at_snapshot)
          err('version/status contradict source blob identity');
      }
    }catch(e){err('canonical source no longer available: '+e.message);}
  }
  if(commits.size!==1)errors.push('All queue entries must refer to one shared canonical snapshot');
  return {count:names.length,errors,drifted};
}
if(require.main===module){
  const result=verify();
  for(const e of result.errors)console.error('ERROR:',e);
  if(result.errors.length)process.exitCode=1;
  else console.log('Validated '+result.count+' processed rule-analysis records; '+result.drifted.length+' source files drifted from pinned snapshot');
}
module.exports={verify,blobHash,TARGETS,APPROVALS};
