'use strict';
/* Verify that roadmap percentage claims match evidence and the readable checklist. */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const STATES = new Set(['planned','implementing','verifying','blocked','done']);
const ID = /^(ARC|PRJ|PKG|BLD|RUN|EVAL|REL)-\d{2}$/;
function percent(done, total) {
  return Math.round(1000 * done / total) / 10;
}
function validate(data, markdown) {
  const errors = [];
  const fail = msg => errors.push(msg);
  if (!data || !Array.isArray(data.phases) || !Array.isArray(data.checkpoints) || !data.checkpoints.length)
    return ['Missing roadmap phases/checkpoints'];
  const phases = new Map(), checkpoints = new Map();
  for (const p of data.phases) {
    if (!p?.id || phases.has(p.id)) fail('Duplicate/invalid phase ' + p?.id);
    phases.set(p.id,p);
  }
  for (const p of data.phases) {
    for (const dep of p.depends_on || []) if (!phases.has(dep) || dep === p.id)
      fail('Invalid phase dependency ' + p.id + ' -> ' + dep);
    const seen = new Set();
    for (const id of p.checkpoints || []) {
      if (seen.has(id)) fail('Duplicate phase member ' + id);
      seen.add(id);
    }
  }
  function visit(id, stack = []) {
    if (stack.includes(id)) { fail('Dependency cycle: ' + [...stack,id].join(' -> ')); return; }
    if (!phases.has(id)) return;
    for (const dep of phases.get(id).depends_on || []) {
      if (!stack.includes(dep)) visit(dep,[...stack,id]);
      else fail('Dependency cycle: ' + [...stack,id,dep].join(' -> '));
    }
  }
  for (const id of phases.keys()) visit(id);
  for (const c of data.checkpoints) {
    if (!ID.test(c?.id || '') || checkpoints.has(c.id)) fail('Invalid/duplicate checkpoint ' + c?.id);
    checkpoints.set(c.id,c);
    if (!phases.has(c.phase) || !phases.get(c.phase).checkpoints.includes(c.id))
      fail('Checkpoint not owned by phase ' + c.id);
    if (!c.title || !c.acceptance || !STATES.has(c.status)) fail('Invalid details/status ' + c.id);
    if (!Array.isArray(c.evidence)) fail('Evidence must be an array ' + c.id);
    if (c.status === 'done' && (!c.evidence?.length ||
      !c.evidence.every(e=>typeof e === 'string' && e.trim().length > 8)))
      fail('Done requires nonempty, concrete evidence references: ' + c.id);
    const marker = c.status === 'done' ? '- [x] **' : '- [ ] **';
    if (!markdown.includes(marker + c.id + ' —')) fail('Roadmap checklist drift ' + c.id);
  }
  for (const p of data.phases) for (const id of p.checkpoints || [])
    if (!checkpoints.has(id)) fail('Missing checkpoint ' + id);
  const checkboxes = markdown.match(/^- \[[ x]\] \*\*(ARC|PRJ|PKG|BLD|RUN|EVAL|REL)-\d{2} —/gm) || [];
  if (checkboxes.length !== data.checkpoints.length) fail('Markdown checklist count drift');
  const done = data.checkpoints.filter(c=>c.status==='done').length;
  const computed = percent(done,data.checkpoints.length);
  const b = data.baseline || {};
  if (b.total !== data.checkpoints.length || b.completed !== done ||
      b.progress_percent !== computed) fail('Baseline completion denominator/percentage drift');
  if (!Number.isFinite(b.previous_percent) ||
      b.delta_percentage_points !== Math.round(10 * (computed - b.previous_percent))/10)
    fail('Invalid comparable previous/current delta');
  if (data.governance?.roadmap_not_task_queue !== true ||
      data.governance?.never_auto_activate_rules !== true ||
      data.governance?.never_auto_finalize_profiles !== true)
    fail('Required governance boundaries missing');
  return errors;
}
function checkFiles(root=ROOT) {
  const data=JSON.parse(fs.readFileSync(path.join(root,'roadmaps/agent-consumption.json'),'utf8'));
  const md=fs.readFileSync(path.join(root,'docs/agent-consumption-roadmap.md'),'utf8');
  const errors=validate(data,md);
  if (errors.length) throw new Error(errors.join('\n'));
  return {done:data.baseline.completed,total:data.baseline.total,progress:data.baseline.progress_percent};
}
if (require.main===module) {
  try { console.log('Agent-consumption roadmap valid:', JSON.stringify(checkFiles())); }
  catch(e) { console.error(e.message); process.exitCode=1; }
}
module.exports={validate,checkFiles,percent};
