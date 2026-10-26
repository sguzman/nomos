'use strict';
/* Mechanical checks for independently captured agent-run evidence.
   Never infer that a model read, understood or followed a rule from prose alone. */
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const SHA=/^[a-f0-9]{64}$/;
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
function guard(c,m){if(!c)throw new Error(m);}
function unique(arr){return new Set(arr).size===arr.length;}
function validate(report,manifest){
 guard(report?.kind==='nomos_agent_run_evidence'&&report.schema_version===1,
   'Unsupported agent evidence schema');
 guard(manifest?.kind==='nomos_agent_package'&&manifest.schema_version===1,
   'Unsupported package manifest');
 guard(report.projection_sha256===manifest.projection_sha256&&
   report.registry_revision_sha256===manifest.registry_revision_sha256,
   'Run evidence does not match the pinned package');
 guard(['codex','generic'].includes(report.agent_target)&&
   report.agent_target===manifest.agent_target,'Agent target mismatch');
 guard(Array.isArray(report.expected_phases)&&report.expected_phases.length>0&&
   unique(report.expected_phases)&&report.expected_phases.every(p=>
     Object.hasOwn(manifest.phase_routes,p)),'Expected phases must be supported and distinct');
 guard(Array.isArray(report.events)&&Array.isArray(report.rule_assessments),
   'Observable events and per-rule assessments are required');
 const eventIds=report.events.map(e=>e.id);
 guard(unique(eventIds)&&eventIds.every(id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(id)),
   'Event IDs must be distinct stable identifiers');
 const events=new Map(report.events.map(e=>[e.id,e]));
 const violations=[],gaps=[];
 for(const event of report.events){
  guard(['module_read','build','test','ci','commit','review'].includes(event.kind),
    'Unknown evidence event kind: '+event.kind);
  guard(Number.isInteger(event.exit_code)&&event.exit_code>=0&&event.exit_code<=255,
    'Observed tool exit status required for '+event.id);
  guard(SHA.test(event.output_sha256||''),'Observed tool output SHA-256 required for '+event.id);
  guard(event.source==='tool_trace','Event must come from a tool trace, not an agent assertion');
  if(event.kind==='module_read'){
   const receipt=event.receipt;
   guard(receipt?.kind==='nomos_phase_read_receipt'&&receipt.schema_version===1&&
     receipt.package_verified===true,'Module read must include verified phase reader receipt');
   guard(receipt.projection_sha256===manifest.projection_sha256&&
     receipt.registry_revision_sha256===manifest.registry_revision_sha256&&
     receipt.agent_target===manifest.agent_target,'Module read receipt source mismatch');
   guard(Object.hasOwn(manifest.phase_routes,receipt.phase),
     'Unknown phase in module read receipt');
   const expected=manifest.phase_routes[receipt.phase];
   guard(Array.isArray(receipt.modules)&&unique(receipt.modules.map(m=>m.relative_path)),
     'Missing or duplicate module read receipt paths');
   guard(receipt.modules.length===expected.length&&
     receipt.modules.every((m,i)=>m.relative_path===expected[i]&&
       m.sha256===manifest.files[m.relative_path]&&Number.isInteger(m.bytes)&&m.bytes>=0),
     'Phase read receipt does not cover exact source modules');
  }
 }
 for(const phase of report.expected_phases){
  const observed=report.events.some(e=>e.kind==='module_read'&&e.receipt.phase===phase&&e.exit_code===0);
  if(!observed)gaps.push('No observed verified module read for required phase '+phase);
 }
 const active=new Set(Object.keys(manifest.rules));
 const assessments=new Map();
 for(const item of report.rule_assessments){
  guard(item&&active.has(item.rule_id)&&!assessments.has(item.rule_id),
    'Unknown or duplicate assessed rule '+item?.rule_id);
  guard(['satisfied','violated','not_applicable','unobserved'].includes(item.disposition),
    'Unknown rule disposition '+item.rule_id);
  guard(Array.isArray(item.evidence_event_ids)&&unique(item.evidence_event_ids)&&
    item.evidence_event_ids.every(id=>events.has(id)),
    'Unbacked evidence references for '+item.rule_id);
  if(item.disposition==='satisfied'){
   // A model's statement, module read, or synthetic fixture is not proof of completion.
   if(!item.evidence_event_ids.some(id=>events.get(id).kind!=='module_read'&&
     events.get(id).exit_code===0))
     gaps.push('No successful action evidence for claimed satisfied rule '+item.rule_id);
  }
  if(item.disposition==='violated')violations.push(item.rule_id);
  if(item.disposition==='unobserved')gaps.push('Unobserved rule '+item.rule_id);
  assessments.set(item.rule_id,item);
 }
 for(const id of active)if(!assessments.has(id))gaps.push('Missing rule assessment '+id);
 // This is a readiness-to-review classification only, never a production pass verdict.
 return {kind:'nomos_evidence_mechanical_assessment',schema_version:1,
  status:violations.length?'requires_remediation':gaps.length?'incomplete':'ready_for_independent_review',
  observed_events:report.events.length,expected_phases:report.expected_phases,
  covered_rules:assessments.size,required_rules:active.size,
  violations,gaps,agent_compliance_proven:false,
  warning:'Metadata integrity and recorded tool events are not independent behavioral acceptance.'};
}
if(require.main===module){
 try{
  const [evidencePath,manifestPath,...extra]=process.argv.slice(2);
  guard(evidencePath&&manifestPath&&!extra.length,
    'Usage: node tools/validate_agent_run_evidence.cjs <local-evidence.json> <local-manifest.json>');
  const result=validate(JSON.parse(fs.readFileSync(evidencePath,'utf8')),
    JSON.parse(fs.readFileSync(manifestPath,'utf8')));
  console.log(JSON.stringify(result,null,2));
  if(result.status!=='ready_for_independent_review')process.exitCode=1;
 }catch(error){console.error('Nomos evidence rejected:',error.message);process.exitCode=1;}
}
module.exports={validate,hash};
