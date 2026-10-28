'use strict';
// Read-only Markdown preview for public prompts. Never changes copied/exported source text.
// Showdown 2.1.0 -> DOMPurify 3.4.15; no unsafe raw HTML is inserted.
(function(root){
  const previews=new WeakMap();
  const converter=new root.showdown.Converter({
    tables:true,tasklists:true,strikethrough:true,ghCodeBlocks:true,
    simplifiedAutoLink:true,openLinksInNewWindow:false,headerLevelStart:1
  });
  const checkbox=()=>root.document.querySelector('#profile-markdown-toggle');
  const enabled=()=>Boolean(checkbox()?.checked);
  function raw(container,text){
    const pre=root.document.createElement('pre');
    pre.className='profile-original-text';
    pre.textContent=text;
    container.append(pre);
  }
  function render(container){
    const text=previews.get(container);
    if(typeof text!=='string')throw Error('Unknown prompt preview');
    container.replaceChildren();
    if(!enabled()){raw(container,text);return;}
    const html=converter.makeHtml(text);
    const safe=root.DOMPurify.sanitize(html,{
      USE_PROFILES:{html:true},RETURN_DOM_FRAGMENT:true,
      FORBID_TAGS:['style','script','iframe','object','embed','form','button','textarea','select'],
      FORBID_ATTR:['style','id','name']
    });
    const view=root.document.createElement('div');
    view.className='profile-rendered-markdown';
    view.setAttribute('aria-label','Rendered Markdown preview');
    view.append(safe);
    for(const link of view.querySelectorAll('a')){
      // DOMPurify strips unsafe hrefs; never let preview links navigate this tab.
      link.target='_blank';link.rel='noopener noreferrer';
    }
    for(const input of view.querySelectorAll('input')){
      if(input.type==='checkbox')input.disabled=true;
      else input.remove();
    }
    for(const img of view.querySelectorAll('img')){
      img.loading='lazy';img.decoding='async';
    }
    container.append(view);
  }
  function mount(container,text){
    container.setAttribute('data-nomos-prompt-preview','');
    previews.set(container,String(text));
    render(container);
    return container;
  }
  function setText(container,text){
    if(!previews.has(container))throw Error('Unregistered prompt preview');
    previews.set(container,String(text));
    render(container);
  }
  function refresh(){
    for(const container of root.document.querySelectorAll('[data-nomos-prompt-preview]'))
      if(previews.has(container))render(container);
  }
  const toggle=checkbox();
  if(toggle)toggle.addEventListener('change',refresh);
  root.NomosPromptPreview={mount,setText,refresh};
})(typeof globalThis!=='undefined'?globalThis:window);
