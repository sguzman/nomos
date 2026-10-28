'use strict';
// Client-only, non-authoritative review draft serializer. No approval side effects.
(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.NomosReview=api;
})(typeof globalThis!=='undefined'?globalThis:null,()=>{
const check=(yes,message)=>{if(!yes)throw Error(message);};
function candidates(profile,feed){
  check(profile?.kind==='end_consumer_prompt_profile'&&feed?.kind==='end_consumer_review_candidates'&&feed.schema_version===1,'Invalid review data');
  check(feed.profile_id===profile.id&&feed.source_version==='0'&&feed.semantic_version==='1','Review identity mismatch');
  check(Array.isArray(feed.rows)&&feed.rows.length===profile.slots.length,'Missing review candidates');
  const seen=new Set();
  return feed.rows.map((row,i)=>{
    const slot=profile.slots[i];
    check(row.prompt_id===slot.id&&row.key===slot.key&&row.label===slot.label&&row.source_text_sha256===slot.text_sha256,'Review source mismatch');
    check(!seen.has(row.prompt_id),'Duplicate review candidate');seen.add(row.prompt_id);
    check(row.owner_review_status==='pending'&&['yes','no','insufficient_evidence'].includes(row.proposed_verdict),'Unapproved review data expected');
    check(typeof row.meta_intent==='string'&&row.meta_intent.length>0&&Array.isArray(row.gaps),'Invalid review content');
    return row;
  });
}
function draft(feed,rows,choices){
  check(feed?.kind==='end_consumer_review_candidates'&&Array.isArray(rows),'Missing review data');
  const edits=choices||{};
  check(edits&&typeof edits==='object'&&!Array.isArray(edits),'Invalid local feedback');
  for(const id of Object.keys(edits))check(rows.some(r=>r.prompt_id===id),'Unknown prompt slot');
  const decisions=[];
  for(const row of rows){
    const input=Object.prototype.hasOwnProperty.call(edits,row.prompt_id)?edits[row.prompt_id]:{};
    check(input&&typeof input==='object'&&!Array.isArray(input),'Invalid slot feedback');
    const meta=input.meta_response??'undecided',verdict=input.assessment_response??'undecided';
    const suggested=input.suggested_meta_intent??'',notes=input.notes??'';
    check(['undecided','agree','request_changes'].includes(meta),'Invalid meta feedback');
    check(['undecided','agree','disagree'].includes(verdict),'Invalid assessment feedback');
    check(typeof suggested==='string'&&suggested.length<=3000&&typeof notes==='string'&&notes.length<=5000,'Invalid note length');
    if(meta==='undecided'&&verdict==='undecided'&&(!suggested.trim()||suggested.trim()===row.meta_intent)&&!notes.trim())continue;
    decisions.push({prompt_id:row.prompt_id,key:row.key,source_text_sha256:row.source_text_sha256,
      proposed_meta_intent:row.meta_intent,proposed_verdict:row.proposed_verdict,
      meta_response:meta,assessment_response:verdict,
      suggested_meta_intent:suggested.trim()&&suggested.trim()!==row.meta_intent?suggested.trim():null,
      notes:notes.trim()||null});
  }
  return {schema_version:1,kind:'end_consumer_owner_review_draft',profile_id:feed.profile_id,
    source_version:'0',semantic_version:'1',status:'local_unsubmitted',
    owner_authenticated:false,approval_granted:false,prompt_publication_authorized:false,
    decisions};
}
return {candidates,draft,serialize:(feed,rows,choices)=>JSON.stringify(draft(feed,rows,choices),null,2)+'\n'};
});
