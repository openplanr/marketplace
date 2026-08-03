# OPERATE-SPEC-011 marketplace work item

This repository is the durable, initially unmerged release ledger for the
SPEC-007 workflow-convergence coordinated release. It records the version tuple
the coordinated saga targets and stays **withheld** until the real-runtime
canary passes against the published artifacts on every supported runtime.

Umbrella spec: `SPEC-007` (skills are the artifact: one implementation per
workflow, a frozen command surface, and `planr setup` as the front door — with
setup reporting every skip, recovering from a partial apply, and persisting the
command-name choice).

## Ledger numbering

The `operationId` is a monotonic ledger counter that is independent of the
umbrella spec it serves. The last recorded operation is `OPERATE-SPEC-010`
(umbrella `SPEC-006`), so the next free ledger number is `OPERATE-SPEC-011`.
`SPEC-007` is the umbrella feature spec in the upstream planning repository
(`.planr/specs/SPEC-007-skills-as-the-artifact`); the marketplace ledger
`OPERATE-SPEC-007` already exists for a different, earlier umbrella and is left
untouched. This entry adds its own `OPERATE-SPEC-011` work-item map row so the
ledger resolves to this document rather than reusing the `SPEC-007` umbrella row.

## Staged tuple

- Protocol `1.4.0` (unchanged)
- `planr-pipeline@0.40.0`
- `openplanr@1.24.0`
- `@openplanr/skills@1.26.0`
- `openplanr-marketplace@1.11.0`

## What the tuple carries

Six workflows shipped two implementations each — a Claude Code command and a
portable skill that re-derived the same procedure, with no reference between
them. Every change had to land twice, and the second landing is the one that got
forgotten. Each pair now names one procedure file, and `registry/frozen-commands.json`
closes the command surface so new workflows can only ship as skills.

On the CLI side, `planr setup` becomes the install path for every runtime: it
reports each skipped runtime and why, restores from a backup rather than leaving
a half-wired install reporting success, and remembers whether command names are
namespaced or bare so an upgrade never silently changes what a user types.

## Why the advertised tuple must move only on verification

Downstream installs resolve the plugin pins in `.claude-plugin/marketplace.json`
from the generated manifest. Advertising a tuple before the canary certifies it
would point installs at an artifact set that has not been exercised on every
supported runtime. While this ledger is staged, the candidate versions are
exposed **only inside the withheld capability**; the top-level component versions
and plugin pins stay at the last verified tuple.

## Two-step ledger discipline

1. **Stage.** Merge this ledger with `state: drafted`, then tag the merge commit
   `v1.11.0`. The tag and the `git archive` digest of that commit are what the
   marketplace participant records — which is why they cannot exist in the same
   commit that references them.
2. **Finalize.** After the tag exists, record the marketplace participant's
   merged PR, tag, and tarball digest, attach the reconciliation record and the
   `reconciliation.recorded` / `operation.verified` history events, flip the
   state to `verified`, and regenerate. Only then do the advertised component
   versions and the plugin pins advance.

## Digest methods, per participant

These differ by participant and are not interchangeable:

- **npm participants** (`pipeline`, `cli`) — sha256 of the **published npm
  tarball**.
- **skills** — sha256 of the **codeload archive** for the tag.
- **marketplace** — sha256 of `git archive --format=tar.gz <tagged commit>`.

Each was verified by reproducing the previous release's recorded value before
computing the new one.

## Post-publish reconciliation

`planr-pipeline@0.40.0` and `openplanr@1.24.0` are public npm packages and
`skills@v1.26.0` is a public tag. None can be withdrawn, so the recovery mode is
`forward-fix`: the ledger reconciles the manifest and never rewrites a released
artifact.

## Finalization gate

The operation may only reach `verified` when every participant has a merged PR,
passing checks, a tag, and a tarball digest; the ledger PR itself is merged; the
canonical operating-canary evidence set is present in order; and live-state
reconciliation reports `matched`.
