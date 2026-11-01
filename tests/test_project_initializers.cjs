'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p)),sha=s=>createHash('sha256').update(s).digest('hex');
const {load,serialize}=require('../tools/build_project_initializers.cjs');
const spec=json('end-consumer-profiles/project-initializers/v0/specifications.json');
const profile=json('end-consumer-profiles/project-initializers/profile.json');
const source=json('end-consumer-profiles/project-initializers/v0/trievium.json');
const original=json('docs/exports/project-stewardship-approved-trievium.json');
const standalone=json('docs/exports/project-initializers-trievium.json');
const combined=json('docs/exports/project-stewardship-with-initializers-trievium.json');
test('four basic and three specialized port pairs have stable unique digit/shift bindings',()=>{
 assert.equal(profile.kind,'end_consumer_prompt_profile');
 assert.equal(profile.id,'EC-PROFILE-0002');
 assert.equal(source.entries.length,14);
 assert.deepEqual(source.entries.map(x=>x.key),['1','!','2','@','3','#','4','$','5','%','6','^','7','&']);
 assert.deepEqual(spec.reserved.map(x=>x.number),['8']);
 assert.deepEqual(source.entries.map(e=>[e.label,e.text]),standalone.entries.map(e=>[e.label,e.text]));
 assert.deepEqual(combined.entries,[...original.entries,...standalone.entries]);
 assert.equal(combined.entries.length,24);
 assert.equal(new Set(combined.entries.map(e=>e.key)).size,24);
 assert.equal(new Set(combined.entries.map(e=>e.label)).size,24);
 for(const [i,e] of source.entries.entries()){
   assert.equal(profile.slots[i].ordinal,i);
   assert.equal(profile.slots[i].key,e.key);
   assert.equal(profile.slots[i].label,e.label);
   assert.equal(profile.slots[i].text_sha256,sha(e.text));
   assert.equal(profile.slots[i].id,'EC-PROMPT-'+String(i+11).padStart(4,'0'));
 }
});
test('frozen baselines generate exact V0 bytes and original prompt export is unchanged',()=>{
 assert.equal(read('end-consumer-profiles/project-initializers/v0/trievium.json'),serialize(load()));
 assert.equal(read('end-consumer-profiles/project-initializers/v0/trievium.json'),serialize(load()));
 assert.equal(profile.versions[0].source_sha256,sha(read('end-consumer-profiles/project-initializers/v0/trievium.json')));
 const d=json('docs/data/project-stewardship-published-versions.json').published_versions.find(p=>p.key==='D'&&p.version==='4').text;
 const a=json('docs/data/project-stewardship-published-versions.json').published_versions.find(p=>p.key==='A'&&p.version==='2').text;
 for(const e of source.entries){
   assert.ok(e.text.includes(d),'Missing fixed stewardship baseline: '+e.key);
   if('!@#$%^&'.includes(e.key))assert.ok(e.text.includes(a),'Missing adoption baseline: '+e.key);
   else assert.ok(!e.text.includes('## 1. 🔍 Audit and Reconstruct'),'New-project entry unexpectedly contains adoption instructions: '+e.key);
   assert.match(e.text,/MIT-First Licensing/);
   assert.match(e.text,/Full-Lifecycle Progress Calibration/);
 }
});
test('port variants remain specialized and Tarium never auto-enrolls',()=>{
 const entries=Object.fromEntries(source.entries.map(e=>[e.key,e.text]));
 for(const key of ['2','@','5','%','6','^','7','&'])assert.match(entries[key],/upstream/i);
 for(const key of ['5','%'])assert.match(entries[key],/ABI/);
 for(const key of ['6','^'])assert.match(entries[key],/templates/);
 for(const key of ['7','&'])assert.match(entries[key],/Python version/);
 for(const key of ['3','#'])assert.match(entries[key],/Do not enroll/);
 for(const key of ['!','@','#','$','%','^','&'])assert.match(entries[key],/existing project, not a new-project reset/);
});
test('public site exposes only explicit non-destructive downloads',()=>{
 const page=read('docs/end-consumer-profiles.html');
 assert.match(page,/project-initializers-trievium\.json/);
 assert.match(page,/project-stewardship-with-initializers-trievium\.json/);
 assert.match(page,/Java → Rust \(reserved; not published\)/);
 assert.match(page,/Downloading does not merge them into or overwrite/);
});
