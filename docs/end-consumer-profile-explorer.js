'use strict';
// Profile explorer: read-only. The user requests all revisions in their ChatGPT conversation.
(async()=>{
  const host=document.querySelector('#profile-browser');
  if(!host)return;
  const nav=host.querySelector('#profile-prompt-nav');
  const reader=host.querySelector('#profile-reader');
  const status=host.querySelector('#profile-browser-status');
  const preview=globalThis.NomosPromptPreview;
  if(!preview)throw Error('Markdown preview support unavailable');
  const urls=[
    './data/project-stewardship-v0-profile.json',
    './exports/project-stewardship-v0.json',
    './data/project-stewardship-v1-analysis.json',
    './catalog.json',
    './data/project-stewardship-meta-intent-approval.json',
    './data/project-stewardship-published-versions.json'
  ];
  const replies=await Promise.all(urls.map(path=>fetch(path)));
  if(replies.some(r=>!r.ok))throw Error('Public profile or Nomos catalog unavailable');
  const [profile,source,analysis,catalog,approved,manifest]=await Promise.all(replies.map(r=>r.json()));
  if(approved?.status!=='approved_meta_intents_only'||approved.profile_id!==profile.id||approved.entries?.length!==10)throw Error('Meta-intent approval record invalid');
  for(let i=0;i<10;i++){
    const row=approved.entries[i],ref=analysis.prompts[i];
    if(row.owner_approved!==true||row.prompt_id!==ref.prompt_id||row.key!==ref.source.key||
      row.statement!==ref.meta_intent.statement||row.source_text_sha256!==ref.source.text_sha256)
      throw Error('Meta-intent approval mismatch: '+ref.source.key);
  }
  const api=globalThis.NomosProfileExplorer;
  if(!api)throw Error('Explorer model missing');
  const prompts=api.build(profile,source,analysis,catalog);
  const versionApi=globalThis.NomosEndConsumer;
  if(!versionApi)throw Error('Published version model unavailable');
  const versionCatalog=versionApi.makeCatalog(profile,source,manifest);
  const publishedById=new Map(versionCatalog.map(slot=>[slot.id,slot]));
  if(!globalThis.crypto?.subtle)throw Error('SHA-256 integrity check unavailable');
  for(const p of prompts){
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(p.text));
    const hex=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
    if(hex!==p.source_sha256)throw Error('Original text integrity mismatch: '+p.key);
  }
  for(const slot of versionCatalog){
    const selected=slot.versions.find(v=>v.version===slot.defaultVersion);
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(selected.text));
    const hex=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
    if(hex!==selected.sha256)throw Error('Selected prompt checksum mismatch: '+slot.key);
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
    const published=publishedById.get(p.id);
    const selected=published.versions.find(x=>x.version===published.defaultVersion);
    const heading=elt('div','profile-reader-heading');
    const title=elt('h2','',p.label);
    const eyebrow=elt('span','profile-eyebrow','PROMPT '+p.key+' · SELECTED V'+selected.version+' · META-INTENT APPROVED / LINKS PROPOSED');
    const meta=elt('p','profile-muted',
      p.atomics.length+' atomic objectives · '+p.situations.length+' situations · '+
      p.rules.length+' rule candidates · '+p.conditions.length+' execution conditions');
    heading.append(eyebrow,title,meta);reader.append(heading);
    const contents=elt('nav','profile-contents');
    contents.setAttribute('aria-label','Selected prompt sections');
    for(const [id,label] of [
      ...(selected.version==='0'?[]:[['profile-selected','Approved V1']]),
      ['profile-original','Original V0'],['profile-meta','Meta-intent'],
      ['profile-intents','Intents'],['profile-situations','Situations'],
      ['profile-rules','Rules'],['profile-conditions','Conditions'],
      ['profile-gaps','Gaps']]){
      const a=elt('a','',label);a.href='#'+id;contents.append(a);
    }
    reader.append(contents);
    if(selected.version!=='0'){
      const current=section('Current approved prompt · V'+selected.version,'profile-selected');
      const selectedView=elt('div','profile-prompt-view');
      current.append(preview.mount(selectedView,selected.text));
      current.append(elt('p','profile-muted','Owner-selected prompt wording. Original V0 is retained below for comparison.'));
    }
    const original=section('Original prompt · V0','profile-original');
    const originalView=elt('div','profile-prompt-view');
    original.append(preview.mount(originalView,p.text));
    const metaBlock=section('Owner-approved meta-intent · V1','profile-meta');
    metaBlock.append(elt('p','profile-intent-headline',p.meta_intent));
    metaBlock.append(elt('p','profile-muted','Owner-approved goal. Linked concepts, their applicability and text-level assessments remain proposals; not part of original V0.'));
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
    gaps.append(elt('p','profile-muted','Owner-selected wording is published. Linked concept coverage and earlier text assessments remain explanatory; no independent agent-behavior reliability has been measured. Submit any future revisions in the ChatGPT conversation.'));
    for(const btn of nav.querySelectorAll('button')){
      const active=btn.dataset.promptKey===p.key;
      btn.setAttribute('aria-current',active?'true':'false');
    }
    status.textContent='Viewing '+p.label+'; goal approved, linked mappings proposed and read-only.';
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
