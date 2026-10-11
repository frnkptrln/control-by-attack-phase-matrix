import { matches, readState, stateQuery, phaseHistory, exportCsv } from './model.mjs';

const $ = id => document.getElementById(id);
const fields = ['search', 'phase', 'role', 'tier', 'coverage', 'conflicts'];
let data, state, visible = [];

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function sourceLink(line, label = 'Paper source ↗') {
  const link = el('a', label, 'source-link');
  link.href = `https://github.com/frnkptrln/control-by-attack-phase-matrix/blob/${data.source.revision}/${data.source.paper}#L${line}`;
  link.target = '_blank'; link.rel = 'noopener noreferrer';
  return link;
}
function section(title, text, line) {
  const block = el('section', undefined, 'detail-section');
  const heading = el('h3', title); if (line) heading.append(sourceLink(line, '↗'));
  block.append(heading, el('p', text)); return block;
}
function badge(text, className = '') { return el('span', text, 'badge ' + className); }
function syncUrl(push = false) {
  const query = stateQuery(state), url = `${location.pathname}${query ? '?' + query : ''}`;
  if (url !== location.pathname + location.search) history[push ? 'pushState' : 'replaceState'](null, '', url);
}
function fillFilters() {
  for (const field of fields) {
    if (field === 'conflicts') $(field).checked = state.conflicts;
    else $(field).value = state[field === 'search' ? 'q' : field];
  }
}
function renderDetail(row) {
  const detail = $('detail'); detail.replaceChildren();
  if (!row) { detail.append(el('h2', 'No matching control'), el('p', 'Adjust the filters to continue reading.')); return; }
  const top = el('div', undefined, 'detail-top');
  top.append(el('p', `Row ${row.row}`, 'eyebrow'), badge(row.tier), badge(row.coverage_summary));
  detail.append(top, el('h2', row.control));
  const actions = el('div', undefined, 'detail-actions');
  actions.append(sourceLink(row.lines.control));
  const share = el('button', 'Copy link', 'quiet'); share.type = 'button';
  share.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); $('notice').textContent = 'Link copied.'; }
    catch { $('notice').textContent = `Link: ${location.href}`; }
  }); actions.append(share); detail.append(actions);
  if (row.coverage_discrepancy) {
    const note = el('div', undefined, 'difference');
    note.append(el('strong', 'The paper gives different coverage labels.'),
      el('p', `Summary table: “${row.coverage_summary}”. Appendix E: “${row.coverage_appendix}”. Both are retained below; this reader does not resolve the discrepancy.`));
    detail.append(note);
  }
  detail.append(section('Evidentiary basis', row.basis, row.lines.control));
  const pair = el('div', undefined, 'evidence-pair');
  pair.append(section('Internally auditable', row.internal, row.lines.evidence), section('Externally attestable', row.external, row.lines.evidence));
  detail.append(pair, section('Observable trigger', row.trigger, row.lines.control));
  detail.append(el('p', 'A trigger alone does not establish a stopped run. Response records must identify the action, target, timing and outcome.', 'boundary'));
  const declared = el('details', undefined, 'expand');
  declared.append(el('summary', 'What the paper says was declared'));
  declared.append(section(`Summary table · ${row.coverage_summary}`, row.coverage_summary_detail, row.lines.summary),
    section(`Appendix E · ${row.coverage_appendix}`, row.coverage_detail, row.lines.coverage));
  detail.append(declared);
  const documents = el('section', undefined, 'detail-section'); documents.append(el('h3', 'Related disclosure documents'));
  if (['0', 'G'].includes(row.phase)) documents.append(el('p', 'Table D1 links by phase. This phase contains two controls, so the links cover both.', 'muted'));
  for (const item of data.disclosures.filter(item => row.disclosures.includes(item.id))) {
    const box = el('details', undefined, 'expand document');
    box.append(el('summary', `${item.id} · ${item.title}`),
      el('p', item.role === 'EO' ? 'Evaluation operator' : 'Platform operator / named provider', 'eyebrow'),
      section('Must state', item.must_state, item.line), section('A third party checks', item.third_party, item.line));
    documents.append(box);
  } detail.append(documents);
  const timeline = el('details', undefined, 'expand'); timeline.append(el('summary', 'Phase context & source status'));
  const phases = phaseHistory(row, data);
  if (!phases.length) timeline.append(el('p', 'This is a cross-cutting control added by the author; Appendix B has no separate phase entry.'));
  for (const phase of phases) {
    timeline.append(section(`${phase.id} · ${phase.name}`, phase.event, phase.line),
      el('p', `Window (UTC): ${phase.window}`, 'muted'), el('p', phase.evidence, 'boundary'));
  }
  timeline.append(el('p', 'Phases overlap in time and do not form a strictly ordered chain.', 'muted')); detail.append(timeline);
  const refs = el('details', undefined, 'expand'); refs.append(el('summary', 'Numbered references used in this row'));
  const numbers = new Set([...`${row.basis} ${row.coverage_detail} ${row.coverage_summary_detail}`.matchAll(/\[(\d+(?:,\s*\d+)*)\]/g)].flatMap(m => m[1].split(/,\s*/).map(Number)));
  for (const ref of data.references.filter(ref => numbers.has(ref.number))) {
    const p = el('p', `[${ref.number}] ${ref.text}`);
    for (const url of ref.urls) {
      const link = el('a', 'Open source ↗', 'source-link'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; p.append(' ', link);
    } refs.append(p);
  }
  refs.append(el('p', 'Reference numbers follow the paper, not the larger SOURCES.md list. External pages have not been checked for updates by this reader.', 'muted'));
  detail.append(refs, el('p', `Paper SHA-256: ${data.source.sha256}`, 'hash print-source'));
}
function render({push = false, focus = false} = {}) {
  visible = data.controls.filter(row => matches(row, state, data));
  if (!visible.some(row => row.id === state.row)) state.row = visible[0]?.id || '';
  syncUrl(push); $('count').textContent = `${visible.length} of ${data.controls.length}`;
  $('empty').hidden = visible.length > 0; $('rows').replaceChildren();
  for (const row of visible) {
    const button = el('button', undefined, 'row-button'); button.type = 'button';
    button.dataset.row = row.id;
    button.setAttribute('aria-current', row.id === state.row ? 'true' : 'false');
    const label = el('span', `Row ${row.row}`, 'row-label'); label.append(badge(row.tier));
    button.append(label, el('span', row.short_control, 'row-text'));
    if (row.coverage_discrepancy) button.append(el('span', 'Source disagreement', 'row-note'));
    button.addEventListener('click', () => { state.row = row.id; render({push: true, focus: true}); });
    $('rows').append(button);
  }
  renderDetail(visible.find(row => row.id === state.row));
  $('export-json').disabled = $('export-csv').disabled = !visible.length; $('print').disabled = !state.row;
  if (focus) $('detail').focus();
}
function clear() { state = readState('', data); fillFilters(); render(); }
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], {type})), link = el('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); $('notice').textContent = `Exported ${visible.length} visible rows.`;
}
function renderAudit() {
  const audit = $('audit-content');
  audit.append(el('p', 'The paper is the source of the reader. Six CSV exports are compared cell by cell after removing inline emphasis and code markers; the source files are never rewritten.'));
  audit.append(el('p', `${data.audit.csv_differences.length} CSV cell differences. ${data.audit.coverage_discrepancies.length} categorical coverage disagreements inside the paper.`));
  const table = el('table'), head = el('thead'), tr = el('tr');
  for (const title of ['Row', 'Summary table', 'Appendix E']) tr.append(el('th', title)); head.append(tr); table.append(head);
  const body = el('tbody');
  for (const item of data.audit.coverage_discrepancies) {
    const row = el('tr'); row.append(el('td', item.row));
    for (const [key, line] of [['summary', 'summary_line'], ['appendix', 'appendix_line']]) {
      const cell = el('td', item[key]); cell.append(' ', sourceLink(item[line], '↗')); row.append(cell);
    } body.append(row);
  } table.append(body); audit.append(table);
  for (const item of data.audit.csv_differences) {
    const d = el('details', undefined, 'expand'); d.append(el('summary', `${item.file} · row ${item.row} · ${item.column}`),
      el('p', 'CSV: ' + item.csv), el('p', 'Paper: ' + item.paper), sourceLink(item.paper_line)); audit.append(d);
  }
  audit.append(el('p', 'Coverage filters use the summary table. Role links reproduce the phase labels in Table D1; duplicate phases 0 and G retain both controls. No conformity score or effectiveness ranking is computed.'),
    el('p', 'S1-stated: victim-side account. S2-stated: OpenAI account. Derived: the author’s inference from documented mechanics. These markings are retained as written.'),
    el('p', 'T1: configuration or policy. T2: tooling or integration. T3: architecture. A range includes both named kinds of change.'),
    el('p', `Paper SHA-256: ${data.source.sha256}`, 'hash'));
}
async function start() {
  const response = await fetch('data.json'); if (!response.ok) throw new Error(`Data request failed (${response.status})`);
  data = await response.json(); if (data.schema !== 'control-matrix-reader/1' || data.controls.length !== 20) throw new Error('Unexpected reader dataset');
  for (const phase of new Set(data.controls.map(row => row.phase))) { const option = el('option', phase); option.value = phase; $('phase').append(option); }
  state = readState(location.search, data); fillFilters(); render(); renderAudit();
  $('conflict-count').textContent = `(${data.audit.coverage_discrepancies.length})`;
  $('provenance').textContent = `Paper snapshot · SHA-256 ${data.source.sha256.slice(0, 12)}…`;
  for (const field of fields) $(field).addEventListener(field === 'search' ? 'input' : 'change', () => {
    state[field === 'search' ? 'q' : field] = field === 'conflicts' ? $(field).checked : $(field).value;
    render();
  });
  $('clear').addEventListener('click', clear); $('empty-clear').addEventListener('click', clear);
  $('export-json').addEventListener('click', () => download('control-matrix-selection.json',
    JSON.stringify({schema: 'control-matrix-selection/1', source: data.source, limits: data.limits, filters: state,
      controls: visible, disclosures: data.disclosures.filter(item => visible.some(row => row.disclosures.includes(item.id)))}, null, 2) + '\n', 'application/json'));
  $('export-csv').addEventListener('click', () => download('control-matrix-selection.csv', exportCsv(visible, data), 'text/csv;charset=utf-8'));
  let openedForPrint = [];
  window.addEventListener('beforeprint', () => {
    openedForPrint = [...$('detail').querySelectorAll('details:not([open])')];
    for (const item of openedForPrint) item.open = true;
  });
  window.addEventListener('afterprint', () => {
    for (const item of openedForPrint) item.open = false;
    openedForPrint = [];
  });
  $('print').addEventListener('click', () => window.print());
  window.addEventListener('popstate', () => { state = readState(location.search, data); fillFilters(); render(); });
}
start().catch(error => {
  $('error').hidden = false; $('error').textContent = `The reader could not load. Serve the repository over HTTP (see README) or open the paper directly. ${error.message}`;
  $('count').textContent = 'Unavailable'; $('detail').replaceChildren(el('p', 'The source paper and CSV files remain available in the repository.'));
});
