#!/usr/bin/env python3
"""Build the static reader from the paper; audit CSV exports without rewriting them."""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PAPER = "paper/control-by-attack-phase-matrix.md"
ROW_NAMES = ("0 write surface", "0 detection", "A", "B", "C", "C/F", "D", "E", "F1", "F4", "F5", "F6", "F8",
             "G enrolment", "G app scopes / CI", "H", "I", "7", "8", "9")
PHASES = ("0", "0", "A", "B", "C", "C/F", "D", "E", "F1", "F4", "F5", "F6", "F8", "G", "G", "H", "I", "7", "8", "9")
TABLES = {
    "compact": ("Phase", "Control", "Externally attestable evidence", "Tier"),
    "coverage_summary": ("Status", "Rows", "Who declares what"),
    "phases": ("#", "Phase", "Window (UTC)", "What happened", "Evidence status"),
    "controls": ("Phase", "Control", "Basis", "Observable trigger"),
    "evidence": ("Phase", "Internally auditable", "Externally attestable", "Tier"),
    "disclosures": ("Item", "Rows", "Must state", "A third party checks"),
    "coverage": ("Row", "Declared since the incident", "Status"),
}
EXPORTS = {
    "compact": "matrix_compact.csv", "phases": "phase_spine_full_appendixB.csv",
    "controls": "matrix_C1_control_basis_trigger.csv", "evidence": "matrix_C2_evidence_and_tier.csv",
    "disclosures": "standard_disclosure_set_D1.csv", "coverage": "coverage_by_declared_changes_E1.csv",
}


def plain(value):
    # This paper uses emphasis and code spans in table cells, not nested markup.
    return value.replace("\\|", "|").replace("**", "").replace("`", "").replace("*", "").strip()


def cells(line):
    return tuple(plain(value) for value in re.split(r"(?<!\\)\|", line.strip())[1:-1])


def extract_tables(text):
    found = {}
    lines = text.splitlines()
    for i, line in enumerate(lines[:-1]):
        if not line.startswith("|") or not re.fullmatch(r"\|[\s:|\-]+\|", lines[i + 1]):
            continue
        header = cells(line)
        names = [name for name, expected in TABLES.items() if header == expected]
        if not names:
            continue
        name = names[0]
        if name in found:
            raise ValueError(f"Duplicate authoritative table: {name}")
        rows = []
        for number in range(i + 2, len(lines)):
            if not lines[number].startswith("|"):
                break
            values = cells(lines[number])
            if len(values) != len(header):
                raise ValueError(f"Malformed {name} row at paper line {number + 1}")
            rows.append({"values": dict(zip(header, values)), "line": number + 1})
        found[name] = {"headers": list(header), "rows": rows, "line": i + 1}
    if set(found) != set(TABLES):
        raise ValueError("Missing paper tables: " + ", ".join(set(TABLES) - set(found)))
    for name, count in (("compact", 20), ("coverage_summary", 3), ("phases", 10),
                        ("controls", 20), ("evidence", 20), ("disclosures", 12), ("coverage", 20)):
        if len(found[name]["rows"]) != count:
            raise ValueError(f"{name} row count changed; review joins before regenerating")
    return found


