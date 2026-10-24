import json
import pathlib
import sys
import tempfile
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
from validate_situational_prompt_ideas import load_and_validate,validate
from build_site_catalog import build

class PromptIntakeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records,cls.errors=load_and_validate()
    def test_eight_owner_nominated_proposals(self):
        self.assertEqual(self.errors,[])
        self.assertEqual(len(self.records),8)
        source=[r["source"] for _,r in self.records]
        self.assertTrue(all("shortcut_key" not in r for r in source))
        self.assertEqual([r["entry_index"] for r in source],list(range(1,9)))
        self.assertTrue(all(r["verbatim_text_retained"] is False for r in source))
    def test_each_has_distinct_intent_and_review_gate(self):
        records=[r for _,r in self.records]
        self.assertEqual(len({r["situation"]["code"] for r in records}),8)
        self.assertEqual([r["expected_behavior"]["mode"] for r in records],
                         ["continuation"]*4+["diagnosis","reinforcement","reinforcement","continuation"])
        for r in records:
            self.assertEqual(r["status"],"instantiated")
            self.assertIs(r["review"]["publication_authorized"],True)
            self.assertEqual(r["review"]["content_state"],"publication_approved")
            self.assertEqual(r["review"]["linked_prompt_ids"],["SIT-"+r["id"].split("-")[-1]])
            self.assertNotIn("text",r)
    def test_queue_does_not_enter_public_copyable_catalog(self):
        public=build()
        self.assertEqual(len(public["situational_prompts"]),8)
        self.assertTrue(all(p["status"]=="published" and p["governance"]["review_status"]=="approved" for p in public["situational_prompts"]))
        self.assertTrue(all("title" not in p and "source_label" not in p for p in public["situational_prompts"]))
        self.assertTrue(all(x.get("kind")!="situational_prompt_idea"
                            for x in public["rules"]+public["groups"]+public["profiles"]))
    def test_rejects_unauthorized_publication_and_launcher_metadata(self):
        r1=json.loads(json.dumps(self.records[0][1]))
        r1["review"]["publication_authorized"]=False
        self.assertTrue(any("publication" in e for e in validate([(pathlib.Path("SIT-IDEA-0001.json"),r1)])))
        r1["review"]["publication_authorized"]=True
        r1["source"]["shortcut_key"]="F"
        self.assertTrue(any("nested metadata fields" in e for e in validate([(pathlib.Path("SIT-IDEA-0001.json"),r1)])))

if __name__=="__main__":unittest.main()
