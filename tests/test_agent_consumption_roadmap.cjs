'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {validate,checkFiles,percent}=require('../tools/validate_agent_consumption_roadmap.cjs');
const root=path.resolve(__dirname,'..');
const load=()=>JSON.parse(fs.readFileSync(path.join(root,'roadmaps/agent-consumption.json'),'utf8'));
const md=()=>fs.readFileSync(path.join(root,'docs/agent-consumption-roadmap.md'),'utf8');
test('roadmap ledger and readable checklist stay synchronized',()=>{
  const baseline=load().baseline;
  assert.deepEqual(checkFiles(root),{done:baseline.completed,total:69,progress:baseline.progress_percent});
  assert.equal(load().phases.length,7);
});
test('percentages are computed, not narrated',()=>{
  assert.equal(percent(1,69),1.4);
  assert.equal(percent(69,69),100);
});
test('rejects missing evidence for claimed completion',()=>{
  const data=load(); const c=data.checkpoints.find(x=>x.status==='planned'); c.status='done';
  data.baseline.completed+=1; data.baseline.progress_percent=percent(data.baseline.completed,69);
  data.baseline.delta_percentage_points=Math.round(10*(data.baseline.progress_percent-data.baseline.previous_percent))/10;
  assert.match(validate(data,md()).join('\n'),/Done requires nonempty/);
});
test('rejects duplicate checkpoints and phase membership drift',()=>{
  const data=load(); data.checkpoints[1].id=data.checkpoints[0].id;
  assert.match(validate(data,md()).join('\n'),/duplicate checkpoint/i);
});
test('rejects dishonest claimed percentage and delta',()=>{
  const data=load();data.baseline.progress_percent=100;data.baseline.delta_percentage_points=100;
  assert.match(validate(data,md()).join('\n'),/percentage drift/);
});
test('rejects missing approval guard',()=>{
  const data=load();data.governance.never_auto_activate_rules=false;
  assert.match(validate(data,md()).join('\n'),/governance boundaries/);
});
