'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const model=require('../docs/end-consumer-profile-model.js');
const profile=json('end-consumer-profiles/project-stewardship/profile.json');
const source=json('end-consumer-profiles/project-stewardship/v0/trievium.json');
const manifest=json('docs/data/project-stewardship-published-versions.json');
const sha=x=>createHash('sha256').update(x).digest('hex');

test('only the ten original versions are published, and original export keys/text survive unchanged',()=>{
  const catalog=model.makeCatalog(profile,source,manifest);
  assert.equal(catalog.length,10);
  assert.deepEqual(manifest.published_versions,[]);
  assert.ok(catalog.every(x=>x.versions.length===1&&x.versions[0].version==='0'));
  assert.deepEqual(model.makeTrievium(catalog),{
    version:1,entries:source.entries.map(x=>({label:x.label,text:x.text,key:x.key}))
  });
  for(let i=0;i<catalog.length;i++){
    assert.equal(catalog[i].id,profile.slots[i].id);
    assert.equal(catalog[i].versions[0].sha256,sha(source.entries[i].text));
  }
  const serialized=model.serializeTrievium(catalog,{});
  assert.deepEqual(JSON.parse(serialized),model.makeTrievium(catalog,{}));
});

test('explicit approved successor can be preview-selected and exported without changing the original',()=>{
  const key=profile.slots[0],original=source.entries[0];
  const candidate='An explicitly owner-approved synthetic test continuation.';
  const approved={...manifest,published_versions:[{
    prompt_id:key.id,key:key.key,label:key.label,version:'1',
    publication_state:'approved_public_prompt_version',owner_approved:true,
    approval_reference:'synthetic-test-only',text:candidate,sha256:sha(candidate)
  }]};
  const catalog=model.makeCatalog(profile,source,approved);
  const selected=model.makeTrievium(catalog,{[key.id]:'1'});
  assert.equal(selected.entries[0].text,candidate);
  assert.equal(selected.entries[1].text,source.entries[1].text);
  assert.equal(source.entries[0].text,original.text);
  assert.equal(model.makeTrievium(catalog).entries[0].text,original.text);
});

test('unapproved, unknown, inconsistent, duplicated and fabricated versions are rejected',()=>{
  const key=profile.slots[0],text='Example alternate';
  const candidate={prompt_id:key.id,key:key.key,label:key.label,version:'1',
    publication_state:'approved_public_prompt_version',owner_approved:true,
    approval_reference:'synthetic-test-only',text,sha256:sha(text)};
  const manifestWith=versions=>({...manifest,published_versions:versions});
  for(const invalid of [
    {...candidate,owner_approved:false},
    {...candidate,approval_reference:''},
    {...candidate,publication_state:'proposed_for_owner_review'},
    {...candidate,version:'0'},
    {...candidate,key:'Z'},
    {...candidate,prompt_id:'EC-PROMPT-9999'}
  ])assert.throws(()=>model.makeCatalog(profile,source,manifestWith([invalid])));
  assert.throws(()=>model.makeCatalog(profile,source,manifestWith([candidate,candidate])));
  assert.throws(()=>model.makeTrievium(model.makeCatalog(profile,source,manifest),{[key.id]:'1'}));
  assert.throws(()=>model.makeCatalog(profile,{...source,entries:[...source.entries,source.entries[0]]},manifest));
});

test('public site has explicit user-triggered export, version controls and no activation',()=>{
  const html=fs.readFileSync(path.join(root,'docs/end-consumer-profiles.html'),'utf8');
  const browser=fs.readFileSync(path.join(root,'docs/end-consumer-profiles.js'),'utf8');
  assert.match(html,/end-consumer-profile-model\.js/);
  assert.match(html,/id="download-selected-trievium"/);
  assert.match(html,/id="copy-selected-trievium"/);
  assert.match(html,/exports\/project-stewardship-v0\.json/);
  assert.match(browser,/addEventListener\('click'/);
  assert.match(browser,/addEventListener\('change'/);
  assert.match(browser,/makeCatalog\(profile,source,manifest\)/);
  assert.match(browser,/sha256\(version\.text\)/);
  assert.match(browser,/serializeTrievium\(catalog,selections\)/);
  assert.match(browser,/URL\.createObjectURL/);
  assert.match(browser,/pre\.textContent=entry\.text/);
});
