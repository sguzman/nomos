'use strict';
/* Rule-profile presets are user-controlled selections, never active instructions. */
const NomosProfiles = (() => {
  const ID = /^PROFILE-[0-9]{4,}$/;
  const RULE_ID = /^NOM-[0-9]{4,}$/;
  const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/;
  const DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  const TARGETS = new Set(['agents_md', 'chatgpt_custom_instructions', 'plain_text']);
  const STATUSES = new Set(['draft', 'finalized', 'deprecated']);
  const FIELDS = new Set(['id', 'kind', 'version', 'title', 'status',
    'selected_rule_ids', 'export_targets', 'review', 'governance']);

  function validate(profile, rules, { checkConflicts = true } = {}) {
    const errors = [], warnings = [];
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      return { errors: ['Profile must be an object'], warnings };
    }
    const fieldNames = Object.keys(profile);
    if (fieldNames.length !== FIELDS.size || fieldNames.some(k => !FIELDS.has(k)))
      errors.push('Incorrect profile fields');
    if (!ID.test(profile.id || '')) errors.push('Invalid profile ID');
    if (profile.kind !== 'rule_profile') errors.push('Invalid profile kind');
    if (!VERSION.test(profile.version || '')) errors.push('Invalid profile version');
    if (typeof profile.title !== 'string' || !profile.title.trim())
      errors.push('Profile title is required');
    if (!STATUSES.has(profile.status)) errors.push('Invalid profile status');
    const ids = profile.selected_rule_ids;
    if (!Array.isArray(ids)) errors.push('selected_rule_ids must be an array');
    else {
      if (ids.length !== new Set(ids).size) errors.push('Duplicate selected rule IDs');
      const byId = new Map((rules || []).map(rule => [rule.id, rule]));
      for (const id of ids) {
        if (typeof id !== 'string' || !RULE_ID.test(id)) errors.push('Invalid selected rule ID: ' + id);
        else if (!byId.has(id) || byId.get(id).status !== 'published' ||
          byId.get(id).registry === 'candidate') errors.push('Rule is not a published catalog entry: ' + id);
      }
    }
    if (!Array.isArray(profile.export_targets) || !profile.export_targets.length ||
      profile.export_targets.length !== new Set(profile.export_targets).size ||
      profile.export_targets.some(target => !TARGETS.has(target)))
      errors.push('Invalid export targets');
    const review = profile.review;
    if (!review || typeof review !== 'object' || Array.isArray(review) ||
      Object.keys(review).sort().join(',') !== 'finalization_confirmed,selection_confirmed' ||
      typeof review.selection_confirmed !== 'boolean' || typeof review.finalization_confirmed !== 'boolean')
      errors.push('Review confirmations are required');
    if (profile.status === 'draft' && review?.finalization_confirmed !== false)
      errors.push('Draft cannot claim finalization');
    if (profile.status === 'finalized' && (!ids?.length || review?.selection_confirmed !== true || review?.finalization_confirmed !== true))
      errors.push('Finalized profile requires rules and explicit finalization');
    if (profile.status === 'deprecated' && (review?.selection_confirmed !== true || review?.finalization_confirmed !== true))
      errors.push('Only a finalized profile may be deprecated');
    const gov = profile.governance;
    if (!gov || typeof gov !== 'object' || Array.isArray(gov) ||
      Object.keys(gov).sort().join(',') !== 'created_on,updated_on' ||
      !DATE.test(gov.created_on || '') || !DATE.test(gov.updated_on || ''))
      errors.push('Invalid governance dates');
    if (!errors.length && checkConflicts && ids?.length >= 2) {
      const chosen = ids.map(id => rules.find(r => r.id === id));
      const engine = typeof NomosReasoning !== 'undefined' ? NomosReasoning :
        (typeof module !== 'undefined' ? require('../docs/reasoning.js') : null);
      if (engine) warnings.push(...engine.analyze(chosen).conflicts);
    }
    return { errors, warnings };
  }

  function assertValid(profile, rules) {
    const issues = validate(profile, rules);
    if (issues.errors.length) throw new Error(issues.errors.join('; '));
    return issues;
  }

  function instantiate({ id, title, selectedRuleIds, exportTargets, date }, rules,
    { selectionConfirmed = false, draftAuthorized = false } = {}) {
    if (selectionConfirmed !== true && draftAuthorized !== true) throw new Error('User must explicitly approve the proposed selection or authorize a provisional review draft before instantiating a profile');
    const profile = {
      id, kind: 'rule_profile', version: '1.0.0', title, status: 'draft',
      selected_rule_ids: [...selectedRuleIds],
      export_targets: [...exportTargets],
      review: { selection_confirmed: selectionConfirmed === true, finalization_confirmed: false },
      governance: { created_on: date, updated_on: date }
    };
    assertValid(profile, rules);
    return profile;
  }

  function edit(profile, { add, remove, date }, rules) {
    if (profile.status !== 'draft') throw new Error('Only a draft profile is editable; request a separate revision for finalized presets');
    assertValid(profile, rules);
    const ids = profile.selected_rule_ids.filter(id => id !== remove);
    if (add !== undefined && !ids.includes(add)) ids.push(add);
    const updated = { ...profile, selected_rule_ids: ids,
      governance: { ...profile.governance, updated_on: date } };
    assertValid(updated, rules);
    return updated;
  }

  function confirmSelection(profile, rules, { selectionConfirmed = false } = {}) {
    if (profile.status !== 'draft') throw new Error('Only draft selections may be confirmed');
    if (selectionConfirmed !== true) throw new Error('Owner must explicitly approve the selected rules');
    const approved = { ...profile, review: { ...profile.review, selection_confirmed: true } };
    assertValid(approved, rules);
    return approved;
  }

  function finalize(profile, rules, { finalizationConfirmed = false } = {}) {
    if (profile.status !== 'draft') throw new Error('Only a draft profile may be finalized');
    if (finalizationConfirmed !== true) throw new Error('User must explicitly approve finalization');
    if (profile.review?.selection_confirmed !== true) throw new Error('Rule selection requires explicit owner review before finalization');
    const candidate = { ...profile, status: 'finalized',
      review: { ...profile.review, finalization_confirmed: true } };
    const { warnings } = assertValid(candidate, rules);
    if (warnings.length) throw new Error('Potential conflicts require review before finalizing: ' + warnings.join('; '));
    return candidate;
  }

  function selectForUse(profile, rules, { userSelected = false } = {}) {
    if (userSelected !== true) throw new Error('A profile never applies or exports itself automatically');
    if (profile.status !== 'finalized') throw new Error('Only finalized profiles may be selected for use');
    assertValid(profile, rules);
    return profile.selected_rule_ids.map(id => rules.find(r => r.id === id));
  }

  return Object.freeze({ validate, instantiate, edit, confirmSelection, finalize, selectForUse });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = NomosProfiles;
