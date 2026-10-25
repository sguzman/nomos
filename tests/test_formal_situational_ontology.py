"""Regression checks for the now-published formal ontology and immutable generations."""
import hashlib
import json
import pathlib
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
from validate_formal_situational_ontology import load_formal
from build_site_catalog import build

# Blob identities of the approved v1 records before the 2026-10-24 v2/v3 batch.
BASELINE={
  "SIT-0001":"cebdfd36218b0681d753cd9d133cab118efa9056",
  "SIT-0002":"d289b13ba7cbc8710ced3647852f3f879e8682a3",
  "SIT-0003":"9263aa86ff0ac7860c7c8e65fc7f352e9f49c3e8",
  "SIT-0004":"d3a65ec0b5542c301dc473bf4ea33dd392748f8a",
  "SIT-0005":"d5fd2fe63a0a909758b740acfcfb4c9bc2011266",
  "SIT-0006":"4d0a202f595f8636acc3cf1e0b1d89ee811cad6f",
  "SIT-0007":"f172a5e9ee428aac2b371b97bc553e02003d35bf",
  "SIT-0008":"023a1f2bb840558496088d95bb8bcebe3e6901d4"
}

class FormalSituationalOntologyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registries,cls.errors=load_formal(ROOT)

    def test_formal_registry_complete_and_linked(self):
        self.assertEqual(self.errors,[])
        self.assertEqual([len(self.registries[x]) for x in
             ("situations","intents","families","conditions","evaluation-dimensions")],
             [97,139,8,7,7])
        self.assertEqual(len(self.registries["prompt_versions"]),16)
        self.assertEqual(len(self.registries["prompts_v1"]),8)
        self.assertEqual(self.registries["evaluations"],[])

    def test_original_v1_blob_bytes_have_not_changed(self):
        for ident, expected in BASELINE.items():
            payload=(ROOT/"situational-prompts"/(ident+".json")).read_bytes()
            actual=hashlib.sha1(f"blob {len(payload)}\0".encode("ascii")+payload).hexdigest()
            self.assertEqual(actual,expected,ident)

    def test_versioned_behaviors_and_default_are_explicit(self):
        for i in range(1,9):
            ident=f"SIT-{i:04d}"
            family=self.registries["families"][f"FAMILY-{i:04d}"]
            self.assertEqual(family["canonical_prompt_id"],ident)
            self.assertEqual(family["default_version"],"1.0.0")
            versions={k[1]:v for k,v in self.registries["prompt_versions"].items() if k[0]==ident}
            self.assertEqual(set(versions),{"2.0.0","3.0.0"})
            self.assertTrue(all(p["interaction"]["invocation"]=="explicit_only" for p in versions.values()))
            if i==5:
                self.assertTrue(all(p["execution"]["mode"]=="diagnosis_only" for p in versions.values()))
            if i in (6,7):
                self.assertEqual(self.registries["prompts_v1"][ident]["execution"]["mode"],"reinforcement_only")
                self.assertTrue(all(p["execution"]["mode"]=="sustained_execution" for p in versions.values()))

    def test_site_snapshot_matches_deterministic_generator(self):
        generated=build(ROOT)
        checked_in=json.loads((ROOT/"docs"/"catalog.json").read_text(encoding="utf-8"))
        self.assertEqual(generated,checked_in)
        self.assertEqual(generated["schema_version"],"3.0")

if __name__=="__main__":
    unittest.main()
