'use strict';
/* Companion metadata is inert; the explorer never composes, exports or applies rules. */
const NomosProfileCompanions=(()=>{
  const TYPES=['situations','intents'];
  const human=s=>String(s||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
  function index(catalog){
    const profiles=new Map((catalog.profiles||[]).map(p=>[p.id,p]));
    const all=catalog.profile_companions||[],companions=new Map();
    if(all.length!==2*profiles.size)throw Error('Incomplete rule-profile companion inventory');
    for(const x of all){
      const p=profiles.get(x.source_profile.id);
      const type=x.kind==='derived_situation_profile'?'situations':x.kind==='derived_intent_profile'?'intents':null;
      if(!p||!type||x.status!=='derived_inert')throw Error('Invalid companion '+x.id);
      if(p.status!==x.source_profile.status||p.version!==x.source_profile.version||
         p.review.selection_confirmed!==x.source_profile.selection_confirmed||
         p.selected_rule_ids.join('|')!==x.source_rule_ids.join('|'))
        throw Error('Stale source profile '+x.source_profile.id);
      const key=p.id+'|'+type;
      if(companions.has(key))throw Error('Duplicate companion '+key);
      companions.set(key,x);
    }
    if(companions.size!==all.length)throw Error('Missing companions');
    return {profiles,companions,
      situations:new Map((catalog.situations||[]).map(c=>[c.id,c])),
      intents:new Map((catalog.intents||[]).map(c=>[c.id,c])),
      rules:new Map((catalog.rules||[]).map(r=>[r.id,r]))};
  }
  function results(data,profileId,type,query=''){
    if(!TYPES.includes(type))throw Error('Unknown companion type');
    const companion=data.companions.get(profileId+'|'+type);
    if(!companion)throw Error('Missing profile companion');
    const lookup=data[type],needle=query.trim().toLowerCase();
    return {companion,members:companion.members.filter(m=>{
      const c=lookup.get(m.id);
      if(!c)throw Error('Dangling companion concept '+m.id);
      return [m.id,c.code,c.definition,c.classification,c.semantic_role,c.atomicity,
        m.atomicity==='single_intent_candidate'?'atomic candidate':'',
        ...m.via_rules.map(r=>r.id)].filter(Boolean).join(' ').toLowerCase().includes(needle);
    })};
  }
  const element=(tag,className='',content)=>{
    const e=document.createElement(tag);if(className)e.className=className;
    if(content!==undefined)e.textContent=String(content);return e;
  };
  function card(item,concept,kind,data){
    const root=element('article','companion-card');
    root.append(element('span','companion-meta',item.id),
      element('h3','',human(concept.code)),
      element('p','',concept.definition));
    const category=kind==='intents'?
      human(item.semantic_role)+' · '+human(item.atomicity):
      human(concept.classification);
    root.append(element('p','companion-meta',category));
    const direct=element('a','concept-link','View formal concept');
    direct.href='./situational-ontology.html?type='+kind+'&q='+encodeURIComponent(item.id);
    root.append(direct);
    const details=element('details'),summary=element('summary','',item.via_rules.length+' contributing rules');
    details.append(summary);
    const list=element('ul');
    for(const r of item.via_rules){
      const li=element('li'),link=element('a','',r.id);
      link.href='https://github.com/sguzman/nomos/blob/main/rules/'+r.id+'.json';
      link.rel='noopener noreferrer';
      const name=data.rules.get(r.id)?.title||r.id;
      li.append(link,element('span','', ' · '+name+' · '+human(r.basis)));
      list.append(li);
    }
    details.append(list);root.append(details);return root;
  }
  async function init(){
    const count=document.getElementById('companion-count');
    try{
      const url=document.querySelector('meta[name="nomos-catalog"]')?.content||'./catalog.json';
      const response=await fetch(url);
      if(!response.ok)throw Error('HTTP '+response.status);
      const data=index(await response.json());
      const profileSelect=document.getElementById('companion-profile');
      for(const p of [...data.profiles.values()].sort((a,b)=>a.id.localeCompare(b.id))){
        const option=element('option','',p.title+' · '+p.id);
        option.value=p.id;profileSelect.append(option);
      }
      if(typeof window!=='undefined'&&window.location?.search){
        const q=new URLSearchParams(window.location.search),p=q.get('profile'),t=q.get('type');
        if(data.profiles.has(p))profileSelect.value=p;
        if(TYPES.includes(t))document.getElementById('companion-type').value=t;
      }
      if(!data.profiles.has(profileSelect.value))profileSelect.value=[...data.profiles.keys()].sort()[0];
      const render=()=>{
        const id=profileSelect.value,type=document.getElementById('companion-type').value;
        const x=results(data,id,type,document.getElementById('companion-search').value);
        const p=data.profiles.get(id);
        document.getElementById('companion-source').textContent=
          p.title+' · '+p.selected_rule_ids.length+' source rules · '+
          (p.review.selection_confirmed?'Reviewed source rule selection':'Provisional source rule selection, not confirmed');
        document.getElementById('companion-results').replaceChildren(...x.members.map(m=>card(m,data[type].get(m.id),type,data)));
        count.textContent=x.members.length+' of '+x.companion.members.length+' '+type+' · '+x.companion.id;
        document.getElementById('companion-empty').hidden=x.members.length>0;
      };
      for(const id of ['companion-profile','companion-type','companion-search']){
        document.getElementById(id).addEventListener(id==='companion-search'?'input':'change',render);
      }
      render();
    }catch(e){
      count.textContent='Unavailable';
      const error=document.getElementById('companion-error');
      error.hidden=false;error.textContent='Could not load companions: '+e.message;
    }
  }
  return Object.freeze({index,results,init});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=NomosProfileCompanions;
if(typeof document!=='undefined')NomosProfileCompanions.init();
