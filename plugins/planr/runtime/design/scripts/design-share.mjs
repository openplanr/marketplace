import {
  assertDesignReviewBundle,
  assertDesignReviewMetadata,
  atomicJson,
  bundleDesignRevision,
  currentDesign,
  hash,
  readJson
} from "./design-escape.mjs";
import {
  copyUploadSpool,
  createChunkedWorkspaceClient,
  ensurePrivateDirectory,
  persistUploadSpool,
  readCustody,
  spoolChunkReader,
  writeCustody
} from "./design-pako-esm.mjs";
import {
  acquireStartLock,
  configuredPlanrHome,
  planrHome
} from "./design-planr-home.mjs";
import {
  ARTIFACT_ERROR_CODES,
  PipelineError,
  canonicalSerialize,
  digestArtifactEnvelope,
  validateArtifactEnvelope,
  validateArtifactReview
} from "./design-artifact-sources.mjs";
import {
  DESIGN_WORKSPACE_API,
  DESIGN_WORKSPACE_CREATE_SCHEMA,
  DESIGN_WORKSPACE_EVENT_SCHEMA,
  DESIGN_WORKSPACE_MAX_BYTES,
  DESIGN_WORKSPACE_MAX_EVENT_BYTES,
  DESIGN_WORKSPACE_REVISION_SCHEMA,
  DESIGN_WORKSPACE_SCHEMA,
  DESIGN_WORKSPACE_VERSION,
  assertWorkspaceContract,
  canonicalizeJson,
  deepFreeze,
  sha256Hex
} from "./design-bounded-json-data.mjs";

// packages/design/lib/design/share.mjs
import {
  closeSync,
  existsSync as existsSync4,
  fsyncSync,
  linkSync,
  mkdirSync as mkdirSync3,
  openSync,
  unlinkSync,
  writeFileSync as writeFileSync3
} from "node:fs";
import { basename, dirname as dirname4, join as join3, resolve as resolve3 } from "node:path";

// packages/artifact/lib/artifact/import.mjs
import {
  existsSync as existsSync2,
  lstatSync as lstatSync2,
  mkdirSync as mkdirSync2,
  readFileSync as readFileSync2,
  realpathSync,
  renameSync as renameSync2,
  rmSync as rmSync2,
  statSync as statSync2,
  writeFileSync as writeFileSync2
} from "node:fs";
import { homedir } from "node:os";
import { dirname as dirname2, isAbsolute, join, relative, resolve } from "node:path";

// packages/artifact/lib/artifact/internal/feedback.mjs
var FEEDBACK_FILE = "feedback.json";

// packages/artifact/lib/artifact/merge.mjs
var ARTIFACT_REVIEW_STATE_VERSION = "1.0.0";
var ARTIFACT_REVIEW_STATE_KIND = "artifact-review-state";
var SHA256_RE = /^[a-f0-9]{64}$/;
var ARTIFACT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
function conflict(message, details = void 0) {
  throw new PipelineError(
    ARTIFACT_ERROR_CODES.MERGE_CONFLICT,
    message,
    "Keep both reviews under different stable IDs or resolve the conflicting item explicitly.",
    details
  );
}
function assertUniqueReviewItemIds(review) {
  const pinIds = /* @__PURE__ */ new Set();
  for (const pin of review.pins ?? []) {
    if (pinIds.has(pin.id)) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.REVIEW_INVALID,
        "Artifact review contains a duplicate pin ID."
      );
    }
    pinIds.add(pin.id);
    const replyIds = /* @__PURE__ */ new Set();
    for (const reply of pin.replies ?? []) {
      if (replyIds.has(reply.id)) {
        throw new PipelineError(
          ARTIFACT_ERROR_CODES.REVIEW_INVALID,
          "Artifact review contains a duplicate reply ID in one thread."
        );
      }
      replyIds.add(reply.id);
    }
  }
  return review;
}
function clone(value) {
  return structuredClone(value);
}
function same(a, b) {
  return canonicalSerialize(a) === canonicalSerialize(b);
}
function timeValue(value) {
  if (typeof value !== "string") return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}
function compareStable(a, b, idKey) {
  const aTime = a.createdAt ?? a.updatedAt ?? "";
  const bTime = b.createdAt ?? b.updatedAt ?? "";
  return aTime.localeCompare(bTime) || String(a[idKey]).localeCompare(String(b[idKey]));
}
function replyMap(replies) {
  const map = /* @__PURE__ */ new Map();
  for (const reply of replies ?? []) {
    const previous = map.get(reply.id);
    if (previous && !same(previous, reply)) {
      conflict("A reply ID refers to different immutable reply content.", { entity: "reply" });
    }
    map.set(reply.id, clone(reply));
  }
  return map;
}
function mergeReplies(stored = [], incoming = []) {
  const merged = replyMap(stored);
  for (const reply of incoming) {
    const previous = merged.get(reply.id);
    if (previous && !same(previous, reply)) {
      conflict("A reply ID refers to different immutable reply content.", { entity: "reply" });
    }
    if (!previous) merged.set(reply.id, clone(reply));
  }
  return [...merged.values()].sort((a, b) => compareStable(a, b, "id"));
}
var immutablePin = (pin) => ({
  id: pin.id,
  author: pin.author,
  artifactId: pin.artifactId,
  ...pin.variant === void 0 ? {} : { variant: pin.variant },
  region: pin.region,
  viewport: pin.viewport,
  ...pin.anchor === void 0 ? {} : { anchor: pin.anchor },
  createdAt: pin.createdAt
});
var mutablePin = (pin) => ({
  intent: pin.intent,
  status: pin.status,
  comment: pin.comment
});
function mergePin(stored, incoming) {
  if (!same(immutablePin(stored), immutablePin(incoming))) {
    conflict("A pin ID refers to different immutable geometry, author, or artifact content.", {
      entity: "pin"
    });
  }
  const replies = mergeReplies(stored.replies, incoming.replies);
  const storedTime = timeValue(stored.updatedAt);
  const incomingTime = timeValue(incoming.updatedAt);
  let selected = stored;
  if (incomingTime > storedTime) selected = incoming;
  if (incomingTime === storedTime && !same(mutablePin(stored), mutablePin(incoming))) {
    conflict("A pin has divergent mutable content at the same update time.", { entity: "pin" });
  }
  return { ...clone(selected), replies };
}
function mergePins(stored = [], incoming = []) {
  const merged = /* @__PURE__ */ new Map();
  for (const pin of stored) merged.set(pin.id, clone(pin));
  for (const pin of incoming) {
    const previous = merged.get(pin.id);
    merged.set(pin.id, previous ? mergePin(previous, pin) : clone(pin));
  }
  return [...merged.values()].sort((a, b) => compareStable(a, b, "id"));
}
var immutableReview = (review) => ({
  schemaVersion: review.schemaVersion,
  reviewId: review.reviewId,
  reviewOf: review.reviewOf,
  ...review.createdAt === void 0 ? {} : { createdAt: review.createdAt }
});
var mutableReview = (review) => ({ decision: review.decision, overall: review.overall });
function mergeArtifactReviews(stored, incoming) {
  validateArtifactReview(stored);
  validateArtifactReview(incoming);
  assertUniqueReviewItemIds(stored);
  assertUniqueReviewItemIds(incoming);
  if (stored.reviewId !== incoming.reviewId) {
    conflict("Only reviews with the same review ID can be revision-merged.", {
      entity: "review"
    });
  }
  if (same(stored, incoming)) return stored;
  if (!same(immutableReview(stored), immutableReview(incoming))) {
    conflict("A review ID refers to a different digest or creation identity.", {
      entity: "review"
    });
  }
  const storedTime = timeValue(stored.updatedAt);
  const incomingTime = timeValue(incoming.updatedAt);
  let selected = stored;
  if (incomingTime > storedTime) selected = incoming;
  if (incomingTime === storedTime && !same(mutableReview(stored), mutableReview(incoming))) {
    conflict("A review has divergent verdict or overall feedback at the same update time.", {
      entity: "review"
    });
  }
  const merged = {
    ...clone(selected),
    pins: mergePins(stored.pins, incoming.pins)
  };
  validateArtifactReview(merged);
  return merged;
}
function validateReviewLedger(ledger) {
  if (!ledger || typeof ledger !== "object" || Array.isArray(ledger) || ledger.schemaVersion !== ARTIFACT_REVIEW_STATE_VERSION || ledger.kind !== ARTIFACT_REVIEW_STATE_KIND || !ARTIFACT_ID_RE.test(ledger.artifactId ?? "") || !SHA256_RE.test(ledger.currentReviewOf ?? "") || !Array.isArray(ledger.reviews)) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_INVALID,
      "Artifact review state is not a valid versioned review ledger."
    );
  }
  const ids = /* @__PURE__ */ new Set();
  for (const entry of ledger.reviews) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.stale !== "boolean" || !entry.review) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.REVIEW_INVALID,
        "Artifact review ledger entry is invalid."
      );
    }
    validateArtifactReview(entry.review);
    assertUniqueReviewItemIds(entry.review);
    if (ids.has(entry.review.reviewId)) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.REVIEW_INVALID,
        "Artifact review ledger IDs must be unique."
      );
    }
    ids.add(entry.review.reviewId);
  }
  return ledger;
}
function createReviewLedger({ artifactId, currentReviewOf, reviews = [] } = {}) {
  const ledger = {
    schemaVersion: ARTIFACT_REVIEW_STATE_VERSION,
    kind: ARTIFACT_REVIEW_STATE_KIND,
    artifactId,
    currentReviewOf,
    reviews: reviews.map((entry) => ({ review: clone(entry.review), stale: Boolean(entry.stale) }))
  };
  ledger.reviews.sort((a, b) => compareStable(a.review, b.review, "reviewId"));
  return validateReviewLedger(ledger);
}
function mergeReviewLedger(ledger, incoming, { stale = false } = {}) {
  validateReviewLedger(ledger);
  const reviews = Array.isArray(incoming) ? incoming : [incoming];
  const byId = new Map(
    ledger.reviews.map((entry) => [
      entry.review.reviewId,
      {
        review: clone(entry.review),
        stale: entry.stale
      }
    ])
  );
  for (const review of reviews) {
    validateArtifactReview(review);
    const previous = byId.get(review.reviewId);
    if (previous) {
      byId.set(review.reviewId, {
        review: mergeArtifactReviews(previous.review, review),
        stale: previous.stale || Boolean(stale)
      });
    } else {
      byId.set(review.reviewId, { review: clone(review), stale: Boolean(stale) });
    }
  }
  const merged = createReviewLedger({
    artifactId: ledger.artifactId,
    currentReviewOf: ledger.currentReviewOf,
    reviews: [...byId.values()]
  });
  return same(ledger, merged) ? ledger : merged;
}
function effectiveReviewDecision(value) {
  const entries = Array.isArray(value) ? value : value?.reviews ?? [];
  const decisions = entries.map((entry) => entry.review?.decision ?? entry.decision);
  if (decisions.includes("changes_requested")) return "changes_requested";
  if (decisions.includes("pending")) return "pending";
  return decisions.length > 0 && decisions.every((decision) => decision === "approved") ? "approved" : "pending";
}

