'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),read=(p,r=ROOT)=>JSON.parse(fs.readFileSync(path.join(r,p),'utf8'));
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0'+s).digest('hex');
function check(root=ROOT){
 const m=read('audits/new-rust-project-remediation-manifest-2026-10-25.json',root),
  a=read('audits/new-rust-project-coverage-2026-10-25.json',root),
  cross=read('ontology/rule-analysis/new-rust-remediation-crosswalk.json',root);
 const rows=m.records,used=new Set();
 if(rows.length!==13||a.reviewed_candidates.length!==13||Object.keys(cross.entries).length!==13||cross.status!=='reviewed')
  throw Error('Incomplete new Rust coverage audit and canonical crosswalk');
 for(let n=0;n<13;n++){
  const x=rows[n],id='NOM-'+String(223+n).padStart(4,'0'),qid='RIA-'+id.slice(-4);
  if(x.id!==id||used.has(id)||x.scope!=='rust_project_from_scratch'||a.reviewed_candidates[n].id!==id)
   throw Error('Rule identity or audit mismatch '+id);
  const raw=fs.readFileSync(path.join(root,'rules',id+'.json'),'utf8'),rule=JSON.parse(raw);
  const link=read('ontology/rule-links/new-rust-remediation/RLINK-'+id.slice(-4)+'.json',root);
  const queue=read('queues/new-rust-remediation/'+qid+'.json',root),
    trace=read('processing/new-rust-remediation/PROC-'+qid+'.json',root);
  if(rule.id!==id||rule.statement!==x.statement||rule.status!=='published'||
     rule.scope.project_types.join()!=='rust_project_from_scratch'||
     !rule.provenance.reference.includes(x.key))throw Error('Incorrect new Rust rule '+id);
  if(blob(raw)!==queue.source.git_blob_sha||blob(raw)!==trace.source.git_blob_sha||
     blob(raw)!==link.evidence.source_blob_sha||
     link.evidence.source_statement!==rule.statement||
     JSON.stringify(link.evidence.normalized_predicate)!==JSON.stringify(rule.norm.predicate))
    throw Error('Source blob integrity mismatch '+id);
  const sids=link.situations.map(y=>y.id),iids=link.intents.map(y=>y.id),
    expected=cross.entries[qid];
  if(!expected||expected.rule_id!==id||
     JSON.stringify(expected.situation_ids)!==JSON.stringify(sids)||
     JSON.stringify(expected.intent_ids)!==JSON.stringify(iids)||
     queue.source.rule_id!==id||trace.queue_id!==qid||
     queue.status!=='processed'||trace.status!=='closed'||
     link.rule_id!==id||link.rule_editorial_status!=='published'||
     link.provenance.queue_id!==qid)throw Error('Rule concept/provenance mapping failed '+id);
  for(const q of [queue.authorization,trace.authorization]){
   if(!q.processing||!q.publication||q.profile_selection_confirmation!==false||
      q.profile_finalization!==false||q.rule_activation!==false)
    throw Error('Draft selection or rule activation was not authorized '+id);
  }
  for(const sid of sids)if(!fs.existsSync(path.join(root,'ontology/situations',sid+'.json')))throw Error('Missing situation '+sid);
  for(const iid of iids)if(!fs.existsSync(path.join(root,'ontology/intents',iid+'.json')))throw Error('Missing intent '+iid);
  used.add(id);
 }
 const lite=read('profiles/history/2026-10-25-rule-first/PROFILE-0003.json',root),full=read('profiles/history/2026-10-25-rule-first/PROFILE-0004.json',root);
 for(const [p,n,add] of [[lite,45,m.lite_added_rules],[full,106,m.full_added_rules]]){
  if(p.selected_rule_ids.length!==n||new Set(p.selected_rule_ids).size!==n||p.status!=='draft'||
     p.review.selection_confirmed||p.review.finalization_confirmed||
     add.some(x=>!p.selected_rule_ids.includes(x)))throw Error('Unconfirmed draft source changed '+p.id);
 }
 if(m.lite_added_rules.length!==10||m.full_added_rules.length!==16||
    !lite.selected_rule_ids.every(x=>full.selected_rule_ids.includes(x)))
  throw Error('New Rust Lite/Full selection mismatch');
 for(const id of ['NOM-0135','NOM-0136','NOM-0137'])
  if(!full.selected_rule_ids.includes(id))throw Error('Omitted already-published rule '+id);
 for(const name of fs.readdirSync(path.join(root,'profiles')).filter(x=>/^PROFILE-\d+\.json$/.test(x)&&!['PROFILE-0003.json','PROFILE-0004.json'].includes(x))){
  if(read('profiles/'+name,root).selected_rule_ids.some(id=>used.has(id)))
   throw Error('Source-specific new Rust rule leaked into unrelated profile '+name);
 }
 return {new_rules:13,new_situations:9,new_intents:13,lite_rules:45,full_rules:106};
}
if(require.main===module){try{console.log('Validated new Rust project coverage',JSON.stringify(check()));}catch(e){console.error(e.message);process.exitCode=1}}
module.exports={check};
