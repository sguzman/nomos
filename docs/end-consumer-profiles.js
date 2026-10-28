'use strict';
// Read-only published versions, explicit user-triggered copy/download. Never executes prompts.
(async()=>{
  const details=[...document.querySelectorAll('section[aria-label="Prompt-specific semantic reviews"] details')];
  if(!details.length)return;
  const output=document.querySelector('#trievium-selection-status');
  const exportFeedback=document.querySelector('#trievium-export-feedback');
  const downloadButton=document.querySelector('#download-selected-trievium');
  const copyKeysetButton=document.querySelector('#copy-selected-trievium');
  const responses=await Promise.all([
    fetch('./exports/project-stewardship-v0.json'),
    fetch('./data/project-stewardship-v0-profile.json'),
    fetch('./data/project-stewardship-published-versions.json')
  ]);
  if(responses.some(r=>!r.ok))throw new Error('Published prompt sources unavailable');
  const [source,profile,manifest]=await Promise.all(responses.map(r=>r.json()));
  const api=globalThis.NomosEndConsumer;
  const preview=globalThis.NomosPromptPreview;
  if(!preview)throw new Error('Markdown preview support unavailable');
  if(!api)throw new Error('Prompt-version library unavailable');
  const catalog=api.makeCatalog(profile,source,manifest);
  if(catalog.length!==10||details.length!==catalog.length)throw new Error('Visible prompt count mismatch');

  // GitHub Pages is HTTPS; verify exact text hashes before enabling any export.
  if(!globalThis.crypto?.subtle)throw new Error('Secure SHA-256 integrity verification unavailable');
  async function sha256(text){
    const bytes=new TextEncoder().encode(text);
    const buffer=await crypto.subtle.digest('SHA-256',bytes);
    return [...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  for(const slot of catalog)for(const version of slot.versions){
    if(await sha256(version.text)!==version.sha256)
      throw new Error('Prompt text checksum mismatch: '+slot.id+' v'+version.version);
  }
  const selections=Object.create(null);
  const status=()=>{
    const alternatives=catalog.filter(x=>x.versions.length>1).length;
    const changes=catalog.filter(x=>(selections[x.id]||x.defaultVersion)!=='0').length;
    output.textContent=catalog.length+' slots · '+changes+' non-original selected · '+
      alternatives+' slots with approved alternatives';
  };
  for(let i=0;i<catalog.length;i++){
    const slot=catalog[i],entry=source.entries[i];
    selections[slot.id]=slot.defaultVersion;
    const wrap=document.createElement('section');
    const h=document.createElement('h3');h.textContent='Published prompt version';
    const label=document.createElement('label');
    label.textContent='Available approved versions for '+slot.label+': ';
    const select=document.createElement('select');
    select.setAttribute('aria-label','Published version for '+slot.label);
    slot.versions.forEach(v=>{
      const option=document.createElement('option');
      option.value=v.version;option.textContent=v.label;
      select.append(option);
    });
    select.value=slot.defaultVersion;
    label.append(select);
    const pre=document.createElement('div');
    pre.className='profile-prompt-view';
    preview.mount(pre,entry.text);
    const copy=document.createElement('button');
    copy.type='button';copy.textContent='Copy selected prompt';
    copy.addEventListener('click',async()=>{
      const selected=slot.versions.find(v=>v.version===selections[slot.id]);
      try{await navigator.clipboard.writeText(selected.text);copy.textContent='Copied';}
      catch{copy.textContent='Copy unavailable; select prompt text above';}
    });
    const comparison=document.createElement('section');
    const comparisonHeading=document.createElement('h4');
    comparisonHeading.textContent='Compare with original V0';
    const comparisonNote=document.createElement('p');
    const comparePre=document.createElement('div');
    comparePre.className='profile-prompt-view';
    preview.mount(comparePre,entry.text);
    comparison.append(comparisonHeading,comparisonNote,comparePre);
    const redraw=()=>{
      const selected=slot.versions.find(v=>v.version===selections[slot.id]);
      preview.setText(pre,selected.text);copy.textContent='Copy selected prompt';
      comparison.hidden=selected.version==='0';
      if(!comparison.hidden)comparisonNote.textContent='Original V0 below; selected V'+selected.version+' above. Both are published immutable snapshots.';
      status();
    };
    select.addEventListener('change',()=>{
      selections[slot.id]=select.value;redraw();
    });
    if(slot.versions.length===1){
      const note=document.createElement('p');
      note.textContent='No owner-approved alternate prompt version exists. Proposed V1 semantics are analysis, not another prompt.';
      wrap.append(h,label,note,pre,copy,comparison);
    }else wrap.append(h,label,pre,copy,comparison);
    details[i].append(wrap);
    redraw();
  }
  status();
  copyKeysetButton.disabled=false;
  downloadButton.disabled=false;
  copyKeysetButton.addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText(api.serializeTrievium(catalog,selections));
      exportFeedback.textContent='Selected Trievium keyset copied. Repository selection unchanged.';
    }catch{exportFeedback.textContent='Clipboard unavailable; use the download control instead.';}
  });
  downloadButton.addEventListener('click',()=>{
    const data=api.serializeTrievium(catalog,selections);
    const blob=new Blob([data],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='project-stewardship-selected-trievium.json';
    a.style.display='none';document.body.append(a);a.click();a.remove();
    // Give Chromium time to consume the object URL before reclaiming it.
    setTimeout(()=>URL.revokeObjectURL(url),3000);
    exportFeedback.textContent='Selected Trievium keyset downloaded. Repository selection unchanged.';
  });
})().catch(error=>{
  const note=document.createElement('p');
  note.setAttribute('role','alert');
  note.textContent='Published prompt selector unavailable: '+error.message+
    '. Exact original V0 keyset download remains available.';
  document.querySelector('#trievium-version-export')?.append(note);
});
