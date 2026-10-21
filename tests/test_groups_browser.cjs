'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expand}=require('../docs/groups.js');
const mk=(id,children=[],members=[])=>
 ({id,member_rule_ids:members,child_group_ids:children,composition:{include_descendants:true}});
const rules=Array.from({length:4},(_,i)=>({id:'NOM-'+i,status:'published',registry:'catalog'}));
test('recursive add-all deduplicates a rule referenced twice',()=>{
const groups=[mk('G1',['G2','G3'],['NOM-0']),mk('G2',[],['NOM-0','NOM-1']),mk('G3',[],['NOM-1','NOM-2'])];
assert.deepEqual(expand('G1',groups,rules),['NOM-0','NOM-1','NOM-2']);
});
test('unpublished members are excluded from add-all',()=>{
const groups=[mk('G',[],['NOM-0','NOM-3'])];
const entries=rules.map(x=>({...x}));entries[3].status='draft';
assert.deepEqual(expand('G',groups,entries),['NOM-0']);
});
test('cycles and missing groups are detected',()=>{
const groups=[mk('A',['B']),mk('B',['A'])];
assert.throws(()=>expand('A',groups,rules),/Circular/);
assert.throws(()=>expand('Z',groups,rules),/Unknown/);
});
test('empty and independently listed groups do not invent rules',()=>{
assert.deepEqual(expand('A',[mk('A')],rules),[]);
});
