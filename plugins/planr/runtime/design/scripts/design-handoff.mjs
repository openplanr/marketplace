import {
  DESIGN_HANDOFF_CONTENT_SCHEMA,
  DESIGN_HANDOFF_SCHEMA,
  assertPlainData,
  assertReviewExperience,
  canonicalizeJson,
  deepFreeze,
  emptyReviewContext,
  reviewDigest,
  sha256Hex
} from "./design-shared-artifact-support-dependencies-design-support-protocol-contracts-d707e49b.mjs";
import {
  ARTIFACT_ERROR_CODES,
  PipelineError,
  canonicalSerialize,
  digestArtifactEnvelope,
  validateArtifactEnvelope,
  validateArtifactReview,
  validateJson
} from "./design-shared-artifact-support-protocol-contracts-9f6918b0.mjs";
import {
  assertDesignShareAvailable,
  getDesignShareStatus,
  publishDesignReviewMetadata
} from "./design-share-cli-bridge.mjs";
import {
  atomicJson,
  currentDesign,
  designSpecPath,
  hash,
  readJson
} from "./design-shared-design-support-0bac378d.mjs";
import {
  planrHome
} from "./design-runtime-home.mjs";
import {
  acquireStartLock
} from "./design-loopback-server.mjs";

// packages/design/lib/design/feedback-reader.mjs
import { join as join2 } from "node:path";

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

// packages/protocol/src/names.mjs
var PLANNING_FOLDER = ".planr";
var CLI_COMMAND = "openplanr";

// packages/artifact/lib/artifact/internal/feedback.mjs
var FEEDBACK_FILE = "feedback.json";

