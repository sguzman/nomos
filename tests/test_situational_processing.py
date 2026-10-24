import json
import pathlib
import sys
import tempfile
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
from validate_situational_processing import check_links

class ProcessingTraceTests(unittest.TestCase):
    def test_live_eight_item_processing_batch(self):
        self.assertEqual(check_links(ROOT),[])
        inbox=ROOT/"queues/situational-prompts"
        processed=ROOT/"processing/situational-prompts"
        published=ROOT/"situational-prompts"
        self.assertEqual(len(list(inbox.glob("SIT-IDEA-*.json"))),8)
        self.assertEqual(len(list(processed.glob("PROC-SIT-IDEA-*.json"))),8)
        self.assertEqual(len(list(published.glob("SIT-*.json"))),8)
        for path in processed.glob("PROC-SIT-IDEA-*.json"):
            record=json.loads(path.read_text())
            self.assertEqual(record["publication"],"owner_approved")
            self.assertTrue(record["publication_authorization"])

    def test_orphaned_output_is_detected(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp)
            folder=root/"situational-prompts"
            folder.mkdir()
            (root/"queues/situational-prompts").mkdir(parents=True)
            (root/"processing/situational-prompts").mkdir(parents=True)
            (folder/"SIT-9999.json").write_text(json.dumps({"id":"SIT-9999"}))
            errors=check_links(root)
            self.assertTrue(any("not linked" in x for x in errors))
if __name__=="__main__":unittest.main()
