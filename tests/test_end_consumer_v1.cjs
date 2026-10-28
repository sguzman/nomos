'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const sha=value=>require('node:crypto').createHash('sha256').update(value).digest('hex');
const dir=path.join(root,'end-consumer-profiles','project-stewardship');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const original=json(path.join(dir,'v0','trievium.json'));
const profile=json(path.join(dir,'profile.json'));
const draft=json(path.join(dir,'v1','analysis.json'));

test('V1 enriches exactly ten immutable V0 prompt IDs without selecting or rewriting',()=>{
  assert.equal(draft.kind,'nomos_end_consumer_prompt_semantic_draft');
  assert.equal(draft.profile_id,profile.id);
  assert.equal(draft.status,'proposed_for_owner_review');
  assert.equal(draft.version,'1');
  assert.equal(draft.prompts.length,original.entries.length);
  assert.equal(new Set(draft.prompts.map(p=>p.prompt_id)).size,10);
  draft.prompts.forEach((p,i)=>{
    const slot=profile.slots[i],v0=original.entries[i];
    assert.equal(p.prompt_id,slot.id);
    assert.equal(p.source.version,'0');
    assert.equal(p.source.key,v0.key);
    assert.equal(p.source.label,v0.label);
    assert.equal(p.source.text_sha256,sha(v0.text));
    assert.equal(p.meta_intent.review_status,'owner_approved');
    assert.equal(p.meta_intent.owner_confirmed,true);
    assert.ok(p.meta_intent.statement.length>20);
    assert.equal(p.selection.selected_prompt_version,'0');
    assert.equal(p.selection.generated_prompt_version,null);
    assert.equal(p.selection.evaluation,'not_started');
    assert.equal(p.selection.semantic_selection_owner_approved,false);
    assert.ok(p.conflicts_and_gaps.length>0);
  });
  assert.equal(profile.current_version,'0');
  assert.equal(profile.governance.semantic_enrichment_authorized,false);
});

test('All V1 semantic links resolve to published canonical objects, never invented IDs',()=>{
  const types=[['situation_ids','ontology/situations'],
    ['rule_ids','rules'],['condition_ids','ontology/conditions']];
  for(const p of draft.prompts){
    for(const [field,folder] of types){
      const seen=new Set();
      for(const id of p[field]){
        assert.ok(!seen.has(id),'Repeated '+id+' in '+p.prompt_id);seen.add(id);
        const record=json(path.join(root,folder,id+'.json'));
        assert.equal(record.id,id);
        assert.equal(record.status,'published');
      }
    }
    assert.ok(p.atomic_intents.length>=4);
    const localIds=new Set();
    for(const intent of p.atomic_intents){
      assert.ok(!localIds.has(intent.local_id));localIds.add(intent.local_id);
      assert.ok(intent.statement.length>5);
      assert.equal(intent.review_status,'proposed');
      assert.ok(intent.existing_intent_ids.length>=1);
      for(const id of intent.existing_intent_ids){
        const record=json(path.join(root,'ontology/intents',id+'.json'));
        assert.equal(record.id,id);
        assert.equal(record.status,'published');
      }
    }
  }
});

test('Public review site exposes ten distinct V1 meta-intents and read-only V0 inspection',()=>{
  const html=fs.readFileSync(path.join(root,'docs','end-consumer-profiles.html'),'utf8');
  const script=fs.readFileSync(path.join(root,'docs','end-consumer-profiles.js'),'utf8');
  assert.equal((html.match(/<details>/g)||[]).length,10);
  for(const p of draft.prompts){
    assert.ok(html.includes(p.meta_intent.statement),'Meta-intent not public: '+p.prompt_id);
    assert.ok(html.includes(p.source.label),'Missing original identity: '+p.prompt_id);
    for(const id of p.rule_ids)assert.ok(html.includes(id),'Missing published rule link '+id);
  }
  assert.match(html,/end-consumer-profiles\.js/);
  assert.match(html,/exports\/project-stewardship-v0\.json/);
  assert.match(script,/preview\.mount\(pre,entry\.text\)/);
  assert.match(script,/navigator\.clipboard\.writeText\(selected\.text\)/);
  assert.match(script,/selections\[slot\.id\]/);
  assert.match(script,/preview\.mount\(pre,entry\.text\)/);
});
