'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const NomosBuilder=require('../docs/builder-logic.js');
const catalog=require('../docs/catalog.json');
const profile=id=>catalog.profiles.find(p=>p.id===id);
test('builder asks only questions connected to selected canonical source IDs',()=>{
 const rust=NomosBuilder.relevant(profile('PROFILE-0004'));
 assert.ok(rust.length>4&&rust.length<=NomosBuilder.QUESTIONS.length);
 assert.ok(rust.some(q=>q.id==='gui'));
 const lite=NomosBuilder.relevant(profile('PROFILE-0003'));
 assert.ok(lite.length<rust.length);
 for(const q of rust)assert.ok(q.rule_ids.some(id=>profile('PROFILE-0004').selected_rule_ids.includes(id)));
});
test('yes and no answers change a proposal without activating unrelated rules',()=>{
 const p=profile('PROFILE-0004');
 const preview=NomosBuilder.preview(p,catalog.rules,{gui:'no',persistence:'yes'});
 assert.equal(preview.decisions.length,p.selected_rule_ids.length);
 assert.equal(preview.decisions.find(d=>d.rule_id==='NOM-0234').status,'excluded_candidate');
 assert.equal(preview.decisions.find(d=>d.rule_id==='NOM-0229').status,'relevant_candidate');
 assert.ok(preview.decisions.some(d=>d.status==='proposed'));
});
test('unknown and not applicable remain distinct, neither implies affirmative scope',()=>{
 const p=profile('PROFILE-0004');
 const uncertain=NomosBuilder.preview(p,catalog.rules,{gui:'unknown'});
 assert.equal(uncertain.decisions.find(d=>d.rule_id==='NOM-0234').status,'unresolved_candidate');
 const excluded=NomosBuilder.preview(p,catalog.rules,{gui:'not_applicable'});
 assert.equal(excluded.decisions.find(d=>d.rule_id==='NOM-0234').status,'excluded_candidate');
});
test('downloaded draft never claims a selected or approved production profile',()=>{
 const result=NomosBuilder.draft(profile('PROFILE-0004'),catalog.rules,{gui:'yes'});
 assert.equal(result.status,'unapproved');
 assert.equal(result.source_profile.status,'draft');
 assert.equal(result.source_profile.selection_confirmed,false);
 assert.equal(result.explicit_selection_confirmed,false);
 assert.equal(result.projection_approved,false);
 assert.equal(result.export_authorized,false);
 assert.deepEqual(result.proposed_rule_ids,profile('PROFILE-0004').selected_rule_ids);
});
test('disallows arbitrary private free text in browser draft answers',()=>{
 assert.throws(()=>NomosBuilder.draft(profile('PROFILE-0004'),catalog.rules,{private_notes:'secret'}),/Unsupported/);
 assert.throws(()=>NomosBuilder.preview(profile('PROFILE-0004'),catalog.rules,{gui:'probably'}),/Unsupported/);
});
test('browser logic refuses proposed rule IDs that are no longer published',()=>{
 const bad={...profile('PROFILE-0004'),selected_rule_ids:['NOM-0002']};
 assert.throws(()=>NomosBuilder.preview(bad,catalog.rules,{}),/unpublished/);
});
test('preview determinism and source title match are independent of UI rendering',()=>{
 const p=profile('PROFILE-0004');
 assert.deepEqual(NomosBuilder.draft(p,catalog.rules,{gui:'yes',persistence:'no'}),
                  NomosBuilder.draft(p,catalog.rules,{persistence:'no',gui:'yes'}));
 assert.ok(NomosBuilder.preview(p,catalog.rules,{}).decisions.every(d=>typeof d.title==='string'&&d.title.length>0));
});
