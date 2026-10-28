'use strict';
// Browser and Node: inert prompt-version validation and Trievium serialization.
// Publication is data, not execution, activation, or approval.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.NomosEndConsumer=api;
})(typeof globalThis!=='undefined'?globalThis:null,()=>{
  function check(ok,message){if(!ok)throw new Error(message);}
  function makeCatalog(profile,source,manifest){
    check(profile&&profile.kind==='end_consumer_prompt_profile','Invalid consumer profile');
    check(source&&source.version===1&&Array.isArray(source.entries),'Invalid Trievium source');
    check(Array.isArray(profile.slots)&&profile.slots.length===source.entries.length,'Profile/source length mismatch');
    check(manifest&&manifest.schema_version===1&&manifest.profile_id===profile.id&&manifest.source_version==='0','Version manifest does not match original profile');
    check(Array.isArray(manifest.published_versions),'Missing explicit published version list');
    const seenKeys=new Set(),byId=new Map(),all=[];
    for(let i=0;i<profile.slots.length;i++){
      const slot=profile.slots[i],entry=source.entries[i];
      check(slot.ordinal===i&&slot.key===entry.key&&slot.label===entry.label,'Original key/label/order mismatch');
      check(typeof entry.text==='string'&&typeof slot.id==='string'&&typeof slot.text_sha256==='string','Invalid original prompt');
      check(!seenKeys.has(slot.key)&&!byId.has(slot.id),'Duplicate original slot');
      seenKeys.add(slot.key);
      const record={id:slot.id,key:slot.key,label:slot.label,defaultVersion:'0',versions:[{version:'0',label:'V0 · original',text:entry.text,sha256:slot.text_sha256,origin:'original'}]};
      all.push(record);byId.set(slot.id,record);
    }
    for(const pub of manifest.published_versions){
      check(pub&&pub.owner_approved===true&&typeof pub.approval_reference==='string'&&pub.approval_reference.trim().length>0,
        'A candidate cannot be published without an explicit owner approval reference');
      check(pub.publication_state==='approved_public_prompt_version','Unapproved publication state');
      check(typeof pub.version==='string'&&/^[1-9][0-9]*$/.test(pub.version),'Invalid successor version');
      check(typeof pub.text==='string'&&pub.text.length>0,'Missing published prompt text');
      check(typeof pub.sha256==='string'&&/^[a-f0-9]{64}$/.test(pub.sha256),'Published text has no SHA256');
      const slot=byId.get(pub.prompt_id);
      check(slot&&slot.key===pub.key&&slot.label===pub.label,'Published version changed stable identity');
      check(!slot.versions.some(v=>v.version===pub.version),'Duplicate version per slot');
      slot.versions.push({version:pub.version,label:'V'+pub.version+' · approved',text:pub.text,sha256:pub.sha256,origin:'owner_approved',approvalReference:pub.approval_reference});
    }
    for(const slot of all)slot.versions.sort((a,b)=>Number(a.version)-Number(b.version));
    return all;
  }
  function makeTrievium(catalog,selections){
    check(Array.isArray(catalog)&&catalog.length>0,'No prompt catalog to export');
    const entries=catalog.map(slot=>{
      const version=(selections&&selections[slot.id])||slot.defaultVersion;
      const selected=slot.versions.find(v=>v.version===version);
      check(Boolean(selected),'Version unavailable or not published: '+slot.id+' / '+version);
      return {label:slot.label,text:selected.text,key:slot.key};
    });
    check(new Set(entries.map(e=>e.key)).size===entries.length,'Duplicate export key');
    return {version:1,entries};
  }
  function serializeTrievium(catalog,selections){
    return JSON.stringify(makeTrievium(catalog,selections),null,2)+'\n';
  }
  return {makeCatalog,makeTrievium,serializeTrievium};
});
