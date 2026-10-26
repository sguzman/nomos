'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {run,CASES}=require('../tools/run_luna_acceptance_suite.cjs');
test('all three acceptance cases plan without invoking Luna and preserve unresolved verdict',()=>{
 const result=run([]);
 assert.equal(result.case_count,3);
 assert.deepEqual(result.cases.map(c=>c.case_id),CASES);
 assert.equal(result.all_cases_prepared,true);
 assert.equal(result.execution_explicitly_requested,false);
 assert.equal(result.actual_model_runs,0);
 assert.equal(result.independently_accepted_runs,0);
 assert.equal(result.production_accepted,false);
 assert.ok(result.cases.every(c=>c.report?.status==='planning_only'));
});
test('an unsupported flag cannot switch the suite to execution',()=>{
 assert.throws(()=>run(['--yolo']),/Usage/);
 assert.throws(()=>run(['--model']),/Usage/);
 assert.throws(()=>run(['--model','../../unknown']),/Usage|Invalid model selector/);
});
