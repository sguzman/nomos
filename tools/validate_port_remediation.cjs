'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=(p,r=root)=>JSON.parse(fs.readFileSync(path.join(r,p),'utf8'));
const blob=raw=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(raw)+'\0'+raw).digest('hex');
function check(r=root){
 const get=p=>read(p,r),manifest=get('audits/strict-port-remediation-manifest-2026-10-25.json');
 const audit=get('audits/strict-port-coverage-2026-10-25.json'),rows=manifest.records;
 const keys=new Set(audit.atomicity_review.entries.filter(x=>x.disposition!=='reuse_existing').map(x=>x.id));
 if(rows.length!==38||new Set(rows.map(x=>x.id)).size!==38)throw Error('Expected 38 unique reviewed rule atoms');
 const seen=new Set(),cross=get('ontology/rule-analysis/port-remediation-crosswalk.json');
 if(Object.keys(cross.entries).length!==38||cross.status!=='reviewed')throw Error('Incomplete new crosswalk');
 for(let i=0;i<38;i++){
  const row=rows[i],id='NOM-'+String(i+138).padStart(4,'0'),qid='RIA-'+id.slice(-4);
  if(row.id!==id||!keys.has(row.key))throw Error('Invalid source audit mapping '+id);
  const raw=fs.readFileSync(path.join(r,'rules',id+'.json'),'utf8'),rule=JSON.parse(raw);
  const link=get('ontology/rule-links/port-remediation/RLINK-'+id.slice(-4)+'.json');
  const queue=get('queues/port-remediation/'+qid+'.json'),trace=get('processing/port-remediation/PROC-'+qid+'.json');
  if(rule.id!==id||rule.status!=='published'||rule.statement!==row.statement||
     rule.scope.project_types.join()!==row.scope||!rule.provenance.reference.includes(row.key))
    throw Error('Incorrect normalized rule '+id);
  if(blob(raw)!==queue.source.git_blob_sha||blob(raw)!==trace.source.git_blob_sha||
     blob(raw)!==link.evidence.source_blob_sha||
     link.evidence.source_statement!==rule.statement||
     JSON.stringify(link.evidence.normalized_predicate)!==JSON.stringify(rule.norm.predicate))
    throw Error('Rule source evidence mismatch '+id);
  if(queue.source.rule_id!==id||trace.queue_id!==qid||link.provenance.queue_id!==qid||
     queue.status!=='processed'||trace.status!=='closed')throw Error('Processing lineage missing '+id);
  for(const auth of [queue.authorization,trace.authorization])
   if(!auth.processing||!auth.publication||auth.selection_confirmation!==false||auth.rule_activation!==false)
    throw Error('Consent boundary violated '+id);
  const situ=link.situations.map(x=>x.id),ints=link.intents.map(x=>x.id),v=cross.entries[qid];
  if(!v||v.rule_id!==id||JSON.stringify(v.situation_ids)!==JSON.stringify(situ)||
     JSON.stringify(v.intent_ids)!==JSON.stringify(ints)||!situ.length||!ints.length)
    throw Error('Missing concept links '+id);
  for(const x of situ)if(!fs.existsSync(path.join(r,'ontology/situations',x+'.json')))throw Error('Unknown situation '+x);
  for(const x of ints)if(!fs.existsSync(path.join(r,'ontology/intents',x+'.json')))throw Error('Unknown intent '+x);
  seen.add(id);
 }
 const lite=get('profiles/history/2026-10-25-rule-first/PROFILE-0011.json'),full=get('profiles/history/2026-10-25-rule-first/PROFILE-0012.json');
 if(lite.selected_rule_ids.length!==56||full.selected_rule_ids.length!==128)throw Error('Incomplete profile remediation');
 for(const [p,ids] of [[lite,manifest.python_lite_added_rule_ids],[full,manifest.python_full_added_rule_ids]]){
  if(p.status!=='draft'||p.review.selection_confirmed||p.review.finalization_confirmed)
   throw Error('Source profile incorrectly confirmed '+p.id);
  if(new Set(p.selected_rule_ids).size!==p.selected_rule_ids.length||
     ids.some(id=>!seen.has(id)||!p.selected_rule_ids.includes(id)))throw Error('Unrecognized membership '+p.id);
 }
 if(manifest.python_lite_added_rule_ids.length!==17||manifest.python_full_added_rule_ids.length!==38)throw Error('Manifest drift');
 for(const name of fs.readdirSync(path.join(r,'profiles')).filter(x=>/^PROFILE-\d+\.json$/.test(x)&&!['PROFILE-0011.json','PROFILE-0012.json'].includes(x))){
  const selected=get('profiles/'+name).selected_rule_ids;
  const shared=new Set(manifest.records.filter(x=>x.scope==='software_port').map(x=>x.id));
  const permitted=['PROFILE-0001.json','PROFILE-0002.json','PROFILE-0009.json','PROFILE-0010.json'].includes(name);
  if(selected.some(id=>seen.has(id)&&(!permitted||!shared.has(id))))
    throw Error('Unapproved source-language rule selection '+name);
 }
 return {new_rules:38,new_situations:12,new_intents:17,python_lite_rules:56,python_full_rules:128};
}
if(require.main===module){try{console.log('Validated port remediation',JSON.stringify(check()));}catch(e){console.error(e.message);process.exitCode=1}}
module.exports={check};
