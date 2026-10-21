"""Audit the four independently recorded workflow stores after full batch processing."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


class ProcessingTraceTests(unittest.TestCase):
    def test_all_specimens_closed_without_auto_activation(self):
        specimens = sorted((ROOT / "queues/specimens").glob("SPEC-*.json"))
        self.assertEqual(len(specimens), 67)
        for path in specimens:
            original = json.loads(path.read_text(encoding="utf-8"))
            with self.subTest(specimen=original["id"]):
                self.assertEqual(original["status"], "processed")
                processing = original["processing"]
                self.assertEqual(processing["state"], "closed")
                self.assertTrue((ROOT / processing["record"]).is_file())

    def test_group_proposals_have_separate_records(self):
        proposals = sorted((ROOT / "queues/specimens/groups").glob("GROUP-*.json"))
        self.assertEqual(len(proposals), 8)
        for path in proposals:
            obj = json.loads(path.read_text(encoding="utf-8"))
            with self.subTest(group=obj["id"]):
                self.assertEqual(obj["status"], "processed")
                record = read(obj["processing"]["record"])
                self.assertEqual(record["status"], "closed")
                self.assertTrue((ROOT / "groups" / path.name).is_file())

    def test_all_atom_candidates_have_separate_catalog_records(self):
        for specimen_number in range(13, 67):
            candidate_id = "NOM-" + str(specimen_number + 1).zfill(4)
            proposal = read("processing/specimens/candidates/" + candidate_id + ".json")
            published = read("rules/" + candidate_id + ".json")
            with self.subTest(rule=candidate_id):
                self.assertEqual(proposal["status"], "draft")
                self.assertEqual(published["status"], "published")
                self.assertEqual(published["id"], proposal["id"])

    def test_task_queues_and_execution_records_closed(self):
        task_queue = sorted((ROOT / "queues/tasks").glob("TASK-*.json"))
        self.assertEqual(len(task_queue), 8)
        for path in task_queue:
            task = json.loads(path.read_text(encoding="utf-8"))
            with self.subTest(task=task["id"]):
                self.assertEqual(task["status"], "completed")
                execution = read("processing/tasks/" + path.name)
                self.assertEqual(execution["status"], "done")
        self.assertEqual(read("processing/tasks/TASK-0003.json")["status"], "done")

    def test_group_records_never_auto_activate_rules(self):
        for path in sorted((ROOT / "groups").glob("GROUP-*.json")):
            group = json.loads(path.read_text(encoding="utf-8"))
            self.assertTrue(group["composition"]["opt_in_only"])
            self.assertTrue(group["composition"]["no_implicit_activation"])
            self.assertTrue(group["composition"]["exclude_unpublished_members"])


if __name__ == "__main__":
    unittest.main()
