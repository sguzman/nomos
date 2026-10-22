#!/usr/bin/env node
'use strict';
/* Intake-only: create or list profile ideas. Never process, instantiate, finalize or apply. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const defaultDir=path.join(root,'queues','profiles');
const idPattern=/^PROFILE-IDEA-(\\d{4,})$/;
const rulePattern=/^NOM-\\d{4,}$/;
const groupPattern=/^GROUP-\\d{4,}$/;
const profilePattern=/^PROFILE-\\d{4,}$/;
const statusValues=new Set(['queued','deferred','cancelled','instantiated']);
const fields=['id','kind','title','summary','status','proposed_rule_ids','proposed_group_ids','linked_profile_ids','governance'];
const datePattern=/^\\d{4}-\\d{2}-\\d{2}$/;
function unique(values){return new Set(values).size===values.length;}
function validDate(s){
  if(typeof s!=='string'||!datePattern.test(s))return false;
  const d=new Date(s+'T00:00:00Z');
  return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;
}
function validateIdea(idea,{profileIds=null}={}){
  const errors=[];
  if(!idea||typeof idea!=='object'||Array.isArray(idea))return ['Idea must be an object'];
  if(Object.keys(idea).sort().join(',')!==[...fields].sort().join(','))errors.push('Incorrect idea fields');
  if(!idPattern.test(idea.id||''))errors.push('Invalid profile idea ID');
  if(idea.kind!=='profile_idea')errors.push('Invalid idea kind');
  if(typeof idea.title!=='string'||!idea.title.trim())errors.push('A nonempty title is required');
  if(typeof idea.summary!=='string')errors.push('Summary must be text');
  if(!statusValues.has(idea.status))errors.push('Invalid queue status');
  for(const [name,pattern] of [['proposed_rule_ids',rulePattern],['proposed_group_ids',groupPattern],['linked_profile_ids',profilePattern]]){
    const entries=idea[name];
    if(!Array.isArray(entries)||!entries.every(x=>typeof x==='string'&&pattern.test(x))||!unique(entries))errors.push('Invalid or duplicate '+name);
  }
  if(idea.status==='instantiated'){
    if(!idea.linked_profile_ids?.length)errors.push('Instantiated ideas must link to real profile IDs');
    if(profileIds && idea.linked_profile_ids?.some(id=>!profileIds.has(id)))errors.push('Linked profile does not exist');
  }else if(idea.linked_profile_ids?.length)errors.push('Uninstantiated ideas cannot link profiles');
  const g=idea.governance;
  if(!g||typeof g!=='object'||Array.isArray(g)||Object.keys(g).sort().join(',')!=='created_on,updated_on'||
     !validDate(g.created_on)||!validDate(g.updated_on)||g.updated_on<g.created_on)errors.push('Invalid governance dates');
  return errors;
}
function readQueue(dir=defaultDir){
  const names=fs.readdirSync(dir).filter(name=>name.endsWith('.json')).sort();
  const entries=[];
  for(const name of names){
    if(!/^PROFILE-IDEA-\\d{4,}\\.json$/.test(name))throw new Error('Invalid queue filename: '+name);
    const record=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
    if(name!==record.id+'.json')throw new Error('Queue filename and record ID differ: '+name);
    entries.push(record);
  }
  return entries;
}
function validateQueue(entries,opts={}){
  const errors=[],seen=new Set();
  for(const item of entries){
    const label=item?.id||'<unknown>';
    if(seen.has(label))errors.push(label+': duplicate queue ID');
    seen.add(label);
    errors.push(...validateIdea(item,opts).map(e=>label+': '+e));
  }
  return errors;
}
function nextIdeaId(entries){
  const largest=entries.reduce((m,e)=>Math.max(m,Number(idPattern.exec(e.id)?.[1]||0)),0);
  return 'PROFILE-IDEA-'+String(largest+1).padStart(4,'0');
}
function newIdea({title,summary='',ruleIds=[],groupIds=[],date=new Date().toISOString().slice(0,10)},existing=[]){
  const idea={id:nextIdeaId(existing),kind:'profile_idea',title,summary,status:'queued',
    proposed_rule_ids:[...ruleIds],proposed_group_ids:[...groupIds],linked_profile_ids:[],
    governance:{created_on:date,updated_on:date}};
  const issues=validateIdea(idea);
  if(issues.length)throw new Error(issues.join('; '));
  return idea;
}
function enqueue(data,dir=defaultDir){
  const existing=readQueue(dir);
  const problems=validateQueue(existing);
  if(problems.length)throw new Error(problems.join('; '));
  const idea=newIdea(data,existing);
  fs.writeFileSync(path.join(dir,idea.id+'.json'),JSON.stringify(idea,null,2)+'\\n',{flag:'wx'});
  return idea;
}
function parseIds(arg){return arg?arg.split(',').map(x=>x.trim()):[];}
function cli(args){
  const [action,...options]=args;
  if(action==='list'){
    if(options.length)throw new Error('list takes no arguments');
    for(const idea of readQueue())process.stdout.write(idea.id+'  '+idea.status+'  '+idea.title+'\\n');
    return;
  }
  if(action!=='add')throw new Error('Usage: profile_ideas.cjs list | add --title "..." [--summary "..."] [--rules NOM-0001,NOM-0003] [--groups GROUP-0001]');
  const parsed={};
  for(let i=0;i<options.length;i+=2){
    if(!['--title','--summary','--rules','--groups'].includes(options[i])||options[i+1]===undefined||Object.hasOwn(parsed,options[i]))
      throw new Error('Invalid or repeated command option: '+options[i]);
    parsed[options[i]]=options[i+1];
  }
  const idea=enqueue({title:parsed['--title'],summary:parsed['--summary']||'',
    ruleIds:parseIds(parsed['--rules']),groupIds:parseIds(parsed['--groups'])});
  process.stdout.write('Queued '+idea.id+' (not processed or instantiated)\\n');
}
if(require.main===module){
  try{cli(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={validateIdea,validateQueue,readQueue,nextIdeaId,newIdea,enqueue};
