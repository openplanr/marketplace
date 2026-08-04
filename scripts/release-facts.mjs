import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

/**
 * Derives the mechanically-knowable half of a ledger participant from live
 * sources: the merge commit, the pull request, the tag, the npm integrity string,
 * and the release archive digest.
 *
 * These are the fields a human transcribed by hand for every coordinated release —
 * the step that made a cycle expensive and, in one recorded case, wrong. Nothing
 * here writes: it reads GitHub, the npm registry, and the local git object store,
 * and returns a value. Composing that value into a ledger is a separate concern.
 *
 * Not everything in a participant is derivable, and this module does not pretend
 * otherwise. `checks[].url` names a specific workflow run, and several runs are
 * equally true for the same commit, so it is reported as underivable rather than
 * guessed. Prose fields (`nextSafeAction`, `title`) are judgment and stay human.
 */

const NPM_REGISTRY = 'https://registry.npmjs.org';
const CODELOAD = 'https://codeload.github.com';

export const REPOSITORIES = {
  pipeline: 'openplanr/planr-pipeline',
  cli: 'openplanr/OpenPlanr',
  skills: 'openplanr/skills',
  marketplace: 'openplanr/marketplace',
};

/**
 * The npm package each component publishes. Components absent from this map do
 * not publish to npm; their release artifact is the git tag itself.
 */
export const NPM_PACKAGES = {
  pipeline: 'planr-pipeline',
  cli: 'openplanr',
};

/**
 * How each participant's `tarballDigest` is computed. The three methods are NOT
 * interchangeable and a digest computed the wrong way is indistinguishable from a
 * fabricated one — it is a well-formed sha256 that simply never matches.
 *
 *   npm         sha256 of the registry tarball
 *   codeload    sha256 of GitHub's source archive for the tag
 *   git-archive sha256 of `git archive --format=tar.gz <commit>` (local only;
 *               byte-different from codeload's archive of the same commit)
 */
export const DIGEST_METHODS = {
  pipeline: 'npm',
  cli: 'npm',
  skills: 'codeload',
  marketplace: 'git-archive',
};

const sha256 = (buffer) => `sha256:${createHash('sha256').update(buffer).digest('hex')}`;

