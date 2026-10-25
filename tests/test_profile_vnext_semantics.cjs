'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {check}=require('../tools/validate_profile_vnext_semantics.cjs');
test('each revised profile classifies all 97 situations and 139 intents without implied activation',()=>{
 const result=check();assert.deepEqual(result.catalog,{rules:243,situations:97,intents:139});
 assert.equal(result.summaries.length,12);
 for(const x of result.summaries){
  assert.equal(result.matrix[x.id].situations.length,97);
  assert.equal(result.matrix[x.id].intents.length,139);
  assert.equal(x.situations+x.situations_available_not_selected+x.situations_context_only,97);
  assert.equal(x.intents+x.intents_available_not_selected+x.intents_context_only,139);
 }
});
