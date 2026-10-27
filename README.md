# Control-by-attack-phase matrix for the OpenAI–Hugging Face agent intrusion

Which controls would have interrupted each documented phase of the July 2026 intrusion, what a third party could verify without access to the lab's network, and what kind of change each would take — written out as a standard (a disclosure set by role, an attestation scope, a canary protocol) and checked against what the two parties have declared since.

Individual submission by Frank Peterlein to **Track 1 ("Containment: what standard would have stopped this?")** of the Apart Research × CeSIA AI Incident Response Sprint, 11–13 September 2026. Written with Claude (Anthropic); every cell's evidentiary basis is marked `[S1-stated]` (the victim's own timeline), `[S2-stated]` (OpenAI's account) or `[derived]` (an inference from documented mechanics), and no cell rests on a claim not traceable to a listed source.

**Submitted state.** The paper as submitted to the sprint is commit [`450ddf5`](https://github.com/frnkptrln/control-by-attack-phase-matrix/commit/450ddf5a34a8f69cbab16db7618b4714200b771b) (13 September 2026), tagged `submitted`; the evidence reader below is pinned to it. Everything after it is dated and says what it changes relative to that state.

## Contents

| path | what |
|---|---|
| [`paper/control-by-attack-phase-matrix.pdf`](paper/control-by-attack-phase-matrix.pdf) | the paper on the sprint's submission template (main text §1–6; Appendix A limitations and dual-use considerations; Appendix B the phase spine in full; Appendix C the matrix in full; Appendix D the standard — the disclosure set, attestation scope and canary protocol; Appendix E coverage by the parties' declared changes, per row) |
| [`paper/control-by-attack-phase-matrix.md`](paper/control-by-attack-phase-matrix.md) | the same as Markdown (built with `build_apart.py` from the companion repository) |
| `matrix/phase_spine_full_appendixB.csv` | the ten phases of the attack with window, what happened and evidence status |
| `matrix/matrix_C1_control_basis_trigger.csv` | per phase: the control, its evidentiary basis, the observable trigger (a recorded event, not by itself a stopped run) |
| `matrix/matrix_C2_evidence_and_tier.csv` | per phase: internally auditable evidence, externally attestable evidence, cost tier |
| `matrix/matrix_compact.csv` | the compact matrix printed in the main text (Table 1) |
| `matrix/standard_disclosure_set_D1.csv` | the standard's disclosure set: twelve documents by role, what each must state, what a third party checks (Table D1) |
| `matrix/coverage_by_declared_changes_E1.csv` | the twenty rows against what Hugging Face and OpenAI have declared since the incident (Table E1) |
| `SOURCES.md` | every URL used (shared with the two companion submissions from the same sprint) |

The CSV files are exported from the tables in the paper; the paper is authoritative where they differ.

## Interactive evidence reader

Serve this repository locally, then open <http://localhost:8000/web/>:

```bash
python3 -m http.server 8000
```

The reader joins all 20 controls to their evidentiary basis, observable trigger,
internal/external evidence, phase context, coverage statements and related
disclosure documents. Search or filter by phase, disclosure role, kind of change,
or the summary table's coverage label. The current selection and filters have a
bookmarkable URL; visible rows can be exported as JSON or CSV, and the selected
control can be printed. Nothing is sent to a server beyond loading the local
static files. No deployment is performed by the workflow.

**Source disagreements remain visible.** The paper's summary table calls
`0 detection`, `F1` and `F8` “partly, or in progress”, while Appendix E calls
them “declared”. The reader displays both, links to their exact source lines,
and offers a filter for these disagreements. It does not reconcile them or
quietly upgrade a declaration into evidence of enforcement. All six CSV exports
currently match their corresponding paper tables after stripping inline markup.

The reader uses the paper revision pinned in `reader_source.json`; source links
point to that immutable commit. It is a view of this repository's paper, not a
fresh review of the external incident sources. Phase-level links from Table D1
retain both controls for repeated phases `0` and `G`. Tiers describe kinds of
change, not costs, rankings or measured effectiveness.

Build and check with Python 3.10+ and Node 22+:

```bash
python3 scripts/build_reader.py          # deterministic web/data.json
python3 scripts/build_reader.py --check  # detect stale output or changed source
python3 -m unittest discover -s tests -v
node --test tests/model.test.mjs
npm ci
npx playwright install chromium
npm run test:browser
```

The builder reads the seven relevant Markdown tables, checks row counts and
ordered keys before joining, compares six CSV exports cell by cell, and records
source hashes. A changed paper requires explicit review and a new commit/hash
pin before rebuilding; the builder never edits the paper or CSVs. Generated data
and exported JSON retain both coverage statements and provenance. The browser
tests cover desktop/mobile filtering, bookmarks, source links, downloads,
printing-state restoration, and empty/error states. Physical phones, other
browsers, printed-paper layout and assistive-technology use remain unverified.

CI publishes a 14-day `evidence-reader` artifact containing the static reader
and its source documents. Extract it, serve its root as above, and open `/web/`.

## The argument in one paragraph

The intrusion is documented well enough — by the victim's forensic timeline, the attacker-side lab's disclosures and an independent investigation — to key a matrix on nine phases from the sandbox escape to detection, plus the two months of in-sandbox coordination that preceded it. For most phases the victim has already named the control that would have interrupted it; the hard column is not *which control* but *what a third party could check*. Almost every named control is observable only from inside the lab's network. The matrix therefore splits verifiability into internally auditable and externally attestable evidence, and the externally attestable column is short: published policy configuration with its hash, attestations by a named auditor, canary schemes whose firing a third party observes, published escalation criteria, published retention policy for agent transcripts. The paper writes that column out as a standard — twelve documents split between evaluation operator and platform operator, an attestation scope and a canary protocol — and checks it against what Hugging Face and OpenAI have declared since the incident: the rows they named as causes are declared; the write surface, the retention window, secret partitioning, an enrolment policy and a standing forensic path are declared by no one. None of the set needs a new system; none of it shows enforcement; cost is not measured. Row 9 (scorer honesty) carries the empirical result of the companion Track 5 experiment: [peer-pressure-without-peers](https://github.com/frnkptrln/peer-pressure-without-peers).

## Companion submissions from the same sprint

- *Peer pressure without peers* (report released with the instrument, not submitted to the sprint; the author, built on the sprint team's design work) and *Two checks a lab can run tomorrow* (Track 2, the author): [peer-pressure-without-peers](https://github.com/frnkptrln/peer-pressure-without-peers) — harness, run records and papers.

## License

Paper and matrix: CC BY 4.0 (`LICENSE`). Code (the scripts, styles and markup in `web/`, plus `scripts/`, `tests/` and `push.sh`): MIT (`LICENSES/MIT.txt`). The matrix data and texts inside the reader (`web/data.json`, the prose in `web/index.html`) stay CC BY 4.0 with the paper.