// packages/artifact/lib/artifact/review.mjs
import { randomBytes, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
var ARTIFACT_REVIEW_MAX_STATE_BYTES = 5 * 1024 * 1024;
var reviewPathQueues = /* @__PURE__ */ new Map();
function finalEntry(path, fs = { lstatSync }) {
  try {
    return fs.lstatSync(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}
function clone2(value) {
  return structuredClone(value);
}
function canonicalObject(value) {
  if (Array.isArray(value)) return value.map(canonicalObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalObject(value[key])])
  );
}
function stableItemSort(a, b) {
  return String(a.createdAt ?? a.updatedAt ?? "").localeCompare(
    String(b.createdAt ?? b.updatedAt ?? "")
  ) || String(a.id ?? a.reviewId).localeCompare(String(b.id ?? b.reviewId));
}
function normalizeArtifactReview(review) {
  let normalized;
  try {
    normalized = clone2(review);
  } catch {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_INVALID,
      "Artifact review is not cloneable."
    );
  }
  try {
    validateArtifactReview(normalized);
    assertUniqueReviewItemIds(normalized);
  } catch (error) {
    if (error instanceof PipelineError) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.REVIEW_INVALID,
        "Artifact review does not satisfy the Protocol v1.1 review contract.",
        "",
        { issues: error.details?.issues ?? [] }
      );
    }
    throw error;
  }
  normalized.pins = normalized.pins.map((pin) => ({
    ...pin,
    replies: [...pin.replies].sort(stableItemSort)
  })).sort(stableItemSort);
  validateArtifactReview(normalized);
  return normalized;
}
function serializeReviewState(value) {
  const normalized = value?.kind === "artifact-review-state" ? validateReviewLedger(clone2(value)) : normalizeArtifactReview(value);
  return `${JSON.stringify(canonicalObject(normalized), null, 2)}
`;
}
function readArtifactReviewState(path, { allowMissing = false } = {}) {
  const entry = finalEntry(path);
  if (!entry) {
    if (allowMissing) return null;
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_IMPORT,
      "Artifact review state does not exist."
    );
  }
  try {
    if (entry.isSymbolicLink() || !entry.isFile()) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.SYMLINK_ESCAPE,
        "Artifact review state destination is not a regular file."
      );
    }
    if (statSync(path).size > ARTIFACT_REVIEW_MAX_STATE_BYTES) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.REQUEST_LIMIT,
        `Artifact review state exceeds ${ARTIFACT_REVIEW_MAX_STATE_BYTES} bytes.`
      );
    }
    return validateReviewLedger(JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    if (error instanceof PipelineError) throw error;
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_INVALID,
      "Artifact review state is malformed."
    );
  }
}
function writeArtifactReviewState(path, ledger, { fileSystem = {}, suffix = `${process.pid}.${randomBytes(8).toString("hex")}` } = {}) {
  validateReviewLedger(ledger);
  const fs = { existsSync, lstatSync, mkdirSync, writeFileSync, renameSync, rmSync, ...fileSystem };
  const temporary = `${path}.${suffix}.tmp`;
  const serialized = serializeReviewState(ledger);
  if (Buffer.byteLength(serialized, "utf8") > ARTIFACT_REVIEW_MAX_STATE_BYTES) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REQUEST_LIMIT,
      `Artifact review state exceeds ${ARTIFACT_REVIEW_MAX_STATE_BYTES} bytes.`
    );
  }
  try {
    const initial = finalEntry(path, fs);
    if (initial) {
      const target = initial;
      if (target.isSymbolicLink() || !target.isFile()) throw new Error("unsafe final target");
    }
    fs.mkdirSync(dirname(path), { recursive: true, mode: 448 });
    fs.writeFileSync(temporary, serialized, { mode: 384, flag: "wx" });
    const final = finalEntry(path, fs);
    if (final) {
      const target = final;
      if (target.isSymbolicLink() || !target.isFile()) throw new Error("unsafe final target");
    }
    fs.renameSync(temporary, path);
  } catch {
    try {
      fs.rmSync(temporary, { force: true });
    } catch {
    }
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_WRITE,
      "Artifact review state could not be written atomically.",
      "Check destination permissions and retry; the previous review state was left unchanged."
    );
  }
  return ledger;
}
function withArtifactReviewLock(path, action) {
  const previous = reviewPathQueues.get(path) ?? Promise.resolve();
  const run = async () => {
    let release;
    try {
      release = await acquireStartLock(`${path}.lock`, { timeout: 15e3, stale: 3e4 });
      return await action();
    } catch (error) {
      if (error instanceof PipelineError) throw error;
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.REVIEW_WRITE,
        "Artifact review state is busy or its cross-process lock is unavailable.",
        "Wait for the active review write to finish, then retry."
      );
    } finally {
      release?.();
    }
  };
  const operation = previous.then(run, run);
  const tail = operation.then(
    () => void 0,
    () => void 0
  );
  reviewPathQueues.set(path, tail);
  tail.finally(() => {
    if (reviewPathQueues.get(path) === tail) reviewPathQueues.delete(path);
  });
  return operation;
}
function normalizedExportInput(value) {
  if (value?.kind === "artifact-review-state") return validateReviewLedger(clone2(value));
  if (value?.review && value?.artifacts) return normalizeArtifactReview(value.review);
  return normalizeArtifactReview(value);
}
function markdownText(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n").trim();
}
function renderPinMarkdown(pin, number) {
  const region = `${pin.region.x}, ${pin.region.y}, ${pin.region.w}, ${pin.region.h}`;
  const lines = [
    `### ${number}. ${pin.intent.toUpperCase()} \xB7 ${pin.status}`,
    "",
    `- Pin: \`${pin.id}\``,
    `- Artifact: \`${pin.artifactId}\`${pin.variant ? ` \xB7 variant \`${pin.variant}\`` : ""}`,
    `- Author: ${pin.author.name}`,
    `- Region: \`${region}\` at ${pin.viewport.width}\xD7${pin.viewport.height}`,
    ...pin.anchor ? [
      `- Anchor: \`${pin.anchor.planrId}\`${pin.anchor.screen ? ` \xB7 screen \`${pin.anchor.screen}\`` : ""}`
    ] : [],
    `- Updated: ${pin.updatedAt}`,
    "",
    markdownText(pin.comment)
  ];
  if (pin.replies.length > 0) {
    lines.push("", "#### Thread", "");
    for (const reply of pin.replies) {
      lines.push(`- **${reply.author.name}** (${reply.createdAt}): ${markdownText(reply.comment)}`);
    }
  }
  return lines.join("\n");
}
function reviewMarkdown(review, headingLevel = 2, stale = false) {
  const mark = "#".repeat(headingLevel);
  const lines = [
    `${mark} Review ${review.reviewId}${stale ? " \xB7 STALE" : ""}`,
    "",
    `- Digest: \`${review.reviewOf}\``,
    `- Decision: **${review.decision}**`,
    `- Pins: ${review.pins.length}`,
    ...review.createdAt ? [`- Created: ${review.createdAt}`] : [],
    ...review.updatedAt ? [`- Updated: ${review.updatedAt}`] : [],
    "",
    `${mark}# Overall feedback`,
    "",
    markdownText(review.overall) || "_No overall feedback._"
  ];
  if (review.pins.length > 0) {
    lines.push("", `${mark}# Pins`, "");
    review.pins.forEach((pin, index) => lines.push(renderPinMarkdown(pin, index + 1), ""));
    if (lines.at(-1) === "") lines.pop();
  }
  return lines.join("\n");
}
function exportArtifactReview(value, { format = "json" } = {}) {
  let normalized;
  try {
    normalized = normalizedExportInput(value);
  } catch (error) {
    if (error instanceof PipelineError) throw error;
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_EXPORT,
      "Artifact review cannot be exported."
    );
  }
  if (format === "json") return serializeReviewState(normalized);
  if (format !== "markdown") {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_EXPORT,
      "Artifact review export format must be json or markdown."
    );
  }
  if (normalized.kind !== "artifact-review-state") {
    return `# OpenPlanr Artifact Review

${reviewMarkdown(normalized)}
`;
  }
  const lines = [
    "# OpenPlanr Artifact Reviews",
    "",
    `- Artifact: \`${normalized.artifactId}\``,
    `- Current digest: \`${normalized.currentReviewOf}\``,
    `- Effective decision: **${effectiveReviewDecision(normalized)}**`,
    `- Reviews: ${normalized.reviews.length}`
  ];
  for (const entry of normalized.reviews) {
    lines.push("", reviewMarkdown(entry.review, 2, entry.stale));
  }
  return `${lines.join("\n")}
`;
}

// packages/artifact/lib/artifact/import.mjs
var ARTIFACT_ID_RE2 = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
function pathError(code, message) {
  throw new PipelineError(
    code,
    message,
    "Choose a real, non-symlinked project or user review destination."
  );
}
function pathEntry(path, fs = { lstatSync: lstatSync2 }) {
  try {
    return fs.lstatSync(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}
function inside(base, candidate) {
  const rel = relative(base, candidate);
  return rel === "" || !rel.startsWith("..") && !isAbsolute(rel);
}
function parseablePlanrConfig(root) {
  const path = join(root, ".planr", "config.json");
  if (!existsSync2(path)) return false;
  try {
    if (lstatSync2(path).isSymbolicLink()) return false;
    const value = JSON.parse(readFileSync2(path, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value) && (typeof value.projectName === "string" && value.projectName.trim() !== "" || value.idPrefix && typeof value.idPrefix === "object" && !Array.isArray(value.idPrefix) && Object.keys(value.idPrefix).length > 0);
  } catch {
    return false;
  }
}
function hasGitMarker(root) {
  const marker = join(root, ".git");
  if (!existsSync2(marker)) return false;
  try {
    const stat = lstatSync2(marker);
    if (stat.isSymbolicLink()) return false;
    if (stat.isDirectory()) {
      const head = join(marker, "HEAD");
      return existsSync2(head) && lstatSync2(head).isFile();
    }
    if (!stat.isFile() || stat.size > 4096) return false;
    const match = /^gitdir:\s*(.+?)\s*$/u.exec(readFileSync2(marker, "utf8"));
    if (!match) return false;
    const gitDir = resolve(root, match[1]);
    return existsSync2(gitDir) && statSync2(gitDir).isDirectory() && existsSync2(join(gitDir, "HEAD")) && lstatSync2(join(gitDir, "HEAD")).isFile();
  } catch {
    return false;
  }
}
function findArtifactProjectRoot(start = process.cwd(), { env = process.env } = {}) {
  let current;
  try {
    current = realpathSync(resolve(start));
  } catch {
    pathError(
      ARTIFACT_ERROR_CODES.REVIEW_IMPORT,
      "Artifact review working directory does not exist."
    );
  }
  const homeCandidate = resolve(env.HOME ?? homedir());
  let home = homeCandidate;
  try {
    home = realpathSync(homeCandidate);
  } catch {
  }
  while (true) {
    if (current !== home && (parseablePlanrConfig(current) || hasGitMarker(current)))
      return current;
    const parent = dirname2(current);
    if (parent === current) return null;
    current = parent;
  }
}
function assertSafeDestination(base, relativeParts) {
  const absoluteBase = resolve(base);
  if (existsSync2(absoluteBase) && lstatSync2(absoluteBase).isSymbolicLink()) {
    pathError(
      ARTIFACT_ERROR_CODES.SYMLINK_ESCAPE,
      "Artifact review destination base is a symlink."
    );
  }
  let realBase = absoluteBase;
  if (existsSync2(absoluteBase)) realBase = realpathSync(absoluteBase);
  let current = absoluteBase;
  for (const part of relativeParts) {
    if (!part || part === "." || part === ".." || part.includes("/") || part.includes("\\") || part.includes("\0")) {
      pathError(
        ARTIFACT_ERROR_CODES.PATH_TRAVERSAL,
        "Artifact review destination contains an unsafe segment."
      );
    }
    current = join(current, part);
    const entry = pathEntry(current);
    if (!entry) continue;
    if (entry.isSymbolicLink()) {
      pathError(
        ARTIFACT_ERROR_CODES.SYMLINK_ESCAPE,
        "Artifact review destination contains a symlink."
      );
    }
    if (!inside(realBase, realpathSync(current))) {
      pathError(
        ARTIFACT_ERROR_CODES.PATH_TRAVERSAL,
        "Artifact review destination escapes its storage root."
      );
    }
  }
  if (!inside(absoluteBase, current)) {
    pathError(
      ARTIFACT_ERROR_CODES.PATH_TRAVERSAL,
      "Artifact review destination escapes its storage root."
    );
  }
  return current;
}
function resolveArtifactReviewDestination({
  cwd = process.cwd(),
  env = process.env,
  artifactId,
  designDir
} = {}) {
  if (!ARTIFACT_ID_RE2.test(artifactId ?? "")) {
    pathError(
      ARTIFACT_ERROR_CODES.PATH_TRAVERSAL,
      "Artifact review ID is unsafe for local storage."
    );
  }
  if (designDir !== void 0) {
    const lexical = resolve(designDir);
    if (!existsSync2(lexical) || !statSync2(lexical).isDirectory()) {
      pathError(ARTIFACT_ERROR_CODES.REVIEW_IMPORT, "Design review destination does not exist.");
    }
    if (lstatSync2(lexical).isSymbolicLink()) {
      pathError(
        ARTIFACT_ERROR_CODES.SYMLINK_ESCAPE,
        "Design review destination must be a real directory."
      );
    }
    const requested = realpathSync(lexical);
    return Object.freeze({
      kind: "design",
      artifactId,
      directory: requested,
      path: join(requested, FEEDBACK_FILE),
      reviewStatePath: join(requested, "artifact-review-state.json")
    });
  }
  const projectRoot = findArtifactProjectRoot(cwd, { env });
  if (projectRoot) {
    const directory2 = assertSafeDestination(projectRoot, [".planr", "artifacts", artifactId]);
    return Object.freeze({
      kind: "project",
      artifactId,
      root: projectRoot,
      directory: directory2,
      path: join(directory2, "review-state.json")
    });
  }
  const root = resolve(planrHome(env));
  const directory = assertSafeDestination(root, ["artifacts", artifactId]);
  return Object.freeze({
    kind: "user",
    artifactId,
    root,
    directory,
    path: join(directory, "review-state.json")
  });
}
function reviewsFromDecoded(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_IMPORT,
      "Decoded review payload is not an object."
    );
  }
  if (value.kind === "artifact-review-state") {
    validateReviewLedger(value);
    return value.reviews.map((entry) => ({ review: entry.review, stale: entry.stale }));
  }
  if (value.artifacts && value.viewer) {
    validateArtifactEnvelope(value);
    if (!value.review) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.REVIEW_IMPORT,
        "Decoded artifact envelope contains no review."
      );
    }
    return [{ review: value.review, stale: false }];
  }
  if (value.review && !value.reviewId) return reviewsFromDecoded(value.review);
  validateArtifactReview(value);
  return [{ review: value, stale: false }];
}
async function decodeArtifactReviewSources(sources, { decodeSource, withMetadata = false } = {}) {
  const list = Array.isArray(sources) ? sources : [sources];
  if (list.length === 0) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_IMPORT,
      "At least one artifact review source is required."
    );
  }
  const entries = [];
  for (let index = 0; index < list.length; index += 1) {
    const source = list[index];
    let decoded = source;
    if (typeof source === "string") {
      if (typeof decodeSource !== "function") {
        throw new PipelineError(
          ARTIFACT_ERROR_CODES.REVIEW_DECODER_REQUIRED,
          "String and URL review sources require an injected async decoder.",
          "Provide decodeSource(source, { index }); the review lifecycle has no transport dependency.",
          { sourceIndex: index }
        );
      }
      try {
        decoded = await decodeSource(source, { index });
      } catch {
        throw new PipelineError(
          ARTIFACT_ERROR_CODES.REVIEW_IMPORT,
          "Artifact review source could not be decoded.",
          "Verify the immutable review link and retry.",
          { sourceIndex: index }
        );
      }
    }
    try {
      entries.push(
        ...reviewsFromDecoded(decoded).map((entry) => ({
          review: structuredClone(entry.review),
          stale: Boolean(entry.stale)
        }))
      );
    } catch (error) {
      if (error instanceof PipelineError && error.code === ARTIFACT_ERROR_CODES.REVIEW_IMPORT) {
        error.details = { sourceIndex: index };
        throw error;
      }
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.REVIEW_IMPORT,
        "Decoded artifact review does not satisfy the Protocol v1.1 contract.",
        "",
        { sourceIndex: index }
      );
    }
  }
  return withMetadata ? entries : entries.map((entry) => entry.review);
}

