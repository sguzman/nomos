'use strict';
/* Pure catalog search for independently selectable groups and rules. */
const NomosCatalog = (() => {
  const SORT_MODES = Object.freeze([
    'groups-first', 'rules-first', 'name-asc', 'name-desc',
    'id-asc', 'id-desc', 'members-desc', 'members-asc'
  ]);
  function sortEntries(hits, sort, groups, rules) {
    const mode = SORT_MODES.includes(sort) ? sort : 'groups-first';
    const compareId = (a,b) => a.value.id.localeCompare(b.value.id, undefined, { numeric: true });
    const compareName = (a,b) => a.value.title.localeCompare(b.value.title, undefined, { sensitivity: 'base' }) || compareId(a,b);
    const groupOrder = (a,b,groupsFirst) => {
      if (a.kind !== b.kind) return (a.kind === 'group' ? -1 : 1) * (groupsFirst ? 1 : -1);
      return compareId(a,b);
    };
    const groupSizes = new Map();
    if (mode === 'members-desc' || mode === 'members-asc') {
      for (const group of groups) groupSizes.set(group.id, NomosGroups.expand(group.id, groups, rules).length);
    }
    return hits.sort((a,b) => {
      switch (mode) {
        case 'groups-first': return groupOrder(a,b,true);
        case 'rules-first': return groupOrder(a,b,false);
        case 'name-asc': return compareName(a,b);
        case 'name-desc': return -compareName(a,b);
        case 'id-asc': return compareId(a,b);
        case 'id-desc': return -compareId(a,b);
        case 'members-desc':
        case 'members-asc': {
          if (a.kind !== b.kind) return a.kind === 'group' ? -1 : 1;
          if (a.kind === 'group') {
            const difference = groupSizes.get(a.value.id) - groupSizes.get(b.value.id);
            if (difference) return mode === 'members-desc' ? -difference : difference;
          }
          return compareId(a,b);
        }
      }
      return compareId(a,b);
    });
  }
  function search({ rules, groups, query='', type='all', status='all', domain='all', groupFilter=null, sort='groups-first' }) {
    const term=String(query).trim().toLocaleLowerCase();
    const members=groupFilter ? new Set(NomosGroups.expand(groupFilter,groups,rules)) : null;
    const hits=[];
    if (!groupFilter && type!=='rules') for (const g of groups) {
      if (status!=='all' && g.status!==status) continue;
      if (domain!=='all' && !g.metadata_labels.includes(domain)) continue;
      const text=[g.id,g.title,g.summary,...g.metadata_labels].join(' ').toLocaleLowerCase();
      if (text.includes(term)) hits.push({kind:'group',value:g});
    }
    if (type!=='groups' || groupFilter) for (const r of rules) {
      if (members && !members.has(r.id)) continue;
      if (status!=='all' && (r.registry==='candidate'?'candidate':r.status)!==status) continue;
      if (domain!=='all' && !r.categories.domains.includes(domain)) continue;
      const memberships=groups.filter(g=>g.member_rule_ids.includes(r.id));
      const text=[r.id,r.title,r.summary,r.statement,...r.categories.domains,
        ...r.categories.topics,...r.categories.audiences,
        r.norm.kind, r.norm.bounds?.quantifier || '', r.norm.bounds?.interpretation || '',
        r.norm.bounds?.frequency || '', r.norm.bounds?.cue || '',
        ...memberships.flatMap(g=>[g.id,g.title,...g.metadata_labels])].join(' ').toLocaleLowerCase();
      if (text.includes(term)) hits.push({kind:'rule',value:r});
    }
    return sortEntries(hits, sort, groups, rules);
  }
  return Object.freeze({search, SORT_MODES});
})();
if (typeof module!=='undefined'&&module.exports) module.exports=NomosCatalog;
