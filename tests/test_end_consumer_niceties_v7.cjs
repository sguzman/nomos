'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),j=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const manifest=j('docs/data/project-stewardship-published-versions.json'),old=j('end-consumer-profiles/project-stewardship/v6/selected-versions.json'),current=j('end-consumer-profiles/project-stewardship/v7/selected-versions.json'),r=j('end-consumer-profiles/project-stewardship/v7/revisions.json');
const original=j('end-consumer-profiles/project-stewardship/v0/trievium.json'),profile=j('end-consumer-profiles/project-stewardship/profile.json'),exported=j('docs/exports/project-stewardship-approved-trievium.json'),model=require('../docs/end-consumer-profile-model.js');
test('Only D/S/A versions change and every historical version is recoverable',()=>{
 assert.equal(manifest.published_versions.length,17);
 assert.deepEqual(manifest.published_versions.slice(-3).map(p=>p.key+':'+p.version),['S:5','D:5','A:3']);
 for(const s of current.selected_slots){let b=old.selected_slots.find(x=>x.key===s.key),rev=r.revisions.find(x=>x.key===s.key);if(!rev){assert.deepEqual(s,b);continue}
 let before=manifest.published_versions.find(x=>x.key===s.key&&x.version===rev.prior_version),after=manifest.published_versions.find(x=>x.key===s.key&&x.version===rev.selected_version);
 assert.equal(s.selected_version,rev.selected_version);assert.equal(s.selected_text_sha256,after.sha256);assert.equal(before.sha256,rev.prior_sha256);assert.equal(after.sha256,hash(after.text));assert.equal(after.text.replace(rev.insertion,''),before.text);assert.match(after.text,/NOM-0248/);assert.match(after.text,/NOM-0249/);
 }
 for(const p of manifest.published_versions)assert.equal(p.sha256,hash(p.text));
});
test('Current selected Trievium export matches owner-approved version catalog',()=>{
 const cat=model.makeCatalog(profile,original,manifest);assert.deepEqual(model.makeTrievium(cat),exported);
 assert.deepEqual(cat.map(p=>p.key+':'+p.defaultVersion),['J:0','L:1','S:5','H:1','D:5','K:0','A:3','F:1','G:1','U:0']);
});
