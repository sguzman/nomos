import copy
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from validate_situational_ontology_queue import inspect

class SituationalOntologyIntakeTests(unittest.TestCase):
    def test_all_concept_proposals_and_links(self):
        items, errors = inspect()
        self.assertEqual(errors, [])
        self.assertEqual(sorted(items), list(range(1, 7)))
        self.assertEqual([len(items[i]["candidates"]) for i in range(1, 7)],
                         [8, 19, 8, 8, 7, 7])

    def test_intake_cannot_auto_process_publish_or_apply(self):
        items, errors = inspect()
        self.assertEqual(errors, [])
        for item in items.values():
            self.assertEqual(item["status"], "queued")
            self.assertEqual(item["authorization"], {
                "intake_authorized": True,
                "processing_authorized": False,
                "publication_authorized": False,
                "auto_apply": False,
            })

    def test_current_prompt_versions_unmodified(self):
        for index in range(1, 9):
            sid = f"SIT-{index:04d}"
            canonical = json.loads((ROOT / "situational-prompts" / (sid + ".json")).read_text())
            self.assertEqual(canonical["version"], "1.0.0")
            self.assertEqual(canonical["status"], "published")
            for rev in ("02", "03"):
                path = ROOT / "queues/situational-prompts/revisions" / f"SIT-REV-{index:04d}-{rev}.json"
                proposal = json.loads(path.read_text())
                self.assertEqual(proposal["status"], "queued")
                self.assertFalse(proposal["review"]["processing_authorized"])
                self.assertFalse(proposal["review"]["publication_authorized"])

    def test_diagnostics_keep_classification_uncertainty(self):
        items, errors = inspect()
        self.assertEqual(errors, [])
        situations = {s["id"]: s for s in items[1]["candidates"]}
        self.assertEqual(situations["S5"]["classification_hypothesis"], "candidate_condition")
        self.assertEqual(set(situations["S8"]["component_situation_ids"]), {"S3", "S6", "S7"})
        self.assertTrue(all(i["atomicity"] == "hypothesis_to_review" for i in items[2]["candidates"]))

if __name__ == "__main__":
    unittest.main()