// packages/design/lib/design/share-status.mjs
import { existsSync as existsSync3, realpathSync as realpathSync2 } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { dirname as dirname3, isAbsolute as isAbsolute2, join as join2, relative as relative2, resolve as resolve2 } from "node:path";

// packages/artifact/lib/artifact/internal/workspace-address.mjs
function createWorkspaceAddress({
  label,
  reviewPath,
  defaultBaseUrl = "https://share.openplanr.dev"
}) {
  function normalizeWorkspaceBase2(baseUrl = defaultBaseUrl) {
    const url = new URL(baseUrl);
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/" || url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
      throw new TypeError(
        `${label} sharing requires an HTTPS origin or a local development server.`
      );
    return url.origin;
  }
  function workspaceReviewUrl2(access) {
    if (!/^[A-Za-z0-9_-]{22,64}$/.test(access.id))
      throw new TypeError(`Invalid ${label.toLowerCase()} workspace identity.`);
    return `${normalizeWorkspaceBase2(access.baseUrl)}${reviewPath}/${access.id}`;
  }
  return { normalizeWorkspaceBase: normalizeWorkspaceBase2, workspaceReviewUrl: workspaceReviewUrl2 };
}

// packages/design/lib/design/workspace-address.mjs
var DESIGN_SHARE_BASE_URL = "https://share.openplanr.dev";
var DESIGN_SHARE_REVIEW_PATH = "/d";
var address = createWorkspaceAddress({
  label: "Design",
  reviewPath: DESIGN_SHARE_REVIEW_PATH,
  defaultBaseUrl: DESIGN_SHARE_BASE_URL
});
var normalizeWorkspaceBase = address.normalizeWorkspaceBase;
var workspaceReviewUrl = (access) => `${address.workspaceReviewUrl(access)}${access.schemaVersion === "2.0.0" ? "?v=2" : ""}`;

// packages/design/lib/design/share-status.mjs
var FORMAT = "openplanr-design-owner-custody";
function custodyLocation(file, options = {}, { allowMissing = false } = {}) {
  const current = currentDesign(file, options);
  const env = options.env ?? process.env;
  const root = resolve2(options.custodyRoot ?? join2(planrHome(env), "design-shares"));
  let project = current.root;
  for (let candidate = current.root; dirname3(candidate) !== candidate; candidate = dirname3(candidate)) {
    if (existsSync3(join2(candidate, ".git")) || existsSync3(join2(candidate, ".planr"))) {
      project = candidate;
      break;
    }
  }
  const key = hash(`${current.root}
${current.document.id}`);
  const path = join2(root, `${key}.json`);
  const within = relative2(project, root);
  if ((!allowMissing || existsSync3(path)) && (within === "" || !within.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && within !== ".." && !isAbsolute2(within)))
    throw new Error(
      "Design owner credentials must be stored outside the project. Set PLANR_HOME to a private user-level directory."
    );
  const legacyPath = !options.custodyRoot && !configuredPlanrHome(env) ? join2(realpathSync2(env.HOME || homedir2()), ".openplanr", "design-shares", `${key}.json`) : null;
  return { root, path, current, legacyPath };
}
function presentationFingerprint(current) {
  const state = readJson(join2(current.root, ".design/studio-state.json"), { state: {} }).state;
  return hash(
    JSON.stringify({
      revision: current.revision,
      selectedVariant: state.selectedVariant ?? current.document.selectedVariant,
      positions: state.positions ?? {},
      verification: current.verification.status
    })
  );
}
var safeStatus = (record, current) => ({
  ok: true,
  shared: Boolean(record),
  title: current.document.title,
  localRevision: current.revision,
  retention: "until-revoked",
  ...record ? {
    id: record.custody.id,
    url: workspaceReviewUrl(record.custody),
    revision: record.custody.currentRevision ?? record.publishedRevision ?? null,
    publishedRevision: record.publishedRevision ?? null,
    hasUpdate: record.publishedRevision !== current.revision || record.publishedPresentation !== presentationFingerprint(current),
    epoch: record.custody.epoch,
    commentsPaused: Boolean(record.custody.commentsPaused ?? record.commentsPaused),
    revoked: Boolean(record.revoked),
    deleted: Boolean(record.deleted),
    pending: Boolean(
      record.custody.pendingCreate || record.custody.pendingMutation || record.pendingReviewMetadata?.length
    ),
    pendingAction: record.custody.pendingCreate ? "create" : record.custody.pendingMutation?.action ?? (record.pendingReviewMetadata?.length ? "review-metadata" : null),
    pendingReviewMetadata: Boolean(record.pendingReviewMetadata?.length)
  } : {}
});
function getDesignShareStatus(file, options = {}) {
  const { path, current, legacyPath } = custodyLocation(file, options);
  const record = readCustody(path, { label: "Design", format: FORMAT }) ?? (legacyPath ? readCustody(legacyPath, { label: "Design", format: FORMAT }) : null);
  return safeStatus(record, current);
}

