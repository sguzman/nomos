"""Strict audit regression tests: classify all legacy rules without rewriting norms."""
import json
import unittest
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
from validate import load_catalog
from project_types import read_hierarchy, validate_hierarchy, ancestors, applies, types_can_overlap

def load(path):
    return json.loads((ROOT/path).read_text(encoding="utf-8"))

class RetrospectiveClassificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _,rules=load_catalog()
        cls.rules={r["id"]:r for r in rules}
        cls.audit=load("audits/legacy-classification-2026-10-22.json")
        cls.baseline=load("audits/legacy-normative-baseline-2026-10-22.json")
        cls.domain_definitions=load("taxonomy/domains.json")
        cls.hierarchy=read_hierarchy()

    def test_all_114_legacy_rules_have_audited_classifications(self):
        self.assertEqual(self.audit["total"],114)
        ids=["NOM-"+str(i).zfill(4) for i in range(1,115)]
        self.assertEqual([x["id"] for x in self.audit["entries"]],ids)
        self.assertEqual([x["id"] for x in self.baseline["records"]],ids)
        self.assertEqual(len(set(ids)),114)
        for entry in self.audit["entries"]:
            with self.subTest(rule=entry["id"]):
                rule=self.rules[entry["id"]]
                self.assertEqual(rule["categories"]["domains"],entry["classified"]["domains"])
                self.assertEqual(rule["categories"]["topics"],entry["classified"]["topics"])
                self.assertEqual(rule["scope"]["project_types"],entry["classified"]["project_types"])
                self.assertEqual(rule["title"],entry["title"])

    def test_normative_and_authority_fields_unchanged(self):
        for old in self.baseline["records"]:
            rule=self.rules[old["id"]]
            with self.subTest(rule=old["id"]):
                for key in ("title","statement","norm","authority","relations","export_targets"):
                    self.assertEqual(rule[key],old[key],key)
                for key in ("axes","preconditions","exclusions"):
                    self.assertEqual(rule["scope"][key],old["scope"][key],key)

    def test_domain_families_are_complete_and_not_confused_with_applicability(self):
        tax=load("taxonomy/categories.json")
        self.assertEqual(set(tax["category_axes"]["domains"]),set(self.domain_definitions["domains"]))
        for code,meta in self.domain_definitions["domains"].items():
            self.assertIn(meta["family"],self.domain_definitions["families"],code)
            self.assertTrue(meta["description"])
        self.assertEqual(validate_hierarchy(self.hierarchy,tax),[])

    def test_new_topics_replace_generic_development_hygiene(self):
        entries=self.audit["entries"]
        replaced=[x for x in entries if "development_hygiene" in x["original"]["topics"]]
        self.assertEqual(len(replaced),54)
        for x in replaced:
            self.assertNotIn("development_hygiene",self.rules[x["id"]]["categories"]["topics"])
            self.assertTrue(self.rules[x["id"]]["categories"]["topics"])

    def test_project_scope_inheritance_and_multifacet_overlap(self):
        h=self.hierarchy
        self.assertIn("rust_project",ancestors("c_to_rust_port",h))
        self.assertIn("software_port",ancestors("c_to_rust_port",h))
        self.assertTrue(applies(["rust_project"],"rust_fork_maintenance",h))
        self.assertTrue(applies(["project"],"tarium_project",h))
        self.assertFalse(applies(["tarium_project"],"rust_project_from_scratch",h))
        self.assertFalse(applies(["any"],"tarium_project",h))
        self.assertTrue(types_can_overlap(["tarium_project"],["rust_project"],h))
        self.assertFalse(types_can_overlap(["rust_project_from_scratch"],["rust_fork_maintenance"],h))

    def test_previously_unclassified_tarium_and_port_rules_get_precise_scope(self):
        for id in ("NOM-0006","NOM-0007"):
            self.assertEqual(self.rules[id]["scope"]["project_types"],["tarium_project"])
        for id in ("NOM-0074","NOM-0075","NOM-0076"):
            self.assertEqual(self.rules[id]["scope"]["project_types"],["software_port"])
        for id in ("NOM-0111","NOM-0112","NOM-0113"):
            self.assertEqual(self.rules[id]["scope"]["project_types"],["c_to_rust_port"])

    def test_legacy_profiles_preserved_and_new_ideas_explicitly_instantiated(self):
        profiles=[load("profiles/PROFILE-"+str(i).zfill(4)+".json") for i in (1,2)]
        self.assertEqual([(p["status"],len(p["selected_rule_ids"])) for p in profiles],[("draft",61),("draft",121)])
        ideas=list((ROOT/"queues/profiles").glob("PROFILE-IDEA-*.json"))
        self.assertEqual(len(ideas),10)
        originals=[load("queues/profiles/PROFILE-IDEA-"+str(i).zfill(4)+".json") for i in range(1,7)]
        self.assertTrue(all(p["status"]=="instantiated" for p in originals))
        self.assertEqual({p["linked_profile_ids"][0] for p in originals},
                         {"PROFILE-"+str(i).zfill(4) for i in range(3,9)})
        upcoming=[load("queues/profiles/PROFILE-IDEA-"+str(i).zfill(4)+".json") for i in (7,8)]
        self.assertEqual([p["linked_profile_ids"] for p in upcoming],[["PROFILE-0009"],["PROFILE-0010"]])
        self.assertTrue(all(p["status"]=="instantiated" for p in upcoming))
        python_ideas=[load("queues/profiles/PROFILE-IDEA-"+str(i).zfill(4)+".json") for i in (9,10)]
        self.assertEqual([p["linked_profile_ids"] for p in python_ideas],[["PROFILE-0011"],["PROFILE-0012"]])
        self.assertTrue(all(p["status"]=="instantiated" for p in python_ideas))

if __name__=="__main__":
    unittest.main()
