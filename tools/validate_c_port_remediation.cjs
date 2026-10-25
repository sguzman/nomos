'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const read=(p,r=ROOT)=>JSON.parse(fs.readFileSync(path.join(r,p),'utf8'));
const blob=raw=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(raw)+'\0'+raw).digest('hex');
function check(root=ROOT){
 const m=read('audits/c-port-remediation-manifest-2026-10-25.json',root);
 const a=read('audits/c-port-coverage-2026-10-25.json',root);
 const cross=read('ontology/rule-analysis/c-remediation-crosswalk.json',root);
 const rows=m.c_specific_records,shared=new Set(m.shared_rule_ids),used=new Set();
 if(rows.length!==23||a.candidates.length!==23||cross.status!=='reviewed'||
    Object.keys(cross.entries).length!==23||shared.size!==5)throw Error('Incomplete normalized C coverage study');
 for(const id of shared){
  const r=read('rules/'+id+'.json',root);
  if(r.status!=='published'||r.scope.project_types.join()!=='software_port')
   throw Error('C profile reused a language-specific rule '+id);
 }
 for(const id of ['NOM-0140','NOM-0141','NOM-0144'])
  if(shared.has(id))throw Error('Copied rule overlapping original C-only rule '+id);
 for(let i=0;i<23;i++){
  const row=rows[i],id='NOM-'+String(200+i).padStart(4,'0'),qid='RIA-'+id.slice(-4);
  if(row.id!==id||used.has(id)||row.scope!=='c_to_rust_port'||
     a.candidates[i].id!==id)throw Error('Invalid rule identity '+id);
  const raw=fs.readFileSync(path.join(root,'rules',id+'.json'),'utf8'),r=JSON.parse(raw);
  const link=read('ontology/rule-links/c-remediation/RLINK-'+id.slice(-4)+'.json',root);
  const queue=read('queues/c-remediation/'+qid+'.json',root);
  const trace=read('processing/c-remediation/PROC-'+qid+'.json',root);
  if(r.id!==id||r.status!=='published'||r.statement!==row.statement||
     r.scope.project_types.join()!=='c_to_rust_port'||!r.provenance.reference.includes(row.key))
    throw Error('C norm mismatch '+id);
  if(blob(raw)!==queue.source.git_blob_sha||blob(raw)!==trace.source.git_blob_sha||
     blob(raw)!==link.evidence.source_blob_sha||
     link.evidence.source_statement!==r.statement||
     JSON.stringify(link.evidence.normalized_predicate)!==JSON.stringify(r.norm.predicate))
    throw Error('C source evidence mismatch '+id);
  const sids=link.situations.map(x=>x.id),iids=link.intents.map(x=>x.id),caseRef=cross.entries[qid];
  if(queue.status!=='processed'||trace.status!=='closed'||trace.queue_id!==qid||
     queue.source.rule_id!==id||link.rule_id!==id||link.rule_editorial_status!=='published'||
     link.provenance.queue_id!==qid||!caseRef||caseRef.rule_id!==id||
     JSON.stringify(caseRef.situation_ids)!==JSON.stringify(sids)||
     JSON.stringify(caseRef.intent_ids)!==JSON.stringify(iids))throw Error('C mapping provenance incomplete '+id);
  for(const auth of [queue.authorization,trace.authorization]){
   if(!auth.processing||!auth.publication||auth.profile_finalization!==false||
      auth.rule_activation!==false||auth.original_profile_selection_confirmed!==true)
    throw Error('C approval/finalization boundary drift '+id);
  }
  for(const sid of sids)if(!fs.existsSync(path.join(root,'ontology/situations',sid+'.json')))throw Error('Unknown situation '+sid);
  for(const iid of iids)if(!fs.existsSync(path.join(root,'ontology/intents',iid+'.json')))throw Error('Unknown intent '+iid);
  used.add(id);
 }
 const lite=read('profiles/PROFILE-0001.json',root),full=read('profiles/PROFILE-0002.json',root);
 for(const [p,expected,added] of [[lite,61,m.lite_profile_additions],[full,121,m.full_profile_additions]]){
  if(p.status!=='draft'||!p.review.selection_confirmed||p.review.finalization_confirmed||
     p.selected_rule_ids.length!==expected||new Set(p.selected_rule_ids).size!==expected||
     added.some(id=>!p.selected_rule_ids.includes(id)))throw Error('C profile selection history changed '+p.id);
 }
 if(m.lite_profile_additions.length!==20||m.full_profile_additions.length!==28||
    ![...lite.selected_rule_ids].every(id=>full.selected_rule_ids.includes(id)))throw Error('Invalid C draft membership');
 for(const id of ['NOM-0111','NOM-0112','NOM-0113'])
   if(!lite.selected_rule_ids.includes(id)||!full.selected_rule_ids.includes(id))throw Error('Lost source C-only rule '+id);
 for(const name of fs.readdirSync(path.join(root,'profiles')).filter(x=>/^PROFILE-\d+\.json$/.test(x)&&!['PROFILE-0001.json','PROFILE-0002.json'].includes(x))){
  if(read('profiles/'+name,root).selected_rule_ids.some(id=>used.has(id)))
   throw Error('C source rule leaked to unrelated profile '+name);
 }
 return {new_rules:23,new_situations:10,new_intents:14,full_rules:121,lite_rules:61,shared_rules:5};
}
if(require.main===module){try{console.log('Validated C-to-Rust coverage remediation',JSON.stringify(check()));}
catch(e){console.error(e.message);process.exitCode=1}}
module.exports={check};
