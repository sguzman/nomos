# Specialized project initialization and adoption prompts

This opt-in Project Initializers profile supplies **14 self-contained Trievium entries** in seven number/shifted-symbol pairs. It does not modify the ten established Project Stewardship shortcuts, their identities, or their selected versions.

| New project | Adopt existing | Purpose | Advisory Nomos profiles |
| --- | --- | --- | --- |
| `1` | `!` | 🦀 New Rust Project | PROFILE-0003, PROFILE-0004 |
| `2` | `"` | 🔁 Rust Port (Any Source Language) | Generic port requirements |
| `3` | `·` | 🏛️ Independent Public Tarium Project | PROFILE-0005, PROFILE-0006 |
| `4` | `$` | 🌿 Rust Fork Maintenance | PROFILE-0007, PROFILE-0008 |
| `5` | `%` | 🧱 C → Rust Port | PROFILE-0001, PROFILE-0002 |
| `6` | `&` | 🧩 C++ → Rust Port | PROFILE-0009, PROFILE-0010 |
| `7` | `/` | 🐍 Python → Rust Port | PROFILE-0011, PROFILE-0012 |
| `8` | `(` | Java → Rust **reserved, not published** | Not defined |

**Selected V4 bindings:** Your observed Shift+3 produces the Unicode middle dot `·`, not `#`. That matches the Spanish (Spain) XKB `es` number row rather than standard Latin American `latam`. The other assumed shifted symbols are `1/!`, `2/"`, `4/$`, `5/%`, `6/&`, and `7//`. The exact active keymap has not been verified; these shortcuts match the emitted characters, not physical scan codes. The original V0 and Latin American V1 remain available as archived versions.

V4 embeds the **approved D V6** contract, **A V4** for adoption variants, and every canonical rule statement selected in the applicable **Full** profile, with per-rule applicability, exception and exclusion information. The generic Rust-port variant uses the common Full-profile intersection plus strict-port rules. Full profile selections are still **draft**; the prompt must filter by actual project applicability, preserve authorized scope, and never claim a source profile has been formally finalized. All rule text needed by the agent is embedded, avoiding dependency on accessing Nomos during prompt execution. The V4 output adds the six contextual, nonmandatory font preferences NOM-0250–NOM-0255. It preserves V3 as an independently locked predecessor; typography changes to existing projects still require an authorized scope.

- [Specialized Trievium download](exports/project-initializers-trievium.json) — fourteen new keys only.
- [Combined Trievium download](exports/project-stewardship-with-initializers-trievium.json) — fourteen new keys plus the ten current approved Project Stewardship keys.
- [Original immutable V0 text](../end-consumer-profiles/project-initializers/v0/trievium.json), [archived Latin American V1](../end-consumer-profiles/project-initializers/v1/trievium.json), [archived V2 prompts](../end-consumer-profiles/project-initializers/v2/trievium.json), [archived V3 source specification](../end-consumer-profiles/project-initializers/v3/specifications.json), [V4 source specification](../end-consumer-profiles/project-initializers/v4/specifications.json), [V4 publication contract](../end-consumer-profiles/project-initializers/v4/publication.json), and [current generated rule-coverage manifest](exports/project-initializers-v4-manifest.json).

Trievium stores its library in a schema-version-1 `items.json` file. Its current original configuration has no native JSON import/merge operation. **Do not overwrite your own existing library** with a download unless you have safely merged its entries and verified no duplicate labels or key collisions. Pinned numeric/symbol support was added to Trievium source on `main` and must be built/installed before using these keys. The public exports themselves do not modify any user files.

**Chat continuity:** Keep `L` for broken-chat recovery and `S` for initiating a new chat after the old one reaches its context limit. Both are project-agnostic and retain their approved versions; `A` is for adopting an existing project, not for restoring a chat.

Run `node tools/build_project_initializers.cjs --check` to verify the original V0, and `node tools/build_project_initializers_v3.cjs --check` to validate archived V3 and `node tools/build_project_initializers_v4.cjs --check` to validate V4. `--check` verifies generated current artifacts and the approved SHA256 lock. GitHub Pages builds the V4 files in the deployment workspace and publishes them at the normal download URLs; the earlier V0–V3 sources remain preserved. A subsequent source or rule selection edit requires a separately approved successor under NOM-0245.
