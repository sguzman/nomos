'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const ns=require('../docs/situational-prompts.js');
const sample={id:'SIT-0001',title:'Neutral sample',summary:'An example of a public-safe trigger',
  status:'draft',text:'Sample instruction',situation:{code:'normal_continuation',trigger:'When the operator requests another pass',purpose:'Advance a selected task'},
  applicability:{appropriate_when:['Explicitly selected work'],not_appropriate_when:['Diagnostic-only requests'],preconditions:[]},
  execution:{mode:'sustained_execution',objective:'Perform the approved work',handoff:'after_available_work',progress_evidence:true},
  failure_modes:{guards_against:['Premature handoff'],tradeoffs:['May require extended execution']},
  interaction:{invocation:'explicit_only',target:'chatgpt',shortcut_key:null},
  governance:{review_status:'pending'}};
test('empty registry is valid and shows no results',()=>assert.deepEqual(ns.search([],''),[]));
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
