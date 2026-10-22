"""Audit the four independently recorded workflow stores after full batch processing."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


class ProcessingTraceTests(unittest.TestCase):
    def test_processed_and_pending_specimens_keep_separate_states(self):
        specimens = sorted((ROOT / "queues/specimens").glob("SPEC-*.json"))
        self.assertEqual(len(specimens), 139)
        for path in specimens:
            original = json.loads(path.read_text(encoding="utf-8"))
            with self.subTest(specimen=original["id"]):
                number=int(original["id"].split("-")[1])
                if 133 <= number <= 139:
                    self.assertEqual(original["status"], "proposed")
                    self.assertFalse(original["intake"]["processing_authorized"])
                    expected_scope=["rust_fork_maintenance"] if number<=138 else ["project"]
                    self.assertEqual(original["scope_hints"]["project_types"], expected_scope)
                    self.assertEqual(original["next_state"], "await_explicit_specimen_processing_authorization")
                    self.assertNotIn("processing", original)
                    self.assertFalse((ROOT / "processing/specimens" / ("PROC-" + original["id"] + ".json")).exists())
                    continue
                if original["id"] == "SPEC-0118":
                    self.assertEqual(original["status"], "processed")
                    self.assertFalse(original["intake"]["processing_authorized"])
                    self.assertEqual(original["processing"]["state"], "closed")
                    self.assertEqual(original["processing"]["record"], "processing/specimens/PROC-SPEC-0118.json")
                    self.assertEqual(read(original["processing"]["record"])["status"], "closed")
                    continue
                self.assertEqual(original["status"], "processed")
                processing = original["processing"]
                self.assertEqual(processing["state"], "closed")
                self.assertTrue((ROOT / processing["record"]).is_file())

    def test_single_scoped_prohibition_processed_without_touching_profile_idea_queue(self):
        p=read("processing/specimens/PROC-SPEC-0118.json")
        rule=read("rules/NOM-0114.json")
        candidate=read("processing/specimens/candidates/NOM-0114.json")
        self.assertEqual(p["normalization"]["canonical_rule_id"], "NOM-0114")
        self.assertEqual(p["disposition"]["kind"], "normalized_and_published")
        self.assertEqual(rule["status"], "published")
        self.assertEqual(candidate["status"], "draft")
        self.assertEqual(rule["norm"]["kind"], "prohibition")
        self.assertEqual(rule["norm"]["bounds"]["maximum"], 0)
        self.assertIn("materially new", rule["norm"]["exceptions"][0])
        self.assertEqual(len(list((ROOT / "queues/profiles").glob("PROFILE-IDEA-*.json"))), 6)


    def test_six_rust_fork_candidates_are_atomic_unprocessed_and_do_not_modify_profiles(self):
        records=[read("queues/specimens/SPEC-"+str(i).zfill(4)+".json") for i in range(133,139)]
        self.assertEqual([s["status"] for s in records],["proposed"]*6)
        self.assertEqual(len({tuple(s["scope_hints"]["predicate_hypothesis"].values()) for s in records}),6)
        self.assertTrue(all(s["possible_existing_coverage"] for s in records))
        self.assertTrue(all(not s["intake"]["processing_authorized"] for s in records))
        self.assertTrue(all(s["source"]["material_retained"] is False for s in records))
        self.assertEqual([read("profiles/PROFILE-0007.json")["review"]["selection_confirmed"],
                          read("profiles/PROFILE-0008.json")["review"]["selection_confirmed"]],[False,False])
        self.assertEqual([len(read("profiles/PROFILE-0007.json")["selected_rule_ids"]),
                          len(read("profiles/PROFILE-0008.json")["selected_rule_ids"])],[34,89])

    def test_completed_work_action_footer_is_queued_without_activation(self):
        specimen=read("queues/specimens/SPEC-0139.json")
        self.assertEqual(specimen["status"],"proposed")
        self.assertEqual(specimen["scope_hints"]["predicate_hypothesis"]["target"],"completed_work_summary")
        self.assertFalse(specimen["intake"]["processing_authorized"])
        self.assertTrue(specimen["possible_existing_coverage"])
        self.assertNotIn("processing",specimen)
        self.assertFalse((ROOT/"processing/specimens/PROC-SPEC-0139.json").exists())

    def test_group_proposals_have_separate_records(self):
        proposals = sorted((ROOT / "queues/specimens/groups").glob("GROUP-*.json"))
        self.assertEqual(len(proposals), 14)
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
        self.assertEqual(len(task_queue), 15)
        for path in task_queue:
            task = json.loads(path.read_text(encoding="utf-8"))
            with self.subTest(task=task["id"]):
                execution = read("processing/tasks/" + path.name)
                if task["id"] == "TASK-0016" and task["status"] == "verifying":
                    self.assertEqual(task["processing"]["state"], "verifying")
                    self.assertEqual(execution["status"], "verifying")
                    continue
                self.assertEqual(task["status"], "completed")
                self.assertEqual(task["processing"]["state"], "done")
                self.assertEqual(execution["status"], "done")
                if int(task["id"].split("-")[1]) >= 13:
                    evidence = execution["evidence"]
                    self.assertEqual(evidence["github_actions_conclusion"], "success")
                    self.assertTrue(evidence["github_actions_run"].startswith(
                        "https://github.com/sguzman/nomos/actions/runs/"))
        self.assertEqual(read("processing/tasks/TASK-0003.json")["status"], "done")

    def test_nine_new_candidates_are_published_without_overwriting_history(self):
        for number in range(68, 77):
            rid = "NOM-" + str(number).zfill(4)
            candidate = read("processing/specimens/candidates/" + rid + ".json")
            published = read("rules/" + rid + ".json")
            self.assertEqual(candidate["status"], "draft")
            self.assertEqual(published["status"], "published")
            self.assertEqual(candidate["id"], published["id"])

    def test_completion_and_porting_rules_preserve_separate_meanings(self):
        first = read("rules/NOM-0071.json")
        later = read("rules/NOM-0072.json")
        readme = read("rules/NOM-0073.json")
        self.assertEqual(first["norm"]["kind"], "obligation")
        self.assertEqual(later["norm"]["kind"], "prohibition")
        self.assertNotEqual(first["norm"]["predicate"], later["norm"]["predicate"])
        self.assertIn("NOM-0071", later["relations"]["depends_on"])
        self.assertIn("NOM-0009", readme["relations"]["refines"])
        for n in range(74, 77):
            rule = read("rules/NOM-" + str(n).zfill(4) + ".json")
            self.assertTrue(rule["scope"]["preconditions"])
            self.assertEqual(rule["status"], "published")

    def test_processed_new_specimens_map_to_published_or_reused_atoms(self):
        reused = {"SPEC-0090": "NOM-0075", "SPEC-0103": "NOM-0056",
                  "SPEC-0104": "NOM-0047", "SPEC-0107": "NOM-0060"}
        for number in range(77, 115):
            sid = "SPEC-" + str(number).zfill(4)
            analysis = read("processing/specimens/PROC-" + sid + ".json")
            rid = analysis["normalization"]["canonical_rule_id"]
            self.assertEqual(read("rules/" + rid + ".json")["status"], "published")
            if sid in reused:
                self.assertEqual(rid, reused[sid])
                self.assertEqual(analysis["disposition"]["kind"], "resolved_to_existing_rule")
            else:
                self.assertEqual(analysis["disposition"]["kind"], "normalized_and_published")
                self.assertEqual(read("processing/specimens/candidates/" + rid + ".json")["status"], "draft")

    def test_port_specimens_are_independent_and_published(self):
        for n in range(115, 118):
            sid = "SPEC-" + str(n).zfill(4)
            rid = "NOM-" + str(n - 4).zfill(4)
            specimen = read("queues/specimens/" + sid + ".json")
            disposition = read("processing/specimens/PROC-" + sid + ".json")
            self.assertEqual(specimen["status"], "processed")
            self.assertEqual(disposition["normalization"]["canonical_rule_id"], rid)
            self.assertEqual(read("processing/specimens/candidates/" + rid + ".json")["status"], "draft")
            self.assertEqual(read("rules/" + rid + ".json")["status"], "published")

    def test_group_records_never_auto_activate_rules(self):
        for path in sorted((ROOT / "groups").glob("GROUP-*.json")):
            group = json.loads(path.read_text(encoding="utf-8"))
            self.assertTrue(group["composition"]["opt_in_only"])
            self.assertTrue(group["composition"]["no_implicit_activation"])
            self.assertTrue(group["composition"]["exclude_unpublished_members"])


if __name__ == "__main__":
    unittest.main()