async function readBody(fetchImpl, url, description) {
  const response = await fetchImpl(url);
  if (!response?.ok) {
    throw new Error(`${description} request failed (${response?.status ?? 'no response'}): ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function registryMetadata(fetchImpl, packageName, version) {
  const response = await fetchImpl(`${NPM_REGISTRY}/${packageName}/${version}`);
  if (!response?.ok) {
    throw new Error(
      `npm metadata request for ${packageName}@${version} failed (${response?.status ?? 'no response'})`,
    );
  }
  return response.json();
}

/** `git archive` of a commit, digested locally. The marketplace method. */
export function gitArchiveDigest(commitSha, { repositoryRoot, exec = execFileSync } = {}) {
  const archive = exec('git', ['-C', repositoryRoot, 'archive', '--format=tar.gz', commitSha], {
    encoding: 'buffer',
    maxBuffer: 256 * 1024 * 1024,
  });
  return sha256(archive);
}

/**
 * Collects one participant's derivable facts.
 *
 * `githubApi(path)` must return the parsed JSON body of a GitHub REST path — the
 * same shape `gh api <path>` prints. Injecting it (rather than shelling out here)
 * is what lets this run against recorded responses in a test and against the real
 * API in a replay.
 */
export async function collectParticipantFacts({
  component,
  version,
  pullRequestNumber,
  githubApi,
  fetchImpl = fetch,
  repositoryRoot,
  exec,
}) {
  const repository = REPOSITORIES[component];
  if (!repository) throw new Error(`unknown ecosystem component: ${component}`);

  const pull = await githubApi(`repos/${repository}/pulls/${pullRequestNumber}`);
  const commitSha = pull?.merge_commit_sha ?? null;
  if (pull?.merged && !commitSha) {
    throw new Error(`${component} pull request ${pullRequestNumber} is merged without a merge commit`);
  }

  const tag = `v${version}`;
  // A tag that does not point at the merge commit means the ledger would bind a
  // release built from different bytes than the PR that was reviewed.
  //
  // A tag reference points at either the commit (lightweight) or a tag object
  // (annotated) that in turn points at the commit. Release tooling here produces
  // both kinds — changesets writes lightweight tags, `git tag -a` writes annotated
  // ones — so an annotated tag must be dereferenced before comparing. Comparing
  // the tag-object SHA directly reports every hand-tagged release as a moved tag:
  // a false alarm indistinguishable, in the output, from a real one.
  let tagSha = null;
  try {
    const reference = await githubApi(`repos/${repository}/git/ref/tags/${tag}`);
    if (reference?.object?.type === 'tag') {
      const tagObject = await githubApi(`repos/${repository}/git/tags/${reference.object.sha}`);
      tagSha = tagObject?.object?.sha ?? null;
    } else {
      tagSha = reference?.object?.sha ?? null;
    }
  } catch {
    tagSha = null;
  }

  const facts = {
    component,
    repository,
    commitSha,
    tag: tagSha ? tag : null,
    tagResolvesToCommit: Boolean(tagSha) && Boolean(commitSha) && tagSha === commitSha,
    pullRequest: pull
      ? {
          number: pull.number,
          url: pull.html_url,
          state: pull.merged ? 'merged' : pull.state,
        }
      : null,
    package: null,
    tarballDigest: null,
    // Stated, not silently omitted: a consumer of these facts must know which
    // fields it still has to supply.
    underivable: ['checks[].url', 'nextSafeAction', 'approvals[].actor'],
  };

  const packageName = NPM_PACKAGES[component];
  if (packageName) {
    const metadata = await registryMetadata(fetchImpl, packageName, version);
    const tarballUrl = metadata?.dist?.tarball;
    if (!tarballUrl) throw new Error(`npm metadata for ${packageName}@${version} has no dist.tarball`);
    facts.package = {
      name: packageName,
      version,
      status: 'verified',
      integrity: metadata.dist.integrity,
    };
    facts.tarballDigest = sha256(await readBody(fetchImpl, tarballUrl, 'npm tarball'));
  } else if (DIGEST_METHODS[component] === 'codeload') {
    facts.tarballDigest = sha256(
      await readBody(
        fetchImpl,
        `${CODELOAD}/${repository}/tar.gz/refs/tags/${tag}`,
        'codeload archive',
      ),
    );
  } else if (DIGEST_METHODS[component] === 'git-archive' && commitSha && repositoryRoot) {
    facts.tarballDigest = gitArchiveDigest(commitSha, { repositoryRoot, exec });
  }

  return facts;
}

/**
 * Compares a recorded ledger participant against freshly derived facts.
 * Returns one entry per field that disagrees; an empty array means the ledger
 * still describes reality.
 */
export function diffParticipant(recorded, derived) {
  const differences = [];
  const compare = (field, recordedValue, derivedValue) => {
    // A field the ledger deliberately declines (marketplace self-reference) is not
    // a disagreement; a field it claims and gets wrong is.
    if (recordedValue === null || recordedValue === undefined) return;
    if (derivedValue === null || derivedValue === undefined) return;
    if (recordedValue !== derivedValue) {
      differences.push({ field, recorded: recordedValue, derived: derivedValue });
    }
  };

  compare('commitSha', recorded.commitSha, derived.commitSha);
  compare('tag', recorded.tag, derived.tag);
  compare('tarballDigest', recorded.tarballDigest, derived.tarballDigest);
  compare('pullRequest.number', recorded.pullRequest?.number, derived.pullRequest?.number);
  compare('pullRequest.state', recorded.pullRequest?.state, derived.pullRequest?.state);
  compare('package.integrity', recorded.package?.integrity, derived.package?.integrity);
  compare('package.version', recorded.package?.version, derived.package?.version);

  if (derived.tag && derived.commitSha && !derived.tagResolvesToCommit) {
    differences.push({
      field: 'tag->commit',
      recorded: recorded.commitSha,
      derived: `${derived.tag} does not point at the recorded merge commit`,
    });
  }
  return differences;
}
