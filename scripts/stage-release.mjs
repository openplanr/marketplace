import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { collectParticipantFacts, REPOSITORIES } from './release-facts.mjs';
import { calculateOperationDigest, validateOperation } from './validate-operation.mjs';

/**
 * Composes a release ledger from a short human intent plus facts derived from live
 * sources, and refuses to write one that does not validate.
 *
 * The intent is the part that is genuinely a judgment: which participants move, to
 * what versions, under which umbrella, and why. Everything else — merge commits,
 * pull request states, tags, npm integrity, three kinds of archive digest — was
 * previously transcribed by hand for every release. That transcription is what
 * this replaces.
 *
 * What it deliberately does not do: open a pull request, push a branch, tag a
 * commit, or publish anything. It writes one file and prints what remains.
 *
 * Correctness is not established by the operation's own digest — that hashes only
 * the intent and would agree with itself no matter how wrong the collected facts
 * were. It is established by replaying the result against live sources
 * (`npm run replay:operation`), which is the acceptance test this builder is held
 * to.
 */

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PARTICIPANT_ORDER = ['pipeline', 'cli', 'skills', 'marketplace'];

/**
 * Work items for a newly authored operation. Product repositories bind their own
 * published changelog — already written per release, already public — so a
 * coordinated release mints no document inside them. The marketplace binds a
 * record in this repository, which is where release machinery belongs and which
 * has no changelog of its own.
 */
export function defaultWorkItems(operationId) {
  return {
    pipeline: 'CHANGELOG.md',
    cli: 'CHANGELOG.md',
    skills: 'CHANGELOG.md',
    marketplace: `docs/implementation/${operationId}.md`,
  };
}

/** The next free ledger number. The counter is independent of the umbrella spec. */
export function nextOperationId(recordedIds) {
  const highest = recordedIds
    .map((id) => /^OPERATE-SPEC-([0-9]{3,})/.exec(id)?.[1])
    .filter(Boolean)
    .map(Number)
    .reduce((max, value) => Math.max(max, value), 0);
  return `OPERATE-SPEC-${String(highest + 1).padStart(3, '0')}`;
}

function ghApi(path) {
  return JSON.parse(
    execFileSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }),
  );
}

/**
 * Builds the operation. `intent` supplies the judgment; every other field is
 * derived, carried forward from the previous operation, or a documented constant.
 */
