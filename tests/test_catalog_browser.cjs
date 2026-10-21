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
  assert.ok(results.every((x, i) => i === 0 ||
    results[i - 1].value.title.localeCompare(x.value.title, undefined, { sensitivity: 'base' }) <= 0));
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
