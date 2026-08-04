# OPERATE-SPEC-013 marketplace work item

This repository is the durable release ledger for the **setup pin fix**: the
single-participant advance that re-aligns the advertised CLI with npm after
`openplanr@1.25.1` shipped the fix for a broken `planr setup`.

Umbrella spec: `SPEC-007`.

## Why this operation exists

`openplanr@1.25.0` pinned `planr-pipeline@0.40.0` in `optionalDependencies` while
publishing alongside pipeline `0.41.0`. The CLI resolves the *installed* pipeline
copy to decide which Claude plugin version to expect and compares by strict
equality, so a correctly-installed 0.41.0 plugin read as drift: every `planr
setup` failed `E_CLAUDE_PLUGIN_UPDATE_FAILED` and rolled back. The skills target
constant was stale the same way (`1.26.0` against a published `1.26.1`).

No gate caught it. Every CLI suite sets `OPENPLANR_PIPELINE_ROOT` to a source
checkout, which bypasses the `node_modules` resolution the pin governs — the
tested configuration never matched the installed one on that axis. The skills
bundle carries an explicit pin guard, which is precisely why the release canary
rejected *its* stale pin during `OPERATE-SPEC-012`. The CLI now carries the
analogue (`tests/unit/pipeline-pin-parity.test.ts`).

## Tuple

- Protocol `1.4.0` (unchanged)
- `planr-pipeline@0.41.0` — **unchanged participant**; `OPERATE-SPEC-012`
  artifacts carry forward
- `openplanr@1.25.1` — the pin fix plus the parity guard
- `@openplanr/skills@1.26.1` — **unchanged participant**; `OPERATE-SPEC-012`
  artifacts carry forward
- `openplanr-marketplace@1.13.0` — this ledger

## Standing note on cost

This is the third ledger cycle in one day, and the second within two hours. The
two-step discipline, the per-participant digest methods, and the finalization
gate are unchanged from `OPERATE-SPEC-012` — see that work item. The recurring
manual cost is recorded as `BL-009` in the CLI backlog: derive these ledgers
from CI facts instead of hand-assembling them, and scope the canary to what
actually changed (a single-participant patch does not need the six-leg matrix
that a schema change does).
