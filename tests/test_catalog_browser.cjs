'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
global.NomosGroups = require('../docs/groups.js');
const { search } = require('../docs/catalog-browser.js');
const { hueForId } = require('../docs/rule-colors.js');
const catalog = require('../docs/catalog.json');
const args = { rules: catalog.rules, groups: catalog.groups, profiles: catalog.profiles };

test('unified catalog includes rules, groups, and independent profiles', () => {
  const results = search(args);
  assert.equal(results.length, catalog.rules.length + catalog.groups.length + catalog.profiles.length);
  assert.equal(results.filter(x => x.kind === 'rule').length, catalog.rules.length);
  assert.equal(results.filter(x => x.kind === 'group').length, 14);
  assert.equal(results.filter(x => x.kind === 'profile').length, 2);
  assert.deepEqual(results.slice(0, 14).map(x => x.value.id),
    Array.from({ length: 14 }, (_, i) => 'GROUP-' + String(i + 1).padStart(4, '0')));
  assert.deepEqual(results.slice(14,16).map(x=>x.value.id),['PROFILE-0001','PROFILE-0002']);
  assert.equal(results[16].value.id, 'NOM-0001');
});
test('entity type selector filters one shared catalog', () => {
  assert.equal(search({ ...args, type: 'groups' }).length, 14);
  assert.equal(search({ ...args, type: 'profiles' }).length, 2);
  assert.equal(search({ ...args, type: 'rules' }).length, catalog.rules.length);
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
  assert.equal(search({ ...args, type: 'profiles', status: 'draft' }).length, 2);
  assert.equal(search({ ...args, type: 'profiles', status: 'published' }).length, 0);
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
  assert.equal(new Set(hues).size, 14);
  for (let i=0;i<hues.length;i++) {
    assert.equal(hueForId(catalog.groups[i].id), hues[i]);
    assert.equal(hues[i], catalog.groups[i].color.hue_degrees);
  }
});

test('rules-first reverses type precedence with stable IDs inside each type', () => {
  const results = search({ ...args, sort: 'rules-first' });
  assert.equal(results[0].value.id, 'NOM-0001');
  assert.equal(results[catalog.rules.length-1].value.id, catalog.rules.at(-1).id);
  assert.equal(results[catalog.rules.length].value.id, 'GROUP-0001');
  assert.equal(results.at(-1).value.id, 'PROFILE-0002');
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
  assert.equal(small[0].value.id, 'GROUP-0012');
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

test('new group umbrella and its four children resolve nine independent rules', () => {
  const groups = search({ ...args, type:'groups', query:'progress reporting' });
  assert.ok(groups.some(x => x.value.id === 'GROUP-0010'));
  const members = NomosGroups.expand('GROUP-0009',catalog.groups,catalog.rules);
  assert.equal(members.length,9);
  assert.deepEqual(new Set(members),new Set(Array.from({length:9},(_,i)=>'NOM-'+String(i+68).padStart(4,'0'))));
  const summary = search({ ...args, type:'rules',groupFilter:'GROUP-0011' });
  assert.deepEqual(summary.map(x=>x.value.id),['NOM-0071','NOM-0072']);
});

test('quantified bounds are searchable without fabricating unresolved values',()=>{
  const never = search({ ...args, type:'rules', query:'never' });
  assert.ok(never.some(x=>x.value.id==='NOM-0001'));
  assert.ok(never.some(x=>x.value.id==='NOM-0072'));
  const once = search({ ...args, type:'rules', query:'once' });
  assert.ok(once.some(x=>x.value.id==='NOM-0071'));
  const any = search({ ...args, type:'rules', query:'free_choice' });
  assert.equal(any.filter(x=>x.value.norm.bounds.basis!=='unresolved').length,0);
});

test('profile membership filtering returns exact deduplicated published atoms',()=>{
  for(const profile of catalog.profiles){
    const members=search({...args,type:'rules',profileFilter:profile.id});
    assert.deepEqual(new Set(members.map(x=>x.value.id)),new Set(profile.selected_rule_ids));
    assert.equal(members.length,profile.selected_rule_ids.length);
    assert.ok(members.every(x=>x.kind==='rule'));
    assert.ok(search({...args,type:'profiles',query:profile.title}).some(x=>x.value.id===profile.id));
  }
  assert.equal(search({...args,type:'rules',profileFilter:'PROFILE-9999'}).length,0);
  const unsafe=search({...args,type:'rules',profileFilter:'PROFILE-0001',query:'unsafe'});
  assert.ok(unsafe.some(x=>x.value.id==='NOM-0112'));
  assert.equal(search({...args,profileFilter:'PROFILE-0002',status:'draft'}).length,0);
});
test('profiles participate in sort modes and search without creating groups',()=>{
  assert.deepEqual(search({...args,type:'profiles',sort:'id-desc'}).map(x=>x.value.id),['PROFILE-0002','PROFILE-0001']);
  const size=search({...args,type:'profiles',sort:'members-desc'}).map(x=>x.value.id);
  assert.deepEqual(size,['PROFILE-0002','PROFILE-0001']);
  assert.equal(catalog.groups.length,14);
  assert.ok(search({...args,type:'groups',query:'Strict Port'}).every(x=>x.kind==='group'));
  assert.ok(search({...args,type:'profiles',query:'Strict Port'}).every(x=>x.kind==='profile'));
});

test('Tarium project filter returns only explicitly scoped rules, including intentional overlaps',()=>{
  const filtered=search({...args,type:'rules',projectType:'tarium_project'});
  assert.deepEqual(filtered.map(x=>x.value.id),['NOM-0006','NOM-0007',...Array.from({length:14},(_,i)=>'NOM-'+String(i+115).padStart(4,'0'))]);
  assert.equal(search({...args,projectType:'rust_project_from_scratch'}).length,0);
  assert.ok(search({...args,query:'tarium_ontology',type:'rules'}).some(x=>x.value.id==='NOM-0119'));
});

test('project hierarchy selects scoped ancestors but not unrelated or wildcard-only rules',()=>{
  const hierarchy=require('../taxonomy/project-types.json');
  const t=search({...args,type:'rules',projectType:'tarium_project',projectHierarchy:hierarchy});
  assert.ok(t.some(x=>x.value.id==='NOM-0006'));
  assert.ok(t.some(x=>x.value.id==='NOM-0007'));
  assert.ok(t.some(x=>x.value.id==='NOM-0119'));
  assert.ok(t.every(x=>!(x.value.scope.project_types||['any']).includes('any')));
  const fork=search({...args,type:'rules',projectType:'rust_fork_maintenance',projectHierarchy:hierarchy});
  assert.ok(fork.some(x=>x.value.id==='NOM-0012'));
  assert.ok(fork.some(x=>x.value.id==='NOM-0024'));
  assert.ok(!fork.some(x=>x.value.id==='NOM-0085'));
});
