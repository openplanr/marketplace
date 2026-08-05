# OPERATE-SPEC-014 marketplace work item

Release ledger for the fixes a live Operating Board cycle found in the operate
flow itself.

Umbrella spec: `SPEC-007`.

## Why this operation exists

A full board cycle was run against `planr-pipeline` using the shipped product.
It surfaced six defects that every existing gate had passed over, including a
mandate that enforced one response contract while disclosing another, a record
path that discarded a valid advisor result, and status surfaces that described a
mid-flight cycle as quiet. Four separate tests were found asserting the defective
behaviour — one of them a packed-install test, which certified the artifact and
the bug together.

## Tuple

- Protocol `1.4.0` (unchanged)
- `planr-pipeline@0.42.0` — an explicit `protocolVersion` is now required when
  building a legacy advisor brief, closing the silent default that let a frozen
  v1.2 contract reach a v1.4 mandate; publishing is gated on a changelog entry
- `openplanr@1.25.3` — the disclosed contract equals the enforced one, secret
  gating blocks only hard categories, `status` and `review` report true cycle
  state, a blocked prepare names an escape, `inspect` reports the enforced
  protocol, and an optional questionnaire field no longer blocks initialization.
  Pins `planr-pipeline@0.42.0`
- `@openplanr/skills@1.26.2` — exact pin advance; no mirrored content changed
- `openplanr-marketplace@1.14.0` — this ledger

## Recorded in one pull request

This is the first ledger composed by `stage-release` from a release intent plus
facts derived from GitHub, npm and git, rather than transcribed by hand, and the
first recorded under the single-pull-request discipline. Both changes exist
because three ledger cycles were hand-run in one day; see `BL-009` in the CLI
backlog.
