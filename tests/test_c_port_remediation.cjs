'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {check}=require('../tools/validate_c_port_remediation.cjs');
test('C-to-Rust source atoms and profile selections have independently checked provenance',()=>{
 assert.deepEqual(check(),{new_rules:23,new_situations:10,new_intents:14,full_rules:121,lite_rules:61,shared_rules:5});
});
