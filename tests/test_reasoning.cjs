'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const cmp=require('../docs/reasoning.js');
function rule(id,kind,op,value,strength='not_applicable'){
  const constraint={field:'package.edition',operator:op};
  if(op==='equals')constraint.value=value;
  return {id,norm:{kind,permission_strength:strength,
    predicate:{action:'set',object:'rust_edition',target:'cargo_manifest'},
    value_constraint:constraint},scope:{axes:{channel:['any'],visibility:['any'],artifact_kind:['any'],actor:['any']}},
    categories:{domains:['rust_development']}};
}
const latest=rule('LATEST','obligation','latest_stable_supported');
const fixed=rule('FIXED','obligation','equals','2024');
test('equal current value is only a conditional future interaction',()=>{
 assert.equal(cmp.assess(latest,fixed,{latest_stable_supported_edition:'2024'}),'conditional');
});
test('new edition makes two mandatory choices incompatible',()=>{
 assert.equal(cmp.assess(latest,fixed,{latest_stable_supported_edition:'2027'}),'conflict');
});
test('unknown supported edition stays conditional',()=>assert.equal(cmp.assess(latest,fixed),'conditional'));
test('weak permission cannot defeat obligation',()=>{
 assert.notEqual(cmp.assess(latest,rule('P','permission','equals','2024','weak'),{latest_stable_supported_edition:'2027'}),'conflict');
});
test('strong permission is a conflict candidate',()=>{
 assert.equal(cmp.assess(latest,rule('P','permission','equals','2024','strong'),{latest_stable_supported_edition:'2027'}),'conflict');
});
test('disjoint visibility scopes prevent false conflicts',()=>{
 const a=rule('A','obligation','equals','2024');
 const b=rule('B','obligation','equals','2027');
 a.scope.axes.visibility=['public'];b.scope.axes.visibility=['private'];
 assert.equal(cmp.assess(a,b),'disjoint');
});
