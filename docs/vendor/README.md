# Locally bundled Markdown preview dependencies

The end-consumer prompt browser uses the following pinned, self-hosted
browser bundles only for optional read-only Markdown presentation:

- `showdown-2.1.0.min.js`: ShowdownJS v2.1.0, MIT licensed.
  Source: https://github.com/showdownjs/showdown/tree/2.1.0
  License: `showdown-LICENSE.txt`.
- `dompurify-3.4.15.min.js`: DOMPurify v3.4.15, used under
  the Apache License 2.0 option of its dual (Apache-2.0 / MPL-2.0) license.
  Source: https://github.com/cure53/DOMPurify/tree/3.4.15
  License: `dompurify-LICENSE.txt`.

The parser's HTML output must **always** pass through DOMPurify before
display. This preview does not modify stored prompt text, publish a new
version, authorize an agent action, or alter clipboard/Trievium exports.
No CDN or runtime dependency installation is needed.
