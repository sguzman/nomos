'use strict';
/* Unified search across independently selectable rules, groups, and optional profiles. */
const NomosCatalog = (() => {
  const SORT_MODES = Object.freeze([
    'groups-first', 'rules-first', 'name-asc', 'name-desc',
    'id-asc', 'id-desc', 'members-desc', 'members-asc'
  ]);
  const order = {group:0, profile:1, rule:2};
  function profileMemberIds(profile,rules) {
    const published=new Set(rules.filter(r=>r.status==='published'&&r.registry==='catalog').map(r=>r.id));
    return [...new Set(profile.selected_rule_ids||[])].filter(id=>published.has(id));
  }
  function sortEntries(hits,sort,groups,rules) {
    const mode=SORT_MODES.includes(sort)?sort:'groups-first';
    const compareId=(a,b)=>a.value.id.localeCompare(b.value.id,undefined,{numeric:true});
    const compareName=(a,b)=>a.value.title.localeCompare(b.value.title,undefined,{sensitivity:'base'})||compareId(a,b);
    const kind=(a,b,first)=> {
      if(a.kind!==b.kind){
        if(first && (a.kind==='rule'||b.kind==='rule'))return a.kind==='rule'?-1:1;
        if(!first && (a.kind==='rule'||b.kind==='rule'))return a.kind==='rule'?1:-1;
        return order[a.kind]-order[b.kind];
      }
      return compareId(a,b);
    };
    const size=x=>x.kind==='group'?NomosGroups.expand(x.value.id,groups,rules).length:
      x.kind==='profile'?profileMemberIds(x.value,rules).length:0;
    return hits.sort((a,b)=>{
      switch(mode){
        case 'groups-first':return kind(a,b,false);
        case 'rules-first':return kind(a,b,true);
        case 'name-asc':return compareName(a,b);
        case 'name-desc':return -compareName(a,b);
        case 'id-asc':return compareId(a,b);
        case 'id-desc':return -compareId(a,b);
        case 'members-desc':
        case 'members-asc':{
          if(a.kind==='rule' || b.kind==='rule')return kind(a,b,false);
          const delta=size(a)-size(b);
          return (mode==='members-desc'?-delta:delta)||kind(a,b,false);
        }
      }
      return compareId(a,b);
    });
  }
  function typeMatches(ruleTypes,target,hierarchy){
    if(ruleTypes.includes('any'))return false; // Broad rules remain under All.
    const index=new Map((hierarchy?.types||[]).map(r=>[r.id,r]));
    const ancestors=new Set();
    const visit=id=>{if(ancestors.has(id))return;ancestors.add(id);for(const p of index.get(id)?.parents||[])visit(p);};
    visit(target);
    return ruleTypes.some(t=>ancestors.has(t));
  }
  function search({rules,groups,profiles=[],query='',type='all',status='all',domain='all',groupFilter=null,profileFilter=null,projectType='all',projectHierarchy=null,sort='groups-first'}){
    const term=String(query).trim().toLocaleLowerCase();
    const preset=profileFilter?profiles.find(p=>p.id===profileFilter):null;
    const members=profileFilter?new Set(preset?profileMemberIds(preset,rules):[]):
      groupFilter?new Set(NomosGroups.expand(groupFilter,groups,rules)):null;
    const hits=[];
    if(!groupFilter&&!profileFilter&&projectType==='all'){
      if(type==='all'||type==='groups')for(const g of groups){
        if(status!=='all'&&g.status!==status)continue;
        if(domain!=='all'&&!g.metadata_labels.includes(domain))continue;
        if([g.id,g.title,g.summary,...g.metadata_labels].join(' ').toLocaleLowerCase().includes(term))hits.push({kind:'group',value:g});
      }
      if(type==='all'||type==='profiles')for(const p of profiles){
        if(status!=='all'&&p.status!==status)continue;
        const selected=profileMemberIds(p,rules);
        if(domain!=='all'&&!rules.some(r=>selected.includes(r.id)&&r.categories.domains.includes(domain)))continue;
        if([p.id,p.title,p.status,p.version,...selected].join(' ').toLocaleLowerCase().includes(term))hits.push({kind:'profile',value:p});
      }
    }
    if(type==='all'||type==='rules'||members)for(const r of rules){
      if(members&&!members.has(r.id))continue;
      if(projectType!=='all'&&!typeMatches(r.scope.project_types||['any'],projectType,projectHierarchy))continue;
      if(status!=='all'&&(r.registry==='candidate'?'candidate':r.status)!==status)continue;
      if(domain!=='all'&&!r.categories.domains.includes(domain))continue;
      const memberships=groups.filter(g=>g.member_rule_ids.includes(r.id));
      const presets=profiles.filter(p=>p.selected_rule_ids.includes(r.id));
      const haystack=[r.id,r.title,r.summary,r.statement,...r.categories.domains,
        ...r.categories.topics,...r.categories.audiences,r.norm.kind, ...(r.scope.project_types||['any']), r.semantic?.concept||'', ...(r.semantic?.aliases||[]),
        r.norm.bounds?.quantifier||'',r.norm.bounds?.interpretation||'',
        r.norm.bounds?.frequency||'',r.norm.bounds?.cue||'',
        ...memberships.flatMap(g=>[g.id,g.title,...g.metadata_labels]),
        ...presets.flatMap(p=>[p.id,p.title])].join(' ').toLocaleLowerCase();
      if(haystack.includes(term))hits.push({kind:'rule',value:r});
    }
    return sortEntries(hits,sort,groups,rules);
  }
  return Object.freeze({search,SORT_MODES,profileMemberIds,typeMatches});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=NomosCatalog;
