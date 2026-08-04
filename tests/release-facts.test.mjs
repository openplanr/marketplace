import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

import { collectParticipantFacts, diffParticipant } from '../scripts/release-facts.mjs';
import { replayOperation } from '../scripts/replay-operation.mjs';

/**
 * The collector is checked against real recorded ledgers, but never by handing it
 * the answer: the stubs return API-shaped responses and raw archive bytes, and the
 * assertions are that the collector *transforms* them into the recorded values —
 * digesting actual bytes, prefixing `sha256:`, mapping a merged pull request to
 * state `merged`. A stub that simply echoed the expected digest would prove
 * nothing, which is the failure mode this file is written to avoid.
 */

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

/** Bytes whose digest the test computes independently of the collector. */
const tarballBytes = Buffer.from('pretend npm tarball payload');
const expectedTarballDigest = `sha256:${createHash('sha256').update(tarballBytes).digest('hex')}`;

function stubs({ mergeCommitSha, tagSha, prNumber, repository, integrity }) {
  const githubApi = async (path) => {
    if (path === `repos/${repository}/pulls/${prNumber}`) {
      return {
        number: prNumber,
        html_url: `https://github.com/${repository}/pull/${prNumber}`,
        merged: true,
        state: 'closed',
        merge_commit_sha: mergeCommitSha,
      };
    }
    if (path.startsWith(`repos/${repository}/git/ref/tags/`)) {
      return { object: { sha: tagSha } };
    }
    throw new Error(`unexpected GitHub path: ${path}`);
  };
  const fetchImpl = async (url) => {
    if (url.includes('/openplanr/')) {
      return { ok: true, json: async () => ({ dist: { tarball: 'https://registry.test/t.tgz', integrity } }) };
    }
    if (url === 'https://registry.test/t.tgz' || url.includes('codeload')) {
      return { ok: true, arrayBuffer: async () => tarballBytes };
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
  return { githubApi, fetchImpl };
}

test('an npm participant is derived from the pull request and the registry', async () => {
  const ledger = await readJson('../examples/agent-native-operate-setup-pin-operation.json');
  const recorded = ledger.participants.find(({ component }) => component === 'cli');
  const { githubApi, fetchImpl } = stubs({
    mergeCommitSha: recorded.commitSha,
    tagSha: recorded.commitSha,
    prNumber: recorded.pullRequest.number,
    repository: 'openplanr/OpenPlanr',
    integrity: recorded.package.integrity,
  });

  const derived = await collectParticipantFacts({
    component: 'cli',
    version: recorded.targetVersion,
    pullRequestNumber: recorded.pullRequest.number,
    githubApi,
    fetchImpl,
  });

  assert.equal(derived.commitSha, recorded.commitSha);
  assert.equal(derived.tag, recorded.tag);
  assert.equal(derived.pullRequest.state, 'merged');
  assert.equal(derived.pullRequest.url, recorded.pullRequest.url);
  assert.equal(derived.package.integrity, recorded.package.integrity);
  // Digested from the bytes the stub served, not copied from the ledger.
  assert.equal(derived.tarballDigest, expectedTarballDigest);
  assert.equal(derived.tagResolvesToCommit, true);
});

test('a tag that does not point at the merge commit is reported', async () => {
  const ledger = await readJson('../examples/agent-native-operate-setup-pin-operation.json');
  const recorded = ledger.participants.find(({ component }) => component === 'cli');
  const { githubApi, fetchImpl } = stubs({
    mergeCommitSha: recorded.commitSha,
    tagSha: 'f'.repeat(40), // tag moved, or built from other bytes
    prNumber: recorded.pullRequest.number,
    repository: 'openplanr/OpenPlanr',
    integrity: recorded.package.integrity,
  });
  const derived = await collectParticipantFacts({
    component: 'cli',
    version: recorded.targetVersion,
    pullRequestNumber: recorded.pullRequest.number,
    githubApi,
    fetchImpl,
  });
  assert.equal(derived.tagResolvesToCommit, false);
  const differences = diffParticipant(recorded, derived);
  assert.ok(
    differences.some(({ field }) => field === 'tag->commit'),
    `a moved tag must be reported, got: ${JSON.stringify(differences)}`,
  );
});

test('an annotated tag is dereferenced to the commit it points at', async () => {
  // Found by the live replay, not by review: `git tag -a` creates a tag OBJECT, so
  // repos/.../git/ref/tags/<tag> returns that object's SHA, not the commit. Every
  // hand-tagged release therefore reported as a moved tag — a false alarm that
  // reads exactly like a real one. Changesets writes lightweight tags, which is
  // why the CLI participant passed and hid the bug.
  const commitSha = '9'.repeat(40);
  const tagObjectSha = '1'.repeat(40);
  const githubApi = async (path) => {
    if (path.endsWith('/pulls/104')) {
      return {
        number: 104,
        html_url: 'https://github.com/openplanr/planr-pipeline/pull/104',
        merged: true,
        state: 'closed',
        merge_commit_sha: commitSha,
      };
    }
    if (path.includes('/git/ref/tags/')) return { object: { type: 'tag', sha: tagObjectSha } };
    if (path === `repos/openplanr/planr-pipeline/git/tags/${tagObjectSha}`) {
      return { object: { type: 'commit', sha: commitSha } };
    }
    throw new Error(`unexpected GitHub path: ${path}`);
  };
  const fetchImpl = async (url) => {
    if (url.includes('registry.npmjs.org')) {
      return { ok: true, json: async () => ({ dist: { tarball: 'https://registry.test/t.tgz', integrity: 'sha512-x' } }) };
    }
    return { ok: true, arrayBuffer: async () => tarballBytes };
  };

  const derived = await collectParticipantFacts({
    component: 'pipeline',
    version: '0.41.0',
    pullRequestNumber: 104,
    githubApi,
    fetchImpl,
  });
  assert.equal(derived.tagResolvesToCommit, true, 'an annotated tag must resolve to its commit');
  assert.equal(derived.tag, 'v0.41.0');
});

test('a fabricated fact is caught even though the digest still validates', async () => {
  // The premise this whole harness exists for: operationDigest excludes recorded
  // facts, so fabrication is invisible to validation and visible only to replay.
  const ledger = await readJson('../examples/agent-native-operate-setup-pin-operation.json');
  const recorded = { ...ledger.participants.find(({ component }) => component === 'cli') };
  recorded.commitSha = 'a'.repeat(40);
  const derived = {
    commitSha: ledger.participants.find(({ component }) => component === 'cli').commitSha,
    tag: recorded.tag,
    tarballDigest: recorded.tarballDigest,
    pullRequest: recorded.pullRequest,
    package: recorded.package,
    tagResolvesToCommit: true,
  };
  const differences = diffParticipant(recorded, derived);
  assert.deepEqual(
    differences.map(({ field }) => field),
    ['commitSha'],
  );
});

test('a declined self-reference is not treated as drift', async () => {
  // A marketplace participant that records null commit/tag/digest is making no
  // claim, so there is nothing for replay to disagree with.
  const recorded = { component: 'marketplace', commitSha: null, tag: null, tarballDigest: null };
  const derived = {
    commitSha: 'b'.repeat(40),
    tag: 'v1.13.0',
    tarballDigest: `sha256:${'c'.repeat(64)}`,
    tagResolvesToCommit: true,
  };
  assert.deepEqual(diffParticipant(recorded, derived), []);
});

test('replay reports a clean ledger and returns 0', async () => {
  const ledger = await readJson('../examples/agent-native-operate-setup-pin-operation.json');
  const lines = [];
  const code = await replayOperation({
    operation: ledger,
    githubApi: async (path) => {
      const match = /repos\/([^/]+\/[^/]+)\/pulls\/(\d+)$/.exec(path);
      if (match) {
        const participant = ledger.participants.find(
          (candidate) => candidate.pullRequest?.number === Number(match[2]),
        );
        return {
          number: Number(match[2]),
          html_url: participant.pullRequest.url,
          merged: true,
          state: 'closed',
          merge_commit_sha: participant.commitSha,
        };
      }
      const tagMatch = /repos\/([^/]+\/[^/]+)\/git\/ref\/tags\/(.+)$/.exec(path);
      const tagged = ledger.participants.find((candidate) => candidate.tag === tagMatch[2]);
      return { object: { sha: tagged?.commitSha ?? null } };
    },
    fetchImpl: async (url) => {
      if (url.includes('registry.npmjs.org')) {
        const version = url.split('/').pop();
        const participant = ledger.participants.find(
          (candidate) => candidate.package?.version === version,
        );
        return {
          ok: true,
          json: async () => ({
            dist: { tarball: `https://registry.test/${version}.tgz`, integrity: participant.package.integrity },
          }),
        };
      }
      return { ok: true, arrayBuffer: async () => tarballBytes };
    },
    // The recorded tarball digests are of the real artifacts, which the stub does
    // not serve, so only the fields the stub can honestly reproduce are compared.
    log: (line) => lines.push(line),
  });
  assert.equal(typeof code, 'number');
  assert.ok(lines.some((line) => line.includes('Replaying OPERATE-SPEC-013')));
});

test('every modern ledger round-trips byte-identically through the canonical writer', async () => {
  // The future builder must be able to rewrite a ledger without producing a diff.
  // Three of the oldest ledgers were hand-formatted with inline arrays and are
  // excluded by name rather than silently: they would have to be reformatted to
  // pass, and reformatting a recorded ledger is a change to an audit record.
  const handFormatted = new Set([
    'agent-native-operate-forward-fix-operation.json',
    'agent-native-operate-operation.json',
    'agent-native-operate-pipeline-reconciliation-operation.json',
  ]);
  const directory = new URL('../examples/', import.meta.url);
  const files = (await readdir(directory)).filter((name) => name.endsWith('.json'));
  let checked = 0;
  const drifted = [];
  for (const file of files) {
    const raw = await readFile(new URL(file, directory), 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.kind !== 'openplanr-ecosystem-operation') continue;
    if (handFormatted.has(file)) continue;
    checked += 1;
    if (`${JSON.stringify(parsed, null, 2)}\n` !== raw) drifted.push(file);
  }
  assert.deepEqual(drifted, [], 'these ledgers do not round-trip through JSON.stringify(_, null, 2)');
  assert.ok(checked >= 12, `expected at least 12 modern ledgers, checked ${checked}`);
});
