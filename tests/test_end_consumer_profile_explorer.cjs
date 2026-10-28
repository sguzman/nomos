'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const api=require('../docs/end-consumer-profile-explorer-model.js');
const profile=json('docs/data/project-stewardship-v0-profile.json');
const source=json('docs/exports/project-stewardship-v0.json');
const analysis=json('docs/data/project-stewardship-v1-analysis.json');
test('mirrored V1 draft matches original source exactly',()=>{
 assert.deepEqual(analysis,json('end-consumer-profiles/project-stewardship/v1/analysis.json'));
});
test('browse all ten prompt texts and complete linked published concepts',()=>{
 const views=api.build(profile,source,analysis,json('docs/catalog.json'));
 assert.equal(views.length,10);
 assert.deepEqual(views.map(v=>v.key),['J','L','S','H','D','K','A','F','G','U']);
 for(let i=0;i<views.length;i++){
   const v=views[i],semantic=analysis.prompts[i];
   assert.equal(v.text,source.entries[i].text);
   assert.equal(v.meta_intent,semantic.meta_intent.statement);
   assert.equal(v.atomics.length,semantic.atomic_intents.length);
   assert.equal(v.situations.length,semantic.situation_ids.length);
   assert.equal(v.rules.length,semantic.rule_ids.length);
   assert.equal(v.conditions.length,semantic.condition_ids.length);
   assert.ok(v.rules.every(rule=>rule.status==='published'&&rule.statement));
   assert.ok(v.situations.every(x=>x.definition));
   assert.ok(v.conditions.every(x=>x.definition));
   assert.ok(v.atomics.every(x=>x.linked_intents.length>0&&x.linked_intents.every(intent=>intent.definition)));
 }
});
test('unpublished or mismatched concepts cannot be silently presented as published',()=>{
 const catalog=json('docs/catalog.json');
 assert.throws(()=>api.build(profile,source,{...analysis,prompts:analysis.prompts.slice(1)},catalog));
 const broken=JSON.parse(JSON.stringify(analysis));
 broken.prompts[0].rule_ids[0]='NOM-9999';
 assert.throws(()=>api.build(profile,source,broken,catalog),/Unresolved published rule/);
 const stale=JSON.parse(JSON.stringify(analysis));
 stale.prompts[0].source.key='Z';
 assert.throws(()=>api.build(profile,source,stale,catalog),/does not match original/);
});
test('public profile has prompt-browser controls but no on-page edit or feedback form',()=>{
 const html=fs.readFileSync(path.join(root,'docs/end-consumer-profiles.html'),'utf8');
 const script=fs.readFileSync(path.join(root,'docs/end-consumer-profile-explorer.js'),'utf8');
 assert.match(html,/id="profile-prompt-nav"/);
 assert.match(html,/id="profile-reader"/);
 assert.match(html,/Show original source-linked semantic review/);
 assert.doesNotMatch(html,/owner-review-worksheet|owner-review-download/);
 assert.match(script,/reader\.replaceChildren\(\)/);
 assert.match(script,/p\.rules/);
 assert.doesNotMatch(script,/method\s*:\s*['"]POST|textarea|fetch\([^)]*,\s*\{/);
});
