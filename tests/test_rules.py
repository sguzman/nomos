import copy
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "tools"))
from validate import assess_pair, conditional_pairs, conflicts, load_catalog, overlaps, possible_conflict, validate


class RuleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.taxonomy, cls.rules = load_catalog()

    def test_catalog_is_valid(self):
        self.assertEqual(validate(self.taxonomy, self.rules), [])

    def test_public_and_private_scopes_are_disjoint(self):
        self.assertFalse(overlaps(*self.rules[:2]))
        self.assertFalse(possible_conflict(*self.rules[:2]))
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

class RustEditionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _, cls.rules = load_catalog()
        by_id = {rule["id"]: rule for rule in cls.rules}
        cls.latest, cls.fixed = by_id["NOM-0012"], by_id["NOM-0013"]

    def test_current_equal_is_temporally_conditional(self):
        self.assertEqual(assess_pair(self.latest, self.fixed,
                         {"latest_stable_supported_edition": "2024"}), "conditional")

    def test_future_divergence_creates_conflict_candidate(self):
        self.assertTrue(possible_conflict(self.latest, self.fixed,
                        {"latest_stable_supported_edition": "2027"}))

    def test_unknown_current_latest_is_not_guessed(self):
        self.assertEqual(assess_pair(self.latest, self.fixed), "conditional")
        self.assertIn((self.latest["id"], self.fixed["id"]), conditional_pairs(self.rules))

    def test_weak_permission_is_not_conflict(self):
        permission = copy.deepcopy(self.fixed)
        permission["norm"]["kind"] = "permission"
        permission["norm"]["permission_strength"] = "weak"
        self.assertFalse(possible_conflict(self.latest, permission,
                        {"latest_stable_supported_edition": "2027"}))

    def test_strong_permission_can_conflict(self):
        permission = copy.deepcopy(self.fixed)
        permission["norm"]["kind"] = "permission"
        permission["norm"]["permission_strength"] = "strong"
        self.assertTrue(possible_conflict(self.latest, permission,
                        {"latest_stable_supported_edition": "2027"}))


if __name__ == "__main__":
    unittest.main()

class QuantifierBoundsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _, rules = load_catalog()
        cls.rule = copy.deepcopy(next(r for r in rules if r["id"] == "NOM-0072"))

    def test_complete_bounds_required(self):
        from validate import validate_bounds
        assert validate_bounds(self.rule) == []
        del self.rule["norm"]["bounds"]
        assert validate_bounds(self.rule)

    def test_never_requires_zero_maximum(self):
        from validate import validate_bounds
        self.rule["norm"]["bounds"].update({
            "quantifier": "unspecified", "interpretation": "unspecified",
            "frequency": "never", "minimum": 0, "maximum": 2,
            "unit": "occurrences", "window": None,
            "cue": "never", "basis": "explicit_text"
        })
        assert any("never requires" in e for e in validate_bounds(self.rule))

    def test_any_remains_ambiguous_until_review(self):
        from validate import validate_bounds
        b = self.rule["norm"]["bounds"]
        b.update({"quantifier":"any", "interpretation":"unspecified", "frequency":"unspecified",
                  "minimum":None, "maximum":None, "unit":"unspecified",
                  "window":None, "cue":"any", "basis":"unresolved"})
        assert validate_bounds(self.rule) == []
        b["interpretation"] = "universal"
        assert any("ambiguous any" in e for e in validate_bounds(self.rule))

    def test_exactly_once_and_zero_are_numeric_conflicts_only_when_comparable(self):
        from validate import bounds_incompatible
        a = copy.deepcopy(self.rule)
        b = copy.deepcopy(self.rule)
        a["norm"]["bounds"].update({"minimum":1,"maximum":1,"unit":"occurrences",
                                    "window":"per report","basis":"explicit_text"})
        b["norm"]["bounds"].update({"minimum":0,"maximum":0,"unit":"occurrences",
                                    "window":"per report","basis":"explicit_text"})
        assert bounds_incompatible(a,b)
        b["norm"]["bounds"]["window"] = "per week"
        assert not bounds_incompatible(a,b)
        b["norm"]["bounds"]["window"] = "per report"
        b["norm"]["bounds"]["basis"] = "unresolved"
        assert not bounds_incompatible(a,b)
