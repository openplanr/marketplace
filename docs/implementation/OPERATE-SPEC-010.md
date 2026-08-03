# OPERATE-SPEC-010 marketplace work item

This repository is the durable, initially unmerged release ledger for the
SPEC-006 installed-tuple reconciliation coordinated release. It records the
version tuple the coordinated saga targets and stays **withheld** until the
real-runtime canary passes against the published artifacts on every supported
runtime.

Umbrella spec: `SPEC-006` (installed-tuple reconciliation: `planr upgrade
status`/`apply`, an inline upgrade offer with escalating snooze and opt-out, a
versioned migration registry, and an unambiguous, fully-pinned skills plugin
manifest).

## Ledger numbering

The `operationId` is a monotonic ledger counter that is independent of the
umbrella spec it serves. The last recorded operation is `OPERATE-SPEC-009`
(umbrella `SPEC-005`), so the next free ledger number is `OPERATE-SPEC-010`.
`SPEC-006` is the umbrella feature spec in the upstream planning repository
(`.planr/specs/SPEC-006-installed-tuple-reconciliation`); the marketplace ledger
`OPERATE-SPEC-006` already exists for a different, earlier umbrella and is left
untouched. This entry adds its own `OPERATE-SPEC-010` work-item map row so the
ledger resolves to this document rather than reusing the `SPEC-006` umbrella row.

## Staged tuple

- Protocol `1.4.0` (unchanged)
- `planr-pipeline@0.39.0` (unchanged participant — no new pipeline release)
- `openplanr@1.23.0`
- `@openplanr/skills@1.25.0`
- marketplace `1.10.0`

`openplanr@1.23.0` reconciles the installed tuple: it adds `planr upgrade
status`/`apply`, an inline upgrade offer whose snooze interval escalates and
which honours a persisted opt-out, and a versioned migration registry.
`@openplanr/skills@1.25.0` ships a `strict: true` plugin manifest that pins all
ten skills and a validator that models portable-workflow skills separately from
the planning skill. `planr-pipeline` participates at its existing `0.39.0`
version.

## Why the advertised tuple must move only on verification

The shipped `planr upgrade status` feature **reads this marketplace manifest
back** to decide whether an installed environment is aligned. If the advertised
component versions stay at the previous verified tuple (`openplanr 1.22.0`,
`@openplanr/skills 1.24.0`) after `1.23.0`/`1.25.0` are public, the feature will
report users as current while a newer set exists — the feature would be lying on
its first run. This ledger therefore exists to advance the advertised tuple, but
only through the two-step gate so the manifest is never advanced on a tuple the
real-runtime canary has not certified.

## Two-step ledger discipline

This entry is the **staging** half of the two-step marketplace finalization
(`merge-unavailable-ledger` → `tag-and-verify-marketplace` →
`record-finalization-and-expose`). Consistent with every prior coordinated
release in this repository, staging:

- carries the top-level `components.pipeline/cli/skills` at the last **verified**
  tuple (`0.39.0` / `1.22.0` / `1.24.0`) — a tuple the marketplace has not yet
  canary-certified is never advertised as released;
- moves the marketplace component to `1.10.0`, the artifact validated on this
  release branch;
- exposes the candidate `0.39.0` / `1.23.0` / `1.25.0` / `1.10.0` tuple inside the
  withheld `agenticOperatingBoard` capability with `status: unavailable` and
  `missing: ["release"]`, bound to operation `OPERATE-SPEC-010` in
  `state: drafted` with `reconciliation: pending`.

The generated `ecosystem.json` records exactly this staged shape. Nothing here
claims verification that has not happened: the marketplace ledger is not merged,
the real-runtime canary has not certified the tuple, and the release evidence is
`pending`.

## Post-publish reconciliation

Unlike a pre-publish coordinated release, the upstream artifacts for this tuple
are **already public**: `planr-pipeline@0.39.0`, `openplanr@1.23.0`, and
`@openplanr/skills@1.25.0` are published and tagged. Recovery is therefore
`forward-fix` — no published artifact can be rolled back; the only compensating
action available to the marketplace is to withhold the manifest until the canary
certifies the tuple. The participants are recorded as `pending` because they
describe this marketplace operation's own verification progress (canary-backed
finalization), not the existence of the packages on their registries.

## Finalization gate

This ledger is finalized only after the marketplace ledger merges and the full
real-runtime canary passes against the published commits — pipeline
`51c37b105191093f0cc3537d0b80f050342b4539`, cli
`396126bdfb6539d8fe3e65f2cccdee0cc1d0150a`, and skills
`aac9f8f9b49efdc80b5ddfcaff68cc4b4e4690d2` — across the Ubuntu, macOS, and
Windows Node 20/22 matrix. The real-runtime canary steps that certify this tuple
live in `.github/workflows/operating-canary.yml`. Both gates cleared: the
staging ledger merged as `v1.10.0` (commit
`e8fd7147717b41de540cbe023a635b920006f962`) and the canary succeeded on all six
matrices (run 30838934551), so this entry is now `verified` and the advertised
tuple advances to `0.39.0 / 1.23.0 / 1.25.0 / 1.10.0`.

Tarball digests are sourced per artifact, each matching its own
`OPERATE-SPEC-009` precedent:

- npm-published participants (`planr-pipeline`, `openplanr`) use the sha256 of
  their published npm tarball.
- `@openplanr/skills` (external repo, no npm package) uses the sha256 of the
  GitHub release archive
  (`https://github.com/<org>/<repo>/archive/refs/tags/<tag>.tar.gz`) — validated
  by reproducing SPEC-009's skills digest `a3bda88…`.
- `marketplace` (this repo, no npm package) uses the sha256 of
  `git archive --format=tar.gz <merge-commit>` — validated by reproducing
  SPEC-009's marketplace digest `d51d396…` from commit `bc2df4d`. `git archive`
  is deterministic from tree content, so this digest is stable.

The five `releaseEvidence` digests are taken from the windows-latest/node-22
report (the canonical cell per the `OPERATE-SPEC-009` precedent).
