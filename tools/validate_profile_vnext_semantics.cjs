'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),get=(p,r=ROOT)=>JSON.parse(fs.readFileSync(path.join(r,p),'utf8'));
const sha=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0'+s).digest('hex');
const sources=['ontology/rule-analysis/crosswalk.json','ontology/rule-analysis/port-remediation-crosswalk.json',
 'ontology/rule-analysis/cpp-remediation-crosswalk.json','ontology/rule-analysis/c-remediation-crosswalk.json',
 'ontology/rule-analysis/new-rust-remediation-crosswalk.json','ontology/rule-analysis/remaining-profile-remediation-crosswalk.json'];
const seq=(kind,n)=>Array.from({length:n},(_,i)=>kind+'-'+String(i+1).padStart(4,'0'));
function check(root=ROOT){
 const a=get('audits/profile-vnext-semantic-inventory-2026-10-25.json',root);
 const links=new Map();
 for(const file of sources)for(const entry of Object.values(get(file,root).entries)){
  if(links.has(entry.rule_id))throw Error('Duplicate source '+entry.rule_id);
  links.set(entry.rule_id,entry);
 }
 if(links.size!==243||a.profiles.length!==12)throw Error('Catalog or profile coverage not complete');
 const inverse={},matrix={};
 for(const [kind,all] of Object.entries({situations:seq('SITU',97),intents:seq('INTENT',139)})){
  inverse[kind]=new Map(all.map(x=>[x,[]]));
  for(const link of links.values())for(const cid of link[kind]){
   if(!inverse[kind].has(cid))throw Error('Invalid catalog concept '+cid);
   inverse[kind].get(cid).push(link.rule_id);
  }
 }
 const missing={situations:[...inverse.situations].filter(([id,r])=>!r.length).map(([id])=>id),
  intents:[...inverse.intents].filter(([id,r])=>!r.length).map(([id])=>id)};
 if(JSON.stringify(missing.situations)!==JSON.stringify(a.unlinked_contextual_situations)||
    JSON.stringify(missing.intents)!==JSON.stringify(a.unlinked_contextual_intents)||
    inverse.situations.size!==97||inverse.intents.size!==139)throw Error('Full ontology inventory drift');
 const summaries=[];
 for(const aEntry of a.profiles){
  const id=aEntry.id,p=get('profiles/'+id+'.json',root),
    archiveRaw=fs.readFileSync(path.join(root,aEntry.archived),'utf8'),old=JSON.parse(archiveRaw),
    selected=new Set(p.selected_rule_ids),prior=new Set(old.selected_rule_ids),
    expected=[...new Set([...old.selected_rule_ids,...aEntry.added_existing_rules])].sort();
  if(sha(archiveRaw)!==aEntry.source_blob_sha||old.version!==aEntry.prior_version||
    old.selected_rule_ids.length!==aEntry.old_rules||
    p.version!==aEntry.new_version||p.selected_rule_ids.length!==aEntry.new_rules||
    JSON.stringify(p.selected_rule_ids)!==JSON.stringify(expected)||p.status!=='draft'||
    p.review.selection_confirmed||p.review.finalization_confirmed||
    p.selected_rule_ids.some(r=>!links.has(r))||
    [...prior].some(r=>!selected.has(r)))throw Error('Unreviewed revision or mutated baseline '+id);
  matrix[id]={};const metric={id,previous_rules:prior.size,rules:selected.size};
  for(const kind of ['situations','intents']){
   const all=seq(kind==='situations'?'SITU':'INTENT',kind==='situations'?97:139),
    companion=get('profiles/companions/'+kind+'/'+(kind==='situations'?'SITUATION':'INTENT')+'-'+id+'.json',root),
    map=new Map(companion.members.map(x=>[x.id,x])),
    selectedConcepts=new Set();
   for(const rid of selected)for(const cid of links.get(rid)[kind])selectedConcepts.add(cid);
   if(companion.source_rule_ids.join()!==p.selected_rule_ids.join()||
      companion.source_profile.source_git_blob_sha!==sha(fs.readFileSync(path.join(root,'profiles',id+'.json'),'utf8'))||
      companion.source_profile.version!==p.version||
      companion.source_profile.selection_confirmed!==false||
      companion.members.length!==selectedConcepts.size||
      selectedConcepts.size!==aEntry['new_derived_'+kind])throw Error('Source companion drift '+id+' '+kind);
   matrix[id][kind]=all.map(cid=>{
    const candidates=inverse[kind].get(cid), selectedSources=candidates.filter(r=>selected.has(r));
    const disposition=selectedSources.length?'selected_rule_linked':candidates.length?'available_but_not_selected':'unlinked_workflow_context';
    if(Boolean(map.has(cid))!==Boolean(selectedSources.length))throw Error('Incorrect reverse link '+id+' '+cid);
    if(selectedSources.length&&
       JSON.stringify(map.get(cid).via_rules.map(x=>x.id))!==JSON.stringify(selectedSources.sort()))
      throw Error('Companion contributing-rule drift '+id+' '+cid);
    return {id:cid,disposition,selected_rule_ids:selectedSources};
   });
   metric[kind]=selectedConcepts.size;
   metric[kind+'_available_not_selected']=matrix[id][kind].filter(x=>x.disposition==='available_but_not_selected').length;
   metric[kind+'_context_only']=matrix[id][kind].filter(x=>x.disposition==='unlinked_workflow_context').length;
  }
  summaries.push(metric);
 }
 if(summaries.length!==12||new Set(summaries.map(x=>x.id)).size!==12)throw Error('Missing reviewed profile version');
 return {catalog:{rules:links.size,situations:97,intents:139},summaries,matrix};
}
if(require.main===module)try{
 const x=check();console.log(JSON.stringify(process.argv.includes('--matrix')?x:{catalog:x.catalog,summaries:x.summaries}));
}catch(e){console.error(e.message);process.exitCode=1}
module.exports={check};
