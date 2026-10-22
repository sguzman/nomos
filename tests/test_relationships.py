"""Verify proposed semantic links remain advisory, scoped and reviewable."""
import copy
import json
import unittest
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT / "tools"))
from relationships import infer, build_relationships, validate_reviewed
from validate import load_catalog, overlaps

class RelationshipReviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _,rules=load_catalog()
        cls.rules={r["id"]:r for r in rules}

    def test_same_concept_competing_effects_are_only_a_review_candidate(self):
        x=copy.deepcopy(self.rules["NOM-0119"])
        y=copy.deepcopy(x)
        x["semantic"]={"concept":"public_ontology","aliases":[]}
        y["semantic"]={"concept":"ontology_synonym","aliases":["public_ontology"]}
        y["norm"]["predicate"]={"action":"forbid","object":"public_ontology","target":"tarium"}
        y["norm"]["kind"]="prohibition"
        self.assertEqual(infer(x,y)[0],"possible_conflict")
        y["scope"]["project_types"]=["rust_fork_maintenance"]
        self.assertEqual(infer(x,y)[0],"possible_conflict")  # Tarium and Rust may coexist.
        x["scope"]["project_types"]=["rust_project_from_scratch"]
        self.assertIsNone(infer(x,y))  # This specific pair is explicitly exclusive.

    def test_project_type_any_overlaps_specialized_context(self):
        a=copy.deepcopy(self.rules["NOM-0119"])
        b=copy.deepcopy(a)
        b["scope"]["project_types"]=["any"]
        self.assertTrue(overlaps(a,b))
        b["scope"]["project_types"]=["rust_project_from_scratch"]
        self.assertTrue(overlaps(a,b))  # A Tarium project can also use Rust.

    def test_distinct_predicates_with_shared_concept_become_candidates(self):
        x=copy.deepcopy(self.rules["NOM-0119"])
        y=copy.deepcopy(self.rules["NOM-0126"])
        x["semantic"]={"concept":"shared_ontology","aliases":[]}
        y["semantic"]={"concept":"separate_wording","aliases":["shared_ontology"]}
        result=infer(x,y)
        self.assertIn(result[0],{"possible_refinement","possible_overlap"})
        self.assertEqual(result[1],"medium")

    def test_reviewed_graph_is_unique_grounded_and_suppresses_candidate_duplicates(self):
        rules=list(self.rules.values())
        reviewed=json.loads((ROOT/"relationships/reviewed.json").read_text())
        self.assertEqual(validate_reviewed(reviewed,rules),[])
        edges=build_relationships(rules)
        self.assertEqual(len([x for x in edges if x["status"]=="reviewed"]),58)
        pairs=[tuple(sorted((x["source"],x["target"]))) for x in edges]
        self.assertEqual(len(pairs),len(set(pairs)))
        self.assertTrue(any(x["source"]=="NOM-0120" and x["target"]=="NOM-0007" and x["kind"]=="complements" for x in edges))

    def test_five_tarium_review_decisions_are_complementary_and_suppress_heuristics(self):
        expected={
            ("NOM-0117","NOM-0123"),
            ("NOM-0117","NOM-0124"),
            ("NOM-0121","NOM-0122"),
            ("NOM-0123","NOM-0124"),
            ("NOM-0125","NOM-0128"),
        }
        edges=build_relationships(list(self.rules.values()))
        found={}
        for edge in edges:
            key=(edge["source"],edge["target"])
            if key in expected:
                self.assertNotIn(key,found)
                found[key]=edge
        self.assertEqual(set(found),expected)
        self.assertTrue(all(edge["kind"]=="complements" and edge["status"]=="reviewed"
                            and edge["method"]=="explicit_editorial_review" and edge["evidence"]
                            for edge in found.values()))
        self.assertFalse([e for e in edges if e["status"]=="candidate"])
        self.assertEqual(len(edges),58)

    def test_gallery_and_externalization_scopes_preserve_distinct_requirements(self):
        self.assertEqual(self.rules["NOM-0120"]["relations"]["refines"],[])
        self.assertEqual(self.rules["NOM-0123"]["scope"]["axes"]["visibility"],["any"])

if __name__=="__main__":
    unittest.main()
