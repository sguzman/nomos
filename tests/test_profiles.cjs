'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const profiles = require('../tools/profiles.js');
const catalog = require('../docs/catalog.json');
const schema = require('../schema/profile.schema.json');
const published = catalog.rules.filter(r => r.status === 'published' && r.registry === 'catalog');
const args = () => ({ id: 'PROFILE-0001', title: 'Synthetic QA preset',
  selectedRuleIds: ['NOM-0074','NOM-0075'], exportTargets: ['agents_md','chatgpt_custom_instructions'],
  date: '2026-10-21' });
const draft = () => profiles.instantiate(args(), published, { selectionConfirmed: true });

test('schema defines an independent optional profile type, not a virtual group', () => {
  assert.equal(schema.properties.kind.const, 'rule_profile');
  assert.deepEqual(schema.properties.status.enum, ['draft','finalized','deprecated']);
  assert.ok(schema.required.includes('selected_rule_ids'));
  assert.ok(schema.required.includes('review'));
  assert.equal(schema.additionalProperties, false);
});

test('authorized C-to-Rust profiles are independently editable drafts with privacy', () => {
  const folder=path.resolve(__dirname,'../profiles');
  const filenames=fs.readdirSync(folder).filter(f=>/^PROFILE-.*\.json$/.test(f)).sort();
  assert.deepEqual(filenames,Array.from({length:12},(_,i)=>'PROFILE-'+String(i+1).padStart(4,'0')+'.json'));
  const original=filenames.slice(0,2);
  const [lite,full]=original.map(f=>JSON.parse(fs.readFileSync(path.join(folder,f),'utf8')));
  for(const profile of [lite,full]){
    assert.equal(profile.status,'draft');
    assert.equal(profile.review.selection_confirmed,false);
    assert.equal(profile.review.finalization_confirmed,false);
    assert.deepEqual(profiles.validate(profile,published).errors,[]);
    for(const id of ['NOM-0111','NOM-0112','NOM-0113','NOM-0001','NOM-0003','NOM-0004','NOM-0050','NOM-0051']) assert.ok(profile.selected_rule_ids.includes(id),id);
    assert.throws(()=>profiles.selectForUse(profile,published,{userSelected:true}),/finalized/);
  }
  assert.equal(lite.selected_rule_ids.length,64);
  assert.equal(full.selected_rule_ids.length,125);
  assert.ok(lite.selected_rule_ids.every(id=>full.selected_rule_ids.includes(id)));
  for(const id of ['NOM-0010','NOM-0068','NOM-0069','NOM-0070','NOM-0071','NOM-0072']) assert.ok(full.selected_rule_ids.includes(id),id);
});

test('discussion or suggestions cannot create a profile without selection confirmation', () => {
  assert.throws(() => profiles.instantiate(args(), published), /explicitly approve/);
  const p = draft();
  assert.equal(p.kind, 'rule_profile');
  assert.equal(p.status, 'draft');
  assert.equal(p.review.finalization_confirmed, false);
  assert.deepEqual(profiles.validate(p, published).errors, []);
});

test('draft rules may be added and removed, including temporarily clearing the selection', () => {
  const p = draft();
  const withRule = profiles.edit(p,{ add:'NOM-0076', date:'2026-10-22' },published);
  assert.deepEqual(withRule.selected_rule_ids, ['NOM-0074','NOM-0075','NOM-0076']);
  assert.deepEqual(p.selected_rule_ids, ['NOM-0074','NOM-0075']); // immutable updates
  const withoutRule = profiles.edit(withRule,{ remove:'NOM-0075',date:'2026-10-22' },published);
  assert.deepEqual(withoutRule.selected_rule_ids, ['NOM-0074','NOM-0076']);
  const repeated = profiles.edit(withoutRule,{ add:'NOM-0074',date:'2026-10-22' },published);
  assert.deepEqual(repeated.selected_rule_ids, ['NOM-0074','NOM-0076']);
  const empty = profiles.edit(profiles.edit(p,{remove:'NOM-0074',date:'2026-10-22'},published),
    {remove:'NOM-0075',date:'2026-10-22'},published);
  assert.equal(empty.selected_rule_ids.length,0);
  assert.throws(()=>profiles.finalize(empty,published,{finalizationConfirmed:true}),/requires rules/);
});

test('draft cannot be finalized without a separate explicit choice', () => {
  const p = draft();
  assert.throws(()=>profiles.finalize(p,published),/explicitly approve finalization/);
  const done = profiles.finalize(p,published,{finalizationConfirmed:true});
  assert.equal(done.status,'finalized');
  assert.equal(done.review.finalization_confirmed,true);
  assert.equal(p.status,'draft');
  assert.throws(()=>profiles.edit(done,{add:'NOM-0076',date:'2026-10-23'},published),/draft/);
});

test('finalized profiles do not auto-activate, render or export', () => {
  const done = profiles.finalize(draft(),published,{finalizationConfirmed:true});
  assert.throws(()=>profiles.selectForUse(done,published),/never applies or exports itself automatically/);
  assert.deepEqual(profiles.selectForUse(done,published,{userSelected:true}).map(r=>r.id),
    ['NOM-0074','NOM-0075']);
  assert.throws(()=>profiles.selectForUse(draft(),published,{userSelected:true}),/finalized/);
});

