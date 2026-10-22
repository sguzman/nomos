#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {readQueue,validateQueue}=require('./profile_ideas.cjs');
const root=path.resolve(__dirname,'..');
const profilesDir=path.join(root,'profiles');
const profileIds=new Set(fs.readdirSync(profilesDir).filter(name=>/^PROFILE-\\d{4,}\\.json$/.test(name)).map(x=>x.slice(0,-5)));
try {
  const entries=readQueue();
  const errors=validateQueue(entries,{profileIds});
  if(errors.length){for(const error of errors)console.error(error);process.exitCode=1;}
  else console.log('Validated '+entries.length+' profile ideas in the inert queue.');
}catch(error){console.error(error.message);process.exitCode=1;}
