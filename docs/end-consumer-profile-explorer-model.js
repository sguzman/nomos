'use strict';
// Read-only view of an existing end-consumer profile; all links are advisory, not active.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.NomosProfileExplorer=api;
})(typeof globalThis!=='undefined'?globalThis:null,()=>{
  function need(ok,message){if(!ok)throw Error(message);}
  function unique(ids,description){
    need(Array.isArray(ids)&&ids.every(x=>typeof x==='string'),'Invalid '+description+' references');
    need(new Set(ids).size===ids.length,'Duplicate '+description+' references');
    return ids;
  }
  function build(profile,source,analysis,catalog){
    need(profile?.kind==='end_consumer_prompt_profile'&&source?.version===1&&
      Array.isArray(source.entries)&&Array.isArray(profile.slots),'Missing V0 profile/source');
    need(analysis?.profile_id===profile.id&&analysis.version==='1'&&
      analysis.status==='proposed_for_owner_review'&&
      Array.isArray(analysis.prompts),'Invalid V1 proposal');
    need(catalog?.schema_version==='3.0'&&Array.isArray(catalog.rules)&&
      Array.isArray(catalog.intents)&&Array.isArray(catalog.situations)&&
      Array.isArray(catalog.execution_conditions),'Invalid Nomos published catalog');
    need(profile.slots.length===10&&source.entries.length===10&&analysis.prompts.length===10,'Expected ten prompts');
    function index(records){
      const map=new Map();
      for(const r of records){need(typeof r.id==='string'&&!map.has(r.id),'Missing or duplicate published ID');map.set(r.id,r);}
      return map;
    }
    const catalogs={
      rule:index(catalog.rules.filter(x=>x.registry==='catalog'&&x.status==='published')),
      intent:index(catalog.intents.filter(x=>x.status==='published')),
      situation:index(catalog.situations.filter(x=>x.status==='published')),
      condition:index(catalog.execution_conditions.filter(x=>x.status==='published'))
    };
    function refs(ids,kind){
      return unique(ids,kind).map(id=>{
        const record=catalogs[kind].get(id);
        need(record,'Unresolved published '+kind+' reference: '+id);
        return record;
      });
    }
    const proposed=index(analysis.prompts);
    const seen=new Set();
    return profile.slots.map((slot,i)=>{
      const entry=source.entries[i],p=proposed.get(slot.id);
      need(slot.ordinal===i&&entry?.key===slot.key&&entry.label===slot.label,'Original identity mismatch');
      need(!seen.has(slot.key)&&typeof entry.text==='string','Invalid original prompt key/text');
      seen.add(slot.key);
      need(p&&p.source.key===entry.key&&p.source.label===entry.label&&
        p.source.text_sha256===slot.text_sha256&&p.source.version==='0',
        'V1 proposal does not match original prompt identity');
      need(p.meta_intent.owner_confirmed===false&&p.meta_intent.review_status==='proposed','Unapproved V1 expected');
      const atomics=p.atomic_intents.map(a=>({
        local_id:a.local_id,statement:a.statement,review_status:a.review_status,
        linked_intents:refs(a.existing_intent_ids,'intent')
      }));
      need(new Set(atomics.map(a=>a.local_id)).size===atomics.length,'Duplicate local atomic objective');
      return {id:slot.id,key:entry.key,label:entry.label,source_sha256:slot.text_sha256,
        text:entry.text,meta_intent:p.meta_intent.statement,atomics,
        situations:refs(p.situation_ids,'situation'),
        rules:refs(p.rule_ids,'rule'),conditions:refs(p.condition_ids,'condition'),
        trigger:p.applicability.trigger,authorization:p.applicability.authorization,
        gaps:p.conflicts_and_gaps,selection:p.selection};
    });
  }
  return {build};
});
