'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
global.NomosGroups = require('../docs/groups.js');
const { search } = require('../docs/catalog-browser.js');
const { hueForId } = require('../docs/rule-colors.js');
const catalog = require('../docs/catalog.json');
const args = { rules: catalog.rules, groups: catalog.groups };

test('unified catalog shows all 67 rules and all eight groups', () => {
  const results = search(args);
  assert.equal(results.length, 75);
  assert.equal(results.filter(x => x.kind === 'rule').length, 67);
  assert.equal(results.filter(x => x.kind === 'group').length, 8);
  assert.deepEqual(results.slice(0, 8).map(x => x.value.id),
    Array.from({ length: 8 }, (_, i) => 'GROUP-' + String(i + 1).padStart(4, '0')));
  assert.equal(results[8].value.id, 'NOM-0001');
});
test('entity type selector filters one shared catalog', () => {
  assert.equal(search({ ...args, type: 'groups' }).length, 8);
  assert.equal(search({ ...args, type: 'rules' }).length, 67);
});
test('one search field finds a group and its atomic member rules', () => {
  const found = search({ ...args, query: 'Rust Quality' });
  assert.ok(found.some(x => x.kind === 'group' && x.value.id === 'GROUP-0003'));
  assert.ok(found.some(x => x.kind === 'rule' && x.value.id === 'NOM-0024'));
  assert.ok(found.every(x => x.kind === 'group' || x.kind === 'rule'));
});
test('status and shared domain/label filters apply to both entity types', () => {
  assert.equal(search({ ...args, type: 'groups', status: 'draft' }).length, 0);
  assert.equal(search({ ...args, type: 'rules', status: 'draft' }).length, 1);
  const rust = search({ ...args, domain: 'rust_quality' });
  assert.equal(rust.filter(x => x.kind === 'group').length, 1);
  assert.equal(rust.filter(x => x.kind === 'rule').length, 10);
});
test('Browse members uses shared filtered catalog and excludes groups', () => {
  const hits = search({ ...args, type: 'rules', groupFilter: 'GROUP-0001' });
  assert.equal(hits.length, 54);
  assert.ok(hits.every(x => x.kind === 'rule'));
  assert.equal(new Set(hits.map(x => x.value.id)).size, 54);
});
test('all group IDs generate distinct stable OKLCH hues', () => {
  const hues = catalog.groups.map(g => hueForId(g.id));
  assert.equal(new Set(hues).size, 8);
  for (let i=0;i<hues.length;i++) {
    assert.equal(hueForId(catalog.groups[i].id), hues[i]);
    assert.equal(hues[i], catalog.groups[i].color.hue_degrees);
  }
});

test('rules-first reverses type precedence with stable IDs inside each type', () => {
  const results = search({ ...args, sort: 'rules-first' });
  assert.equal(results[0].value.id, 'NOM-0001');
  assert.equal(results[66].value.id, 'NOM-0067');
  assert.equal(results[67].value.id, 'GROUP-0001');
  assert.equal(results.at(-1).value.id, 'GROUP-0008');
});
test('name and ID sort directions work on the combined results', () => {
  const asc = search({ ...args, sort: 'name-asc' });
  const desc = search({ ...args, sort: 'name-desc' });
  assert.deepEqual(asc.map(x=>x.value.id), desc.map(x=>x.value.id).reverse());
  for (let i=1; i<asc.length; i++) {
    assert.ok(asc[i-1].value.title.localeCompare(asc[i].value.title, undefined, { sensitivity:'base' }) <= 0);
  }
  const idsAsc = search({ ...args, sort: 'id-asc' }).map(x=>x.value.id);
  const idsDesc = search({ ...args, sort: 'id-desc' }).map(x=>x.value.id);
  assert.deepEqual(idsAsc, idsDesc.reverse());
  assert.equal(idsAsc[0], 'GROUP-0001');
});
test('group size sorts by expanded published member count, not proposal order', () => {
  const large = search({ ...args, sort: 'members-desc' }).filter(x=>x.kind==='group');
  const small = search({ ...args, sort: 'members-asc' }).filter(x=>x.kind==='group');
  const size = x=>NomosGroups.expand(x.value.id, catalog.groups, catalog.rules).length;
  assert.equal(large[0].value.id, 'GROUP-0001');
  assert.equal(small[0].value.id, 'GROUP-0006');
  for (let i=1;i<large.length;i++) assert.ok(size(large[i-1])>=size(large[i]));
  for (let i=1;i<small.length;i++) assert.ok(size(small[i-1])<=size(small[i]));
  assert.equal(search({ ...args, sort:'members-desc' }).at(-1).kind, 'rule');
});
test('sorting preserves filtering and group member browsing', () => {
  const selected = search({ ...args, groupFilter:'GROUP-0003', type:'rules', sort:'id-desc' });
  assert.equal(selected.length, 10);
  assert.equal(selected[0].value.id, 'NOM-0033');
  assert.equal(selected.at(-1).value.id, 'NOM-0024');
  const onlyGroups = search({ ...args, type:'groups', query:'quality', sort:'name-asc' });
  assert.ok(onlyGroups.length > 0 && onlyGroups.every(x=>x.kind==='group'));
  assert.deepEqual(search({ ...args, type:'groups', query:'quality', sort:'name-asc' }).map(x=>x.value.id),
    onlyGroups.map(x=>x.value.id));
});
test('unknown sort mode falls back deterministically to the default', () => {
  assert.deepEqual(search({ ...args, sort:'invalid' }).map(x=>x.value.id),
    search(args).map(x=>x.value.id));
});
