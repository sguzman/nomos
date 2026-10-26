'use strict';
/* Browser/Node pure guided intake: proposals are inert and never agent instructions. */
const NomosBuilder=(()=>{
  const reasoning=typeof NomosReasoning!=='undefined' ? NomosReasoning :
    (typeof module!=='undefined' ? require('./reasoning.js') : null);
  const ANSWERS=new Set(['yes','no','unknown','not_applicable']);
  const QUESTIONS=[
    {id:'public_release',question:'Will the repository or deliverables be public?',
      explanation:'Publication choices influence privacy and disclosure review.',rule_ids:['NOM-0001','NOM-0050']},
    {id:'gui',question:'Will the application have a graphical interface?',
      explanation:'A graphical interface may need keyboard and feedback verification.',rule_ids:['NOM-0234'],semantic_intent_id:'INTENT-0130'},
    {id:'configuration',question:'Will it accept runtime configuration?',
      explanation:'Configuration adds key precedence, validation and failure-path requirements.',rule_ids:['NOM-0228'],semantic_intent_id:'INTENT-0124'},
    {id:'persistence',question:'Will it persist valuable mutable user data?',
      explanation:'Persistent state adds interrupted-write and recovery requirements.',rule_ids:['NOM-0229'],semantic_intent_id:'INTENT-0125'},
    {id:'external_input',question:'Will it accept data across an external trust boundary?',
      explanation:'External inputs can require parsing, size limits and security checks.',rule_ids:['NOM-0230'],semantic_intent_id:'INTENT-0126'},
    {id:'background_workers',question:'Will it use background tasks or concurrent workers?',
      explanation:'Concurrent tasks require explicit ownership and shutdown semantics.',rule_ids:['NOM-0233'],semantic_intent_id:'INTENT-0129'},
    {id:'performance',question:'Do accepted requirements contain measurable runtime or resource budgets?',
      explanation:'Only agreed targets warrant performance measurements and budget enforcement.',rule_ids:['NOM-0232'],semantic_intent_id:'INTENT-0128'},
    {id:'diagnostics',question:'Will the application produce logs, traces or crash reports?',
      explanation:'Diagnostics must remain useful without inadvertently exposing private data.',rule_ids:['NOM-0235'],semantic_intent_id:'INTENT-0131'}
  ];
  function assertProfile(profile,rules) {
    if(!profile||profile.kind!=='rule_profile'||!Array.isArray(profile.selected_rule_ids))
      throw new Error('Choose a known profile proposal first');
    if(!Array.isArray(rules))throw new Error('Rule catalog required');
    const byId=new Map(rules.map(r=>[r.id,r]));
    if(profile.selected_rule_ids.some(id=>byId.get(id)?.status!=='published'))
      throw new Error('Source proposal contains unpublished rules');
    // Human-readable questions are grounded in reviewed rule-to-intent relationships.
    for(const question of QUESTIONS){
      if(!question.semantic_intent_id)continue;
      for(const id of question.rule_ids)if(profile.selected_rule_ids.includes(id)){
        const ids=byId.get(id)?.situational_analysis?.intent_ids||[];
        if(!ids.includes(question.semantic_intent_id))
          throw new Error('Question intent evidence changed for '+id);
      }
    }
  }
  function relevant(profile) {
    if(!profile?.selected_rule_ids)return[];
    const selected=new Set(profile.selected_rule_ids);
    // New Rust Lite may need Full-only feature obligations; show them as review suggestions,
    // never insert them into the source profile automatically.
    return QUESTIONS.filter(q=>q.rule_ids.some(id=>selected.has(id)||
      (profile.id==='PROFILE-0003'&&/^NOM-02(2[89]|3[02345])$/.test(id))));
  }
  function approvalStages(profile) {
    if(!profile||profile.kind!=='rule_profile')throw new Error('Known source profile required');
    const confirmed=profile.review?.selection_confirmed===true;
    const finalized=confirmed&&profile.status==='finalized'&&
      profile.review?.finalization_confirmed===true;
    return [
      {id:'preview',title:'Context preview',state:'current',
        explanation:'Answers and rule suggestions stay local and inert.'},
      {id:'selection',title:'Confirm exact rule selection',
        state:confirmed?'recorded':'requires_owner_decision',
        explanation:'A separate owner review of the exact source rule IDs is required.'},
      {id:'profile',title:'Finalize the profile',
        state:finalized?'recorded':'requires_owner_decision',
        explanation:'Profile finalization is a distinct recorded authorization.'},
      {id:'projection',title:'Confirm project projection',state:'not_available_here',
        explanation:'Resolve scoped conditions and conflicts, then explicitly approve the derived projection.'},
      {id:'package',title:'Review generated agent package',state:'not_available_here',
        explanation:'Inspect the manifest, instructions and destination before export.'},
      {id:'export',title:'Authorize export and agent use',state:'not_available_here',
        explanation:'Actual installation and subsequent agent evaluation require independent choices.'}
    ];
  }
  function validateAnswers(answers) {
    if(!answers||typeof answers!=='object'||Array.isArray(answers))
      throw new Error('Typed answer map required');
    const known=new Set(QUESTIONS.map(q=>q.id));
    for(const [id,value] of Object.entries(answers))
      if(!known.has(id)||!ANSWERS.has(value))throw new Error('Unsupported answer or private-text field');
  }
  function preview(profile,rules,answers,analysisContext={}) {
    assertProfile(profile,rules);validateAnswers(answers);
    const byId=new Map(rules.map(r=>[r.id,r]));
    const relevantQuestions=relevant(profile);
    const ruleQuestion=new Map();
    for(const question of relevantQuestions)
      for(const id of question.rule_ids)if(profile.selected_rule_ids.includes(id))
        ruleQuestion.set(id,question);
    const decisions=profile.selected_rule_ids.map(id=>{
      const rule=byId.get(id),question=ruleQuestion.get(id);
      const answer=question?answers[question.id]||'unknown':null;
      let status='proposed',reason='Profile suggests this source rule; actual scope remains subject to review';
      if(question) {
        if(answer==='no'||answer==='not_applicable') {
          status='excluded_candidate';reason='User reports the scoped feature is absent or not applicable';
        } else if(answer==='yes') {
          status='relevant_candidate';reason='User reports relevant feature; source conditions still apply';
        } else {
          status='unresolved_candidate';reason='Feature answer is unknown; no assumption of applicability';
        }
      }
      return {rule_id:id,title:rule.title,question_id:question?.id||null,status,reason};
    });
    const suggested_additions=[];
    if(profile.id==='PROFILE-0003'){
      for(const question of relevantQuestions){
        if(answers[question.id]!=='yes')continue;
        for(const id of question.rule_ids){
          if(profile.selected_rule_ids.includes(id))continue;
          const rule=byId.get(id);
          if(!rule||rule.status!=='published'||
            !rule.scope?.project_types?.includes('rust_project_from_scratch')||
            (question.semantic_intent_id&&!rule.situational_analysis?.intent_ids?.includes(question.semantic_intent_id)))
            throw new Error('Unreviewed feature candidate: '+id);
          suggested_additions.push({rule_id:id,title:rule.title,question_id:question.id,
            reason:'Optional addition for separate source-selection review only'});
        }
      }
    }
    const counts={proposed:0,relevant_candidate:0,excluded_candidate:0,unresolved_candidate:0};
    for(const d of decisions)counts[d.status]++;
    const analysis=reasoning ? reasoning.analyze(
      profile.selected_rule_ids.map(id=>byId.get(id)),
      {project_hierarchy:analysisContext.project_hierarchy||null},
      analysisContext.relationships||[]) : {conflicts:[],conditional:[]};
    return {decisions,counts,suggested_additions,conflict_candidates:analysis.conflicts,
      conditional_interactions:analysis.conditional};
  }
  function draft(profile,rules,answers,review={},analysisContext={}) {
    const result=preview(profile,rules,answers,analysisContext);
    if(Object.keys(review).some(key=>key!=='veto_ids'))
      throw new Error('Unsupported review decision');
    const vetoIds=review.veto_ids||[];
    if(!Array.isArray(vetoIds)||new Set(vetoIds).size!==vetoIds.length)
      throw new Error('Review veto list must contain unique source rule IDs');
    const decisionById=new Map(result.decisions.map(d=>[d.rule_id,d]));
    const ruleById=new Map(rules.map(rule=>[rule.id,rule]));
    for(const id of vetoIds) {
      const decision=decisionById.get(id);
      if(!decision||decision.status!=='excluded_candidate'||
        ruleById.get(id)?.norm?.kind==='prohibition')
        throw new Error('Only an inapplicable, nonprohibited source rule can be proposed for veto');
    }
    return {
      kind:'nomos_builder_draft',schema_version:1,status:'unapproved',
      source_profile:{id:profile.id,version:profile.version,status:profile.status,
        selection_confirmed:profile.review?.selection_confirmed===true},
      answers:Object.fromEntries(Object.entries(answers).sort(([a],[b])=>a.localeCompare(b))),
      proposed_rule_ids:[...profile.selected_rule_ids],
      suggested_addition_rule_ids:result.suggested_additions.map(x=>x.rule_id).sort(),
      proposed_veto_rule_ids:[...vetoIds].sort(),
      decision_preview:result.decisions,
      conflict_candidates:result.conflict_candidates,
      conditional_interactions:result.conditional_interactions,
      conflicts_reviewed:false,
      explicit_selection_confirmed:false,projection_approved:false,export_authorized:false,
      warning:'This is an unapproved intake preview, not an agent package, finalized profile or rule activation.'
    };
  }
  return Object.freeze({QUESTIONS,relevant,preview,draft,validateAnswers,approvalStages});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=NomosBuilder;