// packages/artifact/lib/artifact/encrypted-workspace-client.mjs
function createEncryptedWorkspaceClient({
  domain,
  apiPath,
  reviewPath,
  label,
  compatibilityMessage,
  compatibilityCode = "E_WORKSPACE_UNSUPPORTED",
  defaultBaseUrl = "https://share.openplanr.dev",
  version = "1.0.0",
  maxBytes = 5 * 1024 * 1024,
  maxEventBytes = 256 * 1024,
  schemas,
  assertContract,
  assertBundle,
  assertFeedback,
  bundleDigest,
  digestInput = (bundle) => bundle,
  packBundle = async (bundle) => bundle,
  unpackBundle = async (bundle) => bundle
}) {
  if (!domain || !apiPath?.startsWith("/") || !reviewPath?.startsWith("/") || !label)
    throw new TypeError("An encrypted workspace requires an explicit domain and routes.");
  const encoder2 = new TextEncoder();
  const decoder2 = new TextDecoder("utf-8", { fatal: true });
  const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
  const idPattern = /^[A-Za-z0-9_-]{22,64}$/;
  const ec = { name: "ECDSA", namedCurve: "P-256" };
  const signatureAlgorithm = { name: "ECDSA", hash: "SHA-256" };
  const omitSignature = ({ signature: _signature, ...value }) => value;
  const operationError = (message, code, status) => Object.assign(new Error(message), { code, ...status ? { status } : {} });
  function encodeWorkspaceBytes2(bytes) {
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 8192)
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
  }
  function decodeWorkspaceBytes2(value) {
    if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/u.test(value))
      throw new TypeError("Invalid encoded workspace value.");
    const decoded = Uint8Array.from(
      atob(value.replaceAll("-", "+").replaceAll("_", "/")),
      (char) => char.charCodeAt(0)
    );
    if (encodeWorkspaceBytes2(decoded) !== value)
      throw new TypeError("Noncanonical encoded workspace value.");
    return decoded;
  }
  function newWorkspaceToken2() {
    return encodeWorkspaceBytes2(crypto.getRandomValues(new Uint8Array(32)));
  }
  function newWorkspaceId2() {
    return encodeWorkspaceBytes2(crypto.getRandomValues(new Uint8Array(18)));
  }
  const { normalizeWorkspaceBase: normalizeWorkspaceBase2, workspaceReviewUrl: workspaceReviewUrl2 } = createWorkspaceAddress({
    label,
    reviewPath,
    defaultBaseUrl
  });
  async function tokenMaterial(token, id, purpose) {
    if (!tokenPattern.test(token) || decodeWorkspaceBytes2(token).length !== 32 || !idPattern.test(id))
      throw new TypeError("Enter the complete generated access token.");
    const key = await crypto.subtle.importKey("raw", decodeWorkspaceBytes2(token), "HKDF", false, [
      "deriveBits"
    ]);
    return new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "HKDF",
          hash: "SHA-256",
          salt: encoder2.encode(id),
          info: encoder2.encode(`${domain}/${purpose}`)
        },
        key,
        256
      )
    );
  }
  async function deriveWorkspaceAuthentication2(token, id) {
    return encodeWorkspaceBytes2(await tokenMaterial(token, id, "reviewer-auth"));
  }
  function canonicalWorkspacePublicKey2(value) {
    if (value?.kty !== "EC" || value.crv !== "P-256" || !tokenPattern.test(value.x ?? "") || !tokenPattern.test(value.y ?? "") || "d" in value) {
      throw new TypeError(`Invalid ${label.toLowerCase()} workspace public key.`);
    }
    return { kty: "EC", crv: "P-256", x: value.x, y: value.y };
  }
  async function createWorkspaceSigner2() {
    const pair = await crypto.subtle.generateKey(ec, true, ["sign", "verify"]);
    return {
      privateKey: encodeWorkspaceBytes2(
        new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey))
      ),
      publicKey: canonicalWorkspacePublicKey2(await crypto.subtle.exportKey("jwk", pair.publicKey))
    };
  }
  async function signWorkspaceValue2(value, privateKey) {
    const key = await crypto.subtle.importKey(
      "pkcs8",
      decodeWorkspaceBytes2(privateKey),
      ec,
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      signatureAlgorithm,
      key,
      encoder2.encode(canonicalizeJson(omitSignature(value)))
    );
    return { ...omitSignature(value), signature: encodeWorkspaceBytes2(new Uint8Array(signature)) };
  }
  async function verifyWorkspaceSignature2(value, publicKey) {
    try {
      const key = await crypto.subtle.importKey("jwk", publicKey, ec, false, ["verify"]);
      return await crypto.subtle.verify(
        signatureAlgorithm,
        key,
        decodeWorkspaceBytes2(value.signature),
        encoder2.encode(canonicalizeJson(omitSignature(value)))
      );
    } catch {
      return false;
    }
  }
  async function seal(value, rawKey, context, limit = maxBytes) {
    const bytes = encoder2.encode(canonicalizeJson(value));
    if (bytes.length + 16 > limit)
      throw Object.assign(
        new RangeError(
          `Encrypted ${label.toLowerCase()} data exceeds the ${Math.floor(limit / 1024)} KB upload limit.`
        ),
        { code: "E_WORKSPACE_PAYLOAD_TOO_LARGE", status: 413 }
      );
    const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: encoder2.encode(canonicalizeJson(context)) },
      key,
      bytes
    );
    return {
      iv: encodeWorkspaceBytes2(iv),
      ciphertext: encodeWorkspaceBytes2(new Uint8Array(ciphertext))
    };
  }
  async function unseal(value, rawKey, context, limit = maxBytes) {
    const bytes = decodeWorkspaceBytes2(value.ciphertext);
    if (bytes.length > limit)
      throw new RangeError(`Shared ${label.toLowerCase()} data exceeds its size limit.`);
    const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decodeWorkspaceBytes2(value.iv),
        additionalData: encoder2.encode(canonicalizeJson(context))
      },
      key,
      bytes
    );
    return JSON.parse(decoder2.decode(plaintext));
  }
  const keyringContext = (id, epoch) => ({ type: "keyring", workspaceId: id, epoch });
  const revisionContext = (id, revision) => ({
    type: "revision",
    workspaceId: id,
    id: revision.id,
    epoch: revision.epoch,
    reviewOf: revision.reviewOf
  });
  const eventContext = (id, event) => ({
    type: "event",
    workspaceId: id,
    id: event.id,
    epoch: event.epoch,
    revisionId: event.revisionId,
    reviewOf: event.reviewOf
  });
  function workspaceEnvelopeDigest2(value) {
    return bundleDigest(value);
  }
  async function wrapKeyring(custody, token = custody.token, epoch = custody.epoch, keys = custody.keys) {
    return seal(
      { keys, ownerPublicKey: custody.ownerPublicKey },
      await tokenMaterial(token, custody.id, "key-wrap"),
      keyringContext(custody.id, epoch)
    );
  }
  async function prepareRevision(custody, bundle) {
    assertBundle(bundle);
    const header = {
      id: newWorkspaceId2(),
      epoch: custody.epoch,
      reviewOf: workspaceEnvelopeDigest2(digestInput(bundle)),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return signWorkspaceValue2(
      {
        ...header,
        ...await seal(
          await packBundle(bundle),
          decodeWorkspaceBytes2(custody.keys[custody.epoch]),
          revisionContext(custody.id, header)
        )
      },
      custody.ownerPrivateKey
    );
  }
  async function prepareWorkspace2(bundle, { baseUrl = defaultBaseUrl } = {}) {
    const signer = await createWorkspaceSigner2();
    const custody = {
      schemaVersion: version,
      id: newWorkspaceId2(),
      baseUrl: normalizeWorkspaceBase2(baseUrl),
      token: newWorkspaceToken2(),
      ownerAuth: newWorkspaceToken2(),
      ownerPrivateKey: signer.privateKey,
      ownerPublicKey: signer.publicKey,
      epoch: 1,
      keys: { 1: newWorkspaceToken2() },
      version: 0
    };
    custody.keyring = await wrapKeyring(custody);
    custody.pendingCreate = await signWorkspaceValue2(
      {
        schemaVersion: version,
        id: custody.id,
        ownerPublicKey: custody.ownerPublicKey,
        ownerAuthHash: sha256Hex(custody.ownerAuth),
        reviewerAuthHash: sha256Hex(await deriveWorkspaceAuthentication2(custody.token, custody.id)),
        epoch: 1,
        keyring: custody.keyring,
        revision: await prepareRevision(custody, bundle),
        operationId: newWorkspaceId2()
      },
      custody.ownerPrivateKey
    );
    assertContract(custody.pendingCreate, schemas.create);
    return custody;
  }
  async function request(access, suffix = "", {
    method = "GET",
    body,
    fetchImpl = globalThis.fetch,
    owner = Boolean(access.ownerAuth),
    timeoutMs = 2e4
  } = {}) {
    if (!idPattern.test(access.id))
      throw new TypeError(`Invalid ${label.toLowerCase()} workspace identity.`);
    const authorization = owner ? access.ownerAuth : await deriveWorkspaceAuthentication2(access.token, access.id);
    const headers = { Authorization: `Bearer ${authorization}`, Accept: "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    let response;
    try {
      response = await fetchImpl(
        `${normalizeWorkspaceBase2(access.baseUrl)}${apiPath}/${access.id}${suffix}`,
        {
          method,
          headers,
          body: body ? JSON.stringify(body) : void 0,
          redirect: "error",
          cache: "no-store",
          credentials: "omit",
          signal: AbortSignal.timeout(timeoutMs)
        }
      );
    } catch {
      throw operationError(
        `${label} sharing is unreachable. Check the connection and retry; the previous review is unchanged.`,
        "E_WORKSPACE_NETWORK"
      );
    }
    if (!response.ok) await throwResponseError(response, method);
    return readResponse(response);
  }
  async function throwResponseError(response, method) {
    if (response.status === 404 && method === "PUT" && compatibilityMessage) {
      const error2 = new Error(compatibilityMessage);
      error2.code = compatibilityCode;
      error2.status = 404;
      throw error2;
    }
    const messages = {
      401: "Access token is incorrect or has been rotated.",
      403: "This review is unavailable or this action requires its owner.",
      404: "This shared review could not be found.",
      409: "The shared review changed. Refresh its status before retrying.",
      410: "This shared review has been revoked or deleted.",
      413: `This ${label.toLowerCase()} exceeds the sharing upload limit.`,
      429: "Too many requests. Wait a moment and retry.",
      503: `${label} sharing is temporarily unavailable. Retry shortly.`
    };
    const error = new Error(
      messages[response.status] ?? `${label} sharing failed (${response.status}). Retry shortly.`
    );
    error.status = response.status;
    error.code = `E_WORKSPACE_HTTP_${response.status}`;
    try {
      const reader = response.body?.getReader();
      const body = reader && JSON.parse(decoder2.decode(await responseBytes(reader, 4096)));
      if (typeof body?.error === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,127}$/u.test(body.error))
        error.code = body.error;
    } catch {
    }
    if (response.status === 429) {
      const header = response.headers.get("retry-after");
      const seconds = header && /^\d+(?:\.\d+)?$/u.test(header.trim()) ? Number(header) : header ? (Date.parse(header) - Date.now()) / 1e3 : NaN;
      if (Number.isFinite(seconds) && seconds >= 0)
        error.retryAfterSeconds = Math.min(3600, Math.max(1, Math.ceil(seconds)));
    }
    throw error;
  }
  async function responseBytes(reader, limit) {
    const chunks = [];
    let length = 0;
    try {
      for (; ; ) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > limit) {
          await reader.cancel();
          throw new RangeError(`${label} service returned an oversized response.`);
        }
        chunks.push(value);
      }
    } catch (error) {
      if (error instanceof RangeError) throw error;
      throw new Error("The sharing response was interrupted. Retry the pending operation.");
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  }
  async function readResponse(response) {
    if (response.status === 204) return {};
    const reader = response.body?.getReader();
    if (!reader) throw new Error(`${label} service returned an empty response.`);
    try {
      return JSON.parse(decoder2.decode(await responseBytes(reader, maxBytes * 1.5 + 65536)));
    } catch (cause) {
      throw Object.assign(
        operationError(
          "The sharing response could not be verified. Retry the pending operation.",
          "E_WORKSPACE_RESPONSE_INVALID"
        ),
        { cause }
      );
    }
  }
  async function commitWorkspace2(custody, options = {}) {
    if (!custody.pendingCreate) return getWorkspace2(custody, options);
    const result = await request(custody, "", {
      ...options,
      method: "PUT",
      body: custody.pendingCreate
    });
    assertContract(result, schemas.workspace);
    if (result.id !== custody.id || result.version !== 1 || result.epoch !== 1 || result.currentRevision !== custody.pendingCreate.revision.id || canonicalizeJson(result.ownerPublicKey) !== canonicalizeJson(custody.ownerPublicKey) || canonicalizeJson(result.keyring) !== canonicalizeJson(custody.keyring))
      throw new Error("The sharing creation receipt is invalid. Retry the saved operation.");
    custody.version = result.version;
    custody.currentRevision = result.currentRevision;
    delete custody.pendingCreate;
    return result;
  }
  async function getWorkspace2(access, options = {}) {
    const result = assertContract(await request(access, "", options), schemas.workspace);
    if (result.id !== access.id) throw new Error("Shared review identity mismatch.");
    const ring = await unseal(
      result.keyring,
      await tokenMaterial(access.token, access.id, "key-wrap"),
      keyringContext(access.id, result.epoch)
    );
    if (canonicalizeJson(ring.ownerPublicKey) !== canonicalizeJson(result.ownerPublicKey) || access.ownerPublicKey && canonicalizeJson(access.ownerPublicKey) !== canonicalizeJson(result.ownerPublicKey))
      throw new Error("Shared review owner identity changed.");
    if (!ring.keys?.[result.epoch] || Object.entries(ring.keys).some(
      ([keyEpoch, key]) => !/^[1-9][0-9]*$/u.test(keyEpoch) || !tokenPattern.test(key)
    ))
      throw new Error("Invalid shared review key history.");
    Object.assign(access, {
      keys: ring.keys,
      ownerPublicKey: result.ownerPublicKey,
      epoch: result.epoch,
      keyring: result.keyring,
      version: result.version,
      currentRevision: result.currentRevision,
      commentsPaused: result.commentsPaused
    });
    return result;
  }
  async function listWorkspaceRevisions(access, { after = "", ...options } = {}) {
    if (after && !idPattern.test(after)) throw new TypeError("Invalid revision cursor.");
    return request(
      access,
      `/revisions${after ? `?after=${encodeURIComponent(after)}` : ""}`,
      options
    );
  }
  async function decryptWorkspaceRevision2(access, revisionId = access.currentRevision, options = {}) {
    if (!access.keys) await getWorkspace2(access, options);
    if (!idPattern.test(revisionId))
      throw new TypeError(`Invalid ${label.toLowerCase()} revision.`);
    const revision = assertContract(
      await request(access, `/revisions/${revisionId}`, options),
      schemas.revision
    );
    if (revision.id !== revisionId || !await verifyWorkspaceSignature2(revision, access.ownerPublicKey))
      throw new Error(`The published ${label.toLowerCase()} signature is invalid.`);
    if (!access.keys[revision.epoch])
      throw new Error("The access token cannot open this revision.");
    const bundle = assertBundle(
      await unpackBundle(
        await unseal(
          revision,
          decodeWorkspaceBytes2(access.keys[revision.epoch]),
          revisionContext(access.id, revision)
        )
      )
    );
    if (workspaceEnvelopeDigest2(digestInput(bundle)) !== revision.reviewOf)
      throw new Error(`Published ${label.toLowerCase()} content does not match its revision.`);
    return { ...bundle, workspaceRevision: revision.id, reviewOf: revision.reviewOf };
  }
  async function prepareWorkspaceMutation2(custody, action, payload = void 0) {
    if (custody.pendingCreate)
      throw new Error("Finish creating this shared review before changing it.");
    if (custody.pendingMutation)
      throw new Error("A sharing operation is pending. Retry it before making another change.");
    const body = {
      operationId: newWorkspaceId2(),
      expectedVersion: custody.version,
      epoch: custody.epoch
    };
    let next = {};
    if (action === "publish") body.revision = await prepareRevision(custody, payload);
    else if (action === "rotate") {
      const token = newWorkspaceToken2();
      const epoch = custody.epoch + 1;
      const keys = { ...custody.keys, [epoch]: newWorkspaceToken2() };
      const keyring = await wrapKeyring(custody, token, epoch, keys);
      Object.assign(body, {
        epoch,
        reviewerAuthHash: sha256Hex(await deriveWorkspaceAuthentication2(token, custody.id)),
        keyring
      });
      next = { token, epoch, keys, keyring };
    } else if (["pause", "resume", "revoke", "delete"].includes(action)) body.action = action;
    else throw new TypeError(`Unknown ${label.toLowerCase()} sharing operation.`);
    custody.pendingMutation = {
      action,
      body: await signWorkspaceValue2(body, custody.ownerPrivateKey),
      next
    };
    return custody.pendingMutation;
  }
  function assertDeletionReceipt(custody, result) {
    if (result.schemaVersion !== version || result.id !== custody.id || result.deleted !== true || Object.keys(result).some((key) => !["schemaVersion", "id", "deleted"].includes(key)))
      throw new Error("The deletion receipt is invalid. Retry the saved operation.");
  }
  function assertMutationReceipt(custody, pending, result) {
    if (pending.action === "delete") return assertDeletionReceipt(custody, result);
    assertContract(result, schemas.workspace);
    const expectedRevision = pending.action === "publish" ? pending.body.revision.id : custody.currentRevision;
    if (result.id !== custody.id || result.version !== pending.body.expectedVersion + 1 || result.epoch !== pending.body.epoch || result.currentRevision !== expectedRevision || canonicalizeJson(result.ownerPublicKey) !== canonicalizeJson(custody.ownerPublicKey) || canonicalizeJson(result.keyring) !== canonicalizeJson(pending.next.keyring ?? custody.keyring) || ["pause", "resume"].includes(pending.action) && result.commentsPaused !== (pending.action === "pause"))
      throw new Error("The sharing operation receipt is invalid. Retry the saved operation.");
  }
  async function commitWorkspaceMutation2(custody, options = {}) {
    const pending = custody.pendingMutation;
    if (!pending) throw new Error("No sharing operation is pending.");
    const suffix = ["publish", "rotate"].includes(pending.action) ? pending.action : "manage";
    const result = await request(custody, `/${suffix}`, {
      ...options,
      method: "POST",
      body: pending.body
    });
    assertMutationReceipt(custody, pending, result);
    Object.assign(custody, pending.next, { version: pending.body.expectedVersion + 1 });
    if (pending.action === "publish") custody.currentRevision = pending.body.revision.id;
    if (pending.action === "pause" || pending.action === "resume")
      custody.commentsPaused = pending.action === "pause";
    if (pending.action === "revoke" || pending.action === "delete")
      custody.status = pending.action === "revoke" ? "revoked" : "deleted";
    delete custody.pendingMutation;
    return result;
  }
  async function publishWorkspace(custody, bundle, options = {}) {
    await prepareWorkspaceMutation2(custody, "publish", bundle);
    return commitWorkspaceMutation2(custody, options);
  }
  async function rotateWorkspace(custody, options = {}) {
    await prepareWorkspaceMutation2(custody, "rotate");
    return commitWorkspaceMutation2(custody, options);
  }
  async function manageWorkspace(custody, action, options = {}) {
    await prepareWorkspaceMutation2(custody, action);
    return commitWorkspaceMutation2(custody, options);
  }
  async function prepareWorkspaceEvent2(access, payload, { revisionId = access.currentRevision, reviewOf = payload.reviewOf, signer } = {}) {
    if (!access.keys) throw new Error("Unlock the shared review before commenting.");
    assertFeedback(payload);
    const identity = signer ?? await createWorkspaceSigner2();
    const publicKey = canonicalWorkspacePublicKey2(identity.publicKey);
    const header = { id: newWorkspaceId2(), revisionId, reviewOf, epoch: access.epoch };
    const event = await signWorkspaceValue2(
      {
        ...header,
        ...await seal(
          payload,
          decodeWorkspaceBytes2(access.keys[access.epoch]),
          eventContext(access.id, header),
          maxEventBytes
        ),
        publicKey
      },
      identity.privateKey
    );
    return assertContract(event, schemas.event);
  }
  async function appendWorkspaceEvent2(access, payload, { preparedEvent, signer, revisionId, reviewOf, ...options } = {}) {
    const event = preparedEvent ?? await prepareWorkspaceEvent2(access, payload, {
      signer,
      revisionId,
      reviewOf: reviewOf ?? payload.reviewOf
    });
    const result = await request(access, "/events", { ...options, method: "POST", body: event });
    if (!result || typeof result !== "object" || Array.isArray(result) || !Number.isSafeInteger(result.sequence) || result.sequence < 1 || !result.event || typeof result.event !== "object" || Array.isArray(result.event))
      throw new Error("The feedback receipt is invalid. Retry the saved operation.");
    const { sequence: eventSequence, ...received } = result.event;
    if (eventSequence !== void 0 && eventSequence !== result.sequence || canonicalizeJson(received) !== canonicalizeJson(event))
      throw new Error(
        "The feedback receipt does not match the saved event. Retry the saved operation."
      );
    return { event: { ...received, sequence: result.sequence }, sequence: result.sequence };
  }
  function assertEventPage(page, after) {
    if (!Array.isArray(page.events) || page.events.length > 100 || !Number.isSafeInteger(page.cursor) || page.cursor < after || typeof page.hasMore !== "boolean")
      throw new Error("Invalid shared feedback page.");
  }
  async function decryptEvent(access, record, sequence) {
    assertContract(record, schemas.event);
    if (!await verifyWorkspaceSignature2(record, record.publicKey))
      throw new Error("Signature verification failed.");
    if (!access.keys[record.epoch]) throw new Error("The encryption epoch is unavailable.");
    const payload = await unseal(
      record,
      decodeWorkspaceBytes2(access.keys[record.epoch]),
      eventContext(access.id, record),
      maxEventBytes
    );
    assertFeedback(payload);
    if (payload.reviewOf !== record.reviewOf) throw new Error("Feedback revision is invalid.");
    return { ...record, sequence, payload };
  }
  function eventFromPage(item, pageIds, previousSequence, cursor) {
    const { sequence, ...record } = item?.event ? { ...item.event, sequence: item.sequence } : item ?? {};
    if (!Number.isSafeInteger(sequence) || sequence <= previousSequence || sequence > cursor)
      throw new Error("Invalid shared feedback sequence.");
    if (typeof record.id !== "string" || pageIds.has(record.id))
      throw new Error("Invalid shared feedback event identity.");
    pageIds.add(record.id);
    return { sequence, record };
  }
  async function readWorkspaceEvents2(access, { after = 0, ...options } = {}) {
    if (!Number.isSafeInteger(after) || after < 0) throw new TypeError("Invalid feedback cursor.");
    if (!access.keys) await getWorkspace2(access, options);
    const page = await request(access, `/events?after=${after}`, options);
    assertEventPage(page, after);
    const events = [], issues = [], pageIds = /* @__PURE__ */ new Set();
    let previousSequence = after;
    for (const item of page.events) {
      const { sequence, record } = eventFromPage(item, pageIds, previousSequence, page.cursor);
      previousSequence = sequence;
      try {
        events.push(await decryptEvent(access, record, sequence));
      } catch {
        issues.push({
          sequence,
          id: typeof record.id === "string" && idPattern.test(record.id) ? record.id : null,
          reason: "Invalid encrypted feedback; not imported."
        });
      }
    }
    return { ...page, events, issues };
  }
  return {
    encodeWorkspaceBytes: encodeWorkspaceBytes2,
    decodeWorkspaceBytes: decodeWorkspaceBytes2,
    newWorkspaceToken: newWorkspaceToken2,
    newWorkspaceId: newWorkspaceId2,
    normalizeWorkspaceBase: normalizeWorkspaceBase2,
    workspaceReviewUrl: workspaceReviewUrl2,
    deriveWorkspaceAuthentication: deriveWorkspaceAuthentication2,
    canonicalWorkspacePublicKey: canonicalWorkspacePublicKey2,
    createWorkspaceSigner: createWorkspaceSigner2,
    signWorkspaceValue: signWorkspaceValue2,
    verifyWorkspaceSignature: verifyWorkspaceSignature2,
    workspaceEnvelopeDigest: workspaceEnvelopeDigest2,
    prepareWorkspace: prepareWorkspace2,
    commitWorkspace: commitWorkspace2,
    getWorkspace: getWorkspace2,
    listWorkspaceRevisions,
    decryptWorkspaceRevision: decryptWorkspaceRevision2,
    prepareWorkspaceMutation: prepareWorkspaceMutation2,
    commitWorkspaceMutation: commitWorkspaceMutation2,
    publishWorkspace,
    rotateWorkspace,
    manageWorkspace,
    prepareWorkspaceEvent: prepareWorkspaceEvent2,
    appendWorkspaceEvent: appendWorkspaceEvent2,
    readWorkspaceEvents: readWorkspaceEvents2
  };
}

