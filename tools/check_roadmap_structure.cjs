'use strict';
/* Selected NOM-0010 structural preflight for disposable acceptance only.
 * Passing does not establish semantic rule conformance. */
const {readFileSync}=require('node:fs');
const STATUS=new Set(['✅','☑️','✔️','❌','✖️','⬜','🔄','⏳','⌛','🚧','🟢','🟡','🔴']);
const segmenter=new Intl.Segmenter('en',{granularity:'grapheme'});
function identityEmoji(text){
 return [...segmenter.segment(text)].map(x=>x.segment)
  .filter(part=>/\p{Extended_Pictographic}/u.test(part)&&!STATUS.has(part));
}
function validateRoadmap(markdown){
 if(typeof markdown!=='string')throw new TypeError('Expected Markdown text');
 const headings=[],items=[];
 for(const [i,line] of markdown.split(/\r?\n/).entries()){
  const heading=line.match(/^(#{2,6})\s+(.+?)\s*$/);
  if(heading){
   const item={line:i+1,level:heading[1].length,text:heading[2],kind:'heading'};
   headings.push(item);items.push(item);
  }else{
   const bullet=line.match(/^\s*(?:[-*+]\s+|\d+[.)]\s+)(.+?)\s*$/);
   if(bullet)items.push({line:i+1,text:bullet[1],kind:'item'});
  }
 }
 const gaps=[];
 if(!items.length)gaps.push('roadmap_has_no_items');
 for(const [key,pattern] of Object.entries({
  phases:/\bphases?\b/i,milestones:/\bmilestones?\b/i,
  features:/\bfeatures?\b/i,subtasks:/\bsubtasks?\b/i
 }))if(!items.some(x=>pattern.test(x.text)))gaps.push('missing_'+key);
 const seen=new Map();
 for(const item of items){
  const emojis=identityEmoji(item.text);
  if(!emojis.length){gaps.push('missing_stable_item_emoji_line_'+item.line);continue;}
  if(seen.has(emojis[0]))gaps.push('duplicate_emoji_identity_lines_'+seen.get(emojis[0])+'_'+item.line);
  else seen.set(emojis[0],item.line);
 }
 const phase=headings.find(x=>/\bphases?\b/i.test(x.text));
 const milestone=headings.find(x=>/\bmilestones?\b/i.test(x.text));
 if(phase&&milestone&&phase.level>=milestone.level)gaps.push('milestones_not_nested_below_phase');
 const subtasks=headings.find(x=>/\bsubtasks?\b/i.test(x.text));
 if(subtasks){
  const next=headings.find(x=>x.line>subtasks.line&&x.level<=subtasks.level);
  if(!items.some(x=>x.kind==='item'&&x.line>subtasks.line&&(!next||x.line<next.line)))
   gaps.push('subtask_section_has_no_tasks');
 }
 return {ok:gaps.length===0,gaps,item_count:items.length,distinct_identifying_emojis:seen.size};
}
if(require.main===module){
 const content=process.argv.length===3?readFileSync(process.argv[2],'utf8'):readFileSync(0,'utf8');
 const result=validateRoadmap(content);
 if(!result.ok){
  process.stderr.write('NOMOS_RULE_GATE NOM-0010: roadmap structure incomplete: '+result.gaps.join(', ')+'\n');
  process.exitCode=1;
 }
}
module.exports={validateRoadmap};
