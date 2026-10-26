'use strict';
/* Inspect authentic Codex --json command events. Text-only claims never pass acceptance. */
const crypto=require('node:crypto');
const {validate}=require('./validate_agent_run_evidence.cjs');
const digest=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const valid=(yes,message)=>{if(!yes)throw new Error(message);};
function observe(jsonl,manifest,requiredPhases=['planning','implementation','testing','shutdown']){
 valid(typeof jsonl==='string','Raw JSONL stream required');
 valid(manifest?.kind==='nomos_agent_package'&&manifest.agent_target==='codex',
  'Expected actual Codex-targeted package manifest');
 const events=[];
 for(const [i,line] of jsonl.split(/\r?\n/).entries()){
  if(!line.trim())continue;
  let record;
  try{record=JSON.parse(line);}catch(_){throw new Error('Invalid Codex JSONL at line '+(i+1));}
  if(record.type!=='item.completed'||record.item?.type!=='command_execution')continue;
  const item=record.item;
  const command=String(item.command||'');
  const stdout=String(item.aggregated_output||'');
  const code=item.exit_code;
  if(!Number.isInteger(code)||code<0||code>255)continue;
  const phaseMatch=command.match(/(?:^|\s|["'])node\s+\.nomos\/read-phase\.cjs\s+(planning|implementation|review|testing|ci|release|shutdown|maintenance)(?=\s|$|["'])/);
  let kind=null,receipt=null;
  if(phaseMatch){
    const recordLine=stdout.split(/\r?\n/).find(x=>x.startsWith('NOMOS_PHASE_READ '));
    if(recordLine&&code===0){
      try{receipt=JSON.parse(recordLine.slice('NOMOS_PHASE_READ '.length));}
      catch(_){throw new Error('Malformed actual phase read receipt at JSONL line '+(i+1));}
      valid(receipt.phase===phaseMatch[1],'Phase receipt and executed command differ');
      kind='module_read';
    }
  }
  if(!kind){
    if(/\bcargo\s+test\b/.test(command))kind='test';
    else if(/\bcargo\s+(build|check|clippy)\b/.test(command))kind='build';
    else if(/\bgit\s+commit\b/.test(command))kind='commit';
    else if(/\.github\/workflows|gh\s+run\b/.test(command))kind='ci';
    else kind='review';
  }
  events.push({id:'codex-command-'+(i+1),kind,source:'tool_trace',
    exit_code:code,output_sha256:digest(stdout),
    ...(receipt?{receipt}:{})});
 }
 const report={kind:'nomos_agent_run_evidence',schema_version:1,
  projection_sha256:manifest.projection_sha256,
  registry_revision_sha256:manifest.registry_revision_sha256,
  agent_target:'codex',expected_phases:[...requiredPhases],events,
  rule_assessments:Object.keys(manifest.rules).sort().map(rule_id=>({
    rule_id,disposition:'unobserved',evidence_event_ids:[]
  }))};
 const review=validate(report,manifest);
 valid(review.agent_compliance_proven===false,'Mechanical report cannot claim compliance');
 return {report,review,
  parser_summary:{recorded_commands:events.length,
   observed_module_reads:events.filter(x=>x.kind==='module_read').length,
   cargo_test_events:events.filter(x=>x.kind==='test').length,
   all_source_rules_unobserved:true,
   independent_reviewer_accepted:false}};
}
module.exports={observe};