// packages/design/lib/design/workspace-client.mjs
var encoder = new TextEncoder();
var decoder = new TextDecoder("utf-8", { fatal: true });
var PACKED_BUNDLE_KIND = "openplanr-design-review-bundle-packed";
var PACKED_BUNDLE_MAX_BYTES = 128 * 1024 * 1024;
var SHARED_BLOCK_MIN_LENGTH = 2048;
var sharedBlockPattern = /(<(script|style)\b[^>]*>)([\s\S]*?)<\/\2\s*>/gi;
async function deflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function inflateRaw(bytes, limit) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const chunks = [];
  let size = 0;
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new RangeError("The shared design expands beyond its size limit.");
    }
    chunks.push(value);
  }
  const inflated = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    inflated.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return inflated;
}
async function packDesignReviewBundle(bundle) {
  if (bundle.envelope?.schemaVersion === "1.1.0")
    return {
      kind: PACKED_BUNDLE_KIND,
      version: 2,
      data: encodeWorkspaceBytes(await deflateRaw(encoder.encode(JSON.stringify(bundle))))
    };
  const pages = [];
  const pageIndex = /* @__PURE__ */ new Map();
  const blocks = [];
  const blockIndex = /* @__PURE__ */ new Map();
  const segmentsOf = (html) => {
    const segments = [];
    let offset = 0;
    for (const match of html.matchAll(sharedBlockPattern)) {
      const body = match[3];
      if (body.length < SHARED_BLOCK_MIN_LENGTH) continue;
      const start = match.index + match[1].length;
      segments.push(html.slice(offset, start));
      if (!blockIndex.has(body)) blockIndex.set(body, blocks.push(body) - 1);
      segments.push(blockIndex.get(body));
      offset = start + body.length;
    }
    segments.push(html.slice(offset));
    return segments;
  };
  const artifactPages = [];
  const artifacts = bundle.envelope.artifacts.map(({ html, ...artifact }) => {
    if (!pageIndex.has(html)) pageIndex.set(html, pages.push(segmentsOf(html)) - 1);
    artifactPages.push(pageIndex.get(html));
    return artifact;
  });
  const packed = {
    bundle: { ...bundle, envelope: { ...bundle.envelope, artifacts } },
    artifactPages,
    pages,
    blocks
  };
  return {
    kind: PACKED_BUNDLE_KIND,
    version: 1,
    data: encodeWorkspaceBytes(await deflateRaw(encoder.encode(JSON.stringify(packed))))
  };
}
async function unpackDesignReviewBundle(value, { maxBytes = PACKED_BUNDLE_MAX_BYTES } = {}) {
  if (value?.kind !== PACKED_BUNDLE_KIND) return value;
  if (![1, 2].includes(value.version) || typeof value.data !== "string")
    throw new Error("The shared design uses an unsupported packing.");
  if (value.version === 2) {
    const bundle2 = JSON.parse(
      decoder.decode(await inflateRaw(decodeWorkspaceBytes(value.data), maxBytes))
    );
    return assertDesignReviewBundle(bundle2);
  }
  const { bundle, artifactPages, pages, blocks } = JSON.parse(
    decoder.decode(await inflateRaw(decodeWorkspaceBytes(value.data), maxBytes))
  );
  const invalid2 = () => new Error("The shared design packing is invalid.");
  if (!Array.isArray(bundle?.envelope?.artifacts) || !Array.isArray(pages) || !Array.isArray(blocks) || !Array.isArray(artifactPages) || artifactPages.length !== bundle.envelope.artifacts.length)
    throw invalid2();
  let expanded = 0;
  const html = pages.map((segments) => {
    if (!Array.isArray(segments)) throw invalid2();
    const page = segments.map((segment) => {
      if (typeof segment === "string") return segment;
      if (!Number.isInteger(segment) || typeof blocks[segment] !== "string") throw invalid2();
      return blocks[segment];
    }).join("");
    expanded += page.length;
    if (expanded > maxBytes)
      throw new RangeError("The shared design expands beyond its size limit.");
    return page;
  });
  const artifacts = bundle.envelope.artifacts.map((artifact, index) => {
    const page = html[artifactPages[index]];
    if (page === void 0) throw invalid2();
    return { ...artifact, html: page };
  });
  return { ...bundle, envelope: { ...bundle.envelope, artifacts } };
}
var client = createEncryptedWorkspaceClient({
  domain: "openplanr-design-workspace/v1",
  apiPath: DESIGN_WORKSPACE_API,
  reviewPath: DESIGN_SHARE_REVIEW_PATH,
  label: "Design",
  defaultBaseUrl: DESIGN_SHARE_BASE_URL,
  version: DESIGN_WORKSPACE_VERSION,
  maxBytes: DESIGN_WORKSPACE_MAX_BYTES,
  maxEventBytes: DESIGN_WORKSPACE_MAX_EVENT_BYTES,
  schemas: {
    create: DESIGN_WORKSPACE_CREATE_SCHEMA,
    event: DESIGN_WORKSPACE_EVENT_SCHEMA,
    revision: DESIGN_WORKSPACE_REVISION_SCHEMA,
    workspace: DESIGN_WORKSPACE_SCHEMA
  },
  assertContract: assertWorkspaceContract,
  assertBundle: assertDesignReviewBundle,
  assertFeedback(payload) {
    if (["category", "disposition"].includes(payload.kind)) assertDesignReviewMetadata(payload);
    if (!["review", "direction", "category", "disposition"].includes(payload.kind))
      throw new TypeError("Unknown design feedback kind.");
    if (typeof payload.author !== "string" || !payload.author.trim() || payload.author.length > 160)
      throw new TypeError("Enter your name before leaving feedback.");
    return payload;
  },
  digestInput: (bundle) => bundle.envelope,
  bundleDigest: (envelope) => sha256Hex(
    canonicalizeJson({
      schemaVersion: envelope.schemaVersion,
      ...envelope.schemaVersion === "1.1.0" ? { sources: envelope.sources } : {},
      artifacts: envelope.artifacts,
      viewer: envelope.viewer
    })
  ),
  packBundle: packDesignReviewBundle,
  unpackBundle: unpackDesignReviewBundle
});
var {
  encodeWorkspaceBytes,
  decodeWorkspaceBytes,
  newWorkspaceToken,
  newWorkspaceId,
  deriveWorkspaceAuthentication,
  canonicalWorkspacePublicKey,
  createWorkspaceSigner,
  signWorkspaceValue,
  verifyWorkspaceSignature,
  workspaceEnvelopeDigest
} = client;
var chunked = createChunkedWorkspaceClient({
  legacy: client,
  domain: "openplanr-design-workspace/v1",
  apiPath: DESIGN_WORKSPACE_API,
  assertBundle: assertDesignReviewBundle,
  assertFeedback: (payload) => {
    if (["category", "disposition"].includes(payload.kind)) assertDesignReviewMetadata(payload);
    if (!["review", "direction", "category", "disposition"].includes(payload.kind) || typeof payload.author !== "string" || !payload.author.trim() || payload.author.length > 160)
      throw new TypeError("Invalid design feedback.");
    return payload;
  },
  digestInput: (bundle) => bundle.envelope
});
var discoverWorkspaceCapabilities = chunked.capabilities;
var prepareChunkedWorkspace = chunked.prepareWorkspace;
var openWorkspaceRevision = chunked.openRevision;
var prepareWorkspace = (bundle, options = {}) => options.transport === "2" ? chunked.prepareWorkspace(bundle, options) : client.prepareWorkspace(bundle, options);
var commitWorkspace = (access, ...args) => (access.schemaVersion === "2.0.0" ? chunked : client).commitWorkspace(access, ...args);
var getWorkspace = (access, ...args) => (access.schemaVersion === "2.0.0" ? chunked : client).getWorkspace(access, ...args);
var decryptWorkspaceRevision = (access, ...args) => (access.schemaVersion === "2.0.0" ? chunked : client).decryptWorkspaceRevision(access, ...args);
var prepareWorkspaceMutation = (access, ...args) => (access.schemaVersion === "2.0.0" ? chunked : client).prepareWorkspaceMutation(access, ...args);
var commitWorkspaceMutation = (access, ...args) => (access.schemaVersion === "2.0.0" ? chunked : client).commitWorkspaceMutation(access, ...args);
var prepareWorkspaceEvent = (access, ...args) => (access.schemaVersion === "2.0.0" ? chunked : client).prepareWorkspaceEvent(access, ...args);
var appendWorkspaceEvent = (access, ...args) => (access.schemaVersion === "2.0.0" ? chunked : client).appendWorkspaceEvent(access, ...args);
var readWorkspaceEvents = (access, ...args) => (access.schemaVersion === "2.0.0" ? chunked : client).readWorkspaceEvents(access, ...args);