export async function buildOperation({
  intent,
  previousOperation,
  canaryReport,
  timestamp,
  githubApi = ghApi,
  fetchImpl = fetch,
  exec,
  marketplaceRoot = repositoryRoot,
}) {
  const operationId = intent.operationId;
  const workItems = intent.workItems ?? defaultWorkItems(operationId);
  const participants = [];

  for (const component of PARTICIPANT_ORDER) {
    const declared = intent.participants?.[component];
    if (!declared) throw new Error(`intent is missing the ${component} participant`);
    const previous = previousOperation?.participants?.find(
      (candidate) => candidate.component === component,
    );
    // An unchanged participant is expressed by target === current, never by
    // omission: the ledger always carries exactly four participants in order.
    const currentVersion = declared.currentVersion ?? previous?.targetVersion ?? null;
    if (!currentVersion) throw new Error(`cannot determine ${component} currentVersion`);

    const selfReferential = component === 'marketplace';
    // A participant that declines self-reference derives nothing: its commit,
    // tag, and archive digest describe the commit that will CONTAIN this ledger.
    // Collecting them would resolve a merge commit that does not exist while the
    // pull request is open, and `git archive` would fail on a tree the local
    // repository has never seen.
    const facts = !selfReferential && declared.pullRequest
      ? await collectParticipantFacts({
          component,
          version: declared.targetVersion,
          pullRequestNumber: declared.pullRequest,
          githubApi,
          fetchImpl,
          repositoryRoot: marketplaceRoot,
          exec,
        })
      : null;

    if (facts && facts.tag && facts.commitSha && !facts.tagResolvesToCommit) {
      throw new Error(
        `${component} tag ${facts.tag} does not point at the merge commit of pull request ${declared.pullRequest}`,
      );
    }

    participants.push({
      component,
      repoLocalSpecId: `${operationId}:${component}`,
      repoLocalWorkItem: workItems[component],
      repository: REPOSITORIES[component],
      currentVersion,
      targetVersion: declared.targetVersion,
      phase: 'verified',
      branch: declared.branch ?? previous?.branch ?? 'main',
      targetBranch: 'main',
      // The marketplace participant declines to record the commit, tag, and digest
      // of the commit that will contain this ledger, so the cycle needs one pull
      // request rather than two.
      commitSha: selfReferential ? null : (facts?.commitSha ?? null),
      pullRequest: declared.pullRequest
        ? {
            number: declared.pullRequest,
            url: `https://github.com/${REPOSITORIES[component]}/pull/${declared.pullRequest}`,
            state: selfReferential ? 'open' : 'merged',
          }
        : null,
      package: selfReferential ? null : (facts?.package ?? null),
      tag: selfReferential ? null : (facts?.tag ?? null),
      tarballDigest: selfReferential ? null : (facts?.tarballDigest ?? null),
      checks: declared.checks ?? [],
      approvals: [],
      prerequisites: declared.prerequisites ?? previous?.prerequisites ?? [],
      compensation: selfReferential ? 'withhold-manifest' : 'forward-fix',
      nextSafeAction: declared.nextSafeAction ?? `${component} recorded at ${declared.targetVersion}.`,
    });
  }

  const operation = {
    schemaVersion: '1.0.0',
    kind: 'openplanr-ecosystem-operation',
    // The ledger protocol version, which is not the product protocol version.
    protocolVersion: '1.2.0',
    operationId,
    operationDigest: `sha256:${'0'.repeat(64)}`,
    umbrellaSpecId: intent.umbrellaSpecId,
    title: intent.title,
    capability: intent.capability ?? previousOperation?.capability ?? 'agenticOperatingBoard',
    createdAt: timestamp,
    updatedAt: timestamp,
    state: 'drafted',
    ledger: {
      kind: 'marketplace-draft-pr',
      repository: 'openplanr/marketplace',
      headRef: `ecosystem-release/${operationId.toLowerCase()}`,
      pullRequest: null,
    },
    participantOrder: [...PARTICIPANT_ORDER],
    participants,
    releaseEvidence: (canaryReport?.evidence ?? []).map(({ artifact: _artifact, ...entry }) => entry),
    prepareDigest: null,
    confirmationDigest: null,
    blockedReason: null,
    nextSafeAction: intent.nextSafeAction ?? 'Open the ledger pull request and merge it once reviewed.',
    recovery: {
      mode: 'forward-fix',
      reason:
        intent.recoveryReason ??
        'The participants are published artifacts; the ledger reconciles the manifest and cannot roll them back.',
      nextSafeAction: 'Do not rewrite or unpublish any released artifact.',
    },
    reconciliation: {
      status: 'pending',
      checkedAt: timestamp,
      sources: [
        'github-pr',
        'git-commit',
        'git-tag',
        'github-checks',
        'npm-registry',
        'marketplace-manifest',
        'operating-canary',
      ],
      drift: [],
      nextSafeAction: 'Reconcile once the ledger pull request is open.',
    },
    history: [
      {
        eventId: intent.eventId,
        timestamp,
        type: 'operation.created',
        actor: intent.actor ?? 'Release coordinator',
        participant: 'marketplace',
        digest: null,
        note: intent.note ?? `Staged ${operationId}.`,
      },
    ],
  };

  operation.operationDigest = calculateOperationDigest(operation);
  operation.history[0].digest = operation.operationDigest;
  return operation;
}

/** Writes only after the composed ledger validates. */
export function writeOperation(operation, outputPath) {
  const errors = validateOperation(operation);
  if (errors.length) {
    throw new Error(
      `refusing to write an invalid ledger:\n  ${errors.join('\n  ')}`,
    );
  }
  writeFileSync(outputPath, `${JSON.stringify(operation, null, 2)}\n`);
  return outputPath;
}

const invokedDirectly =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (invokedDirectly) {
  const intentPath = process.argv[2];
  if (!intentPath) {
    console.error('usage: node scripts/stage-release.mjs <intent.json> [canary-report.json]');
    process.exit(2);
  }
  try {
    const intent = JSON.parse(readFileSync(resolve(intentPath), 'utf8'));
    const canaryPath = process.argv[3];
    const canaryReport = canaryPath ? JSON.parse(readFileSync(resolve(canaryPath), 'utf8')) : null;
    const operation = await buildOperation({
      intent,
      previousOperation: intent.previousOperationPath
        ? JSON.parse(readFileSync(resolve(intent.previousOperationPath), 'utf8'))
        : null,
      canaryReport,
      timestamp: intent.timestamp ?? new Date().toISOString(),
    });
    const outputPath = join(
      repositoryRoot,
      'examples',
      intent.outputName ?? `${operation.operationId.toLowerCase()}-operation.json`,
    );
    writeOperation(operation, outputPath);
    console.log(`Wrote ${outputPath}`);
    console.log(`  operationId    ${operation.operationId}`);
    console.log(`  operationDigest ${operation.operationDigest}`);
    console.log('\nStill yours to do:');
    const workItem = join(repositoryRoot, `docs/implementation/${operation.operationId}.md`);
    if (!existsSync(workItem)) console.log(`  - write ${workItem}`);
    console.log(`  - register ${operation.operationId} in scripts/validate-operation.mjs`);
    console.log('  - bump this package version, open the ledger PR, and write its narrative');
    console.log(`  - verify with: npm run replay:operation -- ${outputPath}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
