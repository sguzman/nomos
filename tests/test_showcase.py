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
        self.assertEqual(len(rules), 113)
        self.assertEqual({r["id"] for r in rules},
                         {"NOM-" + str(i).zfill(4) for i in range(1, 114)})

    def test_candidates_cannot_be_mislabeled_published(self):
        candidates = [r for r in self.data["rules"] if r["registry"] == "candidate"]
        self.assertEqual(candidates, [])
        self.assertTrue(all(r["status"] == "draft" for r in candidates))

    def test_existing_catalog_keeps_original_statuses(self):
        catalog = [r for r in self.data["rules"] if r["registry"] == "catalog"]
        self.assertEqual(len(catalog), 113)
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
