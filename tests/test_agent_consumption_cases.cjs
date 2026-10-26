'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fixture=require('./fixtures/agent-consumption-cases.json');
const catalog=require('../docs/catalog.json');
const hierarchy=require('../taxonomy/project-types.json');
const {decide,sourceFingerprint}=require('../tools/projections.cjs');
const {compile,verifyPackage}=require('../tools/agent_package.cjs');

const bindings=Object.fromEntries(Object.entries(fixture.feature_bindings).map(([id,key])=>{
 const rule=catalog.rules.find(r=>r.id===id);
 assert.ok(rule&&rule.status==='published',id);
 return [id,{
  reviewed:true,source_sha256:sourceFingerprint(rule),
  features:[{key,required:'yes'}],covers_all_clauses:false
 }];
}));
test('case corpus only uses published selected source rules and non-activating previews',()=>{
 assert.equal(fixture.kind,'agent_consumption_synthetic_acceptance_cases');
 for(const item of fixture.cases){
  const ids=item.selection||fixture.selection;
  for(const id of ids)assert.ok(catalog.rules.some(r=>r.id===id&&r.status==='published'),id);
  assert.ok(item.expected_decisions);
  assert.ok(item.context.types_exhaustive===true||item.context.types_exhaustive===false);
 }
});
for(const item of fixture.cases){
 test('inert projection: '+item.id,()=>{
  const ids=item.selection||fixture.selection;
  const args={catalog,hierarchy,selection:{type:'rules',rule_ids:ids},
    context:item.context,bindings};
  const projection=decide(args);
  assert.equal(projection.status,'preview');
  assert.equal(projection.approval.source_selection_confirmed,false);
  assert.deepEqual(projection,decide(args));
  const expected=Object.entries(item.expected_decisions);
  for(const [id,decision] of expected){
   const actual=projection.decisions.find(d=>d.rule_id===id);
   assert.ok(actual,'missing source rule '+id);
   assert.equal(actual.decision,decision,id);
  }
  assert.deepEqual(projection.source.rule_ids,[...ids].sort());
  assert.throws(()=>compile(projection,catalog),/unapproved/);
  if(item.id==='RUST-UNKNOWN'){
   assert.equal(projection.blockers.length>0,true);
  }
  if(item.id==='RUST-MIXED'){
   assert.ok(projection.context.project_types.includes('tarium_project'));
   assert.ok(projection.context.project_types.includes('rust_project_from_scratch'));
  }
 });
}
test('adversarial source mutation refuses replayed projection, does not rewrite preview',()=>{
 const item=fixture.cases[0],selection={type:'rules',rule_ids:fixture.selection};
 const preview=decide({catalog,hierarchy,selection,context:item.context,bindings});
 const changed=structuredClone(catalog);
 changed.rules.find(r=>r.id==='NOM-0234').statement+=' synthetic tamper';
 assert.notEqual(
  decide({catalog:changed,hierarchy,selection,context:item.context,bindings:{...bindings,
   'NOM-0234':{...bindings['NOM-0234'],source_sha256:
    sourceFingerprint(changed.rules.find(r=>r.id==='NOM-0234'))}}}).source.digest_sha256,
  preview.source.digest_sha256
 );
 assert.equal(preview.status,'preview');
});
test('unknown answers do not become affirmative feature matches',()=>{
 for(const item of fixture.cases.filter(x=>x.id==='RUST-CLI'||x.id==='RUST-GUI')){
  const p=decide({catalog,hierarchy,selection:{type:'rules',rule_ids:fixture.selection},
   context:item.context,bindings});
  for(const [id,feature] of Object.entries(fixture.feature_bindings)){
   if(item.context.features[feature]==='unknown'){
    const d=p.decisions.find(x=>x.rule_id===id);
    assert.ok(d.decision==='conditional'||d.decision==='unresolved');
    assert.notEqual(d.decision,'include');
   }
  }
 }
});
