'use strict';
// Deterministic, read-only construction from fixed approved historical versions.
// Rebuild requires explicit version authorization; never silently retarget the baseline.
const fs=require('node:fs'),path=require('node:path');
const build=function build(spec,pubs){
const base=(id,version)=>{const x=pubs.published_versions.find(x=>x.prompt_id===id&&x.version===version);if(!x||!x.owner_approved)throw Error("Required approved baseline unavailable: "+id+" v"+version);return x.text};
const generic=base(spec.baseline.init.prompt_id,spec.baseline.init.version);
const adopted=base(spec.baseline.adopt.prompt_id,spec.baseline.adopt.version);
const port=spec.families.find(f=>f.slug==="rust-port");
if(!port)throw Error("Missing generic port");
const result=[];
for(let i=0;i<spec.families.length;i++){
 const f=spec.families[i],specific=f.includesPort?[...port.instructions,...f.instructions]:f.instructions;
 for(const mode of ["init","adopt"]){
  const key=mode==="init"?f.number:f.shifted;
  const title=mode==="init"?"Initialize "+f.name:"Adopt Existing "+f.name;
  const intro=[
"# "+f.icon+" "+title,
"",
"**Project:** [Owner-provided repository URL or project description]",
"**Objective:** [Owner-provided scope and acceptance criteria]",
"**Invocation:** "+(mode==="init"?"create or bootstrap authorized project work":"assume stewardship of existing project without resetting its prior work"),
"**Base contract:** Project Stewardship D V"+spec.baseline.init.version+(mode==="adopt"?"; Project Adopt A V"+spec.baseline.adopt.version:""),
"",
"Use this self-contained prompt as the common stewardship contract plus the following project-type obligations. Project-specific instructions below refine the generic requirements; they do not create authorization for unrelated features or repositories.",
mode==="adopt"?"**Precedence:** This is an existing project, not a new-project reset. Existing verified work, accepted roadmap and project decisions take precedence over generic bootstrap language. Recover and reconcile them before acting.":"",
"",
"## Common Project Stewardship",
"",
generic.trimEnd(),
"",
mode==="adopt"?"## Existing Project Adoption Contract":"",
mode==="adopt"?adopted.trimEnd():"",
"",
"## Project-Type Requirements — "+f.name,
"",
...specific.map(x=>"- "+x),
"",
"**Final boundary:** "+(mode==="init"?"Begin with evidence-based reconnaissance, a calibrated full-lifecycle roadmap, and then perform authorized work.":"Reconstruct the existing verified state, preserve completed work, recalibrate only where evidence demands it, then advance authorized unfinished work."),
""
  ];
  const text=intro.filter((line,i)=>!(i>0&&line===""&&intro[i-1]==="")).join("\n").trim()+"\n";
  result.push({label:f.icon+" "+(mode==="init"?"Init ":"Adopt ")+f.name,text,key});
 }
}
return {version:1,entries:result};
};
function load(root=path.resolve(__dirname,'..')){
 const spec=JSON.parse(fs.readFileSync(path.join(root,'end-consumer-profiles/project-initializers/v0/specifications.json'),'utf8'));
 const pubs=JSON.parse(fs.readFileSync(path.join(root,'docs/data/project-stewardship-published-versions.json'),'utf8'));
 return build(spec,pubs);
}
const serialize=data=>JSON.stringify(data,null,2)+'\n';
if(require.main===module){
 const result=serialize(load());
 if(process.argv.includes('--check')){
   const filepath=path.resolve(__dirname,'../end-consumer-profiles/project-initializers/v0/trievium.json');
   if(fs.readFileSync(filepath,'utf8')!==result)throw Error('Initializer V0 no longer matches locked source versions');
   console.log('Initializer V0 matches its frozen approved source versions.');
 }else process.stdout.write(result);
}
module.exports={build,load,serialize};