// packages/artifact/lib/artifact/ui/annotations.mjs
var ARTIFACT_ANNOTATION_EVENTS = Object.freeze({
  draft: "planr:artifact-annotation-draft",
  focus: "planr:artifact-annotation-focus"
});
var ARTIFACT_ANNOTATION_LIMITS = Object.freeze({
  dragThreshold: 4,
  maxCommentLength: 65536,
  maxIdentityLength: 256
});
var INTENTS = Object.freeze(["fix", "improve", "question"]);

// packages/artifact/lib/artifact/ui/feedback-rail.mjs
var ARTIFACT_REVIEW_LIMITS = Object.freeze({
  id: 128,
  authorName: 256,
  artifactId: 128,
  variant: 128,
  anchor: 512,
  screen: 128,
  text: 65536,
  pins: 1e4,
  replies: 1e4,
  viewport: 16384
});
var ARTIFACT_REVIEW_DECISIONS = Object.freeze([
  "pending",
  "approved",
  "changes_requested"
]);
var ARTIFACT_REVIEW_INTENTS = Object.freeze(["fix", "improve", "question"]);
var ARTIFACT_REVIEW_STATUSES = Object.freeze(["open", "addressed", "resolved"]);
var REVIEW_OF_RE = /^[a-f0-9]{64}$/;
var ArtifactReviewStateError = class extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ArtifactReviewStateError";
    this.code = code;
  }
};
function invalid(message) {
  throw new ArtifactReviewStateError("E_ARTIFACT_REVIEW_INVALID", message);
}
function identityRequired() {
  throw new ArtifactReviewStateError(
    "E_ARTIFACT_REVIEW_IDENTITY_REQUIRED",
    "Enter your name before adding a comment."
  );
}
function boundedString(value, label, { min = 0, max, trim = false, pattern } = {}) {
  if (typeof value !== "string") invalid(`${label} must be a string.`);
  const normalized = trim ? value.trim() : value;
  if (normalized.length < min || max !== void 0 && normalized.length > max) {
    invalid(`${label} must contain ${min} through ${max ?? "unlimited"} characters.`);
  }
  if (pattern && !pattern.test(normalized)) invalid(`${label} has an invalid format.`);
  return normalized;
}
function optionalString(value, label, options) {
  if (value === void 0) return void 0;
  return boundedString(value, label, options);
}
function enumValue(value, values, label) {
  if (!values.includes(value)) invalid(`${label} must be one of: ${values.join(", ")}.`);
  return value;
}
function isoTimestamp(value, label) {
  const timestamp = value instanceof Date ? value.toISOString() : value;
  if (typeof timestamp !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) || !Number.isFinite(Date.parse(timestamp))) {
    invalid(`${label} must be an ISO-8601 date-time.`);
  }
  return timestamp;
}
function normalizeArtifactReviewIdentity(value, { allowEmpty = false } = {}) {
  if (value === null || value === void 0 || value === "") {
    if (allowEmpty) return null;
    identityRequired();
  }
  const source = typeof value === "string" ? { name: value } : value;
  if (!source || typeof source !== "object" || Array.isArray(source)) identityRequired();
  const name = boundedString(source.name, "author.name", {
    min: 1,
    max: ARTIFACT_REVIEW_LIMITS.authorName,
    trim: true
  });
  const id = optionalString(source.id, "author.id", {
    min: 1,
    max: ARTIFACT_REVIEW_LIMITS.id,
    trim: true
  });
  return deepFreeze(id === void 0 ? { name } : { id, name });
}
function normalizeRegion(region) {
  if (!region || typeof region !== "object" || Array.isArray(region)) {
    invalid("pin.region must be an object.");
  }
  const finite = (value, label) => {
    if (typeof value !== "number" || !Number.isFinite(value)) invalid(`${label} must be finite.`);
    return value;
  };
  const x = finite(region.x, "pin.region.x");
  const y = finite(region.y, "pin.region.y");
  const w = finite(region.w, "pin.region.w");
  const h = finite(region.h, "pin.region.h");
  if (x >= 0 && y >= 0 && w >= 0 && h >= 0 && x + w <= 1 && y + h <= 1) {
    return { x, y, w, h };
  }
  const unit = (value) => Math.round(Math.min(1, Math.max(0, value)) * 1e6) / 1e6;
  const boundedX = unit(x);
  const boundedY = unit(y);
  return {
    x: boundedX,
    y: boundedY,
    w: Math.round(Math.min(unit(w), 1 - boundedX) * 1e6) / 1e6,
    h: Math.round(Math.min(unit(h), 1 - boundedY) * 1e6) / 1e6
  };
}
function normalizeViewport(viewport) {
  if (!viewport || typeof viewport !== "object" || Array.isArray(viewport)) {
    invalid("pin.viewport must be an object.");
  }
  const dimension = (value, label) => {
    if (!Number.isInteger(value) || value < 1 || value > ARTIFACT_REVIEW_LIMITS.viewport) {
      invalid(`${label} must be an integer from 1 through ${ARTIFACT_REVIEW_LIMITS.viewport}.`);
    }
    return value;
  };
  return {
    width: dimension(viewport.width, "pin.viewport.width"),
    height: dimension(viewport.height, "pin.viewport.height")
  };
}
function normalizeAnchor(anchor) {
  if (anchor === void 0 || anchor === null) return void 0;
  if (typeof anchor !== "object" || Array.isArray(anchor)) invalid("pin.anchor must be an object.");
  const planrId = boundedString(anchor.planrId, "pin.anchor.planrId", {
    min: 1,
    max: ARTIFACT_REVIEW_LIMITS.anchor,
    trim: true
  });
  const screen = optionalString(anchor.screen, "pin.anchor.screen", {
    min: 1,
    max: ARTIFACT_REVIEW_LIMITS.screen,
    trim: true
  });
  return screen === void 0 ? { planrId } : { planrId, screen };
}
function normalizeReply(reply, label = "reply") {
  if (!reply || typeof reply !== "object" || Array.isArray(reply))
    invalid(`${label} must be an object.`);
  return {
    id: boundedString(reply.id, `${label}.id`, {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.id,
      trim: true
    }),
    author: normalizeArtifactReviewIdentity(reply.author),
    comment: boundedString(reply.comment, `${label}.comment`, {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.text,
      trim: true
    }),
    createdAt: isoTimestamp(reply.createdAt, `${label}.createdAt`)
  };
}
function compareTimestampThenId(left, right) {
  const byTime = left.createdAt.localeCompare(right.createdAt);
  return byTime === 0 ? left.id.localeCompare(right.id) : byTime;
}
function normalizePin(pin, label = "pin") {
  if (!pin || typeof pin !== "object" || Array.isArray(pin)) invalid(`${label} must be an object.`);
  if (!Array.isArray(pin.replies) || pin.replies.length > ARTIFACT_REVIEW_LIMITS.replies) {
    invalid(`${label}.replies must contain no more than ${ARTIFACT_REVIEW_LIMITS.replies} items.`);
  }
  const replies = pin.replies.map(
    (reply, index) => normalizeReply(reply, `${label}.replies[${index}]`)
  );
  const replyIds = new Set(replies.map(({ id }) => id));
  if (replyIds.size !== replies.length) invalid(`${label}.replies must have unique ids.`);
  const normalized = {
    id: boundedString(pin.id, `${label}.id`, {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.id,
      trim: true
    }),
    author: normalizeArtifactReviewIdentity(pin.author),
    artifactId: boundedString(pin.artifactId, `${label}.artifactId`, {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.artifactId,
      trim: true
    }),
    region: normalizeRegion(pin.region),
    viewport: normalizeViewport(pin.viewport),
    intent: enumValue(pin.intent, ARTIFACT_REVIEW_INTENTS, `${label}.intent`),
    status: enumValue(pin.status, ARTIFACT_REVIEW_STATUSES, `${label}.status`),
    comment: boundedString(pin.comment, `${label}.comment`, {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.text,
      trim: true
    }),
    replies: replies.sort(compareTimestampThenId),
    createdAt: isoTimestamp(pin.createdAt, `${label}.createdAt`),
    updatedAt: isoTimestamp(pin.updatedAt, `${label}.updatedAt`)
  };
  const variant = optionalString(pin.variant, `${label}.variant`, {
    min: 1,
    max: ARTIFACT_REVIEW_LIMITS.variant,
    trim: true
  });
  const anchor = normalizeAnchor(pin.anchor);
  if (variant !== void 0) normalized.variant = variant;
  if (anchor !== void 0) normalized.anchor = anchor;
  return normalized;
}
function normalizeArtifactReview2(review) {
  if (!review || typeof review !== "object" || Array.isArray(review)) {
    invalid("Artifact review must be an object.");
  }
  if (!Array.isArray(review.pins) || review.pins.length > ARTIFACT_REVIEW_LIMITS.pins) {
    invalid(`review.pins must contain no more than ${ARTIFACT_REVIEW_LIMITS.pins} items.`);
  }
  const pins = review.pins.map((pin, index) => normalizePin(pin, `review.pins[${index}]`));
  const pinIds = new Set(pins.map(({ id }) => id));
  if (pinIds.size !== pins.length) invalid("review.pins must have unique ids.");
  const normalized = {
    schemaVersion: enumValue(review.schemaVersion, ["1.0.0"], "review.schemaVersion"),
    reviewId: boundedString(review.reviewId, "review.reviewId", {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.id,
      trim: true
    }),
    reviewOf: boundedString(review.reviewOf, "review.reviewOf", {
      min: 64,
      max: 64,
      pattern: REVIEW_OF_RE
    }),
    decision: enumValue(review.decision, ARTIFACT_REVIEW_DECISIONS, "review.decision"),
    overall: boundedString(review.overall, "review.overall", {
      max: ARTIFACT_REVIEW_LIMITS.text
    }),
    pins: pins.sort(compareTimestampThenId)
  };
  if (review.createdAt !== void 0)
    normalized.createdAt = isoTimestamp(review.createdAt, "review.createdAt");
  if (review.updatedAt !== void 0)
    normalized.updatedAt = isoTimestamp(review.updatedAt, "review.updatedAt");
  return deepFreeze(normalized);
}

