import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { calculateOperationDigest, validateOperation } from '../scripts/validate-operation.mjs';

/**
 * A cycle needed two pull requests because the marketplace participant records the
 * merge commit, tag, and archive digest of the commit that CONTAINS the ledger —
 * facts that cannot exist while authoring it. The first PR staged a `drafted`
 * ledger; once the merge commit existed and was tagged, a second PR wrote those
 * three facts back and flipped it to `verified`. Between the two, the manifest
 * advertised the previous tuple: the withheld window.
 *
 * A ledger may now decline that self-reference — all three fields null — and verify
 * in a single pull request. These tests prove the exemption is real, that it is
 * all-or-nothing, and that it changes nothing for a ledger that does claim its own
 * artifacts.
 */

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

/** The real OPERATE-SPEC-013 ledger, rewritten as the single-PR cycle it could have been. */
async function singlePullRequestLedger() {
  const operation = await readJson('../examples/agent-native-operate-setup-pin-operation.json');
  const marketplace = operation.participants.find(({ component }) => component === 'marketplace');
  marketplace.commitSha = null;
  marketplace.tag = null;
  marketplace.tarballDigest = null;
  marketplace.pullRequest = {
    number: 116,
    url: 'https://github.com/openplanr/marketplace/pull/116',
    state: 'open',
  };
  operation.ledger.pullRequest = {
    number: 116,
    url: 'https://github.com/openplanr/marketplace/pull/116',
    state: 'open',
  };
  // None of the mutated fields are part of operationIntent(), so the digest is
  // unchanged — asserted below rather than assumed.
  return operation;
}

test('a verified ledger that declines self-reference needs only one pull request', async () => {
  const operation = await singlePullRequestLedger();
  assert.equal(operation.state, 'verified');
  assert.deepEqual(validateOperation(operation), []);
});

test('declining self-reference does not change operationDigest', async () => {
  const original = await readJson('../examples/agent-native-operate-setup-pin-operation.json');
  const collapsed = await singlePullRequestLedger();
  // commitSha, tag, tarballDigest and pullRequest are outside operationIntent(), so
  // the two forms of the same operation are the same operation.
  assert.equal(calculateOperationDigest(collapsed), calculateOperationDigest(original));
  assert.equal(collapsed.operationDigest, original.operationDigest);
});

test('self-reference is all-or-nothing — every partial claim fails closed', async () => {
  const partials = [
    ['commitSha', 'a'.repeat(40)],
    ['tag', 'v1.13.0'],
    ['tarballDigest', `sha256:${'b'.repeat(64)}`],
  ];
  for (const [field, value] of partials) {
    const operation = await singlePullRequestLedger();
    const marketplace = operation.participants.find(
      ({ component }) => component === 'marketplace',
    );
    marketplace[field] = value;
    const errors = validateOperation(operation);
    assert.ok(
      errors.some((error) => error.includes('all-or-nothing')),
      `claiming only ${field} must be rejected, got: ${JSON.stringify(errors)}`,
    );
  }
});

test('a ledger that claims its own merge must still prove it', async () => {
  // The two-step form is unchanged: nulling nothing but opening the ledger PR is
  // still a verified ledger asserting a merge that has not happened.
  const operation = await readJson('../examples/agent-native-operate-setup-pin-operation.json');
  operation.ledger.pullRequest = { ...operation.ledger.pullRequest, state: 'open' };
  const errors = validateOperation(operation);
  assert.ok(
    errors.some((error) => error.includes('requires a merged marketplace ledger PR')),
    `an unmerged ledger PR must be rejected when self-reference is claimed, got: ${JSON.stringify(errors)}`,
  );
});

test('a single-PR ledger must still name the ledger PR it lives in', async () => {
  const operation = await singlePullRequestLedger();
  const marketplace = operation.participants.find(({ component }) => component === 'marketplace');
  marketplace.pullRequest = null;
  const errors = validateOperation(operation);
  assert.ok(
    errors.some((error) => error.includes('must still name its ledger PR')),
    `a nameless single-PR ledger must be rejected, got: ${JSON.stringify(errors)}`,
  );
});

test('every committed ledger still validates unchanged', async () => {
  // The exemption is additive: the fifteen ledgers recorded under the two-step
  // discipline must be unaffected by it.
  const { readdir } = await import('node:fs/promises');
  const directory = new URL('../examples/', import.meta.url);
  const files = (await readdir(directory)).filter((name) => name.endsWith('.json'));
  let checked = 0;
  for (const file of files) {
    const operation = JSON.parse(await readFile(new URL(file, directory), 'utf8'));
    if (operation.kind !== 'openplanr-ecosystem-operation') continue;
    assert.deepEqual(validateOperation(operation), [], `${file} must still validate`);
    checked += 1;
  }
  assert.ok(checked >= 15, `expected at least 15 ledgers, checked ${checked}`);
});
