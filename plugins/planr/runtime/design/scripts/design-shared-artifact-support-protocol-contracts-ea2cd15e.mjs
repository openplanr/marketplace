import {
  LARGE_OBJECT_LIMITS,
  validateJson
} from "./design-shared-protocol-contracts-31a760fc.mjs";

// packages/protocol/src/errors.mjs
var ARTIFACT_ERROR_CODES = Object.freeze({
  INPUT_INVALID: "E_ARTIFACT_INPUT_INVALID",
  FILE_MISSING: "E_ARTIFACT_FILE_MISSING",
  ROOT_MISSING: "E_ARTIFACT_ROOT_MISSING",
  PATH_TRAVERSAL: "E_ARTIFACT_PATH_TRAVERSAL",
  SYMLINK_ESCAPE: "E_ARTIFACT_SYMLINK_ESCAPE",
  EXTERNAL_ASSET: "E_ARTIFACT_EXTERNAL_ASSET",
  UNRESOLVED_ASSET: "E_ARTIFACT_UNRESOLVED_ASSET",
  UNSUPPORTED_MODULE: "E_ARTIFACT_UNSUPPORTED_MODULE",
  UNSAFE_HTML: "E_ARTIFACT_UNSAFE_HTML",
  FILE_LIMIT: "E_ARTIFACT_FILE_LIMIT",
  BYTE_LIMIT: "E_ARTIFACT_BYTE_LIMIT",
  OUTPUT_LIMIT: "E_ARTIFACT_OUTPUT_LIMIT",
  REDACTION: "E_ARTIFACT_REDACTION",
  ENVELOPE_INVALID: "E_ARTIFACT_ENVELOPE_INVALID",
  SCHEMA_UNSUPPORTED: "E_ARTIFACT_SCHEMA_UNSUPPORTED",
  LOOPBACK_BIND: "E_ARTIFACT_LOOPBACK_BIND",
  LOOPBACK_STATE: "E_ARTIFACT_LOOPBACK_STATE",
  PORT_IN_USE: "E_ARTIFACT_PORT_IN_USE",
  SESSION_TOKEN: "E_ARTIFACT_SESSION_TOKEN",
  SESSION_NOT_FOUND: "E_ARTIFACT_SESSION_NOT_FOUND",
  REQUEST_INVALID: "E_ARTIFACT_REQUEST_INVALID",
  REQUEST_LIMIT: "E_ARTIFACT_REQUEST_LIMIT",
  SANDBOX_POLICY: "E_ARTIFACT_SANDBOX_POLICY",
  BRIDGE_INVALID: "E_ARTIFACT_BRIDGE_INVALID",
  REVIEW_INVALID: "E_ARTIFACT_REVIEW_INVALID",
  REVIEW_WRITE: "E_ARTIFACT_REVIEW_WRITE",
  REVIEW_IMPORT: "E_ARTIFACT_REVIEW_IMPORT",
  REVIEW_DECODER_REQUIRED: "E_ARTIFACT_REVIEW_DECODER_REQUIRED",
  REVIEW_EXPORT: "E_ARTIFACT_REVIEW_EXPORT",
  DIGEST_MISMATCH: "E_ARTIFACT_DIGEST_MISMATCH",
  STALE_REVIEW: "E_ARTIFACT_STALE_REVIEW",
  MERGE_CONFLICT: "E_ARTIFACT_MERGE_CONFLICT",
  CODEC_INVALID: "E_ARTIFACT_CODEC_INVALID",
  CODEC_UNAVAILABLE: "E_ARTIFACT_CODEC_UNAVAILABLE",
  CODEC_FAILED: "E_ARTIFACT_CODEC_FAILED",
  FRAGMENT_INVALID: "E_ARTIFACT_FRAGMENT_INVALID",
  FRAGMENT_VERSION_UNSUPPORTED: "E_ARTIFACT_FRAGMENT_VERSION_UNSUPPORTED",
  FRAGMENT_TOO_LARGE: "E_ARTIFACT_FRAGMENT_TOO_LARGE",
  DECOMPRESSION_LIMIT: "E_ARTIFACT_DECOMPRESSION_LIMIT",
  BROWSER_UNSUPPORTED: "E_ARTIFACT_BROWSER_UNSUPPORTED",
  ENCRYPTION_FAILED: "E_ARTIFACT_ENCRYPTION_FAILED",
  DECRYPTION_FAILED: "E_ARTIFACT_DECRYPTION_FAILED",
  CONFIRMATION_REQUIRED: "E_ARTIFACT_CONFIRMATION_REQUIRED",
  SHORT_CONFIRMATION_REQUIRED: "E_ARTIFACT_SHORT_CONFIRMATION_REQUIRED",
  PASTE_INVALID: "E_ARTIFACT_PASTE_INVALID",
  PASTE_UNAVAILABLE: "E_ARTIFACT_PASTE_UNAVAILABLE",
  PASTE_EXPIRED: "E_ARTIFACT_PASTE_EXPIRED",
  PASTE_LIMIT: "E_ARTIFACT_PASTE_LIMIT",
  SHARE_NETWORK: "E_ARTIFACT_SHARE_NETWORK",
  ROOM_CREATE_AMBIGUOUS: "E_ARTIFACT_ROOM_CREATE_AMBIGUOUS",
  ROOM_INVALID: "E_ARTIFACT_ROOM_INVALID",
  ROOM_UNAVAILABLE: "E_ARTIFACT_ROOM_UNAVAILABLE",
  ROOM_EXPIRED: "E_ARTIFACT_ROOM_EXPIRED",
  ROOM_CLOSED: "E_ARTIFACT_ROOM_CLOSED",
  ROOM_LEGACY_READ_ONLY: "E_ARTIFACT_ROOM_LEGACY_READ_ONLY",
  ROOM_FORBIDDEN: "E_ARTIFACT_ROOM_FORBIDDEN",
  ROOM_EVENT_INVALID: "E_ARTIFACT_ROOM_EVENT_INVALID",
  ROOM_EVENT_REPLAY: "E_ARTIFACT_ROOM_EVENT_REPLAY"
});
var PROTOCOL_ERROR_CODES = Object.freeze({
  ASSET_NOT_FOUND: "E_PROTOCOL_ASSET_NOT_FOUND",
  DIGEST_MISMATCH: "E_PROTOCOL_DIGEST_MISMATCH",
  DOCUMENT_INVALID: "E_PROTOCOL_DOCUMENT_INVALID",
  DOCUMENT_VERSION_UNSUPPORTED: "E_PROTOCOL_DOCUMENT_VERSION_UNSUPPORTED",
  DUPLICATE_ID: "E_PROTOCOL_DUPLICATE_ID",
  REFERENCE_INVALID: "E_PROTOCOL_REFERENCE_INVALID",
  REGISTRY_INVALID: "E_PROTOCOL_REGISTRY_INVALID",
  SCHEMA_INVALID: "E_PROTOCOL_SCHEMA_INVALID",
  SCHEMA_UNKNOWN: "E_SCHEMA_UNKNOWN",
  SCHEMA_VERSION_UNSUPPORTED: "E_SCHEMA_VERSION_UNSUPPORTED",
  SORT_ORDER_INVALID: "E_PROTOCOL_SORT_ORDER_INVALID"
});
var PipelineError = class extends Error {
  constructor(code, message, fix = "", details = void 0) {
    super(message);
    this.name = "PipelineError";
    this.code = code;
    this.fix = fix;
    if (details !== void 0) this.details = details;
  }
  toJSON() {
    return {
      ok: false,
      code: this.code,
      problem: this.message,
      ...this.fix ? { fix: this.fix } : {},
      ...this.details === void 0 ? {} : { details: this.details }
    };
  }
};

