'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {check}=require('../tools/validate_new_rust_project_remediation.cjs');
test('13 reviewed new Rust project obligations retain verified source provenance',()=>{
 assert.deepEqual(check(),{new_rules:13,new_situations:9,new_intents:13,lite_rules:45,full_rules:106});
});
