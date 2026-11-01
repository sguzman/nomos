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

**Selected V2 bindings:** Your observed Shift+3 produces the Unicode middle dot `·`, not `#`. That matches the Spanish (Spain) XKB `es` number row rather than standard Latin American `latam`. The other assumed shifted symbols are `1/!`, `2/"`, `4/$`, `5/%`, `6/&`, and `7//`. The exact active keymap has not been verified; these shortcuts match the emitted characters, not physical scan codes. The original V0 and Latin American V1 remain available as archived versions.

The generated prompt text is intentionally self-contained for copying: each entry embeds the **fixed, approved D V4** stewardship baseline, an added type-specific contract, and for adoption entries the **fixed A V2** adoption contract. Generic `D` and `A` remain independent and unchanged. The underlying Nomos Lite/Full profiles are referenced as **provisional guidance**, not automatically applied or owner-finalized selections. No Tarium enrollment follows from selecting a Tarium initializer.

- [Specialized Trievium download](exports/project-initializers-trievium.json) — fourteen new keys only.
- [Combined Trievium download](exports/project-stewardship-with-initializers-trievium.json) — fourteen new keys plus the ten current approved Project Stewardship keys.
- [Original immutable V0 text](../end-consumer-profiles/project-initializers/v0/trievium.json), [archived Latin American V1](../end-consumer-profiles/project-initializers/v1/trievium.json), [selected V2 prompts](../end-consumer-profiles/project-initializers/v2/trievium.json) and [V2 approval record](../end-consumer-profiles/project-initializers/v2/publication.json).

Trievium stores its library in a schema-version-1 `items.json` file. Its current original configuration has no native JSON import/merge operation. **Do not overwrite your own existing library** with a download unless you have safely merged its entries and verified no duplicate labels or key collisions. Pinned numeric/symbol support was added to Trievium source on `main` and must be built/installed before using these keys. The public exports themselves do not modify any user files.

**Chat continuity:** Keep `L` for broken-chat recovery and `S` for initiating a new chat after the old one reaches its context limit. Both are project-agnostic and retain their approved versions; `A` is for adopting an existing project, not for restoring a chat.

Run `node tools/build_project_initializers.cjs --check` to verify the immutable original V0, and `node --test tests/test_project_initializers_layout_v1.cjs tests/test_project_initializers_layout_v2.cjs` to verify both layout publications. Any deliberate future update requires independently reviewed versions under NOM-0245, not a silent regeneration of V0.
