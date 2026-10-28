'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname,'..');
const base = path.join(root,'end-consumer-profiles','project-stewardship');
const digest = value => createHash('sha256').update(value).digest('hex');

test('original V0 Trievium bytes and public export are identical',()=>{
  const source = fs.readFileSync(path.join(base,'v0','trievium.json'));
  const published = fs.readFileSync(path.join(root,'docs','exports','project-stewardship-v0.json'));
  const profile = JSON.parse(fs.readFileSync(path.join(base,'profile.json'),'utf8'));
  assert.ok(source.equals(published));
  assert.equal(digest(source),profile.versions[0].source_sha256);
});

test('all ten stable slots preserve key, label and text checksum without enrichment',()=>{
  const profile = JSON.parse(fs.readFileSync(path.join(base,'profile.json'),'utf8'));
  const source = JSON.parse(fs.readFileSync(path.join(base,'v0','trievium.json'),'utf8'));
  assert.equal(source.version,1);
  assert.equal(profile.slots.length,10);
  assert.equal(source.entries.length,10);
  assert.equal(new Set(source.entries.map(item=>item.key)).size,10);
  source.entries.forEach((entry,index)=>{
    const slot=profile.slots[index];
    assert.equal(slot.id,'EC-PROMPT-'+String(index+1).padStart(4,'0'));
    assert.equal(slot.key,entry.key);
    assert.equal(slot.label,entry.label);
    assert.equal(slot.ordinal,index);
    assert.equal(slot.text_sha256,digest(entry.text));
    assert.equal(slot.semantic_status,'not_analyzed');
  });
  assert.equal(profile.governance.semantic_enrichment_authorized,false);
});
