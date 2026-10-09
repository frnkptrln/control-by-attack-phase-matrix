export function matches(row, filters, data) {
  if (filters.phase && row.phase !== filters.phase) return false;
  if (filters.tier && !row.tiers.includes(filters.tier)) return false;
  if (filters.coverage && row.coverage_summary !== filters.coverage) return false;
  if (filters.conflicts && !row.coverage_discrepancy) return false;
  const documents = data.disclosures.filter(item => row.disclosures.includes(item.id));
  if (filters.role && !documents.some(item => item.role === filters.role)) return false;
  const search = [row.row, row.control, row.basis, row.trigger, row.internal, row.external, row.coverage_detail,
    ...documents.map(item => `${item.id} ${item.title} ${item.must_state}`)].join(' ').toLocaleLowerCase('en');
  return filters.q.toLocaleLowerCase('en').trim().split(/\s+/).every(word => search.includes(word));
}

export function readState(search, data) {
  const params = new URLSearchParams(search);
  const phase = params.get('phase') || '', tier = params.get('tier') || '', role = params.get('role') || '';
  const coverage = params.get('coverage') || '';
  return {
    q: (params.get('q') || '').slice(0, 500),
    phase: data.controls.some(row => row.phase === phase) ? phase : '',
    tier: ['T1', 'T2', 'T3'].includes(tier) ? tier : '', role: ['EO', 'PO'].includes(role) ? role : '',
    coverage: data.controls.some(row => row.coverage_summary === coverage) ? coverage : '',
    conflicts: params.get('conflicts') === '1',
    row: data.controls.some(row => row.id === params.get('row')) ? params.get('row') : '',
  };
}

export function stateQuery(state) {
  const params = new URLSearchParams();
  for (const key of ['q', 'phase', 'role', 'tier', 'coverage', 'row']) if (state[key]) params.set(key, state[key]);
  if (state.conflicts) params.set('conflicts', '1');
  return params.toString();
}

export function phaseHistory(row, data) {
  const ids = row.phase === 'C/F' ? ['C', 'F'] : /^F\d/.test(row.phase) ? ['F'] : [row.phase];
  return data.phases.filter(phase => ids.includes(phase.id));
}

export function exportCsv(rows, data) {
  const headers = ['row', 'phase', 'control', 'basis', 'trigger', 'internal', 'external', 'tier',
    'coverage_summary', 'coverage_appendix', 'coverage_discrepancy', 'paper_sha256'];
  const quote = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  return [headers, ...rows.map(row => headers.map(key => key === 'paper_sha256' ? data.source.sha256 : row[key]))]
    .map(values => values.map(quote).join(',')).join('\r\n') + '\r\n';
}
