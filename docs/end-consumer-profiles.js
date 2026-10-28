'use strict';
// Explicitly invoked browser-only V0 inspection; no prompt is ever executed.
(async()=>{
  const details=[...document.querySelectorAll('section[aria-label="Prompt-specific semantic reviews"] details')];
  if(!details.length)return;
  const [a,b]=await Promise.all([
    fetch('./exports/project-stewardship-v0.json'),
    fetch('./data/project-stewardship-v0-profile.json')
  ]);
  if(!a.ok||!b.ok)throw new Error('Public V0 source unavailable');
  const source=await a.json(),profile=await b.json();
  if(source.version!==1||source.entries.length!==10||
    details.length!==source.entries.length||profile.slots.length!==source.entries.length)
    throw new Error('V0 source/profile or visible prompt count mismatch');
  source.entries.forEach((entry,i)=>{
    const slot=profile.slots[i];
    if(entry.key!==slot.key||entry.label!==slot.label)
      throw new Error('Original prompt identity mismatch');
    const wrap=document.createElement('section');
    const h=document.createElement('h3');h.textContent='Original V0 prompt (unchanged)';
    const pre=document.createElement('pre');
    pre.style.whiteSpace='pre-wrap';pre.style.overflowWrap='anywhere';
    pre.textContent=entry.text;
    const copy=document.createElement('button');
    copy.type='button';copy.textContent='Copy original prompt';
    copy.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(entry.text);copy.textContent='Copied';}
      catch{copy.textContent='Copy unavailable; select original text above';}
    });
    wrap.append(h,pre,copy);
    details[i].append(wrap);
  });
})().catch(error=>{
  const note=document.createElement('p');
  note.setAttribute('role','status');
  note.textContent='Original V0 inspection unavailable: '+error.message+
    '. The keyset JSON download remains available.';
  document.querySelector('main')?.append(note);
});
