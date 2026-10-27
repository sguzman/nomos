#!/usr/bin/env fish
# Disposable, explicit Nomos acceptance run; this script never activates a rule profile.
# Run from the Nomos repository root, with fresh main already pulled by Jobflick.
node tools/run_luna_acceptance.cjs --case RUST-MIXED --target generic --execute
