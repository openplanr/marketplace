# OPERATE-SPEC-012 marketplace work item

This repository is the durable release ledger for the **Operate DevEx release**:
the coordinated advance that puts the operating flow's contract-disclosure,
validation, lease, projection, citation, and conflict fixes into users' hands
and re-aligns the advertised tuple with npm.

Umbrella spec: `SPEC-007` (the DevEx batch is the direct follow-through of the
SPEC-007 board cycle's own findings — the operate flow was exercised end to end,
twelve defects were reproduced live, and this tuple ships their fixes).

## Ledger numbering

The `operationId` is a monotonic ledger counter independent of the umbrella
spec. The last recorded operation is `OPERATE-SPEC-011` (umbrella `SPEC-007`),
so the next free number is `OPERATE-SPEC-012`. This entry adds its own
work-item map row so the ledger resolves to this document.

## Staged tuple

- Protocol `1.4.0` (unchanged)
- `planr-pipeline@0.41.0` — attribute-scoped artifact privacy scan, dashboard
  reader honesty (`legacy-state-present`), additive action-versus-commitment
  conflict branch in the advisor response schema
- `openplanr@1.25.0` — response contract disclosed in every mandate, batch
  validation plus the `harness validate` dry-run, registry-reconciled Chair
  bounds, v1.4-aligned citation anchoring with sibling-component resolution,
  lease visibility and renewal coverage, public dashboard projection, honest
  non-interactive `init`, `operate report --html`, cross-component conformance
  suite, post-publish ledger drift check
- `@openplanr/skills@1.26.0` — **unchanged participant**: the batch touched no
  mirrored skill content (verified byte-identical), so the existing v1.26.0
  artifacts carry forward
- `openplanr-marketplace@1.12.0` — this ledger plus the published-drift
  detector (`scripts/check-published-drift.mjs` + daily `reconcile.yml`)

## Why this ledger exists right now

The drift detector shipped in this very tuple is red against the current
manifest: `cli` advertised 1.24.0 while npm serves 1.25.0. That red run is the
detector working as designed; this operation is what turns it green. The
two-step discipline, the digest methods per participant, and the finalization
gate are unchanged from `OPERATE-SPEC-011` — see that work item for the full
statement; everything there applies here verbatim.
