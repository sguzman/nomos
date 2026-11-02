'use strict';
// Deterministic V4: pinned V3 + approved generic successors + six role-based font suggestions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),data=p=>JSON.parse(read(p));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),pretty=x=>JSON.stringify(x,null,2)+'\n';
const spec=data('end-consumer-profiles/project-initializers/v4/specifications.json');
const v3spec=data('end-consumer-profiles/project-initializers/v3/specifications.json');
const old=data('end-consumer-profiles/project-initializers/v3/trievium.json');
const oldReport=data('docs/exports/project-initializers-v3-manifest.json');
const published=data('docs/data/project-stewardship-published-versions.json');
const currentGeneric=data('docs/exports/project-stewardship-approved-trievium.json');
const ids=['NOM-0250','NOM-0251','NOM-0252','NOM-0253','NOM-0254','NOM-0255'];
function baseline(key,version){const x=published.published_versions.find(p=>p.key===key&&p.version===version);if(!x||!x.owner_approved||sha(x.text)!==x.sha256)throw Error('Unapproved or corrupt '+key+version);return x.text;}
const d5=baseline('D','5'),d6=baseline('D','6'),a3=baseline('A','3'),a4=baseline('A','4');
// Preserve the V4 combined baseline even when later general prompt selections advance.
const historicalGeneral={S:'6',D:'6',A:'4',F:'1',G:'1'};
const generic={...currentGeneric,entries:currentGeneric.entries.map(e=>historicalGeneral[e.key]?{...e,text:baseline(e.key,historicalGeneral[e.key])}:e)};
if(spec.previous_source_sha256!==v3spec.expected_source_sha256||sha(pretty(old))!==v3spec.expected_source_sha256||oldReport.source_sha256!==v3spec.expected_source_sha256)throw Error('V3 historical input drift');
const rules=ids.map(id=>{
 const raw=read('rules/'+id+'.json');
 const blob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(raw)+'\0'+raw).digest('hex');
 if(blob!==spec.rule_blob_sha1[id])throw Error('V4 font rule drift '+id);
 const r=JSON.parse(raw);
 if(r.id!==id||r.status!=='published'||r.norm.predicate.action!=='consider_and_prefer')throw Error('Invalid font preference '+id);
 return r;
});
function line(r){const parts=[];if(r.scope?.preconditions?.length)parts.push('When: '+r.scope.preconditions.join('; '));if(r.norm?.exceptions?.length)parts.push('Exceptions: '+r.norm.exceptions.join('; '));if(r.scope?.exclusions?.length)parts.push('Excluded: '+r.scope.exclusions.join('; '));return '- '+r.id+' — '+r.title+': '+r.statement+(parts.length?'\n  '+parts.join(' | '):'');}
function once(s,a,b){if(s.split(a).length!==2)throw Error('Expected exactly one match: '+a.slice(0,60));return s.replace(a,b);}
const add=rules.map(line).join('\n'),entries=[],metadata=[];
for(let i=0;i<old.entries.length;i++){
 const e=old.entries[i];let text=once(e.text,'**Contract versions:** D V5','**Contract versions:** D V6');
 text=once(text,'## Common Project Stewardship\n'+d5.trimEnd(),'## Common Project Stewardship\n'+d6.trimEnd());
 if(i%2){text=once(text,'A V3','A V4');text=once(text,'## Existing Project Adoption\n'+a3.trimEnd(),'## Existing Project Adoption\n'+a4.trimEnd());}
 text=once(text,'\n\n**Stop condition:**','\n'+add+'\n\n**Stop condition:**');
 entries.push({...e,text});
 const p=oldReport.entries[i],all=[...new Set([...p.rule_ids,...ids])].sort((a,b)=>Number(a.slice(4))-Number(b.slice(4)));
 metadata.push({...p,rule_count:all.length,rule_ids:all,sha256:sha(text)});
}
const selected={version:1,entries},combined={version:1,entries:[...generic.entries,...entries]};
if(entries.length!==14||new Set(combined.entries.map(e=>e.key)).size!==24)throw Error('Keyset collision');
const report={schema_version:1,kind:'project_initializer_v4_rule_coverage',profile_id:'EC-PROFILE-0002',source_version:'4',approved_baseline:{D:'6',A:'4'},provisional_full_profile_selection:true,rule_statements_embedded:true,entries:metadata,source_sha256:sha(pretty(selected)),combined_sha256:sha(pretty(combined)),historical_versions_preserved:true,typography_rules:ids};
const files=[
 ['end-consumer-profiles/project-initializers/v4/trievium.json',pretty(selected)],
 ['end-consumer-profiles/project-initializers/v4/archived-selected-trievium.json',pretty(selected)],
 ['end-consumer-profiles/project-initializers/v4/archived-combined-trievium.json',pretty(combined)],
 ['end-consumer-profiles/project-initializers/v4/archived-manifest.json',pretty(report)]
];
function publish(check=false){for(const [p,s] of files){if(check){if(read(p)!==s)throw Error('V4 generated output drift '+p)}else{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s)}}return report;}
if(require.main===module){const r=publish(process.argv.includes('--check'));process.stdout.write('V4 '+r.entries.length+' prompts, '+r.entries.reduce((n,e)=>n+e.rule_count,0)+' rule references, '+r.source_sha256+'\n');}
module.exports={publish,report,selected,combined};
