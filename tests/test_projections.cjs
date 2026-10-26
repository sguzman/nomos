'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const catalog=require('../docs/catalog.json');
const hierarchy=require('../taxonomy/project-types.json');
const {decide,sha,sourceFingerprint}=require('../tools/projections.cjs');
const base=()=>({
  kind:'project_context',version:'1.0.0',
  project_types:['rust_project_from_scratch'],types_exhaustive:true,
  phase:'implementation',axes:{actor:'ai_agents'},features:{gui:'no',persistence:'unknown'}
});
const preview=()=>decide({catalog,hierarchy,selection:{type:'profile',profile_id:'PROFILE-0004'},context:base()});
const approved={source_selection_confirmed:true,project_context_reviewed:true,projection_confirmed:true};
test('new-Rust profile remains inert as a preview with all 106 canonical members',()=>{
  const p=preview(), source=catalog.profiles.find(x=>x.id==='PROFILE-0004');
  assert.equal(p.status,'preview');
  assert.equal(p.decisions.length,106);
  assert.deepEqual(p.source.rule_ids,[...source.selected_rule_ids].sort());
  assert.equal(p.source.profile_version,source.version);
  assert.ok(p.decisions.every(d=>/^[a-f0-9]{64}$/.test(d.source_sha256)));
});
test('draft profile approval is rejected even if the caller asserts all approval flags',()=>{
  assert.throws(()=>decide({catalog,hierarchy,selection:{type:'profile',profile_id:'PROFILE-0004'},
    context:base(),approval:approved}),/draft profile/);
});
test('same pinned source and project facts deterministically reproduce an identical preview',()=>{
  assert.deepEqual(preview(),preview());
  assert.equal(sha({a:1}),sha({a:1}));
});
test('ad hoc approved selection uses only exact canonical published IDs',()=>{
  const p=decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0008','NOM-0015']},
    context:base(),approval:approved});
  assert.equal(p.status,'approved');
  assert.deepEqual(p.decisions.map(d=>d.rule_id),['NOM-0008','NOM-0015']);
  assert.ok(p.decisions.every(d=>['include','conditional'].includes(d.decision)));
  // Approval of a chosen selection is not proof every original condition is true.
  assert.ok(p.decisions.some(d=>d.decision==='conditional'));
  assert.equal(p.blockers.length,0);
});
test('unpublished and unknown rules can never enter a projection',()=>{
  for(const ids of [['NOM-0002'],['NOM-9999'],['NOM-0008','NOM-0008']]) {
    assert.throws(()=>decide({catalog,hierarchy,selection:{type:'rules',rule_ids:ids},context:base()}));
  }
});
test('unmapped natural-language conditions remain conditional and cannot be inferred from situations',()=>{
  const p=decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0234']},context:base()});
  assert.equal(p.decisions[0].decision,'conditional');
  assert.ok(p.decisions[0].situation_ids.includes('SITU-0088'));
  assert.ok(!p.source.rule_ids.includes('NOM-0008'));
});
test('reviewed typed feature mapping respects negative and unknown answers',()=>{
  const rule=catalog.rules.find(x=>x.id==='NOM-0234');
  const bindings={'NOM-0234':{reviewed:true,source_sha256:sourceFingerprint(rule),
    features:[{key:'gui',required:'yes'}],covers_all_clauses:true}};
  const f=ctx=>decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0234']},
    context:ctx,bindings}).decisions[0].decision;
  assert.equal(f(base()),'exclude');
  const unknown=base();unknown.features.gui='unknown';
  assert.equal(f(unknown),'conditional');
  const yes=base();yes.features.gui='yes';
  assert.equal(f(yes),'include');
  const stale={'NOM-0234':{...bindings['NOM-0234'],source_sha256:'0'.repeat(64)}};
  assert.throws(()=>decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0234']},
    context:yes,bindings:stale}),/Stale/);
});
test('explicit non-overlapping exhaustive types exclude feature-specific rules',()=>{
  const ctx=base();ctx.project_types=['rust_fork_maintenance'];
  const p=decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0234']},context:ctx});
  assert.equal(p.decisions[0].decision,'exclude');
});
test('unknown overlapping project facets remain unresolved, not assumed inapplicable',()=>{
  const ctx=base();ctx.types_exhaustive=false;
  const p=decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0111']},context:ctx});
  assert.equal(p.decisions[0].decision,'unresolved');
  assert.ok(p.blockers.length);
});
test('reject partial owner approval flags and unreviewed applicability mapping',()=>{
  assert.throws(()=>decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0008']},
    context:base(),approval:{source_selection_confirmed:true}}),/Partial/);
  const r=catalog.rules.find(x=>x.id==='NOM-0234');
  assert.throws(()=>decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0234']},
    context:base(),bindings:{'NOM-0234':{reviewed:false,source_sha256:sourceFingerprint(r)}}}),/Unreviewed/);
});
test('projection veto cannot silently remove a prohibition',()=>{
  const p=decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0001']},context:base(),
    overrides:[{rule_id:'NOM-0001',decision:'exclude',reason:'explicit opt-out'}]});
  assert.equal(p.decisions[0].decision,'blocked');
  assert.throws(()=>decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0001']},
    context:base(),approval:approved,overrides:[{rule_id:'NOM-0001',decision:'exclude',
      reason:'explicit opt-out'}]}),/blocked/);
});
test('resolver never mutates canonical catalog or profile data',()=>{
  const before=JSON.stringify(catalog.profiles.find(x=>x.id==='PROFILE-0004'));
  preview();
  assert.equal(JSON.stringify(catalog.profiles.find(x=>x.id==='PROFILE-0004')),before);
});

test('canonical fingerprint ignores website-only annotations but captures rule mutations',()=>{
  const r=catalog.rules.find(x=>x.id==='NOM-0008');
  const canonical=JSON.parse(JSON.stringify(r));
  delete canonical.registry; delete canonical.situational_analysis;
  assert.equal(sourceFingerprint(r),sha(canonical));
  assert.equal(sourceFingerprint({...r,situational_analysis:{changed:true}}),sourceFingerprint(r));
  assert.notEqual(sourceFingerprint({...r,statement:r.statement+' altered'}),sourceFingerprint(r));
});
test('unknown fields and unrecognized project types do not become implicit permissions',()=>{
  const context=base();context.project_types=['future_unknown_type'];
  assert.throws(()=>decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0008']},
    context}),/Unknown project type/);
  const malformed=base();malformed.features.gui='maybe';
  assert.throws(()=>decide({catalog,hierarchy,selection:{type:'rules',rule_ids:['NOM-0008']},
    context:malformed}),/feature answers/);
});
