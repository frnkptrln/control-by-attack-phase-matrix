import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matches, readState, stateQuery, phaseHistory, exportCsv} from '../web/model.mjs';
const data = JSON.parse(readFileSync(new URL('../web/data.json', import.meta.url)));
const state = patch => ({q:'',phase:'',role:'',tier:'',coverage:'',conflicts:false,row:'',...patch});

test('filters use summary coverage without discarding Appendix E disagreements', () => {
  assert.equal(data.controls.filter(row => matches(row, state({coverage:'declared'}), data)).length, 4);
  assert.deepEqual(data.controls.filter(row => matches(row,state({conflicts:true}),data)).map(row=>row.row), ['0 detection','F1','F8']);
});
test('range tiers and role links include repeated phases', () => {
  assert.deepEqual(data.controls.filter(row=>matches(row,state({tier:'T3'}),data)).map(row=>row.row),['A']);
  assert.equal(data.controls.filter(row=>matches(row,state({phase:'G',role:'PO'}),data)).length,2);
  assert.equal(data.controls.filter(row=>matches(row,state({phase:'G',role:'EO'}),data)).length,0);
});
test('search is all-word and does not use unrelated summary-group prose', () => {
  const rows = data.controls.filter(row=>matches(row,state({q:'RETENTION transcripts'}),data));
  assert.deepEqual(rows.map(row=>row.row),['7']);
  assert.equal(data.controls.filter(row=>matches(row,state({q:'nonexistent word'}),data)).length,0);
});
test('URL state round-trips composite phases and rejects unknown filter values', () => {
  const original = state({q:'secret object',phase:'C/F',row:'control-06',conflicts:true});
  assert.deepEqual(readState(stateQuery(original),data),original);
  assert.deepEqual(readState('?phase=X&tier=T9&role=unknown&coverage=yes&row=garbage',data),state());
});
test('timeline associates composite and subphases without inventing new events', () => {
  assert.deepEqual(phaseHistory(data.controls.find(row=>row.phase==='C/F'),data).map(x=>x.id),['C','F']);
  assert.deepEqual(phaseHistory(data.controls.find(row=>row.phase==='F8'),data).map(x=>x.id),['F']);
  assert.deepEqual(phaseHistory(data.controls.find(row=>row.phase==='7'),data),[]);
});
test('CSV carries both coverage versions and quotes commas, quotes and newlines', () => {
  const row={...data.controls[1],control:'A "quoted",\nmultiline control'};
  const csv=exportCsv([row],data);
  assert.ok(csv.includes('"A ""quoted"",\nmultiline control"'));
  assert.ok(csv.includes('"partly, or in progress","declared","true"'));
  assert.ok(csv.includes(data.source.sha256));
});
