'use strict';
// Profile explorer: read-only. The user requests all revisions in their ChatGPT conversation.
(async()=>{
  const host=document.querySelector('#profile-browser');
  if(!host)return;
  const nav=host.querySelector('#profile-prompt-nav');
  const reader=host.querySelector('#profile-reader');
  const status=host.querySelector('#profile-browser-status');
  const urls=[
    './data/project-stewardship-v0-profile.json',
    './exports/project-stewardship-v0.json',
    './data/project-stewardship-v1-analysis.json',
    './catalog.json'
  ];
  const replies=await Promise.all(urls.map(path=>fetch(path)));
  if(replies.some(r=>!r.ok))throw Error('Public profile or Nomos catalog unavailable');
  const [profile,source,analysis,catalog]=await Promise.all(replies.map(r=>r.json()));
  const api=globalThis.NomosProfileExplorer;
  if(!api)throw Error('Explorer model missing');
  const prompts=api.build(profile,source,analysis,catalog);
  if(!globalThis.crypto?.subtle)throw Error('SHA-256 integrity check unavailable');
  for(const p of prompts){
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(p.text));
    const hex=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
    if(hex!==p.source_sha256)throw Error('Original text integrity mismatch: '+p.key);
  }
  const elt=(name,cls,value)=>{
    const node=document.createElement(name);
    if(cls)node.className=cls;
    if(value!==undefined)node.textContent=value;
    return node;
  };
  function external(parent,kind,id){
    const dirs={rule:'rules',intent:'ontology/intents',situation:'ontology/situations',
      condition:'ontology/conditions'};
    const a=elt('a','profile-source-link','Source JSON');
    a.href='https://github.com/sguzman/nomos/blob/main/'+dirs[kind]+'/'+encodeURIComponent(id)+'.json';
    a.target='_blank';a.rel='noopener noreferrer';parent.append(a);
  }
  function section(title,id,count){
    const box=elt('section','profile-section');
    box.id=id;
    const h=elt('h3','profile-section-title',title);
    if(count!==undefined)h.append(elt('span','profile-count',String(count)));
    box.append(h);reader.append(box);return box;
  }
  function plainField(parent,label,text){
    if(text===undefined||text===null||text==='')return;
    const div=elt('div','profile-field');
    div.append(elt('strong','',label),elt('p','',Array.isArray(text)?text.join(' · '):String(text)));
    parent.append(div);
  }
  function detailsField(parent,label,value){
    if(!value||Array.isArray(value)&&value.length===0)return;
    plainField(parent,label,value);
  }
  function contextCard(kind,r){
    const card=elt('article','profile-concept');
    const header=elt('div','profile-concept-heading');
    const title=r.title||r.code||r.id;
    header.append(elt('span','profile-code',r.id),elt('strong','',title));
    card.append(header);
    const statement=r.statement||r.definition||r.summary||'';
    if(statement)card.append(elt('p','profile-concept-description',statement));
    const more=elt('details','profile-concept-more');
    more.append(elt('summary','','More context and provenance'));
    if(kind==='rule'){
      detailsField(more,'Summary',r.summary!==r.statement?r.summary:null);
      detailsField(more,'Norm',r.norm?.kind);
      detailsField(more,'Conditions',r.norm?.conditions);
      detailsField(more,'Exceptions',r.norm?.exceptions);
      detailsField(more,'Scope preconditions',r.scope?.preconditions);
      detailsField(more,'Scope exclusions',r.scope?.exclusions);
      detailsField(more,'Domains',r.categories?.domains);
      detailsField(more,'Rationale',r.rationale);
    }else{
      detailsField(more,'Classification',r.classification||r.semantic_role);
      detailsField(more,'Related prompts',r.related_prompt_families);
      detailsField(more,'Component situations',r.component_situation_ids);
    }
    external(more,kind,r.id);card.append(more);
    return card;
  }
  function show(p){
    reader.replaceChildren();
    const heading=elt('div','profile-reader-heading');
    const title=elt('h2','',p.label);
    const eyebrow=elt('span','profile-eyebrow','PROMPT '+p.key+' · ORIGINAL V0 · V1 SEMANTICS PROPOSED');
    const meta=elt('p','profile-muted',
      p.atomics.length+' atomic objectives · '+p.situations.length+' situations · '+
      p.rules.length+' rule candidates · '+p.conditions.length+' execution conditions');
    heading.append(eyebrow,title,meta);reader.append(heading);
    const contents=elt('nav','profile-contents');
    contents.setAttribute('aria-label','Selected prompt sections');
    for(const [id,label] of [
      ['profile-original','Prompt text'],['profile-meta','Meta-intent'],
      ['profile-intents','Intents'],['profile-situations','Situations'],
      ['profile-rules','Rules'],['profile-conditions','Conditions'],
      ['profile-gaps','Gaps']]){
      const a=elt('a','',label);a.href='#'+id;contents.append(a);
    }
    reader.append(contents);
    const original=section('Original prompt · V0','profile-original');
    const pre=elt('pre','profile-original-text',p.text);original.append(pre);
    const metaBlock=section('Proposed meta-intent · V1','profile-meta');
    metaBlock.append(elt('p','profile-intent-headline',p.meta_intent));
    metaBlock.append(elt('p','profile-muted','Draft interpretation, not owner-confirmed or part of the original prompt.'));
    plainField(metaBlock,'Invocation',p.trigger);
    plainField(metaBlock,'Authorization boundary',p.authorization);
    const atomic=section('Atomic objectives and linked intents','profile-intents',p.atomics.length);
    for(const a of p.atomics){
      const card=elt('article','profile-atomic');
      card.append(elt('span','profile-code',a.local_id),elt('h4','',a.statement));
      const sub=elt('p','profile-muted','Proposed objective · existing published intent concepts:');
      card.append(sub);
      for(const intent of a.linked_intents)card.append(contextCard('intent',intent));
      atomic.append(card);
    }
    for(const [title,id,kind,data] of [
      ['Situations','profile-situations','situation',p.situations],
      ['Applicable rule candidates','profile-rules','rule',p.rules],
      ['Execution conditions','profile-conditions','condition',p.conditions]]){
      const root=section(title,id,data.length);
      root.append(elt('p','profile-muted',
        'Linked published '+(kind==='rule'?'rules':'concepts')+' are references for analysis, not automatically activated.'));
      const group=elt('div','profile-concepts');
      for(const item of data)group.append(contextCard(kind,item));
      root.append(group);
    }
    const gaps=section('Open questions and coverage gaps','profile-gaps',p.gaps.length);
    if(!p.gaps.length)gaps.append(elt('p','profile-muted','No gaps recorded in the current provisional analysis.'));
    for(const g of p.gaps){
      const card=elt('article','profile-gap');
      card.append(elt('span','profile-code',g.kind));
      plainField(card,'Finding',g.finding);
      plainField(card,'Proposed response',g.proposal);
      gaps.append(card);
    }
    gaps.append(elt('p','profile-muted','Formal satisfaction evaluation: not started. All revision requests go through the ChatGPT conversation.'));
    for(const btn of nav.querySelectorAll('button')){
      const active=btn.dataset.promptKey===p.key;
      btn.setAttribute('aria-current',active?'true':'false');
    }
    status.textContent='Viewing '+p.label+'; all mappings proposed and read-only.';
  }
  for(const p of prompts){
    const btn=elt('button','profile-prompt-choice');
    btn.type='button';btn.dataset.promptKey=p.key;
    btn.append(elt('kbd','',p.key),elt('span','',p.label.replace(/^\S+\s+/,'')));
    btn.addEventListener('click',()=>{
      show(p);
      history.replaceState(null,'','#prompt='+encodeURIComponent(p.key));
    });
    nav.append(btn);
  }
  const wanted=new URLSearchParams(location.hash.slice(1)).get('prompt');
  show(prompts.find(p=>p.key===wanted)||prompts[0]);
  window.addEventListener('hashchange',()=>{
    const key=new URLSearchParams(location.hash.slice(1)).get('prompt');
    if(key){const p=prompts.find(x=>x.key===key);if(p)show(p);}
  });
})().catch(error=>{
  const host=document.querySelector('#profile-browser');
  host?.querySelector('#profile-browser-status')?.replaceChildren(
    document.createTextNode('Profile browser unavailable: '+error.message+
      '. Source-linked semantic reviews remain available below.')
  );
});
