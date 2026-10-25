"""All source rules retain their exact original text while 137 analyses have linked concepts."""
import hashlib
import pathlib
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
from validate_rule_situation_intent_links import load_links

class RuleConceptLinks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.links,cls.errors=load_links()
    def test_complete_verified_processing(self):
        self.assertEqual(self.errors,[])
        self.assertEqual(len(self.links),222)
    def test_draft_rule_never_published_by_semantic_mapping(self):
        draft=self.links["NOM-0002"]
        self.assertEqual(draft["status"],"reviewed_draft_source")
        self.assertEqual(draft["rule_editorial_status"],"draft")
        self.assertEqual(self.links["NOM-0001"]["status"],"published")
    def test_explicitly_reuses_original_ontology(self):
        self.assertIn("SITU-0005",[s["id"] for s in self.links["NOM-0071"]["situations"]])
        self.assertIn("INTENT-0016",[s["id"] for s in self.links["NOM-0137"]["intents"]])
    def test_source_evidence_and_semantic_vs_normative_distinction(self):
        for rid,x in self.links.items():
            self.assertTrue(x["evidence"]["source_statement"])
            self.assertTrue("not exhaustive" in x["interpretation"]["situation_scope"] or
                            "do not narrow" in x["interpretation"]["situation_scope"])
            self.assertIn("inferred",x["interpretation"]["intent_semantics"].lower())
            self.assertFalse("effective_instruction" in x)
if __name__=="__main__":
    unittest.main()
