'use strict';
async function showProfile(){
  const list=document.getElementById('prompt-list');
  const notice=document.getElementById('status');
  const [profileResponse,sourceResponse]=await Promise.all([
    fetch('./data/project-stewardship-v0-profile.json'),
    fetch('./exports/project-stewardship-v0.json')
  ]);
  if(!profileResponse.ok||!sourceResponse.ok)throw new Error('Public V0 source unavailable');
  const profile=await profileResponse.json();
  const source=await sourceResponse.json();
  if(profile.current_version!=='0'||source.version!==1||
     profile.slots.length!==source.entries.length)throw new Error('Version or count mismatch');
  for(let i=0;i<source.entries.length;i++){
    const entry=source.entries[i],slot=profile.slots[i];
    if(entry.key!==slot.key||entry.label!==slot.label)throw new Error('Slot mismatch');
    const card=document.createElement('article');
    card.className='prompt-card';
    const heading=document.createElement('h2');
    heading.textContent=entry.label+' · '+entry.key;
    const identity=document.createElement('p');
    identity.className='small';
    identity.textContent=slot.id+' · V0 · Unanalyzed original';
    const body=document.createElement('pre');
    body.textContent=entry.text;
    const copy=document.createElement('button');
    copy.type='button';copy.textContent='Copy original prompt';
    copy.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(entry.text);notice.textContent='Copied '+entry.key;}
      catch{notice.textContent='Clipboard denied; select and copy the displayed text.';}
    });
    card.append(heading,identity,body,copy);list.append(card);
  }
  notice.textContent=source.entries.length+' original prompts loaded. No semantic analysis or rewriting.';
}
showProfile().catch(error=>{
  document.getElementById('status').textContent='Could not load V0 profile: '+error.message;
});
