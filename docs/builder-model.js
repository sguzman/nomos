'use strict';
/* Inert, public-safe source-backed question model. No implicit profile activation. */
const NomosBuilderModel=(()=>{
 const families=Object.freeze([
  {id:'new-rust',name:'New Rust project',lite:'PROFILE-0003',full:'PROFILE-0004',question_group:'rust-features'},
  {id:'c-port',name:'C to Rust port',lite:'PROFILE-0001',full:'PROFILE-0002',question_group:null},
  {id:'cpp-port',name:'C++ to Rust port',lite:'PROFILE-0009',full:'PROFILE-0010',question_group:null},
  {id:'python-port',name:'Python to Rust port',lite:'PROFILE-0011',full:'PROFILE-0012',question_group:null},
  {id:'rust-fork',name:'Rust fork maintenance',lite:'PROFILE-0007',full:'PROFILE-0008',question_group:null},
  {id:'tarium',name:'Independent Tarium project',lite:'PROFILE-0005',full:'PROFILE-0006',question_group:null}
 ]);
 const questions=Object.freeze([
  {id:'gui',label:'Will it have a graphical interface?',help:'Keyboard and accessible feedback requirements',rule_id:'NOM-0234',source_phrase:'For a project exposing a GUI'},
  {id:'persistence',label:'Will it persist valuable mutable data?',help:'Interruption-safe writes and recovery',rule_id:'NOM-0229',source_phrase:'When the application persists valuable mutable state'},
  {id:'background_workers',label:'Will it run background or concurrent work?',help:'Worker ownership, cancellation and shutdown',rule_id:'NOM-0233',source_phrase:'When the application uses background tasks'},
  {id:'external_input',label:'Will it accept untrusted external input?',help:'Validate trust boundaries before side effects',rule_id:'NOM-0230',source_phrase:'Where input crosses an external trust boundary'},
  {id:'runtime_configuration',label:'Will it expose runtime configuration?',help:'Defaults, precedence and invalid values',rule_id:'NOM-0228',source_phrase:'When the project accepts runtime configuration'},
  {id:'diagnostics',label:'Will it produce logs, traces or crash reports?',help:'Prevent private data leakage in diagnostics',rule_id:'NOM-0235',source_phrase:'For applications producing logs'}
 ]);
 const answers=new Set(['yes','no','unknown','not_applicable']);
 function availableQuestions(familyId){
  const family=families.find(x=>x.id===familyId);
  return family?.question_group==='rust-features' ? [...questions] : [];
 }
 function validateCatalog(catalog){
  if(!catalog||!Array.isArray(catalog.profiles)||!Array.isArray(catalog.rules))
   throw new Error('Missing catalog profiles or rules');
  return true;
 }
 function describe({catalog,familyId,depth,values={}}){
  validateCatalog(catalog);
  const family=families.find(x=>x.id===familyId);
  if(!family)throw new Error('Choose a supported project family');
  if(depth!=='lite'&&depth!=='full')throw new Error('Choose Lite or Full');
  const profile=catalog.profiles.find(p=>p.id===family[depth]);
  if(!profile)throw new Error('Source profile is missing from the catalog');
  if(!Array.isArray(profile.selected_rule_ids))throw new Error('Invalid profile members');
  const selectedIds=new Set(profile.selected_rule_ids);
  const rulesById=new Map(catalog.rules.map(r=>[r.id,r]));
  const relevant=availableQuestions(familyId);
  const allowed=new Set(relevant.map(q=>q.id));
  if(Object.entries(values).some(([key,value])=>!allowed.has(key)||!answers.has(value)))
   throw new Error('Unsupported question or answer');
  const suggestions=relevant.map(q=>{
   const rule=rulesById.get(q.rule_id);
   if(!rule||rule.status!=='published'||!rule.statement.includes(q.source_phrase))
    throw new Error('Source rule or semantic evidence changed: '+q.rule_id);
   const answer=values[q.id]||'unknown';
   const member=selectedIds.has(q.rule_id);
   const interpretation=answer==='yes' ?
     (member?'Selected, but original conditions still apply':'Potential optional addition for owner review') :
     answer==='no'||answer==='not_applicable' ?
     (member?'Potential inapplicability: owner review required':'Not in this profile') :
     (member?'Question unresolved; retain original conditions':'Not in this profile');
   return {question_id:q.id,rule_id:q.rule_id,answer,already_selected:member,
     interpretation,source_statement:rule.statement};
  });
  return {kind:'builder_preview',profile_id:profile.id,profile_title:profile.title,
   profile_status:profile.status,selection_confirmed:profile.review?.selection_confirmed===true,
   total_selected_rules:selectedIds.size,answers:Object.fromEntries(Object.entries(values).sort()),
   suggestions,can_export:false,
   warning:'This is a non-exportable draft/profile review preview. Answers never approve, finalize, select, or apply rules.'};
 }
 return Object.freeze({families,questions,availableQuestions,describe,validateCatalog});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=NomosBuilderModel;