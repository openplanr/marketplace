import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectParticipantFacts, diffParticipant } from './release-facts.mjs';

/**
 * Re-derives a recorded ledger's facts from live sources and reports whether the
 * ledger still describes reality.
 *
 * This is the acceptance harness for automated ledger authoring. The operation's
 * own `operationDigest` cannot serve that purpose: it hashes a fixed projection of
 * the operation's *intent* — component identities, target versions, branches,
 * prerequisites — and excludes every recorded fact. A ledger with a fabricated
 * merge commit, a fabricated tarball digest, and a fabricated npm integrity string
 * hashes to exactly the same digest as the truthful one and passes validation with
 * zero errors. Replay is therefore the only check that can tell a correct generator
 * from a plausible one.
 *
 * Read-only: it opens no pull request, writes no file, and mutates nothing.
 *
 * Exit codes
 *   0  every recorded fact still matches its live source
 *   1  at least one recorded fact disagrees with reality
 *   2  the replay could not run (network, auth, missing local clone) — never
 *      silently 0, because an unrunnable check must not read as a passing one
 */

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function ghApi(path) {
  const body = execFileSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return JSON.parse(body);
}

export async function replayOperation({
  operation,
  githubApi = ghApi,
  fetchImpl = fetch,
  marketplaceRoot = repositoryRoot,
  log = console.log,
}) {
  const results = [];
  for (const participant of operation.participants ?? []) {
    const pullRequestNumber = participant.pullRequest?.number;
    if (!pullRequestNumber) {
      results.push({ component: participant.component, skipped: 'no pull request recorded' });
      continue;
    }
    const derived = await collectParticipantFacts({
      component: participant.component,
      version: participant.targetVersion,
      pullRequestNumber,
      githubApi,
      fetchImpl,
      repositoryRoot: marketplaceRoot,
    });
    results.push({
      component: participant.component,
      differences: diffParticipant(participant, derived),
      derived,
    });
  }

  log(`Replaying ${operation.operationId} against live sources`);
  let disagreements = 0;
  for (const result of results) {
    if (result.skipped) {
      log(`  ~ ${result.component}: ${result.skipped}`);
      continue;
    }
    if (result.differences.length === 0) {
      const declined =
        result.component === 'marketplace' && !result.derived.tarballDigest ? ' (self-reference declined)' : '';
      log(`  ✓ ${result.component}: every recorded fact matches${declined}`);
      continue;
    }
    disagreements += result.differences.length;
    for (const difference of result.differences) {
      log(`  ✗ ${result.component}.${difference.field}`);
      log(`      recorded: ${difference.recorded}`);
      log(`      derived:  ${difference.derived}`);
    }
  }

  if (disagreements === 0) {
    log(`No drift: ${operation.operationId} still describes its published artifacts.`);
  }
  return disagreements === 0 ? 0 : 1;
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (invokedDirectly) {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node scripts/replay-operation.mjs <operation.json>');
    process.exit(2);
  }
  try {
    const operation = JSON.parse(readFileSync(resolve(target), 'utf8'));
    process.exit(await replayOperation({ operation }));
  } catch (error) {
    console.error(`Replay could not run: ${error.message}`);
    process.exit(2);
  }
}
