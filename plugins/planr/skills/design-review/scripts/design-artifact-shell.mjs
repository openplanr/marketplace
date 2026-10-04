import {
  LARGE_OBJECT_LIMITS,
  validateJson
} from "./design-bounded-json-data.mjs";

// packages/artifact/lib/artifact/ui/shell.mjs
import { readFileSync as readFileSync3 } from "node:fs";

// packages/artifact/lib/artifact/envelope.mjs
import { createHash } from "node:crypto";

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

// packages/artifact/lib/artifact/internal/escape.mjs
var HTML_ENTITIES = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
});
var LINE_SEP = String.fromCharCode(8232);
var PARA_SEP = String.fromCharCode(8233);
var JSON_HTML_ESCAPES = Object.freeze({
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LINE_SEP]: "\\u2028",
  [PARA_SEP]: "\\u2029"
});
var JSON_HTML_RE = new RegExp(`[<>&${LINE_SEP}${PARA_SEP}]`, "g");
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch]);
}
function embedJson(value) {
  return JSON.stringify(value ?? null).replace(JSON_HTML_RE, (ch) => JSON_HTML_ESCAPES[ch]);
}

// packages/artifact/lib/artifact/ui/annotation-styles.mjs
var ARTIFACT_ANNOTATION_CSS = `.planr-annotation-layer { position: absolute; z-index: 6; inset: 0; }
.planr-shell[data-planr-review-mode="interact"] .planr-annotation-layer { pointer-events: none; }
.planr-shell[data-planr-review-mode="comment"] .planr-annotation-layer { cursor: crosshair; touch-action: none; }
.planr-shell[data-planr-review-mode="comment"] .planr-frame iframe { pointer-events: none; }
.planr-region-selection {
  position: absolute;
  min-width: 2px;
  min-height: 2px;
  border: 2px solid var(--planr-color-primary);
  border-radius: var(--planr-radius-small);
  background: color-mix(in srgb, var(--planr-color-primary) 14%, transparent);
  pointer-events: none;
}
.planr-pin {
  position: absolute;
  z-index: 8;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  translate: -50% -50%;
  display: grid;
  place-items: center;
  padding: 0;
  border: 8px solid transparent;
  border-radius: 50%;
  background-clip: padding-box;
  color: var(--planr-color-on-danger);
  cursor: pointer;
  pointer-events: auto;
  font: 700 10px/1 var(--planr-font-mono);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--planr-color-background) 38%, transparent);
}
.planr-pin-fix { background-color: var(--planr-color-danger); }
.planr-pin-improve { background-color: var(--planr-color-primary-strong); color: var(--planr-color-on-improve); }
.planr-pin-question { background-color: var(--planr-color-question); color: var(--planr-color-on-question); }
.planr-pin-resolved, .planr-pin-addressed { background-color: var(--planr-color-resolved); color: var(--planr-color-on-resolved); }
.planr-pin-highlight { animation: planr-pin-highlight 1.2s ease-out; }
@keyframes planr-pin-highlight {
  0%, 35% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--planr-color-primary) 52%, transparent), 0 4px 14px color-mix(in srgb, var(--planr-color-background) 38%, transparent); }
  100% { box-shadow: 0 4px 14px color-mix(in srgb, var(--planr-color-background) 38%, transparent); }
}
.planr-pin-region {
  position: absolute;
  z-index: 7;
  min-width: 2px;
  min-height: 2px;
  border: 2px solid var(--planr-color-danger);
  border-radius: var(--planr-radius-small);
  background: color-mix(in srgb, var(--planr-color-danger) 12%, transparent);
  pointer-events: none;
}
.planr-pin-region-improve { border-color: var(--planr-color-primary-strong); background: color-mix(in srgb, var(--planr-color-primary-strong) 12%, transparent); }
.planr-pin-region-question { border-color: var(--planr-color-question); background: color-mix(in srgb, var(--planr-color-question) 12%, transparent); }
.planr-pin-region-resolved, .planr-pin-region-addressed { border-color: var(--planr-color-resolved); background: color-mix(in srgb, var(--planr-color-resolved) 10%, transparent); }
.planr-annotation-composer {
  position: fixed;
  inset: auto;
  z-index: 100;
  box-sizing: border-box;
  width: min(360px, calc(100vw - 24px));
  max-height: min(620px, calc(100dvh - 24px));
  margin: 0;
  overflow: auto;
  overscroll-behavior: contain;
  translate: none;
  transform: none;
  padding: 14px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-large);
  background: var(--planr-color-panel);
  color: var(--planr-color-text);
  box-shadow: 0 18px 60px color-mix(in srgb, var(--planr-color-background) 58%, transparent);
  cursor: default;
  pointer-events: auto;
}
.planr-annotation-composer strong { display: block; margin: 0; font: 650 14px/1.2 var(--planr-font-display); }
.planr-composer-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.planr-composer-header button { display: grid; place-items: center; flex: 0 0 28px; width: 28px; height: 28px; padding: 0; border: 1px solid transparent; border-radius: var(--planr-radius-small); background: transparent; color: var(--planr-color-text-muted); font: 22px/1 var(--planr-font-body); cursor: pointer; }
.planr-composer-header button:hover { background: var(--planr-color-raised); color: var(--planr-color-text); }
.planr-annotation-composer :focus-visible { outline: 2px solid var(--planr-color-primary); outline-offset: 2px; }
.planr-annotation-composer::backdrop { background: transparent; pointer-events: none; }
.planr-annotation-composer label, .planr-identity label {
  display: grid;
  gap: 5px;
  margin-bottom: 9px;
  color: var(--planr-color-text-muted);
  font-size: 11px;
}
.planr-annotation-composer input, .planr-annotation-composer textarea, .planr-identity input,
.planr-reply-form textarea {
  width: 100%;
  padding: 8px 9px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: var(--planr-color-chrome);
  color: var(--planr-color-text);
}
.planr-annotation-composer textarea { min-height: 84px; resize: vertical; }
.planr-intent-picker { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-bottom: 9px; }
.planr-intent-picker button {
  min-height: 30px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: transparent;
  cursor: pointer;
  font-size: 10px;
}
.planr-intent-picker [aria-checked="true"] { border-color: var(--planr-color-primary); background: var(--planr-color-raised); }
.planr-field-error { min-height: 16px; margin: 0; color: var(--planr-color-danger); font-size: 10px; }
.planr-composer-actions { display: flex; justify-content: flex-end; gap: 7px; margin-top: 8px; }
.planr-composer-actions button, .planr-thread button, .planr-reply-form button {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: transparent;
  cursor: pointer;
  font-weight: 700;
}
.planr-composer-actions [type="submit"], .planr-reply-form [type="submit"] { border-color: var(--planr-color-primary); background: var(--planr-color-primary); color: var(--planr-color-background); }
`;
var ARTIFACT_ANNOTATION_MOBILE_CSS = `@media (max-width: 600px) { .planr-annotation-composer input, .planr-annotation-composer textarea, .planr-annotation-composer select { font-size: 16px; } }`;

// packages/artifact/lib/artifact/ui/presentation.mjs
function resolveArtifactPresentation(value, {
  mode,
  viewMode = mode ?? "single",
  artifactCount = 1
} = {}) {
  if (value === "document" || value === "canvas") return value;
  return artifactCount > 1 || viewMode === "variants" || viewMode === "split" ? "canvas" : "document";
}

