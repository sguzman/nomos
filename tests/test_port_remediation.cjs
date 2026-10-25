'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {check}=require('../tools/validate_port_remediation.cjs');
const m=require('../audits/strict-port-remediation-manifest-2026-10-25.json');
test('published rules and linked sources preserve provenance and consent',()=>{
 assert.deepEqual(check(),{new_rules:38,new_situations:12,new_intents:17,python_lite_rules:56,python_full_rules:128});
});
test('general and language-specific atoms remain independently scoped',()=>{
 assert.equal(m.records.filter(x=>x.scope==='software_port').length,8);
 assert.equal(m.records.filter(x=>x.scope==='python_to_rust_port').length,30);
 assert.equal(m.python_full_added_rule_ids.length,38);
 assert.equal(m.python_lite_added_rule_ids.length,17);
});