// packages/design/lib/design/workspace-feedback.mjs
function workspaceReviewerId(publicKey) {
  return sha256Hex(
    canonicalizeJson({ kty: publicKey.kty, crv: publicKey.crv, x: publicKey.x, y: publicKey.y })
  );
}
function mergeWorkspaceFeedback(events, { revisionId, reviewOf, ownerPublicKey } = {}) {
  if (!Array.isArray(events) || !revisionId || !/^[a-f0-9]{64}$/u.test(reviewOf))
    throw new TypeError("Feedback merge requires a revision and content digest.");
  const pins = /* @__PURE__ */ new Map();
  const pinOwners = /* @__PURE__ */ new Map();
  const replyOwners = /* @__PURE__ */ new Map();
  const overall = /* @__PURE__ */ new Map();
  const directions = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Map();
  const revisionBases = /* @__PURE__ */ new Map();
  const acceptedEventIds = [];
  const issues = [];
  const categories = {}, dispositions = {};
  for (const event of [...events].sort((a, b) => a.sequence - b.sequence)) {
    try {
      if (!event || typeof event.id !== "string" || !event.id || typeof event.revisionId !== "string" || !/^[a-f0-9]{64}$/u.test(event.reviewOf ?? "") || !Number.isSafeInteger(event.sequence) || event.sequence < 1)
        throw new TypeError("Shared feedback has an invalid event identity or revision.");
      const eventHash = sha256Hex(canonicalizeJson(event));
      if (seen.has(event.id)) {
        if (seen.get(event.id) !== eventHash)
          throw new TypeError("Shared feedback reuses an event identity with changed bytes.");
        continue;
      }
      seen.set(event.id, eventHash);
      const boundReviewOf = revisionBases.get(event.revisionId);
      if (boundReviewOf && boundReviewOf !== event.reviewOf)
        throw new TypeError("A shared revision identity is bound to conflicting design content.");
      revisionBases.set(event.revisionId, event.reviewOf);
      if (event.revisionId !== revisionId) continue;
      if (event.reviewOf !== reviewOf || !event.publicKey?.x || !event.publicKey?.y)
        throw new TypeError("Shared feedback has an invalid revision or signer.");
      const signerId = workspaceReviewerId(event.publicKey);
      const payload = event.payload;
      if (!payload || typeof payload.author !== "string" || !payload.author.trim() || payload.author.length > 160 || payload.reviewOf !== reviewOf)
        throw new TypeError("Shared feedback has an invalid author or digest.");
      const author = { id: signerId, name: payload.author.trim() };
      if (["category", "disposition"].includes(payload.kind)) {
        assertDesignReviewMetadata(payload);
        if (!pins.has(payload.pinId))
          throw new TypeError("Review metadata targets an unknown pin.");
        const owner = ownerPublicKey?.x === event.publicKey.x && ownerPublicKey?.y === event.publicKey.y;
        if (payload.kind === "disposition" && !owner)
          throw new TypeError("Only the design owner can record a disposition.");
        if (payload.kind === "category" && !owner && pinOwners.get(payload.pinId) !== signerId)
          throw new TypeError("Only the comment author or owner can change its category.");
        if (payload.kind === "category") categories[payload.pinId] = payload.category;
        else
          dispositions[payload.pinId] = {
            disposition: payload.disposition,
            reason: payload.reason,
            updatedAt: payload.updatedAt,
            author: author.name
          };
        acceptedEventIds.push(event.id);
        continue;
      }
      if (payload.kind === "direction") {
        for (const value of [payload.ratings ?? {}, payload.remix ?? {}])
          if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > 256)
            throw new TypeError("Shared direction feedback is too large or invalid.");
        const ratings = {};
        const remix = {};
        for (const [id, rating] of Object.entries(payload.ratings ?? {})) {
          if (Number.isInteger(rating) && rating >= 1 && rating <= 5) ratings[id] = rating;
        }
        for (const [id, note] of Object.entries(payload.remix ?? {})) {
          if (typeof note === "string" && note.length <= 8192) remix[id] = note;
        }
        directions.set(signerId, { signerId, author: author.name, revisionId, ratings, remix });
        acceptedEventIds.push(event.id);
        continue;
      }
      if (payload.kind !== "review" || payload.review?.reviewOf !== reviewOf)
        throw new TypeError("Shared review snapshot does not match its signed revision.");
      const review2 = normalizeArtifactReview2(payload.review);
      const additions = review2.pins.filter((pin) => !pins.has(pin.id)).length;
      if (pins.size + additions > ARTIFACT_REVIEW_LIMITS.pins)
        throw new TypeError("Shared feedback exceeds the total pin limit.");
      for (const incoming of review2.pins) {
        const previous = pins.get(incoming.id);
        const replies = /* @__PURE__ */ new Set([
          ...(previous?.replies ?? []).map((reply) => reply.id),
          ...incoming.replies.map((reply) => reply.id)
        ]);
        if (replies.size > ARTIFACT_REVIEW_LIMITS.replies)
          throw new TypeError("Shared feedback exceeds the thread reply limit.");
      }
      overall.set(signerId, { author: author.name, note: review2.overall });
      for (const incoming of review2.pins) {
        const previous = pins.get(incoming.id);
        if (!previous) {
          pins.set(incoming.id, { ...structuredClone(incoming), author, replies: [] });
          pinOwners.set(incoming.id, signerId);
        } else if (pinOwners.get(incoming.id) === signerId) {
          pins.set(incoming.id, {
            ...previous,
            comment: incoming.comment,
            status: incoming.status,
            updatedAt: incoming.updatedAt,
            author,
            replies: previous.replies
          });
        }
        const pin = pins.get(incoming.id);
        for (const reply of incoming.replies) {
          const key = `${incoming.id}:${reply.id}`;
          if (!replyOwners.has(key)) {
            replyOwners.set(key, signerId);
            pin.replies.push({ ...structuredClone(reply), author });
          }
        }
      }
      acceptedEventIds.push(event.id);
    } catch (error) {
      issues.push({ eventId: event.id, sequence: event.sequence, reason: error.message });
    }
  }
  const review = normalizeArtifactReview2({
    schemaVersion: "1.0.0",
    reviewId: `shared-${revisionId}`,
    reviewOf,
    decision: "pending",
    overall: [...overall.values()].filter(({ note }) => note).map(({ author, note }) => `${author}: ${note}`).join("\n\n").slice(0, 16384),
    pins: [...pins.values()]
  });
  return {
    review,
    directions: [...directions.values()],
    metadata: { categories, dispositions },
    acceptedEventIds,
    issues
  };
}

