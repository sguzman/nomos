'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0'+s).digest('hex');
function check(){
 const m=read('audits/remaining-profile-remediation-manifest-2026-10-25.json'),a=read('audits/remaining-profile-coverage-2026-10-25.json'),c=read('ontology/rule-analysis/remaining-profile-remediation-crosswalk.json');
 if(m.records.length!==8||a.candidate_records.length!==8||c.status!=='reviewed'||Object.keys(c.entries).length!==8)throw Error('Incomplete eight-rule audit');
 const recent=new Set();
 for(let i=0;i<8;i++){
  const x=m.records[i],id='NOM-'+String(236+i).padStart(4,'0'),qid='RIA-'+id.slice(-4);
  if(x.id!==id||a.candidate_records[i].id!==id||x.scope!==(i<4?'rust_fork_maintenance':'tarium_project'))throw Error('Incorrect normalized atom '+id);
  const raw=fs.readFileSync(path.join(root,'rules',id+'.json'),'utf8'),rule=JSON.parse(raw);
  const q=read('queues/remaining-profile-remediation/'+qid+'.json'),t=read('processing/remaining-profile-remediation/PROC-'+qid+'.json'),l=read('ontology/rule-links/remaining-profile-remediation/RLINK-'+id.slice(-4)+'.json');
  if(rule.id!==id||rule.status!=='published'||rule.statement!==x.statement||rule.scope.project_types.join()!==x.scope||
     !rule.provenance.reference.includes(id)||blob(raw)!==l.evidence.source_blob_sha||
     blob(raw)!==q.source.git_blob_sha||blob(raw)!==t.source.git_blob_sha||
     l.evidence.source_statement!==rule.statement||JSON.stringify(l.evidence.normalized_predicate)!==JSON.stringify(rule.norm.predicate))throw Error('Source blob or scope drift '+id);
  const si=l.situations.map(y=>y.id),ii=l.intents.map(y=>y.id),expected=c.entries[qid];
  if(!expected||expected.rule_id!==id||JSON.stringify(expected.situation_ids)!==JSON.stringify(si)||
     JSON.stringify(expected.intent_ids)!==JSON.stringify(ii)||q.status!=='processed'||t.status!=='closed'||t.queue_id!==qid||
     l.rule_id!==id||l.status!=='published'||l.rule_editorial_status!=='published'||l.provenance.queue_id!==qid)throw Error('Missing source analysis '+id);
  for(const auth of [q.authorization,t.authorization])if(!auth.processing||!auth.publication||
     auth.selection_confirmation!==false||auth.finalization_confirmation!==false||auth.rule_activation!==false||
     auth.tarium_enrollment!==false||auth.upstream_sync!==false)throw Error('Unauthorized operation '+id);
  for(const sid of si)if(!fs.existsSync(path.join(root,'ontology/situations',sid+'.json')))throw Error('Missing situation '+sid);
  for(const iid of ii)if(!fs.existsSync(path.join(root,'ontology/intents',iid+'.json')))throw Error('Missing intent '+iid);
  recent.add(id);
 }
 const n={'PROFILE-0005':36,'PROFILE-0006':76,'PROFILE-0007':43,'PROFILE-0008':102};
 for(const [id,count] of Object.entries(n)){
  const p=read('profiles/history/2026-10-25-rule-first/'+id+'.json'),change=m.changes[id],isTarium=['PROFILE-0005','PROFILE-0006'].includes(id);
  if(!change||change.after!==count||p.selected_rule_ids.length!==count||
     new Set(p.selected_rule_ids).size!==count||p.status!=='draft'||p.review.selection_confirmed||
     p.review.finalization_confirmed||change.added.some(x=>!p.selected_rule_ids.includes(x)))throw Error('Draft selected rule drift '+id);
  if(p.selected_rule_ids.some(x=>recent.has(x)&&((Number(x.slice(4))>=240)!==isTarium)))throw Error('Cross-family rule leakage '+id);
 }
 for(const name of fs.readdirSync(path.join(root,'profiles')).filter(x=>/^PROFILE-\d+\.json$/.test(x)&&!Object.keys(n).some(id=>x===id+'.json')))
  if(read('profiles/'+name).selected_rule_ids.some(id=>recent.has(id)))throw Error('Unrelated profile edited '+name);
 const fullFork=read('profiles/history/2026-10-25-rule-first/PROFILE-0008.json'),fullTarium=read('profiles/history/2026-10-25-rule-first/PROFILE-0006.json');
 if(!m.fork_reuse.every(x=>fullFork.selected_rule_ids.includes(x))||
    !Array.from({length:14},(_,i)=>'NOM-'+String(115+i).padStart(4,'0')).every(x=>fullTarium.selected_rule_ids.includes(x)))
  throw Error('Lost preexisting family obligations');
 return {new_rules:8,new_situations:8,new_intents:8,fork_lite:43,fork_full:102,tarium_lite:36,tarium_full:76};
}
if(require.main===module){try{console.log('Verified remaining profile remediation',JSON.stringify(check()));}catch(e){console.error(e.message);process.exitCode=1}}
module.exports={check};
