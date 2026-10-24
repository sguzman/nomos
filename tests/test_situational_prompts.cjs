'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const ns=require('../docs/situational-prompts.js');
const sample={id:'SIT-0001',summary:'An example of a public-safe trigger',
  status:'draft',text:'Sample instruction',situation:{code:'normal_continuation',trigger:'When the operator requests another pass',purpose:'Advance a selected task'},
  intent:{operation:'continue',outcome:'Advance selected work'},
  applicability:{appropriate_when:['Explicitly selected work'],not_appropriate_when:['Diagnostic-only requests'],preconditions:[]},
  execution:{mode:'sustained_execution',objective:'Perform the approved work',handoff:'after_available_work',progress_evidence:true},
  failure_modes:{guards_against:['Premature handoff'],tradeoffs:['May require extended execution']},
  interaction:{invocation:'explicit_only',target:'chatgpt'},
  governance:{review_status:'pending'}};
test('empty registry is valid and shows no results',()=>assert.deepEqual(ns.search([],''),[]));
test('display labels are derived from situation and execution metadata',()=>{
  assert.equal(ns.displayLabel(sample),'Normal Continuation · Sustained Execution');
  assert.equal(ns.displayLabel({...sample,title:'Do not use me'}),'Normal Continuation · Sustained Execution');
});
test('eight independently normalized records omit personal names and remain read only',()=>{
  for(let i=1;i<=8;i++){
    const p=require('../situational-prompts/SIT-'+String(i).padStart(4,'0')+'.json');
    assert.equal(p.status,'reviewed');
    assert.equal(p.governance.review_status,'reviewed');
    assert.equal(ns.copyAllowed(p),false);
    assert.equal(Object.hasOwn(p,'title'),false);
    assert.equal(Object.hasOwn(p,'source_label'),false);
    assert.ok(p.intent.outcome && p.applicability.appropriate_when.length);
  }
  const reinforced=require('../situational-prompts/SIT-0006.json');
  assert.equal(reinforced.execution.mode,'reinforcement_only');
  assert.equal(reinforced.execution.handoff,'no_execution_requested');
});
test('search by trigger, exclusion, hazard, and mode',()=>{
  assert.equal(ns.search([sample],'operator').length,1);
  assert.equal(ns.search([sample],'Diagnostic-only').length,1);
  assert.equal(ns.search([sample],'premature').length,1);
  assert.equal(ns.search([sample],'irrelevant').length,0);
  assert.equal(ns.search([sample],'','diagnosis_only').length,0);
});
test('copy is unavailable without both publication and approval',()=>{
  assert.equal(ns.copyAllowed(sample),false);
  assert.equal(ns.copyAllowed({...sample,status:'published'}),false);
  assert.equal(ns.copyAllowed({...sample,status:'published',governance:{review_status:'approved'}}),true);
});
test('public output is standalone and never modifies rule composition',()=>{
  const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'../docs/situational-prompts.html'),'utf8');
  assert.match(html,/id="situational-list"/);
  assert.match(html,/situational-prompts.js/);
  assert.doesNotMatch(html,/id="selection-list"/);
});
