#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
function check(rootDir=root){
 const read=f=>JSON.parse(fs.readFileSync(path.join(rootDir,f),'utf8'));
 const ppath='profiles/PROFILE-0012.json';
 const raw=fs.readFileSync(path.join(rootDir,ppath),'utf8'),p=JSON.parse(raw);
 const file='audits/strict-port-coverage-2026-10-25.json',a=read(file);
 const gitsha=crypto.createHash('sha1').update('blob '+Buffer.byteLength(raw)+'\0'+raw).digest('hex');
 const fail=s=>{throw Error('Strict-port audit invalid: '+s)};
 if(a.kind!=='non_normative_coverage_study'||a.status!=='analytical_review_only')fail('status');
 if(a.reviewed_profile.id!==p.id||a.reviewed_profile.source_git_blob_sha!=='e441f5a64a97081b66d966647966217c34531983' ||
    a.reviewed_profile.selected_rule_count!==90||
    p.status!=='draft'||p.review.selection_confirmed!==false)fail('source profile drift');
 if(a.pinned_baseline.derived_situations!==27||a.pinned_baseline.derived_intents!==37)fail('baseline counts');
 const selected=new Set(p.selected_rule_ids);
 if(selected.size<90)fail('source profile no longer has the reviewed 90 rules');
 const allIds=new Set(fs.readdirSync(path.join(rootDir,'rules')).filter(f=>/^NOM-\d+\.json$/.test(f)).map(f=>f.slice(0,-5)));
 if(allIds.size<137 || Array.from({length:137},(_,i)=>'NOM-'+String(i+1).padStart(4,'0')).some(id=>!allIds.has(id)))fail('source catalog count drift');
 const referenceKeys=new Set(Object.keys(a.sources));
 if(a.candidates.length!==25)fail('expected 25 reviewed candidates');
 const keys=new Set();
 for(const x of a.candidates){
  if(!/^(PORT|PY)-\d{2}$/.test(x.id)||keys.has(x.id))fail('duplicate/invalid candidate '+x.id);
  keys.add(x.id);
  if(x.applicability_scope!==(x.id.startsWith('PORT')?'software_port':'python_to_rust_port'))fail('incorrect scope '+x.id);
  if(!x.heading||!x.atomic_proposal||!x.source_applicability||!x.family||!x.priority)fail('incomplete candidate '+x.id);
  if(!['unrepresented_as_atomic_rule','partially_covered_by_existing_rules'].includes(x.disposition))fail('invalid disposition '+x.id);
  if(!x.existing_support_ids.length||new Set(x.existing_support_ids).size!==x.existing_support_ids.length)fail('invalid support '+x.id);
  if(x.existing_support_ids.some(id=>!selected.has(id)))fail('support not selected '+x.id);
  if(x.language_specific_analogues.some(id=>!allIds.has(id)||selected.has(id)))fail('invalid analogue '+x.id);
  if(!x.reference_keys.length||x.reference_keys.some(k=>!referenceKeys.has(k)))fail('missing external evidence '+x.id);
  if(!x.transfer_to_profiles.length||x.transfer_to_profiles.some(id=>!/^PROFILE-\d{4}$/.test(id)))fail('invalid scope targets '+x.id);
 }
 for(const x of a.existing_rule_review){
  if(!allIds.has(x.id)||selected.has(x.id)||!x.reason)fail('bad proposed selection '+x.id);
 }
  if(!a.atomicity_review||a.atomicity_review.status!=='analytical_disposition_only'||a.atomicity_review.entries.length!==25)fail('missing atomicity review');
  const reviewIds=new Set(),reviewDispositions=new Set(['single_candidate','decompose','reuse_existing']);
  for(const x of a.atomicity_review.entries){
    if(reviewIds.has(x.id)||!keys.has(x.id)||!reviewDispositions.has(x.disposition))fail('invalid atomicity disposition '+x.id);
    reviewIds.add(x.id);
    if(!x.rationale||x.status!=='proposed_not_authorized_to_publish'||!Array.isArray(x.normalized_parts)||!Array.isArray(x.comparison_rules))fail('incomplete review '+x.id);
    if(x.disposition==='reuse_existing'&&x.normalized_parts.length!==0)fail('duplicate-rule recommendation '+x.id);
    if(x.disposition!=='reuse_existing'&&x.normalized_parts.length===0)fail('missing proposed normalization '+x.id);
    if(x.comparison_rules.some(id=>!allIds.has(id)))fail('unknown comparison rule '+x.id);
  }
 for(const x of a.shared_analogues){
  const rule=read('rules/'+x.id+'.json');
  if(rule.status!=='published'||rule.scope.project_types.length!==1||
    rule.scope.project_types[0]!=='c_to_rust_port')fail('analogue scope drift '+x.id);
 }
 if(!a.boundaries.no_new_rule_records||!a.boundaries.no_profile_membership_changes||
    !a.boundaries.no_user_approval_implied||!a.boundaries.no_external_port_executed)fail('authorization boundary');
 return {candidate_count:keys.size,general:[...keys].filter(k=>k.startsWith('PORT')).length,python:[...keys].filter(k=>k.startsWith('PY')).length};
}
if(require.main===module){try{console.log('Validated strict-port coverage study:',JSON.stringify(check()));}
 catch(e){console.error(e.message);process.exitCode=1}}
module.exports={check};