test('cannot select unknown, draft, candidate, duplicated, or unsupported rule IDs',()=>{
  assert.throws(()=>profiles.instantiate({...args(),selectedRuleIds:['NOM-9999']},published,
    {selectionConfirmed:true}),/not a published catalog entry/);
  assert.throws(()=>profiles.instantiate({...args(),selectedRuleIds:['NOM-0002']},catalog.rules,
    {selectionConfirmed:true}),/not a published catalog entry/);
  assert.throws(()=>profiles.instantiate({...args(),selectedRuleIds:['NOM-0074','NOM-0074']},published,
    {selectionConfirmed:true}),/Duplicate/);
  assert.throws(()=>profiles.instantiate({...args(),exportTargets:['unknown']},published,
    {selectionConfirmed:true}),/Invalid export targets/);
  assert.throws(()=>profiles.instantiate({...args(),id:'GROUP-0001'},published,
    {selectionConfirmed:true}),/Invalid profile ID/);
});

test('reviewing a preset surfaces conflicts, not automatic precedence', () => {
  const deny={...published.find(r=>r.id==='NOM-0001'),id:'NOM-8001'};
  const must={...deny,id:'NOM-8002',norm:{...deny.norm,kind:'obligation'}};
  const rules=[deny,must];
  const p=profiles.instantiate({...args(),selectedRuleIds:rules.map(r=>r.id)},rules,
    {selectionConfirmed:true});
  assert.equal(profiles.validate(p,rules).warnings.length,1);
  assert.throws(()=>profiles.finalize(p,rules,{finalizationConfirmed:true}),/Potential conflicts/);
});

test('schema status and confirmation constraints agree with runtime rules',()=>{
  const p=draft();
  const forged={...p,status:'finalized'};
  assert.ok(profiles.validate(forged,published).errors.some(e=>e.includes('Finalized')));
  const extra={...p,auto_apply:true};
  assert.ok(profiles.validate(extra,published).errors.length);
});

test('six explicitly authorized provisional drafts preserve unconfirmed selections',()=>{
  const paths=Array.from({length:6},(_,i)=>path.resolve(__dirname,'../profiles/PROFILE-'+String(i+3).padStart(4,'0')+'.json'));
  const drafts=paths.map(p=>JSON.parse(fs.readFileSync(p,'utf8')));
  const expected=[45,106,36,76,44,103];
  assert.deepEqual(drafts.map(p=>p.selected_rule_ids.length),expected);
  for(const p of drafts){
    assert.equal(p.status,'draft');
    assert.equal(p.review.selection_confirmed,false);
    assert.equal(p.review.finalization_confirmed,false);
    assert.deepEqual(profiles.validate(p,published).errors,[]);
    assert.ok(p.selected_rule_ids.every(id=>published.some(r=>r.id===id)));
    assert.throws(()=>profiles.selectForUse(p,published,{userSelected:true}),/finalized/);
    assert.throws(()=>profiles.finalize(p,published,{finalizationConfirmed:true}),/selection requires explicit owner review/);
    assert.ok(!p.selected_rule_ids.includes('NOM-0013')); // avoid competing fixed-versus-current edition rule
  }
  for(let i=0;i<drafts.length;i+=2){
    const lite=new Set(drafts[i].selected_rule_ids);
    const full=new Set(drafts[i+1].selected_rule_ids);
    assert.ok(lite.size<full.size);
    assert.ok([...lite].every(id=>full.has(id)));
  }
  for(const p of [drafts[0],drafts[1],drafts[4],drafts[5]])
    assert.ok(!p.selected_rule_ids.some(id=>['NOM-0074','NOM-0075','NOM-0076','NOM-0111','NOM-0112','NOM-0113'].includes(id)));
  for(const p of [drafts[2],drafts[3]])
    for(const id of ['NOM-0006','NOM-0007','NOM-0115','NOM-0116','NOM-0117','NOM-0118','NOM-0119','NOM-0120'])
      assert.ok(p.selected_rule_ids.includes(id),id);
});
test('unconfirmed draft can only be confirmed with explicit owner selection approval',()=>{
  const proposed=profiles.instantiate(args(),published,{draftAuthorized:true});
  assert.equal(proposed.review.selection_confirmed,false);
  assert.throws(()=>profiles.confirmSelection(proposed,published),/explicitly approve/);
  assert.throws(()=>profiles.finalize(proposed,published,{finalizationConfirmed:true}),/owner review/);
  const confirmed=profiles.confirmSelection(proposed,published,{selectionConfirmed:true});
  assert.equal(confirmed.review.selection_confirmed,true);
  assert.equal(proposed.review.selection_confirmed,false);
  assert.equal(confirmed.review.finalization_confirmed,false);
  assert.deepEqual(profiles.validate(confirmed,published).errors,[]);
});

test('C++ and Python provisional port drafts reuse neutral atoms without C-only atoms',()=>{
  const ids=['PROFILE-0009','PROFILE-0010','PROFILE-0011','PROFILE-0012'];
  const drafts=ids.map(id=>require('../profiles/'+id+'.json'));
  for(const p of drafts){
    assert.equal(p.status,'draft');
    assert.equal(p.review.selection_confirmed,false);
    assert.equal(p.review.finalization_confirmed,false);
    assert.deepEqual(profiles.validate(p,published).errors,[]);
    for(const cOnly of ['NOM-0111','NOM-0112','NOM-0113'])assert.ok(!p.selected_rule_ids.includes(cOnly));
    for(const general of ['NOM-0074','NOM-0075','NOM-0076'])assert.ok(p.selected_rule_ids.includes(general));
    assert.throws(()=>profiles.finalize(p,published,{finalizationConfirmed:true}),/owner review/);
  }
  for(let i=0;i<drafts.length;i+=2){const lite=new Set(drafts[i].selected_rule_ids), full=new Set(drafts[i+1].selected_rule_ids);
    assert.ok(lite.size<full.size);assert.ok([...lite].every(id=>full.has(id)));}
});