// packages/design/lib/design/share.mjs
function prepareDesignShareBundle(file) {
  const current = currentDesign(file);
  const saved = readJson(join3(current.root, ".design/studio-state.json"), { state: {} }).state;
  return bundleDesignRevision(current, saved);
}
async function withCustody(file, options, action) {
  const location = custodyLocation(file, options);
  ensurePrivateDirectory(location.root, { label: "Design" });
  const unlock = await acquireStartLock(`${location.path}.lock`);
  try {
    let record = readCustody(location.path, { label: "Design", format: FORMAT });
    if (!record && location.legacyPath && existsSync4(location.legacyPath)) {
      readCustody(location.legacyPath, { label: "Design", format: FORMAT });
      const legacyUnlock = await acquireStartLock(`${location.legacyPath}.lock`);
      try {
        const legacy = readCustody(location.legacyPath, { label: "Design", format: FORMAT });
        if (legacy && !existsSync4(location.path)) {
          const temporary = `${location.path}.${newWorkspaceId()}.migration`;
          const fd = openSync(temporary, "wx", 384);
          try {
            writeFileSync3(fd, `${JSON.stringify(legacy)}
`);
            fsyncSync(fd);
          } finally {
            closeSync(fd);
          }
          try {
            linkSync(temporary, location.path);
            const directory = openSync(location.root, "r");
            try {
              fsyncSync(directory);
            } finally {
              closeSync(directory);
            }
          } finally {
            unlinkSync(temporary);
          }
        }
        record = readCustody(location.path, { label: "Design", format: FORMAT });
      } finally {
        legacyUnlock();
      }
    }
    return await action({
      ...location,
      record,
      save(value = record) {
        record = value;
        writeCustody(location.path, value, { label: "Design" });
      }
    });
  } finally {
    unlock();
  }
}
function uploadOptions(custody, options) {
  const body = custody.pendingCreate ?? (custody.pendingMutation?.action === "publish" ? custody.pendingMutation.body : null);
  return {
    fetchImpl: options.fetchImpl,
    ...custody.schemaVersion === "2.0.0" && body ? { readChunk: spoolChunkReader(custody.spoolDirectory, body) } : {}
  };
}
async function commitMutation(record, save, options) {
  try {
    return await commitWorkspaceMutation(
      record.custody,
      uploadOptions(record.custody, options)
    );
  } catch (error) {
    if (error.status === 409 && record.custody.pendingMutation) {
      const pending = structuredClone(record.custody.pendingMutation);
      try {
        const remote = await getWorkspace(record.custody, {
          fetchImpl: options.fetchImpl
        });
        if (remote.version > pending.body.expectedVersion) {
          record.conflictedMutation = {
            ...pending,
            localRevision: record.pendingRevision ?? null,
            ...record.custody.spoolDirectory ? { spoolDirectory: record.custody.spoolDirectory } : {}
          };
          delete record.custody.spoolDirectory;
          delete record.custody.pendingMutation;
          delete record.pendingRevision;
          save(record);
        }
      } catch {
      }
    }
    throw error;
  }
}
async function shareDesign(file, options = {}) {
  return withCustody(file, options, async ({ record, current, save, root }) => {
    if (record?.deleted)
      throw new Error(
        "This shared review was deleted. Create a new design identity to share a new review."
      );
    if (!record) {
      let transport = options.transport;
      if (!transport) {
        try {
          await discoverWorkspaceCapabilities({
            baseUrl: options.baseUrl ?? options.env?.OPENPLANR_SHARE_BASE ?? process.env.OPENPLANR_SHARE_BASE ?? "https://share.openplanr.dev",
            fetchImpl: options.fetchImpl
          });
          transport = "2";
        } catch (error) {
          if (![404, 426].includes(error.status)) throw error;
          transport = "1";
        }
      }
      let custody;
      try {
        custody = await prepareWorkspace(prepareDesignShareBundle(file), {
          transport,
          baseUrl: options.baseUrl ?? options.env?.OPENPLANR_SHARE_BASE ?? process.env.OPENPLANR_SHARE_BASE ?? "https://share.openplanr.dev"
        });
      } catch (error) {
        if (transport === "1" && error.code === "E_WORKSPACE_PAYLOAD_TOO_LARGE")
          throw Object.assign(
            new Error(
              "This sharing service needs the bounded resource upload upgrade. Retry after the hosted service is updated; your local work is unchanged."
            ),
            { code: "E_WORKSPACE_TRANSPORT_UNSUPPORTED", status: 426 }
          );
        throw error;
      }
      if (custody.schemaVersion === "2.0.0")
        await persistUploadSpool(custody, join3(root, "uploads"));
      record = {
        schemaVersion: "1.0.0",
        kind: FORMAT,
        designId: current.document.id,
        custody,
        publishedRevision: null,
        pendingRevision: current.revision,
        pendingPresentation: presentationFingerprint(current),
        lastEvent: 0
      };
      save(record);
    }
    if (record.custody.pendingCreate) {
      await commitWorkspace(record.custody, uploadOptions(record.custody, options));
      record.publishedRevision = record.pendingRevision;
      record.publishedPresentation = record.pendingPresentation;
      delete record.pendingRevision;
      delete record.pendingPresentation;
      save(record);
    }
    return safeStatus(record, current);
  });
}
async function publishDesignShare(file, options = {}) {
  return withCustody(file, options, async ({ record, current, save, root }) => {
    if (!record || record.custody.pendingCreate)
      throw new Error("Create the shared review before publishing an update.");
    if (record.deleted || record.revoked)
      throw new Error("Access was revoked or the review was deleted.");
    if (record.custody.pendingMutation && record.custody.pendingMutation.action !== "publish")
      throw new Error(
        `Retry the pending ${record.custody.pendingMutation.action} operation first.`
      );
    if (!record.custody.pendingMutation) {
      await getWorkspace(record.custody, { fetchImpl: options.fetchImpl });
      await prepareWorkspaceMutation(
        record.custody,
        "publish",
        prepareDesignShareBundle(file)
      );
      if (record.custody.schemaVersion === "2.0.0")
        await persistUploadSpool(record.custody, join3(root, "uploads"));
      record.pendingRevision = current.revision;
      record.pendingPresentation = presentationFingerprint(current);
      save(record);
    }
    await commitMutation(record, save, options);
    record.publishedRevision = record.pendingRevision;
    record.publishedPresentation = record.pendingPresentation;
    delete record.pendingRevision;
    delete record.pendingPresentation;
    save(record);
    return safeStatus(record, current);
  });
}
async function manageDesignShare(file, action, options = {}) {
  if (!["rotate", "pause", "resume", "revoke", "delete", "access"].includes(action))
    throw new Error("Unknown design sharing action.");
  return withCustody(file, options, async ({ record, current, save, root }) => {
    if (!record || record.custody.pendingCreate) throw new Error("Create the shared review first.");
    if (action === "access") {
      if (record.revoked || record.deleted) throw new Error("This review is no longer accessible.");
      return { ...safeStatus(record, current), token: record.custody.token };
    }
    if (action === "rotate") await flushOwnerMetadata(record, save, options);
    if (record.custody.pendingMutation && record.custody.pendingMutation.action !== action)
      throw new Error(
        `Retry the pending ${record.custody.pendingMutation.action} operation first.`
      );
    if (!record.custody.pendingMutation) {
      if (!record.revoked)
        await getWorkspace(record.custody, { fetchImpl: options.fetchImpl });
      await prepareWorkspaceMutation(record.custody, action);
      save(record);
    }
    await commitMutation(record, save, options);
    if (action === "pause" || action === "resume") record.commentsPaused = action === "pause";
    if (action === "revoke") record.revoked = true;
    if (action === "delete") record.deleted = true;
    save(record);
    return safeStatus(record, current);
  });
}
async function flushOwnerMetadata(record, save, options) {
  while (record.pendingReviewMetadata?.length) {
    await appendWorkspaceEvent(record.custody, null, {
      preparedEvent: record.pendingReviewMetadata[0],
      fetchImpl: options.fetchImpl
    });
    record.pendingReviewMetadata.shift();
    save(record);
  }
}
async function publishDesignReviewMetadata(file, payload, { revisionId, ...options } = {}) {
  const location = custodyLocation(file, options, { allowMissing: true });
  if (!existsSync4(location.path) || !revisionId) return { shared: false };
  return withCustody(file, options, async ({ record, save }) => {
    if (!record || record.deleted || record.revoked || record.custody.pendingCreate)
      return { shared: false };
    const event = await prepareWorkspaceEvent(record.custody, payload, {
      revisionId,
      reviewOf: payload.reviewOf,
      signer: {
        privateKey: record.custody.ownerPrivateKey,
        publicKey: record.custody.ownerPublicKey
      }
    });
    record.pendingReviewMetadata ??= [];
    record.pendingReviewMetadata.push(event);
    save(record);
    try {
      await flushOwnerMetadata(record, save, options);
      return { shared: true, pending: false };
    } catch (error) {
      return { shared: true, pending: true, error: error.message };
    }
  });
}
async function exportDesignShareRecovery(file, { output, ...options } = {}) {
  if (!output) throw new Error("Recovery export requires a new private output path.");
  return withCustody(file, options, async ({ record }) => {
    if (!record) throw new Error("Create the shared review first.");
    const target = resolve3(output);
    mkdirSync3(dirname4(target), { recursive: true, mode: 448 });
    const recovery = structuredClone(record);
    if (record.custody.schemaVersion === "2.0.0" && (record.custody.pendingCreate || record.custody.pendingMutation?.action === "publish")) {
      const spool = `${target}.upload`;
      await copyUploadSpool(record.custody, spool);
      recovery.recoverySpool = basename(spool);
      recovery.custody.spoolDirectory = spool;
    }
    writeFileSync3(target, `${JSON.stringify(recovery, null, 2)}
`, { flag: "wx", mode: 384 });
    return { ok: true, output: target };
  });
}
async function importDesignShareRecovery(file, { input, ...options } = {}) {
  if (!input) throw new Error("Recovery restore requires --input <private recovery file>.");
  const recovered = readCustody(resolve3(input), {
    label: "Design",
    format: FORMAT,
    recoveryInput: true
  });
  if (!recovered) throw new Error("Recovery file could not be found.");
  const custody = recovered.custody;
  workspaceReviewUrl(custody);
  const proof = await signWorkspaceValue(
    { recovery: custody.id, nonce: newWorkspaceId() },
    custody.ownerPrivateKey
  );
  if (!await verifyWorkspaceSignature(proof, custody.ownerPublicKey))
    throw new Error("Recovery private key does not match its owner identity.");
  await deriveWorkspaceAuthentication(custody.token, custody.id);
  if (!/^[A-Za-z0-9_-]{43}$/u.test(custody.ownerAuth ?? ""))
    throw new Error("Recovery owner capability is invalid.");
  return withCustody(file, options, async ({ record, current, save, root }) => {
    if (recovered.designId !== current.document.id)
      throw new Error("Recovery belongs to a different design.");
    if (record && (record.custody.id !== custody.id || JSON.stringify(record.custody.ownerPublicKey) !== JSON.stringify(custody.ownerPublicKey)))
      throw new Error(
        "This design already has different owner credentials. Recovery will not overwrite them."
      );
    if (record && record.custody.version > custody.version)
      throw new Error("This recovery file is older than the locally saved owner credentials.");
    if (!custody.pendingCreate && !recovered.deleted && !recovered.revoked) {
      await getWorkspace(custody, { fetchImpl: options.fetchImpl });
      const bundle = await decryptWorkspaceRevision(custody, custody.currentRevision, {
        fetchImpl: options.fetchImpl
      });
      if (bundle.design.id !== current.document.id)
        throw new Error("Recovery belongs to a different design.");
    }
    if (custody.schemaVersion === "2.0.0" && (custody.pendingCreate || custody.pendingMutation?.action === "publish")) {
      if (recovered.recoverySpool !== `${basename(resolve3(input))}.upload`)
        throw new Error("Pending upload recovery requires its matching binary sidecar.");
      custody.spoolDirectory = join3(dirname4(resolve3(input)), recovered.recoverySpool);
      const pending = custody.pendingCreate ?? custody.pendingMutation.body;
      const destination = join3(root, "uploads", custody.id, pending.operationId);
      if (existsSync4(destination)) {
        const { spoolChunkReader: spoolChunkReader2 } = await import("./design-generated-b0798298053515fd.mjs");
        const reader = spoolChunkReader2(destination, pending);
        for (const part of pending.manifest.chunks) await reader(part.index);
      } else await copyUploadSpool(custody, destination);
      custody.spoolDirectory = destination;
      delete recovered.recoverySpool;
    }
    recovered.lastEvent = 0;
    save(recovered);
    return { ...safeStatus(recovered, current), restored: true };
  });
}
async function syncDesignShare(file, options = {}) {
  const location = custodyLocation(file, options, { allowMissing: true });
  if (!existsSync4(location.path)) return { ok: true, shared: false, imported: 0 };
  return withCustody(file, options, async ({ record, current, save, root }) => {
    if (!record || record.custody.pendingCreate || record.deleted)
      return { ok: true, shared: Boolean(record), imported: 0 };
    await flushOwnerMetadata(record, save, options);
    const reviewKey = `design-${hash(current.document.id).slice(0, 24)}`;
    const reviewPath = resolveArtifactReviewDestination({
      cwd: current.root,
      env: options.env ?? process.env,
      artifactId: reviewKey
    }).path;
    const currentDigest = digestArtifactEnvelope(current.envelope);
    let imported = 0, hasMore = true, issues = [];
    const ledgerPath = join3(current.root, ".design/shared-feedback.json");
    while (hasMore) {
      const page = await readWorkspaceEvents(record.custody, {
        after: record.lastEvent ?? 0,
        fetchImpl: options.fetchImpl
      });
      const earlier = readJson(ledgerPath, {
        schemaVersion: "1.0.0",
        events: [],
        issues: [],
        importedReviews: {}
      });
      const events = [...earlier.events];
      const eventBytes = new Map(events.map((event) => [event.id, canonicalizeJson(event)]));
      const revisionBases = /* @__PURE__ */ new Map();
      for (const event of events) {
        const previous = revisionBases.get(event.revisionId);
        if (previous && previous !== event.reviewOf)
          throw new Error(
            "Saved shared feedback binds one revision to conflicting design content."
          );
        revisionBases.set(event.revisionId, event.reviewOf);
      }
      const pageIssues = [...page.issues ?? []];
      for (const event of page.events ?? []) {
        if (eventBytes.has(event.id)) {
          if (eventBytes.get(event.id) !== canonicalizeJson(event))
            pageIssues.push({
              id: event.id,
              sequence: event.sequence,
              reason: "Shared feedback reuses an event identity with changed bytes."
            });
          continue;
        }
        try {
          const boundReviewOf = revisionBases.get(event.revisionId);
          if (boundReviewOf && boundReviewOf !== event.reviewOf)
            throw new Error("A shared revision identity is bound to conflicting design content.");
          const candidate = mergeWorkspaceFeedback([...events, event], {
            revisionId: event.revisionId,
            reviewOf: event.reviewOf,
            ownerPublicKey: record.custody.ownerPublicKey
          });
          const invalid2 = candidate.issues?.find(
            (issue) => (issue.id ?? issue.eventId) === event.id
          );
          if (invalid2) throw new Error(invalid2.reason);
          events.push(event);
          eventBytes.set(event.id, canonicalizeJson(event));
          revisionBases.set(event.revisionId, event.reviewOf);
          imported++;
        } catch (error) {
          pageIssues.push({ id: event.id, sequence: event.sequence, reason: error.message });
        }
      }
      const revisions = /* @__PURE__ */ new Map();
      for (const event of events) {
        const previous = revisions.get(event.revisionId);
        if (previous && previous !== event.reviewOf)
          throw new Error(
            "Saved shared feedback binds one revision to conflicting design content."
          );
        revisions.set(event.revisionId, event.reviewOf);
      }
      const importedReviews = { ...earlier.importedReviews ?? {} }, directions = [], metadataByRevision = {};
      await withArtifactReviewLock(reviewPath, () => {
        const ledger = readArtifactReviewState(reviewPath, { allowMissing: true }) ?? createReviewLedger({ artifactId: reviewKey, currentReviewOf: currentDigest });
        const entries = new Map(ledger.reviews.map((entry) => [entry.review.reviewId, entry]));
        for (const [revisionId, reviewOf] of revisions) {
          const merged = mergeWorkspaceFeedback(events, {
            revisionId,
            reviewOf,
            ownerPublicKey: record.custody.ownerPublicKey
          });
          metadataByRevision[revisionId] = merged.metadata;
          directions.push(...merged.directions);
          pageIssues.push(...merged.issues ?? []);
          const review = structuredClone(merged.review);
          const previous = entries.get(review.reviewId)?.review;
          const previousImport = earlier.importedReviews?.[review.reviewId];
          importedReviews[review.reviewId] = structuredClone(review);
          if (previous) {
            review.decision = previous.decision;
            if (previousImport && previous.overall !== previousImport.overall)
              review.overall = previous.overall;
            review.pins = review.pins.map((pin) => {
              const saved = previous.pins.find((item) => item.id === pin.id);
              const importedPin = previousImport?.pins.find((item) => item.id === pin.id);
              if (!saved) return pin;
              const replies = new Map(
                [...pin.replies, ...saved.replies].map((reply) => [reply.id, reply])
              );
              return {
                ...pin,
                ...importedPin && saved.status !== importedPin.status ? { status: saved.status, updatedAt: saved.updatedAt } : {},
                replies: [...replies.values()]
              };
            });
          }
          entries.set(review.reviewId, { review, stale: reviewOf !== currentDigest });
        }
        writeArtifactReviewState(
          reviewPath,
          createReviewLedger({
            artifactId: reviewKey,
            currentReviewOf: currentDigest,
            reviews: [...entries.values()]
          })
        );
      });
      issues = [
        ...new Map(
          [...earlier.issues ?? [], ...pageIssues].map((issue) => [
            `${issue.id ?? issue.eventId}:${issue.sequence}`,
            issue
          ])
        ).values()
      ];
      atomicJson(ledgerPath, {
        schemaVersion: "1.0.0",
        workspaceId: record.custody.id,
        events,
        issues,
        directions,
        metadataByRevision,
        importedReviews
      });
      const next = page.cursor;
      hasMore = Boolean(page.hasMore) && next > record.lastEvent;
      record.lastEvent = next;
      save(record);
    }
    return { ok: true, shared: true, imported, issues, reviewPath, ...safeStatus(record, current) };
  });
}

export {
  createReviewLedger,
  mergeReviewLedger,
  effectiveReviewDecision,
  ARTIFACT_REVIEW_MAX_STATE_BYTES,
  normalizeArtifactReview,
  readArtifactReviewState,
  writeArtifactReviewState,
  withArtifactReviewLock,
  exportArtifactReview,
  resolveArtifactReviewDestination,
  decodeArtifactReviewSources,
  getDesignShareStatus,
  prepareDesignShareBundle,
  shareDesign,
  publishDesignShare,
  manageDesignShare,
  publishDesignReviewMetadata,
  exportDesignShareRecovery,
  importDesignShareRecovery,
  syncDesignShare
};
