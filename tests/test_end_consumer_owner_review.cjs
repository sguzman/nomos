'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const api=require('../docs/end-consumer-review-model.js'),profile=json('end-consumer-profiles/project-stewardship/profile.json');
const feed=json('docs/data/project-stewardship-review-candidates.json'),analysis=json('end-consumer-profiles/project-stewardship/v1/analysis.json');
test('all ten proposals retain source identity and provisional status',()=>{
 const rows=api.candidates(profile,feed);assert.equal(rows.length,10);
 for(const row of rows){const x=analysis.prompts.find(a=>a.prompt_id===row.prompt_id);
   assert.equal(row.source_text_sha256,x.source.text_sha256);
   assert.equal(row.meta_intent,x.meta_intent.statement);assert.equal(row.owner_review_status,'pending');}
 assert.equal(rows.filter(r=>r.proposed_verdict==='no').length,1);
 assert.equal(rows.find(r=>r.key==='F').proposed_verdict,'no');
});
test('drafts record edits without silently authorizing publication or owner approval',()=>{
 const rows=api.candidates(profile,feed);assert.equal(api.draft(feed,rows,{}).decisions.length,0);
 const input={[rows[0].prompt_id]:{meta_response:'agree',assessment_response:'disagree',notes:'Assess stop condition'}};
 const d=api.draft(feed,rows,input);assert.equal(d.decisions.length,1);
 assert.equal(d.status,'local_unsubmitted');assert.equal(d.owner_authenticated,false);
 assert.equal(d.approval_granted,false);assert.equal(d.prompt_publication_authorized,false);
 assert.deepEqual(JSON.parse(api.serialize(feed,rows,input)),d);
});
test('invalid source, unknown slots and premature approvals fail closed',()=>{
 const rows=api.candidates(profile,feed);
 assert.throws(()=>api.candidates(profile,{...feed,rows:feed.rows.slice(1)}));
 assert.throws(()=>api.candidates(profile,{...feed,rows:feed.rows.map((r,i)=>i===0?{...r,key:'Z'}:r)}));
 assert.throws(()=>api.draft(feed,rows,{'EC-PROMPT-9999':{assessment_response:'agree'}}));
 assert.throws(()=>api.draft(feed,rows,{[rows[0].prompt_id]:{assessment_response:'approved'}}));
});
test('review worksheet is visible without enabling a submission action',()=>{
 const html=fs.readFileSync(path.join(root,'docs/end-consumer-profiles.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'docs/end-consumer-review.js'),'utf8');
 assert.match(html,/id="owner-review-download" type="button" disabled/);
 assert.equal((html.match(/id="review-slot-/g)||[]).length,10);
 assert.match(js,/api\.serialize\(feed,rows,state\)/);
 assert.doesNotMatch(js,/method:\s*['"]POST/);
});
