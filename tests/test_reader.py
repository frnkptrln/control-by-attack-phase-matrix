import csv
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("build_reader", ROOT / "scripts/build_reader.py")
reader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reader)


class ReaderDataTests(unittest.TestCase):
    def test_checked_in_data_is_reproducible_and_complete(self):
        self.assertEqual(reader.payload(), (ROOT / "web/data.json").read_bytes())
        data = reader.build()
        self.assertEqual((len(data["controls"]), len(data["phases"]), len(data["disclosures"])), (20, 10, 12))
        self.assertEqual(len({row["id"] for row in data["controls"]}), 20)
        self.assertEqual(data["source"]["sha256"], hashlib.sha256((ROOT / reader.PAPER).read_bytes()).hexdigest())

    def test_repeated_phases_and_composite_phase_are_preserved(self):
        rows = reader.build()["controls"]
        self.assertEqual([row["row"] for row in rows if row["phase"] == "0"], ["0 write surface", "0 detection"])
        self.assertEqual([row["row"] for row in rows if row["phase"] == "G"], ["G enrolment", "G app scopes / CI"])
        self.assertEqual(next(row for row in rows if row["phase"] == "C/F")["disclosures"], ["PO-2"])
        self.assertEqual(next(row for row in rows if row["phase"] == "F4")["disclosures"], ["PO-3"])

    def test_conflicting_paper_labels_are_retained_with_source_lines(self):
        data = reader.build()
        self.assertEqual([row["row"] for row in data["audit"]["coverage_discrepancies"]], ["0 detection", "F1", "F8"])
        source_lines = (ROOT / reader.PAPER).read_text().splitlines()
        for item in data["audit"]["coverage_discrepancies"]:
            self.assertEqual(item["summary"], "partly, or in progress")
            self.assertEqual(item["appendix"], "declared")
            self.assertIn(item["row"], source_lines[item["summary_line"] - 1])
            self.assertIn("| declared |", source_lines[item["appendix_line"] - 1])
        self.assertEqual(data["audit"]["csv_differences"], [])

    def test_controls_map_to_literal_paper_cells(self):
        lines = (ROOT / reader.PAPER).read_text().splitlines()
        for row in reader.build()["controls"]:
            self.assertEqual(row["control"], reader.cells(lines[row["lines"]["control"] - 1])[1])
            self.assertEqual(row["external"], reader.cells(lines[row["lines"]["evidence"] - 1])[2])
            self.assertEqual(row["coverage_appendix"], reader.cells(lines[row["lines"]["coverage"] - 1])[2])

    def test_missing_duplicate_and_malformed_tables_fail_closed(self):
        original = (ROOT / reader.PAPER).read_text()
        examples = [original.replace("| Phase | Control | Basis | Observable trigger |", "removed"),
                    original + "\n| Phase | Control | Basis | Observable trigger |\n|---|---|---|---|\n| A | x | y | z |\n",
                    original.replace("| C/F | Pod-level block", "| unexpected | extra | Pod-level block")]
        for text in examples:
            with self.assertRaises(ValueError): reader.extract_tables(text)

    def copy_root(self, temporary):
        root = Path(temporary)
        for directory in ("paper", "matrix"):
            shutil.copytree(ROOT / directory, root / directory)
        shutil.copy(ROOT / "reader_source.json", root / "reader_source.json")
        return root

    def test_csv_disagreement_is_reported_without_replacing_authoritative_text(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = self.copy_root(temporary)
            path = root / "matrix/matrix_C1_control_basis_trigger.csv"
            source = list(csv.reader(io.StringIO(path.read_text())))
            source[1][1] = "A deliberately different export cell"
            with path.open("w", newline="") as stream: csv.writer(stream).writerows(source)
            data = reader.build(root)
            self.assertEqual(len(data["audit"]["csv_differences"]), 1)
            self.assertNotEqual(data["controls"][0]["control"], source[1][1])
            self.assertEqual(data["audit"]["csv_differences"][0]["row"], 1)

    def test_changed_paper_requires_source_pin_review(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = self.copy_root(temporary)
            path = root / reader.PAPER
            path.write_text(path.read_text() + "\nchanged\n")
            with self.assertRaisesRegex(ValueError, "reader_source"):
                reader.build(root)

    def test_csv_rows_with_extra_or_missing_cells_are_rejected(self):
        for filename in reader.EXPORTS.values():
            for change in ("extra", "missing"):
                with self.subTest(file=filename, change=change), tempfile.TemporaryDirectory() as temporary:
                    root = self.copy_root(temporary)
                    path = root / "matrix" / filename
                    rows = list(csv.reader(io.StringIO(path.read_text())))
                    if change == "extra":
                        rows[1].append("An unexpected export cell")
                    else:
                        rows[1].pop()
                    with path.open("w", newline="") as stream:
                        csv.writer(stream).writerows(rows)
                    with self.assertRaisesRegex(ValueError, f"CSV row shape changed: matrix/{filename}; row 1"):
                        reader.build(root)

    def test_csv_explicit_empty_cells_remain_auditable(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = self.copy_root(temporary)
            path = root / "matrix/matrix_C1_control_basis_trigger.csv"
            rows = list(csv.reader(io.StringIO(path.read_text())))
            rows[1][-1] = ""
            with path.open("w", newline="") as stream:
                csv.writer(stream).writerows(rows)
            differences = reader.build(root)["audit"]["csv_differences"]
            self.assertEqual(len(differences), 1)
            self.assertEqual(differences[0]["column"], "Observable trigger")
            self.assertEqual(differences[0]["csv"], "")

    def test_reordered_control_rows_cannot_be_misjoined(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = self.copy_root(temporary)
            path = root / reader.PAPER
            text = path.read_text()
            text = text.replace("| C/F | Pod-level", "| X | Pod-level")
            path.write_text(text)
            pin = json.loads((root / "reader_source.json").read_text())
            pin["paper_sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
            (root / "reader_source.json").write_text(json.dumps(pin))
            with self.assertRaisesRegex(ValueError, "phase/order"):
                reader.build(root)


if __name__ == "__main__":
    unittest.main()
