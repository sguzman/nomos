'use strict';
/* Read-only explorer. All text enters through textContent, never innerHTML. */
const NomosOntology = (() => {
  const TYPES = [
    ['situations','Situations'],
    ['intents','Intents'],
    ['intent_families','Compositions'],
    ['execution_conditions','Execution conditions'],
    ['evaluation_dimensions','Evaluation dimensions']
  ];
  function label(code){
    return String(code).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
  }
  function flatten(catalog){
    return TYPES.flatMap(([key,type])=>
      (Array.isArray(catalog[key])?catalog[key]:[]).map(item=>({...item,object_type:key,object_label:type})));
  }
  function search(items,query='',type='all'){
    const needle=String(query).trim().toLowerCase();
    return items.filter(item=>{
      if(type!=='all' && item.object_type!==type)return false;
      const haystack=[item.id,item.code,item.definition,item.description,item.object_label,
        item.semantic_role,item.atomicity,item.canonical_prompt_id,
        ...(item.situation_ids||[]),...(item.intent_ids||[])].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }
  function node(tag,className='',value){
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(value!==undefined)el.textContent=String(value);
    return el;
  }
  function field(dl,name,value){
    dl.append(node('dt','',name),node('dd','',Array.isArray(value)?value.join(', '):value));
  }
  function card(item){
    const entry=node('article','ontology-item');
    entry.append(node('span','ontology-id',item.id+' · '+item.object_label),
                 node('h3','',label(item.code||item.semantic_role||item.id)),
                 node('p','',item.definition||item.description||''));
    if(item.kind==='situation'||item.kind==='intent'){
      const rel=node('a','','See related rules');
      rel.href='./rule-concepts.html?'+(item.kind==='situation'?'situation':'intent')+'='+item.id;
      entry.append(rel);
    }
    if(item.kind==='intent_family'){
      const link=node('a','','View all 3 prompt versions');
      link.href='./situational-prompts.html#prompt-'+item.canonical_prompt_id;
      entry.append(link);
    }
    const detail=node('details');
    detail.append(node('summary','','Inspect relationships'));
    const dl=node('dl');
    if(item.classification)field(dl,'Classification',item.classification);
    if(item.atomicity)field(dl,'Atomicity',item.atomicity);
    if(item.semantic_role)field(dl,'Intent role',item.semantic_role);
    if(item.component_situation_ids?.length)field(dl,'Components',item.component_situation_ids);
    if(item.related_prompt_families?.length)field(dl,'Prompt families',item.related_prompt_families);
    if(item.canonical_prompt_id)field(dl,'Prompt family',item.canonical_prompt_id);
    if(item.situation_ids?.length)field(dl,'Situations',item.situation_ids);
    if(item.condition_ids?.length)field(dl,'Conditions',item.condition_ids);
    if(item.intent_ids?.length)field(dl,'Intents',item.intent_ids);
    if(item.versions?.length)field(dl,'Generations',item.versions.map(v=>'v'+v));
    if(item.default_version)field(dl,'Default','v'+item.default_version);
    if(item.interpretation_note)field(dl,'Interpretation',item.interpretation_note);
    if(dl.children.length)detail.append(dl);
    entry.append(detail);
    return entry;
  }
  async function init(){
    const count=document.getElementById('ontology-count');
    const list=document.getElementById('ontology-results');
    try{
      const url=document.querySelector('meta[name="nomos-situational-catalog"]')?.content||'./catalog.json';
      const response=await fetch(url);
      if(!response.ok)throw Error('HTTP '+response.status);
      const catalog=await response.json();
      const data=flatten(catalog);
      if(data.length!==142)throw Error('Expected 142 formal ontology records, found '+data.length);
      const render=()=>{
        const found=search(data,document.getElementById('ontology-query').value,document.getElementById('ontology-type').value);
        list.replaceChildren(...found.map(card));
        count.textContent=found.length+' of '+data.length+' formal objects';
        document.getElementById('ontology-empty').hidden=found.length!==0;
      };
      document.getElementById('ontology-query').addEventListener('input',render);
      document.getElementById('ontology-type').addEventListener('change',render);
      const evidence=Array.isArray(catalog.situational_evaluations)?catalog.situational_evaluations:[];
      document.getElementById('ontology-evaluation-count').textContent=
        evidence.length+' observed evaluation records. '+(evidence.length?'Inspect cited evidence before concluding effectiveness.':'No real-world effectiveness results have been recorded.');
      render();
    }catch(error){
      count.textContent='Unavailable';
      const e=document.getElementById('ontology-error');e.hidden=false;e.textContent='Could not load ontology: '+error.message;
    }
  }
  return Object.freeze({TYPES,flatten,search,label,init});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=NomosOntology;
if(typeof document!=='undefined')NomosOntology.init();
