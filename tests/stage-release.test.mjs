import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildOperation,
  defaultWorkItems,
  nextOperationId,
  writeOperation,
} from '../scripts/stage-release.mjs';
import { calculateOperationDigest, validateOperation } from '../scripts/validate-operation.mjs';

/**
 * The builder is held to reproducing a ledger that already exists and is known
 * good. Given OPERATE-SPEC-013's human intent — which participants moved, to what
 * versions, under which umbrella — and its recorded pull requests, it must derive
 * the same merge commits, tags, digests, and npm integrity strings that a human
 * transcribed by hand, and compose an operation whose digest equals the recorded
 * one.
 *
 * Digest equality alone would not be evidence: `operationDigest` covers intent and
 * excludes every collected fact, so it agrees with itself no matter how wrong the
 * facts are. The facts are therefore asserted field by field as well.
 */

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

/** Serves the recorded ledger's own artifacts back as API-shaped responses. */
function sourcesFor(ledger, { tarballs }) {
  const githubApi = async (path) => {
    const pullMatch = /repos\/([^/]+\/[^/]+)\/pulls\/(\d+)$/.exec(path);
    if (pullMatch) {
      const participant = ledger.participants.find(
        (candidate) => candidate.pullRequest?.number === Number(pullMatch[2]),
      );
      return {
        number: participant.pullRequest.number,
        html_url: participant.pullRequest.url,
        merged: true,
        state: 'closed',
        merge_commit_sha: participant.commitSha,
      };
    }
    const tagMatch = /repos\/([^/]+\/[^/]+)\/git\/ref\/tags\/(.+)$/.exec(path);
    if (tagMatch) {
      const participant = ledger.participants.find((candidate) => candidate.tag === tagMatch[2]);
      if (!participant?.commitSha) throw new Error('no such tag');
      return { object: { type: 'commit', sha: participant.commitSha } };
    }
    throw new Error(`unexpected GitHub path: ${path}`);
  };
  const fetchImpl = async (url) => {
    const registryMatch = /registry\.npmjs\.org\/([^/]+)\/(.+)$/.exec(url);
    if (registryMatch) {
      const participant = ledger.participants.find(
        (candidate) => candidate.package?.version === registryMatch[2],
      );
      return {
        ok: true,
        json: async () => ({
          dist: {
            tarball: `https://registry.test/${participant.component}.tgz`,
            integrity: participant.package.integrity,
          },
        }),
      };
    }
    const component =
      /registry\.test\/([a-z]+)\.tgz/.exec(url)?.[1] ?? (url.includes('codeload') ? 'skills' : null);
    if (component && tarballs[component]) return { ok: true, arrayBuffer: async () => tarballs[component] };
    throw new Error(`unexpected fetch: ${url}`);
  };
  return { githubApi, fetchImpl };
}

test('the builder reproduces a recorded ledger from its intent', async () => {
  const recorded = await readJson('../examples/agent-native-operate-setup-pin-operation.json');
  const previous = await readJson('../examples/agent-native-operate-devex-release-operation.json');

  // The tarball bytes are unknown to the test, so serve bytes whose digest the
  // ledger already records — proving the builder digests what it fetched and
  // places it on the right participant, without smuggling in the answer.
  const tarballs = {};
  for (const participant of recorded.participants) {
    if (participant.component === 'marketplace') continue;
    tarballs[participant.component] = Buffer.from(`${participant.component} archive bytes`);
  }
  const { githubApi, fetchImpl } = sourcesFor(recorded, { tarballs });

  const intent = {
    operationId: recorded.operationId,
    umbrellaSpecId: recorded.umbrellaSpecId,
    title: recorded.title,
    capability: recorded.capability,
    eventId: recorded.history[0].eventId,
    // The work items a recorded operation bound are part of its intent and so of
    // its digest; a rebuild must use them rather than today's defaults.
    workItems: Object.fromEntries(
      recorded.participants.map(({ component, repoLocalWorkItem }) => [component, repoLocalWorkItem]),
    ),
    participants: Object.fromEntries(
      recorded.participants.map((participant) => [
        participant.component,
        {
          currentVersion: participant.currentVersion,
          targetVersion: participant.targetVersion,
          pullRequest: participant.pullRequest?.number ?? null,
          branch: participant.branch,
          prerequisites: participant.prerequisites,
        },
      ]),
    ),
  };

  const built = await buildOperation({
    intent,
    previousOperation: previous,
    canaryReport: { evidence: recorded.releaseEvidence },
    timestamp: recorded.createdAt,
    githubApi,
    fetchImpl,
    exec: () => Buffer.from('marketplace archive bytes'),
  });

  // Composition: the digest covers the whole intent projection, so equality means
  // every identity, version, branch, prerequisite and evidence id was rebuilt.
  assert.equal(built.operationDigest, recorded.operationDigest);
  assert.equal(built.operationDigest, calculateOperationDigest(recorded));

  // Facts: asserted directly, because the digest cannot see them.
  for (const component of ['pipeline', 'cli', 'skills']) {
    const rebuilt = built.participants.find((p) => p.component === component);
    const original = recorded.participants.find((p) => p.component === component);
    assert.equal(rebuilt.commitSha, original.commitSha, `${component} commitSha`);
    assert.equal(rebuilt.tag, original.tag, `${component} tag`);
    assert.equal(rebuilt.pullRequest.url, original.pullRequest.url, `${component} PR url`);
    assert.equal(rebuilt.package?.integrity, original.package?.integrity, `${component} integrity`);
  }
});

