"""SPEC-0141: independent before/after visual progress obligation."""
import json
import pathlib
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
from validate import load_catalog, validate

def load(rel):
    return json.loads((ROOT/rel).read_text(encoding="utf-8"))

class ComparativeVisualProgressTests(unittest.TestCase):
    def test_canonical_and_candidate_are_distinct_and_valid(self):
        rule=load("rules/NOM-0137.json")
        proposal=load("processing/specimens/candidates/NOM-0137.json")
        source=load("queues/specimens/SPEC-0141.json")
        trace=load("processing/specimens/PROC-SPEC-0141.json")
        self.assertEqual((rule["status"],rule["version"],rule["governance"]["review_status"]),
                         ("published","1.0.0","approved"))
        self.assertEqual((proposal["status"],proposal["version"],proposal["governance"]["review_status"]),
                         ("draft","0.1.0","unreviewed"))
        self.assertEqual(rule["statement"],proposal["statement"])
        self.assertEqual(trace["source_specimen_id"],source["id"])
        self.assertEqual(trace["normalization"]["canonical_rule_id"],rule["id"])
        self.assertEqual(source["processing"]["record"],"processing/specimens/PROC-SPEC-0141.json")
        self.assertEqual(source["status"],"processed")
        self.assertTrue(source["intake"]["processing_authorized"])
        taxonomy,rules=load_catalog()
        self.assertEqual(validate(taxonomy,rules),[])

    def test_requires_prior_current_and_signed_percentage_point_change(self):
        rule=load("rules/NOM-0137.json")
        body=rule["statement"].lower()
        self.assertIn("previous verified completion percentage",body)
        self.assertIn("current verified completion percentage",body)
        self.assertIn("percentage-point change",body)
        self.assertIn("current minus previous",body)
        self.assertIn("+0 pp",body)
        self.assertIn("negative pp",body)
        self.assertIn("unknown",body)
        self.assertIn("scope",body)
        self.assertIn("verified deliverables",body)
        self.assertEqual(rule["norm"]["kind"],"obligation")
        self.assertEqual(rule["norm"]["bounds"]["quantifier"],"all")
        self.assertEqual(rule["norm"]["bounds"]["interpretation"],"universal")
        self.assertIn("NOM-0069",rule["relations"]["refines"])
        self.assertIn("NOM-0070",rule["relations"]["refines"])
        self.assertEqual(rule["categories"]["topics"],
                         ["progress_reporting","visual_progress_before_after_interval_delta"])

    def test_existing_rules_are_preserved_and_no_profile_autoselects(self):
        for rid in ("NOM-0066","NOM-0067","NOM-0068","NOM-0069","NOM-0070","NOM-0071","NOM-0072"):
            self.assertEqual(load(f"rules/{rid}.json")["status"],"published")
        for path in (ROOT/"profiles").glob("PROFILE-*.json"):
            profile=load(path.relative_to(ROOT))
            if path.name in {"PROFILE-0002.json","PROFILE-0004.json","PROFILE-0006.json","PROFILE-0008.json","PROFILE-0010.json","PROFILE-0012.json"}:
                self.assertIn("NOM-0137",profile["selected_rule_ids"])
                self.assertEqual(profile["status"],"draft")
                self.assertFalse(profile["review"]["selection_confirmed"])
                self.assertFalse(profile["review"]["finalization_confirmed"])
            else:
                self.assertNotIn("NOM-0137",profile.get("selected_rule_ids",[]),path.name)

if __name__=="__main__":
    unittest.main()
