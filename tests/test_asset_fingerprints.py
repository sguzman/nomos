import hashlib
import pathlib
import re
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from build_site_catalog import fingerprint_assets


class FingerprintedAssetsTests(unittest.TestCase):
    def test_html_urls_match_asset_contents_on_every_build(self):
        with tempfile.TemporaryDirectory() as tmp:
            docs = pathlib.Path(tmp) / "docs"
            docs.mkdir()
            names = ("styles.css", "rule-colors.js", "reasoning.js", "groups.js",
                     "catalog-browser.js", "app.js", "catalog.json")
            for name in names:
                (docs / name).write_text(name + " v1", encoding="utf-8")
            (docs / "index.html").write_text(
                "\n".join('<link href="./' + name + '">' if name.endswith(".css")
                          else '<script src="./' + name + '"></script>'
                          for name in names),
                encoding="utf-8")
            fingerprint_assets(pathlib.Path(tmp))
            html = (docs / "index.html").read_text(encoding="utf-8")
            for name in names:
                digest = hashlib.sha256((docs / name).read_bytes()).hexdigest()[:12]
                self.assertIn("./" + name + "?v=" + digest, html)

            (docs / "app.js").write_text("app changed v2", encoding="utf-8")
            fingerprint_assets(pathlib.Path(tmp))
            fresh = (docs / "index.html").read_text(encoding="utf-8")
            self.assertNotEqual(fresh, html)
            self.assertEqual(fresh.count("./app.js?v="), 1)
            self.assertEqual(fresh.count("./catalog.json?v="), 1)


if __name__ == "__main__":
    unittest.main()
