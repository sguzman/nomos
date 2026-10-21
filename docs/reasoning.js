'use strict';
/* Pure, dependency-free, conservative rule comparison: no priority shortcuts. */
const NomosReasoning = (() => {
  const axes = ['channel', 'visibility', 'artifact_kind', 'actor'];
  function overlaps(a,b) {
    return axes.every(key=>{
      const x=a.scope.axes[key],y=b.scope.axes[key];
      return x.includes('any')||y.includes('any')||x.some(v=>y.includes(v));
    });
  }
  function samePredicate(a,b) {
    return ['action','object','target'].every(k=>a.norm.predicate[k]===b.norm.predicate[k]);
  }
  function values(a,b,context={}) {
    const x=a.norm.value_constraint,y=b.norm.value_constraint;
    if(!x||!y||x.field!==y.field) return 'unspecified';
    const resolve=v=>v.operator==='equals'?v.value:context.latest_stable_supported_edition;
    const left=resolve(x),right=resolve(y);
    if(left==null||right==null) return 'dynamic_unknown';
    if(String(left)!==String(right)) return 'different';
    if(x.operator!=='equals'||y.operator!=='equals') return 'dynamic_equal';
    return 'equal';
  }
  function assess(a,b,context={}) {
    if(!overlaps(a,b)) return 'disjoint';
    if(!samePredicate(a,b)) return 'unrelated';
    const kinds=new Set([a.norm.kind,b.norm.kind]);
    const relation=values(a,b,context);
    if(kinds.has('prohibition')&&kinds.has('obligation')) return 'conflict';
    if(kinds.has('prohibition')&&kinds.has('permission')) {
      const p=a.norm.kind==='permission'?a:b;
      return p.norm.permission_strength==='strong'?'conflict':'overlap';
    }
    if(kinds.size===1&&kinds.has('obligation')) {
      if(relation==='different')return 'conflict';
      if(relation==='dynamic_unknown'||relation==='dynamic_equal')return 'conditional';
    }
    if(kinds.has('obligation')&&kinds.has('permission')) {
      const p=a.norm.kind==='permission'?a:b;
      if(p.norm.permission_strength==='strong') {
        if(relation==='different')return 'conflict';
        if(relation==='dynamic_unknown'||relation==='dynamic_equal')return 'conditional';
      }
    }
    return 'overlap';
  }
  function analyze(rules,context={}) {
    const conflicts=[], conditional=[], overlapsFound=[];
    for(let i=0;i<rules.length;i++)for(let j=i+1;j<rules.length;j++){
      const a=rules[i],b=rules[j],pair=a.id+' / '+b.id;
      const result=assess(a,b,context);
      if(result==='conflict')conflicts.push(pair+': conflicting normative effects or exclusive edition values; review context and precedence.');
      else if(result==='conditional')conditional.push(pair+': dynamic edition constraint may diverge from a fixed value as toolchains change.');
      else if(result==='overlap'&&(
        samePredicate(a,b)||a.categories.domains.some(d=>b.categories.domains.includes(d))
      ))overlapsFound.push(pair+': overlapping scope or domain; not necessarily a conflict.');
    }
    return {conflicts,conditional,overlaps:overlapsFound};
  }
  return Object.freeze({overlaps,samePredicate,values,assess,analyze});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=NomosReasoning;
