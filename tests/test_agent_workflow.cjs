'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/pages.yml'),'utf8');
test('validation runs on main, version tags and published releases',()=>{
 assert.match(workflow,/push:\s*\n\s*branches:\s*\[main\]/);
 assert.match(workflow,/tags:\s*\['v\*'\]/);
 assert.match(workflow,/release:\s*\n\s*types:\s*\[published\]/);
 assert.match(workflow,/workflow_dispatch:/);
});
test('release readiness includes provenance, compiler, browser, evidence and privacy guards',()=>{
 for(const term of [
  'python3 tools/validate.py',
  'node --test tests/test_projections.cjs',
  'node --test tests/test_agent_package.cjs',
  'node --test tests/test_agent_phase_reader.cjs',
  'node --test tests/test_agent_run_evidence.cjs',
  'node --test tests/test_agent_adversarial.cjs',
  'node --test tests/test_rule_builder_browser.cjs',
  'node tools/validate_agent_consumption_roadmap.cjs'
 ])assert.ok(workflow.includes(term),'Release check absent: '+term);
 assert.match(workflow,/actions\/deploy-pages@/);
});
