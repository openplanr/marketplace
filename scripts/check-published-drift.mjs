import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { atLeast } from './operating-capability.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NPM_REGISTRY = 'https://registry.npmjs.org';

// The npm-published components of the ecosystem manifest and the package name
// each one ships under. Non-published components (skills plugin, marketplace
// metadata) have no npm `latest` to reconcile against and are intentionally
// absent.
export const NPM_PACKAGES = {
  cli: 'openplanr',
  pipeline: 'planr-pipeline',
};

async function npmLatestVersion(fetchImpl, packageName) {
  const response = await fetchImpl(`${NPM_REGISTRY}/${packageName}`, {
    headers: { accept: 'application/vnd.npm.install-v1+json' },
  });
  if (!response?.ok) {
    throw new Error(
      `npm registry request for ${packageName} failed (${response?.status ?? 'no response'})`,
    );
  }
  const body = await response.json();
  const latest = body?.['dist-tags']?.latest;
  if (typeof latest !== 'string') {
    throw new Error(`npm registry response for ${packageName} is missing dist-tags.latest`);
  }
  return latest;
}

// Compares the versions the manifest advertises against npm's `latest` for each
// published component and returns an exit code:
//   0  aligned, or advertised is *ahead* of npm (a staged, not-yet-finalized
//      ledger — a legitimate mid-release state, reported but not a failure)
//   1  advertised is *behind* npm — drift: users cannot learn the published
//      release exists from inside the product
//   2  the check could not run (registry/network error). Distinct, nonzero, and
//      never silently 0: this guard must fail visibly closed, not open.
export async function runDriftCheck({
  ecosystem,
  fetchImpl = fetch,
  log = () => {},
  errorLog = () => {},
}) {
  const components = ecosystem?.components ?? {};
  const drifts = [];
  const notes = [];
  const aligned = [];
  try {
    for (const [component, packageName] of Object.entries(NPM_PACKAGES)) {
      const advertised = components[component]?.version;
      if (typeof advertised !== 'string') {
        throw new Error(`ecosystem manifest is missing components.${component}.version`);
      }
      const npmLatest = await npmLatestVersion(fetchImpl, packageName);
      if (!atLeast(advertised, npmLatest)) {
        drifts.push({ component, advertised, npmLatest });
      } else if (!atLeast(npmLatest, advertised)) {
        notes.push({ component, advertised, npmLatest });
      } else {
        aligned.push({ component, advertised, npmLatest });
      }
    }
  } catch (error) {
    errorLog(`Published drift check could not run: ${error.message}`);
    return 2;
  }

  for (const entry of aligned) {
    log(`${entry.component}: advertised ${entry.advertised} matches npm latest ${entry.npmLatest}`);
  }
  for (const entry of notes) {
    log(
      `${entry.component}: advertised ${entry.advertised} is ahead of npm latest ${entry.npmLatest} (staged ledger, not yet finalized — no action needed)`,
    );
  }

  if (drifts.length) {
    for (const entry of drifts) {
      errorLog(`${entry.component}: advertised ${entry.advertised}, npm latest ${entry.npmLatest}`);
    }
    errorLog(
      `Published drift: the ecosystem manifest is behind npm for ${drifts
        .map((entry) => entry.component)
        .join(', ')}. Advance the ecosystem ledger so the published release is discoverable.`,
    );
    return 1;
  }

  log('No published drift: the ecosystem manifest is aligned with or ahead of npm.');
  return 0;
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (isMain) {
  const ecosystem = JSON.parse(readFileSync(join(repo, 'ecosystem.json'), 'utf8'));
  const code = await runDriftCheck({
    ecosystem,
    log: (message) => process.stdout.write(`${message}\n`),
    errorLog: (message) => process.stderr.write(`${message}\n`),
  });
  process.exit(code);
}
