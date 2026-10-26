'use strict';
/* No localStorage, network writes, silent profile selection or instruction export. */
(()=>{
  const $=id=>document.getElementById(id);
  const area=$('builder-body'),bar=$('builder-progress'),status=$('builder-status');
  const controls=$('builder-controls'),back=$('builder-back'),next=$('builder-next');
  const state={catalog:null,profileId:null,answers:{},vetoIds:new Set(),step:0};
  const node=(name,text,className)=>{
    const n=document.createElement(name);
    if(text!==undefined)n.textContent=text;
    if(className)n.className=className;
    return n;
  };
  const clear=()=>area.replaceChildren();
  function profiles() {
    return (state.catalog?.profiles||[]).filter(p=>p.kind==='rule_profile');
  }
  function currentProfile(){return profiles().find(p=>p.id===state.profileId)||null;}
  function questions(){return NomosBuilder.relevant(currentProfile());}
  function choice(question) {
    const answers=[['yes','Yes'],['no','No'],['unknown','Not sure yet'],
      ['not_applicable','Not applicable']];
    const wrap=node('fieldset',undefined,'builder-answers');
    wrap.append(node('legend','Choose one answer'));
    for(const [value,text] of answers) {
      const label=node('label',undefined,'builder-answer');
      const radio=document.createElement('input');
      radio.type='radio';radio.name='builder-answer';radio.value=value;
      radio.checked=(state.answers[question.id]||'')===value;
      radio.addEventListener('change',()=>{state.answers[question.id]=value;state.vetoIds.clear();render();});
      label.append(radio,node('span',text));wrap.append(label);
    }
    return wrap;
  }
  function renderChoose() {
    area.append(node('h2','What kind of project are you working on?'));
    area.append(node('p','Choose a proposed rule profile as a starting reference. Profiles marked draft are not approved or active.','builder-secondary'));
    const field=node('label',undefined,'builder-select');
    field.append(node('span','Project / profile'));
    const select=document.createElement('select');
    select.setAttribute('aria-label','Choose an optional profile');
    const blank=document.createElement('option');blank.value='';blank.textContent='Choose a project type…';
    select.append(blank);
    for(const p of profiles()){
      const option=document.createElement('option');
      option.value=p.id;option.textContent=p.title+' · '+p.selected_rule_ids.length+' proposed rules';
      select.append(option);
    }
    select.value=state.profileId||'';
    select.addEventListener('change',()=>{
      state.profileId=select.value||null;state.answers={};state.vetoIds.clear();state.step=0;render();
    });
    field.append(select);area.append(field);
    if(currentProfile()) {
      const p=currentProfile();
      area.append(node('p',p.id+' · '+p.status.toUpperCase()+' · Selection confirmation: '+
        (p.review?.selection_confirmed?'recorded':'not recorded'),'builder-note'));
    }
  }
  function renderQuestion(question) {
    area.append(node('div','Project context','builder-kicker'));
    area.append(node('h2',question.question));
    area.append(node('p',question.explanation,'builder-secondary'));
    area.append(choice(question));
    const ids=question.rule_ids.filter(id=>currentProfile().selected_rule_ids.includes(id));
    area.append(node('p',(ids.length?'Current profile members: '+ids.join(', '):'Potential optional source-rule addition for later review')+'. Answers provide context but never silently add or activate rules.','builder-note'));
  }
  function renderReview() {
    const p=currentProfile();
    const view=NomosBuilder.preview(p,state.catalog.rules,state.answers,
      {project_hierarchy:state.catalog.project_hierarchy,relationships:state.catalog.relationships});
    area.append(node('h2','Review your proposed rules'));
    area.append(node('p','This is a preview of how project answers affect a proposed profile. No profile is finalized and no instructions are activated.','builder-secondary'));
    const summary=node('div',undefined,'builder-summary');
    for(const [label,count] of [
      ['Potentially relevant',view.counts.relevant_candidate],
      ['Excluded by answers',view.counts.excluded_candidate],
      ['Unresolved',view.counts.unresolved_candidate],
      ['Other proposed rules',view.counts.proposed]
    ]) {
      const card=node('div',undefined,'builder-summary-stat');
      card.append(node('strong',String(count)),node('span',label));summary.append(card);
    }
    area.append(summary);
    const stages=node('section',undefined,'builder-approval-stages');
    stages.setAttribute('aria-label','Approval and deployment stages');
    stages.append(node('h3','Approval path: no automatic activation'));
    const steps=node('ol',undefined,'builder-stage-list');
    for(const item of NomosBuilder.approvalStages(p)){
      const li=node('li',undefined,'builder-stage');
      const title=node('strong',item.title);
      const state=node('span',item.state.replaceAll('_',' '),'builder-stage-state');
      const desc=node('p',item.explanation,'builder-secondary');
      li.append(title,state,desc);steps.append(li);
    }
    stages.append(steps);
    area.append(stages);
    if(view.suggested_additions.length){
      const suggestions=node('div',undefined,'builder-detail');
      suggestions.append(node('strong',view.suggested_additions.length+' optional rule addition(s) to review'));
      const list=node('ul',undefined,'builder-rule-list');
      for(const item of view.suggested_additions){
        const row=node('li');
        row.append(node('strong',item.rule_id+' — '+item.title),
          node('span','Suggested only; source profile membership remains unchanged'));
        list.append(row);
      }
      suggestions.append(list);area.append(suggestions);
    }
    const details=node('details',undefined,'builder-detail');
    details.append(node('summary','Inspect all '+view.decisions.length+' source-rule decisions'));
    const list=node('ul',undefined,'builder-rule-list');
    for(const item of view.decisions){
      const row=node('li');
      row.append(node('strong',item.rule_id+' — '+item.title),
        node('span',' '+item.status.replace(/_/g,' ')+' · '+item.reason));
      list.append(row);
    }
    details.append(list);area.append(details);
    const interactions=[...view.conflict_candidates.map(message=>({type:'Potential conflict',message})),
      ...view.conditional_interactions.map(message=>({type:'Conditional interaction',message}))];
    if(interactions.length){
      const review=node('details',undefined,'builder-detail');
      review.append(node('summary','Review '+interactions.length+' possible normative interactions'));
      const risks=node('ul',undefined,'builder-rule-list');
      for(const item of interactions){
        const line=node('li');
        line.append(node('strong',item.type),node('span',item.message));risks.append(line);
      }
      review.append(risks);area.append(review);
      area.append(node('p','Candidate relationships do not establish final legal or logical consistency. Opposing rules require a separate explicit resolution before agent export.','builder-note'));
    }
    const candidates=view.decisions.filter(item=>item.status==='excluded_candidate' &&
      state.catalog.rules.find(rule=>rule.id===item.rule_id)?.norm?.kind!=='prohibition');
    if(candidates.length){
      const review=node('fieldset',undefined,'builder-answers');
      review.append(node('legend','Optional veto suggestions for later owner review'));
      review.append(node('p','These checkboxes only record proposed exclusions in the unapproved draft. They do not alter the source profile.','builder-note'));
      for(const item of candidates){
        const label=node('label',undefined,'builder-answer');
        const input=document.createElement('input');
        input.type='checkbox';input.value=item.rule_id;
        input.checked=state.vetoIds.has(item.rule_id);
        input.addEventListener('change',()=>{
          if(input.checked)state.vetoIds.add(item.rule_id);
          else state.vetoIds.delete(item.rule_id);
        });
        label.append(input,node('span','Propose excluding '+item.rule_id+' from this project context'));
        review.append(label);
      }
      area.append(review);
    }
    const download=node('button','Download unapproved draft configuration','builder-download');
    download.type='button';
    download.addEventListener('click',()=>{
      const output=NomosBuilder.draft(p,state.catalog.rules,state.answers,{veto_ids:[...state.vetoIds]},
        {project_hierarchy:state.catalog.project_hierarchy,relationships:state.catalog.relationships});
      const blob=new Blob([JSON.stringify(output,null,2)+'\n'],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download='nomos-builder-draft.json';
      document.body.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),3000);
    });
    area.append(download,node('p','This JSON is not AGENTS.md and cannot activate or install a rule package. Approval and actual agent export are separate future steps.','builder-note'));
  }
  function render(){
    if(!state.catalog)return;
    clear();
    const total=questions().length+2;const index=Math.min(state.step,total-1);
    bar.max=total;bar.value=index+1;
    status.textContent='Step '+(index+1)+' of '+total;
    if(state.step===0)renderChoose();
    else if(state.step<=questions().length)renderQuestion(questions()[state.step-1]);
    else renderReview();
    back.disabled=state.step===0;
    next.hidden=state.step===total-1;
    const active=questions()[state.step-1];
    next.disabled=state.step===0?!currentProfile():Boolean(active&&!state.answers[active.id]);
    next.textContent=state.step===total-2?'Review proposed rules':'Continue';
  }
  back.addEventListener('click',()=>{if(state.step>0){state.step--;render();}});
  next.addEventListener('click',()=>{
    if(!state.catalog||next.disabled)return;
    const total=questions().length+2;
    if(state.step<total-1){state.step++;render();}
  });
  fetch('./catalog.json').then(response=>{
    if(!response.ok)throw new Error('Catalog fetch '+response.status);
    return response.json();
  }).then(catalog=>{
    state.catalog=catalog;
    $('builder-loading').hidden=true;
    controls.hidden=false;
    render();
  }).catch(error=>{
    $('builder-loading').textContent='Unable to load the public Nomos catalog. '+error.message;
    controls.hidden=true;
  });
})();