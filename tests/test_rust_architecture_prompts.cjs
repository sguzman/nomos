'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const ids=Array.from({length:11},(_,i)=>'NOM-'+String(i+256).padStart(4,'0'));
test('Published Rust layout rules never impose numeric source length thresholds',()=>{
 for(const id of ids){
  const r=read('rules/'+id+'.json');
  assert.equal(r.status,'published');assert.deepEqual(r.scope.project_types,['rust_project']);
  assert.equal(r.norm.bounds.minimum,null);assert.equal(r.norm.bounds.maximum,null);
 }
 const noLength=read('rules/NOM-0257.json');assert.match(noLength.statement,/numeric hard caps, soft caps/i);
 const active=read('rules/NOM-0259.json');assert.match(active.statement,/including files outside the immediate feature/);
});
test('Five append-only V9 general successors retain history and only activate for authorized Rust work',()=>{
 const v9=read('end-consumer-profiles/project-stewardship/v9/revisions.json');
 const pub=read('docs/data/project-stewardship-published-versions.json');
 const selected=read('docs/exports/project-stewardship-approved-trievium.json');
 assert.deepEqual(v9.selected_keys,['S','D','A','F','G']);
 for(const r of v9.revisions){
  const before=pub.published_versions.find(x=>x.key===r.key&&x.version===r.prior_version);
  const after=pub.published_versions.find(x=>x.key===r.key&&x.version===r.selected_version);
  assert.equal(sha(before.text),r.prior_sha256);assert.equal(sha(after.text),r.selected_sha256);
  assert.equal(pub.selected_versions[r.prompt_id],r.selected_version);
  assert.equal(selected.entries.find(x=>x.key===r.key).text,after.text);
  assert.ok(after.text.includes('NOM-0256')&&after.text.includes('NOM-0266'));
  assert.match(after.text,/Rust/);assert.match(after.text,/authorized/i);
  assert.match(after.text,/line.count|line\/function line|length limits/i);
 }
 for(const key of ['J','L','H','K','U'])assert.equal(pub.published_versions.filter(x=>x.key===key).length,key==='L'||key==='H'?1:0);
});
test('V5 specialized generation retains all fourteen keyboard bindings and embeds canonical rule statements',()=>{
 const v4=require('../tools/build_project_initializers_v4.cjs'),v5=require('../tools/build_project_initializers_v5.cjs');
 v4.publish(true);v5.publish(true);
 assert.equal(v5.selected.entries.length,14);
 assert.deepEqual(v5.selected.entries.map(e=>e.key),v4.selected.entries.map(e=>e.key));
 for(let i=0;i<14;i++){
  const e=v5.selected.entries[i],prior=v4.selected.entries[i],metadata=v5.report.entries[i];
  assert.match(e.text,/D V7/);if(i%2)assert.match(e.text,/A V5/);
  assert.notEqual(e.text,prior.text);assert.equal(sha(e.text),metadata.sha256);
  for(const id of ids){assert.ok(e.text.includes(id+' — '),id+' in '+e.key);assert.ok(metadata.rule_ids.includes(id));}
  assert.match(e.text,/only when the actual authorized project includes Rust/);
  assert.match(e.text,/without numerical file\/function line limits/);
 }
 for(const k of ['3','·'])assert.match(v5.selected.entries.find(e=>e.key===k).text,/Do not enroll/);
 assert.deepEqual(v5.combined.entries.slice(0,10),read('docs/exports/project-stewardship-approved-trievium.json').entries);
});
