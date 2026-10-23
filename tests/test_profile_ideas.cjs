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
    assert.ok(!fs.readdirSync(tmp).some(name=>/^PROFILE-\d/.test(name)));
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
  assert.equal(catalog.profiles.length,8);
  assert.ok(catalog.profiles.every(p=>p.kind==='rule_profile'));
  assert.ok(!catalog.profiles.some(p=>p.id.startsWith('PROFILE-IDEA-')));
});

test('six explicitly instantiated profile ideas retain correct linked unreviewed drafts',()=>{
  const all=queue.readQueue();
  assert.equal(all.length,8);
  const ideas=all.slice(0,6);
  assert.deepEqual(ideas.map(x=>x.id),Array.from({length:6},(_,i)=>'PROFILE-IDEA-'+String(i+1).padStart(4,'0')));
  for(const idea of ideas){
    assert.equal(idea.status,'instantiated');
    assert.deepEqual(idea.proposed_rule_ids,[]);
    assert.deepEqual(idea.proposed_group_ids,[]);
    const linked='PROFILE-'+String(Number(idea.id.slice(-4))+2).padStart(4,'0');
    assert.deepEqual(idea.linked_profile_ids,[linked]);
    const profile=require('../profiles/'+linked+'.json');
    assert.equal(profile.status,'draft');
    assert.equal(profile.review.selection_confirmed,false);
    assert.equal(queue.validateIdea(idea).length,0);
    assert.match(idea.title, /Lite|Full/);
  }
  const pairs=[[ideas[0],ideas[1]],[ideas[2],ideas[3]],[ideas[4],ideas[5]]];
  for(const pair of pairs)assert.notEqual(pair[0].title,pair[1].title);
  const catalog=require('../docs/catalog.json');
  assert.equal(catalog.profiles.length,8);
  assert.ok(catalog.profiles.every(p=>p.kind==='rule_profile'));
});

test('C++-to-Rust Lite/Full ideas stay queued and separate from C-to-Rust drafts',()=>{
  const ideas=queue.readQueue();
  const cpp=ideas.slice(6);
  assert.deepEqual(cpp.map(x=>x.id),['PROFILE-IDEA-0007','PROFILE-IDEA-0008']);
  for(const idea of cpp){
    assert.equal(idea.status,'queued');
    assert.deepEqual(idea.proposed_rule_ids,[]);
    assert.deepEqual(idea.proposed_group_ids,[]);
    assert.deepEqual(idea.linked_profile_ids,[]);
    assert.equal(queue.validateIdea(idea).length,0);
    assert.match(idea.title,/C\+\+-to-Rust/);
    assert.match(idea.summary,/PROFILE-000[12]/);
  }
  const catalog=require('../docs/catalog.json');
  assert.equal(catalog.profiles.length,8);
  assert.ok(!catalog.profiles.some(p=>p.title.includes('C++-to-Rust')));
  assert.equal(queue.nextIdeaId(ideas),'PROFILE-IDEA-0009');
});
