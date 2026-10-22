import copy
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "tools"))
from groups import load_groups, validate_groups, expand_member_ids
from validate import load_catalog


class VirtualGroupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _, cls.rules = load_catalog()
        cls.groups = load_groups()
        cls.published = {r["id"] for r in cls.rules if r["status"] == "published"}

    def test_fourteen_groups_valid(self):
        self.assertEqual(len(self.groups), 14)
        self.assertEqual(validate_groups(self.groups, self.rules), [])

    def test_umbrella_contains_exactly_54_independent_rules(self):
        members = expand_member_ids("GROUP-0001", self.groups, self.published)
        self.assertEqual(len(members), 54)
        self.assertEqual(len(members), len(set(members)))
        self.assertTrue(all(m.startswith("NOM-") for m in members))

    def test_each_subgroup_has_expected_size(self):
        expected = [10, 10, 8, 8, 5, 7, 6]
        for offset, count in enumerate(expected, start=2):
            self.assertEqual(len(expand_member_ids(
                "GROUP-" + str(offset).zfill(4), self.groups)), count)

    def test_new_umbrella_and_subgroups_have_nine_independent_members(self):
        members = expand_member_ids("GROUP-0009", self.groups, self.published)
        self.assertEqual(len(members), 9)
        self.assertEqual(set(members), {"NOM-" + str(i).zfill(4) for i in range(68, 77)})
        for index, expected in ((10,3),(11,2),(12,1),(13,3)):
            self.assertEqual(len(expand_member_ids("GROUP-" + str(index).zfill(4),
                                                   self.groups, self.published)), expected)

    def test_mvp_inauguration_group_reuses_existing_atoms(self):
        members = expand_member_ids("GROUP-0014", self.groups, self.published)
        self.assertEqual(len(members), 50)
        self.assertEqual(len(members), len(set(members)))
        self.assertIn("NOM-0075", members)
        self.assertIn("NOM-0110", members)

    def test_overlapping_groups_do_not_duplicate_rules(self):
        groups = copy.deepcopy(self.groups)
        groups[0]["member_rule_ids"] = [groups[1]["member_rule_ids"][0]]
        members = expand_member_ids("GROUP-0001", groups)
        self.assertEqual(len(members), 54)

    def test_group_cycles_rejected(self):
        groups = copy.deepcopy(self.groups)
        groups[1]["child_group_ids"] = ["GROUP-0001"]
        groups[1]["composition"]["include_descendants"] = True
        with self.assertRaises(ValueError):
            expand_member_ids("GROUP-0001", groups)

    def test_draft_rule_membership_is_rejected(self):
        groups = copy.deepcopy(self.groups)
        groups[1]["member_rule_ids"].append("NOM-0002")
        self.assertTrue(any("NOM-0002" in e for e in validate_groups(groups, self.rules)))

    def test_unauthorized_activation_not_allowed(self):
        groups = copy.deepcopy(self.groups)
        groups[0]["composition"]["opt_in_only"] = False
        self.assertTrue(validate_groups(groups, self.rules))


if __name__ == "__main__":
    unittest.main()
