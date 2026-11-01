'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),j=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const {publish,ruleIds,familyProfile,combined:historicalCombined}=require('../tools/build_project_initializers_v3.cjs');
const spec=j('end-consumer-profiles/project-initializers/v3/specifications.json'),old=j('end-consumer-profiles/project-initializers/v2/trievium.json'),cur=j('end-consumer-profiles/project-initializers/v3/trievium.json'),r=j('docs/exports/project-initializers-v3-manifest.json');
const main=j('docs/exports/project-stewardship-approved-trievium.json'),combined=j('docs/exports/project-stewardship-with-initializers-trievium.json');
test('All published V3 prompts retain pinned keys and embed every selected Full-profile rule',()=>{
 publish(true);
 assert.equal(cur.entries.length,14);assert.deepEqual(cur.entries.map(x=>x.key),old.entries.map(x=>x.key));
 assert.deepEqual(cur.entries.map(x=>x.label),old.entries.map(x=>x.label));
 assert.deepEqual(historicalCombined.entries.slice(10),cur.entries);
 assert.equal(new Set(historicalCombined.entries.map(e=>e.key)).size,24);
 for(let i=0;i<14;i++){
  let f=spec.families[Math.floor(i/2)],p=familyProfile(f),ids=ruleIds(f),e=cur.entries[i],meta=r.entries[i];
  assert.deepEqual(meta.rule_ids,ids);assert.equal(meta.sha256,sha(e.text));
  assert.equal(meta.rule_count,ids.length);assert.equal(meta.source_full_profile,p?.id||null);
  for(let id of ids)assert.ok(e.text.includes(id+' — '),'Missing canonical '+id+' in '+f.slug);
  assert.match(e.text,/D V5/);assert.match(e.text,/NOM-0248/);assert.match(e.text,/NOM-0249/);
  if(i%2)assert.match(e.text,/A V3/);
  else assert.doesNotMatch(e.text,/## Existing Project Adoption/);
 }
});
test('Specialist behavior and provisional-profile safeguards remain explicit',()=>{
 const entries=Object.fromEntries(cur.entries.map(e=>[e.key,e.text]));
 for(let k of ['3','·']){assert.match(entries[k],/Do not enroll/);assert.match(entries[k],/NOM-0240/)}
 for(let k of ['4','$'])assert.match(entries[k],/NOM-0236/);
 for(let k of ['5','%'])assert.match(entries[k],/NOM-0200/);
 for(let k of ['7','/'])assert.match(entries[k],/NOM-0150/);
 for(let k of ['2','"','5','%','6','&','7','/'])assert.match(entries[k],/upstream/i);
 assert.match(entries['1'],/provisional draft selections/);
});
