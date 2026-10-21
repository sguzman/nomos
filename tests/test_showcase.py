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
        self.assertEqual(len(rules), 4)
        self.assertEqual({r["id"] for r in rules},
                         {"NOM-0001", "NOM-0002", "NOM-0003", "NOM-0004"})

    def test_candidates_cannot_be_mislabeled_published(self):
        candidates = [r for r in self.data["rules"] if r["registry"] == "candidate"]
        self.assertEqual({r["id"] for r in candidates}, {"NOM-0003", "NOM-0004"})
        self.assertTrue(all(r["status"] == "draft" for r in candidates))

    def test_existing_catalog_keeps_original_statuses(self):
        catalog = [r for r in self.data["rules"] if r["registry"] == "catalog"]
        self.assertEqual({(r["id"], r["status"]) for r in catalog},
                         {("NOM-0001", "published"), ("NOM-0002", "draft")})

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
