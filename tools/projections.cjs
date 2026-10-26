'use strict';
/* Conservative derived projections; no network, automatic approval, profile mutation, or hidden rule additions. */
const {createHash}=require('node:crypto');
const reasoning=require('../docs/reasoning.js');
const OUTCOMES=new Set(['include','exclude','conditional','blocked','unresolved']);
const FEATURES=new Set(['yes','no','unknown','not_applicable']);
const PHASES=new Set(['planning','implementation','testing','release','maintenance','unspecified']);
const AXES=['channel','visibility','artifact_kind','actor'];
function sha(value) {return createHash('sha256').update(JSON.stringify(value)).digest('hex');}
function sourceFingerprint(rule) {
  // The site adds registry and reverse-link projections; neither changes the canonical rule.
  const {registry, situational_analysis, ...canonical}=rule;
  return sha(canonical);
}
function guard(cond,msg) {if(!cond)throw new Error(msg);}
function validateContext(context,hierarchy) {
  guard(context?.kind==='project_context'&&context.version==='1.0.0','Invalid context kind/version');
  guard(Array.isArray(context.project_types)&&context.project_types.length>0&&
    new Set(context.project_types).size===context.project_types.length,'Missing or duplicate project type');
  guard(typeof context.types_exhaustive==='boolean','Project-type completeness must be explicit');
  guard(PHASES.has(context.phase),'Invalid work phase');
  guard(context.axes && typeof context.axes==='object'&&!Array.isArray(context.axes) &&
    Object.keys(context.axes).every(k=>AXES.includes(k)&&typeof context.axes[k]==='string'),
    'Invalid scope axes');
  guard(context.features && typeof context.features==='object'&&!Array.isArray(context.features) &&
    Object.entries(context.features).every(([k,v])=>/^[a-z][a-z0-9_]*$/.test(k)&&FEATURES.has(v)),
    'Invalid project feature answers');
  const known=new Set((hierarchy?.types||[]).map(x=>x.id));
  guard(context.project_types.every(t=>known.has(t)),'Unknown project type in context');
}
function ancestry(ids,hierarchy) {
  const byId=new Map(hierarchy.types.map(t=>[t.id,t]));
  const out=new Set(),queue=[...ids];
  while(queue.length) {
    const id=queue.pop();
    guard(byId.has(id),'Unknown hierarchy type '+id);
    if(out.has(id))continue;
    out.add(id);
    queue.push(...(byId.get(id).parents||[]));
  }
  return out;
}
function projectScope(rule,ctx,hierarchy) {
  const actual=ancestry(ctx.project_types,hierarchy);
  const permitted=rule.scope?.project_types||['any'];
  if(!permitted.includes('any')&&!permitted.some(t=>actual.has(t))) {
    if(ctx.types_exhaustive)return {decision:'exclude',reason:'Explicit exhaustive project types do not match rule scope'};
    const index=new Map(hierarchy.types.map(t=>[t.id,t]));
    const disjoint=ctx.project_types.every(t=>permitted.every(p=>
      (index.get(t)?.exclusive_with||[]).includes(p)||(index.get(p)?.exclusive_with||[]).includes(t)));
    return disjoint ?
      {decision:'exclude',reason:'Project scope explicitly disjoint in the controlled hierarchy'} :
      {decision:'unresolved',reason:'Unlisted project facet may overlap; types are not exhaustive'};
  }
  for(const key of AXES) {
    const allowed=rule.scope?.axes?.[key]||['any'];
    if(allowed.includes('any'))continue;
    if(!Object.prototype.hasOwnProperty.call(ctx.axes,key))
      return {decision:'unresolved',reason:'Unknown scope axis: '+key};
    if(!allowed.includes(ctx.axes[key]))
      return {decision:'exclude',reason:'Explicit scope axis '+key+' is outside rule applicability'};
  }
  return null;
}
function applicability(rule,ctx,hierarchy,bindings,hash) {
  const scope=projectScope(rule,ctx,hierarchy);
  if(scope)return scope;
  const conditional=Boolean(rule.norm?.conditions?.length||rule.norm?.exceptions?.length||
    rule.scope?.preconditions?.length||rule.scope?.exclusions?.length);
  const binding=bindings[rule.id];
  if(binding) {
    guard(binding.reviewed===true,'Unreviewed applicability binding for '+rule.id);
    guard(binding.source_sha256===hash,'Stale applicability binding for '+rule.id);
    guard(Array.isArray(binding.features) && binding.features.length,
      'Missing typed gates for '+rule.id);
    const answers=binding.features.map(f=>{
      guard(typeof f.key==='string'&&FEATURES.has(f.required),'Invalid binding feature for '+rule.id);
      return [f,ctx.features[f.key]||'unknown'];
    });
    if(answers.some(([f,v])=>(v==='no'||v==='not_applicable')&&f.required==='yes'))
      return {decision:'exclude',reason:'Explicit negative answer to reviewed feature gate'};
    if(answers.some(([f,v])=>v==='unknown'))
      return {decision:'conditional',reason:'Reviewed feature gate remains unanswered'};
    if(answers.some(([f,v])=>v!==f.required))
      return {decision:'conditional',reason:'Reviewed feature gate is not satisfied'};
    if(conditional && binding.covers_all_clauses!==true)
      return {decision:'conditional',reason:'Other original conditions or exceptions remain unresolved'};
    return {decision:'include',reason:'Project scope and reviewed typed feature gates match; retain original source wording'};
  }
  return conditional ?
    {decision:'conditional',reason:'Natural-language conditions/exceptions require scoped interpretation; no verified typed binding'} :
    {decision:'include',reason:'Published selected rule and known project scope match without unresolved conditions'};
}
function decide({catalog,hierarchy,selection,context,bindings={},overrides=[],approval={}}) {
  guard(Array.isArray(catalog?.rules),'Published rule catalog required');
  guard(Array.isArray(hierarchy?.types),'Controlled project hierarchy required');
  validateContext(context,hierarchy);
  guard(selection && ['profile','rules'].includes(selection.type),'Explicit source selection required');
  const byId=new Map(catalog.rules.map(r=>[r.id,r]));
  let profile=null, ids=[];
  if(selection.type==='profile') {
    profile=(catalog.profiles||[]).find(p=>p.id===selection.profile_id);
    guard(Boolean(profile),'Unknown rule profile');
    ids=[...profile.selected_rule_ids];
  } else {
    guard(Array.isArray(selection.rule_ids),'Ad hoc selection needs exact rule IDs');
    ids=[...selection.rule_ids];
  }
  guard(ids.length>0 && ids.length===new Set(ids).size,'Empty or duplicated source selection');
  guard(ids.every(id=>typeof id==='string'&&/^NOM-\d{4,}$/.test(id) &&
    byId.has(id)&&byId.get(id).status==='published'&&byId.get(id).registry==='catalog'),
    'Only explicitly selected, canonical published rules may be projected');
  const approvals={
    source_selection_confirmed:approval.source_selection_confirmed===true,
    project_context_reviewed:approval.project_context_reviewed===true,
    projection_confirmed:approval.projection_confirmed===true
  };
  const approvedRequest=Object.values(approvals).every(Boolean);
  if(profile && approvedRequest)
    guard(profile.status==='finalized'&&profile.review?.selection_confirmed===true&&
      profile.review?.finalization_confirmed===true,
      'An unconfirmed/draft profile cannot become an approved projection');
  guard(!Object.values(approvals).some(Boolean)||Object.values(approvals).every(Boolean),
    'Partial declarations are preview-only: do not forge approval transitions');
  guard(bindings&&typeof bindings==='object'&&!Array.isArray(bindings),'Bad reviewed bindings');
  guard(Array.isArray(overrides),'Overrides must be a reviewed list');
  const overrideById=new Map();
  for(const ov of overrides) {
    guard(ids.includes(ov.rule_id)&&ov.decision==='exclude'&&
      typeof ov.reason==='string'&&ov.reason.trim().length>=8&&!overrideById.has(ov.rule_id),
      'Invalid, additional or duplicated projection override');
    overrideById.set(ov.rule_id,ov);
  }
  const ruleIds=[...ids].sort();
  const decisions=ruleIds.map(id=>{
    const rule=byId.get(id), hash=sourceFingerprint(rule);
    const base=applicability(rule,context,hierarchy,bindings,hash);
    const override=overrideById.get(id);
    const overridden=override ? {
      decision:rule.norm.kind==='prohibition' ? 'blocked' : 'exclude',
      reason:rule.norm.kind==='prohibition' ?
        'Prohibition cannot be silently vetoed by a projection-level override' :
        'Explicit project-specific selection veto: '+override.reason
    }:base;
    guard(OUTCOMES.has(overridden.decision),'Unknown applicability decision');
    return {
      rule_id:id,rule_version:rule.version,source_sha256:hash,
      decision:overridden.decision,reason:overridden.reason,
      situation_ids:[...(rule.situational_analysis?.situation_ids||[])].sort(),
      intent_ids:[...(rule.situational_analysis?.intent_ids||[])].sort()
    };
  });
  const selected=decisions.filter(d=>['include','conditional'].includes(d.decision))
    .map(d=>byId.get(d.rule_id));
  const analysis=reasoning.analyze(selected,{project_hierarchy:hierarchy},catalog.relationships||[]);
  const blockers=decisions.filter(d=>d.decision==='blocked'||d.decision==='unresolved')
    .map(d=>d.rule_id+': '+d.reason);
  blockers.push(...analysis.conflicts);
  const p={
    schema_version:1,kind:'rule_projection',status:'preview',
    source:{
      type:selection.type,profile_id:profile?.id||null,profile_version:profile?.version||null,
      rule_ids:ruleIds,digest_sha256:sha(ruleIds.map(id=>({id,hash:sourceFingerprint(byId.get(id))})))
    },
    context:JSON.parse(JSON.stringify(context)),
    approval:approvals,decisions,
    conflicts:[...analysis.conflicts,...analysis.conditional],blockers
  };
  if(approvedRequest) {
    guard(!blockers.length,'Projection approval blocked: '+blockers.join('; '));
    p.status='approved';
  }
  return p;
}
module.exports={decide,sha,sourceFingerprint,validateContext,ancestry,projectScope,applicability};
