import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from build_site_catalog import build


class SiteCatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = build()

    def test_distinct_public_entries(self):
        rules = self.data["rules"]
        self.assertEqual(len(rules), 136)
        self.assertEqual({r["id"] for r in rules},
                         {"NOM-" + str(i).zfill(4) for i in range(1, 137)})

    def test_candidates_cannot_be_mislabeled_published(self):
        candidates = [r for r in self.data["rules"] if r["registry"] == "candidate"]
        self.assertEqual(candidates, [])
        self.assertTrue(all(r["status"] == "draft" for r in candidates))

    def test_existing_catalog_keeps_original_statuses(self):
        catalog = [r for r in self.data["rules"] if r["registry"] == "catalog"]
        self.assertEqual(len(catalog), 136)
        self.assertEqual({(r["id"], r["status"]) for r in catalog if r["id"] in {"NOM-0001", "NOM-0002"}},
                         {("NOM-0001", "published"), ("NOM-0002", "draft")})

    def test_virtual_groups_are_independent(self):
        groups = self.data["groups"]
        self.assertEqual(len(groups), 14)
        self.assertEqual({g["id"] for g in groups}, {"GROUP-" + str(i).zfill(4) for i in range(1, 15)})
        self.assertEqual(sum(len(g["member_rule_ids"]) for g in groups), 113)

    def test_group_members_are_published_and_unique(self):
        rules = {r["id"]: r for r in self.data["rules"]}
        for group in self.data["groups"]:
            with self.subTest(group=group["id"]):
                self.assertEqual(len(group["member_rule_ids"]), len(set(group["member_rule_ids"])))
                for rid in group["member_rule_ids"]:
                    self.assertEqual(rules[rid]["status"], "published")

    def test_optional_profiles_are_in_public_catalog_but_not_activated(self):
        profiles=self.data["profiles"]
        self.assertEqual([p["id"] for p in profiles], ["PROFILE-"+str(i).zfill(4) for i in range(1,13)])
        self.assertEqual([len(p["selected_rule_ids"]) for p in profiles], [41,93,35,90,29,61,34,89,38,90,39,90])
        for profile in profiles:
            self.assertEqual(profile["status"],"draft")
            self.assertEqual(profile["review"]["selection_confirmed"], int(profile["id"].split("-")[1])<=2)
            self.assertFalse(profile["review"]["finalization_confirmed"])
            self.assertEqual(len(profile["selected_rule_ids"]),len(set(profile["selected_rule_ids"])))

    def test_reviewable_project_relationships_and_tarium_scope(self):
        self.assertEqual(self.data["schema_version"],"2.7")
        self.assertEqual(len(self.data["situational_prompts"]), 8)
        self.assertTrue(all(p["status"] == "published" and p["governance"]["review_status"] == "approved"
                            for p in self.data["situational_prompts"]))
        self.assertIn("rust_project", self.data["project_types"])
        self.assertIn("project_hierarchy", self.data)
        self.assertEqual(len(self.data["domain_definitions"]["domains"]),26)
        self.assertEqual(len(self.data["domain_definitions"]["families"]),7)
        self.assertIn("tarium_project",self.data["project_types"])
        self.assertIn("cpp_to_rust_port",self.data["project_types"])
        self.assertIn("python_to_rust_port",self.data["project_types"])
        rules={r["id"]:r for r in self.data["rules"]}
        self.assertEqual(len([r for r in rules.values() if r["scope"].get("project_types")==["tarium_project"]]),16)
        links=self.data["relationships"]
        self.assertTrue(any(x["status"]=="reviewed" and x["source"]=="NOM-0119" and x["target"]=="NOM-0006" for x in links))
        self.assertTrue(all(x["source"] in rules and x["target"] in rules for x in links))
        self.assertEqual(len(links),58)
        self.assertTrue(all(x["status"]=="reviewed" for x in links))
        self.assertFalse(any(x["status"]=="candidate" for x in links))
        self.assertTrue(any(x["kind"]=="possible_conflict" and x["status"]=="reviewed"
                            and {x["source"],x["target"]}=={"NOM-0012","NOM-0013"} for x in links))

    def test_every_current_rule_exposes_bounds_metadata(self):
        for rule in self.data["rules"]:
            bounds = rule["norm"]["bounds"]
            self.assertEqual(set(bounds), {"quantifier","interpretation","frequency","minimum",
                                           "maximum","unit","window","cue","basis"})

    def test_every_entry_has_composition_metadata(self):
        for rule in self.data["rules"]:
            with self.subTest(rule=rule["id"]):
                self.assertTrue(rule["statement"])
                self.assertIn(rule["norm"]["kind"], {"prohibition", "permission", "obligation"})
                self.assertEqual(set(rule["scope"]["axes"]),
                                 {"channel", "visibility", "artifact_kind", "actor"})
                self.assertTrue(rule["categories"]["domains"])
                self.assertTrue(rule["authority"]["source"])


if __name__ == "__main__":
    unittest.main()
