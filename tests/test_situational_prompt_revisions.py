"""Acceptance checks for independent, queued v2/v3 revisions."""
import copy
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from validate_situational_prompt_revisions import load_and_validate, validate_records


class RevisionQueueTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records, cls.issues = load_and_validate()
        from json import loads
        cls.canonical = {p.stem: loads(p.read_text(encoding="utf-8"))
                         for p in (ROOT / "situational-prompts").glob("SIT-*.json")}

    def test_exactly_sixteen_versioned_revisions(self):
        self.assertEqual(self.issues, [])
        self.assertEqual(len(self.records), 16)
        for n in range(1, 9):
            family = f"SIT-{n:04d}"
            revisions = [r for _, r in self.records if r["canonical_prompt_id"] == family]
            self.assertEqual([r["proposed_version"] for r in revisions], ["2.0.0", "3.0.0"])
            self.assertEqual(revisions[0]["predecessor_ref"], family + "@1.0.0")
            self.assertEqual(revisions[1]["predecessor_ref"], f"SIT-REV-{n:04d}-02")
            self.assertTrue(all(r["status"] == "queued" for r in revisions))
            self.assertEqual(self.canonical[family]["version"], "1.0.0")
            self.assertEqual(self.canonical[family]["status"], "published")

    def test_no_launcher_or_personal_labels_leak_into_metadata(self):
        for _, r in self.records:
            for forbidden in ("key", "shortcut_key", "source_label", "label", "title"):
                self.assertNotIn(forbidden, r)
                self.assertNotIn(forbidden, r["source"])
            self.assertFalse(r["review"]["processing_authorized"])
            self.assertFalse(r["review"]["publication_authorized"])

    def test_reminder_to_execution_behavioral_change_is_flagged(self):
        for _, r in self.records:
            if r["canonical_prompt_id"] in ("SIT-0006", "SIT-0007"):
                self.assertIn("reinforcement_to_execution_requires_review", r["review"]["flags"])

    def test_modified_text_fails_source_digest(self):
        record = copy.deepcopy(self.records[0][1])
        record["proposed_text"] += " unrelated mutation"
        failures = validate_records([(self.records[0][0], record)], self.canonical)
        self.assertTrue(any("checksum" in message for message in failures))

    def test_missing_prior_version_is_detected(self):
        _, r = next((p, v) for p, v in self.records if v["proposed_version"] == "3.0.0")
        failure = validate_records([(pathlib.Path(r["id"] + ".json"), r)], self.canonical)
        self.assertTrue(any("missing immediately preceding" in message for message in failure))


if __name__ == "__main__":
    unittest.main()
