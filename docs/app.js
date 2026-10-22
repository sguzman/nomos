'use strict';

/* Local-only rule selection. Nomos catalog entries are inert until explicitly exported. */
const $ = id => document.getElementById(id);
const scopeAxes = ['channel', 'visibility', 'artifact_kind', 'actor'];
const state = { rules: [], groups: [], profiles: [], relationships: [], projectHierarchy: null, groupFilter: null, profileFilter: null, selected: [], format: 'agents' };

function element(tag, className, content) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (content !== undefined && content !== null) n.textContent = String(content);
  return n;
}
function human(value) { return String(value).replace(/_/g, ' '); }
function words(values) { return (values || []).map(human).join(', ') || 'None'; }
function statusOf(rule) { return rule.registry === 'candidate' ? 'candidate' : rule.status; }
function byId(id) { return state.rules.find(r => r.id === id); }
function identityLabel(rule) {
  const identity = element('span', 'rule-identity');
  const color = NomosColor.colorForId(rule.id);
  identity.style.setProperty('--rule-hue', color.hue + 'deg');
  identity.style.setProperty('--rule-day', color.day);
  identity.style.setProperty('--rule-night', color.night);
  const swatch = element('span', 'rule-swatch');
  swatch.setAttribute('aria-hidden', 'true');
  identity.append(swatch, element('span', 'rule-id', rule.id));
  return identity;
}
function selectedRules() { return state.selected.map(byId).filter(Boolean); }
function scopeSummary(rule) {
  const parts = scopeAxes.map(axis => human(axis) + ': ' + words(rule.scope.axes[axis]));
  parts.push('project types: ' + words(rule.scope.project_types || ['any']));
  return parts.join('; ');
}
function analyze(rules) { return NomosReasoning.analyze(rules, {project_hierarchy:state.projectHierarchy}, state.relationships); }
function addField(parent, name, content) {
  const div = element('div', 'detail-field');
  div.append(element('strong', '', name), element('span', '', content || 'None recorded'));
  parent.append(div);
}
function addListSection(parent, title, items) {
  const h = element('h3', 'detail-section-title', title);
  const ul = element('ul', 'detail-list');
  for (const value of items) ul.append(element('li', '', value));
  parent.append(h, ul);
}
function showDetails(rule) {
  const root = $('rule-detail');
  root.replaceChildren();
  const identity = identityLabel(rule);
  identity.append(element('span', 'identity-status', ' · ' + statusOf(rule).toUpperCase()));
  root.append(identity);
  const title = element('h2', 'dialog-title', rule.title);
  title.id = 'dialog-title';
  root.append(title);
  root.append(element('p', '', rule.summary));
  root.append(element('div', 'dialog-statement', rule.statement));
  const grid = element('div', 'detail-grid');
  addField(grid, 'Normative effect', human(rule.norm.kind));
  if (rule.norm.value_constraint) addField(grid, 'Exclusive value', rule.norm.value_constraint.field + ' · ' + rule.norm.value_constraint.operator + (rule.norm.value_constraint.value ? ' = ' + rule.norm.value_constraint.value : ' (resolved when applied)'));
  addField(grid, 'Predicate', Object.entries(rule.norm.predicate).map(([k, v]) => k + '=' + v).join(' · '));
  if (rule.norm.bounds) {
    const b = rule.norm.bounds;
    addField(grid, 'Quantity', b.quantifier + ' (' + b.interpretation.replace(/_/g,' ') + ')');
    addField(grid, 'Frequency', b.frequency);
    addField(grid, 'Numeric bounds', (b.minimum ?? '?') + '–' + (b.maximum ?? '?') + ' ' + b.unit + (b.window ? ' / ' + b.window : ''));
    addField(grid, 'Bounds evidence', b.basis.replace(/_/g,' ') + (b.cue ? ' · ' + b.cue : ''));
  }
  addField(grid, 'Domains', words(rule.categories.domains));
  addField(grid, 'Topics', words(rule.categories.topics));
  addField(grid, 'Audience', words(rule.categories.audiences));
  addField(grid, 'Applicability', scopeSummary(rule));
  if(rule.semantic) addField(grid, 'Semantic concept', rule.semantic.concept + (rule.semantic.aliases?.length ? ' · ' + words(rule.semantic.aliases) : ''));
  addField(grid, 'Authority tier', human(rule.authority.tier) + ' (priority ' + rule.authority.priority + ')');
  addField(grid, 'Override handling', human(rule.authority.override_policy));
  addField(grid, 'Review status', human(rule.governance.review_status));
  addField(grid, 'Version', rule.version);
  root.append(grid);
  addListSection(root, 'Conditions and exclusions', [
    ...(rule.norm.conditions || []).map(s => 'Condition: ' + s),
    ...(rule.norm.exceptions || []).map(s => 'Exception: ' + s),
    ...(rule.scope.preconditions || []).map(s => 'Precondition: ' + s),
    ...(rule.scope.exclusions || []).map(s => 'Exclusion: ' + s),
    ...(!(rule.norm.conditions || []).length && !(rule.norm.exceptions || []).length && !(rule.scope.preconditions || []).length && !(rule.scope.exclusions || []).length ? ['No additional qualifications recorded'] : [])
  ]);
  const relationships = Object.entries(rule.relations).flatMap(([key, ids]) => ids.map(id => human(key) + ': ' + id));
  addListSection(root, 'Recorded relationships', relationships.length ? relationships : ['No formal relations recorded']);
  const related=state.relationships.filter(e=>e.source===rule.id||e.target===rule.id)
    .sort((x,y)=>(x.status==='reviewed'?-1:1)-(y.status==='reviewed'?-1:1)||x.kind.localeCompare(y.kind));
  const graph=element('section','relationship-graph');
  graph.append(element('h3','detail-section-title','Relationship graph'));
  graph.append(element('p','relationship-explainer',related.length
    ? related.filter(e=>e.status==='reviewed').length+' reviewed / '+related.filter(e=>e.status==='candidate').length+' candidates · evidence is shown below'
    : 'No reviewed or suggested links for this rule.'));
  const graphNodes=element('div','relationship-nodes');
  const center=element('div','relationship-center');
  center.append(identityLabel(rule),element('span','relation-center-label','Selected rule'));
  graphNodes.append(center);
  for(const edge of related){
    const otherId=edge.source===rule.id?edge.target:edge.source;
    const other=byId(otherId);
    if(!other)continue;
    const link=element('button','relation-neighbor');
    link.type='button';
    link.setAttribute('aria-label','Inspect '+otherId+' relationship to '+rule.id);
    const caption=element('span','relation-description');
    caption.append(element('strong','',human(edge.kind)),
      element('span','relation-status '+edge.status,edge.status+' · '+edge.confidence));
    link.append(identityLabel(other),caption,element('span','relation-evidence',edge.evidence));
    link.addEventListener('click',()=>showDetails(other));
    graphNodes.append(link);
  }
  graph.append(graphNodes);
  root.append(graph);
  root.append(element('p', 'detail-footer',
    'Provenance: ' + human(rule.provenance.source_type) + ' · ' + (rule.provenance.reference || 'No public source reference') +
    ' · Registry: ' + (rule.registry === 'candidate' ? 'Processing candidate — not published' : 'Catalog entry')));
  if(!$('rule-dialog').open) $('rule-dialog').showModal();
}
function createCard(rule) {
  const selected = state.selected.includes(rule.id);
  const card = element('article', 'rule-card' + (selected ? ' is-selected' : ''));
  const top = element('div', 'card-top');
  top.append(identityLabel(rule));
  top.append(element('span', 'status-pill ' + statusOf(rule), statusOf(rule).toUpperCase()));
  card.append(top);
  card.append(element('h3', '', rule.title));
  card.append(element('p', '', rule.summary));
  const tags = element('div', 'tag-row');
  tags.append(element('span', 'tag norm-tag' + (rule.norm.kind === 'permission' ? ' permission' : ''), human(rule.norm.kind)));
  for (const domain of rule.categories.domains.slice(0, 3)) tags.append(element('span', 'tag', human(domain)));
  for(const p of rule.scope.project_types||[])if(p!=='any')tags.append(element('span','tag project-tag',human(p)));
  const bounds = rule.norm.bounds;
  if (bounds && bounds.basis !== 'unresolved') {
    const label = bounds.frequency !== 'unspecified' ? bounds.frequency :
      bounds.quantifier !== 'unspecified' ? bounds.quantifier :
      bounds.minimum === 1 && bounds.maximum === 1 ? 'exactly once' : 'bounded';
    tags.append(element('span', 'tag', 'Bounds: ' + label));
  }
  for (const name of ruleGroupTags(rule)) tags.append(element('span','tag group-tag',name));
  card.append(tags);
  const bottom = element('div', 'card-bottom');
  const detail = element('button', 'details-btn', 'View metadata ↗');
  detail.type = 'button';
  detail.setAttribute('aria-label', 'View metadata for ' + rule.title);
  detail.addEventListener('click', () => showDetails(rule));
  const add = element('button', 'add-btn' + (selected ? ' selected' : ''), selected ? '✓ Selected' : '+ Add rule');
  add.type = 'button';
  add.setAttribute('aria-pressed', String(selected));
  add.setAttribute('aria-label', (selected ? 'Remove ' : 'Add ') + rule.title);
  add.addEventListener('click', () => toggleRule(rule.id));
  bottom.append(detail, add);
  card.append(bottom);
  return card;
}
function ruleGroupTags(rule) {
  return state.groups.filter(group=>group.member_rule_ids.includes(rule.id)).map(group=>group.title);
}

