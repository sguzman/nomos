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

test('no real presets have been invented before user chooses one', () => {
  const filenames = fs.readdirSync(path.resolve(__dirname, '../profiles'));
  assert.deepEqual(filenames.filter(f => /^PROFILE-.*\.json$/.test(f)), []);
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
