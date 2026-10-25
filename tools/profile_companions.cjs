'use strict';
/* A companion is a derived descriptive inventory, never a rule selector. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const TYPES=[{name:'situations',kind:'derived_situation_profile',prefix:'SITUATION-PROFILE-',conceptPrefix:'SITU-'},
 {name:'intents',kind:'derived_intent_profile',prefix:'INTENT-PROFILE-',conceptPrefix:'INTENT-'}];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const names=(p,re)=>fs.readdirSync(p).filter(x=>re.test(x)).sort();
const hash=raw=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(raw)+'\0'+raw).digest('hex');
function derive(profile,links,concepts,raw,type){
 if(!TYPES.includes(type))throw Error('Unknown companion kind');
 if(profile.kind!=='rule_profile'||!/^PROFILE-\d{4,}$/.test(profile.id)||
   !Array.isArray(profile.selected_rule_ids)||
   new Set(profile.selected_rule_ids).size!==profile.selected_rule_ids.length)throw Error('Invalid source profile');
 const lookup=new Map(concepts.map(x=>[x.id,x])),by=new Map();
 for(const rid of profile.selected_rule_ids){
  const l=links.get(rid);
  if(!l||l.rule_editorial_status!=='published')throw Error('Missing published rule link '+rid);
  for(const r of l[type.name]){
   if(!lookup.has(r.id)||!r.id.startsWith(type.conceptPrefix))throw Error('Unknown concept '+r.id);
   if(!by.has(r.id))by.set(r.id,{id:r.id,via_rules:[]});
   by.get(r.id).via_rules.push({id:rid,basis:r.basis});
  }
 }
 const members=[...by.values()].sort((a,b)=>a.id.localeCompare(b.id));
 for(const m of members){
  m.via_rules.sort((a,b)=>a.id.localeCompare(b.id));
  if(type.name==='intents'){m.semantic_role=lookup.get(m.id).semantic_role;m.atomicity=lookup.get(m.id).atomicity;}
 }
 return {id:type.prefix+profile.id.slice(8),kind:type.kind,version:'1.0.0',
  status:'derived_inert',title:profile.title+' - '+(type.name==='intents'?'intent':'situation')+' companion',
  source_profile:{id:profile.id,version:profile.version,status:profile.status,
   selection_confirmed:profile.review.selection_confirmed,source_git_blob_sha:hash(raw)},
  source_rule_ids:[...profile.selected_rule_ids],
  source_analysis_snapshot:'ab9b06e947284dab83fe19519be21dc1b0ad5051',members};
}
function generate(root=ROOT){
 const dir=path.join(root,'profiles'),linkDir=path.join(root,'ontology/rule-links');
 const links=new Map(names(linkDir,/^RLINK-\d+\.json$/).map(f=>{const l=read(path.join(linkDir,f));return [l.rule_id,l];}));
 const cpp=path.join(linkDir,'cpp-remediation');
 if(fs.existsSync(cpp))for(const f of names(cpp,/^RLINK-\d+\.json$/)){
  const l=read(path.join(cpp,f));if(links.has(l.rule_id))throw Error('Duplicate C++ link '+l.rule_id);links.set(l.rule_id,l);
 }
 const cPort=path.join(linkDir,'c-remediation');
 if(fs.existsSync(cPort))for(const f of names(cPort,/^RLINK-\d+\.json$/)){
  const l=read(path.join(cPort,f));if(links.has(l.rule_id))throw Error('Duplicate C source '+l.rule_id);links.set(l.rule_id,l);
 }
 const scratch=path.join(linkDir,'new-rust-remediation');
 if(fs.existsSync(scratch))for(const f of names(scratch,/^RLINK-\d+\.json$/)){
  const l=read(path.join(scratch,f));if(links.has(l.rule_id))throw Error('Duplicate new Rust rule '+l.rule_id);links.set(l.rule_id,l);
 }
 const extension=path.join(linkDir,'port-remediation');
 if(fs.existsSync(extension))for(const f of names(extension,/^RLINK-\d+\.json$/)){
  const l=read(path.join(extension,f));if(links.has(l.rule_id))throw Error('Duplicate source '+l.rule_id);links.set(l.rule_id,l);
 }
 const all=Object.fromEntries(TYPES.map(t=>[t.name,
  names(path.join(root,'ontology',t.name),/\.json$/).filter(f=>f.startsWith(t.conceptPrefix))
  .map(f=>read(path.join(root,'ontology',t.name,f)))]));
 const result=new Map();
 for(const file of names(dir,/^PROFILE-\d+\.json$/)){
  const raw=fs.readFileSync(path.join(dir,file),'utf8'),profile=JSON.parse(raw);
  for(const t of TYPES){const x=derive(profile,links,all[t.name],raw,t);
   result.set(path.join('profiles/companions',t.name,x.id+'.json'),JSON.stringify(x,null,2)+'\n');}
 }
 return result;
}
function run(mode='--check',root=ROOT){
 if(mode!=='--check'&&mode!=='--write')throw Error('Expected --check or --write');
 const expected=generate(root),extra=new Set();
 for(const type of TYPES){const dir=path.join(root,'profiles/companions',type.name);
  if(mode==='--write')fs.mkdirSync(dir,{recursive:true});
  if(fs.existsSync(dir))for(const name of names(dir,/\.json$/))
   extra.add(path.join('profiles/companions',type.name,name));
 }
 for(const [rel,s] of expected){const dest=path.join(root,rel);
  if(mode==='--write')fs.writeFileSync(dest,s);
  else if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==s)throw Error('Stale or missing companion '+rel);
  extra.delete(rel);
 }
 if(extra.size)throw Error('Orphan companions: '+[...extra].join(', '));
 return expected;
}
if(require.main===module){try{console.log('Validated '+run(process.argv[2]||'--check').size+' inert companions');}
 catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={derive,generate,run,TYPES};
