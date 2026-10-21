'use strict';
/* Pure catalog search for independently selectable groups and rules. */
const NomosCatalog = (() => {
  function search({ rules, groups, query='', type='all', status='all', domain='all', groupFilter=null }) {
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
        ...memberships.flatMap(g=>[g.id,g.title,...g.metadata_labels])].join(' ').toLocaleLowerCase();
      if (text.includes(term)) hits.push({kind:'rule',value:r});
    }
    return hits.sort((a,b)=>a.value.title.localeCompare(b.value.title,undefined,{sensitivity:'base'})||a.value.id.localeCompare(b.value.id));
  }
  return Object.freeze({search});
})();
if (typeof module!=='undefined'&&module.exports) module.exports=NomosCatalog;