def build(root=ROOT):
    source = (root / PAPER).read_bytes()
    pin = json.loads((root / "reader_source.json").read_bytes())
    if not re.fullmatch(r"[0-9a-f]{40}", pin["revision"]) or hashlib.sha256(source).hexdigest() != pin["paper_sha256"]:
        raise ValueError("Paper differs from reader_source.json; review the new source revision before updating the pin")
    text = source.decode("utf-8")
    tables = extract_tables(text)
    for name in ("compact", "controls", "evidence"):
        if tuple(row["values"]["Phase"] for row in tables[name]["rows"]) != PHASES:
            raise ValueError(f"{name} phase/order mismatch; refuse a positional misjoin")
    if tuple(row["values"]["Row"] for row in tables["coverage"]["rows"]) != ROW_NAMES:
        raise ValueError("Appendix E row labels/order changed")
    summary = {}
    for row in tables["coverage_summary"]["rows"]:
        for name in row["values"]["Rows"].split(", "):
            if name in summary:
                raise ValueError(f"Repeated summary coverage row: {name}")
            summary[name] = row
    if set(summary) != set(ROW_NAMES):
        raise ValueError("Summary coverage does not cover exactly the 20 control rows")
    disclosures = []
    for row in tables["disclosures"]["rows"]:
        item = row["values"]["Item"]
        identifier, title = item.split(" ", 1)
        phases = row["values"]["Rows"].split(", ")
        if not set(phases) <= set(PHASES):
            raise ValueError(f"Unknown disclosure phase: {identifier}")
        disclosures.append({"id": identifier, "title": title, "role": identifier[:2], "phases": phases,
                            "must_state": row["values"]["Must state"], "third_party": row["values"]["A third party checks"],
                            "line": row["line"]})
    if len({item["id"] for item in disclosures}) != 12:
        raise ValueError("Disclosure IDs are not unique")
    controls = []
    discrepancies = []
    for i, name in enumerate(ROW_NAMES):
        control, evidence, coverage, compact = (tables[key]["rows"][i] for key in ("controls", "evidence", "coverage", "compact"))
        phase = PHASES[i]
        group = summary[name]["values"]["Status"]
        appendix = coverage["values"]["Status"]
        # A discrepancy is reported only for an explicit categorical conflict,
        # not because one source adds qualifying words to a partial declaration.
        conflict = appendix in {"declared", "not declared"} and group != appendix
        if conflict:
            discrepancies.append({"row": name, "summary": group, "appendix": appendix,
                                  "summary_line": summary[name]["line"], "appendix_line": coverage["line"]})
        controls.append({"id": f"control-{i + 1:02}", "row": name, "phase": phase,
                         "control": control["values"]["Control"], "short_control": compact["values"]["Control"],
                         "basis": control["values"]["Basis"], "trigger": control["values"]["Observable trigger"],
                         "internal": evidence["values"]["Internally auditable"], "external": evidence["values"]["Externally attestable"],
                         "tier": evidence["values"]["Tier"], "tiers": re.findall(r"T[123]", evidence["values"]["Tier"]),
                         "disclosures": [item["id"] for item in disclosures if phase in item["phases"]],
                         "coverage_summary": group, "coverage_summary_detail": summary[name]["values"]["Who declares what"],
                         "coverage_appendix": appendix, "coverage_detail": coverage["values"]["Declared since the incident"],
                         "coverage_discrepancy": conflict,
                         "lines": {"control": control["line"], "evidence": evidence["line"],
                                   "coverage": coverage["line"], "summary": summary[name]["line"]}})
    csv_differences, hashes = [], {PAPER: hashlib.sha256(source).hexdigest()}
    for name, filename in EXPORTS.items():
        path = "matrix/" + filename
        data = (root / path).read_bytes()
        hashes[path] = hashlib.sha256(data).hexdigest()
        reader = csv.DictReader(io.StringIO(data.decode("utf-8-sig")))
        rows = list(reader)
        if reader.fieldnames != tables[name]["headers"] or len(rows) != len(tables[name]["rows"]):
            raise ValueError(f"CSV shape changed: {path}; review before rebuilding")
        for i, (exported, paper) in enumerate(zip(rows, tables[name]["rows"]), 1):
            for column in reader.fieldnames:
                if plain(exported[column]) != paper["values"][column]:
                    csv_differences.append({"file": path, "row": i, "column": column,
                                            "csv": exported[column], "paper": paper["values"][column],
                                            "paper_line": paper["line"]})
    references = []
    reference_text = text.split("## References {-}", 1)[1].split("## Appendix A", 1)[0]
    for line in reference_text.splitlines():
        match = re.match(r"(\d+)\. (.+)", line)
        if match:
            references.append({"number": int(match[1]), "text": match[2],
                               "urls": re.findall(r"https?://[^\s)]+", match[2])})
    phases = [{"id": row["values"]["#"], "name": row["values"]["Phase"], "window": row["values"]["Window (UTC)"],
               "event": row["values"]["What happened"], "evidence": row["values"]["Evidence status"], "line": row["line"]}
              for row in tables["phases"]["rows"]]
    return {"schema": "control-matrix-reader/1", "title": "Control-by-attack-phase matrix",
            "source": {"paper": PAPER, "revision": pin["revision"], "sha256": hashes[PAPER], "hashes": hashes,
                       "scope": "Repository paper snapshot; declarations and inferences have not been reverified against current external sources."},
            "controls": controls, "phases": phases, "disclosures": disclosures, "references": references,
            "audit": {"coverage_discrepancies": discrepancies, "csv_differences": csv_differences},
            "limits": "A disclosure is not evidence of enforcement. An observed trigger is not proof of containment. Tiers describe kinds of change, not cost or effectiveness."}


def payload(root=ROOT):
    return (json.dumps(build(root), indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if generated reader data differs")
    args = parser.parse_args()
    try:
        output = ROOT / "web/data.json"
        data = payload()
        if args.check:
            if not output.is_file() or output.read_bytes() != data:
                raise ValueError("web/data.json is stale; run scripts/build_reader.py")
        else:
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(data)
        audit = json.loads(data)["audit"]
        print(json.dumps({"controls": 20, "phases": 10, "disclosures": 12,
                          "coverage_discrepancies": len(audit["coverage_discrepancies"]),
                          "csv_differences": len(audit["csv_differences"]), "check": args.check}))
        return 0
    except (OSError, ValueError, KeyError) as error:
        parser.exit(1, f"Reader build failed: {error}\n")


if __name__ == "__main__":
    raise SystemExit(main())
