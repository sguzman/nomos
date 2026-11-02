'use strict';
// Reproducible V5 successors: immutable V4 sources, approved D7/A5, and eleven Rust architecture rules.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),data=p=>JSON.parse(read(p));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),pretty=x=>JSON.stringify(x,null,2)+'\n';
const spec=data('end-consumer-profiles/project-initializers/v5/specifications.json');
const v4=require('./build_project_initializers_v4.cjs');
const historical=v4.selected,priorReport=v4.report;
const manifest=data('docs/data/project-stewardship-published-versions.json');
const general=data('docs/exports/project-stewardship-approved-trievium.json');
const baseline=(key,version)=>{
 const p=manifest.published_versions.find(x=>x.key===key&&x.version===version);
 if(!p||!p.owner_approved||sha(p.text)!==p.sha256)throw Error('Unapproved/corrupted '+key+' V'+version);
 return p.text;
};
const d6=baseline('D','6'),d7=baseline('D','7'),a4=baseline('A','4'),a5=baseline('A','5');
if(general.entries.find(e=>e.key==='D').text!==d7||general.entries.find(e=>e.key==='A').text!==a5)
 throw Error('Selected general source mismatch');
if(spec.previous_version!=='4'||spec.baseline_versions.D!=='7'||spec.baseline_versions.A!=='5'||historical.entries.length!==14)
 throw Error('Unrecognized V5 input');
const ids=spec.rule_ids;
if(ids.length!==11||ids.some((id,i)=>id!=='NOM-'+String(256+i).padStart(4,'0')))throw Error('Rust architecture rule identity mismatch');
const rules=ids.map(id=>{
 const raw=read('rules/'+id+'.json'),blob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(raw)+'\\0'+raw).digest('hex');
 if(blob!==spec.rule_blob_sha1[id])throw Error('Rust architecture rule changed: '+id);
 const r=JSON.parse(raw);
 if(r.status!=='published'||r.id!==id||r.scope?.project_types?.includes('rust_project')!==true)throw Error('Rule scope drift: '+id);
 if(r.norm?.bounds?.minimum!==null||r.norm?.bounds?.maximum!==null)throw Error('Unexpected length bound: '+id);
 return r;
});
const line=r=>{
 const clauses=[];
 if(r.scope?.preconditions?.length)clauses.push('When: '+r.scope.preconditions.join('; '));
 if(r.norm?.exceptions?.length)clauses.push('Exceptions: '+r.norm.exceptions.join('; '));
 if(r.scope?.exclusions?.length)clauses.push('Excluded: '+r.scope.exclusions.join('; '));
 return '- '+r.id+' — '+r.title+': '+r.statement+(clauses.length?'\n  '+clauses.join(' | '):'');
};
const add='\n## Rust Modular Architecture — Conditional, Authorized Rust Work\n\n'+
 'The following canonical rules apply only when the actual authorized project includes Rust. '+ 
 'Their publication or inclusion here does not authorize unrelated repositories, speculative functionality, or non-Rust project changes. '+ 
 'Actively refactor existing god files throughout the authorized Rust project, without numerical file/function line limits.\n\n'+rules.map(line).join('\n')+'\n';
function once(s,anchor,replacement){if(s.split(anchor).length!==2)throw Error('Expected exactly one anchor: '+anchor.slice(0,70));return s.replace(anchor,replacement);}
const entries=[],metadata=[];
for(let i=0;i<14;i++){
 const old=historical.entries[i],prior=priorReport.entries[i];
 let text=once(old.text,'**Contract versions:** D V6','**Contract versions:** D V7');
 text=once(text,'## Common Project Stewardship\n'+d6.trimEnd(),'## Common Project Stewardship\n'+d7.trimEnd());
 if(i%2){
  text=once(text,'A V4','A V5');
  text=once(text,'## Existing Project Adoption\n'+a4.trimEnd(),'## Existing Project Adoption\n'+a5.trimEnd());
 }
 text=once(text,'\n\n**Stop condition:**','\n'+add+'\n**Stop condition:**');
 for(const id of ids)if(!text.includes(id+' — '))throw Error('Missing rule '+id+' in '+old.key);
 entries.push({...old,text});
 const ruleIds=[...new Set([...prior.rule_ids,...ids])].sort((a,b)=>Number(a.slice(4))-Number(b.slice(4)));
 metadata.push({...prior,rule_count:ruleIds.length,rule_ids:ruleIds,sha256:sha(text)});
}
const selected={version:1,entries},combined={version:1,entries:[...general.entries,...entries]};
if(new Set(combined.entries.map(e=>e.key)).size!==24)throw Error('Selected key collision');
const report={schema_version:1,kind:'project_initializer_v5_rule_coverage',profile_id:'EC-PROFILE-0002',source_version:'5',
 approved_baseline:{D:'7',A:'5'},previous_source_version:'4',provisional_full_profile_selection:true,
 rule_statements_embedded:true,conditional_rust_scope_required:true,entries:metadata,
 source_sha256:sha(pretty(selected)),combined_sha256:sha(pretty(combined)),historical_versions_preserved:true,rust_architecture_rules:ids};
const outputs=[
 ['end-consumer-profiles/project-initializers/v5/trievium.json',pretty(selected)],
 ['docs/exports/project-initializers-trievium.json',pretty(selected)],
 ['docs/exports/project-stewardship-with-initializers-trievium.json',pretty(combined)],
 ['docs/exports/project-initializers-v5-manifest.json',pretty(report)]
];
function publish(check=false){
 for(const [p,content] of outputs){const full=path.join(root,p);if(check){
  if(read(p)!==content)throw Error('V5 generated output drift '+p);
 }else{fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,content)}}
 return report;
}
if(require.main===module){const r=publish(process.argv.includes('--check'));process.stdout.write('V5 '+r.entries.length+' prompts, '+r.rust_architecture_rules.length+' new architecture rules, '+r.source_sha256+'\n');}
module.exports={publish,report,selected,combined};
