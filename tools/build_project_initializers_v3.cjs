'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=p=>JSON.parse(read(p));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const pretty=x=>JSON.stringify(x,null,2)+'\n';
const spec=data('end-consumer-profiles/project-initializers/v3/specifications.json');
const manifest=data('docs/data/project-stewardship-published-versions.json');
const prev=data('end-consumer-profiles/project-initializers/v2/trievium.json');
const generic=data('docs/exports/project-stewardship-approved-trievium.json');
const baseline=(key,version)=>{const p=manifest.published_versions.find(p=>p.key===key&&p.version===version);if(!p||!p.owner_approved||sha(p.text)!==p.sha256)throw Error('Invalid approved '+key+version);return p.text};
const init=baseline('D',spec.baseline.init.version),adopt=baseline('A',spec.baseline.adopt.version);
const prof=id=>{const p=data('profiles/'+id+'.json');if(p.status!=='draft'||p.review.selection_confirmed||p.review.finalization_confirmed)throw Error('Expected draft profile '+id);return p};
const portFull=['PROFILE-0002','PROFILE-0010','PROFILE-0012'].map(prof);
const portShared=portFull[0].selected_rule_ids.filter(id=>portFull.every(p=>p.selected_rule_ids.includes(id)));
const globalIds=['NOM-0005','NOM-0008','NOM-0009','NOM-0068','NOM-0069','NOM-0070','NOM-0071','NOM-0072','NOM-0073','NOM-0077','NOM-0246','NOM-0247','NOM-0248','NOM-0249'];
const cache=new Map();
function rule(id){if(!cache.has(id)){const r=data('rules/'+id+'.json');if(r.id!==id||r.status!=='published')throw Error('Missing rule '+id);cache.set(id,r)}return cache.get(id)}
function familyProfile(f){return f.profiles&&f.profiles.length?prof(f.profiles[f.profiles.length-1]):null}
function ruleIds(f){const p=familyProfile(f);return [...new Set([...(p?p.selected_rule_ids:portShared),...globalIds,...(f.slug==='rust-port'?['NOM-0074','NOM-0075','NOM-0076']:[])])].sort((a,b)=>Number(a.slice(4))-Number(b.slice(4)))}
function line(id){const r=rule(id);let clauses=[];if(r.scope?.preconditions?.length)clauses.push('When: '+r.scope.preconditions.join('; '));if(r.norm?.exceptions?.length)clauses.push('Exceptions: '+r.norm.exceptions.join('; '));if(r.scope?.exclusions?.length)clauses.push('Excluded: '+r.scope.exclusions.join('; '));return '- '+id+' — '+r.title+': '+r.statement+(clauses.length?'\n  '+clauses.join(' | '):'')}
const port=spec.families.find(f=>f.slug==='rust-port');if(!port)throw Error('No generic Rust-port family');
const entries=[],metadata=[];
for(const [i,f] of spec.families.entries()){
 const profile=familyProfile(f),ids=ruleIds(f),instructions=f.includesPort?[...port.instructions,...f.instructions]:f.instructions;
 const fullText=ids.map(line).join('\n');
 for(let n=0;n<2;n++){
  const old=prev.entries[i*2+n],key=n?f.shifted:f.number;
  if(!old||old.key!==key)throw Error('Keyboard mapping drift for '+f.slug);
  const blocks=[
   '# '+f.icon+' '+(n?'Adopt Existing ':'Initialize ')+(f.adopt_name||f.name),
   '**Project:** [Owner-supplied repository URL or project details]',
   '**Objective:** [Owner-supplied original scope and acceptance criteria]',
   '**Contract versions:** D V'+spec.baseline.init.version+(n?', A V'+spec.baseline.adopt.version:''),
   '',
   '## Common Project Stewardship',init.trimEnd()
  ];
  if(n)blocks.push('','## Existing Project Adoption',adopt.trimEnd());
  blocks.push('','## '+f.name+' Project-Specific Requirements',...instructions.map(x=>'- '+x),'',
    '## Canonical Nomos Full-Profile Rules',
    'The owner requests all applicable project rules, not indiscriminate execution of unrelated tasks. '+(profile?'Source: '+profile.id+' '+profile.version+' (provisional draft selections; finalization NOT implied).':'Generic Rust-port source: intersection of C, C++ and Python Full draft profiles plus strict-port essentials.')+
    ' Rule statements are embedded below. Check each rule against the actual project scope, triggering conditions, exceptions and exclusions before obeying it. Preserve established decisions and reconcile conflicts transparently. A candidate profile does not authorize extra features, project registration, tool use, license changes or unrequested work.',
    fullText,'',
    '**Stop condition:** Continue only authorized, verified unfinished project work; no speculative work after completion.');
  const text=blocks.join('\n')+'\n';
  entries.push({key,label:old.label,text});
  metadata.push({prompt_id:'EC-PROMPT-'+String(i*2+n+11).padStart(4,'0'),key,source_full_profile:profile?.id||null,source_status:profile?.status||'intersection_of_provisional_profiles',rule_count:ids.length,rule_ids:ids,sha256:sha(text)});
 }
}
const selected={version:1,entries},combined={version:1,entries:[...generic.entries,...entries]};
if(entries.length!==14||new Set(combined.entries.map(e=>e.key)).size!==24)throw Error('Key collision');
const report={schema_version:1,kind:'project_initializer_v3_rule_coverage',profile_id:'EC-PROFILE-0002',source_version:'3',approved_baseline:{D:'5',A:'3'},provisional_full_profile_selection:true,rule_statements_embedded:true,entries:metadata,source_sha256:sha(pretty(selected)),combined_sha256:sha(pretty(combined)),historical_versions_preserved:true};
if(report.source_sha256!==spec.expected_source_sha256)throw Error('Approved V3 source hash drift: publish a reviewed successor instead of mutating V3');
const files=[
 ['end-consumer-profiles/project-initializers/v3/trievium.json',pretty(selected)],
 ['docs/exports/project-initializers-trievium.json',pretty(selected)],
 ['docs/exports/project-stewardship-with-initializers-trievium.json',pretty(combined)],
 ['docs/exports/project-initializers-v3-manifest.json',pretty(report)]
];
function publish(check=false){for(const [p,content] of files){if(check){if(read(p)!==content)throw Error('Generated content drift '+p)}else{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),content)}}return report}
if(require.main===module){const result=publish(process.argv.includes('--check'));process.stdout.write('V3 '+result.entries.length+' prompts, '+result.entries.reduce((a,e)=>a+e.rule_count,0)+' canonical rule references, source '+result.source_sha256+'\n')}
module.exports={publish,ruleIds,familyProfile,report,selected,combined};
