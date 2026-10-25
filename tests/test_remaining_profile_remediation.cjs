'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {check}=require('../tools/validate_remaining_profile_remediation.cjs');
test('Remaining profile rule sources and independent consent scopes are verified',()=>{
 assert.deepEqual(check(),{new_rules:8,new_situations:8,new_intents:8,fork_lite:43,fork_full:102,tarium_lite:36,tarium_full:76});
});
