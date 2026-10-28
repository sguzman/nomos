'use strict';
// Local review worksheet: only explicit downloads, never submission or activation.
(async()=>{
 const box=document.querySelector('#owner-review-worksheet');if(!box)return;
 const list=box.querySelector('#owner-review-list'),output=box.querySelector('#owner-review-status');
 const download=box.querySelector('#owner-review-download'),reset=box.querySelector('#owner-review-reset');
 const response=await Promise.all([fetch('./data/project-stewardship-v0-profile.json'),fetch('./data/project-stewardship-review-candidates.json')]);
 if(response.some(r=>!r.ok))throw Error('Review feed unavailable');
 const [profile,feed]=await Promise.all(response.map(r=>r.json()));
 const api=globalThis.NomosReview;if(!api)throw Error('Review model unavailable');
 const rows=api.candidates(profile,feed),state=Object.create(null);
 const status=()=>{const d=api.draft(feed,rows,state);
   output.textContent=d.decisions.length+' of '+rows.length+' local draft responses; none submitted.';
   download.disabled=d.decisions.length===0;};
 for(const row of rows){
   const card=document.createElement('details'),summary=document.createElement('summary');
   summary.textContent=row.label+' · provisional '+row.proposed_verdict.toUpperCase();
   card.append(summary);
   const intent=document.createElement('p');intent.textContent='Proposed meta-intent: '+row.meta_intent;card.append(intent);
   if(row.gaps.length){const gap=document.createElement('p');gap.textContent='Review questions: '+row.gaps.join(' ');card.append(gap);}
   const link=document.createElement('a');link.href='#review-slot-'+row.key;
   link.textContent='Inspect full V1 analysis and evidence';
   link.addEventListener('click',()=>{const d=document.getElementById('review-slot-'+row.key);if(d)d.open=true;});card.append(link);
   function choose(aria,options){
     const select=document.createElement('select');select.setAttribute('aria-label',aria);
     for(const [value,label] of options){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
     return select;
   }
   const meta=choose('Meta-intent feedback '+row.key,[['undecided','No draft decision'],['agree','Draft: agree'],['request_changes','Draft: needs changes']]);
   const assessment=choose('Assessment feedback '+row.key,[['undecided','No draft decision'],['agree','Draft: agree'],['disagree','Draft: disagree']]);
   function multiline(aria,placeholder,max){const a=document.createElement('textarea');a.setAttribute('aria-label',aria);a.placeholder=placeholder;a.rows=2;a.maxLength=max;return a;}
   const alternative=multiline('Suggested meta-intent '+row.key,'Optional meta-intent revision',3000);
   const notes=multiline('Review notes '+row.key,'Optional feedback',5000);
   function labeled(label,control){const wrap=document.createElement('label');const span=document.createElement('span');span.textContent=label;wrap.append(span,control);return wrap;}
   card.append(labeled('Meta-intent: ',meta),labeled('Assessment: ',assessment),
     labeled('Suggested intent: ',alternative),labeled('Notes: ',notes));
   const update=()=>{
     state[row.prompt_id]={meta_response:meta.value,assessment_response:assessment.value,
       suggested_meta_intent:alternative.value,notes:notes.value};status();
   };
   meta.addEventListener('change',update);assessment.addEventListener('change',update);
   alternative.addEventListener('input',update);notes.addEventListener('input',update);
   list.append(card);
 }
 download.addEventListener('click',()=>{
   if(download.disabled)return;
   const bytes=api.serialize(feed,rows,state),blob=new Blob([bytes],{type:'application/json;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='project-stewardship-review-draft.json';document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),3000);
   box.querySelector('#owner-review-message').textContent='Downloaded unsubmitted local draft. Share it explicitly for consideration; no approval was recorded.';
 });
 reset.addEventListener('click',()=>{
   for(const k of Object.keys(state))delete state[k];
   for(const select of list.querySelectorAll('select'))select.value='undecided';
   for(const textarea of list.querySelectorAll('textarea'))textarea.value='';
   box.querySelector('#owner-review-message').textContent='Local draft cleared.';status();
 });
 status();
})().catch(error=>{
 const status=document.querySelector('#owner-review-message');
 if(status){status.setAttribute('role','alert');status.textContent='Local worksheet unavailable: '+error.message;}
});
