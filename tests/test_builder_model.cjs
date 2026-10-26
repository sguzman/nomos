'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const model=require('../docs/builder-model.js');
const catalog=require('../docs/catalog.json');
test('every source-backed question points to one existing published Rust rule',()=>{
 const seen=new Set();
 for(const q of model.questions){
  assert.ok(!seen.has(q.id));seen.add(q.id);
  const rule=catalog.rules.find(r=>r.id===q.rule_id);
  assert.equal(rule.status,'published');
  assert.ok(rule.statement.includes(q.source_phrase));
 }
});
test('Lite and Full families refer to existing distinct provisional profiles',()=>{
 for(const family of model.families){
  const lite=catalog.profiles.find(p=>p.id===family.lite);
  const full=catalog.profiles.find(p=>p.id===family.full);
  assert.ok(lite&&full);
  assert.ok(lite.selected_rule_ids.length<full.selected_rule_ids.length);
  const summary=model.describe({catalog,familyId:family.id,depth:'lite'});
  assert.equal(summary.can_export,false);
  assert.equal(summary.selection_confirmed,false);
 }
});
test('yes no unknown never activate provisional Rust rule selections',()=>{
 for(const answer of ['yes','no','unknown','not_applicable']){
  const x=model.describe({catalog,familyId:'new-rust',depth:'full',values:{gui:answer}});
  assert.equal(x.total_selected_rules,106);
  assert.equal(x.can_export,false);
  const item=x.suggestions.find(q=>q.question_id==='gui');
  assert.equal(item.answer,answer);
  assert.equal(item.already_selected,true);
  assert.equal(item.rule_id,'NOM-0234');
 }
});
test('Lite can suggest review of rules it does not currently contain without adding them',()=>{
 const p=model.describe({catalog,familyId:'new-rust',depth:'lite',values:{diagnostics:'yes'}});
 assert.equal(p.total_selected_rules,45);
 assert.equal(p.suggestions.find(x=>x.question_id==='diagnostics').already_selected,false);
 assert.match(p.suggestions.find(x=>x.question_id==='diagnostics').interpretation,/Potential/);
});
test('unsupported family answers, forged question IDs and source drift fail closed',()=>{
 assert.throws(()=>model.describe({catalog,familyId:'bad',depth:'full'}),/supported/);
 assert.throws(()=>model.describe({catalog,familyId:'new-rust',depth:'full',values:{fake:'yes'}}),/Unsupported/);
 assert.throws(()=>model.describe({catalog,familyId:'new-rust',depth:'full',values:{gui:'maybe'}}),/Unsupported/);
 const copy=structuredClone(catalog);
 copy.rules.find(x=>x.id==='NOM-0234').statement='Unrelated synthetic statement';
 assert.throws(()=>model.describe({catalog:copy,familyId:'new-rust',depth:'full'}),/evidence changed/);
});
test('unrelated project families do not receive unverified Rust feature questions',()=>{
 assert.deepEqual(model.availableQuestions('c-port'),[]);
 assert.deepEqual(model.describe({catalog,familyId:'c-port',depth:'lite'}).suggestions,[]);
});
test('builder preview never mutates canonical profile memberships',()=>{
 const existing=catalog.profiles.find(x=>x.id==='PROFILE-0004');
 const before=JSON.stringify(existing);
 model.describe({catalog,familyId:'new-rust',depth:'full',values:{gui:'no'}});
 assert.equal(JSON.stringify(existing),before);
});
