import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  CHANGELOG_WORK_ITEM,
  calculateOperationDigest,
  repoLocalWorkItems,
  validateOperation,
} from '../scripts/validate-operation.mjs';

/**
 * A participant's work item used to be an internal `OPERATE-SPEC-NNN.md` minted in
 * the product repository for every release — a document written to satisfy an
 * existence check rather than to be read, published in a public docs tree.
 *
 * New operations bind `CHANGELOG.md` instead: already public, already written per
 * release, already shipped to consumers. Because one changelog covers every
 * release, mere existence would assert nothing about *this* one, so the binding is
 * checked by the released version's own heading.
 *
 * Historical operations keep their recorded paths: `repoLocalWorkItem` is inside
 * `operationIntent()`, so retargeting them would change `operationDigest` and break
 * immutable verified records and every approval bound to them.
 */

const temporaryDirectories = [];

async function workspaceWithChangelog(contents) {
  const workspace = await mkdtemp(join(tmpdir(), 'openplanr-changelog-work-item-'));
  temporaryDirectories.push(workspace);
  await mkdir(join(workspace, 'OpenPlanr'), { recursive: true });
  await writeFile(join(workspace, 'OpenPlanr', 'CHANGELOG.md'), contents);
  // The sibling participants keep their own work items; the workspace has to
  // satisfy them or their (unrelated) existence errors mask the assertion here.
  for (const sibling of ['planr-pipeline', 'skills']) {
    await mkdir(join(workspace, sibling, 'docs', 'implementation'), { recursive: true });
    await writeFile(
      join(workspace, sibling, 'docs', 'implementation', 'operating-board.md'),
      '# Operating Board\n',
    );
  }
  return workspace;
}

/** The real OPERATE-SPEC-013 ledger, re-bound to the changelog convention. */
async function changelogBoundOperation() {
  const operation = JSON.parse(
    await readFile(
      new URL('../examples/agent-native-operate-setup-pin-operation.json', import.meta.url),
      'utf8',
    ),
  );
  const cli = operation.participants.find(({ component }) => component === 'cli');
  cli.repoLocalWorkItem = CHANGELOG_WORK_ITEM;
  // repoLocalWorkItem is digest-bound, so the rebind is a different operation
  // intent and must carry its own digest — exactly why history cannot be retargeted.
  operation.operationDigest = calculateOperationDigest(operation);
  for (const participant of operation.participants) {
    for (const approval of participant.approvals ?? []) approval.digest = operation.operationDigest;
  }
  for (const event of operation.history ?? []) {
    if (event.digest) event.digest = operation.operationDigest;
  }
  return operation;
}

test.after(async () => {
  for (const directory of temporaryDirectories) {
    await rm(directory, { recursive: true, force: true });
  }
});

test('a changelog work item validates when the released version is documented', async () => {
  const workspace = await workspaceWithChangelog('# Changelog\n\n## 1.25.1\n\nThe setup pin fix.\n');
  const operation = await changelogBoundOperation();
  repoLocalWorkItems[operation.operationId].cli = CHANGELOG_WORK_ITEM;
  process.env.OPENPLANR_ECOSYSTEM_ROOT = workspace;
  try {
    assert.deepEqual(validateOperation(operation), []);
  } finally {
    delete process.env.OPENPLANR_ECOSYSTEM_ROOT;
    repoLocalWorkItems[operation.operationId].cli = 'docs/implementation/OPERATE-SPEC-013.md';
  }
});

test('a changelog that never mentions the released version is rejected', async () => {
  // The point of the heading check: a whole-repository changelog satisfies mere
  // existence forever, saying nothing about the release being recorded.
  const workspace = await workspaceWithChangelog('# Changelog\n\n## 1.24.0\n\nSomething else.\n');
  const operation = await changelogBoundOperation();
  repoLocalWorkItems[operation.operationId].cli = CHANGELOG_WORK_ITEM;
  process.env.OPENPLANR_ECOSYSTEM_ROOT = workspace;
  try {
    const errors = validateOperation(operation);
    assert.ok(
      errors.some((error) => error.includes('has no heading for released version 1.25.1')),
      `an undocumented release must be rejected, got: ${JSON.stringify(errors)}`,
    );
  } finally {
    delete process.env.OPENPLANR_ECOSYSTEM_ROOT;
    repoLocalWorkItems[operation.operationId].cli = 'docs/implementation/OPERATE-SPEC-013.md';
  }
});

test('retargeting a recorded work item changes operationDigest', async () => {
  // Stated as an executable fact, because it is the reason historical operations
  // keep their internal paths instead of being migrated to the changelog.
  const original = JSON.parse(
    await readFile(
      new URL('../examples/agent-native-operate-setup-pin-operation.json', import.meta.url),
      'utf8',
    ),
  );
  const rebound = await changelogBoundOperation();
  assert.notEqual(rebound.operationDigest, original.operationDigest);
});
