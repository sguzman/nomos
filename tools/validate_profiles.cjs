#!/usr/bin/env node
'use strict';
/* Check optional profile presets using existing published Nomos rules; no Python required. */
const fs=require('node:fs');
const path=require('node:path');
const {validate}=require('./profiles.js');
const root=path.resolve(__dirname,'..');
const rules=fs.readdirSync(path.join(root,'rules')).filter(x=>/^NOM-\d+\.json$/.test(x))
  .sort().map(x=>JSON.parse(fs.readFileSync(path.join(root,'rules',x),'utf8')));
const dir=path.join(root,'profiles');
const files=fs.readdirSync(dir).filter(x=>/^PROFILE-\d+\.json$/.test(x)).sort();
let failures=0;
const seen=new Set();
for(const file of files){
  const profile=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  if(seen.has(profile.id)) { console.error('Duplicate profile ID: '+profile.id); failures++; }
  seen.add(profile.id);
  if(file!==profile.id+'.json') { console.error(file+': filename and ID differ'); failures++; }
  const result=validate(profile,rules);
  for(const err of result.errors) { console.error(file+': '+err); failures++; }
  for(const warning of result.warnings) console.warn(file+': REVIEW '+warning);
}
if(failures) process.exitCode=1;
else console.log('Validated '+files.length+' optional profile presets (none required).');
