'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {verify,blobHash,TARGETS,APPROVALS}=require('../tools/validate_rule_situation_intent_queue.cjs');

const ROOT=path.resolve(__dirname,'..');
const QUEUE=path.join(ROOT,'queues/rule-situation-intent');
const entry=n=>JSON.parse(fs.readFileSync(path.join(QUEUE,'RIA-'+String(n).padStart(4,'0')+'.json'),'utf8'));

test('all 137 canonical rule identities have one inert queue entry',()=>{
  const r=verify();
  assert.deepEqual(r.errors,[]);
  assert.equal(r.count,137);
  assert.deepEqual(r.drifted,[]);
  assert.deepEqual([...Array(137)].map((_,i)=>entry(i+1).source.rule_id),
    [...Array(137)].map((_,i)=>'NOM-'+String(i+1).padStart(4,'0')));
});
test('source Git snapshot is pinned and includes the unapproved draft',()=>{
  const first=entry(1),draft=entry(2),last=entry(137);
  assert.equal(first.source.snapshot_commit,'ab9b06e947284dab83fe19519be21dc1b0ad5051');
  assert.equal(draft.source.status_at_snapshot,'draft');
  assert.equal(last.source.status_at_snapshot,'published');
  assert.equal(last.source.version,'1.0.0');
  for(const r of [first,draft,last]){
    const bytes=fs.readFileSync(path.join(ROOT,r.source.path));
    assert.equal(blobHash(bytes),r.source.git_blob_sha);
  }
});
test('no intent or situation has been extracted or approved by queuing',()=>{
  for(let i=1;i<=137;i++){
    const item=entry(i);
    assert.equal(item.status,'queued');
    assert.deepEqual(item.requested_analysis,TARGETS);
    assert.deepEqual(item.authorization,APPROVALS);
    assert.equal(Object.hasOwn(item,'results'),false);
    assert.equal(Object.hasOwn(item,'situation_ids'),false);
    assert.equal(Object.hasOwn(item,'intent_ids'),false);
  }
});
