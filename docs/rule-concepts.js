'use strict';
/** Read-only rule semantics browser. No rule selection or agent actions. */
const NomosRuleConcepts=(()=>{
  const label=value=>String(value||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
  function indexes(catalog){
    return {situations:new Map((catalog.situations||[]).map(x=>[x.id,x])),
            intents:new Map((catalog.intents||[]).map(x=>[x.id,x]))};
  }
  function linkedRules(catalog){
    const byId=new Map((catalog.rule_situation_intent_links||[]).map(x=>[x.rule_id,x]));
    return (catalog.rules||[]).filter(r=>r.registry==='catalog').map(rule=>{
      const analysis=rule.situational_analysis;
      const source=byId.get(rule.id);
      if(!analysis||!source)throw Error('Missing reviewed rule relationship for '+rule.id);
      if(analysis.situation_ids.join('|')!==source.situations.map(x=>x.id).join('|') ||
         analysis.intent_ids.join('|')!==source.intents.map(x=>x.id).join('|'))
        throw Error('Inconsistent rule relationship for '+rule.id);
      return {rule,analysis,source};
    });
  }
  function search(list,{text='',situation='',intent='',status=''}={},lookup){
    const query=text.trim().toLowerCase();
    return list.filter(item=>{
      const rule=item.rule,a=item.analysis;
      if(status&&rule.status!==status)return false;
      if(situation&&!a.situation_ids.includes(situation))return false;
      if(intent&&!a.intent_ids.includes(intent))return false;
      const concepts=lookup?[
        ...a.situation_ids.map(id=>lookup.situations.get(id)),
        ...a.intent_ids.map(id=>lookup.intents.get(id))
      ].filter(Boolean):[];
      const terms=[rule.id,rule.title,rule.statement,...rule.categories.topics,
                   ...concepts.flatMap(c=>[c.id,c.code,c.definition,c.semantic_role||'',c.atomicity||''])];
      return terms.join(' ').toLowerCase().includes(query);
    });
  }
  const node=(tag,className='',value)=>{
    const x=document.createElement(tag);if(className)x.className=className;
    if(value!==undefined)x.textContent=String(value);return x;
  };
  function card(item,lookup){
    const {rule,analysis,source}=item,entry=node('article','study-rule');
    entry.append(node('span','id',rule.id+' · '+rule.status),node('h3','',rule.title),
                 node('p','',rule.summary||rule.statement));
    const labels=node('div','study-labels');
    for(const [name,ids,byId] of [['Situations',analysis.situation_ids,lookup.situations],
                                ['Intentions',analysis.intent_ids,lookup.intents]]){
      const section=node('section'),heading=node('h4','',name),list=node('ul');
      for(const id of ids){
        const concept=byId.get(id),li=node('li','',concept?label(concept.code):id);
        const relation=(name==='Situations'?source.situations:source.intents).find(x=>x.id===id);
        const meta=name==='Situations'
          ? (relation?.basis==='context_inferred_from_scope_and_predicate'
              ? 'Inferred context' : 'Source context + interpretation')
          : (label(concept?.semantic_role||'unclassified')+' · '+
             (concept?.atomicity==='single_intent_candidate'?'Atomic candidate':'Composite / compound'));
        li.append(node('small','study-concept-meta',meta));
        li.title=id+(concept?': '+concept.definition:'')+'; '+meta;
        list.append(li);
      }
      section.append(heading,list);labels.append(section);
    }
    entry.append(labels);
    const details=node('details');
    details.append(node('summary','','Original rule and source evidence'));
    details.append(node('p','',rule.statement));
    if(source.evidence.source_conditions.length)
      details.append(node('p','', 'Source conditions: '+source.evidence.source_conditions.join('; ')));
    if((source.evidence.source_exceptions||[]).length)
      details.append(node('p','', 'Source exceptions: '+(source.evidence.source_exceptions||[]).join('; ')));
    const note=node('p','', 'These associations are descriptive, not a modification of this rule.');
    details.append(note);
    const link=node('a','','View canonical rule JSON');
    link.href='https://github.com/sguzman/nomos/blob/main/rules/'+rule.id+'.json';
    link.rel='noopener noreferrer';
    details.append(link);
    const evidenceLink=node('a','','View reviewed relationship evidence JSON');
    evidenceLink.href='https://github.com/sguzman/nomos/blob/main/ontology/rule-links/'+(source.provenance?.extension==='port_remediation'?'port-remediation/':source.provenance?.extension==='cpp_remediation'?'cpp-remediation/':'')+source.id+'.json';
    evidenceLink.rel='noopener noreferrer';
    details.append(evidenceLink);
    entry.append(details);return entry;
  }
  function fillSelect(select,concepts){
    for(const c of concepts){
      const opt=node('option','',label(c.code)+' · '+c.id);opt.value=c.id;select.append(opt);
    }
  }
  async function init(){
    const count=document.getElementById('study-count');
    try{
      const url=document.querySelector('meta[name="nomos-catalog"]')?.content||'./catalog.json';
      const response=await fetch(url);
      if(!response.ok)throw Error('HTTP '+response.status);
      const catalog=await response.json();
      const data=linkedRules(catalog),lookup=indexes(catalog);
      if(data.length!==catalog.rules.filter(x=>x.registry==='catalog').length)throw Error('Incomplete analyzed rules');
      const byCode=(a,b)=>a.id.localeCompare(b.id);
      fillSelect(document.getElementById('study-situation'),[...lookup.situations.values()].sort(byCode));
      fillSelect(document.getElementById('study-intent'),[...lookup.intents.values()].sort(byCode));
      if(typeof window!=='undefined'&&window.location?.search){
        const p=new URLSearchParams(window.location.search);
        for(const [key,param] of [['study-situation','situation'],['study-intent','intent']]){
          const value=p.get(param);
          if(value&&((param==='situation'?lookup.situations:lookup.intents).has(value)))
            document.getElementById(key).value=value;
        }
      }
      const render=()=>{
        const filtered=search(data,{text:document.getElementById('study-search').value,
          situation:document.getElementById('study-situation').value,
          intent:document.getElementById('study-intent').value,
          status:document.getElementById('study-status').value},lookup);
        document.getElementById('study-results').replaceChildren(...filtered.map(x=>card(x,lookup)));
        count.textContent=filtered.length+' of '+data.length+' analyzed rules';
        document.getElementById('study-empty').hidden=filtered.length>0;
      };
      for(const key of ['study-search','study-situation','study-intent','study-status']){
        document.getElementById(key).addEventListener(key==='study-search'?'input':'change',render);
      }
      render();
    }catch(error){
      count.textContent='Unavailable';
      const elt=document.getElementById('study-error');elt.hidden=false;elt.textContent='Could not load rule analyses: '+error.message;
    }
  }
  return Object.freeze({indexes,linkedRules,search,label,init});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=NomosRuleConcepts;
if(typeof document!=='undefined')NomosRuleConcepts.init();
