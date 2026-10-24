'use strict';
/* Dedicated opt-in browser; never includes prompts in the atomic rule composer. */
const NomosSituational = (() => {
  // The heading is always derived from structured metadata; no custom name or
  // launcher label is allowed to become a canonical prompt attribute.
  function displayLabel(p){
    const humanize=v=>String(v).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
    return humanize(p.situation.code)+' · '+humanize(p.execution.mode);
  }
  function search(records, query='', mode='all', status='all') {
    const term=String(query).toLocaleLowerCase().trim();
    return records.filter(p=>{
      if(mode!=='all'&&p.execution.mode!==mode)return false;
      if(status!=='all'&&p.status!==status)return false;
      const words=[p.id,displayLabel(p),p.summary,p.text,p.situation.code,p.situation.trigger,p.situation.purpose,
        p.intent.operation,p.intent.outcome,p.execution.mode,
        ...p.applicability.appropriate_when,...p.applicability.not_appropriate_when,...p.applicability.preconditions,
        p.execution.objective,...p.failure_modes.guards_against,...p.failure_modes.tradeoffs];
      return words.join(' ').toLocaleLowerCase().includes(term);
    }).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
  }
  function copyAllowed(p){return p.status==='published' && p.governance.review_status==='approved';}
  function createNode(tag,className,text){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=String(text);
    return node;
  }
  function field(dl,label,value) {
    dl.append(createNode('dt','',label),createNode('dd','',Array.isArray(value)?value.join('; ')||'None':value));
  }
  function card(p){
    const entry=createNode('article','situational-entry');
    entry.append(createNode('span','situational-id',p.id),createNode('h3','',displayLabel(p)),createNode('p','',p.summary));
    const tags=createNode('div','situational-tags');
    for(const val of [p.status,p.execution.mode.replaceAll('_',' '),p.situation.code.replaceAll('_',' ')])
      tags.append(createNode('span','situational-tag',val));
    entry.append(tags);
    // Native, keyboard-accessible accordion. All cards share a name so only
    // the item the user chooses is expanded. No metadata opens by default.
    const metadata=createNode('details','situational-metadata');
    metadata.setAttribute('name','situational-prompt-metadata');
    const summary=createNode('summary','','Show details');
    metadata.append(summary);
    metadata.addEventListener('toggle',()=>{
      summary.textContent=metadata.open?'Hide details':'Show details';
    });
    const details=createNode('dl');
    field(details,'Trigger',p.situation.trigger);
    field(details,'Operation',p.intent.operation.replaceAll('_',' '));
    field(details,'Intended result',p.intent.outcome);
    field(details,'Purpose',p.situation.purpose);
    field(details,'Appropriate when',p.applicability.appropriate_when);
    field(details,'Do not use when',p.applicability.not_appropriate_when);
    field(details,'Prerequisites',p.applicability.preconditions);
    field(details,'Desired outcome',p.execution.objective);
    field(details,'Handoff',p.execution.handoff.replaceAll('_',' '));
    field(details,'Evidence reporting',p.execution.progress_evidence?'Required':'Not required');
    field(details,'Guards against',p.failure_modes.guards_against);
    field(details,'Tradeoffs',p.failure_modes.tradeoffs);
    field(details,'Provenance',p.provenance.source_type);
    field(details,'Version / review','v'+p.version+' / '+p.governance.review_status);
    metadata.append(details);
    const more=createNode('details','situational-prompt-text');
    more.append(createNode('summary','','View prompt text'));
    more.append(createNode('pre','situational-body',p.text));
    metadata.append(more);
    const copy=createNode('button','situational-copy',copyAllowed(p)?'Copy prompt':'Not approved for copying');
    copy.type='button';copy.disabled=!copyAllowed(p);
    copy.addEventListener('click',async()=>{
      if(!copyAllowed(p))return;
      try {
        await navigator.clipboard.writeText(p.text);
        document.getElementById('situational-notice').textContent='Copied '+p.id+'.';
      }catch(error){
        document.getElementById('situational-notice').textContent='Copy failed. You can inspect the text above.';
      }
    });
    // Copy is an independent action even when the metadata is collapsed.
    entry.append(copy,metadata);return entry;
  }
  async function init() {
    const list=document.getElementById('situational-list');
    const count=document.getElementById('situational-count');
    try {
      const url=document.querySelector('meta[name="nomos-situational-catalog"]')?.content || './catalog.json';
      const response=await fetch(url);
      if(!response.ok)throw new Error('HTTP '+response.status);
      const catalog=await response.json();
      const records=catalog.situational_prompts;
      if(!Array.isArray(records))throw new Error('No situational registry in this catalog version');
      const render=()=>{
        const found=search(records,document.getElementById('situational-search').value,
          document.getElementById('situational-mode').value,document.getElementById('situational-status').value);
        list.replaceChildren(...found.map(card));
        count.textContent=found.length+' of '+records.length+' situational prompts';
        document.getElementById('situational-empty').hidden=found.length!==0;
      };
      for(const id of ['situational-search','situational-mode','situational-status']){
        document.getElementById(id).addEventListener(id==='situational-search'?'input':'change',render);
      }
      render();
    }catch(error) {
      count.textContent='Unavailable';
      const warning=document.getElementById('situational-error');
      warning.hidden=false;warning.textContent='Could not load the current situational catalog: '+error.message;
    }
  }
  return Object.freeze({search,copyAllowed,displayLabel,init});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=NomosSituational;
if(typeof document!=='undefined')NomosSituational.init();
