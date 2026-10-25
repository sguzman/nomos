'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=(rel,root=ROOT)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const blob=raw=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(raw)+'\0'+raw).digest('hex');
function check(root=ROOT){
 const m=read('audits/cpp-port-remediation-manifest-2026-10-25.json',root);
 const a=read('audits/cpp-port-coverage-2026-10-25.json',root);
 const cross=read('ontology/rule-analysis/cpp-remediation-crosswalk.json',root);
 if(m.records.length!==24||a.candidate_evidence.length!==24||
    Object.keys(cross.entries).length!==24||cross.status!=='reviewed')throw Error('Incomplete 24 C++ atom audit');
 const ids=new Set(),shared=new Set(m.shared_published_rule_ids);
 if(shared.size!==8||[...shared].some(id=>read('rules/'+id+'.json',root).scope.project_types.join()!=='software_port'))
  throw Error('Shared rules must be existing language-neutral software-port rules');
 for(let i=0;i<24;i++){
  const row=m.records[i],id='NOM-'+String(i+176).padStart(4,'0'),qid='RIA-'+id.slice(-4);
  if(row.id!==id||ids.has(id)||row.scope!=='cpp_to_rust_port'||a.candidate_evidence[i].normalized_rule_id!==id)
    throw Error('Bad C++ semantic source '+id);
  const raw=fs.readFileSync(path.join(root,'rules',id+'.json'),'utf8'),rule=JSON.parse(raw);
  const queue=read('queues/cpp-remediation/'+qid+'.json',root),
    trace=read('processing/cpp-remediation/PROC-'+qid+'.json',root),
    link=read('ontology/rule-links/cpp-remediation/RLINK-'+id.slice(-4)+'.json',root);
  if(rule.statement!==row.statement||rule.scope.project_types.join()!=='cpp_to_rust_port'||
     rule.governance.review_status!=='approved'||rule.status!=='published'||rule.id!==id||
     !rule.provenance.reference.includes(row.audit_key))throw Error('Incorrect scoped C++ rule '+id);
  if(blob(raw)!==queue.source.git_blob_sha||blob(raw)!==trace.source.git_blob_sha||
     blob(raw)!==link.evidence.source_blob_sha||link.evidence.source_statement!==rule.statement||
     JSON.stringify(link.evidence.normalized_predicate)!==JSON.stringify(rule.norm.predicate))
    throw Error('Stale C++ rule blob '+id);
  if(queue.status!=='processed'||trace.status!=='closed'||trace.queue_id!==qid||
     trace.source.rule_id!==id||link.provenance.queue_id!==qid||link.rule_id!==id||
     link.rule_editorial_status!=='published')throw Error('Missing reviewed C++ rule linkage '+id);
  for(const auth of [queue.authorization,trace.authorization]){
   if(!auth.processing||!auth.publication||auth.selection_confirmation!==false||auth.rule_activation!==false)
    throw Error('Unapproved C++ rule activation or selection '+id);
  }
  const sids=link.situations.map(x=>x.id),iids=link.intents.map(x=>x.id),expected=cross.entries[qid];
  if(!expected||expected.rule_id!==id||
     JSON.stringify(expected.situation_ids)!==JSON.stringify(sids)||
     JSON.stringify(expected.intent_ids)!==JSON.stringify(iids))throw Error('C++ semantic crosswalk missing '+id);
  for(const x of sids)if(!fs.existsSync(path.join(root,'ontology/situations',x+'.json')))throw Error('Missing situation '+x);
  for(const x of iids)if(!fs.existsSync(path.join(root,'ontology/intents',x+'.json')))throw Error('Missing intent '+x);
  ids.add(id);
 }
 const lite=read('profiles/history/2026-10-25-rule-first/PROFILE-0009.json',root),full=read('profiles/history/2026-10-25-rule-first/PROFILE-0010.json',root);
 for(const [p,expected,added] of [[lite,58,m.cpp_lite_selected_new_ids],[full,122,m.cpp_full_selected_new_ids]]){
  if(p.selected_rule_ids.length!==expected||new Set(p.selected_rule_ids).size!==expected||
     p.status!=='draft'||p.review.selection_confirmed||p.review.finalization_confirmed||
     added.some(id=>!ids.has(id)||!p.selected_rule_ids.includes(id)))throw Error('Incorrect C++ draft '+p.id);
 }
 if(m.cpp_lite_selected_new_ids.length!==15||m.cpp_full_selected_new_ids.length!==24)
  throw Error('C++ review selection drift');
 if(shared.size!==8||m.shared_lite_selected_ids.length!==5)throw Error('Incorrect shared-rule reuse');
 if(![...shared].every(id=>full.selected_rule_ids.includes(id)))throw Error('Full missing shared port rules');
 if(!m.shared_lite_selected_ids.every(id=>lite.selected_rule_ids.includes(id)))throw Error('Lite missing shared port rules');
 for(const name of fs.readdirSync(path.join(root,'profiles')).filter(x=>/^PROFILE-\d+\.json$/.test(x)&&!['PROFILE-0009.json','PROFILE-0010.json'].includes(x))){
  if(read('profiles/'+name,root).selected_rule_ids.some(id=>ids.has(id)))
    throw Error('C++ specialized rule applied to another profile '+name);
 }
 return {new_cpp_rules:24,new_situations:10,new_intents:15,full_rules:122,lite_rules:58};
}
if(require.main===module){try{console.log('Verified C++-to-Rust coverage remediation',JSON.stringify(check()))}
catch(e){console.error(e.message);process.exitCode=1}}
module.exports={check};