// packages/artifact/lib/artifact/artifact-sources.mjs
var ARTIFACT_SHARED_ENVELOPE_VERSION = "1.1.0";
var ARTIFACT_MAX_SOURCES = 256;
var ARTIFACT_MAX_VIEWS = 4096;
function resolveArtifactHtml(envelope, artifactOrId) {
  const id = typeof artifactOrId === "string" ? artifactOrId : artifactOrId?.id;
  const artifact = envelope?.artifacts?.find((value) => value.id === id);
  const source = envelope?.schemaVersion === ARTIFACT_SHARED_ENVELOPE_VERSION ? envelope.sources?.find((value) => value.id === artifact?.sourceId) : artifact;
  if (!artifact || typeof source?.html !== "string" || source.sha256 !== artifact.sha256) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      "Artifact source is missing or does not match its viewport reference."
    );
  }
  return source.html;
}

// packages/artifact/lib/artifact/envelope.mjs
import { createHash } from "node:crypto";

// packages/artifact/lib/artifact/internal/schema-loader.mjs
import { fileURLToPath as __planrAssetFile } from "node:url";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
var require2 = createRequire(new URL("./runtime/packages/artifact/lib/artifact/internal/schema-loader.mjs", import.meta.url).href);
var protocolPackageRoot = dirname(__planrAssetFile(new URL("./runtime/packages/protocol/package.json", import.meta.url)));
var SCHEMAS_ROOT = join(protocolPackageRoot, "schemas");
var DEFAULT_SCHEMA_VERSIONS = Object.freeze(["v1.0.0", "v1.1.0"]);
var schemaCache = /* @__PURE__ */ new Map();
function parseSchemaReference(name, version) {
  if (typeof name !== "string" || !/^[a-z0-9-]+(?:\.schema\.json)?$/i.test(name)) {
    throw new Error(`invalid schema name: ${String(name)}`);
  }
  const cleanName = name.replace(/\.schema\.json$/i, "");
  if (version !== void 0 && !/^v\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`invalid schema version: ${String(version)}`);
  }
  return { cleanName, versions: version ? [version] : DEFAULT_SCHEMA_VERSIONS };
}
function loadSchema(name, version = void 0) {
  if (typeof name === "string" && name.includes("/")) {
    const [qualifiedVersion, qualifiedName, ...rest] = name.split("/");
    if (rest.length > 0 || version !== void 0)
      throw new Error(`invalid schema reference: ${name}`);
    return loadSchema(qualifiedName, qualifiedVersion);
  }
  const { cleanName, versions } = parseSchemaReference(name, version);
  for (const candidateVersion of versions) {
    const key = `${candidateVersion}/${cleanName}`;
    if (schemaCache.has(key)) return schemaCache.get(key);
    const path = join(SCHEMAS_ROOT, candidateVersion, `${cleanName}.schema.json`);
    try {
      const schema = JSON.parse(readFileSync(path, "utf-8"));
      schemaCache.set(key, schema);
      return schema;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`unknown schema: ${cleanName}${version ? ` (${version})` : ""}`);
}
function validate(data, schemaName, version = void 0) {
  return validateJson(data, loadSchema(schemaName, version));
}

// packages/artifact/lib/artifact/envelope.mjs
var textEncoder = new TextEncoder();
var SHA256_RE = /^[a-f0-9]{64}$/;
var ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
var MAX_ARTIFACTS = 256;
var MAX_ARTIFACT_HTML_BYTES = LARGE_OBJECT_LIMITS.uniqueHtmlBytes;
var MAX_PINS = 1e4;
var MAX_REPLIES = 1e4;
var MAX_PASTE_BYTES = 5 * 1024 * 1024;
var ARTIFACT_PRESENTATIONS = Object.freeze(["document", "canvas"]);
var ARTIFACT_DOCUMENT_MAX_HEIGHT = 262144;
function invalid(message, details = void 0) {
  throw new PipelineError(ARTIFACT_ERROR_CODES.ENVELOPE_INVALID, message, "", details);
}
function assertBoundedString(value, label, { min = 0, max, pattern } = {}) {
  if (typeof value !== "string" || value.length < min || max !== void 0 && value.length > max || pattern && !pattern.test(value)) {
    invalid(`${label} is outside its allowed string bounds.`);
  }
}
function assertViewport(viewport, label, { maxHeight = 16384 } = {}) {
  if (!viewport || !Number.isInteger(viewport.width) || !Number.isInteger(viewport.height) || viewport.width < 1 || viewport.width > 16384 || viewport.height < 1 || viewport.height > maxHeight) {
    invalid(
      `${label} must have an integer width from 1 through 16384 pixels and height from 1 through ${maxHeight} pixels.`
    );
  }
}
function normalizeUtf8Text(value) {
  if (typeof value !== "string") {
    throw new PipelineError(ARTIFACT_ERROR_CODES.INPUT_INVALID, "Artifact HTML must be a string.");
  }
  return value.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}
function canonicalArtifactBytes(html) {
  return textEncoder.encode(normalizeUtf8Text(html));
}
function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function digestArtifact(html) {
  return sha256Hex(canonicalArtifactBytes(html));
}
function canonicalObject(value) {
  if (Array.isArray(value)) return value.map(canonicalObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalObject(value[key])])
  );
}
function canonicalSerialize(value) {
  return JSON.stringify(canonicalObject(value));
}
function canonicalBytes(value) {
  return textEncoder.encode(canonicalSerialize(value));
}
function normalizeViewport(viewport = {}) {
  const width = viewport.width ?? 1440;
  const height = viewport.height ?? 900;
  if (!Number.isInteger(width) || width < 1 || width > 16384 || !Number.isInteger(height) || height < 1 || height > 16384) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      "Artifact viewport width and height must be integers from 1 through 16384."
    );
  }
  return { width, height };
}
function normalizeArtifact(artifact) {
  if (!artifact || typeof artifact !== "object") {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      "Each artifact must be an object."
    );
  }
  const id = artifact.id;
  const title = artifact.title;
  if (typeof id !== "string" || !ID_RE.test(id) || id.length > 128) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      `Invalid artifact id: ${String(id)}`
    );
  }
  if (typeof title !== "string" || title.length === 0 || title.length > 512) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      `Artifact ${id} requires a title.`
    );
  }
  const html = normalizeUtf8Text(artifact.html);
  if (html.length === 0) {
    throw new PipelineError(ARTIFACT_ERROR_CODES.ENVELOPE_INVALID, `Artifact ${id} HTML is empty.`);
  }
  if (Buffer.byteLength(html, "utf8") > MAX_ARTIFACT_HTML_BYTES) {
    invalid(`Artifact ${id} exceeds ${MAX_ARTIFACT_HTML_BYTES} UTF-8 bytes.`);
  }
  const sha256 = digestArtifact(html);
  if (artifact.sha256 !== void 0 && artifact.sha256 !== sha256) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      `Artifact ${id} digest does not match its canonical bundled HTML.`,
      "",
      { expected: sha256, actual: artifact.sha256 }
    );
  }
  const colorScheme = artifact.colorScheme ?? "light";
  if (!["light", "dark"].includes(colorScheme)) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      `Artifact ${id} has an invalid color scheme.`
    );
  }
  return {
    id,
    kind: "html",
    title,
    sha256,
    html,
    viewport: normalizeViewport(artifact.viewport),
    colorScheme
  };
}
function normalizeViewer(viewer, artifacts) {
  const ids = new Set(artifacts.map(({ id }) => id));
  const normalized = {
    mode: viewer?.mode ?? (artifacts.length > 1 ? "variants" : "single"),
    activeArtifactId: viewer?.activeArtifactId ?? artifacts[0].id
  };
  if (!["single", "variants"].includes(normalized.mode)) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      "Viewer mode must be single or variants."
    );
  }
  if (!ids.has(normalized.activeArtifactId)) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      "Viewer activeArtifactId is not present in artifacts."
    );
  }
  if (viewer?.presentation !== void 0) {
    if (!ARTIFACT_PRESENTATIONS.includes(viewer.presentation)) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
        "Viewer presentation must be document or canvas."
      );
    }
    normalized.presentation = viewer.presentation;
  }
  return normalized;
}
function envelopeWithoutReview(envelope) {
  return {
    schemaVersion: envelope.schemaVersion,
    ...envelope.schemaVersion === ARTIFACT_SHARED_ENVELOPE_VERSION ? { sources: envelope.sources } : {},
    artifacts: envelope.artifacts,
    viewer: envelope.viewer
  };
}
function canonicalEnvelopeBytes(envelope, { includeReview = false } = {}) {
  const value = includeReview ? envelope : envelopeWithoutReview(envelope);
  return canonicalBytes(value);
}
function digestArtifactEnvelope(envelope) {
  return sha256Hex(canonicalEnvelopeBytes(envelope));
}
function validateArtifactReview(review) {
  const issues = validate(review, "artifact-review", "v1.1.0");
  if (issues.length > 0) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      `Invalid artifact review at ${issues[0].path}: ${issues[0].detail}`,
      "",
      { issues }
    );
  }
  assertBoundedString(review.reviewId, "reviewId", { min: 1, max: 128 });
  assertBoundedString(review.reviewOf, "reviewOf", { min: 64, max: 64, pattern: SHA256_RE });
  assertBoundedString(review.overall, "overall", { max: 65536 });
  if (!Array.isArray(review.pins) || review.pins.length > MAX_PINS)
    invalid(`Review pins exceed ${MAX_PINS}.`);
  for (const [pinIndex, pin] of review.pins.entries()) {
    const label = `pins[${pinIndex}]`;
    assertBoundedString(pin.id, `${label}.id`, { min: 1, max: 128 });
    assertBoundedString(pin.author?.id ?? "", `${label}.author.id`, { max: 128 });
    assertBoundedString(pin.author?.name, `${label}.author.name`, { min: 1, max: 256 });
    assertBoundedString(pin.artifactId, `${label}.artifactId`, { min: 1, max: 128 });
    if (pin.variant !== void 0)
      assertBoundedString(pin.variant, `${label}.variant`, { min: 1, max: 128 });
    assertBoundedString(pin.comment, `${label}.comment`, { min: 1, max: 65536 });
    if (pin.anchor) {
      assertBoundedString(pin.anchor.planrId, `${label}.anchor.planrId`, { min: 1, max: 512 });
      if (pin.anchor.screen !== void 0)
        assertBoundedString(pin.anchor.screen, `${label}.anchor.screen`, { min: 1, max: 128 });
    }
    assertViewport(pin.viewport, `${label}.viewport`, { maxHeight: ARTIFACT_DOCUMENT_MAX_HEIGHT });
    for (const coordinate of ["x", "y", "w", "h"]) {
      const value = pin.region?.[coordinate];
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
        invalid(`${label}.region.${coordinate} must be a finite normalized coordinate.`);
      }
    }
    if (pin.region.x + pin.region.w > 1 || pin.region.y + pin.region.h > 1) {
      invalid(`${label}.region must remain inside normalized artifact bounds.`);
    }
    if (!Array.isArray(pin.replies) || pin.replies.length > MAX_REPLIES)
      invalid(`${label}.replies exceeds ${MAX_REPLIES}.`);
    for (const [replyIndex, reply] of pin.replies.entries()) {
      const replyLabel = `${label}.replies[${replyIndex}]`;
      assertBoundedString(reply.id, `${replyLabel}.id`, { min: 1, max: 128 });
      assertBoundedString(reply.author?.id ?? "", `${replyLabel}.author.id`, { max: 128 });
      assertBoundedString(reply.author?.name, `${replyLabel}.author.name`, { min: 1, max: 256 });
      assertBoundedString(reply.comment, `${replyLabel}.comment`, { min: 1, max: 65536 });
    }
  }
  return review;
}
function validateArtifactEnvelope(envelope) {
  const shared = envelope?.schemaVersion === ARTIFACT_SHARED_ENVELOPE_VERSION;
  const issues = validate(envelope, "artifact-envelope", shared ? "v1.16.0" : "v1.1.0");
  if (issues.length > 0) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      `Invalid artifact envelope at ${issues[0].path}: ${issues[0].detail}`,
      "",
      { issues }
    );
  }
  if (!Array.isArray(envelope.artifacts) || envelope.artifacts.length < 1 || envelope.artifacts.length > (shared ? ARTIFACT_MAX_VIEWS : MAX_ARTIFACTS)) {
    invalid(
      `Envelope requires 1 through ${shared ? ARTIFACT_MAX_VIEWS : MAX_ARTIFACTS} artifacts.`
    );
  }
  const ids = envelope.artifacts.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new PipelineError(ARTIFACT_ERROR_CODES.ENVELOPE_INVALID, "Artifact ids must be unique.");
  }
  const sources = shared ? envelope.sources : envelope.artifacts;
  if (shared && new Set(sources.map(({ id }) => id)).size !== sources.length) {
    invalid("Artifact source ids must be unique.");
  }
  let artifactBytes = 0;
  for (const source of sources) {
    assertBoundedString(source.html, `Source ${source.id} HTML`, { min: 1 });
    artifactBytes += Buffer.byteLength(source.html, "utf8");
    if (artifactBytes > MAX_ARTIFACT_HTML_BYTES) {
      invalid(`Envelope sources exceed ${MAX_ARTIFACT_HTML_BYTES} UTF-8 bytes in total.`);
    }
    if (!SHA256_RE.test(source.sha256) || digestArtifact(source.html) !== source.sha256) {
      invalid(`Artifact source ${source.id} digest is invalid.`);
    }
  }
  for (const artifact of envelope.artifacts) {
    assertBoundedString(artifact.id, "artifact.id", { min: 1, max: 128, pattern: ID_RE });
    assertBoundedString(artifact.title, `Artifact ${artifact.id} title`, { min: 1, max: 512 });
    assertViewport(artifact.viewport, `Artifact ${artifact.id} viewport`);
    if (shared) resolveArtifactHtml(envelope, artifact);
  }
  if (shared && new Set(envelope.artifacts.map(({ sourceId }) => sourceId)).size !== sources.length) {
    invalid("Every shared artifact source must be referenced by a viewport.");
  }
  assertBoundedString(envelope.viewer.activeArtifactId, "viewer.activeArtifactId", {
    min: 1,
    max: 128
  });
  if (!ids.includes(envelope.viewer.activeArtifactId)) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
      "Viewer references an unknown artifact."
    );
  }
  if (envelope.review) {
    validateArtifactReview(envelope.review);
    for (const pin of envelope.review.pins) {
      if (!ids.includes(pin.artifactId))
        invalid(`Review pin references unknown artifact: ${pin.artifactId}`);
    }
    const expected = digestArtifactEnvelope(envelope);
    if (envelope.review.reviewOf !== expected) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.ENVELOPE_INVALID,
        "Review digest does not match the canonical review-free envelope.",
        "",
        { expected, actual: envelope.review.reviewOf }
      );
    }
  }
  return envelope;
}
function createSharedArtifactEnvelope({ sources, artifacts, viewer, review } = {}) {
  if (!Array.isArray(sources) || sources.length < 1 || sources.length > ARTIFACT_MAX_SOURCES) {
    invalid(`Shared envelope requires 1 through ${ARTIFACT_MAX_SOURCES} sources.`);
  }
  if (!Array.isArray(artifacts) || artifacts.length < 1 || artifacts.length > ARTIFACT_MAX_VIEWS) {
    invalid(`Shared envelope requires 1 through ${ARTIFACT_MAX_VIEWS} viewport references.`);
  }
  const normalizedSources = sources.map((source) => {
    const value = normalizeArtifact({ ...source, title: source?.id });
    return { id: value.id, kind: value.kind, sha256: value.sha256, html: value.html };
  });
  const sourceMap = new Map(normalizedSources.map((source) => [source.id, source]));
  const normalizedArtifacts = artifacts.map((artifact) => {
    const source = sourceMap.get(artifact?.sourceId);
    if (!source) invalid("Artifact viewport references an unknown shared source.");
    assertBoundedString(artifact.id, "artifact.id", { min: 1, max: 128, pattern: ID_RE });
    assertBoundedString(artifact.title, "artifact.title", { min: 1, max: 512 });
    if (artifact.sha256 !== void 0 && artifact.sha256 !== source.sha256) {
      invalid("Artifact viewport digest does not match its shared source.");
    }
    const colorScheme = artifact.colorScheme ?? "light";
    if (!["light", "dark"].includes(colorScheme))
      invalid("Artifact viewport color scheme is invalid.");
    return {
      id: artifact.id,
      kind: "html",
      title: artifact.title,
      sourceId: source.id,
      sha256: source.sha256,
      viewport: normalizeViewport(artifact.viewport),
      colorScheme
    };
  });
  return validateArtifactEnvelope({
    schemaVersion: ARTIFACT_SHARED_ENVELOPE_VERSION,
    sources: normalizedSources,
    artifacts: normalizedArtifacts,
    viewer: normalizeViewer(viewer, normalizedArtifacts),
    ...review ? { review: canonicalObject(review) } : {}
  });
}

export {
  ARTIFACT_ERROR_CODES,
  PipelineError,
  ARTIFACT_MAX_SOURCES,
  ARTIFACT_MAX_VIEWS,
  resolveArtifactHtml,
  MAX_ARTIFACT_HTML_BYTES,
  canonicalSerialize,
  digestArtifactEnvelope,
  validateArtifactReview,
  validateArtifactEnvelope,
  createSharedArtifactEnvelope
};
