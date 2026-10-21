'use strict';
/** Group membership is metadata, not rule activation or inherited authority. */
const NomosGroups = (() => {
  function expand(groupId, groups, rules) {
    const byId = new Map(groups.map(g=>[g.id,g]));
    const published = new Set(rules.filter(r=>r.status==='published'&&r.registry==='catalog').map(r=>r.id));
    const seen = new Set(), selected = [];
    function visit(id, stack) {
      if (stack.includes(id)) throw new Error('Circular group membership: '+[...stack,id].join(' > '));
      const group = byId.get(id);
      if (!group) throw new Error('Unknown group '+id);
      for (const rid of group.member_rule_ids) {
        if (published.has(rid)&&!seen.has(rid)) {
          seen.add(rid);
          selected.push(rid);
        }
      }
      if (group.composition.include_descendants) {
        for (const child of group.child_group_ids) visit(child,[...stack,id]);
      }
    }
    visit(groupId, []);
    return selected;
  }
  return Object.freeze({expand});
})();
if (typeof module!=='undefined'&&module.exports)module.exports=NomosGroups;
