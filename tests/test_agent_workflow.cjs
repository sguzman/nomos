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

test('Pages smoke test must validate published route and catalog after deployment',()=>{
 const deploy=workflow.indexOf('uses: actions/deploy-pages@v4');
 const smoke=workflow.indexOf('name: Smoke-check deployed guided builder');
 assert.ok(deploy>=0&&smoke>deploy);
 assert.match(workflow,/SITE_URL:.*steps\.deployment\.outputs\.page_url/);
 for(const file of ['rule-builder.html','builder-logic.js','rule-builder.js','catalog.json'])
   assert.ok(workflow.includes(file),'Missing published asset smoke check '+file);
});

test('deployed guided builder is exercised interactively after HTTP smoke checks',()=>{
 const smoke=workflow.indexOf('name: Smoke-check deployed guided builder');
 const browser=workflow.indexOf('name: Run deployed Chromium guided-builder walk-through');
 assert.ok(smoke>=0 && browser>smoke);
 assert.match(workflow,/NOMOS_SITE_URL:.*steps\.deployment\.outputs\.page_url/);
 assert.ok(workflow.slice(browser).includes('node --test tests/test_rule_builder_browser.cjs'));
});