// packages/artifact/lib/artifact/merge.mjs
var ARTIFACT_REVIEW_STATE_VERSION = "1.0.0";
var ARTIFACT_REVIEW_STATE_KIND = "artifact-review-state";
var SHA256_RE = /^[a-f0-9]{64}$/;
var ARTIFACT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
function conflict(message2, details = void 0) {
  throw new PipelineError(
    ARTIFACT_ERROR_CODES.MERGE_CONFLICT,
    message2,
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
function withArtifactReviewLock(path, action3) {
  const previous = reviewPathQueues.get(path) ?? Promise.resolve();
  const run = async () => {
    let release;
    try {
      release = await acquireStartLock(`${path}.lock`, { timeout: 15e3, stale: 3e4 });
      return await action3();
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
function pathError(code, message2) {
  throw new PipelineError(
    code,
    message2,
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
  const path = join(root, PLANNING_FOLDER, "config.json");
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
    const directory2 = assertSafeDestination(projectRoot, [
      PLANNING_FOLDER,
      "artifacts",
      artifactId
    ]);
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
  const list2 = Array.isArray(sources) ? sources : [sources];
  if (list2.length === 0) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_IMPORT,
      "At least one artifact review source is required."
    );
  }
  const entries = [];
  for (let index = 0; index < list2.length; index += 1) {
    const source = list2[index];
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

// packages/design/lib/design/feedback-reader.mjs
var designReviewKey = (document) => `design-${hash(document.id).slice(0, 24)}`;
function designReviewPath(file, env = process.env, options = {}) {
  const { root, document } = currentDesign(file, options);
  return resolveArtifactReviewDestination({
    cwd: root,
    env,
    artifactId: designReviewKey(document)
  }).path;
}
function readDesignFeedback(file, env = process.env, options = {}) {
  const current = currentDesign(file, options);
  const ledger = readArtifactReviewState(designReviewPath(file, env, options), {
    allowMissing: true
  });
  const digest2 = digestArtifactEnvelope(current.envelope);
  const pins = (ledger?.reviews ?? []).flatMap(
    (entry) => entry.review.pins.map((pin) => {
      const target = current.entries.find((item) => item.artifactId === pin.artifactId);
      const screen = target && current.document.screens.find((item) => item.id === target.screenId);
      const anchorMissing = pin.anchor?.planrId && screen?.anchors?.length && !screen.anchors.includes(pin.anchor.planrId) && pin.anchor.planrId !== screen.id;
      return {
        ...pin,
        reviewId: entry.review.reviewId,
        reviewOf: entry.review.reviewOf,
        ...entry.review.reviewId.startsWith("shared-") ? { revisionId: entry.review.reviewId.slice(7) } : {},
        stale: entry.stale || entry.review.reviewOf !== digest2 || !target || Boolean(anchorMissing),
        ...target ? { screenId: target.screenId, variantId: target.variantId } : {}
      };
    })
  );
  return {
    revision: current.revision,
    reviewPath: designReviewPath(file, env, options),
    pins,
    state: readJson(join2(current.root, ".design/studio-state.json"), {
      state: {},
      stateVersion: 0
    }).state,
    ledger,
    shared: readJson(join2(current.root, ".design/shared-feedback.json"), null)
  };
}

// packages/design/lib/design/handoff-reader.mjs
import { existsSync as existsSync3, readFileSync as readFileSync3 } from "node:fs";
import { dirname as dirname3, join as join3 } from "node:path";

// packages/design/lib/design/handoff-format.mjs
var safeMd = (text2) => String(text2).replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
function renderMarkdown(draft, title2) {
  const lines = [
    `# ${safeMd(title2)} \u2014 review handoff`,
    "",
    `Status: ${draft.status}. Source revision: ${draft.basis.sourceRevision}.`,
    "",
    draft.content.summary || "Owner summary has not been written.",
    ""
  ];
  for (const [key, label] of [
    ["agreedChanges", "Agreed changes"],
    ["openQuestions", "Open questions"],
    ["deferred", "Deferred"],
    ["rejected", "Rejected"]
  ]) {
    lines.push(`## ${label}`, "");
    for (const item of draft.content[key]) {
      lines.push(
        `- ${safeMd(item.refinement ?? item.text)} \u2014 ${safeMd(item.author ?? "Reviewer")}${item.stale ? " \xB7 original revision" : ""} [source comment](${item.source})`
      );
      if (item.refinement) lines.push(`  Original comment: ${safeMd(item.text)}`);
    }
    if (!draft.content[key].length) lines.push("None recorded.");
    lines.push("");
  }
  lines.push(
    "## Overall review notes",
    "",
    ...draft.reviewNotes.map((note) => `- ${safeMd(note.text)} (${safeMd(note.reviewId)})`),
    ""
  );
  lines.push(
    "## Verification gaps",
    "",
    ...draft.verificationGaps.length ? draft.verificationGaps.map((value) => `- ${safeMd(value)}`) : ["None recorded."],
    "",
    "Plan and Ship remain separate user invocations.",
    ""
  );
  return lines.join("\n");
}

// packages/protocol/src/design-handoff-contracts.mjs
var DESIGN_HANDOFF_PROTOCOL_VERSION = "1.11.0";
var DESIGN_HANDOFF_CONTRACT_VERSION = "1.0.0";
var DESIGN_HANDOFF_AUTHORITY = "prepare-plan";
var DESIGN_HANDOFF_CHECK_IDS = Object.freeze([
  "current-revision",
  "selected-direction",
  "design-specification",
  "rendered-verification",
  "review-freshness",
  "review-dispositions",
  "unresolved-blockers",
  "approved-review-handoff"
]);
var DESIGN_HANDOFF_SOURCE_KINDS = Object.freeze([
  "design-revision",
  "selected-direction",
  "design-specification",
  "rendered-verification",
  "review-context",
  "review-feedback",
  "review-metadata",
  "review-handoff",
  "screen",
  "frame",
  "component",
  "state",
  "flow",
  "token",
  "review-decision",
  "element-anchor"
]);
var DESIGN_HANDOFF_REQUIREMENT_KINDS = Object.freeze([
  "behavior",
  "visual-state",
  "responsive",
  "accessibility",
  "content-data-assumption",
  "constraint",
  "verification-intent"
]);
var DESIGN_HANDOFF_CONTRACT_FILES = Object.freeze({
  "design-handoff-readiness": "design-handoff-readiness.schema.json",
  "design-implementation-handoff": "design-implementation-handoff.schema.json",
  "design-planning-lineage": "design-planning-lineage.schema.json"
});
var text = { type: "string", minLength: 1, maxLength: 16384 };
var title = { ...text, maxLength: 240 };
var id = {
  type: "string",
  minLength: 1,
  maxLength: 160,
  pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
};
var digest = { type: "string", pattern: "^sha256:[a-f0-9]{64}$" };
var relativePath = { type: "string", minLength: 1, maxLength: 4096 };
var timestamp = { type: "string", format: "date-time" };
var list = (items, maxItems = 1e3) => ({ type: "array", items, maxItems });
var closed = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required
});
var contract = (name, body) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.11.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: DESIGN_HANDOFF_PROTOCOL_VERSION },
  ...body
});
var action = closed({ id, label: title });
var anchor = {
  oneOf: [
    closed({ section: id }),
    closed({ screenId: id }),
    closed({ screenId: id, elementId: id }),
    closed({ reviewId: id, pinId: id })
  ]
};
var evidenceReference = closed(
  {
    id,
    kind: { enum: DESIGN_HANDOFF_SOURCE_KINDS },
    path: relativePath,
    revision: digest,
    digest,
    anchor
  },
  ["id", "kind", "path"]
);
var readinessCheck = closed(
  {
    id: { enum: DESIGN_HANDOFF_CHECK_IDS },
    status: { enum: ["pass", "attention", "blocked", "stale"] },
    message: title,
    evidenceRefs: list(id, 64),
    recoveryAction: action
  },
  ["id", "status", "message", "evidenceRefs"]
);
var readinessRecord = closed({
  kind: { const: "openplanr-design-handoff-readiness" },
  schemaVersion: { const: DESIGN_HANDOFF_CONTRACT_VERSION },
  scope: { const: "design-originated" },
  authority: { const: "none" },
  designId: id,
  sourceRevision: { anyOf: [digest, { type: "null" }] },
  selectedVariant: { anyOf: [id, { type: "null" }] },
  status: { enum: ["ready", "attention", "blocked", "stale"] },
  continuation: closed({
    action: { const: DESIGN_HANDOFF_AUTHORITY },
    available: { type: "boolean" }
  }),
  checks: list(readinessCheck, DESIGN_HANDOFF_CHECK_IDS.length),
  evidence: list(evidenceReference, 1e4),
  blockers: list({ enum: DESIGN_HANDOFF_CHECK_IDS }, DESIGN_HANDOFF_CHECK_IDS.length),
  nextActions: list(action, DESIGN_HANDOFF_CHECK_IDS.length)
});
var readinessAbsence = closed({
  kind: { const: "openplanr-design-handoff-readiness-absence" },
  schemaVersion: { const: DESIGN_HANDOFF_CONTRACT_VERSION },
  status: { const: "absent" },
  reason: { enum: ["not-computed", "not-applicable", "unavailable"] },
  message: title,
  nextAction: action
});
var DESIGN_HANDOFF_READINESS_SCHEMA = contract("design-handoff-readiness", {
  oneOf: [readinessRecord, readinessAbsence]
});
var requirement = closed({
  id: { type: "string", pattern: "^REQ-[0-9]{3,}$" },
  kind: { enum: DESIGN_HANDOFF_REQUIREMENT_KINDS },
  statement: text,
  sourceRefs: { ...list(id, 256), minItems: 1 },
  verification: { ...list(text, 256), minItems: 1 }
});
var implementationHandoff = closed(
  {
    kind: { const: "openplanr-design-implementation-handoff" },
    schemaVersion: { const: DESIGN_HANDOFF_CONTRACT_VERSION },
    id,
    version: { type: "integer", minimum: 1 },
    status: { enum: ["draft", "approved", "superseded", "revoked"] },
    authority: { const: DESIGN_HANDOFF_AUTHORITY },
    title,
    basis: closed({
      designId: id,
      sourceRevision: digest,
      selectedVariant: id,
      readiness: closed({ status: { enum: ["ready", "attention", "blocked", "stale"] }, digest }),
      reviewHandoff: closed({ version: { type: "integer", minimum: 1 }, contentDigest: digest })
    }),
    sources: list(evidenceReference, 1e4),
    requirements: { ...list(requirement, 1e4), minItems: 1 },
    contentDigest: digest,
    markdown: { type: "string", maxLength: 2097152 },
    approval: closed({
      actorId: id,
      approvedAt: timestamp,
      contentDigest: digest,
      authority: { const: DESIGN_HANDOFF_AUTHORITY }
    }),
    supersededBy: closed({ id, version: { type: "integer", minimum: 1 }, contentDigest: digest }),
    revocation: closed({ actorId: id, revokedAt: timestamp, reason: text })
  },
  [
    "kind",
    "schemaVersion",
    "id",
    "version",
    "status",
    "authority",
    "title",
    "basis",
    "sources",
    "requirements",
    "contentDigest",
    "markdown"
  ]
);
implementationHandoff.allOf = [
  {
    if: { properties: { status: { const: "approved" } }, required: ["status"] },
    then: {
      required: ["approval"],
      not: { anyOf: [{ required: ["supersededBy"] }, { required: ["revocation"] }] }
    }
  },
  {
    if: { properties: { status: { const: "superseded" } }, required: ["status"] },
    then: { required: ["approval", "supersededBy"], not: { required: ["revocation"] } }
  },
  {
    if: { properties: { status: { const: "revoked" } }, required: ["status"] },
    then: { required: ["approval", "revocation"], not: { required: ["supersededBy"] } }
  },
  {
    if: { properties: { status: { const: "draft" } }, required: ["status"] },
    then: {
      not: {
        anyOf: [
          { required: ["approval"] },
          { required: ["supersededBy"] },
          { required: ["revocation"] }
        ]
      }
    }
  }
];
var DESIGN_IMPLEMENTATION_HANDOFF_SCHEMA = contract(
  "design-implementation-handoff",
  implementationHandoff
);
var lineageMapping = closed({
  requirementId: { type: "string", pattern: "^REQ-[0-9]{3,}$" },
  acceptanceRefs: {
    ...list(
      closed({
        storyId: { type: "string", pattern: "^US-[0-9]{3,}$" },
        acceptanceId: { type: "string", pattern: "^AC-[0-9]{3,}$" }
      }),
      256
    ),
    minItems: 1
  },
  taskIds: { ...list({ type: "string", pattern: "^T-[0-9]{3,}$" }, 256), minItems: 1 }
});
var DESIGN_PLANNING_LINEAGE_SCHEMA = contract(
  "design-planning-lineage",
  closed({
    kind: { const: "openplanr-design-planning-lineage" },
    schemaVersion: { const: DESIGN_HANDOFF_CONTRACT_VERSION },
    handoff: closed({ id, version: { type: "integer", minimum: 1 }, contentDigest: digest }),
    specId: { type: "string", pattern: "^SPEC-[0-9]{3,}$" },
    mappings: { ...list(lineageMapping, 1e4), minItems: 1 }
  })
);
var DESIGN_HANDOFF_SCHEMAS = deepFreeze({
  "design-handoff-readiness": DESIGN_HANDOFF_READINESS_SCHEMA,
  "design-implementation-handoff": DESIGN_IMPLEMENTATION_HANDOFF_SCHEMA,
  "design-planning-lineage": DESIGN_PLANNING_LINEAGE_SCHEMA
});
function distinct(items, select, label) {
  const values = items.map(select);
  if (new Set(values).size !== values.length) throw new TypeError(`Duplicate ${label}.`);
}
function isDesignHandoffRelativePath(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 4096 && !/^(?:[A-Za-z]:|\/|[A-Za-z][A-Za-z0-9+.-]*:)|[\\?#%\u0000-\u001f\u007f]/u.test(value) && value.split("/").every(
    (part) => part && part !== "." && part !== ".." && !["__proto__", "prototype", "constructor"].includes(part)
  );
}
function assertDesignHandoffContract(value, schemaOrName) {
  const schema = typeof schemaOrName === "string" ? DESIGN_HANDOFF_SCHEMAS[schemaOrName] : schemaOrName;
  if (!schema) throw new TypeError("Unknown design handoff contract.");
  assertPlainData(value, "Design handoff data");
  canonicalizeJson(value);
  const errors = validateJson(value, schema);
  if (errors.length)
    throw new TypeError(
      `Invalid ${schema["x-openplanr-contract"]?.id ?? "design handoff data"}: ${errors.slice(0, 5).map((error) => `${error.path} (${error.rule})`).join("; ")}`
    );
  return value;
}
function assertEvidenceReferences(evidence2) {
  distinct(evidence2, (item) => item.id, "evidence reference identity");
  for (const item of evidence2)
    if (!isDesignHandoffRelativePath(item.path))
      throw new TypeError("Design handoff evidence requires a repository-relative logical path.");
}
function assertProductCopy(value) {
  if (/\b(?:hash|digest|checksum|sha[- ]?256|canonical(?:ize|ization)?)\b/iu.test(value))
    throw new TypeError("Design readiness guidance must use product language.");
}
function assertDesignHandoffReadiness(value) {
  assertDesignHandoffContract(value, DESIGN_HANDOFF_READINESS_SCHEMA);
  if (value.kind.endsWith("-absence")) {
    assertProductCopy(`${value.message} ${value.nextAction.label}`);
    return value;
  }
  assertEvidenceReferences(value.evidence);
  distinct(value.checks, (item) => item.id, "readiness check identity");
  const expected = DESIGN_HANDOFF_CHECK_IDS.join("\n");
  if (value.checks.map((item) => item.id).join("\n") !== expected)
    throw new TypeError("Design readiness must contain every stable check in canonical order.");
  const evidenceIds = new Set(value.evidence.map((item) => item.id));
  for (const check of value.checks) {
    distinct(check.evidenceRefs, (item) => item, "readiness evidence reference");
    if (check.evidenceRefs.some((reference) => !evidenceIds.has(reference)))
      throw new TypeError("Design readiness references missing evidence.");
    assertProductCopy(`${check.message} ${check.recoveryAction?.label ?? ""}`);
  }
  const priority2 = { pass: 0, attention: 1, blocked: 2, stale: 3 };
  const worst = value.checks.reduce(
    (current, check) => priority2[check.status] > priority2[current] ? check.status : current,
    "pass"
  );
  const expectedStatus = worst === "pass" ? "ready" : worst;
  if (value.status !== expectedStatus)
    throw new TypeError("Design readiness summary does not match its checks.");
  const blockingIds = value.checks.filter((check) => ["blocked", "stale"].includes(check.status)).map((check) => check.id);
  if (value.blockers.join("\n") !== blockingIds.join("\n"))
    throw new TypeError("Design readiness blockers do not match its blocking checks.");
  const actionable = value.checks.filter((check) => check.status !== "pass");
  if (value.nextActions.length !== actionable.length || value.nextActions.some((actionValue, index) => {
    const recoveryAction = actionable[index].recoveryAction;
    return actionValue.id !== recoveryAction?.id || actionValue.label !== recoveryAction?.label;
  }))
    throw new TypeError("Design readiness next actions do not match its checks.");
  if (value.continuation.available !== ["ready", "attention"].includes(value.status))
    throw new TypeError("Design readiness continuation availability does not match its status.");
  return value;
}
function designImplementationHandoffDigest(value) {
  const projection = {
    kind: value.kind,
    schemaVersion: value.schemaVersion,
    id: value.id,
    version: value.version,
    authority: value.authority,
    title: value.title,
    basis: value.basis,
    sources: value.sources,
    requirements: value.requirements,
    markdown: value.markdown
  };
  return `sha256:${sha256Hex(canonicalizeJson(projection))}`;
}
function assertDesignImplementationHandoff(value) {
  assertDesignHandoffContract(value, DESIGN_IMPLEMENTATION_HANDOFF_SCHEMA);
  assertEvidenceReferences(value.sources);
  distinct(value.requirements, (item) => item.id, "implementation requirement identity");
  const sourceIds = new Set(value.sources.map((item) => item.id));
  for (const item of value.requirements) {
    distinct(item.sourceRefs, (reference) => reference, "requirement source reference");
    if (item.sourceRefs.some((reference) => !sourceIds.has(reference)))
      throw new TypeError("Implementation requirement references missing evidence.");
  }
  if (value.contentDigest !== designImplementationHandoffDigest(value))
    throw new TypeError(
      "Implementation handoff content does not match its recorded integrity value."
    );
  if (value.approval?.contentDigest !== void 0 && value.approval.contentDigest !== value.contentDigest)
    throw new TypeError("Implementation handoff approval does not match its content.");
  if (value.status !== "draft" && value.basis.readiness.status !== "ready")
    throw new TypeError(
      "Only a ready implementation handoff can be approved or retained as approved history."
    );
  if (value.supersededBy && value.supersededBy.id === value.id && value.supersededBy.version <= value.version)
    throw new TypeError("A superseding handoff must identify a newer package version.");
  return value;
}

// packages/design/lib/design/handoff-readiness.mjs
var CHECKS = Object.freeze([
  "current-revision",
  "selected-direction",
  "design-specification",
  "rendered-verification",
  "review-freshness",
  "review-dispositions",
  "unresolved-blockers",
  "approved-review-handoff"
]);
var action2 = Object.freeze({
  "current-revision": Object.freeze({ id: "render-design", label: "Render the current design" }),
  "selected-direction": Object.freeze({
    id: "select-direction",
    label: "Choose one ready direction"
  }),
  "design-specification": Object.freeze({
    id: "complete-design-specification",
    label: "Complete the design specification"
  }),
  "rendered-verification": Object.freeze({
    id: "verify-rendered-design",
    label: "Verify the rendered design"
  }),
  "review-freshness": Object.freeze({
    id: "refresh-review",
    label: "Refresh review against the current design"
  }),
  "review-dispositions": Object.freeze({
    id: "resolve-review-decisions",
    label: "Record the remaining review decisions"
  }),
  "unresolved-blockers": Object.freeze({
    id: "resolve-review-blockers",
    label: "Resolve the blocking feedback"
  }),
  "approved-review-handoff": Object.freeze({
    id: "approve-review-handoff",
    label: "Prepare and approve the current review handoff"
  })
});
var message = Object.freeze({
  "current-revision": Object.freeze({
    pass: "The current design has a completed render.",
    blocked: "Render the design before preparing work for engineering."
  }),
  "selected-direction": Object.freeze({
    pass: "One ready design direction is selected.",
    blocked: "Choose one ready design direction before continuing.",
    stale: "The selected direction changed after the review handoff was prepared."
  }),
  "design-specification": Object.freeze({
    pass: "The design specification is complete for this revision.",
    blocked: "Complete the design specification before continuing.",
    stale: "The design specification belongs to an earlier revision."
  }),
  "rendered-verification": Object.freeze({
    pass: "The rendered design is verified for this revision.",
    blocked: "Complete rendered design verification before continuing.",
    stale: "Rendered verification belongs to an earlier revision."
  }),
  "review-freshness": Object.freeze({
    pass: "Review feedback is current for this revision.",
    blocked: "Review feedback contains ambiguous identities or anchors.",
    stale: "Review feedback belongs to an earlier revision."
  }),
  "review-dispositions": Object.freeze({
    pass: "Every current review comment has a recorded outcome.",
    attention: "Some non-blocking review comments still need an owner decision.",
    blocked: "Review decisions are incomplete or ambiguous."
  }),
  "unresolved-blockers": Object.freeze({
    pass: "No blocking feedback remains open.",
    blocked: "Blocking feedback must be resolved before continuing.",
    stale: "A prior decision must be reviewed against the current design."
  }),
  "approved-review-handoff": Object.freeze({
    pass: "The current review handoff is approved.",
    blocked: "Prepare and approve the review handoff before continuing.",
    stale: "The approved review handoff no longer matches the current design."
  })
});
var priority = Object.freeze({ pass: 0, attention: 1, blocked: 2, stale: 3 });
var digestPattern = /^(?:sha256:)?[a-f0-9]{64}$/u;
var normalizeDigest = (value, label) => {
  if (typeof value !== "string" || !digestPattern.test(value))
    throw new TypeError(`${label} must be a lowercase SHA-256 value.`);
  return value.startsWith("sha256:") ? value : `sha256:${value}`;
};
var optionalDigest = (value, label) => value === void 0 || value === null ? void 0 : normalizeDigest(value, label);
var plainClone = (value) => value === void 0 ? void 0 : JSON.parse(canonicalizeJson(value));
var logicalPath = (value, fallback, label) => {
  const result = value ?? fallback;
  if (!isDesignHandoffRelativePath(result) || /[?#%]/u.test(result))
    throw new TypeError(`${label} must be a repository-relative logical path.`);
  return result;
};
var evidenceDigest = (value) => `sha256:${sha256Hex(canonicalizeJson(value))}`;
function ensureUnique(items, select, label) {
  const values = items.map(select);
  if (new Set(values).size !== values.length) throw new TypeError(`Duplicate ${label}.`);
}
function evidence(id2, kind, path, value, { revision, anchor: anchor2 } = {}) {
  return {
    id: id2,
    kind,
    path,
    ...revision ? { revision: normalizeDigest(revision, `${id2} revision`) } : {},
    digest: optionalDigest(value?.digest, `${id2} integrity`) ?? evidenceDigest(value),
    ...anchor2 ? { anchor: anchor2 } : {}
  };
}
function checked(id2, status, evidenceRefs = []) {
  return {
    id: id2,
    status,
    message: message[id2][status],
    evidenceRefs,
    ...status === "pass" ? {} : { recoveryAction: action2[id2] }
  };
}
function selectedDirection(document, studioState) {
  const selected = studioState?.selectedVariant ?? document?.selectedVariant ?? null;
  const variants = Array.isArray(document?.variants) ? document.variants : [];
  ensureUnique(variants, (item) => item?.id, "design direction identity");
  const matches = variants.filter((item) => item?.id === selected && item?.status === "ready");
  return { selected, ready: matches.length === 1 };
}
function normalizedPins(review, revision) {
  const pins = Array.isArray(review?.pins) ? review.pins.map((pin) => ({ ...pin })) : [];
  ensureUnique(
    pins,
    (pin) => `${pin.revisionId ?? pin.reviewId ?? ""}:${pin.id ?? ""}`,
    "review comment identity"
  );
  for (const pin of pins) {
    if (typeof pin.id !== "string" || !pin.id)
      throw new TypeError("Review comments require stable identities.");
    if (pin.elementId && !pin.screenId)
      throw new TypeError("An element review anchor must identify its screen.");
    if (pin.anchorCount !== void 0 && pin.anchorCount !== 1)
      throw new TypeError("Review comments must identify exactly one anchor.");
  }
  return pins.sort(
    (left, right) => `${left.revisionId ?? left.reviewId}:${left.id}`.localeCompare(
      `${right.revisionId ?? right.reviewId}:${right.id}`
    )
  ).map((pin) => ({
    ...pin,
    current: !pin.stale && (!revision || !pin.revisionId || normalizeDigest(pin.revisionId, "review revision") === revision)
  }));
}
function reviewState(input, revision) {
  if (!input) return { pins: [], stale: false, ambiguous: false };
  const pins = normalizedPins(input, revision);
  const recordedRevision = optionalDigest(input.revision, "review revision");
  return {
    pins,
    stale: input.current === false || recordedRevision !== void 0 && recordedRevision !== revision || pins.some((pin) => !pin.current),
    ambiguous: input.ambiguous === true
  };
}
function handoffState(handoff, designId, revision, selectedVariant) {
  if (!handoff) return "blocked";
  if (handoff.status !== "approved" || !handoff.approval || handoff.approval.contentHash !== handoff.contentHash)
    return "blocked";
  const basisRevision = optionalDigest(handoff.basis?.sourceRevision, "review handoff revision");
  if (handoff.current === false || handoff.basis?.designId !== designId || basisRevision !== revision || handoff.basis?.selectedVariant !== selectedVariant)
    return "stale";
  return "pass";
}
function compileDesignHandoffReadiness(input) {
  if (input === null || input === void 0) return designHandoffReadinessAbsence();
  const source = plainClone(input);
  const document = source.document;
  if (!document || document.kind !== "openplanr-design-document" || !["1.0.0", "1.1.0"].includes(document.schemaVersion) || typeof document.id !== "string" || !document.id)
    throw new TypeError("Readiness requires one supported design document.");
  const revision = source.sourceRevision === null || source.sourceRevision === void 0 ? null : normalizeDigest(source.sourceRevision, "design revision");
  const direction = selectedDirection(document, source.studioState);
  const evidenceItems = [];
  if (revision)
    evidenceItems.push(
      evidence(
        "design-revision",
        "design-revision",
        logicalPath(source.documentPath, "design-document.json", "design document path"),
        document,
        { revision }
      )
    );
  const directionEvidence = direction.selected && revision ? evidence(
    "selected-direction",
    "selected-direction",
    logicalPath(source.studioStatePath, ".design/studio-state.json", "Studio state path"),
    { selectedVariant: direction.selected },
    { revision, anchor: { section: direction.selected } }
  ) : null;
  if (directionEvidence) evidenceItems.push(directionEvidence);
  const specification = source.specification;
  if (specification)
    evidenceItems.push(
      evidence(
        "design-specification",
        "design-specification",
        logicalPath(specification.path, "design-spec.md", "design specification path"),
        specification,
        { revision: specification.revision }
      )
    );
  const verification = source.verification;
  if (verification)
    evidenceItems.push(
      evidence(
        "rendered-verification",
        "rendered-verification",
        logicalPath(verification.path, ".design/verification/current.json", "verification path"),
        verification,
        { revision: verification.revision }
      )
    );
  const review = reviewState(source.review, revision);
  if (source.review)
    evidenceItems.push(
      evidence(
        "review-feedback",
        "review-feedback",
        logicalPath(source.review.path, ".design/review.json", "review feedback path"),
        source.review,
        { revision: source.review.revision }
      )
    );
  const handoff = source.reviewHandoff;
  if (handoff)
    evidenceItems.push(
      evidence(
        "review-handoff",
        "review-handoff",
        logicalPath(handoff.path, "review-handoff.json", "review handoff path"),
        handoff,
        { revision: handoff.basis?.sourceRevision }
      )
    );
  const checks = [];
  checks.push(
    checked("current-revision", revision ? "pass" : "blocked", revision ? ["design-revision"] : [])
  );
  const handoffDirection = handoff?.basis?.selectedVariant;
  const directionStatus = !direction.ready ? "blocked" : handoffDirection && handoffDirection !== direction.selected ? "stale" : "pass";
  checks.push(
    checked("selected-direction", directionStatus, directionEvidence ? ["selected-direction"] : [])
  );
  let specificationStatus = "blocked";
  if (specification?.complete === true) {
    const specificationRevision = optionalDigest(
      specification.revision,
      "design specification revision"
    );
    specificationStatus = revision && specificationRevision && specificationRevision !== revision ? "stale" : "pass";
  }
  checks.push(
    checked(
      "design-specification",
      specificationStatus,
      specification ? ["design-specification"] : []
    )
  );
  let verificationStatus = "blocked";
  if (verification) {
    const verificationRevision = optionalDigest(
      verification.revision,
      "rendered verification revision"
    );
    if (revision && verificationRevision && verificationRevision !== revision)
      verificationStatus = "stale";
    else if (verification.status === "verified") verificationStatus = "pass";
  }
  checks.push(
    checked(
      "rendered-verification",
      verificationStatus,
      verification ? ["rendered-verification"] : []
    )
  );
  const reviewRefs = source.review ? ["review-feedback"] : [];
  const freshnessStatus = review.ambiguous ? "blocked" : review.stale ? "stale" : "pass";
  checks.push(checked("review-freshness", freshnessStatus, reviewRefs));
  const undecided = review.pins.filter(
    (pin) => pin.current && !["accepted", "deferred", "rejected"].includes(pin.disposition)
  );
  const invalidDisposition = review.pins.some(
    (pin) => pin.disposition && !["accepted", "deferred", "rejected"].includes(pin.disposition)
  );
  const dispositionStatus = invalidDisposition || review.ambiguous ? "blocked" : undecided.length ? "attention" : "pass";
  checks.push(checked("review-dispositions", dispositionStatus, reviewRefs));
  const openBlockers = review.pins.filter(
    (pin) => pin.current && ["blocker", "change-request"].includes(pin.category) && !["accepted", "deferred", "rejected"].includes(pin.disposition)
  );
  const staleAccepted = review.pins.some((pin) => !pin.current && pin.disposition === "accepted");
  const blockerStatus = staleAccepted ? "stale" : openBlockers.length ? "blocked" : "pass";
  checks.push(checked("unresolved-blockers", blockerStatus, reviewRefs));
  const approvalStatus = handoffState(handoff, document.id, revision, direction.selected);
  checks.push(
    checked("approved-review-handoff", approvalStatus, handoff ? ["review-handoff"] : [])
  );
  if (checks.map((item) => item.id).join("\n") !== CHECKS.join("\n"))
    throw new TypeError("Readiness checks are not in canonical order.");
  const worst = checks.reduce(
    (current, item) => priority[item.status] > priority[current] ? item.status : current,
    "pass"
  );
  const status = worst === "pass" ? "ready" : worst;
  const blockers = checks.filter((item) => ["blocked", "stale"].includes(item.status)).map((item) => item.id);
  const nextActions = checks.filter((item) => item.status !== "pass").map((item) => item.recoveryAction);
  return assertDesignHandoffReadiness({
    kind: "openplanr-design-handoff-readiness",
    schemaVersion: "1.0.0",
    scope: "design-originated",
    authority: "none",
    designId: document.id,
    sourceRevision: revision,
    selectedVariant: direction.selected,
    status,
    continuation: { action: "prepare-plan", available: ["ready", "attention"].includes(status) },
    checks,
    evidence: evidenceItems.sort((left, right) => left.id.localeCompare(right.id)),
    blockers,
    nextActions
  });
}
function designHandoffReadinessAbsence(reason = "not-computed") {
  return assertDesignHandoffReadiness({
    kind: "openplanr-design-handoff-readiness-absence",
    schemaVersion: "1.0.0",
    status: "absent",
    reason,
    message: "No design handoff readiness has been prepared.",
    nextAction: {
      id: "inspect-design",
      label: "Open the design when you want to prepare a handoff"
    }
  });
}
function designHandoffReadinessDigest(value) {
  assertDesignHandoffReadiness(value);
  return `sha256:${sha256Hex(canonicalizeJson(value))}`;
}

// packages/design/lib/design/handoff-resolution.mjs
var OUTCOMES = /* @__PURE__ */ new Set(["accepted", "open", "blocking", "deferred", "declined"]);
var CATEGORIES = /* @__PURE__ */ new Set(["question", "suggestion", "change-request", "blocker"]);
var DISPOSITIONS = /* @__PURE__ */ new Set(["accepted", "deferred", "rejected", "declined"]);
var MAX_COMMENTS = 1e4;
var MAX_ISSUES = 1e4;
var digestPattern2 = /^[a-f0-9]{64}$/u;
var revisionOf = (pin) => pin.revisionId ?? pin.reviewId;
var keyOf = (pin) => `${revisionOf(pin)}:${pin.id}`;
var compare = (left, right) => left.localeCompare(right, "en");
var clone3 = (value) => {
  assertPlainData(value, "Review resolution data");
  return JSON.parse(canonicalizeJson(value));
};
function issue(code, severity, message2, { pinId, revisionId, recoveryAction } = {}) {
  return {
    code,
    severity,
    message: message2,
    ...revisionId ? { revisionId } : {},
    ...pinId ? { pinId } : {},
    recoveryAction: recoveryAction ?? {
      id: "refresh-review-resolution",
      label: "Refresh review decisions"
    }
  };
}
function validatePin(pin) {
  if (!pin || typeof pin !== "object" || Array.isArray(pin))
    throw new TypeError("Every review comment must be an object.");
  if (typeof pin.id !== "string" || !pin.id || pin.id.length > 160)
    throw new TypeError("Every review comment requires a stable identity.");
  const revisionId = revisionOf(pin);
  if (typeof revisionId !== "string" || !revisionId || revisionId.length > 160)
    throw new TypeError("Every review comment requires its original revision identity.");
  if (typeof pin.reviewOf !== "string" || !digestPattern2.test(pin.reviewOf))
    throw new TypeError("Every review comment requires its original review basis.");
  if (pin.screenId !== void 0 && (typeof pin.screenId !== "string" || !pin.screenId))
    throw new TypeError("Review screen references must be stable identities.");
  if (pin.elementId !== void 0 && (typeof pin.elementId !== "string" || !pin.elementId || !pin.screenId))
    throw new TypeError("Review element references require a stable screen identity.");
}
function scopedMetadata(metadata2, pin, duplicatePinIds, diagnostics) {
  const revisionId = revisionOf(pin);
  const scoped = metadata2.byRevision?.[revisionId] ?? {};
  let category = scoped.categories?.[pin.id];
  let disposition = scoped.dispositions?.[pin.id];
  if (category === void 0 && Object.hasOwn(metadata2.categories ?? {}, pin.id)) {
    if (duplicatePinIds.has(pin.id))
      diagnostics.push(
        issue(
          "AMBIGUOUS_LEGACY_CATEGORY",
          "blocked",
          "A legacy category cannot be matched to one original revision.",
          { pinId: pin.id, revisionId }
        )
      );
    else category = metadata2.categories[pin.id];
  }
  if (disposition === void 0 && Object.hasOwn(metadata2.dispositions ?? {}, pin.id)) {
    if (duplicatePinIds.has(pin.id))
      diagnostics.push(
        issue(
          "AMBIGUOUS_LEGACY_DISPOSITION",
          "blocked",
          "A legacy owner decision cannot be matched to one original revision.",
          { pinId: pin.id, revisionId }
        )
      );
    else disposition = metadata2.dispositions[pin.id];
  }
  if (category !== void 0 && !CATEGORIES.has(category)) {
    diagnostics.push(
      issue("UNKNOWN_CATEGORY", "blocked", "The comment category is not supported.", {
        pinId: pin.id,
        revisionId
      })
    );
    category = void 0;
  }
  const dispositionValue = typeof disposition === "string" ? disposition : disposition?.disposition;
  if (dispositionValue !== void 0 && !DISPOSITIONS.has(dispositionValue)) {
    diagnostics.push(
      issue("UNKNOWN_DISPOSITION", "blocked", "The owner decision is not supported.", {
        pinId: pin.id,
        revisionId
      })
    );
    disposition = void 0;
  }
  return {
    category,
    disposition,
    dispositionValue: typeof disposition === "string" ? disposition : disposition?.disposition
  };
}
function unknownMetadata(metadata2, known, diagnostics) {
  for (const [revisionId, value] of Object.entries(metadata2.byRevision ?? {}).sort(
    ([left], [right]) => compare(left, right)
  )) {
    for (const field of ["categories", "dispositions"]) {
      for (const pinId of Object.keys(value?.[field] ?? {}).sort(compare)) {
        if (!known.has(`${revisionId}:${pinId}`))
          diagnostics.push(
            issue(
              "UNKNOWN_COMMENT_METADATA",
              "blocked",
              "Review metadata targets a comment that is not present in the recorded review history.",
              { revisionId, pinId }
            )
          );
      }
    }
  }
}
function compileDesignHandoffResolution(input) {
  const source = clone3(input ?? {});
  const pins = Array.isArray(source.pins) ? source.pins : [];
  if (pins.length > MAX_COMMENTS)
    throw new RangeError("Review resolution exceeds the comment limit.");
  const metadata2 = source.metadata && typeof source.metadata === "object" && !Array.isArray(source.metadata) ? source.metadata : {};
  const diagnostics = [];
  const counts = /* @__PURE__ */ new Map();
  for (const pin of pins) {
    validatePin(pin);
    counts.set(pin.id, (counts.get(pin.id) ?? 0) + 1);
  }
  const duplicatePinIds = new Set([...counts].filter(([, count]) => count > 1).map(([id2]) => id2));
  const known = /* @__PURE__ */ new Set();
  for (const pin of pins) {
    const key = keyOf(pin);
    if (known.has(key)) throw new TypeError(`Duplicate review comment identity: ${key}.`);
    known.add(key);
  }
  unknownMetadata(metadata2, known, diagnostics);
  const items = [...pins].sort((left, right) => compare(keyOf(left), keyOf(right))).map((pin) => {
    const revisionId = revisionOf(pin);
    const current = pin.stale !== true && (!source.currentReviewOf || pin.reviewOf === source.currentReviewOf);
    const resolved = scopedMetadata(metadata2, pin, duplicatePinIds, diagnostics);
    let outcome;
    if (resolved.dispositionValue === "accepted") outcome = "accepted";
    else if (resolved.dispositionValue === "deferred") outcome = "deferred";
    else if (["rejected", "declined"].includes(resolved.dispositionValue)) outcome = "declined";
    else if (["blocker", "change-request"].includes(resolved.category)) outcome = "blocking";
    else outcome = "open";
    if (!OUTCOMES.has(outcome)) throw new Error("Review resolution produced an invalid outcome.");
    if (!current && outcome === "accepted")
      diagnostics.push(
        issue(
          "STALE_ACCEPTED_DECISION",
          "stale",
          "An accepted change belongs to an earlier design revision and must be reviewed again.",
          {
            pinId: pin.id,
            revisionId,
            recoveryAction: {
              id: "review-stale-decision",
              label: "Review this decision against the current design"
            }
          }
        )
      );
    if (current && outcome === "blocking")
      diagnostics.push(
        issue(
          "UNRESOLVED_BLOCKING_COMMENT",
          "blocked",
          "A blocking comment still needs an owner decision.",
          {
            pinId: pin.id,
            revisionId,
            recoveryAction: {
              id: "resolve-blocking-comment",
              label: "Record the owner decision"
            }
          }
        )
      );
    return {
      id: keyOf(pin),
      pinId: pin.id,
      reviewId: pin.reviewId,
      revisionId,
      reviewOf: pin.reviewOf,
      current,
      category: resolved.category ?? "question",
      outcome,
      implementationScope: current && outcome === "accepted",
      anchor: pin.elementId ? { screenId: pin.screenId, elementId: pin.elementId } : pin.screenId ? { screenId: pin.screenId } : pin.anchor?.planrId ? { planrId: pin.anchor.planrId } : { artifactId: pin.artifactId },
      source: {
        text: pin.comment,
        author: clone3(pin.author),
        status: pin.status,
        ...resolved.disposition && typeof resolved.disposition === "object" ? { decision: clone3(resolved.disposition) } : {}
      }
    };
  });
  if (source.historyComplete === false)
    diagnostics.push(
      issue("INCOMPLETE_REVIEW_HISTORY", "blocked", "The complete review history is unavailable.", {
        recoveryAction: {
          id: "restore-review-history",
          label: "Restore the complete review history"
        }
      })
    );
  if (source.synchronizationPending === true)
    diagnostics.push(
      issue(
        "SYNCHRONIZATION_PENDING",
        "blocked",
        "A review decision is still waiting to synchronize.",
        {
          recoveryAction: {
            id: "retry-review-sync",
            label: "Retry review synchronization"
          }
        }
      )
    );
  for (const value of (source.synchronizationIssues ?? []).slice(0, MAX_ISSUES))
    diagnostics.push(
      issue(
        "UNTRUSTED_HOSTED_FEEDBACK",
        "blocked",
        value?.reason || "Hosted feedback could not be validated.",
        {
          pinId: value?.pinId,
          revisionId: value?.revisionId,
          recoveryAction: {
            id: "inspect-review-sync",
            label: "Inspect the rejected hosted feedback"
          }
        }
      )
    );
  if ((source.synchronizationIssues ?? []).length > MAX_ISSUES)
    throw new RangeError("Review resolution exceeds the synchronization issue limit.");
  diagnostics.sort(
    (left, right) => compare(
      `${left.code}:${left.revisionId ?? ""}:${left.pinId ?? ""}:${left.message}`,
      `${right.code}:${right.revisionId ?? ""}:${right.pinId ?? ""}:${right.message}`
    )
  );
  const severity = new Set(diagnostics.map((value) => value.severity));
  const status = severity.has("stale") ? "stale" : severity.has("blocked") ? "blocked" : items.some((item) => item.outcome === "open") ? "attention" : "ready";
  return {
    kind: "openplanr-design-handoff-resolution",
    schemaVersion: "1.0.0",
    currentReviewOf: source.currentReviewOf ?? null,
    status,
    complete: source.historyComplete !== false && !["blocked", "stale"].includes(status),
    items,
    implementationScope: items.filter((item) => item.implementationScope).map((item) => item.id),
    diagnostics
  };
}
function canApproveDesignHandoffResolution(value) {
  return Boolean(value?.complete && ["ready", "attention"].includes(value.status));
}

// packages/design/lib/design/handoff-reader.mjs
var sections = ["agreedChanges", "openQuestions", "deferred", "rejected"];
var metadataPath = (current) => join3(current.root, ".design/review-metadata.json");
var revisionOf2 = (pin) => pin.revisionId ?? pin.reviewId;
var pinKey = (pin) => `${revisionOf2(pin)}:${pin.id}`;
function metadata(current, feedback) {
  const local = readJson(metadataPath(current), { version: 0, byRevision: {} });
  const byRevision = structuredClone(feedback.shared?.metadataByRevision ?? {});
  for (const [revision, value] of Object.entries(local.byRevision ?? {})) {
    const remote = byRevision[revision] ?? {};
    byRevision[revision] = {
      categories: { ...remote.categories, ...value.categories },
      dispositions: { ...remote.dispositions, ...value.dispositions }
    };
  }
  const counts = /* @__PURE__ */ new Map();
  for (const pin of feedback.pins) counts.set(pin.id, (counts.get(pin.id) ?? 0) + 1);
  const categories = {}, dispositions = {};
  for (const pin of feedback.pins) {
    const value = byRevision[revisionOf2(pin)];
    if (counts.get(pin.id) === 1 && value) {
      if (Object.hasOwn(value.categories ?? {}, pin.id))
        Object.defineProperty(categories, pin.id, {
          value: value.categories[pin.id],
          enumerable: true
        });
      if (Object.hasOwn(value.dispositions ?? {}, pin.id))
        Object.defineProperty(dispositions, pin.id, {
          value: value.dispositions[pin.id],
          enumerable: true
        });
    }
    if (counts.get(pin.id) === 1 && !Object.hasOwn(categories, pin.id) && Object.hasOwn(local.categories ?? {}, pin.id))
      Object.defineProperty(categories, pin.id, {
        value: local.categories[pin.id],
        enumerable: true
      });
    if (counts.get(pin.id) === 1 && !Object.hasOwn(dispositions, pin.id) && Object.hasOwn(local.dispositions ?? {}, pin.id))
      Object.defineProperty(dispositions, pin.id, {
        value: local.dispositions[pin.id],
        enumerable: true
      });
  }
  return {
    version: local.version,
    categories,
    dispositions,
    byRevision,
    legacy: {
      categories: structuredClone(local.categories ?? {}),
      dispositions: structuredClone(local.dispositions ?? {})
    }
  };
}
function findPin(pins, id2, revision) {
  const candidates = pins.filter(
    (pin) => pin.id === id2 && (!revision || revisionOf2(pin) === revision)
  );
  if (candidates.length !== 1)
    throw new Error(
      "The comment identity is missing or ambiguous. Include its original revisionId."
    );
  return candidates[0];
}
function resolutionFor(value, shareStatus) {
  return compileDesignHandoffResolution({
    currentReviewOf: value.basis.reviewOf,
    pins: value.feedback.pins,
    metadata: {
      byRevision: value.metadata.byRevision,
      categories: value.metadata.legacy.categories,
      dispositions: value.metadata.legacy.dispositions
    },
    historyComplete: !value.feedback.shared?.issues?.length,
    synchronizationPending: Boolean(shareStatus?.pendingReviewMetadata),
    synchronizationIssues: value.feedback.shared?.issues ?? []
  });
}
function snapshot(file, env, shareOptions = {}) {
  const current = currentDesign(file, shareOptions), feedback = readDesignFeedback(file, env, shareOptions), meta = metadata(current, feedback);
  const reviewContext = current.reviewContext ?? emptyReviewContext(current.document);
  const basis = {
    designId: current.document.id,
    sourceRevision: current.revision,
    contextDigest: current.contextDigest ?? reviewDigest(reviewContext),
    reviewOf: digestArtifactEnvelope(current.envelope),
    selectedVariant: feedback.state.selectedVariant ?? current.document.selectedVariant,
    feedbackDigest: reviewDigest({
      pins: feedback.pins,
      metadata: {
        byRevision: meta.byRevision,
        categories: meta.categories,
        dispositions: meta.dispositions
      },
      overall: (feedback.ledger?.reviews ?? []).map((entry) => ({
        reviewId: entry.review.reviewId,
        reviewOf: entry.review.reviewOf,
        overall: entry.review.overall
      })),
      directions: feedback.shared?.directions ?? []
    }),
    verificationDigest: reviewDigest(current.verification),
    feedbackWatermark: Math.max(
      0,
      ...(feedback.shared?.events ?? []).map((event) => event.sequence ?? 0)
    )
  };
  let shareStatus = null;
  try {
    shareStatus = getDesignShareStatus(file, { env, ...shareOptions });
  } catch (error) {
    if (error.code === "E_DESIGN_PUBLICATION_PENDING") throw error;
  }
  const value = { current, feedback, metadata: meta, reviewContext, basis };
  return { ...value, resolution: resolutionFor(value, shareStatus), shareStatus };
}
function readDesignExperience(file, { env = process.env } = {}) {
  const value = snapshot(file, env);
  return {
    ok: true,
    capabilities: { owner: true, revisions: true, handoff: true },
    revision: value.current.revision,
    reviewContext: value.reviewContext,
    contextDigest: value.basis.contextDigest,
    fingerprints: value.current.fingerprints ?? [],
    metadata: value.metadata,
    loadingHistory: false
  };
}
function readDesignHandoff(file, { env = process.env, ...shareOptions } = {}) {
  const value = snapshot(file, env, shareOptions);
  const path = join3(dirname3(designSpecPath(value.current.root)), "review-handoff.json");
  const draft = readJson(path, null);
  if (draft) {
    assertDraft(draft);
    const markdownPath = path.replace(/\.json$/u, ".md");
    if (!existsSync3(markdownPath) || readFileSync3(markdownPath, "utf8") !== draft.markdown)
      throw new Error(
        "The handoff Markdown differs from its approved JSON. Rebuild the handoff projection before using it in Plan."
      );
  }
  return {
    ok: true,
    path,
    revision: value.current.revision,
    draft,
    current: Boolean(draft && reviewDigest(draft.basis) === reviewDigest(value.basis)),
    metadata: value.metadata,
    feedback: { pins: value.feedback.pins },
    basis: value.basis,
    resolution: value.resolution
  };
}
function readDesignHandoffReadiness(file, { env = process.env, ...shareOptions } = {}) {
  const value = snapshot(file, env, shareOptions);
  const path = join3(dirname3(designSpecPath(value.current.root)), "review-handoff.json");
  const handoff = readJson(path, null);
  if (handoff) assertDraft(handoff);
  const outcomes = new Map(value.resolution.items.map((item) => [item.id, item]));
  const pins = value.feedback.pins.map((pin) => {
    const resolved = outcomes.get(pinKey(pin));
    const disposition = resolved?.outcome === "accepted" ? "accepted" : resolved?.outcome === "deferred" ? "deferred" : resolved?.outcome === "declined" ? "rejected" : void 0;
    return {
      id: pin.id,
      ...pin.screenId ? { screenId: pin.screenId } : {},
      ...pin.anchor?.planrId ? { elementId: pin.anchor.planrId } : {},
      category: resolved?.category,
      ...disposition ? { disposition } : {},
      stale: Boolean(pin.stale)
    };
  });
  const specificationPath = designSpecPath(value.current.root);
  const specification = existsSync3(specificationPath) ? {
    path: "design-spec.md",
    revision: value.current.revision,
    digest: `sha256:${hash(readFileSync3(specificationPath))}`,
    complete: true
  } : void 0;
  const studioState = readJson(join3(value.current.root, ".design/studio-state.json"), {
    state: {}
  }).state;
  const readiness = compileDesignHandoffReadiness({
    document: value.current.document,
    documentPath: "design-document.json",
    sourceRevision: value.current.revision,
    studioState,
    studioStatePath: ".design/studio-state.json",
    specification,
    verification: { path: ".design/verification/current.json", ...value.current.verification },
    review: {
      path: ".design/review.json",
      revision: value.current.revision,
      current: pins.every((pin) => !pin.stale),
      pins
    },
    reviewHandoff: handoff ? {
      ...handoff,
      path: "review-handoff.json",
      digest: `sha256:${handoff.contentHash}`,
      current: reviewDigest(handoff.basis) === reviewDigest(value.basis)
    } : void 0
  });
  return { ok: true, readiness, digest: designHandoffReadinessDigest(readiness) };
}
function assertDraft(draft) {
  assertReviewExperience(draft, DESIGN_HANDOFF_SCHEMA);
  const expected = reviewDigest({
    title: draft.title,
    reviewNotes: draft.reviewNotes,
    basis: draft.basis,
    content: draft.content,
    affectedScreens: draft.affectedScreens ?? [],
    verificationGaps: draft.verificationGaps ?? []
  });
  if (draft.contentHash !== expected || draft.status === "approved" && draft.approval?.contentHash !== expected)
    throw new Error(
      "The handoff content does not match its approval digest. Refine it through the handoff utility."
    );
  if (draft.markdown !== renderMarkdown(draft, draft.title))
    throw new Error("The handoff Markdown does not match its approved content.");
  return draft;
}

// packages/design/lib/design/handoff.mjs
import { existsSync as existsSync4, writeFileSync as writeFileSync3 } from "node:fs";
import { dirname as dirname4, join as join4 } from "node:path";
var conflict2 = (message2) => Object.assign(new Error(message2), { statusCode: 409 });
function sourceItem(pin, shareUrl) {
  const source = pin.revisionId ? `${shareUrl ?? ""}#revision=${encodeURIComponent(pin.revisionId)}&pin=${encodeURIComponent(pin.id)}` : `#review=${encodeURIComponent(pin.reviewId)}&pin=${encodeURIComponent(pin.id)}`;
  return {
    pinId: pin.id,
    ...pin.screenId ? { screenId: pin.screenId } : {},
    reviewId: pin.reviewId,
    ...pin.revisionId ? { revisionId: pin.revisionId } : {},
    text: pin.comment,
    author: pin.author.name,
    reviewOf: pin.reviewOf,
    stale: Boolean(pin.stale),
    source
  };
}
function contentFromFeedback(value, shareUrl) {
  const content = { summary: "", agreedChanges: [], openQuestions: [], deferred: [], rejected: [] };
  const pins = new Map(value.feedback.pins.map((pin) => [pinKey(pin), pin]));
  for (const resolved of value.resolution.items) {
    const pin = pins.get(resolved.id);
    const item = sourceItem(pin, shareUrl);
    if (resolved.outcome === "accepted") content.agreedChanges.push(item);
    else if (resolved.outcome === "deferred") content.deferred.push(item);
    else if (resolved.outcome === "declined") content.rejected.push(item);
    else content.openQuestions.push(item);
  }
  return content;
}
function enrichContent(content, value, shareUrl) {
  assertReviewExperience(content, DESIGN_HANDOFF_CONTENT_SCHEMA);
  const seen = /* @__PURE__ */ new Set();
  const enriched = { summary: content.summary };
  for (const key of sections)
    enriched[key] = content[key].map((item) => {
      const pin = findPin(value.feedback.pins, item.pinId, item.revisionId ?? item.reviewId);
      if (seen.has(pinKey(pin)))
        throw new Error("Handoff items must cite distinct recorded comments.");
      seen.add(pinKey(pin));
      const resolved = value.resolution.items.find((itemValue) => itemValue.id === pinKey(pin));
      const expected = key === "agreedChanges" ? ["accepted"] : key === "deferred" ? ["deferred"] : key === "rejected" ? ["declined"] : ["open", "blocking"];
      if (!resolved || !expected.includes(resolved.outcome))
        throw new Error(
          "Record the owner disposition before moving a comment into this handoff section."
        );
      const refinement = item.refinement ?? (item.text !== pin.comment ? item.text : void 0);
      return { ...sourceItem(pin, shareUrl), ...refinement !== void 0 ? { refinement } : {} };
    });
  for (const pin of value.feedback.pins)
    if (!seen.has(pinKey(pin)))
      throw new Error(
        `Keep every recorded review comment in the handoff; ${pinKey(pin)} is missing.`
      );
  return enriched;
}
function normalizedLocalMetadata(local, pins) {
  const byRevision = structuredClone(local.byRevision ?? {});
  const counts = /* @__PURE__ */ new Map();
  for (const pin of pins) counts.set(pin.id, (counts.get(pin.id) ?? 0) + 1);
  for (const field of ["categories", "dispositions"]) {
    for (const [pinId, item] of Object.entries(local[field] ?? {})) {
      if (counts.get(pinId) !== 1) continue;
      const pin = pins.find((value) => value.id === pinId);
      const revision = revisionOf2(pin);
      const scoped = byRevision[revision] ?? { categories: {}, dispositions: {} };
      byRevision[revision] = { ...scoped, [field]: { ...scoped[field], [pinId]: item } };
    }
  }
  return { version: local.version ?? 0, byRevision };
}
async function preserveReviewErrors(path, action3) {
  let failure, result;
  await withArtifactReviewLock(path, async () => {
    try {
      result = await action3();
    } catch (error) {
      failure = error;
    }
  });
  if (failure) throw failure;
  return result;
}
async function updateDesignHandoff(file, input, { env = process.env, ...shareOptions } = {}) {
  if (!input || !["draft", "update", "approve", "category", "disposition"].includes(input.action))
    throw new Error("Unknown design handoff action.");
  const initial = currentDesign(file);
  const unlockRender = await acquireStartLock(join4(initial.root, ".design/render.lock"));
  let outgoing;
  try {
    const unlock = await acquireStartLock(join4(initial.root, ".design/handoff.lock"));
    try {
      await preserveReviewErrors(designReviewPath(file, env), async () => {
        const value = snapshot(file, env, shareOptions);
        if (input.revision !== value.current.revision)
          throw conflict2("The design changed. Refresh the review before updating its handoff.");
        if (["category", "disposition"].includes(input.action)) {
          if (input.version !== value.metadata.version)
            throw conflict2("Review organization changed in another window. Reload before saving.");
          const pin = findPin(value.feedback.pins, input.pinId, input.revisionId ?? input.reviewId);
          if (!pin) throw new Error("The comment is no longer available.");
          const choices = input.action === "category" ? ["question", "suggestion", "change-request", "blocker"] : ["accepted", "deferred", "rejected"];
          if (!choices.includes(input[input.action])) throw new Error(`Invalid ${input.action}.`);
          if (typeof (input.reason ?? "") !== "string" || (input.reason ?? "").length > 16384)
            throw new Error("Disposition reason is too long.");
          if (pin.revisionId) assertDesignShareAvailable({ env, ...shareOptions });
          const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          const local = normalizedLocalMetadata(
            readJson(metadataPath(value.current), { version: 0, byRevision: {} }),
            value.feedback.pins
          );
          const revision = revisionOf2(pin);
          const scoped = local.byRevision?.[revision] ?? { categories: {}, dispositions: {} };
          const valueForRevision = { ...scoped };
          if (input.action === "category")
            valueForRevision.categories = { ...scoped.categories, [pin.id]: input.category };
          else
            valueForRevision.dispositions = {
              ...scoped.dispositions,
              [pin.id]: {
                disposition: input.disposition,
                reason: input.reason ?? "",
                updatedAt,
                author: "Design owner"
              }
            };
          const next = {
            version: value.metadata.version + 1,
            byRevision: { ...local.byRevision, [revision]: valueForRevision }
          };
          atomicJson(metadataPath(value.current), next);
          if (pin.revisionId)
            outgoing = {
              revisionId: pin.revisionId,
              payload: {
                schemaVersion: input.category === "change-request" ? "1.1.0" : "1.0.0",
                kind: input.action,
                author: "Design owner",
                reviewOf: pin.reviewOf,
                pinId: pin.id,
                [input.action]: input[input.action],
                ...input.action === "disposition" ? { reason: input.reason ?? "" } : {},
                updatedAt
              }
            };
          return;
        }
        const path = join4(dirname4(designSpecPath(value.current.root)), "review-handoff.json");
        const previous = readJson(path, null);
        if (previous) assertDraft(previous);
        if (input.version !== (previous?.version ?? 0))
          throw conflict2("The handoff changed in another window. Reload before saving.");
        let shareUrl;
        try {
          shareUrl = getDesignShareStatus(file, { env, ...shareOptions }).url;
        } catch {
        }
        if (input.action === "approve") {
          if (!previous || input.contentHash !== previous.contentHash || reviewDigest(previous.basis) !== reviewDigest(value.basis))
            throw conflict2(
              "The handoff is out of date. Rebuild and review the current draft before approving."
            );
          if (!canApproveDesignHandoffResolution(value.resolution)) {
            const diagnostic = value.resolution.diagnostics[0];
            throw conflict2(
              diagnostic?.message ?? "Resolve the blocking review decisions before approving this handoff."
            );
          }
          if (!previous.content.summary.trim())
            throw new Error("Write or refine the handoff summary before approving it.");
          const approved = {
            ...previous,
            version: previous.version + 1,
            status: "approved",
            approval: { contentHash: previous.contentHash, at: (/* @__PURE__ */ new Date()).toISOString() }
          };
          approved.markdown = renderMarkdown(approved, value.current.document.title);
          assertReviewExperience(approved, DESIGN_HANDOFF_SCHEMA);
          const archive = join4(
            value.current.root,
            ".design/handoff-approvals",
            `${approved.contentHash}.json`
          );
          if (!existsSync4(archive)) atomicJson(archive, approved);
          atomicJson(path, approved);
          writeFileSync3(path.replace(/\.json$/u, ".md"), approved.markdown);
          return;
        }
        const content = input.action === "draft" ? contentFromFeedback(value, shareUrl) : enrichContent(input.content, value, shareUrl);
        if (input.action === "update" && (!previous || reviewDigest(previous.basis) !== reviewDigest(value.basis)))
          throw conflict2("The review changed. Rebuild the draft before refining it.");
        const affectedScreens = [
          ...new Set(
            sections.flatMap((key) => content[key].map((item) => item.screenId).filter(Boolean))
          )
        ];
        const verificationGaps = value.current.verification.status === "verified" ? [] : [`Rendered design verification: ${value.current.verification.status}.`];
        for (const issue2 of value.current.verification.issues ?? [])
          if (issue2.message && verificationGaps.length < 256) verificationGaps.push(issue2.message);
        const reviewNotes = (value.feedback.ledger?.reviews ?? []).filter((entry) => entry.review.overall?.trim()).map((entry) => ({ reviewId: entry.review.reviewId, text: entry.review.overall }));
        const title2 = value.current.document.title;
        const draft = {
          title: title2,
          reviewNotes,
          kind: "openplanr-design-review-handoff",
          schemaVersion: "1.0.0",
          version: (previous?.version ?? 0) + 1,
          status: "draft",
          basis: value.basis,
          content,
          affectedScreens,
          verificationGaps,
          contentHash: reviewDigest({
            title: title2,
            reviewNotes,
            basis: value.basis,
            content,
            affectedScreens,
            verificationGaps
          }),
          markdown: ""
        };
        draft.markdown = renderMarkdown(draft, value.current.document.title);
        assertReviewExperience(draft, DESIGN_HANDOFF_SCHEMA);
        atomicJson(path, draft);
        writeFileSync3(path.replace(/\.json$/u, ".md"), draft.markdown);
      });
    } finally {
      unlock();
    }
  } finally {
    unlockRender();
  }
  let synchronization;
  if (outgoing) {
    try {
      synchronization = await publishDesignReviewMetadata(file, outgoing.payload, {
        revisionId: outgoing.revisionId,
        env,
        ...shareOptions
      });
    } catch (error) {
      synchronization = {
        pending: false,
        error: error.message,
        ...error.code ? { code: error.code } : {}
      };
    }
  }
  return {
    ...readDesignHandoff(file, { env, ...shareOptions }),
    ...synchronization ? { synchronization } : {}
  };
}

export {
  PLANNING_FOLDER,
  CLI_COMMAND,
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
  designReviewKey,
  designReviewPath,
  readDesignFeedback,
  isDesignHandoffRelativePath,
  designImplementationHandoffDigest,
  assertDesignImplementationHandoff,
  readDesignExperience,
  readDesignHandoff,
  readDesignHandoffReadiness,
  updateDesignHandoff
};
