'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {classify,buildFiles,generate,zip}=require('../tools/build_codex_zip.cjs');
const root=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
test('published rules each have one home; all six preferred fonts in gui/typography',()=>{
 const {bundle,manifest,archive}=generate();
 const cat=load('docs/catalog.json');
 const rules=cat.rules.filter(r=>r.status==='published'&&r.registry==='catalog');
 assert.equal(manifest.published_rule_count,rules.length);
 assert.equal(new Set(rules.map(r=>r.id)).size,rules.length);
 const allModules=[...bundle.modules.values()].flat().map(r=>r.id);
 assert.equal(allModules.length,rules.length);
 assert.equal(new Set(allModules).size,rules.length);
 for(let i=250;i<=255;i++){
  const r=rules.find(r=>r.id==='NOM-'+i);
  assert.ok(r);
  assert.equal(classify(r),'gui/typography.md');
  assert.match(bundle.files.get('.nomos/gui/typography.md'),new RegExp(r.id));
 }
 assert.ok(bundle.files.get('.nomos/core/progress.md'));
 assert.ok(bundle.files.get('.nomos/core/reporting.md'));
 assert.ok(bundle.files.get('.nomos/core/workflow.md'));
 assert.ok(bundle.files.get('AGENTS.md').length<3000);
 assert.ok(archive.length>2000);
});
test('ZIP is self-contained, safe, reproducible and contains no runtime machinery',()=>{
 const {bundle,archive,manifest}=generate();
 assert.deepEqual(archive,zip(bundle.files));
 assert.equal(archive.readUInt32LE(0),0x04034b50);
 assert.ok(manifest.archive_paths.includes('AGENTS.md'));
 assert.ok(manifest.archive_paths.includes('.nomos/INDEX.md'));
 assert.ok(manifest.archive_paths.includes('.nomos/VERSION.md'));
 assert.ok(manifest.archive_paths.includes('.nomos/prompts/current-trievium.json'));
 assert.ok(manifest.archive_paths.every(p=>!p.endsWith('.cjs')&&!p.includes('projection.json')&&!p.includes('verify.js')));
 const content=bundle.files.get('.nomos/prompts/current-trievium.json');
 assert.equal(JSON.parse(content).entries.length,24);
 assert.match(bundle.files.get('.nomos/INDEX.md'),/published canonical rules/i);
 assert.match(bundle.files.get('AGENTS.md'),/existing.*AGENTS.md/i);
 // Check each stored payload can be inflated, not just the ZIP filename.
 let o=0,n=0;
 while(archive.readUInt32LE(o)===0x04034b50){
  const flag=archive.readUInt16LE(o+6);
  assert.equal(flag,0x0800);
  const packed=archive.readUInt32LE(o+18),raw=archive.readUInt32LE(o+22),length=archive.readUInt16LE(o+26);
  const name=archive.subarray(o+30,o+30+length).toString('utf8');
  const bytes=zlib.inflateRawSync(archive.subarray(o+30+length,o+30+length+packed));
  assert.equal(bytes.length,raw);assert.equal(bytes.toString('utf8'),bundle.files.get(name));
  n++;o+=30+length+packed;
 }
 assert.equal(n,bundle.files.size);
 assert.equal(archive.readUInt32LE(o),0x02014b50);
});
test('all selected general prompt versions are reflected in provenance',()=>{
 const {manifest}=generate();
 const versions=new Map(manifest.selected_general_prompts.map(x=>[x.key,x.version]));
 assert.equal(versions.get('S'),'6');
 assert.equal(versions.get('D'),'6');
 assert.equal(versions.get('A'),'4');
 assert.equal(manifest.selected_specialized_prompts.length,14);
 assert.ok(manifest.selected_specialized_prompts.every(x=>x.version==='4'));
});
