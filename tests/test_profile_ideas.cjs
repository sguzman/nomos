'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const queue=require('../tools/profile_ideas.cjs');
const schema=require('../schema/profile-idea.schema.json');

test('profile idea queue has separate ID and contract from actual profile presets',()=>{
  assert.equal(schema.properties.kind.const,'profile_idea');
  assert.match('PROFILE-IDEA-0001',new RegExp(schema.properties.id.pattern));
  assert.ok(!new RegExp(schema.properties.id.pattern).test('PROFILE-0001'));
  assert.ok(schema.properties.status.enum.includes('queued'));
});
test('enqueue stores ideas only, never profile records or processing authorization',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nomos-profile-ideas-'));
  try{
    const first=queue.enqueue({title:'Synthetic CLI QA preset'},tmp);
    const second=queue.enqueue({title:'Synthetic library QA preset',summary:'Demonstrate queue intake without selecting or creating a profile',
      ruleIds:['NOM-0001'],groupIds:['GROUP-0001']},tmp);
    assert.deepEqual([first.id,second.id],['PROFILE-IDEA-0001','PROFILE-IDEA-0002']);
    assert.equal(first.status,'queued');
    assert.deepEqual(first.linked_profile_ids,[]);
    assert.deepEqual(second.proposed_rule_ids,['NOM-0001']);
    assert.equal(fs.readdirSync(tmp).length,2);
    assert.deepEqual(queue.readQueue(tmp).map(x=>x.id),[first.id,second.id]);
    assert.deepEqual(queue.validateQueue(queue.readQueue(tmp)),[]);
    assert.ok(!fs.readdirSync(tmp).some(name=>/^PROFILE-\\d/.test(name)));
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('ideas reject invalid fields, fake profile linkage, repeated hints and identifiers',()=>{
  const example=queue.newIdea({title:'Synthetic test',date:'2026-10-21'});
  assert.deepEqual(queue.validateIdea(example),[]);
  assert.ok(queue.validateIdea({...example,status:'instantiated'}).length);
  assert.ok(queue.validateIdea({...example,linked_profile_ids:['PROFILE-0001']}).length);
  assert.ok(queue.validateIdea({...example,status:'instantiated',linked_profile_ids:['PROFILE-9999']},
    {profileIds:new Set(['PROFILE-0001'])}).length);
  assert.ok(queue.validateIdea({...example,proposed_rule_ids:['NOM-0001','NOM-0001']}).length);
  assert.ok(queue.validateIdea({...example,id:'PROFILE-0001'}).length);
  assert.ok(queue.validateIdea({...example,auto_process:true}).length);
  assert.ok(queue.validateIdea({...example,governance:{created_on:'2026-02-30',updated_on:'2026-10-21'}}).length);
  assert.ok(queue.validateQueue([example,example]).some(x=>x.includes('duplicate queue ID')));
  assert.throws(()=>queue.newIdea({title:'   '}),/title/);
});
test('queue IDs are monotonic and no cancelled ID can be reused',()=>{
  const a=queue.newIdea({title:'First'}),b={...a,id:'PROFILE-IDEA-0014',status:'cancelled'};
  assert.equal(queue.nextIdeaId([a,b]),'PROFILE-IDEA-0015');
});
test('queued records do not become published profiles through website catalog build',()=>{
  const catalog=require('../docs/catalog.json');
  const profiles=require('../profiles/PROFILE-0001.json');
  assert.equal(profiles.kind,'rule_profile');
  assert.deepEqual(catalog.profiles.map(p=>p.kind),['rule_profile','rule_profile']);
  assert.ok(!catalog.profiles.some(p=>p.id.startsWith('PROFILE-IDEA-')));
});
