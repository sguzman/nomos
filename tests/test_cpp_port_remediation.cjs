'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {check}=require('../tools/validate_cpp_port_remediation.cjs');
test('C++ atom normalization and independent approval evidence are complete',()=>{
 assert.deepEqual(check(),{new_cpp_rules:24,new_situations:10,new_intents:15,full_rules:122,lite_rules:58});
});
