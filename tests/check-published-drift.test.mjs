import assert from 'node:assert/strict';
import test from 'node:test';
import { NPM_PACKAGES, runDriftCheck } from '../scripts/check-published-drift.mjs';

// Builds an ecosystem manifest fragment carrying only the versions the drift
// check reads, so each case states its advertised versions explicitly.
const ecosystemWith = ({ cli, pipeline }) => ({
  components: {
    cli: { version: cli },
    pipeline: { version: pipeline },
  },
});

// Injectable fetch that answers each npm package request from a version map,
// matching the abbreviated packument shape (`dist-tags.latest`) the script reads.
const fetchLatest = (versions) => async (url) => {
  const packageName = url.split('/').pop();
  assert.ok(
    Object.values(NPM_PACKAGES).includes(packageName),
    `unexpected npm request for ${packageName}`,
  );
  return { ok: true, json: async () => ({ 'dist-tags': { latest: versions[packageName] } }) };
};

// Captures log/errorLog output so a case can assert on what the check said.
const capture = () => {
  const out = [];
  const err = [];
  return {
    out,
    err,
    log: (message) => out.push(message),
    errorLog: (message) => err.push(message),
  };
};

test('aligned manifest exits 0 and reports no drift', async () => {
  const sink = capture();
  const code = await runDriftCheck({
    ecosystem: ecosystemWith({ cli: '1.24.0', pipeline: '0.40.0' }),
    fetchImpl: fetchLatest({ openplanr: '1.24.0', 'planr-pipeline': '0.40.0' }),
    log: sink.log,
    errorLog: sink.errorLog,
  });

  assert.equal(code, 0);
  assert.deepEqual(sink.err, []);
  assert.ok(sink.out.some((line) => line.includes('No published drift')));
});

test('manifest behind npm exits 1 and names every drifting component', async () => {
  const sink = capture();
  const code = await runDriftCheck({
    ecosystem: ecosystemWith({ cli: '1.24.0', pipeline: '0.40.0' }),
    fetchImpl: fetchLatest({ openplanr: '1.24.1', 'planr-pipeline': '0.41.0' }),
    log: sink.log,
    errorLog: sink.errorLog,
  });

  assert.equal(code, 1);
  const report = sink.err.join('\n');
  assert.match(report, /cli: advertised 1\.24\.0, npm latest 1\.24\.1/);
  assert.match(report, /pipeline: advertised 0\.40\.0, npm latest 0\.41\.0/);
});

test('manifest ahead of npm exits 0 with a staged-ledger note', async () => {
  const sink = capture();
  const code = await runDriftCheck({
    ecosystem: ecosystemWith({ cli: '1.25.0', pipeline: '0.41.0' }),
    fetchImpl: fetchLatest({ openplanr: '1.24.1', 'planr-pipeline': '0.40.0' }),
    log: sink.log,
    errorLog: sink.errorLog,
  });

  assert.equal(code, 0);
  assert.deepEqual(sink.err, []);
  const report = sink.out.join('\n');
  assert.match(report, /cli: advertised 1\.25\.0 is ahead of npm latest 1\.24\.1 \(staged ledger/);
  assert.match(report, /pipeline: advertised 0\.41\.0 is ahead of npm latest 0\.40\.0 \(staged ledger/);
});

test('registry/network error exits with a distinct nonzero code that says the check could not run', async () => {
  const sink = capture();
  const failingFetch = async () => {
    throw new Error('ECONNREFUSED registry.npmjs.org');
  };
  const code = await runDriftCheck({
    ecosystem: ecosystemWith({ cli: '1.24.0', pipeline: '0.40.0' }),
    fetchImpl: failingFetch,
    log: sink.log,
    errorLog: sink.errorLog,
  });

  // Distinct from aligned (0) and from drift-found (1): the guard fails visibly
  // closed on error rather than silently reporting alignment.
  assert.notEqual(code, 0);
  assert.notEqual(code, 1);
  assert.equal(code, 2);
  assert.ok(sink.err.some((line) => line.includes('could not run')));
});

test('an unreachable registry mid-check reports could-not-run rather than the drift it already saw', async () => {
  const sink = capture();
  // First package resolves behind (a real drift); the second call fails. An
  // incomplete check must not be reported as either aligned or drift-found.
  const flakyFetch = async (url) => {
    if (url.endsWith('/openplanr')) {
      return { ok: true, json: async () => ({ 'dist-tags': { latest: '1.24.1' } }) };
    }
    return { ok: false, status: 503 };
  };
  const code = await runDriftCheck({
    ecosystem: ecosystemWith({ cli: '1.24.0', pipeline: '0.40.0' }),
    fetchImpl: flakyFetch,
    log: sink.log,
    errorLog: sink.errorLog,
  });

  assert.equal(code, 2);
  assert.ok(sink.err.some((line) => line.includes('could not run')));
});