// packages/artifact/lib/artifact/ui/renderers.mjs
var ARTIFACT_SHELL_STATES = Object.freeze([
  "ready",
  "empty",
  "bundling",
  "loading",
  "invalid",
  "expired",
  "decryption-failed",
  "unsupported-browser"
]);
var ARTIFACT_VIEW_MODES = Object.freeze(["single", "variants", "split"]);
var ARTIFACT_REVIEW_MODES = Object.freeze(["interact", "comment"]);
var ARTIFACT_SHELL_THEMES = Object.freeze(["auto", "light", "dark"]);
var ARTIFACT_PRESENTATIONS2 = Object.freeze(["document", "canvas"]);
var STATUS_COPY = Object.freeze({
  empty: Object.freeze({
    title: "No artifact content",
    detail: "Choose a bundled HTML artifact to begin this review."
  }),
  bundling: Object.freeze({
    title: "Bundling artifact",
    detail: "Packaging local scripts, styles, fonts, and images without network access."
  }),
  loading: Object.freeze({
    title: "Loading private review",
    detail: "Validating the envelope and frozen artifact viewport."
  }),
  invalid: Object.freeze({
    title: "This review is invalid",
    detail: "The artifact envelope could not be decoded or validated."
  }),
  expired: Object.freeze({
    title: "This encrypted review expired",
    detail: "Ask the sender for a new immutable review link."
  }),
  "decryption-failed": Object.freeze({
    title: "This key cannot decrypt the review",
    detail: "Use the complete link, including its private fragment key."
  }),
  "unsupported-browser": Object.freeze({
    title: "Browser support is required",
    detail: "Use a current browser with raw DEFLATE and Web Crypto support."
  })
});
var PRIVACY_LABELS = Object.freeze({
  local: "Local review",
  fragment: "Private fragment",
  "encrypted-short": "Encrypted short link"
});
function plainText(value, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}
function member(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}
function nonNegativeInteger(value, fallback = 0) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}
function viewportDimension(value, fallback) {
  return Number.isInteger(value) && value > 0 && value <= 16384 ? value : fallback;
}
function normalizeArtifact2(value, index) {
  const artifact = value && typeof value === "object" ? value : {};
  const id = plainText(artifact.id, `artifact-${index + 1}`) || `artifact-${index + 1}`;
  return Object.freeze({
    id,
    domId: `planr-artifact-${index + 1}`,
    title: plainText(artifact.title, `Artifact ${index + 1}`) || `Artifact ${index + 1}`,
    kind: plainText(artifact.kind, "html") || "html",
    viewport: Object.freeze({
      width: viewportDimension(artifact.viewport?.width, 1440),
      height: viewportDimension(artifact.viewport?.height, 900)
    }),
    colorScheme: member(artifact.colorScheme, ["light", "dark"], "light")
  });
}
function normalizeArtifactShellModel(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const envelope = source.envelope && typeof source.envelope === "object" ? source.envelope : {};
  const viewer = source.viewer && typeof source.viewer === "object" ? source.viewer : envelope.viewer && typeof envelope.viewer === "object" ? envelope.viewer : {};
  const shell = source.shell && typeof source.shell === "object" ? source.shell : {};
  const artifacts = Object.freeze(
    (Array.isArray(envelope.artifacts) ? envelope.artifacts : []).map(normalizeArtifact2)
  );
  const requestedActiveId = plainText(viewer.activeArtifactId);
  const activeIndex = Math.max(
    0,
    artifacts.findIndex((artifact) => artifact.id === requestedActiveId)
  );
  const activeArtifact = artifacts[activeIndex] ?? null;
  const requestedComparisonId = plainText(viewer.comparisonArtifactId);
  let comparisonIndex = artifacts.findIndex(
    (artifact, index) => index !== activeIndex && artifact.id === requestedComparisonId
  );
  if (comparisonIndex < 0 && artifacts.length > 1) comparisonIndex = activeIndex === 0 ? 1 : 0;
  const comparisonArtifact = comparisonIndex >= 0 ? artifacts[comparisonIndex] : null;
  let viewMode = member(
    viewer.mode,
    ARTIFACT_VIEW_MODES,
    artifacts.length > 1 ? "variants" : "single"
  );
  if (artifacts.length < 2 && viewMode !== "single") viewMode = "single";
  const reviewMode = member(
    viewer.reviewMode ?? shell.reviewMode,
    ARTIFACT_REVIEW_MODES,
    "interact"
  );
  let status = member(viewer.status ?? shell.status, ARTIFACT_SHELL_STATES, "ready");
  if (artifacts.length === 0 && status === "ready") status = "empty";
  const privacy = member(shell.privacy, Object.keys(PRIVACY_LABELS), "local");
  const theme = member(shell.theme, ARTIFACT_SHELL_THEMES, "auto");
  const zoom = Math.min(200, Math.max(25, nonNegativeInteger(shell.zoom, 72)));
  const feedbackCount = nonNegativeInteger(shell.feedbackCount, 0);
  const presentation = resolveArtifactPresentation(viewer.presentation ?? shell.presentation, {
    mode: viewMode,
    artifactCount: artifacts.length
  });
  return Object.freeze({
    schemaVersion: "1.0.0",
    title: plainText(shell.title, activeArtifact?.title ?? "Artifact review") || "Artifact review",
    artifacts,
    activeArtifact,
    activeIndex,
    comparisonArtifact,
    comparisonIndex,
    viewMode,
    reviewMode,
    status,
    statusCopy: STATUS_COPY[status] ?? null,
    privacy,
    privacyLabel: PRIVACY_LABELS[privacy],
    theme,
    zoom,
    feedbackCount,
    presentation,
    railOpen: shell.railOpen === void 0 ? presentation === "canvas" : Boolean(shell.railOpen)
  });
}
function activeMetadata(model) {
  const artifact = model.activeArtifact;
  if (!artifact) return "HTML \xB7 1440\xD7900";
  return `${artifact.kind.toUpperCase()} \xB7 ${artifact.viewport.width}\xD7${artifact.viewport.height}`;
}
function renderPlanrMark() {
  return '<span class="planr-mark" aria-hidden="true"><svg viewBox="0 0 160 160" focusable="false"><g transform="rotate(-45 80 80)"><path d="M125 50A52 52 0 1 0 125 110" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><rect x="127" y="71" width="18" height="18" rx="3" fill="currentColor"/></g></svg></span>';
}
function renderArtifactToolbar(model) {
  const interact = model.reviewMode === "interact";
  const canvas = model.presentation === "canvas";
  return `<header class="planr-toolbar">
  <div class="planr-brand" aria-label="OpenPlanr">${renderPlanrMark()}<span class="planr-title-block"><strong>${escapeHtml(model.title)}</strong>${canvas ? `<span>${escapeHtml(activeMetadata(model))}</span>` : ""}</span></div>
  <span class="planr-privacy" data-privacy="${escapeHtml(model.privacy)}">${escapeHtml(model.privacyLabel)}</span>
${canvas ? '  <span class="planr-domain-toolbar" data-planr-slot="domain-toolbar" aria-label="Artifact workflow controls"></span>\n' : ""}  <span class="planr-toolbar-spacer" aria-hidden="true"></span>
${canvas ? `  <div class="planr-segment" role="group" aria-label="Viewport controls"><button type="button" data-planr-action="zoom-out" aria-label="Zoom out">\u2212</button><button type="button" data-planr-action="zoom-reset" aria-label="Reset zoom">${model.zoom}%</button><button type="button" data-planr-action="zoom-in" aria-label="Zoom in">+</button></div>
` : ""}  <div class="planr-segment" role="group" aria-label="Review mode"><button type="button" data-planr-mode="interact" data-planr-short-label="I" aria-pressed="${interact}">Interact</button><button type="button" data-planr-mode="comment" data-planr-short-label="C" aria-pressed="${!interact}">Comment</button></div>
${canvas ? `  <button class="planr-toolbar-action" type="button" data-planr-action="theme" aria-label="Shell theme ${escapeHtml(model.theme)}">${escapeHtml(model.theme)}</button>
` : ""}  <button class="planr-toolbar-action" type="button" data-planr-action="feedback" aria-controls="planr-review-rail" aria-expanded="${model.railOpen}"><span class="planr-feedback-label">Feedback</span> <span class="planr-count">${model.feedbackCount}</span></button>
  <button class="planr-toolbar-action planr-share" type="button" data-planr-action="share" aria-haspopup="dialog">Share</button>
</header>`;
}
function actionIcon(name) {
  const paths = {
    comment: '<path d="M12 20a8 8 0 1 0-7.1-4.3L4 20l4.3-.9A8 8 0 0 0 12 20Z"/><path d="M12 8v8M8 12h8"/>',
    comments: '<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.2-.6L4 20l1.6-4.1A7.4 7.4 0 0 1 4 11.5a8 8 0 0 1 16 0Z"/><path d="M8.5 11.5h7"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6h14v-6"/>',
    more: '<circle cx="5" cy="12" r="1.25"/><circle cx="12" cy="12" r="1.25"/><circle cx="19" cy="12" r="1.25"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}
function commentsLabel(count) {
  return `${count} ${count === 1 ? "comment" : "comments"}`;
}
function renderDocumentActionRail(model) {
  return `<nav class="planr-floating-actions" aria-label="Review actions">
  <button type="button" data-planr-action="add-comment" aria-label="Add comment" aria-keyshortcuts="C" aria-pressed="${model.reviewMode === "comment"}" data-planr-tooltip="Add comment (C)">${actionIcon("comment")}</button>
  <button type="button" data-planr-action="feedback" aria-label="${commentsLabel(model.feedbackCount)}" aria-controls="planr-review-rail" aria-expanded="${model.railOpen}" data-planr-tooltip="Comments">${actionIcon("comments")}<span class="planr-count" aria-hidden="true">${model.feedbackCount}</span></button>
  <button type="button" data-planr-action="share" aria-label="Share review" aria-haspopup="dialog" data-planr-tooltip="Share">${actionIcon("share")}<span class="planr-action-label">Share</span></button>
  <div class="planr-more">
    <button type="button" data-planr-action="more" aria-label="More review options" aria-haspopup="menu" aria-expanded="false" data-planr-tooltip="More">${actionIcon("more")}</button>
    <div class="planr-more-menu" role="menu" hidden>
      <div><strong>Private review</strong><span>${escapeHtml(model.privacyLabel)} \xB7 Encrypted when shared</span></div>
      <button type="button" role="menuitem" data-planr-action="sharing-options">Snapshot and sharing options</button>
      <div data-planr-slot="room-manager" hidden></div>
    </div>
  </div>
</nav>`;
}
function renderDocumentCommentsScrim() {
  return '<button class="planr-comments-scrim" type="button" data-planr-comments-scrim data-planr-close-feedback aria-label="Close comments" tabindex="-1"></button>';
}
function renderViewButton(mode, model, disabled = false) {
  const label = mode[0].toUpperCase() + mode.slice(1);
  return `<button type="button" data-planr-view="${mode}" aria-pressed="${model.viewMode === mode}"${disabled ? " disabled" : ""}>${label}</button>`;
}
function renderArtifactVariantControls(model) {
  const hasVariants = model.artifacts.length > 1;
  const tabs = model.artifacts.map((artifact, index) => {
    const selected = index === model.activeIndex;
    return `<button type="button" role="tab" id="planr-variant-tab-${index + 1}" aria-controls="${artifact.domId}-panel" aria-selected="${selected}" tabindex="${selected ? 0 : -1}" data-artifact-id="${escapeHtml(artifact.id)}"><span>${String(index + 1).padStart(2, "0")}</span> ${escapeHtml(artifact.title)}</button>`;
  }).join("");
  return `<div class="planr-stage-controls" role="group" aria-label="Artifact display controls">
  <div class="planr-segment planr-view-modes" role="group" aria-label="Artifact view mode">${renderViewButton("single", model)}${renderViewButton("variants", model, !hasVariants)}${renderViewButton("split", model, !hasVariants)}</div>
  <div class="planr-variants" role="tablist" aria-label="Artifact variants"${model.viewMode === "single" || !hasVariants ? " hidden" : ""}>${tabs}</div>
</div>`;
}
function visibleArtifactIndexes(model) {
  if (model.viewMode === "split" && model.comparisonArtifact) {
    return /* @__PURE__ */ new Set([model.activeIndex, model.comparisonIndex]);
  }
  return new Set(model.activeArtifact ? [model.activeIndex] : []);
}
function renderArtifactPanels(model) {
  const visible = visibleArtifactIndexes(model);
  const unavailable = model.status !== "ready";
  return model.artifacts.map((artifact, index) => {
    const hidden = !visible.has(index);
    const primary = index === model.activeIndex;
    const annotationTabIndex = !hidden && !unavailable && model.reviewMode === "comment" ? 0 : -1;
    const frameTabIndex = !hidden && !unavailable && model.reviewMode === "interact" ? 0 : -1;
    return `<section class="planr-artifact-panel" id="${artifact.domId}-panel" role="tabpanel" aria-labelledby="planr-variant-tab-${index + 1}" data-artifact-id="${escapeHtml(artifact.id)}" data-artifact-color-scheme="${artifact.colorScheme}" style="--planr-artifact-width:${artifact.viewport.width}px;--planr-artifact-height:${artifact.viewport.height}px" aria-label="${primary ? "Primary" : "Comparison"} artifact: ${escapeHtml(artifact.title)}"${hidden ? " hidden" : ""}>
  <span class="planr-frame-label">${String(index + 1).padStart(2, "0")} \xB7 ${escapeHtml(artifact.title)}</span>
  <div class="planr-frame"><iframe id="${artifact.domId}" title="${escapeHtml(artifact.title)} artifact" sandbox="allow-scripts" referrerpolicy="no-referrer" tabindex="${frameTabIndex}" data-planr-artifact-frame="${escapeHtml(artifact.id)}"></iframe></div>
  <div class="planr-annotation-layer" role="region" aria-label="Annotations for ${escapeHtml(artifact.title)}" aria-disabled="${annotationTabIndex < 0}" tabindex="${annotationTabIndex}" data-coordinate-space="normalized" data-planr-annotation-layer="${escapeHtml(artifact.id)}"></div>
</section>`;
  }).join("");
}
function renderArtifactStatus(model) {
  const ready = model.status === "ready";
  const copy = model.statusCopy ?? { title: "", detail: "" };
  return `<div class="planr-stage-status" role="status" aria-live="polite" aria-atomic="true"${ready ? " hidden" : ""}>
  <div><strong>${escapeHtml(copy.title)}</strong><p>${escapeHtml(copy.detail)}</p></div>
</div>`;
}
function renderArtifactStage(model) {
  const unavailable = model.status !== "ready";
  const breadcrumb = model.activeArtifact?.title ?? "Artifact";
  return `<main class="planr-stage" aria-label="Artifact review stage">
${model.presentation === "canvas" ? `  <div class="planr-stage-heading"><span>ARTIFACT / ${escapeHtml(breadcrumb.toUpperCase())}</span><span role="status" aria-live="polite" data-planr-slot="status">${model.reviewMode === "comment" ? "Comment mode" : "Interactions enabled"}</span></div>
  ${renderArtifactVariantControls(model)}
` : ""}  <div class="planr-stage-scroll"><div class="planr-stage-surface" style="--planr-shell-zoom:${model.zoom / 100}"${unavailable ? ' inert aria-hidden="true"' : ""}><div class="planr-frame-grid" data-planr-layout="${model.viewMode}">${renderArtifactPanels(model)}</div></div></div>
  ${renderArtifactStatus(model)}
</main>`;
}
function renderArtifactRail(model) {
  const closed = !model.railOpen;
  return `<aside class="planr-review-rail" id="planr-review-rail" aria-label="Review comments"${closed ? ' inert aria-hidden="true"' : ""}>
  <header><h2>Review comments</h2><div class="planr-review-header-actions"><div class="planr-review-metrics" aria-label="Review metrics"><span data-planr-metric="open">0 open</span><span class="planr-count" data-planr-metric="total" aria-label="${commentsLabel(model.feedbackCount)}">${model.feedbackCount}</span></div><button class="planr-rail-close" type="button" data-planr-close-feedback aria-label="Close comments">\xD7</button></div></header>
  <section class="planr-identity" aria-label="Reviewer identity"><label for="planr-reviewer-name">Your name<input id="planr-reviewer-name" type="text" maxlength="256" autocomplete="name" aria-describedby="planr-identity-status planr-review-error" data-planr-reviewer-name></label><p class="planr-identity-status" id="planr-identity-status" aria-live="polite" data-planr-identity-status>Used to sign your comments.</p><p class="planr-field-error" id="planr-review-error" role="alert" hidden></p></section>
  <div class="planr-feedback-slot" data-planr-slot="feedback-rail" role="region" aria-label="Comment threads"><p data-planr-empty-feedback>No comments yet. Choose Add comment, then click or drag on the artifact.</p><div class="planr-thread-list" data-planr-thread-list></div></div>
  <section class="planr-domain-rail" data-planr-slot="domain-rail" aria-label="Artifact workflow details" hidden></section>
  <section class="planr-decision-slot" data-planr-slot="decision" aria-label="Review decision">
    <label for="planr-overall-note">Overall note</label><textarea id="planr-overall-note" maxlength="65536" placeholder="Overall note for the coding agent\u2026" data-planr-overall></textarea>
    <div><button type="button" data-planr-decision="approved" aria-pressed="false">Approve</button><button type="button" data-planr-decision="changes_requested" aria-pressed="false">Request changes</button></div>
    <p data-planr-slot="decision-status">Decision pending</p>
  </section>
</aside>`;
}
function renderArtifactShareDialog() {
  return `<div class="planr-dialog-backdrop" data-planr-share-dialog hidden>
  <section class="planr-share-dialog" role="dialog" aria-modal="true" aria-labelledby="planr-share-title" aria-describedby="planr-share-description" data-planr-share-phase="idle" data-planr-share-selected="live">
    <header><div><h2 id="planr-share-title">Share this review</h2><p id="planr-share-description">Live review is encrypted and collaborative. Snapshot links are immutable alternatives.</p></div><button type="button" class="planr-dialog-close" data-planr-share-close aria-label="Close share dialog">\xD7</button></header>
    <div class="planr-share-receipt" role="group" aria-label="Privacy receipt">
      <button type="button" class="planr-share-receipt-row is-selected" data-planr-share-transport="live" aria-pressed="true">
        <span class="planr-share-receipt-icon" aria-hidden="true">\u25CF</span><span><strong>Live collaborative review</strong><small>Encrypted artifact and comment events are stored until expiry. Anyone with the link can comment.</small></span><span class="planr-share-receipt-size">Default</span>
      </button>
      <button type="button" class="planr-share-receipt-row" data-planr-share-transport="fragment" aria-pressed="false">
        <span class="planr-share-receipt-icon" aria-hidden="true">#</span><span><strong>Private fragment</strong><small>Compressed into the URL. Nothing is uploaded.</small></span><span class="planr-share-receipt-size" data-planr-share-fragment-size>Calculating\u2026</span>
      </button>
      <button type="button" class="planr-share-receipt-row" data-planr-share-transport="short" aria-pressed="false">
        <span class="planr-share-receipt-icon" aria-hidden="true">\u25C7</span><span><strong>Encrypted short link</strong><small>AES-256-GCM ciphertext is stored until expiry; the key stays in this link fragment.</small></span><span class="planr-share-receipt-size" data-planr-share-short-size>Calculating\u2026</span>
      </button>
    </div>
    <p class="planr-share-threshold" data-planr-share-threshold>Live rooms are the default. Private fragments are immutable snapshots through 8,000 characters.</p>
    <div class="planr-share-ttl" data-planr-share-ttl-row hidden><label for="planr-share-ttl">Encrypted storage expiry<select id="planr-share-ttl" data-planr-share-ttl><option value="1d">1 day</option><option value="7d" selected>7 days</option><option value="30d">30 days</option></select></label><p>Ciphertext and request metadata are visible to the service until <time data-planr-share-expiry></time>. The decryption key is not uploaded.</p></div>
    <aside class="planr-owner-custody" data-planr-share-owner-custody><strong>Owner-verdict custody</strong><p>Download the private owner key first. The key stays in your downloaded file and is never put in a URL, browser storage, log, or server request.</p><p role="status" data-planr-share-owner-custody-status>No room will be created until the private owner key is downloaded successfully.</p></aside>
    <section class="planr-share-result" data-planr-share-result hidden aria-label="Share receipt">
      <label for="planr-share-url">Reviewer URL \xB7 view and comment</label><div><input id="planr-share-url" data-planr-share-url readonly><button type="button" data-planr-share-copy-url>Copy URL</button></div>
      <aside class="planr-live-capability" data-planr-share-owner hidden><strong>Private owner-verdict URL</strong><p>Use this URL with the matching downloaded owner key to approve or request changes.</p><div><input id="planr-share-owner-url" aria-label="Private owner-verdict URL" data-planr-share-owner-url readonly><button type="button" data-planr-share-copy-owner>Copy owner URL</button></div></aside>
      <aside class="planr-live-capability" data-planr-share-manage hidden><strong>Private management URL</strong><p>Pause or reopen comments, or delete the room. Management cannot set a verdict.</p><div><input id="planr-share-manage-url" aria-label="Private management URL" data-planr-share-manage-url readonly><button type="button" data-planr-share-copy-manage>Copy manage URL</button></div></aside>
      <aside class="planr-deletion-receipt" data-planr-share-deletion hidden><strong>One-time deletion token</strong><p>Store this token now; it cannot be recovered. It is separate from the review URL.</p><code data-planr-share-deletion-token></code><button type="button" data-planr-share-copy-deletion>Copy deletion token</button></aside>
    </section>
    <p class="planr-share-error" role="alert" data-planr-share-error hidden></p>
    <p class="planr-visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-planr-share-status></p>
    <footer><button type="button" data-planr-share-cancel>Cancel</button><button type="button" class="planr-share-confirm" data-planr-share-confirm disabled>Download owner key</button></footer>
  </section>
</div>`;
}
function renderHostedArtifactViewerSlot() {
  return `<section class="planr-hosted-viewer" data-planr-hosted-viewer data-planr-hosted-state="idle" role="status" aria-live="polite" aria-atomic="true" hidden>
  <div>${renderPlanrMark()}<strong data-planr-hosted-title></strong><p data-planr-hosted-detail></p><button type="button" data-planr-hosted-retry hidden></button></div>
</section>`;
}
function renderArtifactShellMarkup(model) {
  return `<div class="planr-shell" data-planr-presentation="${model.presentation}" data-planr-view="${model.viewMode}" data-planr-review-mode="${model.reviewMode}" data-planr-state="${model.status}" data-planr-rail-open="${model.railOpen}">
  ${model.presentation === "canvas" ? renderArtifactToolbar(model) : `${renderDocumentActionRail(model)}
  ${renderDocumentCommentsScrim()}`}
  <div class="planr-workspace">${renderArtifactStage(model)}${renderArtifactRail(model)}</div>
</div>
<div data-planr-slot="dialogs">${renderArtifactShareDialog()}</div>
${renderHostedArtifactViewerSlot()}
<div class="planr-visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-planr-slot="review-announcer"></div>`;
}
function renderArtifactShellModelData(model) {
  return embedJson(model);
}

// packages/artifact/lib/artifact/ui/stage-payload.mjs
var PRESENTATIONS = Object.freeze(["document", "canvas"]);
function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
function freezeArtifactMetadata(artifact, index) {
  if (!artifact || typeof artifact !== "object") {
    throw new TypeError(`Artifact ${index + 1} must be an object.`);
  }
  if (typeof artifact.id !== "string" || artifact.id.length === 0) {
    throw new TypeError(`Artifact ${index + 1} requires an id.`);
  }
  return Object.freeze({
    id: artifact.id,
    title: typeof artifact.title === "string" && artifact.title.length > 0 ? artifact.title : `Artifact ${index + 1}`,
    sha256: typeof artifact.sha256 === "string" ? artifact.sha256 : "",
    viewport: Object.freeze({
      width: positiveInteger(artifact.viewport?.width, 1440),
      height: positiveInteger(artifact.viewport?.height, 900)
    }),
    colorScheme: ["light", "dark"].includes(artifact.colorScheme) ? artifact.colorScheme : "light"
  });
}
function requestedArtifactId(value) {
  if (typeof value === "string") return value;
  return typeof value?.id === "string" ? value.id : "";
}
function availableId(artifacts, requested, fallback = "") {
  return artifacts.some(({ id }) => id === requested) ? requested : fallback;
}
function normalizeViewMode(value, artifactCount) {
  if (artifactCount < 2) return "single";
  return ["single", "variants", "split"].includes(value) ? value : "variants";
}
function createArtifactStagePayload(envelope = {}, { viewer } = {}) {
  const artifacts = Object.freeze(
    (Array.isArray(envelope?.artifacts) ? envelope.artifacts : []).map(freezeArtifactMetadata)
  );
  const sourceViewer = viewer && typeof viewer === "object" ? viewer : envelope?.viewer && typeof envelope.viewer === "object" ? envelope.viewer : {};
  const firstId = artifacts[0]?.id ?? "";
  const activeArtifactId = availableId(
    artifacts,
    requestedArtifactId(sourceViewer.activeArtifactId),
    firstId
  );
  const mode = normalizeViewMode(sourceViewer.mode, artifacts.length);
  return Object.freeze({
    schemaVersion: "1.0.0",
    artifacts,
    viewer: Object.freeze({
      mode,
      activeArtifactId,
      ...PRESENTATIONS.includes(sourceViewer.presentation) ? { presentation: sourceViewer.presentation } : {}
    })
  });
}

// packages/artifact/lib/artifact/ui/tokens.mjs
import { fileURLToPath as __planrAssetFile2 } from "node:url";
import { readFileSync as readFileSync2 } from "node:fs";
import { createRequire as createRequire2 } from "node:module";

// packages/artifact/lib/artifact/internal/contrast.mjs
var clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
var srgbToLinear = (c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
var linearToSrgb = (c) => {
  c = clamp01(c);
  return c <= 31308e-7 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
};
function parseHex(s) {
  let h = s.replace("#", "").trim();
  if (h.length === 3 || h.length === 4)
    h = h.split("").map((d) => d + d).join("");
  if (h.length !== 6 && h.length !== 8) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b].some(Number.isNaN) ? null : { r, g, b };
}
function parseRgb(s) {
  const m = /rgba?\(([^)]+)\)/i.exec(s);
  if (!m) return null;
  const parts = m[1].split(/[,\s/]+/).filter(Boolean).slice(0, 3);
  if (parts.length < 3) return null;
  const toUnit = (p) => p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p) / 255;
  const [r, g, b] = parts.map(toUnit);
  return [r, g, b].some((x) => !Number.isFinite(x)) ? null : { r: clamp01(r), g: clamp01(g), b: clamp01(b) };
}
function parseOklch(s) {
  const m = /oklch\(([^)]+)\)/i.exec(s);
  if (!m) return null;
  const parts = m[1].split(/[\s/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  let [L, C, H] = parts;
  L = L.endsWith("%") ? parseFloat(L) / 100 : parseFloat(L);
  C = parseFloat(C);
  H = parseFloat(H);
  if (![L, C, H].every(Number.isFinite)) return null;
  const h = H * Math.PI / 180;
  const a = C * Math.cos(h);
  const b2 = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b2;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b2;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b2;
  const l = l_ ** 3, mm = m_ ** 3, ss = s_ ** 3;
  return {
    r: linearToSrgb(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss)
  };
}
var NAMED = { white: { r: 1, g: 1, b: 1 }, black: { r: 0, g: 0, b: 0 } };
function parseColor(input) {
  if (!input || typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  if (s.includes("var(") || s.includes("gradient") || ["currentcolor", "transparent", "inherit", "none"].includes(s))
    return null;
  if (s in NAMED) return NAMED[s];
  if (s.startsWith("#")) return parseHex(s);
  if (s.startsWith("rgb")) return parseRgb(s);
  if (s.startsWith("oklch")) return parseOklch(s);
  return null;
}
function relativeLuminance(color) {
  if (!color) return null;
  const { r, g, b } = color;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastRatio(a, b) {
  const la = relativeLuminance(typeof a === "string" ? parseColor(a) : a);
  const lb = relativeLuminance(typeof b === "string" ? parseColor(b) : b);
  if (la == null || lb == null) return null;
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}
var AA_NORMAL = 4.5;

// packages/artifact/lib/artifact/ui/tokens.mjs
var require22 = createRequire2(new URL("./runtime/packages/artifact/lib/artifact/ui/tokens.mjs", import.meta.url).href);
var ARTIFACT_THEME_REGISTRY_PATH = __planrAssetFile2(new URL("./runtime/packages/protocol/registries/artifact-theme.json", import.meta.url));
var ARTIFACT_THEME_SCHEMA_PATH = __planrAssetFile2(new URL("./runtime/packages/protocol/schemas/v1.14.0/artifact-theme.schema.json", import.meta.url));
var ARTIFACT_THEME_ERROR_CODES = Object.freeze({
  PARSE: "E_ARTIFACT_THEME_PARSE",
  SCHEMA: "E_ARTIFACT_THEME_SCHEMA",
  TOKEN_MISSING: "E_ARTIFACT_THEME_TOKEN_MISSING",
  TOKEN_UNKNOWN: "E_ARTIFACT_THEME_TOKEN_UNKNOWN",
  FORMAT: "E_ARTIFACT_THEME_FORMAT",
  LAYOUT: "E_ARTIFACT_THEME_LAYOUT",
  MOTION: "E_ARTIFACT_THEME_MOTION",
  CONTRAST: "E_ARTIFACT_THEME_CONTRAST"
});
var ArtifactThemeError = class extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ArtifactThemeError";
    this.code = code;
    this.details = details;
  }
};
var TYPOGRAPHY_KEYS = Object.freeze(["display", "body", "mono"]);
var LAYOUT_KEYS = Object.freeze([
  "toolbarHeight",
  "reviewRailWidth",
  "radiusSmall",
  "radiusMedium",
  "radiusLarge",
  "motionFastMs",
  "motionBaseMs"
]);
var THEME_NAMES = Object.freeze(["dark", "light"]);
var COLOR_KEYS = Object.freeze([
  "background",
  "chrome",
  "panel",
  "raised",
  "stage",
  "rule",
  "text",
  "textMuted",
  "primary",
  "primaryStrong",
  "onPrimary",
  "warning",
  "danger",
  "onDanger",
  "question",
  "onQuestion",
  "resolved",
  "onResolved",
  "onImprove"
]);
var AA_PAIRS = Object.freeze([
  ["text", "background"],
  ["text", "chrome"],
  ["text", "panel"],
  ["text", "raised"],
  ["text", "stage"],
  ["textMuted", "background"],
  ["textMuted", "panel"],
  ["primary", "background"],
  ["primaryStrong", "background"],
  ["onPrimary", "primary"],
  ["onPrimary", "primaryStrong"],
  ["warning", "background"],
  ["danger", "background"],
  ["onDanger", "danger"],
  ["onQuestion", "question"],
  ["onResolved", "resolved"],
  ["onImprove", "primaryStrong"]
]);
function readJson(path, label) {
  try {
    return JSON.parse(readFileSync2(path, "utf8"));
  } catch (error) {
    throw new ArtifactThemeError(
      ARTIFACT_THEME_ERROR_CODES.PARSE,
      `Unable to parse ${label}: ${error.message}`,
      { path }
    );
  }
}
function schemaCode(issue) {
  if (issue.rule === "required") return ARTIFACT_THEME_ERROR_CODES.TOKEN_MISSING;
  if (issue.rule === "additionalProperties") return ARTIFACT_THEME_ERROR_CODES.TOKEN_UNKNOWN;
  if (issue.rule === "pattern") return ARTIFACT_THEME_ERROR_CODES.FORMAT;
  if (issue.path.includes(".layout.motion")) return ARTIFACT_THEME_ERROR_CODES.MOTION;
  if (issue.path.includes(".layout.")) return ARTIFACT_THEME_ERROR_CODES.LAYOUT;
  return ARTIFACT_THEME_ERROR_CODES.SCHEMA;
}
function assertSchema(theme, schema) {
  const issues = validateJson(theme, schema);
  if (issues.length === 0) return;
  const first = issues[0];
  throw new ArtifactThemeError(
    schemaCode(first),
    `Invalid artifact theme at ${first.path}: ${first.detail}`,
    { issues }
  );
}
function assertLayout(layout) {
  if (layout.toolbarHeight !== 48 || layout.reviewRailWidth !== 344) {
    throw new ArtifactThemeError(
      ARTIFACT_THEME_ERROR_CODES.LAYOUT,
      "Artifact shell layout must keep a 48px toolbar and 344px review rail.",
      { toolbarHeight: layout.toolbarHeight, reviewRailWidth: layout.reviewRailWidth }
    );
  }
  const radii = ["radiusSmall", "radiusMedium", "radiusLarge"].map((key) => [key, layout[key]]);
  const invalidRadius = radii.find(
    ([, value]) => !Number.isInteger(value) || value < 0 || value > 32
  );
  if (invalidRadius) {
    throw new ArtifactThemeError(
      ARTIFACT_THEME_ERROR_CODES.LAYOUT,
      `${invalidRadius[0]} must be an integer from 0 through 32.`,
      { token: invalidRadius[0], value: invalidRadius[1] }
    );
  }
  if (!(layout.radiusSmall <= layout.radiusMedium && layout.radiusMedium <= layout.radiusLarge)) {
    throw new ArtifactThemeError(
      ARTIFACT_THEME_ERROR_CODES.LAYOUT,
      "Artifact shell radii must be ordered small <= medium <= large.",
      { radii: Object.fromEntries(radii) }
    );
  }
}
function assertMotion(layout) {
  for (const token of ["motionFastMs", "motionBaseMs"]) {
    const value = layout[token];
    if (!Number.isInteger(value) || value < 120 || value > 200) {
      throw new ArtifactThemeError(
        ARTIFACT_THEME_ERROR_CODES.MOTION,
        `${token} must be an integer from 120 through 200 milliseconds.`,
        { token, value }
      );
    }
  }
  if (layout.motionFastMs > layout.motionBaseMs) {
    throw new ArtifactThemeError(
      ARTIFACT_THEME_ERROR_CODES.MOTION,
      "motionFastMs must not exceed motionBaseMs.",
      { motionFastMs: layout.motionFastMs, motionBaseMs: layout.motionBaseMs }
    );
  }
}
function assertContrast(themes) {
  for (const themeName of THEME_NAMES) {
    const colors = themes[themeName];
    for (const [foreground, background] of AA_PAIRS) {
      const ratio = contrastRatio(colors[foreground], colors[background]);
      if (ratio == null || ratio < 4.5) {
        throw new ArtifactThemeError(
          ARTIFACT_THEME_ERROR_CODES.CONTRAST,
          `${themeName}.${foreground} on ${themeName}.${background} must meet WCAG AA (4.5:1).`,
          { theme: themeName, foreground, background, ratio }
        );
      }
    }
  }
}
function validateArtifactTheme(theme, { schema } = {}) {
  const contract = schema ?? readJson(ARTIFACT_THEME_SCHEMA_PATH, "artifact theme schema");
  assertSchema(theme, contract);
  assertLayout(theme.layout);
  assertMotion(theme.layout);
  assertContrast(theme.themes);
  return theme;
}
function pick(source, keys) {
  return Object.fromEntries(keys.map((key) => [key, source[key]]));
}
function normalizeArtifactTheme(theme) {
  validateArtifactTheme(theme);
  return {
    kind: theme.kind,
    schemaVersion: theme.schemaVersion,
    protocolVersion: theme.protocolVersion,
    name: theme.name,
    typography: pick(theme.typography, TYPOGRAPHY_KEYS),
    layout: pick(theme.layout, LAYOUT_KEYS),
    themes: Object.fromEntries(
      THEME_NAMES.map((themeName) => [themeName, pick(theme.themes[themeName], COLOR_KEYS)])
    )
  };
}
function loadArtifactTheme({
  registryPath = ARTIFACT_THEME_REGISTRY_PATH,
  schemaPath = ARTIFACT_THEME_SCHEMA_PATH
} = {}) {
  const registry = readJson(registryPath, "artifact theme registry");
  const schema = readJson(schemaPath, "artifact theme schema");
  validateArtifactTheme(registry, { schema });
  return normalizeArtifactTheme(registry);
}
function kebab(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
function colorVariables(colors) {
  return COLOR_KEYS.map((key) => `  --planr-color-${kebab(key)}: ${colors[key]};`).join("\n");
}
function renderArtifactThemeCss(theme) {
  const value = normalizeArtifactTheme(theme);
  const { typography, layout, themes } = value;
  const foundations = [
    `  --planr-font-display: "${typography.display}", ui-sans-serif, system-ui, sans-serif;`,
    `  --planr-font-body: "${typography.body}", ui-sans-serif, system-ui, sans-serif;`,
    `  --planr-font-mono: "${typography.mono}", ui-monospace, SFMono-Regular, Consolas, monospace;`,
    `  --planr-toolbar-height: ${layout.toolbarHeight}px;`,
    `  --planr-review-rail-width: ${layout.reviewRailWidth}px;`,
    `  --planr-radius-small: ${layout.radiusSmall}px;`,
    `  --planr-radius-medium: ${layout.radiusMedium}px;`,
    `  --planr-radius-large: ${layout.radiusLarge}px;`,
    `  --planr-motion-fast: ${layout.motionFastMs}ms;`,
    `  --planr-motion-base: ${layout.motionBaseMs}ms;`
  ].join("\n");
  return [
    "/* Generated by scripts/generate-artifact-shell.mjs. Do not edit. */",
    ":root,",
    '[data-planr-theme="dark"] {',
    foundations,
    colorVariables(themes.dark),
    "}",
    "",
    '[data-planr-theme="light"] {',
    colorVariables(themes.light),
    "}",
    "",
    "@media (prefers-color-scheme: light) {",
    "  :root:not([data-planr-theme]),",
    '  [data-planr-theme="auto"] {',
    colorVariables(themes.light).replaceAll(/^/gm, "  "),
    "  }",
    "}",
    "",
    "@media (prefers-reduced-motion: reduce) {",
    "  :root {",
    "    --planr-motion-fast: 0ms;",
    "    --planr-motion-base: 0ms;",
    "  }",
    "}",
    ""
  ].join("\n");
}

// packages/artifact/lib/artifact/ui/shell.mjs
var ARTIFACT_SHELL_VERSION = "1.2.1";
var ARTIFACT_SHELL_ASSET_PATHS = Object.freeze({
  template: "templates/artifact-review-shell.html",
  stageRuntime: "templates/artifact-review-stage.js",
  manifest: "lib/artifact/ui/generated/artifact-shell-assets.json",
  themeCss: "lib/artifact/ui/generated/artifact-theme.css",
  themeJson: "lib/artifact/ui/generated/artifact-theme.json"
});
var ARTIFACT_SHELL_CSS = readFileSync3(new URL("./studio-shell.css", new URL("./runtime/packages/artifact/lib/artifact/ui/shell.mjs", import.meta.url).href), "utf8") + `
* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; }
body {
  overflow: hidden;
  background: var(--planr-color-background);
  color: var(--planr-color-text);
  font: 400 13px/1.45 var(--planr-font-body);
  -webkit-font-smoothing: antialiased;
}
button, input, select, textarea { font: inherit; }
button { color: inherit; }
button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--planr-color-primary);
  outline-offset: 2px;
}
[hidden] { display: none !important; }
.planr-visually-hidden {
  position: fixed;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.planr-shell {
  height: 100%;
  display: grid;
  grid-template-rows: var(--planr-toolbar-height) minmax(0, 1fr);
  background: var(--planr-color-background);
}
.planr-toolbar {
  position: relative;
  z-index: 40;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px 0 14px;
  border-bottom: 1px solid var(--planr-color-rule);
  background: color-mix(in srgb, var(--planr-color-chrome) 96%, transparent);
}
.planr-brand { min-width: 0; display: flex; align-items: center; gap: 9px; }
.planr-mark { display: inline-grid; place-items: center; width: 22px; height: 22px; flex: none; color: var(--planr-color-primary); contain: paint; }
.planr-mark svg { display: block; width: 100%; height: 100%; }
.planr-title-block { min-width: 0; display: flex; align-items: baseline; gap: 8px; }
.planr-title-block strong {
  max-width: 260px;
  overflow: hidden;
  color: var(--planr-color-text);
  font: 650 13px/1 var(--planr-font-display);
  letter-spacing: -.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.planr-title-block span, .planr-privacy {
  color: var(--planr-color-text-muted);
  font: 10px/1 var(--planr-font-mono);
  white-space: nowrap;
}
.planr-privacy { display: inline-flex; align-items: center; gap: 6px; font-family: var(--planr-font-body); }
.planr-privacy::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--planr-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--planr-color-primary) 14%, transparent);
}
.planr-toolbar-spacer { flex: 1; }
.planr-room-manager { display: inline-flex; align-items: center; gap: 5px; }
.planr-room-manager button { height: 28px; border: 1px solid var(--planr-color-rule); border-radius: var(--planr-radius-small); background: var(--planr-color-panel); color: var(--planr-color-text-muted); font: 650 10px/1 var(--planr-font-body); padding: 0 8px; }
.planr-room-manager button:last-child { border-color: color-mix(in srgb, var(--planr-color-danger) 55%, var(--planr-color-rule)); color: var(--planr-color-danger); }
.planr-shell[data-planr-room-comments-paused] [data-planr-mode="comment"],
.planr-shell[data-planr-room-comments-paused] [data-planr-action="add-comment"] { cursor: not-allowed; opacity: .48; }
.planr-domain-toolbar { min-width: 0; display: inline-flex; align-items: center; gap: 6px; }
.planr-segment {
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-medium);
  background: var(--planr-color-background);
}
.planr-segment button, .planr-toolbar-action {
  height: 24px;
  border: 0;
  border-radius: var(--planr-radius-small);
  background: transparent;
  color: var(--planr-color-text-muted);
  cursor: pointer;
  transition: color var(--planr-motion-fast), background var(--planr-motion-fast), transform var(--planr-motion-fast);
}
.planr-segment button { min-width: 26px; padding: 0 8px; font-size: 11px; font-weight: 650; }
.planr-segment button[aria-pressed="true"] {
  background: var(--planr-color-primary);
  color: var(--planr-color-background);
}
.planr-segment button:disabled { opacity: .45; cursor: not-allowed; }
.planr-toolbar-action {
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--planr-color-rule);
  color: var(--planr-color-text);
  font-weight: 700;
  text-transform: capitalize;
}
.planr-toolbar-action:hover, .planr-segment button:not(:disabled):hover { background: var(--planr-color-raised); color: var(--planr-color-text); }
.planr-toolbar-action:active, .planr-segment button:not(:disabled):active { transform: scale(.97); }
.planr-share { border-color: var(--planr-color-primary); background: var(--planr-color-primary); color: var(--planr-color-background); }
.planr-count {
  min-width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  padding-inline: 4px;
  border-radius: 999px;
  background: var(--planr-color-raised);
  color: var(--planr-color-text-muted);
  font: 10px/1 var(--planr-font-mono);
}
.planr-floating-actions {
  position: fixed;
  z-index: 45;
  top: 50%;
  right: max(12px, env(safe-area-inset-right));
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 5px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-large);
  background: color-mix(in srgb, var(--planr-color-chrome) 94%, transparent);
  box-shadow: 0 12px 36px color-mix(in srgb, var(--planr-color-background) 38%, transparent);
  backdrop-filter: blur(16px);
  transform: translateY(-50%);
}
.planr-floating-actions > button,
.planr-floating-actions > .planr-more > button {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--planr-radius-medium);
  background: transparent;
  color: var(--planr-color-text);
  cursor: pointer;
  transition: color var(--planr-motion-fast), background var(--planr-motion-fast), transform var(--planr-motion-fast);
}
.planr-floating-actions button:hover,
.planr-floating-actions button[aria-pressed="true"],
.planr-floating-actions button[aria-expanded="true"] {
  background: var(--planr-color-raised);
  color: var(--planr-color-primary);
}
.planr-floating-actions button:active { transform: scale(.96); }
.planr-floating-actions button:disabled { cursor: not-allowed; opacity: .48; }
.planr-floating-actions svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}
.planr-floating-actions svg circle { fill: currentColor; stroke: none; }
.planr-floating-actions [data-planr-action="feedback"] .planr-count {
  position: absolute;
  top: 2px;
  right: 1px;
  min-width: 16px;
  height: 16px;
  padding-inline: 3px;
  background: var(--planr-color-primary);
  color: var(--planr-color-background);
  font-size: 9px;
}
.planr-floating-actions [data-planr-tooltip]::after {
  content: attr(data-planr-tooltip);
  position: absolute;
  top: 50%;
  right: calc(100% + 10px);
  width: max-content;
  max-width: 220px;
  padding: 6px 8px;
  border-radius: var(--planr-radius-small);
  background: var(--planr-color-text);
  color: var(--planr-color-background);
  font: 650 10px/1.2 var(--planr-font-body);
  opacity: 0;
  pointer-events: none;
  transform: translate(4px, -50%);
  transition: opacity var(--planr-motion-fast), transform var(--planr-motion-fast);
}
.planr-floating-actions [data-planr-tooltip]:hover::after,
.planr-floating-actions [data-planr-tooltip]:focus-visible::after {
  opacity: 1;
  transform: translate(0, -50%);
}
.planr-action-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.planr-more { position: relative; }
.planr-more-menu {
  position: absolute;
  right: calc(100% + 10px);
  bottom: 0;
  width: 250px;
  padding: 8px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-medium);
  background: var(--planr-color-panel);
  box-shadow: 0 16px 48px color-mix(in srgb, var(--planr-color-background) 42%, transparent);
}
.planr-more-menu > div:first-child { display: grid; gap: 2px; padding: 7px 8px 10px; }
.planr-more-menu strong { font-size: 12px; }
.planr-more-menu span { color: var(--planr-color-text-muted); font-size: 10px; }
.planr-more-menu > button {
  width: 100%;
  min-height: 36px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--planr-radius-small);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.planr-more-menu > button:hover { background: var(--planr-color-raised); }
.planr-comments-scrim {
  position: fixed;
  z-index: 40;
  inset: 0;
  border: 0;
  background: color-mix(in srgb, var(--planr-color-background) 8%, transparent);
  cursor: default;
  opacity: 1;
  transition: opacity var(--planr-motion-fast);
}
.planr-shell[data-planr-rail-open="false"] .planr-comments-scrim {
  opacity: 0;
  pointer-events: none;
}
.planr-workspace {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--planr-review-rail-width);
  transition: grid-template-columns var(--planr-motion-base);
}
.planr-shell[data-planr-rail-open="false"] .planr-workspace { grid-template-columns: minmax(0, 1fr) 0; }
.planr-stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background-color: var(--planr-color-stage);
  background-image: radial-gradient(color-mix(in srgb, var(--planr-color-text-muted) 20%, transparent) 1px, transparent 1px);
  background-size: 20px 20px;
}
.planr-stage-heading {
  position: absolute;
  z-index: 12;
  inset: 0 0 auto;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  color: var(--planr-color-text-muted);
  font: 10px/1 var(--planr-font-mono);
  pointer-events: none;
}
.planr-stage-controls {
  position: absolute;
  z-index: 13;
  inset: 34px 0 auto;
  min-width: 0;
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px 7px;
  background: linear-gradient(var(--planr-color-stage) 72%, transparent);
}
.planr-view-modes { flex: none; }
.planr-variants {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: auto;
  scrollbar-width: none;
}
.planr-variants button {
  flex: none;
  height: 28px;
  max-width: 220px;
  overflow: hidden;
  padding: 0 10px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: var(--planr-color-chrome);
  color: var(--planr-color-text-muted);
  cursor: pointer;
  font-size: 10px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.planr-variants button span { font-family: var(--planr-font-mono); }
.planr-variants button[aria-selected="true"] { border-color: var(--planr-color-primary); color: var(--planr-color-text); }
.planr-stage-scroll { position: absolute; inset: 76px 0 0; overflow: auto; padding: 8px 34px 64px; }
.planr-stage-surface {
  width: max-content;
  min-width: 100%;
  transform: scale(var(--planr-shell-zoom));
  transform-origin: top left;
  transition: transform var(--planr-motion-fast);
}
.planr-frame-grid { width: max-content; display: grid; grid-auto-flow: column; grid-auto-columns: max-content; gap: 12px; }
.planr-frame-grid[data-planr-layout="single"] .planr-frame-label { display: none; }
.planr-artifact-panel {
  position: relative;
  width: var(--planr-artifact-width);
  height: var(--planr-artifact-height);
}
.planr-frame {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 0;
  border-radius: var(--planr-radius-medium);
  background: var(--planr-color-chrome);
  box-shadow: inset 0 0 0 1px var(--planr-color-rule), 0 18px 60px color-mix(in srgb, var(--planr-color-background) 52%, transparent);
}
.planr-frame iframe { width: 100%; height: 100%; display: block; border: 0; background: var(--planr-color-chrome); }
.planr-frame-label {
  position: absolute;
  z-index: 4;
  inset: 10px auto auto 10px;
  padding: 5px 7px;
  border-radius: var(--planr-radius-small);
  background: color-mix(in srgb, var(--planr-color-background) 78%, transparent);
  color: var(--planr-color-text);
  font: 9px/1 var(--planr-font-mono);
  pointer-events: none;
}
${ARTIFACT_ANNOTATION_CSS}.planr-stage-status {
  position: absolute;
  z-index: 20;
  inset: 76px 0 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--planr-color-stage) 94%, transparent);
  text-align: center;
}
.planr-stage-status > div {
  max-width: 400px;
  padding: 24px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-large);
  background: var(--planr-color-chrome);
  box-shadow: 0 18px 60px color-mix(in srgb, var(--planr-color-background) 50%, transparent);
}
.planr-stage-status strong { display: block; margin-bottom: 7px; font: 650 18px/1.2 var(--planr-font-display); }
.planr-stage-status p { margin: 0; color: var(--planr-color-text-muted); }
.planr-review-rail {
  min-width: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  overflow: hidden;
  border-left: 1px solid var(--planr-color-rule);
  background: var(--planr-color-panel);
  transition: opacity var(--planr-motion-fast), transform var(--planr-motion-base);
}
.planr-domain-rail { max-height: 44vh; overflow: auto; padding: 12px 14px; border-top: 1px solid var(--planr-color-rule); }
.planr-domain-rail[hidden] { display: none; }
.planr-domain-rail h3 { margin: 0 0 8px; font: 650 12px/1.2 var(--planr-font-display); }
.planr-domain-rail details { border-top: 1px solid var(--planr-color-rule); }
.planr-domain-rail summary { padding: 9px 0; color: var(--planr-color-text); cursor: pointer; font-weight: 700; }
.planr-domain-section-body { padding: 1px 0 10px; }
.planr-domain-rail fieldset { margin: 0 0 9px; padding: 9px; border: 1px solid var(--planr-color-rule); border-radius: var(--planr-radius-small); }
.planr-domain-rail legend { padding: 0 4px; color: var(--planr-color-text); font-size: 11px; font-weight: 700; }
.planr-domain-rail label { display: grid; gap: 5px; margin-bottom: 8px; color: var(--planr-color-text-muted); font-size: 11px; }
.planr-domain-rail input, .planr-domain-rail select, .planr-domain-rail textarea {
  width: 100%; border: 1px solid var(--planr-color-rule); border-radius: var(--planr-radius-small);
  background: var(--planr-color-background); color: var(--planr-color-text); padding: 7px 8px;
}
.planr-domain-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.planr-domain-remix { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8px; }
.planr-domain-remix label:last-child { grid-column: 1 / -1; }
.planr-domain-section-body > p { margin: 8px 0 0; color: var(--planr-color-text-muted); font-size: 10px; }
.planr-domain-actions button, .planr-domain-toolbar button {
  min-height: 28px; border: 1px solid var(--planr-color-rule); border-radius: var(--planr-radius-small);
  background: var(--planr-color-raised); color: var(--planr-color-text); padding: 0 9px; cursor: pointer;
}
.planr-shell[data-planr-rail-open="false"] .planr-review-rail { opacity: 0; pointer-events: none; }
.planr-review-rail > header {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid var(--planr-color-rule);
}
.planr-review-rail h2 { margin: 0; font: 650 13px/1 var(--planr-font-display); }
.planr-review-metrics { display: flex; align-items: center; gap: 6px; }
.planr-review-header-actions { display: flex; align-items: center; gap: 8px; }
.planr-rail-close {
  width: 32px;
  height: 32px;
  display: none;
  place-items: center;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: var(--planr-color-raised);
  color: var(--planr-color-text);
  font: 20px/1 var(--planr-font-body);
  cursor: pointer;
}
.planr-identity { padding: 10px 14px 0; border-bottom: 1px solid var(--planr-color-rule); }
.planr-identity label { margin-bottom: 5px; }
.planr-identity-status { min-height: 16px; margin: 0 0 8px !important; color: var(--planr-color-text-muted); font-size: 10px !important; }
.planr-identity-status[data-planr-identity-ready="true"] { color: var(--planr-color-primary); }
.planr-identity-status[data-planr-identity-ready="true"]::before { margin-right: 4px; content: '\u2713'; font-weight: 800; }
.planr-feedback-slot { overflow: auto; padding: 14px; }
.planr-feedback-slot > p {
  margin: 0;
  padding: 18px;
  border: 1px dashed var(--planr-color-rule);
  border-radius: var(--planr-radius-medium);
  color: var(--planr-color-text-muted);
  text-align: center;
}
.planr-thread-list { display: grid; gap: 10px; }
.planr-review-empty {
  margin: 0;
  padding: 18px;
  border: 1px dashed var(--planr-color-rule);
  border-radius: var(--planr-radius-medium);
  color: var(--planr-color-text-muted);
  text-align: center;
}
.planr-thread {
  padding: 11px;
  border: 1px solid var(--planr-color-rule);
  border-left: 3px solid var(--planr-color-danger);
  border-radius: var(--planr-radius-medium);
  background: var(--planr-color-chrome);
}
.planr-thread[data-planr-intent="improve"] { border-left-color: var(--planr-color-primary-strong); }
.planr-thread[data-planr-intent="question"] { border-left-color: var(--planr-color-question); }
.planr-thread[data-planr-status="resolved"], .planr-thread[data-planr-status="addressed"] { border-left-color: var(--planr-color-resolved); opacity: .82; }
.planr-thread > header { display: flex; align-items: center; gap: 7px; color: var(--planr-color-text-muted); font-size: 10px; }
.planr-thread > header strong { color: var(--planr-color-text); font-size: 11px; }
.planr-thread > header time { margin-left: auto; font-family: var(--planr-font-mono); }
.planr-review-byline { display: flex; align-items: center; gap: 6px; }
.planr-intent { color: var(--planr-color-text-muted); text-transform: capitalize; }
.planr-thread-comment { margin: 9px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.planr-thread-actions { display: flex; gap: 6px; }
.planr-thread-actions button { min-height: 28px; padding-inline: 8px; font-size: 10px; }
.planr-replies { display: grid; gap: 7px; margin: 10px 0 0 12px; padding-left: 10px; border-left: 1px solid var(--planr-color-rule); list-style: none; }
.planr-reply { margin: 0; }
.planr-reply header { display: flex; gap: 6px; color: var(--planr-color-text-muted); font-size: 9px; }
.planr-reply header time { margin-left: auto; font-family: var(--planr-font-mono); }
.planr-reply p { margin: 4px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.planr-reply-editor { margin-top: 8px; }
.planr-thread .planr-reply-toggle { min-height: 28px; padding: 2px 0; border-color: transparent; background: transparent; color: var(--planr-color-text-muted); font-size: 12px; font-weight: 550; }
.planr-thread .planr-reply-toggle:hover, .planr-thread .planr-reply-toggle[aria-expanded="true"] { color: var(--planr-color-primary-strong); }
.planr-reply-form { display: grid; gap: 6px; margin-top: 6px; }
.planr-reply-form[hidden] { display: none; }
.planr-reply-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.planr-reply-form textarea { min-height: 64px; max-height: 180px; resize: vertical; font: 13px/1.5 var(--planr-font-body); }
.planr-reply-controls { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.planr-reply-hint { font-size: 11px; color: var(--planr-color-text-muted); }
.planr-reply-form .planr-reply-send { display: grid; place-items: center; flex: 0 0 30px; width: 30px; min-width: 30px; height: 30px; min-height: 30px; padding: 0; border-radius: 7px; }
.planr-reply-form .planr-reply-send:disabled { opacity: .35; cursor: not-allowed; }
${ARTIFACT_ANNOTATION_MOBILE_CSS}
.planr-decision-slot { padding: 12px; border-top: 1px solid var(--planr-color-rule); background: var(--planr-color-chrome); }
.planr-decision-slot label { display: block; margin-bottom: 6px; color: var(--planr-color-text-muted); font-size: 11px; }
.planr-decision-slot textarea {
  width: 100%;
  min-height: 58px;
  resize: vertical;
  padding: 9px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: var(--planr-color-panel);
  color: var(--planr-color-text);
}
.planr-decision-slot > div { display: grid; grid-template-columns: 1fr 1.2fr; gap: 8px; margin-top: 8px; }
.planr-decision-slot button {
  min-height: 32px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: transparent;
  cursor: pointer;
  font-weight: 700;
}
.planr-decision-slot button[data-planr-decision="approved"] { border-color: var(--planr-color-primary); color: var(--planr-color-primary); }
.planr-decision-slot button[data-planr-decision="changes_requested"] { border-color: var(--planr-color-danger); background: var(--planr-color-danger); color: var(--planr-color-on-danger); }
.planr-decision-slot button[aria-pressed="true"] { box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 25%, transparent); }
.planr-decision-slot > p { min-height: 16px; margin: 7px 0 0; color: var(--planr-color-text-muted); font-size: 10px; }
[data-planr-slot="dialogs"] { position: fixed; z-index: 80; inset: 0; pointer-events: none; }
.planr-dialog-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: color-mix(in srgb, var(--planr-color-background) 76%, transparent);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}
.planr-share-dialog {
  width: min(560px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-large);
  background: var(--planr-color-chrome);
  box-shadow: 0 28px 100px color-mix(in srgb, var(--planr-color-background) 68%, transparent);
  animation: planr-dialog-in var(--planr-motion-base);
}
.planr-share-dialog > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 18px 12px;
}
.planr-share-dialog h2 { margin: 0 0 4px; font: 650 18px/1.15 var(--planr-font-display); letter-spacing: -.025em; }
.planr-share-dialog p { margin: 0; color: var(--planr-color-text-muted); font-size: 12px; }
.planr-dialog-close {
  width: 32px;
  height: 32px;
  flex: none;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: transparent;
  color: var(--planr-color-text-muted);
  cursor: pointer;
  font-size: 18px;
}
.planr-share-receipt {
  margin: 8px 18px 10px;
  overflow: hidden;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-medium);
  background: var(--planr-color-panel);
}
.planr-share-receipt-row {
  width: 100%;
  min-height: 68px;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border: 0;
  border-bottom: 1px solid var(--planr-color-rule);
  background: transparent;
  color: var(--planr-color-text);
  text-align: left;
  cursor: pointer;
}
.planr-share-receipt-row:last-child { border-bottom: 0; }
.planr-share-receipt-row.is-selected {
  background: color-mix(in srgb, var(--planr-color-primary) 8%, var(--planr-color-panel));
  box-shadow: inset 3px 0 var(--planr-color-primary);
}
.planr-share-receipt-row:disabled { opacity: .55; cursor: not-allowed; }
.planr-share-receipt-row strong { display: block; margin-bottom: 3px; font-size: 12px; }
.planr-share-receipt-row small { display: block; color: var(--planr-color-text-muted); font-size: 10.5px; }
.planr-share-receipt-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: var(--planr-radius-small);
  background: var(--planr-color-raised);
  font: 12px/1 var(--planr-font-mono);
}
.planr-share-receipt-size {
  color: var(--planr-color-primary);
  font: 9px/1.25 var(--planr-font-mono);
  letter-spacing: .04em;
  text-align: right;
  text-transform: uppercase;
}
.planr-share-threshold { padding: 0 18px; font: 10px/1.4 var(--planr-font-mono); }
.planr-share-ttl { margin: 12px 18px 0; padding: 12px; border: 1px solid var(--planr-color-rule); border-radius: var(--planr-radius-medium); background: var(--planr-color-panel); }
.planr-share-ttl label { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--planr-color-text); font-weight: 700; }
.planr-share-ttl select {
  min-height: 34px;
  padding: 0 28px 0 9px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: var(--planr-color-chrome);
  color: var(--planr-color-text);
}
.planr-share-ttl p { margin-top: 8px; font-size: 10.5px; }
.planr-owner-custody { margin: 12px 18px 0; padding: 12px; border: 1px solid var(--planr-color-rule); border-radius: var(--planr-radius-medium); background: color-mix(in srgb, var(--planr-color-warning) 7%, var(--planr-color-panel)); }
.planr-owner-custody strong, .planr-live-capability strong { display: block; margin-bottom: 3px; color: var(--planr-color-warning); }
.planr-owner-custody p, .planr-live-capability p { margin: 4px 0 0; font-size: 10.5px; }
.planr-share-result { margin: 12px 18px 0; padding: 12px; border: 1px solid var(--planr-color-primary); border-radius: var(--planr-radius-medium); background: color-mix(in srgb, var(--planr-color-primary) 6%, var(--planr-color-panel)); }
.planr-share-result > label { display: block; margin-bottom: 6px; color: var(--planr-color-text-muted); font-size: 10px; }
.planr-share-result > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 7px; }
.planr-share-result input {
  min-width: 0;
  padding: 8px 9px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: var(--planr-color-chrome);
  color: var(--planr-color-text);
  font: 10px/1.3 var(--planr-font-mono);
}
.planr-live-capability { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--planr-color-rule); }
.planr-live-capability > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 7px; margin-top: 7px; }
.planr-share-result button, .planr-share-dialog footer button, .planr-hosted-viewer button {
  min-height: 34px;
  padding: 0 11px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-small);
  background: transparent;
  color: var(--planr-color-text);
  cursor: pointer;
  font-weight: 700;
}
.planr-share-result button[data-planr-copy-state], .planr-toolbar-action[data-planr-copy-state] {
  min-width: 96px;
  transition: border-color var(--planr-motion-fast), background var(--planr-motion-fast), color var(--planr-motion-fast), transform var(--planr-motion-fast);
}
.planr-share-result button[data-planr-copy-state]::before, .planr-toolbar-action[data-planr-copy-state]::before {
  display: inline-grid;
  width: 17px;
  height: 17px;
  place-items: center;
  margin-right: 6px;
  border-radius: 50%;
  content: '';
  font: 800 11px/1 var(--planr-font-mono);
  vertical-align: -1px;
}
.planr-share-result button[data-planr-copy-state="copied"], .planr-toolbar-action[data-planr-copy-state="copied"] {
  border-color: var(--planr-color-primary);
  background: color-mix(in srgb, var(--planr-color-primary) 12%, transparent);
  color: var(--planr-color-primary-strong);
  animation: planr-copy-confirm var(--planr-motion-base);
}
.planr-share-result button[data-planr-copy-state="copied"]::before, .planr-toolbar-action[data-planr-copy-state="copied"]::before { background: var(--planr-color-primary); color: var(--planr-color-background); content: '\u2713'; }
.planr-share-result button[data-planr-copy-state="error"], .planr-toolbar-action[data-planr-copy-state="error"] { border-color: var(--planr-color-danger); color: var(--planr-color-danger); }
.planr-share-result button[data-planr-copy-state="error"]::before, .planr-toolbar-action[data-planr-copy-state="error"]::before { border: 1px solid currentColor; content: '!'; }
.planr-deletion-receipt { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--planr-color-rule); }
.planr-deletion-receipt strong { display: block; margin-bottom: 3px; color: var(--planr-color-warning); }
.planr-deletion-receipt code { display: block; margin: 9px 0; padding: 9px; overflow-wrap: anywhere; border-radius: var(--planr-radius-small); background: var(--planr-color-background); color: var(--planr-color-text); }
.planr-share-error { margin: 10px 18px 0 !important; color: var(--planr-color-danger) !important; }
.planr-share-dialog > footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 18px 18px; }
.planr-share-dialog footer .planr-share-confirm { border-color: var(--planr-color-primary); background: var(--planr-color-primary); color: var(--planr-color-background); }
.planr-share-dialog footer button:disabled { opacity: .55; cursor: wait; }
.planr-hosted-viewer {
  position: fixed;
  z-index: 70;
  inset: var(--planr-toolbar-height) 0 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--planr-color-stage);
}
.planr-hosted-viewer > div {
  width: min(420px, 100%);
  padding: 28px;
  border: 1px solid var(--planr-color-rule);
  border-radius: var(--planr-radius-large);
  background: var(--planr-color-chrome);
  text-align: center;
  box-shadow: 0 18px 60px color-mix(in srgb, var(--planr-color-background) 50%, transparent);
}
.planr-hosted-viewer .planr-mark { width: 40px; height: 40px; margin-bottom: 20px; }
.planr-hosted-viewer strong { display: block; margin-bottom: 7px; font: 650 19px/1.2 var(--planr-font-display); }
.planr-hosted-viewer p { margin: 0; color: var(--planr-color-text-muted); }
.planr-hosted-viewer button { margin-top: 16px; border-color: var(--planr-color-primary); color: var(--planr-color-primary); }
@keyframes planr-dialog-in { from { opacity: 0; transform: translateY(8px) scale(.985); } }
@keyframes planr-copy-confirm { 50% { transform: translateY(-1px); } }
@media (max-width: 900px) {
  .planr-title-block > span, .planr-privacy, .planr-toolbar .planr-segment:first-of-type { display: none; }
  .planr-title-block strong { max-width: 170px; }
  .planr-workspace, .planr-shell[data-planr-rail-open="false"] .planr-workspace { grid-template-columns: minmax(0, 1fr); }
  .planr-review-rail {
    position: fixed;
    z-index: 50;
    inset: auto 0 0;
    height: min(52vh, 480px);
    height: min(52dvh, 480px);
    max-height: calc(100dvh - var(--planr-toolbar-height));
    padding-bottom: env(safe-area-inset-bottom, 0px);
    overscroll-behavior: contain;
    border: 1px solid var(--planr-color-rule);
    border-radius: var(--planr-radius-large) var(--planr-radius-large) 0 0;
    box-shadow: 0 18px 60px color-mix(in srgb, var(--planr-color-background) 52%, transparent);
  }
  .planr-shell[data-planr-rail-open="false"] .planr-review-rail { opacity: 0; visibility: hidden; transform: translate3d(0, calc(100% + env(safe-area-inset-bottom, 0px)), 0); }
  .planr-rail-close { display: grid; }
  .planr-stage-scroll { padding-left: 14px; }
}
@media (max-width: 620px) {
  .planr-toolbar {
    gap: 5px;
    padding-left: max(8px, env(safe-area-inset-left));
    padding-right: max(8px, env(safe-area-inset-right));
  }
  .planr-brand { max-width: 128px; }
  .planr-title-block strong { max-width: 96px; }
  .planr-toolbar [data-planr-mode] { min-width: 42px; padding-inline: 7px; }
  .planr-toolbar [data-planr-mode="interact"] { font-size: 0; }
  .planr-toolbar [data-planr-mode="interact"]::before { content: "View"; font-size: 11px; }
  .planr-toolbar-action { padding-inline: 8px; }
  .planr-stage-controls { padding-inline: 10px; }
  .planr-dialog-backdrop { align-items: end; padding: 0; }
  .planr-share-dialog { width: 100%; max-height: min(78vh, 680px); border-radius: var(--planr-radius-large) var(--planr-radius-large) 0 0; }
}
@media (max-width: 390px) {
  .planr-toolbar { gap: 5px; padding-inline: 8px; }
  .planr-brand { max-width: 20px; }
  .planr-title-block { display: none; }
  .planr-toolbar-action[data-planr-action="feedback"] { min-width: 32px; padding-inline: 6px; }
  .planr-toolbar-action[data-planr-action="feedback"] .planr-feedback-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .planr-variants button { max-width: 150px; padding-inline: 8px; }
  .planr-share-receipt-row { grid-template-columns: 28px minmax(0, 1fr); }
  .planr-share-receipt-size { grid-column: 2; text-align: left; }
  .planr-share-result > div { grid-template-columns: 1fr; }
}
/* Document presentation: the artifact owns the page; the iframe is only an
   opaque-origin security boundary and has no visible canvas treatment. */
html[data-planr-presentation="document"],
html[data-planr-presentation="document"] body {
  height: auto;
  min-height: 100%;
}
html[data-planr-presentation="document"] body { overflow: visible; }
.planr-shell[data-planr-presentation="document"] {
  height: auto;
  min-height: 100vh;
  display: block;
}
.planr-shell[data-planr-presentation="document"] .planr-workspace,
.planr-shell[data-planr-presentation="document"][data-planr-rail-open="false"] .planr-workspace {
  display: block;
}
.planr-shell[data-planr-presentation="document"] .planr-stage {
  overflow: visible;
  background: transparent;
}
.planr-shell[data-planr-presentation="document"] .planr-stage-scroll {
  position: static;
  overflow: visible;
  padding: 0;
}
.planr-shell[data-planr-presentation="document"] .planr-stage-surface {
  width: 100%;
  min-width: 100%;
  transform: none;
}
.planr-shell[data-planr-presentation="document"] .planr-frame-grid {
  width: 100%;
  display: block;
}
.planr-shell[data-planr-presentation="document"] .planr-artifact-panel {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: var(--planr-document-height, max(var(--planr-artifact-height), 100vh));
  min-height: 100vh;
}
.planr-shell[data-planr-presentation="document"] .planr-frame {
  overflow: visible;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.planr-shell[data-planr-presentation="document"] .planr-frame iframe {
  width: 100%;
  max-width: 100%;
  background: transparent;
}
.planr-shell[data-planr-presentation="document"] .planr-frame-label { display: none; }
.planr-shell[data-planr-presentation="document"] .planr-stage-status { inset: 0; min-height: 100vh; }
.planr-shell[data-planr-presentation="document"] .planr-review-rail {
  position: fixed;
  z-index: 50;
  inset: 0 0 0 auto;
  width: min(var(--planr-review-rail-width), 100vw);
  border-left: 1px solid var(--planr-color-rule);
  box-shadow: -18px 0 60px color-mix(in srgb, var(--planr-color-background) 34%, transparent);
}
.planr-shell[data-planr-presentation="document"][data-planr-rail-open="false"] .planr-review-rail {
  opacity: 1;
  transform: translateX(100%);
}
@media (max-width: 900px) {
  .planr-shell[data-planr-presentation="document"] .planr-floating-actions {
    top: auto;
    right: max(12px, env(safe-area-inset-right));
    bottom: max(12px, env(safe-area-inset-bottom));
    flex-direction: row;
    transform: none;
  }
  .planr-shell[data-planr-presentation="document"] .planr-floating-actions > button,
  .planr-shell[data-planr-presentation="document"] .planr-floating-actions > .planr-more > button {
    width: 44px;
    height: 44px;
  }
  .planr-shell[data-planr-presentation="document"] .planr-floating-actions [data-planr-tooltip]::after { display: none; }
  .planr-shell[data-planr-presentation="document"] .planr-more-menu {
    right: 0;
    bottom: calc(100% + 10px);
  }
  .planr-shell[data-planr-presentation="document"] .planr-review-rail {
    inset: auto 0 0;
    width: 100%;
    max-height: 100dvh;
  }
  .planr-shell[data-planr-presentation="document"][data-planr-rail-open="false"] .planr-review-rail {
    transform: translate3d(0, calc(100% + env(safe-area-inset-bottom, 0px)), 0);
  }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0s !important;
  }
}
`;
var DEFAULT_ARTIFACT_SHELL_INPUT = Object.freeze({
  envelope: Object.freeze({ artifacts: Object.freeze([]) }),
  viewer: Object.freeze({ mode: "single", status: "loading" }),
  shell: Object.freeze({
    title: "OpenPlanr artifact review",
    privacy: "local",
    theme: "auto",
    railOpen: false,
    feedbackCount: 0,
    zoom: 72
  })
});
function renderArtifactShellDocument(input = DEFAULT_ARTIFACT_SHELL_INPUT, { theme, stageRuntimeUrl = "./artifact-review-stage.js" } = {}) {
  const model = normalizeArtifactShellModel(input);
  const canonicalTheme = theme ?? loadArtifactTheme();
  const themeCss = renderArtifactThemeCss(canonicalTheme);
  const shellMarkup = renderArtifactShellMarkup(model);
  const modelData = renderArtifactShellModelData(model);
  const stagePayload = createArtifactStagePayload(input.envelope, {
    viewer: input.viewer ?? input.envelope?.viewer
  });
  const reviewState = Object.freeze({
    schemaVersion: "1.0.0",
    reviewOf: digestArtifactEnvelope({
      schemaVersion: input.envelope?.schemaVersion ?? "1.0.0",
      ...input.envelope?.sources ? { sources: input.envelope.sources } : {},
      artifacts: input.envelope?.artifacts ?? [],
      viewer: input.envelope?.viewer ?? input.viewer ?? {}
    }),
    review: input.envelope?.review ?? null
  });
  return `<!doctype html>
<html lang="en" data-planr-theme="${model.theme}" data-planr-presentation="${model.presentation}" data-planr-artifact-shell="${ARTIFACT_SHELL_VERSION}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' data: blob:; script-src 'self' 'unsafe-inline' data: blob:; frame-src blob:; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'self'; worker-src data: blob:; object-src 'none'; form-action 'none'; base-uri 'none'">
  <title>${escapeHtml(model.title)} \xB7 OpenPlanr</title>
  <style>
${themeCss}${ARTIFACT_SHELL_CSS}</style>
</head>
<body>
${shellMarkup}
<script type="application/json" id="planr-artifact-shell-model">${modelData}</script>
<script type="application/json" id="planr-artifact-stage-payload">${embedJson(stagePayload)}</script>
<script type="application/json" id="planr-artifact-review-state">${embedJson(reviewState)}</script>
<script src="${escapeHtml(stageRuntimeUrl)}" defer></script>
</body>
</html>
`;
}
function renderArtifactShellTemplate({ theme } = {}) {
  return renderArtifactShellDocument(DEFAULT_ARTIFACT_SHELL_INPUT, { theme });
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
  createSharedArtifactEnvelope,
  contrastRatio,
  AA_NORMAL,
  escapeHtml,
  embedJson,
  renderPlanrMark,
  ARTIFACT_SHELL_VERSION,
  ARTIFACT_SHELL_ASSET_PATHS,
  ARTIFACT_SHELL_CSS,
  DEFAULT_ARTIFACT_SHELL_INPUT,
  renderArtifactShellDocument,
  renderArtifactShellTemplate
};
