import copy
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "tools"))
from validate import conflicts, load_catalog, overlaps, possible_conflict, validate


class RuleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.taxonomy, cls.rules = load_catalog()

    def test_catalog_is_valid(self):
        self.assertEqual(validate(self.taxonomy, self.rules), [])

    def test_public_and_private_scopes_are_disjoint(self):
        self.assertFalse(overlaps(*self.rules))
        self.assertFalse(possible_conflict(*self.rules))
        self.assertEqual(conflicts(self.rules), [])

    def test_public_diary_strong_permission_is_candidate(self):
        permission = copy.deepcopy(self.rules[1])
        permission["scope"]["axes"]["visibility"] = ["public"]
        self.assertTrue(possible_conflict(self.rules[0], permission))

    def test_weak_permission_does_not_override_prohibition(self):
        permission = copy.deepcopy(self.rules[1])
        permission["scope"]["axes"]["visibility"] = ["public"]
        permission["norm"]["permission_strength"] = "weak"
        self.assertFalse(possible_conflict(self.rules[0], permission))

    def test_different_predicates_not_conflicting(self):
        permission = copy.deepcopy(self.rules[1])
        permission["scope"]["axes"]["visibility"] = ["public"]
        permission["norm"]["predicate"]["object"] = "other_material"
        self.assertFalse(possible_conflict(self.rules[0], permission))


if __name__ == "__main__":
    unittest.main()