function createGroupCard(group) {
  const ids = NomosGroups.expand(group.id, state.groups, state.rules);
  const card = element('article', 'group-card');
  const color = NomosColor.colorForId(group.id);
  card.style.setProperty('--rule-hue', color.hue + 'deg');
  card.style.setProperty('--rule-day', color.day);
  card.style.setProperty('--rule-night', color.night);
  const heading = element('div', 'group-card-heading');
  // Apply the computed ID hue on the identity element itself. The previous
  // CSS --rule-hue fallback there shadowed inheritance from the group card.
  heading.append(identityLabel(group), element('span', 'group-size', ids.length + ' rules'));
  card.append(heading, element('h3', '', group.title), element('p', '', group.summary));
  const tags = element('div', 'tag-row group-labels');
  tags.append(element('span', 'tag', 'Virtual group'));
  for (const label of group.metadata_labels) {
    if (label !== 'development_hygiene') tags.append(element('span', 'tag', human(label)));
  }
  card.append(tags);
  const actions = element('div', 'group-actions');
  const browse = element('button', 'details-btn', 'Browse members');
  browse.type = 'button';
  browse.setAttribute('aria-label', 'Browse rules in ' + group.title);
  browse.addEventListener('click', () => {
    state.groupFilter = group.id;
    state.profileFilter = null;
    $('filter-profile').value = 'all';
    $('filter-type').value = 'rules';
    $('filter-status').value = 'all';
    $('filter-domain').value = 'all';
    $('search').value = '';
    renderCatalog();
    $('catalog-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const add = element('button', 'add-btn', '+ Add all (' + ids.length + ')');
  add.type = 'button';
  add.disabled = ids.length === 0 || ids.every(id => state.selected.includes(id));
  if (add.disabled) add.textContent = '✓ All added';
  add.setAttribute('aria-label', 'Add all published rules from ' + group.title);
  add.addEventListener('click', () => {
    state.selected = [...new Set([...state.selected, ...ids])];
    renderSelection();
    renderCatalog();
    announce('Added eligible rules from ' + group.title + '.');
  });
  actions.append(browse, add);
  card.append(actions);
  return card;
}
function createProfileCard(profile) {
  const ids=NomosCatalog.profileMemberIds(profile,state.rules);
  const card=element('article','group-card profile-card');
  const color=NomosColor.colorForId(profile.id);
  card.style.setProperty('--rule-hue',color.hue+'deg');
  card.style.setProperty('--rule-day',color.day);
  card.style.setProperty('--rule-night',color.night);
  const heading=element('div','group-card-heading');
  const identity=identityLabel(profile);
  identity.append(element('span','identity-status',' · '+profile.status.toUpperCase()));
  heading.append(identity,element('span','group-size',ids.length+' rules'));
  card.append(heading,element('h3','',profile.title));
  card.append(element('p','','Optional '+profile.status+' profile preset. Browsing does not apply or export its rules.'));
  const tags=element('div','tag-row group-labels');
  tags.append(element('span','tag','Rule profile'));
  tags.append(element('span','status-pill '+profile.status,profile.status.toUpperCase()));
  tags.append(element('span','tag','v'+profile.version));
  card.append(tags);
  const actions=element('div','group-actions');
  const browse=element('button','details-btn','Browse members');
  browse.type='button';
  browse.setAttribute('aria-label','Browse rules in profile '+profile.title);
  browse.addEventListener('click',()=>{
    state.groupFilter=null;
    state.profileFilter=profile.id;
    $('filter-profile').value=profile.id;
    $('filter-type').value='rules';
    $('filter-status').value='all';
    $('filter-domain').value='all';
    $('search').value='';
    renderCatalog();
    $('catalog-list').scrollIntoView({behavior:'smooth',block:'start'});
  });
  actions.append(browse);
  if(profile.status==='finalized'){
    const add=element('button','add-btn','+ Add all ('+ids.length+')');
    add.type='button';
    add.disabled=ids.length===0||ids.every(id=>state.selected.includes(id));
    if(add.disabled)add.textContent='✓ All added';
    add.setAttribute('aria-label','Explicitly add all published rules from finalized profile '+profile.title);
    add.addEventListener('click',()=>{
      state.selected=[...new Set([...state.selected,...ids])];
      renderSelection();renderCatalog();
      announce('Explicitly selected rules from finalized profile '+profile.title+'.');
    });
    actions.append(add);
  } else {
    actions.append(element('span','profile-readonly','Draft — browse only'));
  }
  card.append(actions);
  return card;
}
function renderCatalog() {
  const entries = NomosCatalog.search({
    rules: state.rules, groups: state.groups, profiles: state.profiles,
    query: $('search').value, type: $('filter-type').value,
    status: $('filter-status').value, domain: $('filter-domain').value,
    projectType: $('filter-project').value, projectHierarchy: state.projectHierarchy,
    sort: $('sort-order').value,
    groupFilter: state.groupFilter, profileFilter: state.profileFilter
  });
  $('catalog-list').replaceChildren(...entries.map(entry =>
    entry.kind === 'group' ? createGroupCard(entry.value) :
    entry.kind === 'profile' ? createProfileCard(entry.value) : createCard(entry.value)
  ));
  const currentSort = $('sort-order');
  const sortName = currentSort.options[currentSort.selectedIndex]?.textContent || 'Groups first · ID';
  $('result-count').textContent = entries.length + ' of ' +
    (state.rules.length + state.groups.length + state.profiles.length) + ' items · ' + sortName;
  const active=state.profileFilter||state.groupFilter;
  const title=state.profileFilter?state.profiles.find(p=>p.id===active)?.title:
    state.groups.find(g=>g.id===active)?.title;
  $('active-member-filter').classList.toggle('hidden',!active);
  $('active-member-filter').textContent=active?'Browsing '+(title||active)+' · Clear member filter ×':'';
  $('empty-results').classList.toggle('hidden', entries.length !== 0);
}

function renderSelection() {
  const selected = selectedRules();
  $('count-selected').textContent = String(selected.length);
  $('composer-count').textContent = String(selected.length);
  $('selection-empty').classList.toggle('hidden', selected.length !== 0);
  $('clear-selection').classList.toggle('hidden', selected.length === 0);
  const nodes = selected.map(rule => {
    const row = element('div', 'selection-item');
    const info = element('div', 'selection-item-info');
    const identity = identityLabel(rule);
    identity.append(element('span', 'selected-status', ' · ' + statusOf(rule)));
    info.append(identity);
    info.append(element('strong', '', rule.title));
    const remove = element('button', '', '×');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remove ' + rule.title);
    remove.addEventListener('click', () => toggleRule(rule.id));
    row.append(info, remove);
    return row;
  });
  $('selection-list').replaceChildren(...nodes);
  const analysis = analyze(selected);
  const panel = $('analysis-panel');
  panel.classList.toggle('conflict', analysis.conflicts.length > 0);
  panel.classList.toggle('issue', !analysis.conflicts.length && (analysis.overlaps.length > 0 || analysis.conditional.length > 0 || analysis.candidates.length > 0));
  if (selected.length < 2) {
    $('analysis-summary').textContent = 'Select two or more rules to compare their metadata.';
  } else if (analysis.conflicts.length) {
    $('analysis-summary').textContent = analysis.conflicts.length + ' potential normative conflict(s) found. Export is paused until you revise the selection.';
  } else if (analysis.conditional.length) {
    $('analysis-summary').textContent = analysis.conditional.length + ' conditional edition interaction(s). Check actual supported edition and permission strength before treating these as conflicts.';
  } else if (analysis.overlaps.length || analysis.candidates.length) {
    $('analysis-summary').textContent = 'No definite conflict found. ' + analysis.overlaps.length + ' metadata overlap(s) and '+analysis.candidates.length+' semantic relationship(s) warrant review. Suggestions never override or automatically block export.';
  } else {
    $('analysis-summary').textContent = 'No conflict candidates detected in recorded metadata. This does not prove full compatibility.';
  }
  $('analysis-details').replaceChildren(...[...analysis.conflicts, ...analysis.conditional, ...analysis.overlaps, ...analysis.candidates].map(message => {
    const div = element('div', 'analysis-item');
    div.append(element('strong', '', message.split(':')[0]), document.createTextNode(' — ' + message.split(':').slice(1).join(':').trim()));
    return div;
  }));
  updatePreview(analysis);
}
function ruleExportBlock(rule) {
  const out = [
    '### [' + rule.id + '] ' + rule.title,
    '- Norm: ' + human(rule.norm.kind),
    '- Applies when: ' + scopeSummary(rule),
    '- Rule: ' + rule.statement
  ];
  if (rule.norm.bounds && rule.norm.bounds.basis !== 'unresolved') {
    const b = rule.norm.bounds;
    out.push('- Quantification: ' + b.quantifier + ' (' + b.interpretation + '); frequency ' + b.frequency + '; count ' + (b.minimum ?? '?') + '..' + (b.maximum ?? '?') + ' ' + b.unit + (b.window ? ' per ' + b.window : '') + '; ' + b.basis);
  }
  if (rule.norm.value_constraint) out.push('- Value constraint: ' + rule.norm.value_constraint.field + ' ' + rule.norm.value_constraint.operator + (rule.norm.value_constraint.value ? ' ' + rule.norm.value_constraint.value : ' (resolve when applied)'));
  if (rule.norm.conditions.length) out.push('- Conditions: ' + rule.norm.conditions.join('; '));
  if (rule.norm.exceptions.length) out.push('- Exceptions: ' + rule.norm.exceptions.join('; '));
  if (rule.scope.preconditions.length) out.push('- Preconditions: ' + rule.scope.preconditions.join('; '));
  if (rule.scope.exclusions.length) out.push('- Exclusions: ' + rule.scope.exclusions.join('; '));
  out.push('- Authority: ' + human(rule.authority.tier) + '; ' + human(rule.authority.override_policy));
  if (statusOf(rule) !== 'published') out.push('- Review: ' + statusOf(rule) + ' (not an approved published rule)');
  return out.join('\n');
}
function generateExport(rules, analysis) {
  if (!rules.length) return '';
  const notPublished = rules.some(r => statusOf(r) !== 'published');
  const caution = notPublished ? 'Includes draft or candidate rules that have not been approved for publication.\n' : '';
  if (state.format === 'agents') {
    return '# AGENTS.md\n\n' +
      '> Composed from selected Nomos records. Apply only within stated scopes; review local authority and precedence.\n' +
      (caution ? '> ' + caution.trim() + '\n' : '') +
      (analysis.overlaps.length ? '> Domain overlap does not by itself establish a contradiction.\n' : '') +
      '\n## Selected rules\n\n' + rules.map(ruleExportBlock).join('\n\n') + '\n';
  }
  return 'NOMOS — SELECTED CUSTOM INSTRUCTIONS\n' +
    'These instructions are explicitly selected for this use case. Apply each only in its stated scope and subject to higher-priority requirements.\n' +
    (caution ? 'CAUTION: ' + caution : '') + '\n' +
    rules.map((r, i) => [
      String(i + 1) + '. [' + r.id + '] ' + r.title + ' (' + statusOf(r) + ')',
      'Scope: ' + scopeSummary(r),
      'Instruction: ' + r.statement,
      ...(r.norm.value_constraint ? ['Edition value: ' + r.norm.value_constraint.operator + (r.norm.value_constraint.value ? ' ' + r.norm.value_constraint.value : ' (resolve at selection time)')] : []),
      ...(r.norm.conditions.length ? ['Conditions: ' + r.norm.conditions.join('; ')] : []),
      ...(r.norm.exceptions.length ? ['Exceptions: ' + r.norm.exceptions.join('; ')] : []),
      ...(r.scope.preconditions.length ? ['Preconditions: ' + r.scope.preconditions.join('; ')] : []),
      ...(r.scope.exclusions.length ? ['Exclusions: ' + r.scope.exclusions.join('; ')] : [])
    ].join('\n')).join('\n\n') + '\n';
}
function updatePreview(analysis) {
  const rules = selectedRules();
  const blocked = analysis.conflicts.length > 0;
  const content = generateExport(rules, analysis);
  $('preview').value = content;
  $('preview-length').textContent = content.length.toLocaleString() + ' characters';
  $('download').disabled = !rules.length || blocked;
  $('copy').disabled = !rules.length || blocked;
  const caution = rules.some(r => statusOf(r) !== 'published');
  $('export-note').textContent = blocked ? 'Resolve potential opposing norms before exporting.' :
    analysis.conditional.length ? 'Conditional edition interactions require context review. Exports are not automatically approved or applied.' :
    caution ? 'Includes at least one unapproved draft/candidate. Inspect before use. No data is uploaded or saved.' :
    'Generated locally. No account, upload, or stored ruleset.';
}
function toggleRule(id) {
  state.selected = state.selected.includes(id) ? state.selected.filter(x => x !== id) : [...state.selected, id];
  renderCatalog(); renderSelection();
}
function announce(message) { $('notice').textContent = message; }
function setFormat(value) {
  state.format = value;
  for (const button of document.querySelectorAll('[data-format]')) {
    const active = button.dataset.format === value;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  updatePreview(analyze(selectedRules()));
}
function download() {
  const contents = $('preview').value;
  if (!contents || $('download').disabled) return;
  const filename = state.format === 'agents' ? 'AGENTS.md' : 'custom-instructions.txt';
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  announce('Downloaded ' + filename);
}
async function copy() {
  if ($('copy').disabled) return;
  try {
    await navigator.clipboard.writeText($('preview').value);
    announce('Instructions copied to clipboard.');
    const button = $('copy');
    button.textContent = '✓ Copied';
    setTimeout(() => { button.textContent = 'Copy text'; }, 1500);
  } catch (_) {
    $('preview').focus();
    $('preview').select();
    announce('Clipboard access unavailable. The generated text is selected for manual copying.');
  }
}
async function init() {
  try {
    const catalogUrl = document.querySelector('meta[name="nomos-catalog"]')?.content || './catalog.json';
    const response = await fetch(catalogUrl);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const catalog = await response.json();
    if (!catalog || !Array.isArray(catalog.rules)) throw new Error('Invalid catalog');
    const seen = new Set();
    for (const r of catalog.rules) {
      if (!r.id || seen.has(r.id) || !r.norm || !r.scope || !r.categories || !r.authority) throw new Error('Invalid or duplicate rule record');
      seen.add(r.id);
    }
    state.rules = catalog.rules;
    state.groups = Array.isArray(catalog.groups) ? catalog.groups : [];
    state.profiles = Array.isArray(catalog.profiles) ? catalog.profiles : [];
    state.relationships = Array.isArray(catalog.relationships) ? catalog.relationships : [];
    state.projectHierarchy = catalog.project_hierarchy || null;
    for (const profile of state.profiles) {
      if (!/^PROFILE-\d{4,}$/.test(profile.id) || seen.has(profile.id) || !Array.isArray(profile.selected_rule_ids) ||
          !['draft','finalized','deprecated'].includes(profile.status) ||
          profile.selected_rule_ids.some(id=>!state.rules.some(r=>r.id===id && r.status==='published' && r.registry==='catalog')))
        throw new Error('Invalid profile record');
      seen.add(profile.id);
      const option=element('option','',profile.id+' · '+profile.title);
      option.value=profile.id;
      $('filter-profile').append(option);
    }
    $('count-all').textContent = String(state.rules.length + state.groups.length + state.profiles.length);
    $('count-published').textContent = String(state.rules.filter(r => statusOf(r) === 'published').length);
    $('count-draft').textContent = String(state.rules.filter(r => statusOf(r) !== 'published').length +
      state.profiles.filter(p=>p.status==='draft').length);
    const domains = [...new Set([...state.rules.flatMap(r => r.categories.domains), ...state.groups.flatMap(g => g.metadata_labels)])].sort();
    for (const domain of domains) {
      const option = element('option', '', human(domain));
      option.value = domain; $('filter-domain').append(option);
    }
    const projectTypes=Array.isArray(catalog.project_types) ? catalog.project_types : [];
    for(const value of projectTypes){const option=element('option','',human(value));option.value=value;$('filter-project').append(option);}
    renderCatalog(); renderSelection();
  } catch (error) {
    $('result-count').textContent = 'Registry could not load.';
    $('empty-results').classList.remove('hidden');
    $('empty-results').replaceChildren(element('strong', '', 'Could not load the public catalog.'), element('p', '', 'Reload this page or check the repository for availability.'));
    announce('Error loading catalog: ' + error.message);
  }
}
// System mode is the default on every load; CSS also follows OS changes live.
$('theme-select').addEventListener('change', () => {
  const chosen = $('theme-select').value;
  if (!['system', 'light', 'dark'].includes(chosen)) return;
  document.documentElement.dataset.theme = chosen;
});
$('active-member-filter').addEventListener('click', () => {
  state.groupFilter=null;
  state.profileFilter=null;
  $('filter-profile').value='all';
  renderCatalog();
});
$('filter-form').addEventListener('submit', event => event.preventDefault());
for (const id of ['search', 'filter-type', 'filter-status', 'filter-domain', 'filter-project', 'filter-profile', 'sort-order']) {
  $(id).addEventListener(id === 'search' ? 'input' : 'change', () => {
    if(id==='filter-profile') {
      state.profileFilter=$('filter-profile').value==='all'?null:$('filter-profile').value;
      state.groupFilter=null;
      if(state.profileFilter){
        $('filter-type').value='rules';
        $('filter-status').value='all';
        $('filter-domain').value='all';
        $('search').value='';
      }
    }
    if(id==='filter-type' && $('filter-type').value!=='rules') {
      state.groupFilter=null;
      state.profileFilter=null;
      $('filter-profile').value='all';
    }
    renderCatalog();
    if (id === 'sort-order') $('filter-form').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
}
$('clear-filters').addEventListener('click', () => {
  $('search').value = '';
  $('filter-type').value = 'all';
  $('filter-status').value = 'all';
  $('filter-domain').value = 'all';
  $('filter-project').value = 'all';
  $('sort-order').value = 'groups-first';
  $('filter-profile').value = 'all';
  state.groupFilter = null;
  state.profileFilter = null;
  renderCatalog();
  $('search').focus();
});

$('clear-selection').addEventListener('click', () => { state.selected = []; renderCatalog(); renderSelection(); });
for (const button of document.querySelectorAll('[data-format]')) button.addEventListener('click', () => setFormat(button.dataset.format));
$('download').addEventListener('click', download);
$('copy').addEventListener('click', copy);
$('close-dialog').addEventListener('click', () => $('rule-dialog').close());
$('rule-dialog').addEventListener('click', event => {
  if (event.target === $('rule-dialog')) $('rule-dialog').close();
});
init();