test('the rebuilt ledger declines the marketplace self-reference', async () => {
  const recorded = await readJson('../examples/agent-native-operate-setup-pin-operation.json');
  const { githubApi, fetchImpl } = sourcesFor(recorded, {
    tarballs: Object.fromEntries(
      recorded.participants
        .filter(({ component }) => component !== 'marketplace')
        .map(({ component }) => [component, Buffer.from(`${component} archive bytes`)]),
    ),
  });
  const built = await buildOperation({
    intent: {
      operationId: 'OPERATE-SPEC-013',
      umbrellaSpecId: 'SPEC-007',
      title: 'rebuild',
      eventId: recorded.history[0].eventId,
      workItems: Object.fromEntries(
        recorded.participants.map(({ component, repoLocalWorkItem }) => [component, repoLocalWorkItem]),
      ),
      participants: Object.fromEntries(
        recorded.participants.map((participant) => [
          participant.component,
          {
            currentVersion: participant.currentVersion,
            targetVersion: participant.targetVersion,
            pullRequest: participant.pullRequest?.number ?? null,
          },
        ]),
      ),
    },
    canaryReport: { evidence: recorded.releaseEvidence },
    timestamp: recorded.createdAt,
    githubApi,
    fetchImpl,
    exec: () => Buffer.from('x'),
  });
  const marketplace = built.participants.find(({ component }) => component === 'marketplace');
  assert.equal(marketplace.commitSha, null);
  assert.equal(marketplace.tag, null);
  assert.equal(marketplace.tarballDigest, null);
  assert.equal(marketplace.pullRequest.state, 'open');
});

test('a ledger that does not validate is never written', () => {
  // Failing closed matters more here than anywhere else: an invalid ledger on disk
  // is indistinguishable from a valid one until something reads it.
  const broken = { schemaVersion: '1.0.0', kind: 'openplanr-ecosystem-operation', participants: [] };
  assert.throws(
    () => writeOperation(broken, '/dev/null'),
    /refusing to write an invalid ledger/,
    'an invalid ledger must not reach disk',
  );
});

test('a tag that does not point at its merge commit aborts the build', async () => {
  const recorded = await readJson('../examples/agent-native-operate-setup-pin-operation.json');
  // A standalone source pair: this scenario uses versions the recorded ledger
  // never had, so the recorded-artifact server has nothing to look them up by.
  const fetchImpl = async (url) =>
    url.includes('registry.npmjs.org')
      ? { ok: true, json: async () => ({ dist: { tarball: 'https://registry.test/x.tgz', integrity: 'sha512-x' } }) }
      : { ok: true, arrayBuffer: async () => Buffer.from('x') };
  const githubApi = async (path) => {
    if (path.includes('/pulls/')) {
      return { number: 104, html_url: 'u', merged: true, state: 'closed', merge_commit_sha: 'a'.repeat(40) };
    }
    return { object: { type: 'commit', sha: 'b'.repeat(40) } };
  };
  await assert.rejects(
    buildOperation({
      intent: {
        operationId: 'OPERATE-SPEC-999',
        umbrellaSpecId: 'SPEC-007',
        title: 't',
        eventId: recorded.history[0].eventId,
        participants: Object.fromEntries(
          recorded.participants.map((participant) => [
            participant.component,
            { currentVersion: '1.0.0', targetVersion: '1.0.1', pullRequest: 104 },
          ]),
        ),
      },
      canaryReport: { evidence: [] },
      timestamp: recorded.createdAt,
      githubApi,
      fetchImpl,
      exec: () => Buffer.from('x'),
    }),
    /does not point at the merge commit/,
  );
});

test('the ledger counter advances past every recorded operation', () => {
  assert.equal(nextOperationId(['OPERATE-SPEC-013', 'OPERATE-SPEC-008-R1', 'OPERATE-SPEC-002']), 'OPERATE-SPEC-014');
  assert.equal(nextOperationId([]), 'OPERATE-SPEC-001');
});

test('new operations bind published changelogs, not minted documents', () => {
  const items = defaultWorkItems('OPERATE-SPEC-014');
  assert.equal(items.pipeline, 'CHANGELOG.md');
  assert.equal(items.cli, 'CHANGELOG.md');
  assert.equal(items.skills, 'CHANGELOG.md');
  // The marketplace has no changelog of its own, and is the repository where a
  // release record belongs.
  assert.equal(items.marketplace, 'docs/implementation/OPERATE-SPEC-014.md');
});
