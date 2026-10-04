#!/usr/bin/env node

// packages/design/lib/design/plan-handoff-utility.mjs
import { realpathSync as realpathSync5 } from "node:fs";
import { resolve as resolve6 } from "node:path";
import { fileURLToPath } from "node:url";

// packages/design/lib/design/handoff-reader.mjs
import { existsSync as existsSync5, readFileSync as readFileSync6 } from "node:fs";
import { dirname as dirname6, join as join8 } from "node:path";

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
  constructor(code, message2, fix = "", details = void 0) {
    super(message2);
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

// packages/protocol/src/canonical-json.mjs
var hasOwn = (value, key) => Object.hasOwn(value, key);
function assertUnicodeScalarString(value, path) {
  for (let index2 = 0; index2 < value.length; index2 += 1) {
    const code = value.charCodeAt(index2);
    if (code >= 55296 && code <= 56319) {
      const next = value.charCodeAt(index2 + 1);
      if (!(next >= 56320 && next <= 57343)) {
        throw new TypeError(`JCS cannot canonicalize a lone high surrogate at ${path}.`);
      }
      index2 += 1;
    } else if (code >= 56320 && code <= 57343) {
      throw new TypeError(`JCS cannot canonicalize a lone low surrogate at ${path}.`);
    }
  }
}
function serialize(value, path, seen) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") {
    assertUnicodeScalarString(value, path);
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`JCS requires a finite number at ${path}.`);
    return JSON.stringify(value);
  }
  if (typeof value !== "object")
    throw new TypeError(`JCS cannot canonicalize ${typeof value} at ${path}.`);
  if (seen.has(value)) throw new TypeError(`JCS cannot canonicalize a cycle at ${path}.`);
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const entries2 = [];
      for (let index2 = 0; index2 < value.length; index2 += 1) {
        if (!hasOwn(value, index2))
          throw new TypeError(`JCS cannot canonicalize a sparse array at ${path}[${index2}].`);
        entries2.push(serialize(value[index2], `${path}[${index2}]`, seen));
      }
      return `[${entries2.join(",")}]`;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`JCS requires a plain JSON object at ${path}.`);
    }
    const entries = Object.keys(value).sort().map((key) => {
      assertUnicodeScalarString(key, `${path} key`);
      return `${JSON.stringify(key)}:${serialize(value[key], `${path}.${key}`, seen)}`;
    });
    return `{${entries.join(",")}}`;
  } finally {
    seen.delete(value);
  }
}
function canonicalizeJson(value) {
  return serialize(value, "$", /* @__PURE__ */ new Set());
}
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
function assertPlainDataAt(value, label, depth, seen) {
  if (depth > 64) throw new TypeError(`${label} exceeds the maximum nesting depth.`);
  if (value === null || ["string", "boolean"].includes(typeof value)) return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value !== "object" || seen.has(value))
    throw new TypeError(`${label} must be finite, acyclic JSON.`);
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    throw new TypeError(`${label} must contain only plain JSON objects.`);
  seen.add(value);
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (["__proto__", "prototype", "constructor"].includes(key) || !Object.hasOwn(descriptor, "value"))
      throw new TypeError(`${label} contains a forbidden property.`);
    assertPlainDataAt(descriptor.value, label, depth + 1, seen);
  }
  seen.delete(value);
}
function assertPlainData(value, label) {
  assertPlainDataAt(value, label, 0, /* @__PURE__ */ new Set());
}

// packages/protocol/src/json-schema.mjs
var typeOf = (v) => {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (Number.isInteger(v)) return "integer";
  if (typeof v === "number") return "number";
  return typeof v;
};
var matchesType = (v, t) => {
  if (t === "integer") return Number.isInteger(v);
  if (t === "number") return typeof v === "number";
  if (t === "string") return typeof v === "string";
  if (t === "boolean") return typeof v === "boolean";
  if (t === "null") return v === null;
  if (t === "array") return Array.isArray(v);
  if (t === "object") return v !== null && typeof v === "object" && !Array.isArray(v);
  return false;
};
var FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/;
var FORMAT_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
function resolveJsonPointer(root, reference) {
  if (reference === "#") return root;
  if (!reference.startsWith("#/")) return null;
  return reference.slice(2).split("/").map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~")).reduce((value, part) => value?.[part], root);
}
var validateNode = (value, schema7, path, errs, context) => {
  if (schema7 === true) return;
  if (schema7 === false) {
    errs.push({ path, rule: "schema:false", detail: "value not allowed" });
    return;
  }
  if (typeof schema7?.$ref === "string") {
    const reference = schema7.$ref;
    let resolved;
    let nextRoot = context.rootSchema;
    let resolvedBase = context.base;
    if (reference.startsWith("#")) {
      resolved = resolveJsonPointer(context.rootSchema, reference);
    } else if (typeof context.resolveRef === "function") {
      const result = context.resolveRef(reference, { base: context.base });
      resolved = result?.schema ?? result;
      nextRoot = result?.rootSchema ?? resolved;
      resolvedBase = result?.base ?? resolved?.$id ?? context.base;
    }
    if (!resolved) {
      errs.push({ path, rule: "$ref", detail: `could not resolve schema reference ${reference}` });
      return;
    }
    const referenceKey = `${context.base ?? "<root>"}:${reference}`;
    if (context.referenceStack.includes(referenceKey)) {
      errs.push({ path, rule: "$ref", detail: `circular schema reference ${reference}` });
      return;
    }
    validateNode(value, resolved, path, errs, {
      ...context,
      rootSchema: nextRoot,
      base: resolvedBase,
      referenceStack: [...context.referenceStack, referenceKey]
    });
  }
  if (schema7.type !== void 0) {
    const types = Array.isArray(schema7.type) ? schema7.type : [schema7.type];
    if (!types.some((t) => matchesType(value, t))) {
      errs.push({
        path,
        rule: "type",
        detail: `expected ${types.join("|")}, got ${typeOf(value)}`
      });
      return;
    }
  }
  if (schema7.const !== void 0) {
    if (value !== schema7.const) {
      errs.push({
        path,
        rule: "const",
        detail: `expected ${JSON.stringify(schema7.const)}, got ${JSON.stringify(value)}`
      });
    }
  }
  if (Array.isArray(schema7.enum)) {
    if (!schema7.enum.includes(value)) {
      errs.push({
        path,
        rule: "enum",
        detail: `value ${JSON.stringify(value)} not in enum [${schema7.enum.map((x) => JSON.stringify(x)).join(", ")}]`
      });
    }
  }
  if (typeof value === "string") {
    if (typeof schema7.minLength === "number" && value.length < schema7.minLength) {
      errs.push({
        path,
        rule: "minLength",
        detail: `length ${value.length} < ${schema7.minLength}`
      });
    }
    if (typeof schema7.maxLength === "number" && value.length > schema7.maxLength) {
      errs.push({
        path,
        rule: "maxLength",
        detail: `length ${value.length} > ${schema7.maxLength}`
      });
    }
    if (typeof schema7.pattern === "string") {
      try {
        if (!new RegExp(schema7.pattern).test(value)) {
          errs.push({
            path,
            rule: "pattern",
            detail: `value ${JSON.stringify(value)} does not match /${schema7.pattern}/`
          });
        }
      } catch (e) {
        errs.push({
          path,
          rule: "pattern",
          detail: `invalid regex /${schema7.pattern}/: ${e instanceof Error ? e.message : String(e)}`
        });
      }
    }
    if (typeof schema7.format === "string") {
      if (schema7.format === "date" && !FORMAT_DATE.test(value)) {
        errs.push({
          path,
          rule: "format:date",
          detail: `value ${JSON.stringify(value)} is not YYYY-MM-DD`
        });
      } else if (schema7.format === "date-time" && !FORMAT_DATETIME.test(value)) {
        errs.push({
          path,
          rule: "format:date-time",
          detail: `value ${JSON.stringify(value)} is not ISO 8601 date-time`
        });
      }
    }
  }
  if (typeof value === "number") {
    if (typeof schema7.minimum === "number" && value < schema7.minimum) {
      errs.push({ path, rule: "minimum", detail: `value ${value} < ${schema7.minimum}` });
    }
    if (typeof schema7.maximum === "number" && value > schema7.maximum) {
      errs.push({ path, rule: "maximum", detail: `value ${value} > ${schema7.maximum}` });
    }
  }
  if (Array.isArray(value)) {
    if (typeof schema7.minItems === "number" && value.length < schema7.minItems) {
      errs.push({ path, rule: "minItems", detail: `length ${value.length} < ${schema7.minItems}` });
    }
    if (typeof schema7.maxItems === "number" && value.length > schema7.maxItems) {
      errs.push({ path, rule: "maxItems", detail: `length ${value.length} > ${schema7.maxItems}` });
    }
    const prefixLength = Array.isArray(schema7.prefixItems) ? schema7.prefixItems.length : 0;
    if (prefixLength > 0) {
      for (let i = 0; i < Math.min(value.length, prefixLength); i++) {
        validateNode(value[i], schema7.prefixItems[i], `${path}[${i}]`, errs, context);
      }
    }
    if (schema7.items !== void 0) {
      for (let i = prefixLength; i < value.length; i++) {
        validateNode(value[i], schema7.items, `${path}[${i}]`, errs, context);
      }
    }
    if (schema7.uniqueItems === true) {
      const seen = /* @__PURE__ */ new Set();
      for (const item3 of value) {
        const key = JSON.stringify(item3);
        if (seen.has(key)) {
          errs.push({ path, rule: "uniqueItems", detail: `duplicate item ${key}` });
          break;
        }
        seen.add(key);
      }
    }
    if (schema7.contains !== void 0) {
      let matches = 0;
      for (let index2 = 0; index2 < value.length; index2 += 1) {
        const containedErrors = [];
        validateNode(value[index2], schema7.contains, `${path}[${index2}]`, containedErrors, context);
        if (containedErrors.length === 0) matches += 1;
      }
      const minimum = Number.isSafeInteger(schema7.minContains) ? schema7.minContains : 1;
      const maximum = Number.isSafeInteger(schema7.maxContains) ? schema7.maxContains : null;
      if (matches < minimum) {
        errs.push({
          path,
          rule: "contains",
          detail: `matched ${matches} contained items; expected at least ${minimum}`
        });
      }
      if (maximum !== null && matches > maximum) {
        errs.push({
          path,
          rule: "contains",
          detail: `matched ${matches} contained items; expected at most ${maximum}`
        });
      }
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    if (Array.isArray(schema7.required)) {
      for (const req of schema7.required) {
        if (!Object.hasOwn(value, req)) {
          errs.push({ path, rule: "required", detail: `missing required property '${req}'` });
        }
      }
    }
    const props = schema7.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (!Object.hasOwn(props, k)) {
        if (schema7.additionalProperties === false) {
          errs.push({ path, rule: "additionalProperties", detail: `unknown property '${k}'` });
        } else if (schema7.additionalProperties === true || schema7.additionalProperties !== null && typeof schema7.additionalProperties === "object") {
          validateNode(v, schema7.additionalProperties, `${path}.${k}`, errs, context);
        }
      }
    }
    for (const [k, v] of Object.entries(value)) {
      if (Object.hasOwn(props, k)) validateNode(v, props[k], `${path}.${k}`, errs, context);
    }
  }
  if (Array.isArray(schema7.oneOf)) {
    let matched = 0;
    for (const sub of schema7.oneOf) {
      const e = [];
      validateNode(value, sub, path, e, context);
      if (e.length === 0) matched++;
    }
    if (matched !== 1) {
      const titles = schema7.oneOf.map((s) => s.title || "(unnamed)").join(" | ");
      errs.push({
        path,
        rule: "oneOf",
        detail: `matched ${matched}/${schema7.oneOf.length} branches (expected exactly 1). Branches: ${titles}`
      });
    }
  }
  if (Array.isArray(schema7.anyOf)) {
    let matched = 0;
    for (const sub of schema7.anyOf) {
      const candidateErrors = [];
      validateNode(value, sub, path, candidateErrors, context);
      if (candidateErrors.length === 0) matched += 1;
    }
    if (matched === 0) {
      const titles = schema7.anyOf.map((sub) => sub.title || "(unnamed)").join(" | ");
      errs.push({
        path,
        rule: "anyOf",
        detail: `matched 0/${schema7.anyOf.length} branches (expected at least 1). Branches: ${titles}`
      });
    }
  }
  if (Array.isArray(schema7.allOf)) {
    for (const sub of schema7.allOf) {
      validateNode(value, sub, path, errs, context);
    }
  }
  if (schema7.if !== void 0) {
    const conditionErrors = [];
    validateNode(value, schema7.if, path, conditionErrors, context);
    const branch = conditionErrors.length === 0 ? schema7.then : schema7.else;
    if (branch !== void 0) validateNode(value, branch, path, errs, context);
  }
  if (schema7.not !== void 0) {
    const e = [];
    validateNode(value, schema7.not, path, e, context);
    if (e.length === 0) {
      errs.push({ path, rule: "not", detail: "value matched a forbidden subschema" });
    }
  }
};
var validateJson = (value, schema7, {
  resolveRef,
  base = (
    /** @type {{ $id?: string } | null | undefined} */
    schema7?.$id ?? null
  )
} = {}) => {
  const errs = [];
  validateNode(value, schema7, "$", errs, {
    rootSchema: schema7,
    resolveRef,
    base,
    referenceStack: []
  });
  return errs;
};

// packages/protocol/src/enterprise-contracts.mjs
var ENTERPRISE_CONTRACT_VERSION = "1.0.0";
var ENTERPRISE_PROTOCOL_VERSION = "1.12.0";
var ENTERPRISE_ID_PATTERN = "^[A-Za-z0-9][A-Za-z0-9_-]{0,127}(?![\\s\\S])";
var ENTERPRISE_REVIEW_CATEGORIES = Object.freeze([
  "question",
  "suggestion",
  "change-request",
  "blocker"
]);
var ENTERPRISE_ACTIONS = Object.freeze([
  "organization.manage",
  "ownership.transfer",
  "billing.manage",
  "audit.read",
  "project.create",
  "project.manage",
  "artifact.read",
  "artifact.author",
  "artifact.export",
  "review.write",
  "review.resolve"
]);
var id = { type: "string", pattern: ENTERPRISE_ID_PATTERN };
var semanticId = {
  type: "string",
  minLength: 1,
  maxLength: 512,
  pattern: "^[^\\s\\u0000-\\u001f\\u007f]+$"
};
var nullableId = { anyOf: [id, { type: "null" }] };
var digest = { type: "string", minLength: 64, maxLength: 64, pattern: "^[a-f0-9]{64}$" };
var timestamp = {
  type: "string",
  format: "date-time",
  pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z$"
};
var text = { type: "string", minLength: 1, maxLength: 16384 };
var title = { ...text, maxLength: 240 };
var closed = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required
});
var list = (items, maxItems = 1e3) => ({ type: "array", items, maxItems });
var schema = (name, properties, required) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.12.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: ENTERPRISE_PROTOCOL_VERSION },
  ...closed(properties, required)
});
var envelope = (kind) => ({
  kind: { const: `openplanr-${kind}` },
  schemaVersion: { const: ENTERPRISE_CONTRACT_VERSION }
});
var scoped = { organizationId: id, projectId: id };
var versionedArtifact = { ...scoped, artifactId: id, revisionId: id };
var activeStatus = { enum: ["active", "revoked"] };
var projectRole = { enum: ["maintainer", "author", "reviewer", "viewer"] };
var ENTERPRISE_ACCESS_CONTEXT_SCHEMA = schema(
  "enterprise-access-context",
  {
    actor: closed({ id, verified: { type: "boolean" } }),
    organization: closed({ id, status: { enum: ["active", "suspended"] } }),
    membership: closed({
      organizationId: id,
      actorId: id,
      role: { enum: ["owner", "admin", "member"] },
      status: activeStatus
    }),
    projectMembership: closed({ ...scoped, actorId: id, role: projectRole, status: activeStatus }),
    guestGrant: closed({
      ...scoped,
      artifactId: id,
      actorId: id,
      role: { enum: ["reviewer", "viewer"] },
      status: activeStatus,
      expiresAt: timestamp
    }),
    resource: closed({ organizationId: id, projectId: id, artifactId: id }, ["organizationId"]),
    action: { enum: ENTERPRISE_ACTIONS },
    now: timestamp
  },
  ["actor", "organization", "resource", "action", "now"]
);
var ENTERPRISE_ARTIFACT_REVISION_SCHEMA = schema("enterprise-artifact-revision", {
  ...envelope("enterprise-artifact-revision"),
  id,
  ...scoped,
  artifactId: id,
  parentRevisionId: nullableId,
  contentDigest: digest,
  contentType: { enum: ["application/json", "text/markdown", "image/svg+xml", "text/html"] },
  byteLength: { type: "integer", minimum: 0, maximum: 5 * 1024 * 1024 },
  createdAt: timestamp,
  actorId: id
});
var ENTERPRISE_REVIEW_ANCHOR_SCHEMA = {
  ...closed(
    {
      revisionId: id,
      elementId: semanticId,
      screenId: semanticId,
      frameId: semanticId,
      x: { type: "number", minimum: 0, maximum: 1 },
      y: { type: "number", minimum: 0, maximum: 1 }
    },
    ["revisionId"]
  ),
  anyOf: [
    { required: ["elementId"] },
    { required: ["screenId", "frameId"] },
    { required: ["x", "y"] }
  ],
  allOf: [
    { if: { required: ["x"] }, then: { required: ["y"] } },
    { if: { required: ["y"] }, then: { required: ["x"] } },
    { if: { required: ["frameId"] }, then: { required: ["screenId"] } }
  ]
};
var reply = closed({ id, authorId: id, body: text, createdAt: timestamp });
var ENTERPRISE_REVIEW_THREAD_SCHEMA = {
  ...schema(
    "enterprise-review-thread",
    {
      ...envelope("enterprise-review-thread"),
      id,
      ...scoped,
      artifactId: id,
      anchor: ENTERPRISE_REVIEW_ANCHOR_SCHEMA,
      category: { enum: ENTERPRISE_REVIEW_CATEGORIES },
      status: { enum: ["open", "addressed", "resolved"] },
      authorId: id,
      body: text,
      createdAt: timestamp,
      updatedAt: timestamp,
      replies: list(reply, 1e4),
      assigneeId: nullableId,
      addressedRevisionId: id,
      resolvedAt: timestamp
    },
    [
      "kind",
      "schemaVersion",
      "id",
      "organizationId",
      "projectId",
      "artifactId",
      "anchor",
      "category",
      "status",
      "authorId",
      "body",
      "createdAt",
      "updatedAt",
      "replies"
    ]
  ),
  allOf: [
    {
      if: { properties: { status: { const: "addressed" } } },
      then: { required: ["addressedRevisionId"], not: { required: ["resolvedAt"] } }
    },
    {
      if: { properties: { status: { const: "resolved" } } },
      then: { required: ["resolvedAt"] },
      else: { not: { required: ["resolvedAt"] } }
    }
  ]
};
var collection = { enum: ["nodes", "relations", "groups", "events", "items"] };
var ENTERPRISE_CHANGE_OPERATION_SCHEMA = {
  oneOf: [
    closed({ op: { const: "replace-document" }, content: { type: "object" } }),
    closed({
      op: { const: "set-field" },
      targetId: semanticId,
      field: { enum: ["label", "description", "status", "title"] },
      value: { type: "string", maxLength: 16384 }
    }),
    closed({
      op: { const: "add-element" },
      collection,
      element: {
        type: "object",
        required: ["id"],
        properties: { id: semanticId },
        additionalProperties: true
      }
    }),
    closed({ op: { const: "remove-element" }, collection, targetId: semanticId }),
    closed({
      op: { const: "set-layout" },
      targetId: semanticId,
      x: { type: "number", minimum: -1e7, maximum: 1e7 },
      y: { type: "number", minimum: -1e7, maximum: 1e7 }
    })
  ]
};
var ENTERPRISE_CHANGE_PROPOSAL_SCHEMA = {
  ...schema(
    "enterprise-change-proposal",
    {
      ...envelope("enterprise-change-proposal"),
      id,
      ...scoped,
      artifactId: id,
      baseRevisionId: id,
      authorId: id,
      createdAt: timestamp,
      status: { enum: ["draft", "proposed", "accepted", "rejected", "applied", "conflicted"] },
      summary: title,
      operations: { ...list(ENTERPRISE_CHANGE_OPERATION_SCHEMA, 1e3), minItems: 1 },
      validation: closed({
        status: { enum: ["pending", "passed", "failed"] },
        issues: list(
          closed({ code: id, message: text, targetId: semanticId }, ["code", "message"])
        )
      }),
      application: closed(
        {
          revisionId: id,
          appliedAt: timestamp,
          actorId: id,
          gitCommit: { type: "string", pattern: "^(?:[a-f0-9]{40}|[a-f0-9]{64})$" }
        },
        ["revisionId", "appliedAt", "actorId"]
      )
    },
    [
      "kind",
      "schemaVersion",
      "id",
      "organizationId",
      "projectId",
      "artifactId",
      "baseRevisionId",
      "authorId",
      "createdAt",
      "status",
      "summary",
      "operations",
      "validation"
    ]
  ),
  allOf: [
    {
      if: { properties: { status: { const: "applied" } } },
      then: {
        required: ["application"],
        properties: { validation: { properties: { status: { const: "passed" } } } }
      },
      else: { not: { required: ["application"] } }
    },
    {
      if: { properties: { status: { const: "accepted" } } },
      then: { properties: { validation: { properties: { status: { const: "passed" } } } } }
    }
  ]
};
var ENTERPRISE_EVIDENCE_REFERENCE_SCHEMA = schema(
  "enterprise-evidence-reference",
  {
    ...envelope("enterprise-evidence-reference"),
    id,
    ...scoped,
    source: {
      oneOf: [
        closed(
          {
            kind: { const: "repository" },
            repositoryId: id,
            path: text,
            commit: { type: "string", pattern: "^(?:[a-f0-9]{40}|[a-f0-9]{64})$" },
            line: { type: "integer", minimum: 1, maximum: 1e9 }
          },
          ["kind", "repositoryId", "path", "commit"]
        ),
        closed(
          { kind: { const: "artifact" }, artifactId: id, revisionId: id, elementId: semanticId },
          ["kind", "artifactId", "revisionId"]
        ),
        closed({ kind: { const: "url" }, url: { type: "string", minLength: 1, maxLength: 2048 } })
      ]
    },
    capturedAt: timestamp,
    freshness: { enum: ["current", "stale", "unknown"] },
    label: title,
    contentDigest: digest
  },
  [
    "kind",
    "schemaVersion",
    "id",
    "organizationId",
    "projectId",
    "source",
    "capturedAt",
    "freshness",
    "label"
  ]
);
var ENTERPRISE_SYNC_STATE_SCHEMA = schema("enterprise-sync-state", {
  ...envelope("enterprise-sync-state"),
  ...scoped,
  repositoryId: id,
  direction: { enum: ["push", "pull"] },
  status: { enum: ["preview", "pending", "synchronized", "failed", "conflicted"] },
  scope: { ...list(id, 1e4), uniqueItems: true },
  cursor: { type: ["string", "null"], maxLength: 2048 },
  operationId: id,
  updatedAt: timestamp,
  items: list(
    closed({
      artifactId: id,
      baseRevisionId: nullableId,
      revisionId: nullableId,
      contentDigest: digest,
      action: { enum: ["create", "update", "unchanged", "conflict"] }
    }),
    1e4
  ),
  issues: list(closed({ code: id, artifactId: id, message: text }, ["code", "message"]))
});
var ENTERPRISE_AGENT_HANDOFF_SCHEMA = schema("enterprise-agent-handoff", {
  ...envelope("enterprise-agent-handoff"),
  ...versionedArtifact,
  generatedAt: timestamp,
  authority: { const: "feedback-only" },
  contentTrust: { const: "untrusted" },
  threads: list(ENTERPRISE_REVIEW_THREAD_SCHEMA, 1e4),
  evidence: list(ENTERPRISE_EVIDENCE_REFERENCE_SCHEMA, 1e4),
  unresolvedUncertainties: list(text),
  contentDigest: digest
});
var ENTERPRISE_SCHEMAS = deepFreeze({
  "enterprise-access-context": ENTERPRISE_ACCESS_CONTEXT_SCHEMA,
  "enterprise-artifact-revision": ENTERPRISE_ARTIFACT_REVISION_SCHEMA,
  "enterprise-review-thread": ENTERPRISE_REVIEW_THREAD_SCHEMA,
  "enterprise-change-proposal": ENTERPRISE_CHANGE_PROPOSAL_SCHEMA,
  "enterprise-evidence-reference": ENTERPRISE_EVIDENCE_REFERENCE_SCHEMA,
  "enterprise-sync-state": ENTERPRISE_SYNC_STATE_SCHEMA,
  "enterprise-agent-handoff": ENTERPRISE_AGENT_HANDOFF_SCHEMA
});
var projectCapabilities = deepFreeze({
  maintainer: [
    "project.manage",
    "artifact.read",
    "artifact.author",
    "artifact.export",
    "review.write",
    "review.resolve"
  ],
  author: ["artifact.read", "artifact.author", "artifact.export", "review.write", "review.resolve"],
  reviewer: ["artifact.read", "artifact.export", "review.write"],
  viewer: ["artifact.read", "artifact.export"]
});
var noCapabilities = Object.freeze([]);
var organizationCapabilities = deepFreeze({
  owner: [
    "organization.manage",
    "ownership.transfer",
    "billing.manage",
    "audit.read",
    "project.create"
  ],
  admin: ["organization.manage", "billing.manage", "audit.read", "project.create"],
  member: []
});
var editableCollections = Object.freeze(["nodes", "relations", "groups", "events", "items"]);
var identityCollections = Object.freeze([
  ...editableCollections,
  "lanes",
  "series",
  "axes",
  "sets",
  "annotations"
]);

// packages/protocol/src/enterprise-resource-contracts.mjs
var opaqueRevisionId = { type: "string", pattern: "^[A-Za-z0-9_-]{22,64}$" };
function copySchema(value) {
  return structuredClone(value);
}
var anchor = copySchema(ENTERPRISE_REVIEW_ANCHOR_SCHEMA);
var revisionId = {
  anyOf: [opaqueRevisionId, anchor.properties.revisionId]
};
var nullableRevisionId = { anyOf: [revisionId, { type: "null" }] };
function successor(source, name) {
  const value = structuredClone(source);
  value.$id = `https://openplanr.dev/schemas/v1.17.0/${name}.schema.json`;
  value["x-openplanr-contract"] = { id: name, version: "1.17.0" };
  value.properties.schemaVersion = { const: "1.1.0" };
  value.properties.protocolVersion = { const: "1.17.0" };
  value.required.push("protocolVersion");
  return value;
}
var ENTERPRISE_REVIEW_ANCHOR_V11_SCHEMA = deepFreeze({
  ...anchor,
  properties: { ...anchor.properties, revisionId }
});
var thread = successor(ENTERPRISE_REVIEW_THREAD_SCHEMA, "enterprise-review-thread");
thread.properties.anchor = ENTERPRISE_REVIEW_ANCHOR_V11_SCHEMA;
thread.properties.addressedRevisionId = revisionId;
var ENTERPRISE_REVIEW_THREAD_V11_SCHEMA = deepFreeze(thread);
var proposal = successor(ENTERPRISE_CHANGE_PROPOSAL_SCHEMA, "enterprise-change-proposal");
proposal.properties.baseRevisionId = revisionId;
proposal.properties.application.properties.revisionId = revisionId;
var ENTERPRISE_CHANGE_PROPOSAL_V11_SCHEMA = deepFreeze(proposal);
var evidence = successor(ENTERPRISE_EVIDENCE_REFERENCE_SCHEMA, "enterprise-evidence-reference");
evidence.properties.source.oneOf.find(
  (branch) => branch.properties.kind.const === "artifact"
).properties.revisionId = revisionId;
var ENTERPRISE_EVIDENCE_REFERENCE_V11_SCHEMA = deepFreeze(evidence);
var sync = successor(ENTERPRISE_SYNC_STATE_SCHEMA, "enterprise-sync-state");
sync.properties.items.items.properties.baseRevisionId = nullableRevisionId;
sync.properties.items.items.properties.revisionId = nullableRevisionId;
var ENTERPRISE_SYNC_STATE_V11_SCHEMA = deepFreeze(sync);
var handoff = successor(ENTERPRISE_AGENT_HANDOFF_SCHEMA, "enterprise-agent-handoff");
handoff.properties.revisionId = revisionId;
handoff.properties.threads.items = {
  oneOf: [ENTERPRISE_REVIEW_THREAD_SCHEMA, ENTERPRISE_REVIEW_THREAD_V11_SCHEMA]
};
handoff.properties.evidence.items = {
  oneOf: [ENTERPRISE_EVIDENCE_REFERENCE_SCHEMA, ENTERPRISE_EVIDENCE_REFERENCE_V11_SCHEMA]
};
var ENTERPRISE_AGENT_HANDOFF_V11_SCHEMA = deepFreeze(handoff);
var ENTERPRISE_RESOURCE_SCHEMAS = deepFreeze({
  "enterprise-review-thread": ENTERPRISE_REVIEW_THREAD_V11_SCHEMA,
  "enterprise-change-proposal": ENTERPRISE_CHANGE_PROPOSAL_V11_SCHEMA,
  "enterprise-evidence-reference": ENTERPRISE_EVIDENCE_REFERENCE_V11_SCHEMA,
  "enterprise-sync-state": ENTERPRISE_SYNC_STATE_V11_SCHEMA,
  "enterprise-agent-handoff": ENTERPRISE_AGENT_HANDOFF_V11_SCHEMA
});

// packages/protocol/src/sharing-security-contracts.mjs
var ROOM_V3_READ_LIMITS = Object.freeze({
  pageBytes: 8 * 1024 * 1024,
  eventPageBytes: 1024 * 1024,
  eventPageCount: 100,
  aggregateBytes: 128 * 1024 * 1024,
  projectionBytes: 128 * 1024 * 1024,
  retainedEvents: 1e4
});
var ROOM_V3_VERSION = "3.0.0";
var ROOM_V3_GENESIS_HASH = `sha256:${"0".repeat(64)}`;
var ROOM_V3_CAPABILITIES = Object.freeze({
  read: "room-read",
  reviewer: "reviewer-write",
  owner: "owner-verdict",
  management: "room-management"
});
var id2 = { type: "string", pattern: "^[A-Za-z0-9_-]{16,128}$" };
var token = { type: "string", pattern: "^[A-Za-z0-9_-]{43}$" };
var sha = { type: "string", pattern: "^sha256:[a-f0-9]{64}$" };
var digest2 = { type: "string", pattern: "^[a-f0-9]{64}$" };
var integer = { type: "integer", minimum: 0, maximum: Number.MAX_SAFE_INTEGER };
var iso = { type: "string", format: "date-time", maxLength: 40 };
var signature = { type: "string", pattern: "^[A-Za-z0-9_-]{86}$" };
var closed2 = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required
});
var schema2 = (name, properties, required) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.17.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: "1.17.0" },
  ...closed2(properties, required)
});
var ownerKey = closed2({
  algorithm: { const: "ECDSA-P256-SHA256" },
  encoding: { const: "spki-base64url" },
  keyId: sha,
  value: { type: "string", pattern: "^[A-Za-z0-9_-]+$", minLength: 86, maxLength: 342 }
});
var cipher = (limit) => ({
  iv: { type: "string", pattern: "^[A-Za-z0-9_-]{16}$" },
  ciphertext: {
    type: "string",
    pattern: "^[A-Za-z0-9_-]+$",
    minLength: 22,
    maxLength: Math.ceil(limit * 4 / 3)
  }
});
var ROOM_V3_DESCRIPTOR_SCHEMA = schema2("artifact-room-descriptor-v3", {
  schemaVersion: { const: ROOM_V3_VERSION },
  protocolVersion: { const: ROOM_V3_VERSION },
  roomId: id2,
  reviewCommitment: digest2,
  ownerKey,
  capabilities: closed2(
    Object.fromEntries(
      Object.entries(ROOM_V3_CAPABILITIES).map(([key, value]) => [key, { const: value }])
    )
  ),
  createdAt: iso
});
var ROOM_V3_CREATE_SCHEMA = schema2("artifact-room-create-v3", {
  schemaVersion: { const: ROOM_V3_VERSION },
  operation: { const: "create" },
  roomId: id2,
  creationId: token,
  ttl: { enum: ["1d", "7d", "30d"] },
  reviewCommitment: digest2,
  ...cipher(5 * 1024 * 1024),
  ownerKey,
  readCapability: token,
  reviewerCapability: token,
  ownerCapability: token,
  manageCapability: token,
  signature
});
var ROOM_V3_EVENT_SCHEMA = schema2("artifact-room-event-v3", {
  schemaVersion: { const: ROOM_V3_VERSION },
  protocolVersion: { const: ROOM_V3_VERSION },
  roomId: id2,
  eventId: { type: "string", pattern: "^[A-Za-z0-9._:-]{1,128}$" },
  sequence: { ...integer, minimum: 1 },
  predecessor: sha,
  kind: {
    enum: ["pin", "reply", "pin_status", "recommendation", "owner_decision", "review_snapshot"]
  },
  reviewCommitment: digest2,
  authorRole: { enum: ["owner", "reviewer"] },
  authorKey: ownerKey,
  capability: { enum: ["reviewer-write", "owner-verdict"] },
  createdAt: iso,
  ...cipher(256 * 1024),
  ciphertextDigest: sha,
  signature
});
var ROOM_V3_APPEND_SCHEMA = schema2("artifact-room-append-v3", {
  schemaVersion: { const: ROOM_V3_VERSION },
  operation: { const: "append" },
  expectedGeneration: integer,
  record: ROOM_V3_EVENT_SCHEMA
});
var ROOM_V3_READ_PAGE_SCHEMA = schema2(
  "artifact-room-read-page-v3",
  {
    version: { const: "v3" },
    descriptor: ROOM_V3_DESCRIPTOR_SCHEMA,
    expiresAt: iso,
    commentsEnabled: { type: "boolean" },
    generation: integer,
    sequence: { ...integer, maximum: ROOM_V3_READ_LIMITS.retainedEvents },
    head: sha,
    cursor: { ...integer, maximum: ROOM_V3_READ_LIMITS.retainedEvents },
    eventBytes: { ...integer, maximum: ROOM_V3_READ_LIMITS.eventPageBytes },
    events: {
      type: "array",
      maxItems: ROOM_V3_READ_LIMITS.eventPageCount,
      items: ROOM_V3_EVENT_SCHEMA
    },
    nextCursor: {
      oneOf: [
        { ...integer, minimum: 1, maximum: ROOM_V3_READ_LIMITS.retainedEvents },
        { type: "null" }
      ]
    },
    ...cipher(5 * 1024 * 1024)
  },
  [
    "version",
    "descriptor",
    "expiresAt",
    "commentsEnabled",
    "generation",
    "sequence",
    "head",
    "cursor",
    "eventBytes",
    "events",
    "nextCursor"
  ]
);
var ROOM_V3_MANAGEMENT_SCHEMA = schema2("artifact-room-management-v3", {
  schemaVersion: { const: ROOM_V3_VERSION },
  roomId: id2,
  operation: { enum: ["pause", "resume", "delete"] },
  operationId: id2,
  expectedGeneration: integer,
  signature
});
var PASTE_V2_SCHEMA = schema2("artifact-paste-v2", {
  schemaVersion: { const: "2.0.0" },
  operation: { const: "create" },
  id: id2,
  creationId: token,
  ttl: { enum: ["1d", "7d", "30d"] },
  ...cipher(5 * 1024 * 1024)
});
var SHARING_CRYPTO_AAD_SCHEMA = schema2("sharing-crypto-aad", {
  version: { const: "2.0.0" },
  purpose: { enum: ["artifact-paste", "room-envelope", "room-event"] },
  objectId: id2,
  recordId: { type: "string", pattern: "^[A-Za-z0-9._:-]{1,128}$" }
});
var PREVIEW_BRIDGE_MESSAGE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://openplanr.dev/schemas/v1.17.0/preview-bridge-message.schema.json",
  "x-openplanr-contract": { id: "preview-bridge-message", version: "1.17.0" },
  oneOf: [
    schema2("preview-bridge-ready", {
      schemaVersion: { const: "1.0.0" },
      channel: token,
      type: { const: "ready" },
      viewId: id2
    }),
    schema2("preview-bridge-navigate", {
      schemaVersion: { const: "1.0.0" },
      channel: token,
      type: { const: "navigate" },
      viewId: id2,
      screenId: id2
    }),
    schema2("preview-bridge-select", {
      schemaVersion: { const: "1.0.0" },
      channel: token,
      type: { const: "select" },
      viewId: id2,
      elementId: id2
    }),
    schema2("preview-bridge-state", {
      schemaVersion: { const: "1.0.0" },
      channel: token,
      type: { const: "state" },
      viewId: id2,
      state: closed2({ session: { type: "object" }, forms: { type: "object" } })
    }),
    schema2("preview-bridge-failed", {
      schemaVersion: { const: "1.0.0" },
      channel: token,
      type: { const: "failed" },
      viewId: id2
    })
  ]
};
for (const alternative of PREVIEW_BRIDGE_MESSAGE_SCHEMA.oneOf)
  for (const key of ["viewId", "screenId", "elementId"])
    if (alternative.properties[key])
      alternative.properties[key] = {
        type: "string",
        pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$"
      };
var SHARING_SECURITY_SCHEMAS = Object.freeze({
  "preview-bridge-message": PREVIEW_BRIDGE_MESSAGE_SCHEMA,
  "artifact-room-descriptor-v3": ROOM_V3_DESCRIPTOR_SCHEMA,
  "artifact-room-create-v3": ROOM_V3_CREATE_SCHEMA,
  "artifact-room-read-page-v3": ROOM_V3_READ_PAGE_SCHEMA,
  "artifact-room-append-v3": ROOM_V3_APPEND_SCHEMA,
  "artifact-room-event-v3": ROOM_V3_EVENT_SCHEMA,
  "artifact-room-management-v3": ROOM_V3_MANAGEMENT_SCHEMA,
  "artifact-paste-v2": PASTE_V2_SCHEMA,
  "sharing-crypto-aad": SHARING_CRYPTO_AAD_SCHEMA
});

// packages/protocol/src/generated/diagram-registries.mjs
var deepFreeze2 = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze2(nested);
    Object.freeze(value);
  }
  return value;
};
var DIAGRAM_REGISTRIES = deepFreeze2({
  "diagram-grammars.json": {
    "kind": "diagram-type-registry",
    "schemaVersion": "1.0.0",
    "protocolVersion": "1.6.0",
    "documentVersion": "1.0.0",
    "digestAlgorithm": "sha256",
    "canonicalization": "rfc8785",
    "registryVersion": "1.0.0",
    "primitives": [
      "node",
      "relation",
      "group",
      "lane",
      "event",
      "series",
      "axis",
      "set",
      "annotation",
      "emphasis"
    ],
    "layoutFamilies": [
      "cause-effect",
      "chart",
      "chronology",
      "containment",
      "entity",
      "graph",
      "hierarchy",
      "lanes",
      "sankey",
      "wardley"
    ],
    "grammars": [
      {
        "grammarId": "architecture",
        "grammarVersion": "1.0.0",
        "title": "Architecture",
        "summary": "Architecture semantic grammar using the graph layout family.",
        "layoutFamily": "graph",
        "aliases": [
          "system architecture",
          "software architecture",
          "components"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/architecture.planr-diagram.json",
        "reference": "references/diagram/architecture.md",
        "rendererContract": {
          "layoutFamily": "graph",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Architecture diagram",
          "description": "Diagram content for the architecture grammar in semantic reading order."
        }
      },
      {
        "grammarId": "it-current-state",
        "grammarVersion": "1.0.0",
        "title": "IT current state",
        "summary": "IT current state semantic grammar using the graph layout family.",
        "layoutFamily": "graph",
        "aliases": [
          "legacy landscape",
          "current state",
          "modernization"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/it-current-state.planr-diagram.json",
        "reference": "references/diagram/it-current-state.md",
        "rendererContract": {
          "layoutFamily": "graph",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "IT current state diagram",
          "description": "Diagram content for the it current state grammar in semantic reading order."
        }
      },
      {
        "grammarId": "flowchart",
        "grammarVersion": "1.0.0",
        "title": "Flowchart",
        "summary": "Flowchart semantic grammar using the graph layout family.",
        "layoutFamily": "graph",
        "aliases": [
          "decision flow",
          "workflow",
          "process flow"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "editable",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/flowchart.planr-diagram.json",
        "reference": "references/diagram/flowchart.md",
        "rendererContract": {
          "layoutFamily": "graph",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Flowchart diagram",
          "description": "Diagram content for the flowchart grammar in semantic reading order."
        }
      },
      {
        "grammarId": "sequence",
        "grammarVersion": "1.0.0",
        "title": "Sequence",
        "summary": "Sequence semantic grammar using the chronology layout family.",
        "layoutFamily": "chronology",
        "aliases": [
          "message sequence",
          "interaction sequence",
          "request trace"
        ],
        "requiredPrimitives": [
          "node",
          "relation",
          "event"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "event",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "editable",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/sequence.planr-diagram.json",
        "reference": "references/diagram/sequence.md",
        "rendererContract": {
          "layoutFamily": "chronology",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Sequence diagram",
          "description": "Diagram content for the sequence grammar in semantic reading order."
        }
      },
      {
        "grammarId": "state-machine",
        "grammarVersion": "1.0.0",
        "title": "State machine",
        "summary": "State machine semantic grammar using the graph layout family.",
        "layoutFamily": "graph",
        "aliases": [
          "state diagram",
          "lifecycle states",
          "transitions"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "editable",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/state-machine.planr-diagram.json",
        "reference": "references/diagram/state-machine.md",
        "rendererContract": {
          "layoutFamily": "graph",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "State machine diagram",
          "description": "Diagram content for the state machine grammar in semantic reading order."
        }
      },
      {
        "grammarId": "er-data-model",
        "grammarVersion": "1.0.0",
        "title": "ER data model",
        "summary": "ER data model semantic grammar using the entity layout family.",
        "layoutFamily": "entity",
        "aliases": [
          "entity relationship",
          "logical data model",
          "er diagram"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "editable",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/er-data-model.planr-diagram.json",
        "reference": "references/diagram/er-data-model.md",
        "rendererContract": {
          "layoutFamily": "entity",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "ER data model diagram",
          "description": "Diagram content for the er data model grammar in semantic reading order."
        }
      },
      {
        "grammarId": "timeline",
        "grammarVersion": "1.0.0",
        "title": "Timeline",
        "summary": "Timeline semantic grammar using the chronology layout family.",
        "layoutFamily": "chronology",
        "aliases": [
          "milestones",
          "history",
          "roadmap"
        ],
        "requiredPrimitives": [
          "event"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "event",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/timeline.planr-diagram.json",
        "reference": "references/diagram/timeline.md",
        "rendererContract": {
          "layoutFamily": "chronology",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Timeline diagram",
          "description": "Diagram content for the timeline grammar in semantic reading order."
        }
      },
      {
        "grammarId": "swimlane",
        "grammarVersion": "1.0.0",
        "title": "Swimlane",
        "summary": "Swimlane semantic grammar using the lanes layout family.",
        "layoutFamily": "lanes",
        "aliases": [
          "cross functional",
          "handoff flow",
          "responsibility lanes"
        ],
        "requiredPrimitives": [
          "node",
          "lane"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "lane",
          "event",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/swimlane.planr-diagram.json",
        "reference": "references/diagram/swimlane.md",
        "rendererContract": {
          "layoutFamily": "lanes",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Swimlane diagram",
          "description": "Diagram content for the swimlane grammar in semantic reading order."
        }
      },
      {
        "grammarId": "quadrant",
        "grammarVersion": "1.0.0",
        "title": "Quadrant",
        "summary": "Quadrant semantic grammar using the chart layout family.",
        "layoutFamily": "chart",
        "aliases": [
          "two axis matrix",
          "impact effort",
          "four quadrants"
        ],
        "requiredPrimitives": [
          "node",
          "axis"
        ],
        "allowedPrimitives": [
          "node",
          "series",
          "axis",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/quadrant.planr-diagram.json",
        "reference": "references/diagram/quadrant.md",
        "rendererContract": {
          "layoutFamily": "chart",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Quadrant diagram",
          "description": "Diagram content for the quadrant grammar in semantic reading order."
        }
      },
      {
        "grammarId": "radar",
        "grammarVersion": "1.0.0",
        "title": "Radar chart",
        "summary": "Radar chart semantic grammar using the chart layout family.",
        "layoutFamily": "chart",
        "aliases": [
          "spider chart",
          "multi axis comparison"
        ],
        "requiredPrimitives": [
          "series",
          "axis"
        ],
        "allowedPrimitives": [
          "node",
          "series",
          "axis",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/radar.planr-diagram.json",
        "reference": "references/diagram/radar.md",
        "rendererContract": {
          "layoutFamily": "chart",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Radar chart diagram",
          "description": "Diagram content for the radar chart grammar in semantic reading order."
        }
      },
      {
        "grammarId": "polar",
        "grammarVersion": "1.0.0",
        "title": "Polar chart",
        "summary": "Polar chart semantic grammar using the chart layout family.",
        "layoutFamily": "chart",
        "aliases": [
          "polar area",
          "cyclic magnitude"
        ],
        "requiredPrimitives": [
          "series",
          "axis"
        ],
        "allowedPrimitives": [
          "node",
          "series",
          "axis",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/polar.planr-diagram.json",
        "reference": "references/diagram/polar.md",
        "rendererContract": {
          "layoutFamily": "chart",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Polar chart diagram",
          "description": "Diagram content for the polar chart grammar in semantic reading order."
        }
      },
      {
        "grammarId": "loop-flywheel",
        "grammarVersion": "1.0.0",
        "title": "Loop and flywheel",
        "summary": "Loop and flywheel semantic grammar using the graph layout family.",
        "layoutFamily": "graph",
        "aliases": [
          "flywheel",
          "reinforcing loop",
          "feedback loop"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/loop-flywheel.planr-diagram.json",
        "reference": "references/diagram/loop-flywheel.md",
        "rendererContract": {
          "layoutFamily": "graph",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Loop and flywheel diagram",
          "description": "Diagram content for the loop and flywheel grammar in semantic reading order."
        }
      },
      {
        "grammarId": "nested",
        "grammarVersion": "1.0.0",
        "title": "Nested containment",
        "summary": "Nested containment semantic grammar using the containment layout family.",
        "layoutFamily": "containment",
        "aliases": [
          "nested boxes",
          "containment map"
        ],
        "requiredPrimitives": [
          "node",
          "group"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "set",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/nested.planr-diagram.json",
        "reference": "references/diagram/nested.md",
        "rendererContract": {
          "layoutFamily": "containment",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Nested containment diagram",
          "description": "Diagram content for the nested containment grammar in semantic reading order."
        }
      },
      {
        "grammarId": "tree",
        "grammarVersion": "1.0.0",
        "title": "Tree",
        "summary": "Tree semantic grammar using the hierarchy layout family.",
        "layoutFamily": "hierarchy",
        "aliases": [
          "hierarchy tree",
          "parent child"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "editable",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/tree.planr-diagram.json",
        "reference": "references/diagram/tree.md",
        "rendererContract": {
          "layoutFamily": "hierarchy",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Tree diagram",
          "description": "Diagram content for the tree grammar in semantic reading order."
        }
      },
      {
        "grammarId": "org-chart",
        "grammarVersion": "1.0.0",
        "title": "Organization chart",
        "summary": "Organization chart semantic grammar using the hierarchy layout family.",
        "layoutFamily": "hierarchy",
        "aliases": [
          "org chart",
          "reporting lines",
          "team structure"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/org-chart.planr-diagram.json",
        "reference": "references/diagram/org-chart.md",
        "rendererContract": {
          "layoutFamily": "hierarchy",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Organization chart diagram",
          "description": "Diagram content for the organization chart grammar in semantic reading order."
        }
      },
      {
        "grammarId": "layer-stack",
        "grammarVersion": "1.0.0",
        "title": "Layer stack",
        "summary": "Layer stack semantic grammar using the hierarchy layout family.",
        "layoutFamily": "hierarchy",
        "aliases": [
          "layered architecture",
          "stacked abstractions"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/layer-stack.planr-diagram.json",
        "reference": "references/diagram/layer-stack.md",
        "rendererContract": {
          "layoutFamily": "hierarchy",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Layer stack diagram",
          "description": "Diagram content for the layer stack grammar in semantic reading order."
        }
      },
      {
        "grammarId": "venn",
        "grammarVersion": "1.0.0",
        "title": "Venn",
        "summary": "Venn semantic grammar using the containment layout family.",
        "layoutFamily": "containment",
        "aliases": [
          "set overlap",
          "venn diagram"
        ],
        "requiredPrimitives": [
          "set"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "set",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/venn.planr-diagram.json",
        "reference": "references/diagram/venn.md",
        "rendererContract": {
          "layoutFamily": "containment",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Venn diagram",
          "description": "Diagram content for the venn grammar in semantic reading order."
        }
      },
      {
        "grammarId": "pyramid-funnel",
        "grammarVersion": "1.0.0",
        "title": "Pyramid and funnel",
        "summary": "Pyramid and funnel semantic grammar using the hierarchy layout family.",
        "layoutFamily": "hierarchy",
        "aliases": [
          "pyramid",
          "funnel",
          "ranked hierarchy"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/pyramid-funnel.planr-diagram.json",
        "reference": "references/diagram/pyramid-funnel.md",
        "rendererContract": {
          "layoutFamily": "hierarchy",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Pyramid and funnel diagram",
          "description": "Diagram content for the pyramid and funnel grammar in semantic reading order."
        }
      },
      {
        "grammarId": "bar",
        "grammarVersion": "1.0.0",
        "title": "Bar chart",
        "summary": "Bar chart semantic grammar using the chart layout family.",
        "layoutFamily": "chart",
        "aliases": [
          "bar graph",
          "categorical comparison"
        ],
        "requiredPrimitives": [
          "series",
          "axis"
        ],
        "allowedPrimitives": [
          "node",
          "series",
          "axis",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/bar.planr-diagram.json",
        "reference": "references/diagram/bar.md",
        "rendererContract": {
          "layoutFamily": "chart",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Bar chart diagram",
          "description": "Diagram content for the bar chart grammar in semantic reading order."
        }
      },
      {
        "grammarId": "treemap",
        "grammarVersion": "1.0.0",
        "title": "Treemap",
        "summary": "Treemap semantic grammar using the containment layout family.",
        "layoutFamily": "containment",
        "aliases": [
          "part of whole",
          "area hierarchy"
        ],
        "requiredPrimitives": [
          "node",
          "group"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "set",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/treemap.planr-diagram.json",
        "reference": "references/diagram/treemap.md",
        "rendererContract": {
          "layoutFamily": "containment",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Treemap diagram",
          "description": "Diagram content for the treemap grammar in semantic reading order."
        }
      },
      {
        "grammarId": "line",
        "grammarVersion": "1.0.0",
        "title": "Line chart",
        "summary": "Line chart semantic grammar using the chart layout family.",
        "layoutFamily": "chart",
        "aliases": [
          "line graph",
          "trend chart"
        ],
        "requiredPrimitives": [
          "series",
          "axis"
        ],
        "allowedPrimitives": [
          "node",
          "series",
          "axis",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/line.planr-diagram.json",
        "reference": "references/diagram/line.md",
        "rendererContract": {
          "layoutFamily": "chart",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Line chart diagram",
          "description": "Diagram content for the line chart grammar in semantic reading order."
        }
      },
      {
        "grammarId": "gantt",
        "grammarVersion": "1.0.0",
        "title": "Gantt",
        "summary": "Gantt semantic grammar using the chronology layout family.",
        "layoutFamily": "chronology",
        "aliases": [
          "gantt chart",
          "project schedule",
          "task timeline"
        ],
        "requiredPrimitives": [
          "event"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "event",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "editable",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/gantt.planr-diagram.json",
        "reference": "references/diagram/gantt.md",
        "rendererContract": {
          "layoutFamily": "chronology",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Gantt diagram",
          "description": "Diagram content for the gantt grammar in semantic reading order."
        }
      },
      {
        "grammarId": "scatter",
        "grammarVersion": "1.0.0",
        "title": "Scatter plot",
        "summary": "Scatter plot semantic grammar using the chart layout family.",
        "layoutFamily": "chart",
        "aliases": [
          "scatter chart",
          "correlation",
          "distribution plot"
        ],
        "requiredPrimitives": [
          "series",
          "axis"
        ],
        "allowedPrimitives": [
          "node",
          "series",
          "axis",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/scatter.planr-diagram.json",
        "reference": "references/diagram/scatter.md",
        "rendererContract": {
          "layoutFamily": "chart",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Scatter plot diagram",
          "description": "Diagram content for the scatter plot grammar in semantic reading order."
        }
      },
      {
        "grammarId": "high-level",
        "grammarVersion": "1.0.0",
        "title": "High-level system view",
        "summary": "High-level system view semantic grammar using the graph layout family.",
        "layoutFamily": "graph",
        "aliases": [
          "high level architecture",
          "end to end stack"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/high-level.planr-diagram.json",
        "reference": "references/diagram/high-level.md",
        "rendererContract": {
          "layoutFamily": "graph",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "High-level system view diagram",
          "description": "Diagram content for the high-level system view grammar in semantic reading order."
        }
      },
      {
        "grammarId": "process",
        "grammarVersion": "1.0.0",
        "title": "Process",
        "summary": "Process semantic grammar using the lanes layout family.",
        "layoutFamily": "lanes",
        "aliases": [
          "business process",
          "multi actor process"
        ],
        "requiredPrimitives": [
          "node",
          "relation",
          "lane"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "lane",
          "event",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/process.planr-diagram.json",
        "reference": "references/diagram/process.md",
        "rendererContract": {
          "layoutFamily": "lanes",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Process diagram",
          "description": "Diagram content for the process grammar in semantic reading order."
        }
      },
      {
        "grammarId": "medallion",
        "grammarVersion": "1.0.0",
        "title": "Medallion",
        "summary": "Medallion semantic grammar using the hierarchy layout family.",
        "layoutFamily": "hierarchy",
        "aliases": [
          "bronze silver gold",
          "data lakehouse tiers"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/medallion.planr-diagram.json",
        "reference": "references/diagram/medallion.md",
        "rendererContract": {
          "layoutFamily": "hierarchy",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Medallion diagram",
          "description": "Diagram content for the medallion grammar in semantic reading order."
        }
      },
      {
        "grammarId": "data-flow",
        "grammarVersion": "1.0.0",
        "title": "Data flow",
        "summary": "Data flow semantic grammar using the graph layout family.",
        "layoutFamily": "graph",
        "aliases": [
          "data pipeline",
          "information flow"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/data-flow.planr-diagram.json",
        "reference": "references/diagram/data-flow.md",
        "rendererContract": {
          "layoutFamily": "graph",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Data flow diagram",
          "description": "Diagram content for the data flow grammar in semantic reading order."
        }
      },
      {
        "grammarId": "dp-integration",
        "grammarVersion": "1.0.0",
        "title": "Data platform integration",
        "summary": "Data platform integration semantic grammar using the graph layout family.",
        "layoutFamily": "graph",
        "aliases": [
          "sources core consumers",
          "integration landscape"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/dp-integration.planr-diagram.json",
        "reference": "references/diagram/dp-integration.md",
        "rendererContract": {
          "layoutFamily": "graph",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Data platform integration diagram",
          "description": "Diagram content for the data platform integration grammar in semantic reading order."
        }
      },
      {
        "grammarId": "dp-security-matrix",
        "grammarVersion": "1.0.0",
        "title": "Data platform security matrix",
        "summary": "Data platform security matrix semantic grammar using the lanes layout family.",
        "layoutFamily": "lanes",
        "aliases": [
          "access matrix",
          "role permissions"
        ],
        "requiredPrimitives": [
          "node",
          "lane"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "lane",
          "event",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/dp-security-matrix.planr-diagram.json",
        "reference": "references/diagram/dp-security-matrix.md",
        "rendererContract": {
          "layoutFamily": "lanes",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Data platform security matrix diagram",
          "description": "Diagram content for the data platform security matrix grammar in semantic reading order."
        }
      },
      {
        "grammarId": "sankey",
        "grammarVersion": "1.0.0",
        "title": "Sankey",
        "summary": "Sankey semantic grammar using the sankey layout family.",
        "layoutFamily": "sankey",
        "aliases": [
          "flow quantities",
          "split and merge"
        ],
        "requiredPrimitives": [
          "node",
          "relation",
          "series"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "series",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 8,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/sankey.planr-diagram.json",
        "reference": "references/diagram/sankey.md",
        "rendererContract": {
          "layoutFamily": "sankey",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Sankey diagram",
          "description": "Diagram content for the sankey grammar in semantic reading order."
        }
      },
      {
        "grammarId": "fishbone",
        "grammarVersion": "1.0.0",
        "title": "Fishbone",
        "summary": "Fishbone semantic grammar using the cause-effect layout family.",
        "layoutFamily": "cause-effect",
        "aliases": [
          "ishikawa",
          "cause and effect",
          "root causes"
        ],
        "requiredPrimitives": [
          "node",
          "relation",
          "group"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/fishbone.planr-diagram.json",
        "reference": "references/diagram/fishbone.md",
        "rendererContract": {
          "layoutFamily": "cause-effect",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Fishbone diagram",
          "description": "Diagram content for the fishbone grammar in semantic reading order."
        }
      },
      {
        "grammarId": "wardley",
        "grammarVersion": "1.0.0",
        "title": "Wardley map",
        "summary": "Wardley map semantic grammar using the wardley layout family.",
        "layoutFamily": "wardley",
        "aliases": [
          "value chain evolution",
          "wardley"
        ],
        "requiredPrimitives": [
          "node",
          "relation",
          "axis"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "axis",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/wardley.planr-diagram.json",
        "reference": "references/diagram/wardley.md",
        "rendererContract": {
          "layoutFamily": "wardley",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Wardley map diagram",
          "description": "Diagram content for the wardley map grammar in semantic reading order."
        }
      },
      {
        "grammarId": "kanban",
        "grammarVersion": "1.0.0",
        "title": "Kanban",
        "summary": "Kanban semantic grammar using the lanes layout family.",
        "layoutFamily": "lanes",
        "aliases": [
          "kanban board",
          "work in progress"
        ],
        "requiredPrimitives": [
          "node",
          "lane"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "lane",
          "event",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/kanban.planr-diagram.json",
        "reference": "references/diagram/kanban.md",
        "rendererContract": {
          "layoutFamily": "lanes",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Kanban diagram",
          "description": "Diagram content for the kanban grammar in semantic reading order."
        }
      },
      {
        "grammarId": "user-journey",
        "grammarVersion": "1.0.0",
        "title": "User journey",
        "summary": "User journey semantic grammar using the lanes layout family.",
        "layoutFamily": "lanes",
        "aliases": [
          "customer journey",
          "experience map"
        ],
        "requiredPrimitives": [
          "event",
          "lane"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "lane",
          "event",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/user-journey.planr-diagram.json",
        "reference": "references/diagram/user-journey.md",
        "rendererContract": {
          "layoutFamily": "lanes",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "User journey diagram",
          "description": "Diagram content for the user journey grammar in semantic reading order."
        }
      },
      {
        "grammarId": "deployment",
        "grammarVersion": "1.0.0",
        "title": "Deployment",
        "summary": "Deployment semantic grammar using the containment layout family.",
        "layoutFamily": "containment",
        "aliases": [
          "deployment diagram",
          "zones hosts artifacts"
        ],
        "requiredPrimitives": [
          "node",
          "group"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "set",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "partial",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/deployment.planr-diagram.json",
        "reference": "references/diagram/deployment.md",
        "rendererContract": {
          "layoutFamily": "containment",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Deployment diagram",
          "description": "Diagram content for the deployment grammar in semantic reading order."
        }
      },
      {
        "grammarId": "dependency-graph",
        "grammarVersion": "1.0.0",
        "title": "Dependency graph",
        "summary": "Dependency graph semantic grammar using the graph layout family.",
        "layoutFamily": "graph",
        "aliases": [
          "dependencies",
          "fan in graph",
          "package graph"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 10,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "editable",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/dependency-graph.planr-diagram.json",
        "reference": "references/diagram/dependency-graph.md",
        "rendererContract": {
          "layoutFamily": "graph",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Dependency graph diagram",
          "description": "Diagram content for the dependency graph grammar in semantic reading order."
        }
      },
      {
        "grammarId": "uml-class",
        "grammarVersion": "1.0.0",
        "title": "UML class",
        "summary": "UML class semantic grammar using the entity layout family.",
        "layoutFamily": "entity",
        "aliases": [
          "class diagram",
          "typed relations"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "editable",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/uml-class.planr-diagram.json",
        "reference": "references/diagram/uml-class.md",
        "rendererContract": {
          "layoutFamily": "entity",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "UML class diagram",
          "description": "Diagram content for the uml class grammar in semantic reading order."
        }
      },
      {
        "grammarId": "story-map",
        "grammarVersion": "1.0.0",
        "title": "Story map",
        "summary": "Story map semantic grammar using the lanes layout family.",
        "layoutFamily": "lanes",
        "aliases": [
          "user story map",
          "release slices"
        ],
        "requiredPrimitives": [
          "node",
          "lane"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "lane",
          "event",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "unsupported",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/story-map.planr-diagram.json",
        "reference": "references/diagram/story-map.md",
        "rendererContract": {
          "layoutFamily": "lanes",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Story map diagram",
          "description": "Diagram content for the story map grammar in semantic reading order."
        }
      },
      {
        "grammarId": "database-schema",
        "grammarVersion": "1.0.0",
        "title": "Database schema",
        "summary": "Database schema semantic grammar using the entity layout family.",
        "layoutFamily": "entity",
        "aliases": [
          "physical schema",
          "database tables",
          "foreign keys"
        ],
        "requiredPrimitives": [
          "node"
        ],
        "allowedPrimitives": [
          "node",
          "relation",
          "group",
          "annotation",
          "emphasis"
        ],
        "directions": [
          "top-down",
          "left-right",
          "right-left",
          "bottom-up",
          "radial"
        ],
        "detailLimits": {
          "simplified": 7,
          "balanced": 12,
          "faithful": 24,
          "hard": 24
        },
        "readability": {
          "maxLabelCharacters": 80,
          "maxCrossings": 12,
          "maxFanIn": 6,
          "minTextSize": 12,
          "aspectRatios": [
            "fit",
            "doc-wide",
            "slide-16x9"
          ]
        },
        "projections": {
          "mermaid": "editable",
          "excalidraw": "editable"
        },
        "fixture": "fixtures/diagram/grammars/database-schema.planr-diagram.json",
        "reference": "references/diagram/database-schema.md",
        "rendererContract": {
          "layoutFamily": "entity",
          "contractVersion": "1.0.0",
          "staticByDefault": true
        },
        "accessibilityTemplate": {
          "title": "Database schema diagram",
          "description": "Diagram content for the database schema grammar in semantic reading order."
        }
      }
    ],
    "documentDigest": "sha256:f78d668b7cf01ba9c0dacbe64b6e7a1b19c6dc7e5855c9861594beb3d6984653"
  },
  "diagram-semantic-patterns.json": {
    "kind": "diagram-semantic-pattern-registry",
    "schemaVersion": "1.0.0",
    "protocolVersion": "1.6.0",
    "documentVersion": "1.0.0",
    "digestAlgorithm": "sha256",
    "canonicalization": "rfc8785",
    "patterns": [
      {
        "patternId": "fan-in-bottleneck",
        "patternVersion": "1.0.0",
        "triggers": [
          "queue",
          "bottleneck",
          "fan in"
        ],
        "candidateGrammars": [
          "dependency-graph",
          "sankey",
          "data-flow"
        ],
        "selection": "rank-only"
      },
      {
        "patternId": "repeated-stages",
        "patternVersion": "1.0.0",
        "triggers": [
          "stages",
          "pipeline slots",
          "repeat"
        ],
        "candidateGrammars": [
          "process",
          "swimlane",
          "data-flow"
        ],
        "selection": "rank-only"
      },
      {
        "patternId": "unstructured-transformation",
        "patternVersion": "1.0.0",
        "triggers": [
          "unstructured input",
          "transform",
          "normalize"
        ],
        "candidateGrammars": [
          "data-flow",
          "dp-integration"
        ],
        "selection": "rank-only"
      },
      {
        "patternId": "paired-policy-trace",
        "patternVersion": "1.0.0",
        "triggers": [
          "policy trace",
          "allow deny",
          "decision path"
        ],
        "candidateGrammars": [
          "sequence",
          "flowchart"
        ],
        "selection": "rank-only"
      },
      {
        "patternId": "secure-paved-road",
        "patternVersion": "1.0.0",
        "triggers": [
          "secure path",
          "paved road",
          "guardrails"
        ],
        "candidateGrammars": [
          "architecture",
          "deployment"
        ],
        "selection": "rank-only"
      },
      {
        "patternId": "governance-catalog",
        "patternVersion": "1.0.0",
        "triggers": [
          "catalog",
          "governance",
          "ownership"
        ],
        "candidateGrammars": [
          "tree",
          "org-chart",
          "layer-stack"
        ],
        "selection": "rank-only"
      },
      {
        "patternId": "compensating-layers",
        "patternVersion": "1.0.0",
        "triggers": [
          "defense in depth",
          "compensating controls"
        ],
        "candidateGrammars": [
          "layer-stack",
          "dp-security-matrix"
        ],
        "selection": "rank-only"
      }
    ],
    "documentDigest": "sha256:36a925bd1be54ef9a80ccd44039c9390dd7c4cc00185dbc03ba01be8997e222f"
  }
});

// packages/protocol/src/diagram-authoring-contracts.mjs
var DIAGRAM_EDIT_OPERATION_CLASSES = deepFreeze([
  "insert-elements",
  "update-semantics",
  "remove-elements",
  "set-membership-order",
  "set-geometry",
  "set-appearance-locks"
]);
var DIAGRAM_AUTHORING_LIMITS = deepFreeze({
  depth: 48,
  values: 5e5,
  textCodeUnits: 8388608,
  sourceBytes: 1048576,
  elements: 1e4,
  operations: 256,
  coordinate: 1e6
});
var closed3 = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required
});
var arr = (items, maxItems, minItems = 0, uniqueItems = false) => ({
  type: "array",
  items,
  minItems,
  maxItems,
  ...uniqueItems ? { uniqueItems } : {}
});
var nullable = (schema7) => ({ anyOf: [{ type: "null" }, schema7] });
var str = (maxLength = 4096, minLength = 0) => ({ type: "string", minLength, maxLength });
var enumOf = (...values) => ({ enum: values });
var id3 = {
  type: "string",
  pattern: "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
  minLength: 1,
  maxLength: 128
};
var digest3 = { type: "string", pattern: "^sha256:[a-f0-9]{64}$" };
var token2 = { type: "string", pattern: "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$", maxLength: 64 };
var relativePath = {
  type: "string",
  minLength: 1,
  maxLength: 1024,
  pattern: "^[A-Za-z0-9][A-Za-z0-9._/-]*$"
};
var coordinate = { type: "number", minimum: -1e6, maximum: 1e6 };
var positiveSize = { type: "number", minimum: 0.01, maximum: 1e6 };
var index = { type: "integer", minimum: 0, maximum: 1e4 };
var ids = arr(id3, 1e4, 0, true);
var semanticKinds = ["process", "start", "end", "decision", "data-store", "component"];
var relationKinds = ["association", "dependency", "flow", "message", "transition"];
var node = closed3({
  id: id3,
  label: str(),
  kind: enumOf(...semanticKinds),
  description: nullable(str())
});
var relation = closed3({
  id: id3,
  from: id3,
  to: id3,
  kind: enumOf(...relationKinds),
  direction: enumOf("forward", "both", "none"),
  label: nullable(str()),
  weight: nullable({ type: "number", minimum: 0, maximum: 1e6 })
});
var container = closed3({ id: id3, label: str(), members: ids });
var annotation = closed3({ id: id3, text: str(), targetId: nullable(id3) });
var emphasis = closed3({ targetId: id3, level: enumOf("primary", "secondary", "muted") });
var semanticCollections = {
  nodes: arr(node, 4096),
  relations: arr(relation, 8192),
  groups: arr(container, 1024),
  lanes: arr(container, 256),
  events: arr(false, 0),
  series: arr(false, 0),
  axes: arr(false, 0),
  sets: arr(false, 0),
  annotations: arr(annotation, 1024),
  emphasis: arr(emphasis, 1024)
};
var bounds = closed3({ x: coordinate, y: coordinate, width: positiveSize, height: positiveSize });
var point = closed3({ x: coordinate, y: coordinate });
var attachment = closed3({
  side: enumOf("top", "right", "bottom", "left"),
  offset: { type: "number", minimum: 0, maximum: 1 }
});
var route = closed3({
  mode: enumOf("automatic", "manual"),
  strategy: enumOf("straight", "orthogonal"),
  from: attachment,
  to: attachment,
  points: arr(point, 256)
});
var labelPlacement = closed3({ x: coordinate, y: coordinate, width: positiveSize });
var appearance = closed3({
  shape: enumOf(
    "rectangle",
    "rounded-rectangle",
    "ellipse",
    "diamond",
    "cylinder",
    "text",
    "container",
    "connector"
  ),
  fill: enumOf("surface", "accent", "success", "warning", "danger", "transparent"),
  stroke: enumOf("default", "accent", "muted", "danger", "none"),
  strokeWidth: { type: "number", minimum: 0, maximum: 16 },
  strokeStyle: enumOf("solid", "dashed", "dotted"),
  fontSize: { type: "integer", minimum: 8, maximum: 72 },
  textAlign: enumOf("left", "center", "right")
});
var locks = closed3({
  position: { type: "boolean" },
  size: { type: "boolean" },
  route: { type: "boolean" }
});
var placement = closed3({
  elementId: id3,
  bounds: nullable(bounds),
  route: nullable(route),
  label: nullable(labelPlacement),
  zIndex: index,
  appearance,
  locks
});
var snapshot = closed3({
  bundleDigest: digest3,
  semanticDigest: digest3,
  presentationDigest: digest3
});
var schema3 = (name, kind, properties) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.13.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: "1.13.0" },
  ...closed3({
    kind: { const: kind },
    schemaVersion: { const: "1.0.0" },
    protocolVersion: { const: "1.13.0" },
    ...properties
  })
});
var documentSchema = schema3("diagram-document", "planr-diagram", {
  diagramId: id3,
  title: str(),
  summary: str(),
  audience: enumOf("engineer", "executive", "mixed"),
  grammar: closed3({
    id: enumOf("flowchart", "process", "swimlane", "architecture"),
    version: { const: "1.0.0" }
  }),
  ...semanticCollections,
  laneOrder: ids,
  accessibility: closed3({ title: str(), description: str(), readingOrder: ids }),
  documentDigest: digest3
});
var presentationSchema = schema3("diagram-presentation", "diagram-presentation", {
  diagramId: id3,
  semanticDigest: digest3,
  coordinateSystem: { const: "global-canvas" },
  layout: closed3({
    direction: enumOf("top-down", "left-right", "right-left", "bottom-up"),
    detailTier: enumOf("simplified", "balanced", "faithful")
  }),
  theme: closed3({
    themeId: enumOf("paper", "slate", "midnight"),
    mode: enumOf("light", "dark", "auto")
  }),
  elements: arr(placement, 1e4),
  presentationDigest: digest3
});
var range = closed3({
  startByte: { type: "integer", minimum: 0, maximum: 1048576 },
  endByte: { type: "integer", minimum: 0, maximum: 1048576 }
});
var sourceMapSchema = schema3("diagram-source-map", "diagram-source-map", {
  diagramId: id3,
  semanticDigest: digest3,
  sourceDigest: digest3,
  sourceByteLength: { type: "integer", minimum: 0, maximum: 1048576 },
  encoding: { const: "utf-8" },
  parser: closed3({ id: token2, version: str(64, 1) }),
  certificationVersion: { const: "flowchart-copy-v1" },
  entries: arr(
    closed3({
      sourceId: nullable(str(128, 1)),
      elementIds: ids,
      range: nullable(range),
      construct: token2,
      confidence: enumOf("exact", "ambiguous"),
      losses: arr(str(512, 1), 64)
    }),
    1e4
  )
});
var fidelityValue = enumOf("lossless", "partial", "unsupported");
var fidelitySchema = schema3("diagram-fidelity-report", "diagram-fidelity-report", {
  diagramId: id3,
  basis: snapshot,
  sourceDigest: nullable(digest3),
  sourceFormat: enumOf("mermaid", "planr-diagram-bundle"),
  targetFormat: enumOf("mermaid", "planr-diagram-bundle", "svg", "html", "png"),
  semantic: fidelityValue,
  presentation: fidelityValue,
  sourceText: fidelityValue,
  losses: arr(
    closed3({
      dimension: enumOf("semantic", "presentation", "sourceText"),
      code: token2,
      elementIds: ids,
      message: str(512, 1)
    }),
    1024
  )
});
var bundleSchema = schema3("diagram-authoring-bundle", "diagram-authoring-bundle", {
  diagramId: id3,
  document: documentSchema,
  presentation: presentationSchema,
  originalSource: nullable(
    closed3({ format: { const: "mermaid" }, text: str(1048576), sourceDigest: digest3 })
  ),
  sourceMap: nullable(sourceMapSchema),
  bundleDigest: digest3
});
var semanticEntry = {
  oneOf: [
    closed3({ collection: { const: "nodes" }, value: node }),
    closed3({ collection: { const: "relations" }, value: relation }),
    closed3({ collection: { const: "groups" }, value: container }),
    closed3({ collection: { const: "lanes" }, value: container }),
    closed3({ collection: { const: "annotations" }, value: annotation })
  ]
};
var editableSemanticValue = (collection2, properties) => closed3({
  type: { const: "update-semantics" },
  collection: { const: collection2 },
  elementId: id3,
  before: closed3(properties),
  after: closed3(properties)
});
var updateSchemas = [
  editableSemanticValue("nodes", {
    label: str(),
    kind: enumOf(...semanticKinds),
    description: nullable(str())
  }),
  editableSemanticValue("relations", {
    from: id3,
    to: id3,
    kind: enumOf(...relationKinds),
    direction: enumOf("forward", "both", "none"),
    label: nullable(str()),
    weight: nullable({ type: "number", minimum: 0, maximum: 1e6 })
  }),
  editableSemanticValue("groups", { label: str() }),
  editableSemanticValue("lanes", { label: str() }),
  editableSemanticValue("annotations", { text: str(), targetId: nullable(id3) }),
  closed3(
    {
      type: { const: "update-semantics" },
      collection: { const: "emphasis" },
      elementId: id3,
      before: nullable(enumOf("primary", "secondary", "muted")),
      after: nullable(enumOf("primary", "secondary", "muted")),
      index: { type: "integer", minimum: 0, maximum: 1024 }
    },
    ["type", "collection", "elementId", "before", "after"]
  ),
  closed3({
    type: { const: "update-semantics" },
    collection: { const: "document" },
    before: closed3({
      title: str(),
      summary: str(),
      audience: enumOf("engineer", "executive", "mixed"),
      accessibility: documentSchema.properties.accessibility
    }),
    after: closed3({
      title: str(),
      summary: str(),
      audience: enumOf("engineer", "executive", "mixed"),
      accessibility: documentSchema.properties.accessibility
    })
  }),
  closed3({
    type: { const: "update-semantics" },
    collection: { const: "source-map" },
    before: nullable(sourceMapSchema),
    after: nullable(sourceMapSchema)
  })
];
var membershipState = closed3({
  groups: arr(closed3({ id: id3, members: ids }), 1024),
  lanes: arr(closed3({ id: id3, members: ids }), 256),
  laneOrder: ids
});
var geometryValue = closed3({
  bounds: nullable(bounds),
  route: nullable(route),
  label: nullable(labelPlacement),
  zIndex: index
});
var appearanceValue = closed3({ appearance, locks });
var operation = {
  oneOf: [
    closed3(
      {
        type: { const: "insert-elements" },
        elements: arr(semanticEntry, 1e4, 1),
        presentation: arr(placement, 1e4, 1),
        positions: arr(
          closed3({ elementId: id3, semanticIndex: index, presentationIndex: index }),
          1e4,
          1
        )
      },
      ["type", "elements", "presentation"]
    ),
    ...updateSchemas,
    closed3({
      type: { const: "remove-elements" },
      elements: arr(semanticEntry, 1e4, 1),
      presentation: arr(placement, 1e4, 1)
    }),
    closed3({
      type: { const: "set-membership-order" },
      before: membershipState,
      after: membershipState
    }),
    closed3({
      type: { const: "set-geometry" },
      changes: arr(
        closed3({ elementId: id3, before: geometryValue, after: geometryValue }),
        1e4,
        1
      )
    }),
    closed3({
      type: { const: "set-appearance-locks" },
      changes: arr(
        closed3({ elementId: id3, before: appearanceValue, after: appearanceValue }),
        1e4,
        1
      )
    })
  ]
};
var transactionSchema = schema3("diagram-edit-transaction", "diagram-edit-transaction", {
  transactionId: id3,
  diagramId: id3,
  base: snapshot,
  operations: arr(operation, 256, 1),
  undoOf: nullable(id3)
});
var proposalSchema = schema3("diagram-change-proposal", "diagram-change-proposal", {
  proposalId: id3,
  diagramId: id3,
  base: snapshot,
  transaction: transactionSchema,
  summary: str(4096, 1),
  author: closed3({ kind: enumOf("human", "agent"), id: id3 }),
  status: enumOf("proposed", "accepted", "rejected", "stale")
});
var publicationSchema = schema3("diagram-publication-state", "diagram-publication-state", {
  diagramId: id3,
  draft: nullable(snapshot),
  published: nullable(snapshot),
  audience: enumOf("private", "company", "public"),
  capabilitySemantics: { const: "descriptive-only-requires-host-authorization" }
});
var manifestSchema = schema3("diagram-manifest", "diagram-manifest", {
  diagramId: id3,
  basis: snapshot,
  bundle: closed3({ path: relativePath, transportDigest: digest3 }),
  renderer: closed3({ id: token2, version: str(64, 1) }),
  outputs: arr(
    closed3({
      path: relativePath,
      mediaType: enumOf("image/svg+xml", "text/html", "image/png"),
      transportDigest: digest3,
      fidelity: fidelitySchema
    }),
    32,
    1
  )
});
manifestSchema.properties.theme = closed3({ id: token2, version: str(64, 1) });
var mermaidConstruct = closed3({
  construct: token2,
  import: fidelityValue,
  export: fidelityValue,
  semanticRoundTrip: fidelityValue,
  mapping: str(512, 1)
});
var capabilityProfile = closed3({
  grammarId: enumOf("flowchart", "process", "swimlane", "architecture"),
  authoring: { const: true },
  primitives: arr(
    enumOf("node", "relation", "group", "lane", "annotation", "emphasis"),
    6,
    1,
    true
  ),
  nodeKinds: arr(enumOf(...semanticKinds), 6, 1, true),
  relationKinds: arr(enumOf(...relationKinds), 5, 1, true),
  operations: arr(enumOf(...DIAGRAM_EDIT_OPERATION_CLASSES), 6, 6, true),
  mermaid: closed3({
    mode: { const: "copy" },
    certificationVersion: { const: "flowchart-copy-v1" },
    constructs: arr(mermaidConstruct, 32, 1),
    linkedSource: { const: false }
  })
});
var capabilitiesSchema = schema3(
  "diagram-authoring-capabilities",
  "diagram-authoring-capabilities",
  {
    version: { const: "1.0.0" },
    liveCollaboration: { const: false },
    profiles: arr(capabilityProfile, 4, 4),
    unsupportedGrammars: arr(token2, 128, 0, true)
  }
);
var schemas = {
  "diagram-document": documentSchema,
  "diagram-presentation": presentationSchema,
  "diagram-authoring-bundle": bundleSchema,
  "diagram-edit-transaction": transactionSchema,
  "diagram-source-map": sourceMapSchema,
  "diagram-fidelity-report": fidelitySchema,
  "diagram-manifest": manifestSchema,
  "diagram-change-proposal": proposalSchema,
  "diagram-publication-state": publicationSchema,
  "diagram-authoring-capabilities": capabilitiesSchema
};
var DIAGRAM_AUTHORING_SCHEMAS = deepFreeze(schemas);
var DIAGRAM_AUTHORING_CONTRACT_FILES = deepFreeze(
  /** @type {Record<DiagramAuthoringContractKind, string>} */
  Object.fromEntries(Object.keys(schemas).map((name) => [name, `${name}.schema.json`]))
);
var mermaidConstructs = [
  [
    "flowchart-direction",
    "lossless",
    "lossless",
    "lossless",
    "flowchart TB/TD/LR/RL/BT maps to presentation layout direction"
  ],
  [
    "explicit-node-id",
    "lossless",
    "lossless",
    "lossless",
    "Explicit source ID maps through source-map to stable semantic node ID; labels never establish identity"
  ],
  [
    "plain-node-label",
    "lossless",
    "lossless",
    "lossless",
    "Escaped plain text maps to node label; HTML is inert text and is not executed"
  ],
  [
    "rectangle-node",
    "lossless",
    "lossless",
    "lossless",
    "node.kind process and presentation shape rectangle"
  ],
  [
    "rounded-node",
    "lossless",
    "lossless",
    "lossless",
    "node.kind process and presentation shape rounded-rectangle"
  ],
  [
    "decision-node",
    "lossless",
    "lossless",
    "lossless",
    "node.kind decision and presentation shape diamond"
  ],
  [
    "cylinder-node",
    "lossless",
    "lossless",
    "lossless",
    "node.kind data-store and presentation shape cylinder"
  ],
  [
    "directed-edge",
    "lossless",
    "lossless",
    "lossless",
    "relation.kind flow and direction forward; source and target IDs are semantic endpoints"
  ],
  [
    "bidirectional-edge",
    "lossless",
    "lossless",
    "lossless",
    "relation.kind flow and direction both"
  ],
  [
    "undirected-edge",
    "lossless",
    "lossless",
    "lossless",
    "relation.kind association and direction none"
  ],
  [
    "plain-edge-label",
    "lossless",
    "lossless",
    "lossless",
    "Escaped plain text maps to relation label"
  ],
  [
    "subgraph",
    "lossless",
    "lossless",
    "lossless",
    "Explicit subgraph ID maps to one semantic group in an acyclic single-parent forest"
  ],
  [
    "lane-semantics",
    "unsupported",
    "partial",
    "partial",
    "Mermaid subgraphs do not encode lane identity or explicit lane order"
  ],
  [
    "manual-geometry",
    "unsupported",
    "partial",
    "partial",
    "Standard Mermaid does not preserve coordinates, routes, attachments, stacking or locks"
  ],
  [
    "styles-and-directives",
    "unsupported",
    "unsupported",
    "unsupported",
    "CSS, classDef, init directives, links, callbacks and HTML labels are outside this certified subset"
  ],
  [
    "unsupported-construct",
    "unsupported",
    "unsupported",
    "unsupported",
    "Unrecognized syntax is retained as original source with explicit loss diagnostics"
  ]
].map(([construct, input, output, roundTrip, mapping]) => ({
  construct,
  import: input,
  export: output,
  semanticRoundTrip: roundTrip,
  mapping
}));
var profileIds = ["flowchart", "process", "swimlane", "architecture"];
var DIAGRAM_AUTHORING_CAPABILITIES = deepFreeze({
  kind: "diagram-authoring-capabilities",
  schemaVersion: "1.0.0",
  protocolVersion: "1.13.0",
  version: "1.0.0",
  liveCollaboration: false,
  profiles: (
    /** @type {DiagramAuthoringCapability[]} */
    profileIds.map((grammarId) => ({
      grammarId,
      authoring: true,
      primitives: [
        "node",
        "relation",
        "group",
        ...grammarId === "process" || grammarId === "swimlane" ? ["lane"] : [],
        "annotation",
        "emphasis"
      ],
      nodeKinds: [...semanticKinds],
      relationKinds: [...relationKinds],
      operations: [...DIAGRAM_EDIT_OPERATION_CLASSES],
      mermaid: {
        mode: "copy",
        certificationVersion: "flowchart-copy-v1",
        constructs: mermaidConstructs.map((entry) => ({ ...entry })),
        linkedSource: false
      }
    }))
  ),
  unsupportedGrammars: DIAGRAM_REGISTRIES["diagram-grammars.json"].grammars.map((entry) => entry.grammarId).filter((value) => !profileIds.includes(value))
});

// packages/protocol/src/design-contracts.mjs
var DESIGN_DOCUMENT_VERSION = "1.0.0";
var freeze = (value) => {
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) freeze(nested);
    Object.freeze(value);
  }
  return value;
};
var DESIGN_DOCUMENT_SCHEMA = freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://openplanr.dev/schemas/v1.9.0/design-document.schema.json",
  "x-openplanr-contract": { id: "design-document", version: "1.9.0" },
  title: "OpenPlanr authored design document",
  type: "object",
  additionalProperties: false,
  required: [
    "kind",
    "schemaVersion",
    "id",
    "title",
    "brief",
    "frames",
    "screens",
    "screenOrder",
    "variants",
    "selectedVariant",
    "defaultView"
  ],
  properties: {
    kind: { const: "openplanr-design-document" },
    schemaVersion: { const: DESIGN_DOCUMENT_VERSION },
    id: { $ref: "#/$defs/id" },
    title: { $ref: "#/$defs/text" },
    brief: {
      type: "object",
      additionalProperties: false,
      required: ["text", "source", "provenance"],
      properties: {
        text: { $ref: "#/$defs/text" },
        source: { enum: ["spec", "png", "describe"] },
        provenance: { enum: ["spec", "inferred"] },
        references: { type: "array", items: { $ref: "#/$defs/text" }, uniqueItems: true }
      }
    },
    designSystem: {
      type: "object",
      additionalProperties: false,
      properties: {
        path: { $ref: "#/$defs/localPath" },
        tokens: { $ref: "#/$defs/localPath" },
        spacing: {
          type: "array",
          minItems: 1,
          uniqueItems: true,
          items: { type: "number", minimum: 0, maximum: 16384 }
        }
      }
    },
    assets: { $ref: "#/$defs/paths" },
    frames: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "width", "height"],
        properties: {
          id: { $ref: "#/$defs/id" },
          label: { $ref: "#/$defs/text" },
          width: { type: "integer", minimum: 1, maximum: 16384 },
          height: { type: "integer", minimum: 1, maximum: 16384 }
        }
      }
    },
    screens: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "source"],
        properties: {
          id: { $ref: "#/$defs/id" },
          title: { $ref: "#/$defs/text" },
          description: { $ref: "#/$defs/text" },
          source: { $ref: "#/$defs/source" },
          anchors: { $ref: "#/$defs/ids" }
        }
      }
    },
    screenOrder: { type: "array", minItems: 1, items: { $ref: "#/$defs/id" }, uniqueItems: true },
    flows: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "screens"],
        properties: {
          id: { $ref: "#/$defs/id" },
          title: { $ref: "#/$defs/text" },
          screens: { type: "array", minItems: 1, items: { $ref: "#/$defs/id" } }
        }
      }
    },
    variants: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "status"],
        properties: {
          id: { $ref: "#/$defs/id" },
          label: { $ref: "#/$defs/text" },
          description: { $ref: "#/$defs/text" },
          status: { enum: ["ready", "failed"] },
          issue: { $ref: "#/$defs/text" },
          sources: { type: "object", additionalProperties: { $ref: "#/$defs/source" } }
        },
        if: { properties: { status: { const: "failed" } } },
        then: { required: ["issue"] }
      }
    },
    selectedVariant: { $ref: "#/$defs/id" },
    defaultView: { enum: ["canvas", "prototype", "walkthrough"] }
  },
  $defs: {
    id: { type: "string", minLength: 1, maxLength: 128, pattern: "^[A-Za-z][A-Za-z0-9_-]*$" },
    text: { type: "string", minLength: 1, pattern: "\\S" },
    ids: { type: "array", items: { $ref: "#/$defs/id" }, uniqueItems: true },
    localPath: {
      type: "string",
      minLength: 1,
      description: "Path relative to the authored document directory. No URL, traversal, encoded path, query or fragment.",
      pattern: "^(?!/)(?!.*(?:^|/)\\.{1,2}(?:/|$))(?!.*//)(?!.*[/ ]$)[^\\\\:\\u0000-\\u001F%?#]+$"
    },
    paths: { type: "array", items: { $ref: "#/$defs/localPath" }, uniqueItems: true },
    source: {
      type: "object",
      additionalProperties: false,
      required: ["html"],
      properties: {
        html: { $ref: "#/$defs/localPath" },
        styles: { $ref: "#/$defs/paths" },
        scripts: { $ref: "#/$defs/paths" }
      }
    }
  }
});

// packages/protocol/src/workspace-contracts.mjs
var DESIGN_WORKSPACE_VERSION = "1.0.0";
var DESIGN_WORKSPACE_MAX_BYTES = 5 * 1024 * 1024;
var DESIGN_WORKSPACE_MAX_EVENT_BYTES = 256 * 1024;
var DESIGN_WORKSPACE_ID_PATTERN = "^[A-Za-z0-9_-]{22,64}$";
var id4 = { type: "string", pattern: DESIGN_WORKSPACE_ID_PATTERN };
var digest4 = { type: "string", pattern: "^[a-f0-9]{64}$" };
var b64 = { type: "string", pattern: "^[A-Za-z0-9_-]+$" };
var epoch = { type: "integer", minimum: 1, maximum: 2147483647 };
var cipherProperties = {
  iv: { ...b64, minLength: 16, maxLength: 16 },
  ciphertext: { ...b64, minLength: 22, maxLength: Math.ceil(DESIGN_WORKSPACE_MAX_BYTES * 4 / 3) }
};
var signature2 = { ...b64, minLength: 86, maxLength: 86 };
var publicKey = {
  type: "object",
  additionalProperties: false,
  required: ["kty", "crv", "x", "y"],
  properties: {
    kty: { const: "EC" },
    crv: { const: "P-256" },
    x: { ...b64, minLength: 43, maxLength: 43 },
    y: { ...b64, minLength: 43, maxLength: 43 },
    ext: { type: "boolean" },
    key_ops: { type: "array", items: { const: "verify" }, maxItems: 1 }
  }
};
var schema4 = (name, properties, required = Object.keys(properties)) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.9.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: "1.9.0" },
  type: "object",
  additionalProperties: false,
  properties,
  required
});
var DESIGN_WORKSPACE_REVISION_SCHEMA = schema4("design-workspace-revision", {
  id: id4,
  epoch,
  reviewOf: digest4,
  createdAt: { type: "string", format: "date-time" },
  ...cipherProperties,
  signature: signature2
});
var DESIGN_WORKSPACE_EVENT_SCHEMA = schema4("design-workspace-event", {
  id: id4,
  revisionId: id4,
  reviewOf: digest4,
  epoch,
  ...cipherProperties,
  publicKey,
  signature: signature2
});
var sealed = {
  type: "object",
  additionalProperties: false,
  required: ["iv", "ciphertext"],
  properties: cipherProperties
};
var DESIGN_WORKSPACE_CREATE_SCHEMA = schema4("design-workspace-create", {
  schemaVersion: { const: DESIGN_WORKSPACE_VERSION },
  id: id4,
  ownerPublicKey: publicKey,
  ownerAuthHash: digest4,
  reviewerAuthHash: digest4,
  epoch: { const: 1 },
  keyring: sealed,
  revision: DESIGN_WORKSPACE_REVISION_SCHEMA,
  operationId: id4,
  signature: signature2
});
var DESIGN_WORKSPACE_SCHEMA = schema4("design-review-workspace", {
  schemaVersion: { const: DESIGN_WORKSPACE_VERSION },
  id: id4,
  version: epoch,
  epoch,
  currentRevision: id4,
  commentsPaused: { type: "boolean" },
  ownerPublicKey: publicKey,
  keyring: sealed
});
var designProperties = (
  /** @type {Record<string, { items: { properties: Record<string, unknown>; required: string[] } }>} */
  structuredClone(DESIGN_DOCUMENT_SCHEMA.properties)
);
for (const key of ["kind", "schemaVersion", "brief", "assets", "designSystem"])
  delete designProperties[key];
delete designProperties.screens.items.properties.source;
designProperties.screens.items.required = ["id", "title"];
delete designProperties.variants.items.properties.sources;
var DESIGN_REVIEW_BUNDLE_SCHEMA = {
  ...schema4(
    "design-review-bundle",
    {
      kind: { const: "openplanr-design-review-bundle" },
      schemaVersion: { const: DESIGN_WORKSPACE_VERSION },
      design: {
        type: "object",
        additionalProperties: false,
        properties: designProperties,
        required: [
          "id",
          "title",
          "frames",
          "screens",
          "screenOrder",
          "variants",
          "selectedVariant",
          "defaultView"
        ]
      },
      envelope: { type: "object", required: ["schemaVersion", "artifacts", "viewer"] },
      entries: {
        type: "array",
        minItems: 1,
        maxItems: 256,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["artifactId", "screenId", "variantId", "frameId"],
          properties: Object.fromEntries(
            ["artifactId", "screenId", "variantId", "frameId"].map((key) => [
              key,
              { type: "string", minLength: 1, maxLength: 128 }
            ])
          )
        }
      },
      state: {
        type: ["object", "null"],
        additionalProperties: false,
        properties: {
          positions: {
            type: "object",
            additionalProperties: {
              type: "object",
              additionalProperties: false,
              required: ["x", "y"],
              properties: {
                x: { type: "number", minimum: -1e7, maximum: 1e7 },
                y: { type: "number", minimum: -1e7, maximum: 1e7 }
              }
            }
          }
        }
      },
      revision: { type: "string", minLength: 1, maxLength: 128 },
      verification: {
        type: ["object", "null"],
        additionalProperties: false,
        properties: { status: { enum: ["verified", "unverified", "failed", "pending"] } }
      }
    },
    ["kind", "schemaVersion", "design", "envelope", "entries", "revision"]
  ),
  $defs: structuredClone(DESIGN_DOCUMENT_SCHEMA.$defs)
};
var DESIGN_WORKSPACE_SCHEMAS = Object.freeze({
  "design-review-workspace": DESIGN_WORKSPACE_SCHEMA,
  "design-workspace-create": DESIGN_WORKSPACE_CREATE_SCHEMA,
  "design-workspace-revision": DESIGN_WORKSPACE_REVISION_SCHEMA,
  "design-workspace-event": DESIGN_WORKSPACE_EVENT_SCHEMA,
  "design-review-bundle": DESIGN_REVIEW_BUNDLE_SCHEMA
});

// packages/protocol/src/diagram-review-contracts.mjs
var DIAGRAM_WORKSPACE_MAX_BYTES = 5 * 1024 * 1024;
var DIAGRAM_WORKSPACE_MAX_EVENT_BYTES = 256 * 1024;
var text2 = { type: "string", maxLength: 8192 };
var id5 = { type: "string", minLength: 1, maxLength: 160 };
var digest5 = { type: "string", pattern: "^[a-f0-9]{64}$" };
var shaDigest = { type: "string", pattern: "^sha256:[a-f0-9]{64}$" };
var coord = { type: "number", minimum: 0, maximum: 1 };
var closed4 = (properties, required = Object.keys(properties)) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false
});
var list2 = (items, maxItems = 1e4) => ({ type: "array", items, maxItems });
var contract = (name, shape) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.15.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: "1.15.0" },
  ...shape
});
var item = closed4({ id: id5, label: text2, kind: id5, x: { type: "number" }, y: { type: "number" } });
var relation2 = closed4({ id: id5, from: id5, to: id5, label: text2, kind: id5 });
var DIAGRAM_REVIEW_BUNDLE_SCHEMA = contract(
  "diagram-review-bundle",
  closed4(
    {
      kind: { const: "openplanr-diagram-review-bundle" },
      schemaVersion: { const: "1.0.0" },
      diagramId: id5,
      title: text2,
      source: closed4({ kind: { enum: ["manifest", "authoring"] }, digest: shaDigest }),
      rendering: closed4({ id: id5, version: id5, fontFamily: { const: "Inter" } }),
      summary: text2,
      grammar: id5,
      colorScheme: { enum: ["light", "dark"] },
      scene: closed4({
        svg: { type: "string", minLength: 1, maxLength: 5 * 1024 * 1024 },
        width: { type: "number", exclusiveMinimum: 0, maximum: 16384 },
        height: { type: "number", exclusiveMinimum: 0, maximum: 16384 },
        items: list2(item),
        relations: list2(relation2)
      }),
      authored: DIAGRAM_AUTHORING_SCHEMAS["diagram-authoring-bundle"]
    },
    ["kind", "schemaVersion", "diagramId", "title", "source", "rendering", "scene"]
  )
);
var feedbackBase = {
  kind: { enum: ["comment", "reply", "resolve"] },
  author: { ...id5, maxLength: 160 },
  reviewOf: digest5,
  createdAt: { type: "string", format: "date-time" },
  commentId: id5
};
var DIAGRAM_REVIEW_FEEDBACK_SCHEMA = contract("diagram-review-feedback", {
  oneOf: [
    closed4({
      ...feedbackBase,
      kind: { const: "comment" },
      body: { ...text2, minLength: 1 },
      target: closed4({ elementId: id5, x: coord, y: coord }, [])
    }),
    closed4({
      ...feedbackBase,
      kind: { const: "reply" },
      body: { ...text2, minLength: 1 },
      parentId: id5
    }),
    closed4({ ...feedbackBase, kind: { const: "resolve" }, resolved: { type: "boolean" } })
  ]
});
function workspaceSchema(name, original) {
  return contract(name, {
    ...structuredClone(original),
    $id: `https://openplanr.dev/schemas/v1.15.0/${name}.schema.json`,
    "x-openplanr-contract": { id: name, version: "1.15.0" }
  });
}
var DIAGRAM_WORKSPACE_SCHEMA = workspaceSchema(
  "diagram-review-workspace",
  DESIGN_WORKSPACE_SCHEMAS["design-review-workspace"]
);
var DIAGRAM_WORKSPACE_CREATE_SCHEMA = workspaceSchema(
  "diagram-workspace-create",
  DESIGN_WORKSPACE_SCHEMAS["design-workspace-create"]
);
var DIAGRAM_WORKSPACE_REVISION_SCHEMA = workspaceSchema(
  "diagram-workspace-revision",
  DESIGN_WORKSPACE_SCHEMAS["design-workspace-revision"]
);
var DIAGRAM_WORKSPACE_EVENT_SCHEMA = workspaceSchema(
  "diagram-workspace-event",
  DESIGN_WORKSPACE_SCHEMAS["design-workspace-event"]
);
var DIAGRAM_REVIEW_SCHEMAS = Object.freeze({
  "diagram-review-bundle": DIAGRAM_REVIEW_BUNDLE_SCHEMA,
  "diagram-review-feedback": DIAGRAM_REVIEW_FEEDBACK_SCHEMA,
  "diagram-review-workspace": DIAGRAM_WORKSPACE_SCHEMA,
  "diagram-workspace-create": DIAGRAM_WORKSPACE_CREATE_SCHEMA,
  "diagram-workspace-revision": DIAGRAM_WORKSPACE_REVISION_SCHEMA,
  "diagram-workspace-event": DIAGRAM_WORKSPACE_EVENT_SCHEMA
});

// packages/protocol/src/studio-presentation-contracts.mjs
var DIAGRAM_PRESENTATION_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://openplanr.dev/schemas/v1.17.0/diagram-presentation.schema.json",
  "x-openplanr-contract": { id: "diagram-presentation", version: "1.17.0" },
  type: "object",
  additionalProperties: false,
  required: ["kind", "schemaVersion", "palette", "theme", "fontFamily"],
  properties: {
    kind: { const: "openplanr-diagram-presentation" },
    schemaVersion: { const: "2.0.0" },
    palette: { const: "openplanr-brand-v2" },
    theme: { enum: ["light", "dark"] },
    fontFamily: { const: "Inter" }
  }
};
var DIAGRAM_REVIEW_BUNDLE_V11_SCHEMA = structuredClone(DIAGRAM_REVIEW_BUNDLE_SCHEMA);
Object.assign(DIAGRAM_REVIEW_BUNDLE_V11_SCHEMA, {
  $id: "https://openplanr.dev/schemas/v1.17.0/diagram-review-bundle.schema.json",
  "x-openplanr-contract": { id: "diagram-review-bundle", version: "1.17.0" }
});
DIAGRAM_REVIEW_BUNDLE_V11_SCHEMA.properties.schemaVersion = { const: "1.1.0" };
DIAGRAM_REVIEW_BUNDLE_V11_SCHEMA.properties.presentation = DIAGRAM_PRESENTATION_SCHEMA;
DIAGRAM_REVIEW_BUNDLE_V11_SCHEMA.required.push("presentation");
var DIAGRAM_AUTHORING_BUNDLE_V11_SCHEMA = structuredClone(
  DIAGRAM_AUTHORING_SCHEMAS["diagram-authoring-bundle"]
);
Object.assign(DIAGRAM_AUTHORING_BUNDLE_V11_SCHEMA, {
  $id: "https://openplanr.dev/schemas/v1.17.0/diagram-authoring-bundle.schema.json",
  "x-openplanr-contract": { id: "diagram-authoring-bundle", version: "1.17.0" }
});
Object.assign(DIAGRAM_AUTHORING_BUNDLE_V11_SCHEMA.properties, {
  schemaVersion: { const: "1.1.0" },
  protocolVersion: { const: "1.17.0" },
  studioPresentation: DIAGRAM_PRESENTATION_SCHEMA
});
DIAGRAM_AUTHORING_BUNDLE_V11_SCHEMA.required.push("studioPresentation");
var DIAGRAM_EDIT_TRANSACTION_V11_SCHEMA = structuredClone(
  DIAGRAM_AUTHORING_SCHEMAS["diagram-edit-transaction"]
);
Object.assign(DIAGRAM_EDIT_TRANSACTION_V11_SCHEMA, {
  $id: "https://openplanr.dev/schemas/v1.17.0/diagram-edit-transaction.schema.json",
  "x-openplanr-contract": { id: "diagram-edit-transaction", version: "1.17.0" }
});
Object.assign(DIAGRAM_EDIT_TRANSACTION_V11_SCHEMA.properties, {
  schemaVersion: { const: "1.1.0" },
  protocolVersion: { const: "1.17.0" }
});
DIAGRAM_EDIT_TRANSACTION_V11_SCHEMA.properties.operations.items.oneOf.push({
  type: "object",
  additionalProperties: false,
  required: ["type", "before", "after"],
  properties: {
    type: { const: "set-studio-presentation" },
    before: { anyOf: [DIAGRAM_PRESENTATION_SCHEMA, { type: "null" }] },
    after: { anyOf: [DIAGRAM_PRESENTATION_SCHEMA, { type: "null" }] }
  }
});
DIAGRAM_REVIEW_BUNDLE_V11_SCHEMA.properties.authored = {
  oneOf: [
    DIAGRAM_REVIEW_BUNDLE_V11_SCHEMA.properties.authored,
    DIAGRAM_AUTHORING_BUNDLE_V11_SCHEMA
  ]
};

// packages/protocol/src/large-object-limits.mjs
var LARGE_OBJECT_LIMITS = Object.freeze({
  uniqueHtmlBytes: 100 * 1024 * 1024,
  decodedBytes: 128 * 1024 * 1024,
  catalogBytes: 8 * 1024 * 1024,
  manifestBytes: 64 * 1024,
  chunkBytes: 1024 * 1024,
  chunkPlaintextBytes: 1024 * 1024 - 16,
  chunks: 129,
  ciphertextBytes: 128 * 1024 * 1024 + 129 * 16,
  sources: 256,
  views: 4096,
  resources: 1024,
  eventBytes: 256 * 1024,
  eventPageBytes: 1024 * 1024,
  eventPageCount: 100
});

// packages/protocol/src/large-object-contracts.mjs
var LARGE_OBJECT_VERSION = "2.0.0";
var id6 = { type: "string", pattern: "^[A-Za-z0-9_-]{22,64}$" };
var digest6 = { type: "string", pattern: "^[a-f0-9]{64}$" };
var signature3 = { type: "string", pattern: "^[A-Za-z0-9_-]{86}$" };
var integer2 = (max, min = 0) => ({ type: "integer", minimum: min, maximum: max });
var closed5 = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required
});
var iso2 = { type: "string", format: "date-time", maxLength: 40 };
var codec = { enum: ["identity", "deflate-raw"] };
var publicKey2 = closed5({
  kty: { const: "EC" },
  crv: { const: "P-256" },
  x: { type: "string", pattern: "^[A-Za-z0-9_-]{43}$" },
  y: { type: "string", pattern: "^[A-Za-z0-9_-]{43}$" }
});
var keyring = closed5({
  iv: { type: "string", pattern: "^[A-Za-z0-9_-]{16}$" },
  ciphertext: { type: "string", pattern: "^[A-Za-z0-9_-]+$", maxLength: 65536 }
});
var chunk = closed5({
  index: integer2(128),
  byteLength: integer2(LARGE_OBJECT_LIMITS.chunkBytes, 17),
  iv: { type: "string", pattern: "^[A-Za-z0-9_-]{16}$" },
  sha256: digest6
});
var catalogSpan = closed5({
  offset: integer2(LARGE_OBJECT_LIMITS.decodedBytes),
  encodedBytes: integer2(LARGE_OBJECT_LIMITS.catalogBytes, 1),
  decodedBytes: integer2(LARGE_OBJECT_LIMITS.catalogBytes, 1),
  codec
});
var schema5 = (name, properties, required) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.17.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: "1.17.0" },
  ...closed5(properties, required)
});
var ENCRYPTED_RESOURCE_MANIFEST_SCHEMA = schema5("encrypted-resource-manifest", {
  schemaVersion: { const: LARGE_OBJECT_VERSION },
  kind: { const: "openplanr-encrypted-resource-manifest" },
  workspaceId: id6,
  revisionId: id6,
  epoch: integer2(Number.MAX_SAFE_INTEGER, 1),
  createdAt: iso2,
  plaintextBytes: integer2(LARGE_OBJECT_LIMITS.decodedBytes, 1),
  ciphertextBytes: integer2(LARGE_OBJECT_LIMITS.ciphertextBytes, 17),
  catalog: catalogSpan,
  chunks: { type: "array", minItems: 1, maxItems: LARGE_OBJECT_LIMITS.chunks, items: chunk },
  signature: signature3
});
var ENCRYPTED_UPLOAD_PREPARE_SCHEMA = schema5("encrypted-upload-prepare", {
  schemaVersion: { const: LARGE_OBJECT_VERSION },
  workspaceId: id6,
  operationId: id6,
  expectedVersion: integer2(Number.MAX_SAFE_INTEGER),
  epoch: integer2(Number.MAX_SAFE_INTEGER, 1),
  ownerPublicKey: publicKey2,
  ownerAuthHash: digest6,
  reviewerAuthHash: digest6,
  keyring,
  manifest: ENCRYPTED_RESOURCE_MANIFEST_SCHEMA,
  signature: signature3
});
var ENCRYPTED_UPLOAD_COMMIT_SCHEMA = schema5("encrypted-upload-commit", {
  schemaVersion: { const: LARGE_OBJECT_VERSION },
  workspaceId: id6,
  operationId: id6,
  manifestSha256: digest6,
  signature: signature3
});
var ENCRYPTED_UPLOAD_RECEIPT_SCHEMA = schema5("encrypted-upload-receipt", {
  schemaVersion: { const: LARGE_OBJECT_VERSION },
  workspaceId: id6,
  operationId: id6,
  revisionId: id6,
  manifestSha256: digest6,
  status: { const: "committed" },
  version: integer2(Number.MAX_SAFE_INTEGER, 1),
  committedAt: iso2
});
var ENCRYPTED_UPLOAD_STATUS_SCHEMA = schema5(
  "encrypted-upload-status",
  {
    schemaVersion: { const: LARGE_OBJECT_VERSION },
    workspaceId: id6,
    operationId: id6,
    revisionId: id6,
    manifestSha256: digest6,
    status: { enum: ["prepared", "committed"] },
    receivedChunks: {
      type: "array",
      maxItems: LARGE_OBJECT_LIMITS.chunks,
      items: closed5({
        index: integer2(128),
        sha256: digest6,
        byteLength: integer2(LARGE_OBJECT_LIMITS.chunkBytes, 17)
      })
    },
    receipt: ENCRYPTED_UPLOAD_RECEIPT_SCHEMA
  },
  [
    "schemaVersion",
    "workspaceId",
    "operationId",
    "revisionId",
    "manifestSha256",
    "status",
    "receivedChunks"
  ]
);
var ENCRYPTED_WORKSPACE_V2_SCHEMA = schema5("encrypted-workspace-v2", {
  schemaVersion: { const: LARGE_OBJECT_VERSION },
  id: id6,
  version: integer2(Number.MAX_SAFE_INTEGER, 1),
  epoch: integer2(Number.MAX_SAFE_INTEGER, 1),
  currentRevision: id6,
  ownerPublicKey: publicKey2,
  keyring,
  commentsPaused: { type: "boolean" }
});
var ENCRYPTED_WORKSPACE_EVENT_V2_SCHEMA = schema5("encrypted-workspace-event-v2", {
  id: id6,
  epoch: integer2(Number.MAX_SAFE_INTEGER, 1),
  revisionId: id6,
  createdAt: iso2,
  iv: { type: "string", pattern: "^[A-Za-z0-9_-]{16}$" },
  ciphertext: {
    type: "string",
    pattern: "^[A-Za-z0-9_-]+$",
    maxLength: Math.ceil(LARGE_OBJECT_LIMITS.eventBytes * 4 / 3)
  },
  authorPublicKey: publicKey2,
  signature: signature3
});
var resource = closed5({
  id: { type: "string", pattern: "^r[0-9]{1,4}$" },
  type: { enum: ["html-segments", "shared-block", "asset"] },
  offset: integer2(LARGE_OBJECT_LIMITS.decodedBytes),
  encodedBytes: integer2(LARGE_OBJECT_LIMITS.decodedBytes, 1),
  decodedBytes: integer2(LARGE_OBJECT_LIMITS.decodedBytes, 1),
  codec,
  sha256: digest6
});
var RESOURCE_CATALOG_SCHEMA = schema5("resource-catalog", {
  schemaVersion: { const: "1.0.0" },
  kind: { const: "openplanr-resource-catalog" },
  bundle: { type: "object" },
  uniqueHtmlBytes: integer2(LARGE_OBJECT_LIMITS.uniqueHtmlBytes),
  totalDecodedBytes: integer2(LARGE_OBJECT_LIMITS.decodedBytes, 1),
  resources: {
    type: "array",
    minItems: 1,
    maxItems: LARGE_OBJECT_LIMITS.resources,
    items: resource
  },
  sources: {
    type: "array",
    minItems: 1,
    maxItems: LARGE_OBJECT_LIMITS.sources,
    items: closed5({
      id: { type: "string", minLength: 1, maxLength: 128 },
      resourceId: resource.properties.id,
      htmlBytes: integer2(LARGE_OBJECT_LIMITS.uniqueHtmlBytes, 1),
      sha256: digest6
    })
  },
  viewSources: {
    type: "object",
    maxProperties: LARGE_OBJECT_LIMITS.views,
    additionalProperties: { type: "string", minLength: 1, maxLength: 128 }
  }
});
RESOURCE_CATALOG_SCHEMA.properties.reviewOf = digest6;
var companyId = { type: "string", pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$" };
var companyScope = { organizationId: companyId, projectId: companyId, artifactId: companyId };
var COMPANY_RESOURCE_MANIFEST_SCHEMA = schema5("company-resource-manifest", {
  schemaVersion: { const: "2.0.0" },
  kind: { const: "openplanr-company-resource-manifest" },
  ...companyScope,
  revisionId: id6,
  contentDigest: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
  contentType: { const: "application/json" },
  byteLength: integer2(LARGE_OBJECT_LIMITS.decodedBytes, 1),
  decodedBytes: integer2(LARGE_OBJECT_LIMITS.decodedBytes, 1),
  catalog: catalogSpan,
  chunks: {
    type: "array",
    minItems: 1,
    maxItems: 128,
    items: closed5({
      index: integer2(127),
      byteLength: integer2(LARGE_OBJECT_LIMITS.chunkBytes, 1),
      sha256: digest6
    })
  }
});
var COMPANY_RESOURCE_UPLOAD_PREPARE_SCHEMA = schema5("company-resource-upload-prepare", {
  schemaVersion: { const: "2.0.0" },
  operationId: id6,
  baseRevisionId: { oneOf: [id6, { type: "null" }] },
  manifest: COMPANY_RESOURCE_MANIFEST_SCHEMA
});
var COMPANY_RESOURCE_UPLOAD_RECEIPT_SCHEMA = schema5("company-resource-upload-receipt", {
  schemaVersion: { const: "2.0.0" },
  ...companyScope,
  operationId: id6,
  revisionId: id6,
  manifestSha256: digest6,
  contentDigest: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
  status: { const: "committed" },
  committedAt: iso2
});
var COMPANY_RESOURCE_UPLOAD_STATUS_SCHEMA = schema5(
  "company-resource-upload-status",
  {
    schemaVersion: { const: "2.0.0" },
    operationId: id6,
    status: { enum: ["prepared", "committed"] },
    receivedChunks: {
      type: "array",
      maxItems: 128,
      items: closed5({
        index: integer2(127),
        sha256: digest6,
        byteLength: integer2(LARGE_OBJECT_LIMITS.chunkBytes, 1)
      })
    },
    receipt: COMPANY_RESOURCE_UPLOAD_RECEIPT_SCHEMA
  },
  ["schemaVersion", "operationId", "status", "receivedChunks"]
);
var ENTERPRISE_ARTIFACT_REVISION_V11_SCHEMA = structuredClone(
  ENTERPRISE_ARTIFACT_REVISION_SCHEMA
);
Object.assign(ENTERPRISE_ARTIFACT_REVISION_V11_SCHEMA, {
  $id: "https://openplanr.dev/schemas/v1.17.0/enterprise-artifact-revision.schema.json",
  "x-openplanr-contract": { id: "enterprise-artifact-revision", version: "1.17.0" }
});
Object.assign(ENTERPRISE_ARTIFACT_REVISION_V11_SCHEMA.properties, {
  id: id6,
  parentRevisionId: {
    anyOf: [id6, structuredClone(ENTERPRISE_ARTIFACT_REVISION_SCHEMA.properties.parentRevisionId)]
  },
  schemaVersion: { const: "1.1.0" },
  protocolVersion: { const: "1.17.0" },
  contentDigest: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
  byteLength: integer2(LARGE_OBJECT_LIMITS.decodedBytes, 1),
  contentReference: closed5({ transport: { const: "resources-v2" }, manifestSha256: digest6 })
});
ENTERPRISE_ARTIFACT_REVISION_V11_SCHEMA.required.push("contentReference", "protocolVersion");
var WORKSPACE_MANAGEMENT_V2_SCHEMA = schema5("workspace-management-v2", {
  operationId: id6,
  expectedVersion: integer2(Number.MAX_SAFE_INTEGER, 1),
  epoch: integer2(Number.MAX_SAFE_INTEGER, 1),
  action: { enum: ["pause", "resume", "revoke", "delete"] },
  signature: signature3
});
var WORKSPACE_ROTATION_V2_SCHEMA = schema5("workspace-rotation-v2", {
  operationId: id6,
  expectedVersion: integer2(Number.MAX_SAFE_INTEGER, 1),
  epoch: integer2(Number.MAX_SAFE_INTEGER, 2),
  reviewerAuthHash: digest6,
  keyring,
  signature: signature3
});
var LARGE_OBJECT_SCHEMAS = Object.freeze({
  ...ENTERPRISE_RESOURCE_SCHEMAS,
  ...SHARING_SECURITY_SCHEMAS,
  "diagram-authoring-bundle": DIAGRAM_AUTHORING_BUNDLE_V11_SCHEMA,
  "diagram-edit-transaction": DIAGRAM_EDIT_TRANSACTION_V11_SCHEMA,
  "diagram-presentation": DIAGRAM_PRESENTATION_SCHEMA,
  "diagram-review-bundle": DIAGRAM_REVIEW_BUNDLE_V11_SCHEMA,
  "encrypted-resource-manifest": ENCRYPTED_RESOURCE_MANIFEST_SCHEMA,
  "encrypted-upload-prepare": ENCRYPTED_UPLOAD_PREPARE_SCHEMA,
  "encrypted-upload-commit": ENCRYPTED_UPLOAD_COMMIT_SCHEMA,
  "encrypted-upload-receipt": ENCRYPTED_UPLOAD_RECEIPT_SCHEMA,
  "encrypted-upload-status": ENCRYPTED_UPLOAD_STATUS_SCHEMA,
  "encrypted-workspace-v2": ENCRYPTED_WORKSPACE_V2_SCHEMA,
  "encrypted-workspace-event-v2": ENCRYPTED_WORKSPACE_EVENT_V2_SCHEMA,
  "resource-catalog": RESOURCE_CATALOG_SCHEMA,
  "company-resource-manifest": COMPANY_RESOURCE_MANIFEST_SCHEMA,
  "company-resource-upload-prepare": COMPANY_RESOURCE_UPLOAD_PREPARE_SCHEMA,
  "company-resource-upload-receipt": COMPANY_RESOURCE_UPLOAD_RECEIPT_SCHEMA,
  "company-resource-upload-status": COMPANY_RESOURCE_UPLOAD_STATUS_SCHEMA,
  "enterprise-artifact-revision": ENTERPRISE_ARTIFACT_REVISION_V11_SCHEMA,
  "workspace-management-v2": WORKSPACE_MANAGEMENT_V2_SCHEMA,
  "workspace-rotation-v2": WORKSPACE_ROTATION_V2_SCHEMA
});

// packages/artifact/lib/artifact/artifact-sources.mjs
var ARTIFACT_SHARED_ENVELOPE_VERSION = "1.1.0";

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
      const schema7 = JSON.parse(readFileSync(path, "utf-8"));
      schemaCache.set(key, schema7);
      return schema7;
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
var MAX_ARTIFACT_HTML_BYTES = LARGE_OBJECT_LIMITS.uniqueHtmlBytes;
var MAX_PINS = 1e4;
var MAX_REPLIES = 1e4;
var MAX_PASTE_BYTES = 5 * 1024 * 1024;
var ARTIFACT_PRESENTATIONS = Object.freeze(["document", "canvas"]);
var ARTIFACT_DOCUMENT_MAX_HEIGHT = 262144;
function invalid(message2, details = void 0) {
  throw new PipelineError(ARTIFACT_ERROR_CODES.ENVELOPE_INVALID, message2, "", details);
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
function sha256Hex2(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
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
function envelopeWithoutReview(envelope2) {
  return {
    schemaVersion: envelope2.schemaVersion,
    ...envelope2.schemaVersion === ARTIFACT_SHARED_ENVELOPE_VERSION ? { sources: envelope2.sources } : {},
    artifacts: envelope2.artifacts,
    viewer: envelope2.viewer
  };
}
function canonicalEnvelopeBytes(envelope2, { includeReview = false } = {}) {
  const value = includeReview ? envelope2 : envelopeWithoutReview(envelope2);
  return canonicalBytes(value);
}
function digestArtifactEnvelope(envelope2) {
  return sha256Hex2(canonicalEnvelopeBytes(envelope2));
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
    for (const coordinate2 of ["x", "y", "w", "h"]) {
      const value = pin.region?.[coordinate2];
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
        invalid(`${label}.region.${coordinate2} must be a finite normalized coordinate.`);
      }
    }
    if (pin.region.x + pin.region.w > 1 || pin.region.y + pin.region.h > 1) {
      invalid(`${label}.region must remain inside normalized artifact bounds.`);
    }
    if (!Array.isArray(pin.replies) || pin.replies.length > MAX_REPLIES)
      invalid(`${label}.replies exceeds ${MAX_REPLIES}.`);
    for (const [replyIndex, reply2] of pin.replies.entries()) {
      const replyLabel = `${label}.replies[${replyIndex}]`;
      assertBoundedString(reply2.id, `${replyLabel}.id`, { min: 1, max: 128 });
      assertBoundedString(reply2.author?.id ?? "", `${replyLabel}.author.id`, { max: 128 });
      assertBoundedString(reply2.author?.name, `${replyLabel}.author.name`, { min: 1, max: 256 });
      assertBoundedString(reply2.comment, `${replyLabel}.comment`, { min: 1, max: 65536 });
    }
  }
  return review;
}

// packages/protocol/src/review-experience-contracts.mjs
var text3 = { type: "string", maxLength: 16384 };
var id7 = { type: "string", minLength: 1, maxLength: 128 };
var digest7 = { type: "string", pattern: "^[a-f0-9]{64}$" };
var texts = { type: "array", maxItems: 256, items: text3 };
var closed6 = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required
});
var list3 = (items, maxItems = 256) => ({ type: "array", maxItems, items });
var schema6 = (name, properties, required) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.10.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: "1.10.0" },
  ...closed6(properties, required)
});
var DESIGN_REVIEW_CONTEXT_SCHEMA = schema6(
  "design-review-context",
  {
    kind: { const: "openplanr-design-review-context" },
    schemaVersion: { const: "1.0.0" },
    designId: id7,
    brief: closed6({ purpose: text3, requests: { ...texts, maxItems: 3 }, audience: text3 }, [
      "purpose",
      "requests"
    ]),
    revisionSummary: text3,
    implementation: closed6({
      tokens: list3(closed6({ name: id7, value: text3, description: text3 }, ["name", "value"]), 512),
      components: list3(
        closed6(
          {
            id: id7,
            name: text3,
            screenIds: list3(id7),
            anchorIds: list3(id7),
            states: list3(closed6({ name: id7, description: text3 })),
            notes: text3,
            responsive: text3,
            accessibility: text3
          },
          ["id", "name"]
        )
      ),
      responsive: texts,
      accessibility: texts
    })
  },
  ["kind", "schemaVersion", "designId", "brief", "implementation"]
);
var DESIGN_FINGERPRINT_SCHEMA = closed6({
  screenId: id7,
  variantId: id7,
  frameId: id7,
  contentDigest: digest7,
  guidanceDigest: digest7
});
var bundleV11 = {
  .../** @type {MutableSchema} */
  structuredClone(DESIGN_REVIEW_BUNDLE_SCHEMA),
  $id: "https://openplanr.dev/schemas/v1.10.0/design-review-bundle.schema.json",
  "x-openplanr-contract": { id: "design-review-bundle", version: "1.10.0" }
};
Object.assign(bundleV11.properties, {
  schemaVersion: { const: "1.1.0" },
  reviewContext: DESIGN_REVIEW_CONTEXT_SCHEMA,
  contextDigest: digest7,
  fingerprints: list3(DESIGN_FINGERPRINT_SCHEMA)
});
bundleV11.required.push("reviewContext", "contextDigest", "fingerprints");
var DESIGN_REVIEW_BUNDLE_V11_SCHEMA = bundleV11;
var bundleV12 = (
  /** @type {MutableSchema} */
  structuredClone(DESIGN_REVIEW_BUNDLE_V11_SCHEMA)
);
bundleV12.$id = "https://openplanr.dev/schemas/v1.16.0/design-review-bundle.schema.json";
bundleV12["x-openplanr-contract"] = { id: "design-review-bundle", version: "1.16.0" };
Object.assign(bundleV12.properties, {
  schemaVersion: { const: "1.2.0" },
  envelope: {
    type: "object",
    required: ["schemaVersion", "sources", "artifacts", "viewer"],
    properties: { schemaVersion: { const: "1.1.0" } }
  },
  entries: {
    .../** @type {Record<string, unknown>} */
    bundleV12.properties.entries,
    maxItems: 4096
  },
  fingerprints: list3(DESIGN_FINGERPRINT_SCHEMA, 4096)
});
var item2 = closed6(
  {
    pinId: id7,
    reviewId: id7,
    screenId: id7,
    revisionId: id7,
    text: text3,
    refinement: text3,
    stale: { type: "boolean" },
    author: text3,
    reviewOf: digest7,
    source: text3
  },
  ["pinId", "text"]
);
var DESIGN_HANDOFF_CONTENT_SCHEMA = closed6({
  summary: text3,
  agreedChanges: list3(item2, 1e4),
  openQuestions: list3(item2, 1e4),
  deferred: list3(item2, 1e4),
  rejected: list3(item2, 1e4)
});
var DESIGN_HANDOFF_SCHEMA = schema6(
  "design-review-handoff",
  {
    kind: { const: "openplanr-design-review-handoff" },
    schemaVersion: { const: "1.0.0" },
    title: text3,
    version: { type: "integer", minimum: 1 },
    status: { enum: ["draft", "approved"] },
    basis: closed6({
      designId: id7,
      sourceRevision: digest7,
      contextDigest: digest7,
      reviewOf: digest7,
      selectedVariant: id7,
      feedbackDigest: digest7,
      verificationDigest: digest7,
      feedbackWatermark: { type: "integer", minimum: 0 }
    }),
    content: DESIGN_HANDOFF_CONTENT_SCHEMA,
    contentHash: digest7,
    markdown: { type: "string", maxLength: 2097152 },
    affectedScreens: list3(id7),
    verificationGaps: texts,
    reviewNotes: list3(closed6({ reviewId: id7, text: text3 }), 1e4),
    approval: closed6({ contentHash: digest7, at: { type: "string", format: "date-time" } })
  },
  [
    "kind",
    "schemaVersion",
    "title",
    "version",
    "status",
    "basis",
    "content",
    "contentHash",
    "markdown",
    "affectedScreens",
    "verificationGaps",
    "reviewNotes"
  ]
);
var DESIGN_REVIEW_METADATA_PAYLOAD_SCHEMA = {
  ...schema6(
    "design-review-metadata-payload",
    {
      schemaVersion: { const: "1.0.0" },
      kind: { enum: ["category", "disposition"] },
      author: { ...text3, minLength: 1, maxLength: 160 },
      reviewOf: digest7,
      pinId: id7,
      category: { enum: ["question", "suggestion", "blocker"] },
      disposition: { enum: ["accepted", "deferred", "rejected"] },
      reason: text3,
      updatedAt: { type: "string", format: "date-time" }
    },
    ["schemaVersion", "kind", "author", "reviewOf", "pinId", "updatedAt"]
  ),
  allOf: [
    {
      if: { properties: { kind: { const: "category" } } },
      then: { required: ["category"], not: { required: ["disposition"] } }
    },
    {
      if: { properties: { kind: { const: "disposition" } } },
      then: { required: ["disposition", "reason"], not: { required: ["category"] } }
    }
  ]
};
var payloadV11 = {
  .../** @type {MutableSchema} */
  structuredClone(DESIGN_REVIEW_METADATA_PAYLOAD_SCHEMA),
  $id: "https://openplanr.dev/schemas/v1.11.0/design-review-metadata-payload.schema.json",
  "x-openplanr-contract": { id: "design-review-metadata-payload", version: "1.11.0" }
};
Object.assign(payloadV11.properties, {
  schemaVersion: { const: "1.1.0" },
  category: { enum: ["question", "suggestion", "change-request", "blocker"] }
});
function assertReviewExperience(value, contract2) {
  const errors = validateJson(value, contract2);
  if (errors.length)
    throw new TypeError(
      `Invalid ${contract2["x-openplanr-contract"]?.id ?? "review data"}: ${errors.slice(0, 4).map((item3) => `${item3.path} ${item3.detail}`).join("; ")}`
    );
  return value;
}
var REVIEW_EXPERIENCE_SCHEMAS = Object.freeze({
  "design-review-context": DESIGN_REVIEW_CONTEXT_SCHEMA,
  "design-review-bundle": DESIGN_REVIEW_BUNDLE_V11_SCHEMA,
  "design-review-handoff": DESIGN_HANDOFF_SCHEMA,
  "design-review-metadata-payload": DESIGN_REVIEW_METADATA_PAYLOAD_SCHEMA
});

// packages/design/lib/design/context.mjs
import { createHash as createHash2 } from "node:crypto";

// node_modules/parse5/dist/common/unicode.js
var CODE_POINTS;
(function(CODE_POINTS2) {
  CODE_POINTS2[CODE_POINTS2["EOF"] = -1] = "EOF";
  CODE_POINTS2[CODE_POINTS2["NULL"] = 0] = "NULL";
  CODE_POINTS2[CODE_POINTS2["TABULATION"] = 9] = "TABULATION";
  CODE_POINTS2[CODE_POINTS2["CARRIAGE_RETURN"] = 13] = "CARRIAGE_RETURN";
  CODE_POINTS2[CODE_POINTS2["LINE_FEED"] = 10] = "LINE_FEED";
  CODE_POINTS2[CODE_POINTS2["FORM_FEED"] = 12] = "FORM_FEED";
  CODE_POINTS2[CODE_POINTS2["SPACE"] = 32] = "SPACE";
  CODE_POINTS2[CODE_POINTS2["EXCLAMATION_MARK"] = 33] = "EXCLAMATION_MARK";
  CODE_POINTS2[CODE_POINTS2["QUOTATION_MARK"] = 34] = "QUOTATION_MARK";
  CODE_POINTS2[CODE_POINTS2["AMPERSAND"] = 38] = "AMPERSAND";
  CODE_POINTS2[CODE_POINTS2["APOSTROPHE"] = 39] = "APOSTROPHE";
  CODE_POINTS2[CODE_POINTS2["HYPHEN_MINUS"] = 45] = "HYPHEN_MINUS";
  CODE_POINTS2[CODE_POINTS2["SOLIDUS"] = 47] = "SOLIDUS";
  CODE_POINTS2[CODE_POINTS2["DIGIT_0"] = 48] = "DIGIT_0";
  CODE_POINTS2[CODE_POINTS2["DIGIT_9"] = 57] = "DIGIT_9";
  CODE_POINTS2[CODE_POINTS2["SEMICOLON"] = 59] = "SEMICOLON";
  CODE_POINTS2[CODE_POINTS2["LESS_THAN_SIGN"] = 60] = "LESS_THAN_SIGN";
  CODE_POINTS2[CODE_POINTS2["EQUALS_SIGN"] = 61] = "EQUALS_SIGN";
  CODE_POINTS2[CODE_POINTS2["GREATER_THAN_SIGN"] = 62] = "GREATER_THAN_SIGN";
  CODE_POINTS2[CODE_POINTS2["QUESTION_MARK"] = 63] = "QUESTION_MARK";
  CODE_POINTS2[CODE_POINTS2["LATIN_CAPITAL_A"] = 65] = "LATIN_CAPITAL_A";
  CODE_POINTS2[CODE_POINTS2["LATIN_CAPITAL_Z"] = 90] = "LATIN_CAPITAL_Z";
  CODE_POINTS2[CODE_POINTS2["RIGHT_SQUARE_BRACKET"] = 93] = "RIGHT_SQUARE_BRACKET";
  CODE_POINTS2[CODE_POINTS2["GRAVE_ACCENT"] = 96] = "GRAVE_ACCENT";
  CODE_POINTS2[CODE_POINTS2["LATIN_SMALL_A"] = 97] = "LATIN_SMALL_A";
  CODE_POINTS2[CODE_POINTS2["LATIN_SMALL_Z"] = 122] = "LATIN_SMALL_Z";
})(CODE_POINTS || (CODE_POINTS = {}));

// node_modules/parse5/dist/common/error-codes.js
var ERR;
(function(ERR2) {
  ERR2["controlCharacterInInputStream"] = "control-character-in-input-stream";
  ERR2["noncharacterInInputStream"] = "noncharacter-in-input-stream";
  ERR2["surrogateInInputStream"] = "surrogate-in-input-stream";
  ERR2["nonVoidHtmlElementStartTagWithTrailingSolidus"] = "non-void-html-element-start-tag-with-trailing-solidus";
  ERR2["endTagWithAttributes"] = "end-tag-with-attributes";
  ERR2["endTagWithTrailingSolidus"] = "end-tag-with-trailing-solidus";
  ERR2["unexpectedSolidusInTag"] = "unexpected-solidus-in-tag";
  ERR2["unexpectedNullCharacter"] = "unexpected-null-character";
  ERR2["unexpectedQuestionMarkInsteadOfTagName"] = "unexpected-question-mark-instead-of-tag-name";
  ERR2["invalidFirstCharacterOfTagName"] = "invalid-first-character-of-tag-name";
  ERR2["unexpectedEqualsSignBeforeAttributeName"] = "unexpected-equals-sign-before-attribute-name";
  ERR2["missingEndTagName"] = "missing-end-tag-name";
  ERR2["unexpectedCharacterInAttributeName"] = "unexpected-character-in-attribute-name";
  ERR2["unknownNamedCharacterReference"] = "unknown-named-character-reference";
  ERR2["missingSemicolonAfterCharacterReference"] = "missing-semicolon-after-character-reference";
  ERR2["unexpectedCharacterAfterDoctypeSystemIdentifier"] = "unexpected-character-after-doctype-system-identifier";
  ERR2["unexpectedCharacterInUnquotedAttributeValue"] = "unexpected-character-in-unquoted-attribute-value";
  ERR2["eofBeforeTagName"] = "eof-before-tag-name";
  ERR2["eofInTag"] = "eof-in-tag";
  ERR2["missingAttributeValue"] = "missing-attribute-value";
  ERR2["missingWhitespaceBetweenAttributes"] = "missing-whitespace-between-attributes";
  ERR2["missingWhitespaceAfterDoctypePublicKeyword"] = "missing-whitespace-after-doctype-public-keyword";
  ERR2["missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers"] = "missing-whitespace-between-doctype-public-and-system-identifiers";
  ERR2["missingWhitespaceAfterDoctypeSystemKeyword"] = "missing-whitespace-after-doctype-system-keyword";
  ERR2["missingQuoteBeforeDoctypePublicIdentifier"] = "missing-quote-before-doctype-public-identifier";
  ERR2["missingQuoteBeforeDoctypeSystemIdentifier"] = "missing-quote-before-doctype-system-identifier";
  ERR2["missingDoctypePublicIdentifier"] = "missing-doctype-public-identifier";
  ERR2["missingDoctypeSystemIdentifier"] = "missing-doctype-system-identifier";
  ERR2["abruptDoctypePublicIdentifier"] = "abrupt-doctype-public-identifier";
  ERR2["abruptDoctypeSystemIdentifier"] = "abrupt-doctype-system-identifier";
  ERR2["cdataInHtmlContent"] = "cdata-in-html-content";
  ERR2["incorrectlyOpenedComment"] = "incorrectly-opened-comment";
  ERR2["eofInScriptHtmlCommentLikeText"] = "eof-in-script-html-comment-like-text";
  ERR2["eofInDoctype"] = "eof-in-doctype";
  ERR2["nestedComment"] = "nested-comment";
  ERR2["abruptClosingOfEmptyComment"] = "abrupt-closing-of-empty-comment";
  ERR2["eofInComment"] = "eof-in-comment";
  ERR2["incorrectlyClosedComment"] = "incorrectly-closed-comment";
  ERR2["eofInCdata"] = "eof-in-cdata";
  ERR2["absenceOfDigitsInNumericCharacterReference"] = "absence-of-digits-in-numeric-character-reference";
  ERR2["nullCharacterReference"] = "null-character-reference";
  ERR2["surrogateCharacterReference"] = "surrogate-character-reference";
  ERR2["characterReferenceOutsideUnicodeRange"] = "character-reference-outside-unicode-range";
  ERR2["controlCharacterReference"] = "control-character-reference";
  ERR2["noncharacterCharacterReference"] = "noncharacter-character-reference";
  ERR2["missingWhitespaceBeforeDoctypeName"] = "missing-whitespace-before-doctype-name";
  ERR2["missingDoctypeName"] = "missing-doctype-name";
  ERR2["invalidCharacterSequenceAfterDoctypeName"] = "invalid-character-sequence-after-doctype-name";
  ERR2["duplicateAttribute"] = "duplicate-attribute";
  ERR2["nonConformingDoctype"] = "non-conforming-doctype";
  ERR2["missingDoctype"] = "missing-doctype";
  ERR2["misplacedDoctype"] = "misplaced-doctype";
  ERR2["endTagWithoutMatchingOpenElement"] = "end-tag-without-matching-open-element";
  ERR2["closingOfElementWithOpenChildElements"] = "closing-of-element-with-open-child-elements";
  ERR2["disallowedContentInNoscriptInHead"] = "disallowed-content-in-noscript-in-head";
  ERR2["openElementsLeftAfterEof"] = "open-elements-left-after-eof";
  ERR2["abandonedHeadElementChild"] = "abandoned-head-element-child";
  ERR2["misplacedStartTagForHeadElement"] = "misplaced-start-tag-for-head-element";
  ERR2["nestedNoscriptInHead"] = "nested-noscript-in-head";
  ERR2["eofInElementThatCanContainOnlyText"] = "eof-in-element-that-can-contain-only-text";
})(ERR || (ERR = {}));

// node_modules/parse5/dist/tokenizer/preprocessor.js
var DEFAULT_BUFFER_WATERLINE = 1 << 16;

// node_modules/parse5/dist/common/token.js
var TokenType;
(function(TokenType2) {
  TokenType2[TokenType2["CHARACTER"] = 0] = "CHARACTER";
  TokenType2[TokenType2["NULL_CHARACTER"] = 1] = "NULL_CHARACTER";
  TokenType2[TokenType2["WHITESPACE_CHARACTER"] = 2] = "WHITESPACE_CHARACTER";
  TokenType2[TokenType2["START_TAG"] = 3] = "START_TAG";
  TokenType2[TokenType2["END_TAG"] = 4] = "END_TAG";
  TokenType2[TokenType2["COMMENT"] = 5] = "COMMENT";
  TokenType2[TokenType2["DOCTYPE"] = 6] = "DOCTYPE";
  TokenType2[TokenType2["EOF"] = 7] = "EOF";
  TokenType2[TokenType2["HIBERNATION"] = 8] = "HIBERNATION";
})(TokenType || (TokenType = {}));

// node_modules/parse5/dist/common/html.js
var NS;
(function(NS2) {
  NS2["HTML"] = "http://www.w3.org/1999/xhtml";
  NS2["MATHML"] = "http://www.w3.org/1998/Math/MathML";
  NS2["SVG"] = "http://www.w3.org/2000/svg";
  NS2["XLINK"] = "http://www.w3.org/1999/xlink";
  NS2["XML"] = "http://www.w3.org/XML/1998/namespace";
  NS2["XMLNS"] = "http://www.w3.org/2000/xmlns/";
})(NS || (NS = {}));
var ATTRS;
(function(ATTRS2) {
  ATTRS2["TYPE"] = "type";
  ATTRS2["ACTION"] = "action";
  ATTRS2["ENCODING"] = "encoding";
  ATTRS2["PROMPT"] = "prompt";
  ATTRS2["NAME"] = "name";
  ATTRS2["COLOR"] = "color";
  ATTRS2["FACE"] = "face";
  ATTRS2["SIZE"] = "size";
})(ATTRS || (ATTRS = {}));
var DOCUMENT_MODE;
(function(DOCUMENT_MODE2) {
  DOCUMENT_MODE2["NO_QUIRKS"] = "no-quirks";
  DOCUMENT_MODE2["QUIRKS"] = "quirks";
  DOCUMENT_MODE2["LIMITED_QUIRKS"] = "limited-quirks";
})(DOCUMENT_MODE || (DOCUMENT_MODE = {}));
var TAG_NAMES;
(function(TAG_NAMES2) {
  TAG_NAMES2["A"] = "a";
  TAG_NAMES2["ADDRESS"] = "address";
  TAG_NAMES2["ANNOTATION_XML"] = "annotation-xml";
  TAG_NAMES2["APPLET"] = "applet";
  TAG_NAMES2["AREA"] = "area";
  TAG_NAMES2["ARTICLE"] = "article";
  TAG_NAMES2["ASIDE"] = "aside";
  TAG_NAMES2["B"] = "b";
  TAG_NAMES2["BASE"] = "base";
  TAG_NAMES2["BASEFONT"] = "basefont";
  TAG_NAMES2["BGSOUND"] = "bgsound";
  TAG_NAMES2["BIG"] = "big";
  TAG_NAMES2["BLOCKQUOTE"] = "blockquote";
  TAG_NAMES2["BODY"] = "body";
  TAG_NAMES2["BR"] = "br";
  TAG_NAMES2["BUTTON"] = "button";
  TAG_NAMES2["CAPTION"] = "caption";
  TAG_NAMES2["CENTER"] = "center";
  TAG_NAMES2["CODE"] = "code";
  TAG_NAMES2["COL"] = "col";
  TAG_NAMES2["COLGROUP"] = "colgroup";
  TAG_NAMES2["DD"] = "dd";
  TAG_NAMES2["DESC"] = "desc";
  TAG_NAMES2["DETAILS"] = "details";
  TAG_NAMES2["DIALOG"] = "dialog";
  TAG_NAMES2["DIR"] = "dir";
  TAG_NAMES2["DIV"] = "div";
  TAG_NAMES2["DL"] = "dl";
  TAG_NAMES2["DT"] = "dt";
  TAG_NAMES2["EM"] = "em";
  TAG_NAMES2["EMBED"] = "embed";
  TAG_NAMES2["FIELDSET"] = "fieldset";
  TAG_NAMES2["FIGCAPTION"] = "figcaption";
  TAG_NAMES2["FIGURE"] = "figure";
  TAG_NAMES2["FONT"] = "font";
  TAG_NAMES2["FOOTER"] = "footer";
  TAG_NAMES2["FOREIGN_OBJECT"] = "foreignObject";
  TAG_NAMES2["FORM"] = "form";
  TAG_NAMES2["FRAME"] = "frame";
  TAG_NAMES2["FRAMESET"] = "frameset";
  TAG_NAMES2["H1"] = "h1";
  TAG_NAMES2["H2"] = "h2";
  TAG_NAMES2["H3"] = "h3";
  TAG_NAMES2["H4"] = "h4";
  TAG_NAMES2["H5"] = "h5";
  TAG_NAMES2["H6"] = "h6";
  TAG_NAMES2["HEAD"] = "head";
  TAG_NAMES2["HEADER"] = "header";
  TAG_NAMES2["HGROUP"] = "hgroup";
  TAG_NAMES2["HR"] = "hr";
  TAG_NAMES2["HTML"] = "html";
  TAG_NAMES2["I"] = "i";
  TAG_NAMES2["IMG"] = "img";
  TAG_NAMES2["IMAGE"] = "image";
  TAG_NAMES2["INPUT"] = "input";
  TAG_NAMES2["IFRAME"] = "iframe";
  TAG_NAMES2["KEYGEN"] = "keygen";
  TAG_NAMES2["LABEL"] = "label";
  TAG_NAMES2["LI"] = "li";
  TAG_NAMES2["LINK"] = "link";
  TAG_NAMES2["LISTING"] = "listing";
  TAG_NAMES2["MAIN"] = "main";
  TAG_NAMES2["MALIGNMARK"] = "malignmark";
  TAG_NAMES2["MARQUEE"] = "marquee";
  TAG_NAMES2["MATH"] = "math";
  TAG_NAMES2["MENU"] = "menu";
  TAG_NAMES2["META"] = "meta";
  TAG_NAMES2["MGLYPH"] = "mglyph";
  TAG_NAMES2["MI"] = "mi";
  TAG_NAMES2["MO"] = "mo";
  TAG_NAMES2["MN"] = "mn";
  TAG_NAMES2["MS"] = "ms";
  TAG_NAMES2["MTEXT"] = "mtext";
  TAG_NAMES2["NAV"] = "nav";
  TAG_NAMES2["NOBR"] = "nobr";
  TAG_NAMES2["NOFRAMES"] = "noframes";
  TAG_NAMES2["NOEMBED"] = "noembed";
  TAG_NAMES2["NOSCRIPT"] = "noscript";
  TAG_NAMES2["OBJECT"] = "object";
  TAG_NAMES2["OL"] = "ol";
  TAG_NAMES2["OPTGROUP"] = "optgroup";
  TAG_NAMES2["OPTION"] = "option";
  TAG_NAMES2["P"] = "p";
  TAG_NAMES2["PARAM"] = "param";
  TAG_NAMES2["PLAINTEXT"] = "plaintext";
  TAG_NAMES2["PRE"] = "pre";
  TAG_NAMES2["RB"] = "rb";
  TAG_NAMES2["RP"] = "rp";
  TAG_NAMES2["RT"] = "rt";
  TAG_NAMES2["RTC"] = "rtc";
  TAG_NAMES2["RUBY"] = "ruby";
  TAG_NAMES2["S"] = "s";
  TAG_NAMES2["SCRIPT"] = "script";
  TAG_NAMES2["SEARCH"] = "search";
  TAG_NAMES2["SECTION"] = "section";
  TAG_NAMES2["SELECT"] = "select";
  TAG_NAMES2["SOURCE"] = "source";
  TAG_NAMES2["SMALL"] = "small";
  TAG_NAMES2["SPAN"] = "span";
  TAG_NAMES2["STRIKE"] = "strike";
  TAG_NAMES2["STRONG"] = "strong";
  TAG_NAMES2["STYLE"] = "style";
  TAG_NAMES2["SUB"] = "sub";
  TAG_NAMES2["SUMMARY"] = "summary";
  TAG_NAMES2["SUP"] = "sup";
  TAG_NAMES2["TABLE"] = "table";
  TAG_NAMES2["TBODY"] = "tbody";
  TAG_NAMES2["TEMPLATE"] = "template";
  TAG_NAMES2["TEXTAREA"] = "textarea";
  TAG_NAMES2["TFOOT"] = "tfoot";
  TAG_NAMES2["TD"] = "td";
  TAG_NAMES2["TH"] = "th";
  TAG_NAMES2["THEAD"] = "thead";
  TAG_NAMES2["TITLE"] = "title";
  TAG_NAMES2["TR"] = "tr";
  TAG_NAMES2["TRACK"] = "track";
  TAG_NAMES2["TT"] = "tt";
  TAG_NAMES2["U"] = "u";
  TAG_NAMES2["UL"] = "ul";
  TAG_NAMES2["SVG"] = "svg";
  TAG_NAMES2["VAR"] = "var";
  TAG_NAMES2["WBR"] = "wbr";
  TAG_NAMES2["XMP"] = "xmp";
})(TAG_NAMES || (TAG_NAMES = {}));
var TAG_ID;
(function(TAG_ID2) {
  TAG_ID2[TAG_ID2["UNKNOWN"] = 0] = "UNKNOWN";
  TAG_ID2[TAG_ID2["A"] = 1] = "A";
  TAG_ID2[TAG_ID2["ADDRESS"] = 2] = "ADDRESS";
  TAG_ID2[TAG_ID2["ANNOTATION_XML"] = 3] = "ANNOTATION_XML";
  TAG_ID2[TAG_ID2["APPLET"] = 4] = "APPLET";
  TAG_ID2[TAG_ID2["AREA"] = 5] = "AREA";
  TAG_ID2[TAG_ID2["ARTICLE"] = 6] = "ARTICLE";
  TAG_ID2[TAG_ID2["ASIDE"] = 7] = "ASIDE";
  TAG_ID2[TAG_ID2["B"] = 8] = "B";
  TAG_ID2[TAG_ID2["BASE"] = 9] = "BASE";
  TAG_ID2[TAG_ID2["BASEFONT"] = 10] = "BASEFONT";
  TAG_ID2[TAG_ID2["BGSOUND"] = 11] = "BGSOUND";
  TAG_ID2[TAG_ID2["BIG"] = 12] = "BIG";
  TAG_ID2[TAG_ID2["BLOCKQUOTE"] = 13] = "BLOCKQUOTE";
  TAG_ID2[TAG_ID2["BODY"] = 14] = "BODY";
  TAG_ID2[TAG_ID2["BR"] = 15] = "BR";
  TAG_ID2[TAG_ID2["BUTTON"] = 16] = "BUTTON";
  TAG_ID2[TAG_ID2["CAPTION"] = 17] = "CAPTION";
  TAG_ID2[TAG_ID2["CENTER"] = 18] = "CENTER";
  TAG_ID2[TAG_ID2["CODE"] = 19] = "CODE";
  TAG_ID2[TAG_ID2["COL"] = 20] = "COL";
  TAG_ID2[TAG_ID2["COLGROUP"] = 21] = "COLGROUP";
  TAG_ID2[TAG_ID2["DD"] = 22] = "DD";
  TAG_ID2[TAG_ID2["DESC"] = 23] = "DESC";
  TAG_ID2[TAG_ID2["DETAILS"] = 24] = "DETAILS";
  TAG_ID2[TAG_ID2["DIALOG"] = 25] = "DIALOG";
  TAG_ID2[TAG_ID2["DIR"] = 26] = "DIR";
  TAG_ID2[TAG_ID2["DIV"] = 27] = "DIV";
  TAG_ID2[TAG_ID2["DL"] = 28] = "DL";
  TAG_ID2[TAG_ID2["DT"] = 29] = "DT";
  TAG_ID2[TAG_ID2["EM"] = 30] = "EM";
  TAG_ID2[TAG_ID2["EMBED"] = 31] = "EMBED";
  TAG_ID2[TAG_ID2["FIELDSET"] = 32] = "FIELDSET";
  TAG_ID2[TAG_ID2["FIGCAPTION"] = 33] = "FIGCAPTION";
  TAG_ID2[TAG_ID2["FIGURE"] = 34] = "FIGURE";
  TAG_ID2[TAG_ID2["FONT"] = 35] = "FONT";
  TAG_ID2[TAG_ID2["FOOTER"] = 36] = "FOOTER";
  TAG_ID2[TAG_ID2["FOREIGN_OBJECT"] = 37] = "FOREIGN_OBJECT";
  TAG_ID2[TAG_ID2["FORM"] = 38] = "FORM";
  TAG_ID2[TAG_ID2["FRAME"] = 39] = "FRAME";
  TAG_ID2[TAG_ID2["FRAMESET"] = 40] = "FRAMESET";
  TAG_ID2[TAG_ID2["H1"] = 41] = "H1";
  TAG_ID2[TAG_ID2["H2"] = 42] = "H2";
  TAG_ID2[TAG_ID2["H3"] = 43] = "H3";
  TAG_ID2[TAG_ID2["H4"] = 44] = "H4";
  TAG_ID2[TAG_ID2["H5"] = 45] = "H5";
  TAG_ID2[TAG_ID2["H6"] = 46] = "H6";
  TAG_ID2[TAG_ID2["HEAD"] = 47] = "HEAD";
  TAG_ID2[TAG_ID2["HEADER"] = 48] = "HEADER";
  TAG_ID2[TAG_ID2["HGROUP"] = 49] = "HGROUP";
  TAG_ID2[TAG_ID2["HR"] = 50] = "HR";
  TAG_ID2[TAG_ID2["HTML"] = 51] = "HTML";
  TAG_ID2[TAG_ID2["I"] = 52] = "I";
  TAG_ID2[TAG_ID2["IMG"] = 53] = "IMG";
  TAG_ID2[TAG_ID2["IMAGE"] = 54] = "IMAGE";
  TAG_ID2[TAG_ID2["INPUT"] = 55] = "INPUT";
  TAG_ID2[TAG_ID2["IFRAME"] = 56] = "IFRAME";
  TAG_ID2[TAG_ID2["KEYGEN"] = 57] = "KEYGEN";
  TAG_ID2[TAG_ID2["LABEL"] = 58] = "LABEL";
  TAG_ID2[TAG_ID2["LI"] = 59] = "LI";
  TAG_ID2[TAG_ID2["LINK"] = 60] = "LINK";
  TAG_ID2[TAG_ID2["LISTING"] = 61] = "LISTING";
  TAG_ID2[TAG_ID2["MAIN"] = 62] = "MAIN";
  TAG_ID2[TAG_ID2["MALIGNMARK"] = 63] = "MALIGNMARK";
  TAG_ID2[TAG_ID2["MARQUEE"] = 64] = "MARQUEE";
  TAG_ID2[TAG_ID2["MATH"] = 65] = "MATH";
  TAG_ID2[TAG_ID2["MENU"] = 66] = "MENU";
  TAG_ID2[TAG_ID2["META"] = 67] = "META";
  TAG_ID2[TAG_ID2["MGLYPH"] = 68] = "MGLYPH";
  TAG_ID2[TAG_ID2["MI"] = 69] = "MI";
  TAG_ID2[TAG_ID2["MO"] = 70] = "MO";
  TAG_ID2[TAG_ID2["MN"] = 71] = "MN";
  TAG_ID2[TAG_ID2["MS"] = 72] = "MS";
  TAG_ID2[TAG_ID2["MTEXT"] = 73] = "MTEXT";
  TAG_ID2[TAG_ID2["NAV"] = 74] = "NAV";
  TAG_ID2[TAG_ID2["NOBR"] = 75] = "NOBR";
  TAG_ID2[TAG_ID2["NOFRAMES"] = 76] = "NOFRAMES";
  TAG_ID2[TAG_ID2["NOEMBED"] = 77] = "NOEMBED";
  TAG_ID2[TAG_ID2["NOSCRIPT"] = 78] = "NOSCRIPT";
  TAG_ID2[TAG_ID2["OBJECT"] = 79] = "OBJECT";
  TAG_ID2[TAG_ID2["OL"] = 80] = "OL";
  TAG_ID2[TAG_ID2["OPTGROUP"] = 81] = "OPTGROUP";
  TAG_ID2[TAG_ID2["OPTION"] = 82] = "OPTION";
  TAG_ID2[TAG_ID2["P"] = 83] = "P";
  TAG_ID2[TAG_ID2["PARAM"] = 84] = "PARAM";
  TAG_ID2[TAG_ID2["PLAINTEXT"] = 85] = "PLAINTEXT";
  TAG_ID2[TAG_ID2["PRE"] = 86] = "PRE";
  TAG_ID2[TAG_ID2["RB"] = 87] = "RB";
  TAG_ID2[TAG_ID2["RP"] = 88] = "RP";
  TAG_ID2[TAG_ID2["RT"] = 89] = "RT";
  TAG_ID2[TAG_ID2["RTC"] = 90] = "RTC";
  TAG_ID2[TAG_ID2["RUBY"] = 91] = "RUBY";
  TAG_ID2[TAG_ID2["S"] = 92] = "S";
  TAG_ID2[TAG_ID2["SCRIPT"] = 93] = "SCRIPT";
  TAG_ID2[TAG_ID2["SEARCH"] = 94] = "SEARCH";
  TAG_ID2[TAG_ID2["SECTION"] = 95] = "SECTION";
  TAG_ID2[TAG_ID2["SELECT"] = 96] = "SELECT";
  TAG_ID2[TAG_ID2["SOURCE"] = 97] = "SOURCE";
  TAG_ID2[TAG_ID2["SMALL"] = 98] = "SMALL";
  TAG_ID2[TAG_ID2["SPAN"] = 99] = "SPAN";
  TAG_ID2[TAG_ID2["STRIKE"] = 100] = "STRIKE";
  TAG_ID2[TAG_ID2["STRONG"] = 101] = "STRONG";
  TAG_ID2[TAG_ID2["STYLE"] = 102] = "STYLE";
  TAG_ID2[TAG_ID2["SUB"] = 103] = "SUB";
  TAG_ID2[TAG_ID2["SUMMARY"] = 104] = "SUMMARY";
  TAG_ID2[TAG_ID2["SUP"] = 105] = "SUP";
  TAG_ID2[TAG_ID2["TABLE"] = 106] = "TABLE";
  TAG_ID2[TAG_ID2["TBODY"] = 107] = "TBODY";
  TAG_ID2[TAG_ID2["TEMPLATE"] = 108] = "TEMPLATE";
  TAG_ID2[TAG_ID2["TEXTAREA"] = 109] = "TEXTAREA";
  TAG_ID2[TAG_ID2["TFOOT"] = 110] = "TFOOT";
  TAG_ID2[TAG_ID2["TD"] = 111] = "TD";
  TAG_ID2[TAG_ID2["TH"] = 112] = "TH";
  TAG_ID2[TAG_ID2["THEAD"] = 113] = "THEAD";
  TAG_ID2[TAG_ID2["TITLE"] = 114] = "TITLE";
  TAG_ID2[TAG_ID2["TR"] = 115] = "TR";
  TAG_ID2[TAG_ID2["TRACK"] = 116] = "TRACK";
  TAG_ID2[TAG_ID2["TT"] = 117] = "TT";
  TAG_ID2[TAG_ID2["U"] = 118] = "U";
  TAG_ID2[TAG_ID2["UL"] = 119] = "UL";
  TAG_ID2[TAG_ID2["SVG"] = 120] = "SVG";
  TAG_ID2[TAG_ID2["VAR"] = 121] = "VAR";
  TAG_ID2[TAG_ID2["WBR"] = 122] = "WBR";
  TAG_ID2[TAG_ID2["XMP"] = 123] = "XMP";
})(TAG_ID || (TAG_ID = {}));
var TAG_NAME_TO_ID = /* @__PURE__ */ new Map([
  [TAG_NAMES.A, TAG_ID.A],
  [TAG_NAMES.ADDRESS, TAG_ID.ADDRESS],
  [TAG_NAMES.ANNOTATION_XML, TAG_ID.ANNOTATION_XML],
  [TAG_NAMES.APPLET, TAG_ID.APPLET],
  [TAG_NAMES.AREA, TAG_ID.AREA],
  [TAG_NAMES.ARTICLE, TAG_ID.ARTICLE],
  [TAG_NAMES.ASIDE, TAG_ID.ASIDE],
  [TAG_NAMES.B, TAG_ID.B],
  [TAG_NAMES.BASE, TAG_ID.BASE],
  [TAG_NAMES.BASEFONT, TAG_ID.BASEFONT],
  [TAG_NAMES.BGSOUND, TAG_ID.BGSOUND],
  [TAG_NAMES.BIG, TAG_ID.BIG],
  [TAG_NAMES.BLOCKQUOTE, TAG_ID.BLOCKQUOTE],
  [TAG_NAMES.BODY, TAG_ID.BODY],
  [TAG_NAMES.BR, TAG_ID.BR],
  [TAG_NAMES.BUTTON, TAG_ID.BUTTON],
  [TAG_NAMES.CAPTION, TAG_ID.CAPTION],
  [TAG_NAMES.CENTER, TAG_ID.CENTER],
  [TAG_NAMES.CODE, TAG_ID.CODE],
  [TAG_NAMES.COL, TAG_ID.COL],
  [TAG_NAMES.COLGROUP, TAG_ID.COLGROUP],
  [TAG_NAMES.DD, TAG_ID.DD],
  [TAG_NAMES.DESC, TAG_ID.DESC],
  [TAG_NAMES.DETAILS, TAG_ID.DETAILS],
  [TAG_NAMES.DIALOG, TAG_ID.DIALOG],
  [TAG_NAMES.DIR, TAG_ID.DIR],
  [TAG_NAMES.DIV, TAG_ID.DIV],
  [TAG_NAMES.DL, TAG_ID.DL],
  [TAG_NAMES.DT, TAG_ID.DT],
  [TAG_NAMES.EM, TAG_ID.EM],
  [TAG_NAMES.EMBED, TAG_ID.EMBED],
  [TAG_NAMES.FIELDSET, TAG_ID.FIELDSET],
  [TAG_NAMES.FIGCAPTION, TAG_ID.FIGCAPTION],
  [TAG_NAMES.FIGURE, TAG_ID.FIGURE],
  [TAG_NAMES.FONT, TAG_ID.FONT],
  [TAG_NAMES.FOOTER, TAG_ID.FOOTER],
  [TAG_NAMES.FOREIGN_OBJECT, TAG_ID.FOREIGN_OBJECT],
  [TAG_NAMES.FORM, TAG_ID.FORM],
  [TAG_NAMES.FRAME, TAG_ID.FRAME],
  [TAG_NAMES.FRAMESET, TAG_ID.FRAMESET],
  [TAG_NAMES.H1, TAG_ID.H1],
  [TAG_NAMES.H2, TAG_ID.H2],
  [TAG_NAMES.H3, TAG_ID.H3],
  [TAG_NAMES.H4, TAG_ID.H4],
  [TAG_NAMES.H5, TAG_ID.H5],
  [TAG_NAMES.H6, TAG_ID.H6],
  [TAG_NAMES.HEAD, TAG_ID.HEAD],
  [TAG_NAMES.HEADER, TAG_ID.HEADER],
  [TAG_NAMES.HGROUP, TAG_ID.HGROUP],
  [TAG_NAMES.HR, TAG_ID.HR],
  [TAG_NAMES.HTML, TAG_ID.HTML],
  [TAG_NAMES.I, TAG_ID.I],
  [TAG_NAMES.IMG, TAG_ID.IMG],
  [TAG_NAMES.IMAGE, TAG_ID.IMAGE],
  [TAG_NAMES.INPUT, TAG_ID.INPUT],
  [TAG_NAMES.IFRAME, TAG_ID.IFRAME],
  [TAG_NAMES.KEYGEN, TAG_ID.KEYGEN],
  [TAG_NAMES.LABEL, TAG_ID.LABEL],
  [TAG_NAMES.LI, TAG_ID.LI],
  [TAG_NAMES.LINK, TAG_ID.LINK],
  [TAG_NAMES.LISTING, TAG_ID.LISTING],
  [TAG_NAMES.MAIN, TAG_ID.MAIN],
  [TAG_NAMES.MALIGNMARK, TAG_ID.MALIGNMARK],
  [TAG_NAMES.MARQUEE, TAG_ID.MARQUEE],
  [TAG_NAMES.MATH, TAG_ID.MATH],
  [TAG_NAMES.MENU, TAG_ID.MENU],
  [TAG_NAMES.META, TAG_ID.META],
  [TAG_NAMES.MGLYPH, TAG_ID.MGLYPH],
  [TAG_NAMES.MI, TAG_ID.MI],
  [TAG_NAMES.MO, TAG_ID.MO],
  [TAG_NAMES.MN, TAG_ID.MN],
  [TAG_NAMES.MS, TAG_ID.MS],
  [TAG_NAMES.MTEXT, TAG_ID.MTEXT],
  [TAG_NAMES.NAV, TAG_ID.NAV],
  [TAG_NAMES.NOBR, TAG_ID.NOBR],
  [TAG_NAMES.NOFRAMES, TAG_ID.NOFRAMES],
  [TAG_NAMES.NOEMBED, TAG_ID.NOEMBED],
  [TAG_NAMES.NOSCRIPT, TAG_ID.NOSCRIPT],
  [TAG_NAMES.OBJECT, TAG_ID.OBJECT],
  [TAG_NAMES.OL, TAG_ID.OL],
  [TAG_NAMES.OPTGROUP, TAG_ID.OPTGROUP],
  [TAG_NAMES.OPTION, TAG_ID.OPTION],
  [TAG_NAMES.P, TAG_ID.P],
  [TAG_NAMES.PARAM, TAG_ID.PARAM],
  [TAG_NAMES.PLAINTEXT, TAG_ID.PLAINTEXT],
  [TAG_NAMES.PRE, TAG_ID.PRE],
  [TAG_NAMES.RB, TAG_ID.RB],
  [TAG_NAMES.RP, TAG_ID.RP],
  [TAG_NAMES.RT, TAG_ID.RT],
  [TAG_NAMES.RTC, TAG_ID.RTC],
  [TAG_NAMES.RUBY, TAG_ID.RUBY],
  [TAG_NAMES.S, TAG_ID.S],
  [TAG_NAMES.SCRIPT, TAG_ID.SCRIPT],
  [TAG_NAMES.SEARCH, TAG_ID.SEARCH],
  [TAG_NAMES.SECTION, TAG_ID.SECTION],
  [TAG_NAMES.SELECT, TAG_ID.SELECT],
  [TAG_NAMES.SOURCE, TAG_ID.SOURCE],
  [TAG_NAMES.SMALL, TAG_ID.SMALL],
  [TAG_NAMES.SPAN, TAG_ID.SPAN],
  [TAG_NAMES.STRIKE, TAG_ID.STRIKE],
  [TAG_NAMES.STRONG, TAG_ID.STRONG],
  [TAG_NAMES.STYLE, TAG_ID.STYLE],
  [TAG_NAMES.SUB, TAG_ID.SUB],
  [TAG_NAMES.SUMMARY, TAG_ID.SUMMARY],
  [TAG_NAMES.SUP, TAG_ID.SUP],
  [TAG_NAMES.TABLE, TAG_ID.TABLE],
  [TAG_NAMES.TBODY, TAG_ID.TBODY],
  [TAG_NAMES.TEMPLATE, TAG_ID.TEMPLATE],
  [TAG_NAMES.TEXTAREA, TAG_ID.TEXTAREA],
  [TAG_NAMES.TFOOT, TAG_ID.TFOOT],
  [TAG_NAMES.TD, TAG_ID.TD],
  [TAG_NAMES.TH, TAG_ID.TH],
  [TAG_NAMES.THEAD, TAG_ID.THEAD],
  [TAG_NAMES.TITLE, TAG_ID.TITLE],
  [TAG_NAMES.TR, TAG_ID.TR],
  [TAG_NAMES.TRACK, TAG_ID.TRACK],
  [TAG_NAMES.TT, TAG_ID.TT],
  [TAG_NAMES.U, TAG_ID.U],
  [TAG_NAMES.UL, TAG_ID.UL],
  [TAG_NAMES.SVG, TAG_ID.SVG],
  [TAG_NAMES.VAR, TAG_ID.VAR],
  [TAG_NAMES.WBR, TAG_ID.WBR],
  [TAG_NAMES.XMP, TAG_ID.XMP]
]);
var $ = TAG_ID;
var SPECIAL_ELEMENTS = {
  [NS.HTML]: /* @__PURE__ */ new Set([
    $.ADDRESS,
    $.APPLET,
    $.AREA,
    $.ARTICLE,
    $.ASIDE,
    $.BASE,
    $.BASEFONT,
    $.BGSOUND,
    $.BLOCKQUOTE,
    $.BODY,
    $.BR,
    $.BUTTON,
    $.CAPTION,
    $.CENTER,
    $.COL,
    $.COLGROUP,
    $.DD,
    $.DETAILS,
    $.DIR,
    $.DIV,
    $.DL,
    $.DT,
    $.EMBED,
    $.FIELDSET,
    $.FIGCAPTION,
    $.FIGURE,
    $.FOOTER,
    $.FORM,
    $.FRAME,
    $.FRAMESET,
    $.H1,
    $.H2,
    $.H3,
    $.H4,
    $.H5,
    $.H6,
    $.HEAD,
    $.HEADER,
    $.HGROUP,
    $.HR,
    $.HTML,
    $.IFRAME,
    $.IMG,
    $.INPUT,
    $.LI,
    $.LINK,
    $.LISTING,
    $.MAIN,
    $.MARQUEE,
    $.MENU,
    $.META,
    $.NAV,
    $.NOEMBED,
    $.NOFRAMES,
    $.NOSCRIPT,
    $.OBJECT,
    $.OL,
    $.P,
    $.PARAM,
    $.PLAINTEXT,
    $.PRE,
    $.SCRIPT,
    $.SECTION,
    $.SELECT,
    $.SOURCE,
    $.STYLE,
    $.SUMMARY,
    $.TABLE,
    $.TBODY,
    $.TD,
    $.TEMPLATE,
    $.TEXTAREA,
    $.TFOOT,
    $.TH,
    $.THEAD,
    $.TITLE,
    $.TR,
    $.TRACK,
    $.UL,
    $.WBR,
    $.XMP
  ]),
  [NS.MATHML]: /* @__PURE__ */ new Set([$.MI, $.MO, $.MN, $.MS, $.MTEXT, $.ANNOTATION_XML]),
  [NS.SVG]: /* @__PURE__ */ new Set([$.TITLE, $.FOREIGN_OBJECT, $.DESC]),
  [NS.XLINK]: /* @__PURE__ */ new Set(),
  [NS.XML]: /* @__PURE__ */ new Set(),
  [NS.XMLNS]: /* @__PURE__ */ new Set()
};
var NUMBERED_HEADERS = /* @__PURE__ */ new Set([$.H1, $.H2, $.H3, $.H4, $.H5, $.H6]);
var UNESCAPED_TEXT = /* @__PURE__ */ new Set([
  TAG_NAMES.STYLE,
  TAG_NAMES.SCRIPT,
  TAG_NAMES.XMP,
  TAG_NAMES.IFRAME,
  TAG_NAMES.NOEMBED,
  TAG_NAMES.NOFRAMES,
  TAG_NAMES.PLAINTEXT
]);

// node_modules/parse5/dist/tokenizer/index.js
var State;
(function(State2) {
  State2[State2["DATA"] = 0] = "DATA";
  State2[State2["RCDATA"] = 1] = "RCDATA";
  State2[State2["RAWTEXT"] = 2] = "RAWTEXT";
  State2[State2["SCRIPT_DATA"] = 3] = "SCRIPT_DATA";
  State2[State2["PLAINTEXT"] = 4] = "PLAINTEXT";
  State2[State2["TAG_OPEN"] = 5] = "TAG_OPEN";
  State2[State2["END_TAG_OPEN"] = 6] = "END_TAG_OPEN";
  State2[State2["TAG_NAME"] = 7] = "TAG_NAME";
  State2[State2["RCDATA_LESS_THAN_SIGN"] = 8] = "RCDATA_LESS_THAN_SIGN";
  State2[State2["RCDATA_END_TAG_OPEN"] = 9] = "RCDATA_END_TAG_OPEN";
  State2[State2["RCDATA_END_TAG_NAME"] = 10] = "RCDATA_END_TAG_NAME";
  State2[State2["RAWTEXT_LESS_THAN_SIGN"] = 11] = "RAWTEXT_LESS_THAN_SIGN";
  State2[State2["RAWTEXT_END_TAG_OPEN"] = 12] = "RAWTEXT_END_TAG_OPEN";
  State2[State2["RAWTEXT_END_TAG_NAME"] = 13] = "RAWTEXT_END_TAG_NAME";
  State2[State2["SCRIPT_DATA_LESS_THAN_SIGN"] = 14] = "SCRIPT_DATA_LESS_THAN_SIGN";
  State2[State2["SCRIPT_DATA_END_TAG_OPEN"] = 15] = "SCRIPT_DATA_END_TAG_OPEN";
  State2[State2["SCRIPT_DATA_END_TAG_NAME"] = 16] = "SCRIPT_DATA_END_TAG_NAME";
  State2[State2["SCRIPT_DATA_ESCAPE_START"] = 17] = "SCRIPT_DATA_ESCAPE_START";
  State2[State2["SCRIPT_DATA_ESCAPE_START_DASH"] = 18] = "SCRIPT_DATA_ESCAPE_START_DASH";
  State2[State2["SCRIPT_DATA_ESCAPED"] = 19] = "SCRIPT_DATA_ESCAPED";
  State2[State2["SCRIPT_DATA_ESCAPED_DASH"] = 20] = "SCRIPT_DATA_ESCAPED_DASH";
  State2[State2["SCRIPT_DATA_ESCAPED_DASH_DASH"] = 21] = "SCRIPT_DATA_ESCAPED_DASH_DASH";
  State2[State2["SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN"] = 22] = "SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN";
  State2[State2["SCRIPT_DATA_ESCAPED_END_TAG_OPEN"] = 23] = "SCRIPT_DATA_ESCAPED_END_TAG_OPEN";
  State2[State2["SCRIPT_DATA_ESCAPED_END_TAG_NAME"] = 24] = "SCRIPT_DATA_ESCAPED_END_TAG_NAME";
  State2[State2["SCRIPT_DATA_DOUBLE_ESCAPE_START"] = 25] = "SCRIPT_DATA_DOUBLE_ESCAPE_START";
  State2[State2["SCRIPT_DATA_DOUBLE_ESCAPED"] = 26] = "SCRIPT_DATA_DOUBLE_ESCAPED";
  State2[State2["SCRIPT_DATA_DOUBLE_ESCAPED_DASH"] = 27] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH";
  State2[State2["SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH"] = 28] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH";
  State2[State2["SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN"] = 29] = "SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN";
  State2[State2["SCRIPT_DATA_DOUBLE_ESCAPE_END"] = 30] = "SCRIPT_DATA_DOUBLE_ESCAPE_END";
  State2[State2["BEFORE_ATTRIBUTE_NAME"] = 31] = "BEFORE_ATTRIBUTE_NAME";
  State2[State2["ATTRIBUTE_NAME"] = 32] = "ATTRIBUTE_NAME";
  State2[State2["AFTER_ATTRIBUTE_NAME"] = 33] = "AFTER_ATTRIBUTE_NAME";
  State2[State2["BEFORE_ATTRIBUTE_VALUE"] = 34] = "BEFORE_ATTRIBUTE_VALUE";
  State2[State2["ATTRIBUTE_VALUE_DOUBLE_QUOTED"] = 35] = "ATTRIBUTE_VALUE_DOUBLE_QUOTED";
  State2[State2["ATTRIBUTE_VALUE_SINGLE_QUOTED"] = 36] = "ATTRIBUTE_VALUE_SINGLE_QUOTED";
  State2[State2["ATTRIBUTE_VALUE_UNQUOTED"] = 37] = "ATTRIBUTE_VALUE_UNQUOTED";
  State2[State2["AFTER_ATTRIBUTE_VALUE_QUOTED"] = 38] = "AFTER_ATTRIBUTE_VALUE_QUOTED";
  State2[State2["SELF_CLOSING_START_TAG"] = 39] = "SELF_CLOSING_START_TAG";
  State2[State2["BOGUS_COMMENT"] = 40] = "BOGUS_COMMENT";
  State2[State2["MARKUP_DECLARATION_OPEN"] = 41] = "MARKUP_DECLARATION_OPEN";
  State2[State2["COMMENT_START"] = 42] = "COMMENT_START";
  State2[State2["COMMENT_START_DASH"] = 43] = "COMMENT_START_DASH";
  State2[State2["COMMENT"] = 44] = "COMMENT";
  State2[State2["COMMENT_LESS_THAN_SIGN"] = 45] = "COMMENT_LESS_THAN_SIGN";
  State2[State2["COMMENT_LESS_THAN_SIGN_BANG"] = 46] = "COMMENT_LESS_THAN_SIGN_BANG";
  State2[State2["COMMENT_LESS_THAN_SIGN_BANG_DASH"] = 47] = "COMMENT_LESS_THAN_SIGN_BANG_DASH";
  State2[State2["COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH"] = 48] = "COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH";
  State2[State2["COMMENT_END_DASH"] = 49] = "COMMENT_END_DASH";
  State2[State2["COMMENT_END"] = 50] = "COMMENT_END";
  State2[State2["COMMENT_END_BANG"] = 51] = "COMMENT_END_BANG";
  State2[State2["DOCTYPE"] = 52] = "DOCTYPE";
  State2[State2["BEFORE_DOCTYPE_NAME"] = 53] = "BEFORE_DOCTYPE_NAME";
  State2[State2["DOCTYPE_NAME"] = 54] = "DOCTYPE_NAME";
  State2[State2["AFTER_DOCTYPE_NAME"] = 55] = "AFTER_DOCTYPE_NAME";
  State2[State2["AFTER_DOCTYPE_PUBLIC_KEYWORD"] = 56] = "AFTER_DOCTYPE_PUBLIC_KEYWORD";
  State2[State2["BEFORE_DOCTYPE_PUBLIC_IDENTIFIER"] = 57] = "BEFORE_DOCTYPE_PUBLIC_IDENTIFIER";
  State2[State2["DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED"] = 58] = "DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED";
  State2[State2["DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED"] = 59] = "DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED";
  State2[State2["AFTER_DOCTYPE_PUBLIC_IDENTIFIER"] = 60] = "AFTER_DOCTYPE_PUBLIC_IDENTIFIER";
  State2[State2["BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS"] = 61] = "BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS";
  State2[State2["AFTER_DOCTYPE_SYSTEM_KEYWORD"] = 62] = "AFTER_DOCTYPE_SYSTEM_KEYWORD";
  State2[State2["BEFORE_DOCTYPE_SYSTEM_IDENTIFIER"] = 63] = "BEFORE_DOCTYPE_SYSTEM_IDENTIFIER";
  State2[State2["DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED"] = 64] = "DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED";
  State2[State2["DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED"] = 65] = "DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED";
  State2[State2["AFTER_DOCTYPE_SYSTEM_IDENTIFIER"] = 66] = "AFTER_DOCTYPE_SYSTEM_IDENTIFIER";
  State2[State2["BOGUS_DOCTYPE"] = 67] = "BOGUS_DOCTYPE";
  State2[State2["CDATA_SECTION"] = 68] = "CDATA_SECTION";
  State2[State2["CDATA_SECTION_BRACKET"] = 69] = "CDATA_SECTION_BRACKET";
  State2[State2["CDATA_SECTION_END"] = 70] = "CDATA_SECTION_END";
  State2[State2["CHARACTER_REFERENCE"] = 71] = "CHARACTER_REFERENCE";
  State2[State2["AMBIGUOUS_AMPERSAND"] = 72] = "AMBIGUOUS_AMPERSAND";
})(State || (State = {}));
var TokenizerMode = {
  DATA: State.DATA,
  RCDATA: State.RCDATA,
  RAWTEXT: State.RAWTEXT,
  SCRIPT_DATA: State.SCRIPT_DATA,
  PLAINTEXT: State.PLAINTEXT,
  CDATA_SECTION: State.CDATA_SECTION
};

// node_modules/parse5/dist/parser/open-element-stack.js
var IMPLICIT_END_TAG_REQUIRED = /* @__PURE__ */ new Set([TAG_ID.DD, TAG_ID.DT, TAG_ID.LI, TAG_ID.OPTGROUP, TAG_ID.OPTION, TAG_ID.P, TAG_ID.RB, TAG_ID.RP, TAG_ID.RT, TAG_ID.RTC]);
var IMPLICIT_END_TAG_REQUIRED_THOROUGHLY = /* @__PURE__ */ new Set([
  ...IMPLICIT_END_TAG_REQUIRED,
  TAG_ID.CAPTION,
  TAG_ID.COLGROUP,
  TAG_ID.TBODY,
  TAG_ID.TD,
  TAG_ID.TFOOT,
  TAG_ID.TH,
  TAG_ID.THEAD,
  TAG_ID.TR
]);
var SCOPING_ELEMENTS_HTML = /* @__PURE__ */ new Set([
  TAG_ID.APPLET,
  TAG_ID.CAPTION,
  TAG_ID.HTML,
  TAG_ID.MARQUEE,
  TAG_ID.OBJECT,
  TAG_ID.TABLE,
  TAG_ID.TD,
  TAG_ID.TEMPLATE,
  TAG_ID.TH
]);
var SCOPING_ELEMENTS_HTML_LIST = /* @__PURE__ */ new Set([...SCOPING_ELEMENTS_HTML, TAG_ID.OL, TAG_ID.UL]);
var SCOPING_ELEMENTS_HTML_BUTTON = /* @__PURE__ */ new Set([...SCOPING_ELEMENTS_HTML, TAG_ID.BUTTON]);
var SCOPING_ELEMENTS_MATHML = /* @__PURE__ */ new Set([TAG_ID.ANNOTATION_XML, TAG_ID.MI, TAG_ID.MN, TAG_ID.MO, TAG_ID.MS, TAG_ID.MTEXT]);
var SCOPING_ELEMENTS_SVG = /* @__PURE__ */ new Set([TAG_ID.DESC, TAG_ID.FOREIGN_OBJECT, TAG_ID.TITLE]);
var TABLE_ROW_CONTEXT = /* @__PURE__ */ new Set([TAG_ID.TR, TAG_ID.TEMPLATE, TAG_ID.HTML]);
var TABLE_BODY_CONTEXT = /* @__PURE__ */ new Set([TAG_ID.TBODY, TAG_ID.TFOOT, TAG_ID.THEAD, TAG_ID.TEMPLATE, TAG_ID.HTML]);
var TABLE_CONTEXT = /* @__PURE__ */ new Set([TAG_ID.TABLE, TAG_ID.TEMPLATE, TAG_ID.HTML]);
var TABLE_CELLS = /* @__PURE__ */ new Set([TAG_ID.TD, TAG_ID.TH]);

// node_modules/parse5/dist/parser/formatting-element-list.js
var EntryType;
(function(EntryType2) {
  EntryType2[EntryType2["Marker"] = 0] = "Marker";
  EntryType2[EntryType2["Element"] = 1] = "Element";
})(EntryType || (EntryType = {}));
var MARKER = { type: EntryType.Marker };

// node_modules/parse5/dist/common/doctype.js
var QUIRKS_MODE_PUBLIC_ID_PREFIXES = [
  "+//silmaril//dtd html pro v0r11 19970101//",
  "-//as//dtd html 3.0 aswedit + extensions//",
  "-//advasoft ltd//dtd html 3.0 aswedit + extensions//",
  "-//ietf//dtd html 2.0 level 1//",
  "-//ietf//dtd html 2.0 level 2//",
  "-//ietf//dtd html 2.0 strict level 1//",
  "-//ietf//dtd html 2.0 strict level 2//",
  "-//ietf//dtd html 2.0 strict//",
  "-//ietf//dtd html 2.0//",
  "-//ietf//dtd html 2.1e//",
  "-//ietf//dtd html 3.0//",
  "-//ietf//dtd html 3.2 final//",
  "-//ietf//dtd html 3.2//",
  "-//ietf//dtd html 3//",
  "-//ietf//dtd html level 0//",
  "-//ietf//dtd html level 1//",
  "-//ietf//dtd html level 2//",
  "-//ietf//dtd html level 3//",
  "-//ietf//dtd html strict level 0//",
  "-//ietf//dtd html strict level 1//",
  "-//ietf//dtd html strict level 2//",
  "-//ietf//dtd html strict level 3//",
  "-//ietf//dtd html strict//",
  "-//ietf//dtd html//",
  "-//metrius//dtd metrius presentational//",
  "-//microsoft//dtd internet explorer 2.0 html strict//",
  "-//microsoft//dtd internet explorer 2.0 html//",
  "-//microsoft//dtd internet explorer 2.0 tables//",
  "-//microsoft//dtd internet explorer 3.0 html strict//",
  "-//microsoft//dtd internet explorer 3.0 html//",
  "-//microsoft//dtd internet explorer 3.0 tables//",
  "-//netscape comm. corp.//dtd html//",
  "-//netscape comm. corp.//dtd strict html//",
  "-//o'reilly and associates//dtd html 2.0//",
  "-//o'reilly and associates//dtd html extended 1.0//",
  "-//o'reilly and associates//dtd html extended relaxed 1.0//",
  "-//sq//dtd html 2.0 hotmetal + extensions//",
  "-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//",
  "-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//",
  "-//spyglass//dtd html 2.0 extended//",
  "-//sun microsystems corp.//dtd hotjava html//",
  "-//sun microsystems corp.//dtd hotjava strict html//",
  "-//w3c//dtd html 3 1995-03-24//",
  "-//w3c//dtd html 3.2 draft//",
  "-//w3c//dtd html 3.2 final//",
  "-//w3c//dtd html 3.2//",
  "-//w3c//dtd html 3.2s draft//",
  "-//w3c//dtd html 4.0 frameset//",
  "-//w3c//dtd html 4.0 transitional//",
  "-//w3c//dtd html experimental 19960712//",
  "-//w3c//dtd html experimental 970421//",
  "-//w3c//dtd w3 html//",
  "-//w3o//dtd w3 html 3.0//",
  "-//webtechs//dtd mozilla html 2.0//",
  "-//webtechs//dtd mozilla html//"
];
var QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
  ...QUIRKS_MODE_PUBLIC_ID_PREFIXES,
  "-//w3c//dtd html 4.01 frameset//",
  "-//w3c//dtd html 4.01 transitional//"
];
var LIMITED_QUIRKS_PUBLIC_ID_PREFIXES = ["-//w3c//dtd xhtml 1.0 frameset//", "-//w3c//dtd xhtml 1.0 transitional//"];
var LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
  ...LIMITED_QUIRKS_PUBLIC_ID_PREFIXES,
  "-//w3c//dtd html 4.01 frameset//",
  "-//w3c//dtd html 4.01 transitional//"
];

// node_modules/parse5/dist/common/foreign-content.js
var SVG_ATTRS_ADJUSTMENT_MAP = new Map([
  "attributeName",
  "attributeType",
  "baseFrequency",
  "baseProfile",
  "calcMode",
  "clipPathUnits",
  "diffuseConstant",
  "edgeMode",
  "filterUnits",
  "glyphRef",
  "gradientTransform",
  "gradientUnits",
  "kernelMatrix",
  "kernelUnitLength",
  "keyPoints",
  "keySplines",
  "keyTimes",
  "lengthAdjust",
  "limitingConeAngle",
  "markerHeight",
  "markerUnits",
  "markerWidth",
  "maskContentUnits",
  "maskUnits",
  "numOctaves",
  "pathLength",
  "patternContentUnits",
  "patternTransform",
  "patternUnits",
  "pointsAtX",
  "pointsAtY",
  "pointsAtZ",
  "preserveAlpha",
  "preserveAspectRatio",
  "primitiveUnits",
  "refX",
  "refY",
  "repeatCount",
  "repeatDur",
  "requiredExtensions",
  "requiredFeatures",
  "specularConstant",
  "specularExponent",
  "spreadMethod",
  "startOffset",
  "stdDeviation",
  "stitchTiles",
  "surfaceScale",
  "systemLanguage",
  "tableValues",
  "targetX",
  "targetY",
  "textLength",
  "viewBox",
  "viewTarget",
  "xChannelSelector",
  "yChannelSelector",
  "zoomAndPan"
].map((attr) => [attr.toLowerCase(), attr]));
var XML_ATTRS_ADJUSTMENT_MAP = /* @__PURE__ */ new Map([
  ["xlink:actuate", { prefix: "xlink", name: "actuate", namespace: NS.XLINK }],
  ["xlink:arcrole", { prefix: "xlink", name: "arcrole", namespace: NS.XLINK }],
  ["xlink:href", { prefix: "xlink", name: "href", namespace: NS.XLINK }],
  ["xlink:role", { prefix: "xlink", name: "role", namespace: NS.XLINK }],
  ["xlink:show", { prefix: "xlink", name: "show", namespace: NS.XLINK }],
  ["xlink:title", { prefix: "xlink", name: "title", namespace: NS.XLINK }],
  ["xlink:type", { prefix: "xlink", name: "type", namespace: NS.XLINK }],
  ["xml:lang", { prefix: "xml", name: "lang", namespace: NS.XML }],
  ["xml:space", { prefix: "xml", name: "space", namespace: NS.XML }],
  ["xmlns", { prefix: "", name: "xmlns", namespace: NS.XMLNS }],
  ["xmlns:xlink", { prefix: "xmlns", name: "xlink", namespace: NS.XMLNS }]
]);
var SVG_TAG_NAMES_ADJUSTMENT_MAP = new Map([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "clipPath",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "foreignObject",
  "glyphRef",
  "linearGradient",
  "radialGradient",
  "textPath"
].map((tn) => [tn.toLowerCase(), tn]));
var EXITS_FOREIGN_CONTENT = /* @__PURE__ */ new Set([
  TAG_ID.B,
  TAG_ID.BIG,
  TAG_ID.BLOCKQUOTE,
  TAG_ID.BODY,
  TAG_ID.BR,
  TAG_ID.CENTER,
  TAG_ID.CODE,
  TAG_ID.DD,
  TAG_ID.DIV,
  TAG_ID.DL,
  TAG_ID.DT,
  TAG_ID.EM,
  TAG_ID.EMBED,
  TAG_ID.H1,
  TAG_ID.H2,
  TAG_ID.H3,
  TAG_ID.H4,
  TAG_ID.H5,
  TAG_ID.H6,
  TAG_ID.HEAD,
  TAG_ID.HR,
  TAG_ID.I,
  TAG_ID.IMG,
  TAG_ID.LI,
  TAG_ID.LISTING,
  TAG_ID.MENU,
  TAG_ID.META,
  TAG_ID.NOBR,
  TAG_ID.OL,
  TAG_ID.P,
  TAG_ID.PRE,
  TAG_ID.RUBY,
  TAG_ID.S,
  TAG_ID.SMALL,
  TAG_ID.SPAN,
  TAG_ID.STRONG,
  TAG_ID.STRIKE,
  TAG_ID.SUB,
  TAG_ID.SUP,
  TAG_ID.TABLE,
  TAG_ID.TT,
  TAG_ID.U,
  TAG_ID.UL,
  TAG_ID.VAR
]);

// node_modules/parse5/dist/parser/index.js
var InsertionMode;
(function(InsertionMode2) {
  InsertionMode2[InsertionMode2["INITIAL"] = 0] = "INITIAL";
  InsertionMode2[InsertionMode2["BEFORE_HTML"] = 1] = "BEFORE_HTML";
  InsertionMode2[InsertionMode2["BEFORE_HEAD"] = 2] = "BEFORE_HEAD";
  InsertionMode2[InsertionMode2["IN_HEAD"] = 3] = "IN_HEAD";
  InsertionMode2[InsertionMode2["IN_HEAD_NO_SCRIPT"] = 4] = "IN_HEAD_NO_SCRIPT";
  InsertionMode2[InsertionMode2["AFTER_HEAD"] = 5] = "AFTER_HEAD";
  InsertionMode2[InsertionMode2["IN_BODY"] = 6] = "IN_BODY";
  InsertionMode2[InsertionMode2["TEXT"] = 7] = "TEXT";
  InsertionMode2[InsertionMode2["IN_TABLE"] = 8] = "IN_TABLE";
  InsertionMode2[InsertionMode2["IN_TABLE_TEXT"] = 9] = "IN_TABLE_TEXT";
  InsertionMode2[InsertionMode2["IN_CAPTION"] = 10] = "IN_CAPTION";
  InsertionMode2[InsertionMode2["IN_COLUMN_GROUP"] = 11] = "IN_COLUMN_GROUP";
  InsertionMode2[InsertionMode2["IN_TABLE_BODY"] = 12] = "IN_TABLE_BODY";
  InsertionMode2[InsertionMode2["IN_ROW"] = 13] = "IN_ROW";
  InsertionMode2[InsertionMode2["IN_CELL"] = 14] = "IN_CELL";
  InsertionMode2[InsertionMode2["IN_SELECT"] = 15] = "IN_SELECT";
  InsertionMode2[InsertionMode2["IN_SELECT_IN_TABLE"] = 16] = "IN_SELECT_IN_TABLE";
  InsertionMode2[InsertionMode2["IN_TEMPLATE"] = 17] = "IN_TEMPLATE";
  InsertionMode2[InsertionMode2["AFTER_BODY"] = 18] = "AFTER_BODY";
  InsertionMode2[InsertionMode2["IN_FRAMESET"] = 19] = "IN_FRAMESET";
  InsertionMode2[InsertionMode2["AFTER_FRAMESET"] = 20] = "AFTER_FRAMESET";
  InsertionMode2[InsertionMode2["AFTER_AFTER_BODY"] = 21] = "AFTER_AFTER_BODY";
  InsertionMode2[InsertionMode2["AFTER_AFTER_FRAMESET"] = 22] = "AFTER_AFTER_FRAMESET";
})(InsertionMode || (InsertionMode = {}));
var TABLE_STRUCTURE_TAGS = /* @__PURE__ */ new Set([TAG_ID.TABLE, TAG_ID.TBODY, TAG_ID.TFOOT, TAG_ID.THEAD, TAG_ID.TR]);
var TABLE_VOID_ELEMENTS = /* @__PURE__ */ new Set([TAG_ID.CAPTION, TAG_ID.COL, TAG_ID.COLGROUP, TAG_ID.TBODY, TAG_ID.TD, TAG_ID.TFOOT, TAG_ID.TH, TAG_ID.THEAD, TAG_ID.TR]);

// node_modules/parse5/dist/serializer/index.js
var VOID_ELEMENTS = /* @__PURE__ */ new Set([
  TAG_NAMES.AREA,
  TAG_NAMES.BASE,
  TAG_NAMES.BASEFONT,
  TAG_NAMES.BGSOUND,
  TAG_NAMES.BR,
  TAG_NAMES.COL,
  TAG_NAMES.EMBED,
  TAG_NAMES.FRAME,
  TAG_NAMES.HR,
  TAG_NAMES.IMG,
  TAG_NAMES.INPUT,
  TAG_NAMES.KEYGEN,
  TAG_NAMES.LINK,
  TAG_NAMES.META,
  TAG_NAMES.PARAM,
  TAG_NAMES.SOURCE,
  TAG_NAMES.TRACK,
  TAG_NAMES.WBR
]);

// packages/design/lib/design/context.mjs
var reviewDigest = (value) => createHash2("sha256").update(canonicalizeJson(value)).digest("hex");
function emptyReviewContext(document) {
  return {
    kind: "openplanr-design-review-context",
    schemaVersion: "1.0.0",
    designId: document.id,
    brief: { purpose: "", requests: [] },
    implementation: { tokens: [], components: [], responsive: [], accessibility: [] }
  };
}

// packages/design/lib/design/document-state.mjs
import { createHash as createHash3, randomUUID } from "node:crypto";
import {
  closeSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync as readFileSync2,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname as dirname2, join as join2, resolve } from "node:path";

// packages/artifact/lib/artifact/internal/server-util.mjs
function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === "EPERM";
  }
}

// packages/design/lib/design/document-state.mjs
var hash = (value) => createHash3("sha256").update(value).digest("hex");
var json = (value) => `${JSON.stringify(value, null, 2)}
`;
function readJson(path, fallback = void 0) {
  try {
    return JSON.parse(readFileSync2(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== void 0) return fallback;
    throw error;
  }
}
function atomicJson(path, value) {
  atomicBytes(path, json(value));
}
function atomicBytes(path, bytes) {
  mkdirSync(dirname2(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, bytes, { mode: 384, flag: "wx" });
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}
function recoverDesignPublication(root, { ownsRenderLock = false } = {}) {
  const journalPath = join2(root, ".design/publication.json");
  let journal = readJson(journalPath, null);
  if (!journal) return;
  const lockPath = join2(root, ".design/render.lock");
  let recoveryOwner;
  if (!ownsRenderLock) {
    const lock = readJson(lockPath, null);
    if (lock && isProcessAlive(lock.pid)) return;
    if (lock) rmSync(lockPath, { force: true });
    recoveryOwner = randomUUID();
    let descriptor;
    try {
      descriptor = openSync(lockPath, "wx", 384);
      writeFileSync(
        descriptor,
        json({ pid: process.pid, owner: recoveryOwner, createdAt: Date.now() })
      );
    } catch (error) {
      if (error.code === "EEXIST") return;
      throw error;
    } finally {
      if (descriptor !== void 0) closeSync(descriptor);
    }
  }
  try {
    journal = readJson(journalPath, null);
    if (!journal) return;
    const pointer = readJson(join2(root, ".design/current.json"), null);
    const manifestPath = join2(root, "finalized.json");
    if (pointer?.revision === journal.revision) atomicJson(manifestPath, journal.manifest);
    else if ((pointer?.revision ?? null) === journal.previousRevision) {
      if (journal.previousManifest === null) rmSync(manifestPath, { force: true });
      else atomicBytes(manifestPath, Buffer.from(journal.previousManifest, "base64"));
    } else if (pointer?.revision && /^[a-f0-9]{64}$/u.test(pointer.revision)) {
      atomicJson(
        manifestPath,
        readJson(join2(root, ".design/revisions", pointer.revision, "render.json")).manifest
      );
    } else
      throw new Error("Design publication recovery could not identify the committed revision.");
    rmSync(journalPath, { force: true });
  } finally {
    if (recoveryOwner && readJson(lockPath, null)?.owner === recoveryOwner)
      rmSync(lockPath, { force: true });
  }
}
function designSpecPath(root) {
  return /(?:^|\/)output\/feats\/feat-[^/]+\/design$/u.test(root.replaceAll("\\", "/")) ? join2(dirname2(root), "design-spec.md") : join2(root, "design-spec.md");
}
function currentDesign(file, { recoverPublication = true } = {}) {
  const root = realpathSync(dirname2(resolve(file)));
  if (recoverPublication) recoverDesignPublication(root);
  else {
    try {
      lstatSync(join2(root, ".design/publication.json"));
      throw Object.assign(
        new Error(
          "Design publication state is pending or needs recovery. Finish or recover it with the Design utility; repair or restore an invalid .design/publication.json before retrying Plan handoff inspection."
        ),
        { code: "E_DESIGN_PUBLICATION_PENDING", statusCode: 409 }
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const pointer = readJson(join2(root, ".design/current.json"), null);
  if (!pointer || !/^[a-f0-9]{64}$/u.test(pointer.revision))
    throw new Error("Design has no completed render. Run the render utility first.");
  const directory = join2(root, ".design/revisions", pointer.revision);
  const prepared = readJson(join2(directory, "render.json"));
  return {
    ...prepared,
    root,
    directory,
    file: resolve(file),
    verification: readJson(join2(root, ".design/verification", `${pointer.revision}.json`), {
      status: "unverified",
      revision: pointer.revision
    })
  };
}

// packages/design/lib/design/feedback-reader.mjs
import { join as join5 } from "node:path";

// packages/artifact/lib/artifact/import.mjs
import {
  existsSync as existsSync2,
  lstatSync as lstatSync3,
  mkdirSync as mkdirSync3,
  readFileSync as readFileSync4,
  realpathSync as realpathSync2,
  renameSync as renameSync3,
  rmSync as rmSync3,
  statSync as statSync2,
  writeFileSync as writeFileSync3
} from "node:fs";
import { homedir as homedir2 } from "node:os";
import { dirname as dirname3, isAbsolute, join as join4, relative, resolve as resolve3 } from "node:path";

// packages/artifact/lib/artifact/internal/feedback.mjs
var FEEDBACK_FILE = "feedback.json";

// packages/artifact/lib/artifact/internal/planr-home.mjs
import { homedir } from "node:os";
import { join as join3, resolve as resolve2 } from "node:path";
var WARNED = /* @__PURE__ */ Symbol.for("openplanr.home-variable-warning");
function nonBlank(value) {
  return typeof value === "string" && value.trim() ? value : void 0;
}
function warnOnce(message2) {
  if (globalThis[WARNED]) return;
  globalThis[WARNED] = true;
  process.stderr.write(`Warning: ${message2}
`);
}
function homeVariables(env) {
  const home = nonBlank(env.PLANR_HOME);
  const legacy = nonBlank(env.OPENPLANR_HOME);
  if (legacy === void 0) return { home, legacy };
  const legacyHome = join3(legacy, ".planr");
  if (home === void 0) {
    warnOnce(`OPENPLANR_HOME is deprecated; set PLANR_HOME=${legacyHome} instead.`);
    return { home, legacy };
  }
  warnOnce(
    resolve2(home) === resolve2(legacyHome) ? "OPENPLANR_HOME is deprecated and ignored because PLANR_HOME is set; unset OPENPLANR_HOME." : `PLANR_HOME=${home} and OPENPLANR_HOME=${legacy} name different OpenPlanr homes; using PLANR_HOME. OPENPLANR_HOME is deprecated; unset it.`
  );
  return { home, legacy: void 0 };
}
function configuredPlanrHome(env = process.env) {
  const { home, legacy } = homeVariables(env);
  return home ?? (legacy === void 0 ? void 0 : join3(legacy, ".planr"));
}
function planrHome(env = process.env) {
  return configuredPlanrHome(env) ?? join3(homedir(), ".planr");
}

// packages/artifact/lib/artifact/merge.mjs
var ARTIFACT_REVIEW_STATE_VERSION = "1.0.0";
var ARTIFACT_REVIEW_STATE_KIND = "artifact-review-state";
var SHA256_RE2 = /^[a-f0-9]{64}$/;
var ARTIFACT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
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
    for (const reply2 of pin.replies ?? []) {
      if (replyIds.has(reply2.id)) {
        throw new PipelineError(
          ARTIFACT_ERROR_CODES.REVIEW_INVALID,
          "Artifact review contains a duplicate reply ID in one thread."
        );
      }
      replyIds.add(reply2.id);
    }
  }
  return review;
}
function validateReviewLedger(ledger) {
  if (!ledger || typeof ledger !== "object" || Array.isArray(ledger) || ledger.schemaVersion !== ARTIFACT_REVIEW_STATE_VERSION || ledger.kind !== ARTIFACT_REVIEW_STATE_KIND || !ARTIFACT_ID_RE.test(ledger.artifactId ?? "") || !SHA256_RE2.test(ledger.currentReviewOf ?? "") || !Array.isArray(ledger.reviews)) {
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_INVALID,
      "Artifact review state is not a valid versioned review ledger."
    );
  }
  const ids2 = /* @__PURE__ */ new Set();
  for (const entry of ledger.reviews) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.stale !== "boolean" || !entry.review) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.REVIEW_INVALID,
        "Artifact review ledger entry is invalid."
      );
    }
    validateArtifactReview(entry.review);
    assertUniqueReviewItemIds(entry.review);
    if (ids2.has(entry.review.reviewId)) {
      throw new PipelineError(
        ARTIFACT_ERROR_CODES.REVIEW_INVALID,
        "Artifact review ledger IDs must be unique."
      );
    }
    ids2.add(entry.review.reviewId);
  }
  return ledger;
}

// packages/artifact/lib/artifact/review.mjs
import {
  existsSync,
  lstatSync as lstatSync2,
  mkdirSync as mkdirSync2,
  readFileSync as readFileSync3,
  renameSync as renameSync2,
  rmSync as rmSync2,
  statSync,
  writeFileSync as writeFileSync2
} from "node:fs";
var ARTIFACT_REVIEW_MAX_STATE_BYTES = 5 * 1024 * 1024;
function finalEntry(path, fs = { lstatSync: lstatSync2 }) {
  try {
    return fs.lstatSync(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
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
    return validateReviewLedger(JSON.parse(readFileSync3(path, "utf8")));
  } catch (error) {
    if (error instanceof PipelineError) throw error;
    throw new PipelineError(
      ARTIFACT_ERROR_CODES.REVIEW_INVALID,
      "Artifact review state is malformed."
    );
  }
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
function pathEntry(path, fs = { lstatSync: lstatSync3 }) {
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
  const path = join4(root, ".planr", "config.json");
  if (!existsSync2(path)) return false;
  try {
    if (lstatSync3(path).isSymbolicLink()) return false;
    const value = JSON.parse(readFileSync4(path, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value) && (typeof value.projectName === "string" && value.projectName.trim() !== "" || value.idPrefix && typeof value.idPrefix === "object" && !Array.isArray(value.idPrefix) && Object.keys(value.idPrefix).length > 0);
  } catch {
    return false;
  }
}
function hasGitMarker(root) {
  const marker = join4(root, ".git");
  if (!existsSync2(marker)) return false;
  try {
    const stat = lstatSync3(marker);
    if (stat.isSymbolicLink()) return false;
    if (stat.isDirectory()) {
      const head = join4(marker, "HEAD");
      return existsSync2(head) && lstatSync3(head).isFile();
    }
    if (!stat.isFile() || stat.size > 4096) return false;
    const match = /^gitdir:\s*(.+?)\s*$/u.exec(readFileSync4(marker, "utf8"));
    if (!match) return false;
    const gitDir = resolve3(root, match[1]);
    return existsSync2(gitDir) && statSync2(gitDir).isDirectory() && existsSync2(join4(gitDir, "HEAD")) && lstatSync3(join4(gitDir, "HEAD")).isFile();
  } catch {
    return false;
  }
}
function findArtifactProjectRoot(start = process.cwd(), { env = process.env } = {}) {
  let current;
  try {
    current = realpathSync2(resolve3(start));
  } catch {
    pathError(
      ARTIFACT_ERROR_CODES.REVIEW_IMPORT,
      "Artifact review working directory does not exist."
    );
  }
  const homeCandidate = resolve3(env.HOME ?? homedir2());
  let home = homeCandidate;
  try {
    home = realpathSync2(homeCandidate);
  } catch {
  }
  while (true) {
    if (current !== home && (parseablePlanrConfig(current) || hasGitMarker(current)))
      return current;
    const parent = dirname3(current);
    if (parent === current) return null;
    current = parent;
  }
}
function assertSafeDestination(base, relativeParts) {
  const absoluteBase = resolve3(base);
  if (existsSync2(absoluteBase) && lstatSync3(absoluteBase).isSymbolicLink()) {
    pathError(
      ARTIFACT_ERROR_CODES.SYMLINK_ESCAPE,
      "Artifact review destination base is a symlink."
    );
  }
  let realBase = absoluteBase;
  if (existsSync2(absoluteBase)) realBase = realpathSync2(absoluteBase);
  let current = absoluteBase;
  for (const part of relativeParts) {
    if (!part || part === "." || part === ".." || part.includes("/") || part.includes("\\") || part.includes("\0")) {
      pathError(
        ARTIFACT_ERROR_CODES.PATH_TRAVERSAL,
        "Artifact review destination contains an unsafe segment."
      );
    }
    current = join4(current, part);
    const entry = pathEntry(current);
    if (!entry) continue;
    if (entry.isSymbolicLink()) {
      pathError(
        ARTIFACT_ERROR_CODES.SYMLINK_ESCAPE,
        "Artifact review destination contains a symlink."
      );
    }
    if (!inside(realBase, realpathSync2(current))) {
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
    const lexical = resolve3(designDir);
    if (!existsSync2(lexical) || !statSync2(lexical).isDirectory()) {
      pathError(ARTIFACT_ERROR_CODES.REVIEW_IMPORT, "Design review destination does not exist.");
    }
    if (lstatSync3(lexical).isSymbolicLink()) {
      pathError(
        ARTIFACT_ERROR_CODES.SYMLINK_ESCAPE,
        "Design review destination must be a real directory."
      );
    }
    const requested = realpathSync2(lexical);
    return Object.freeze({
      kind: "design",
      artifactId,
      directory: requested,
      path: join4(requested, FEEDBACK_FILE),
      reviewStatePath: join4(requested, "artifact-review-state.json")
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
      path: join4(directory2, "review-state.json")
    });
  }
  const root = resolve3(planrHome(env));
  const directory = assertSafeDestination(root, ["artifacts", artifactId]);
  return Object.freeze({
    kind: "user",
    artifactId,
    root,
    directory,
    path: join4(directory, "review-state.json")
  });
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
  const digest8 = digestArtifactEnvelope(current.envelope);
  const pins = (ledger?.reviews ?? []).flatMap(
    (entry) => entry.review.pins.map((pin) => {
      const target = current.entries.find((item3) => item3.artifactId === pin.artifactId);
      const screen = target && current.document.screens.find((item3) => item3.id === target.screenId);
      const anchorMissing = pin.anchor?.planrId && screen?.anchors?.length && !screen.anchors.includes(pin.anchor.planrId) && pin.anchor.planrId !== screen.id;
      return {
        ...pin,
        reviewId: entry.review.reviewId,
        reviewOf: entry.review.reviewOf,
        ...entry.review.reviewId.startsWith("shared-") ? { revisionId: entry.review.reviewId.slice(7) } : {},
        stale: entry.stale || entry.review.reviewOf !== digest8 || !target || Boolean(anchorMissing),
        ...target ? { screenId: target.screenId, variantId: target.variantId } : {}
      };
    })
  );
  return {
    revision: current.revision,
    reviewPath: designReviewPath(file, env, options),
    pins,
    state: readJson(join5(current.root, ".design/studio-state.json"), {
      state: {},
      stateVersion: 0
    }).state,
    ledger,
    shared: readJson(join5(current.root, ".design/shared-feedback.json"), null)
  };
}

// packages/design/lib/design/handoff-format.mjs
var safeMd = (text4) => String(text4).replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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
    for (const item3 of draft.content[key]) {
      lines.push(
        `- ${safeMd(item3.refinement ?? item3.text)} \u2014 ${safeMd(item3.author ?? "Reviewer")}${item3.stale ? " \xB7 original revision" : ""} [source comment](${item3.source})`
      );
      if (item3.refinement) lines.push(`  Original comment: ${safeMd(item3.text)}`);
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
var action = Object.freeze({
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

// packages/design/lib/design/handoff-resolution.mjs
var OUTCOMES = /* @__PURE__ */ new Set(["accepted", "open", "blocking", "deferred", "declined"]);
var CATEGORIES = /* @__PURE__ */ new Set(["question", "suggestion", "change-request", "blocker"]);
var DISPOSITIONS = /* @__PURE__ */ new Set(["accepted", "deferred", "rejected", "declined"]);
var MAX_COMMENTS = 1e4;
var MAX_ISSUES = 1e4;
var digestPattern = /^[a-f0-9]{64}$/u;
var revisionOf = (pin) => pin.revisionId ?? pin.reviewId;
var keyOf = (pin) => `${revisionOf(pin)}:${pin.id}`;
var compare = (left, right) => left.localeCompare(right, "en");
var clone = (value) => {
  assertPlainData(value, "Review resolution data");
  return JSON.parse(canonicalizeJson(value));
};
function issue(code, severity, message2, { pinId, revisionId: revisionId2, recoveryAction } = {}) {
  return {
    code,
    severity,
    message: message2,
    ...revisionId2 ? { revisionId: revisionId2 } : {},
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
  const revisionId2 = revisionOf(pin);
  if (typeof revisionId2 !== "string" || !revisionId2 || revisionId2.length > 160)
    throw new TypeError("Every review comment requires its original revision identity.");
  if (typeof pin.reviewOf !== "string" || !digestPattern.test(pin.reviewOf))
    throw new TypeError("Every review comment requires its original review basis.");
  if (pin.screenId !== void 0 && (typeof pin.screenId !== "string" || !pin.screenId))
    throw new TypeError("Review screen references must be stable identities.");
  if (pin.elementId !== void 0 && (typeof pin.elementId !== "string" || !pin.elementId || !pin.screenId))
    throw new TypeError("Review element references require a stable screen identity.");
}
function scopedMetadata(metadata2, pin, duplicatePinIds, diagnostics) {
  const revisionId2 = revisionOf(pin);
  const scoped2 = metadata2.byRevision?.[revisionId2] ?? {};
  let category = scoped2.categories?.[pin.id];
  let disposition = scoped2.dispositions?.[pin.id];
  if (category === void 0 && Object.hasOwn(metadata2.categories ?? {}, pin.id)) {
    if (duplicatePinIds.has(pin.id))
      diagnostics.push(
        issue(
          "AMBIGUOUS_LEGACY_CATEGORY",
          "blocked",
          "A legacy category cannot be matched to one original revision.",
          { pinId: pin.id, revisionId: revisionId2 }
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
          { pinId: pin.id, revisionId: revisionId2 }
        )
      );
    else disposition = metadata2.dispositions[pin.id];
  }
  if (category !== void 0 && !CATEGORIES.has(category)) {
    diagnostics.push(
      issue("UNKNOWN_CATEGORY", "blocked", "The comment category is not supported.", {
        pinId: pin.id,
        revisionId: revisionId2
      })
    );
    category = void 0;
  }
  const dispositionValue = typeof disposition === "string" ? disposition : disposition?.disposition;
  if (dispositionValue !== void 0 && !DISPOSITIONS.has(dispositionValue)) {
    diagnostics.push(
      issue("UNKNOWN_DISPOSITION", "blocked", "The owner decision is not supported.", {
        pinId: pin.id,
        revisionId: revisionId2
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
  for (const [revisionId2, value] of Object.entries(metadata2.byRevision ?? {}).sort(
    ([left], [right]) => compare(left, right)
  )) {
    for (const field of ["categories", "dispositions"]) {
      for (const pinId of Object.keys(value?.[field] ?? {}).sort(compare)) {
        if (!known.has(`${revisionId2}:${pinId}`))
          diagnostics.push(
            issue(
              "UNKNOWN_COMMENT_METADATA",
              "blocked",
              "Review metadata targets a comment that is not present in the recorded review history.",
              { revisionId: revisionId2, pinId }
            )
          );
      }
    }
  }
}
function compileDesignHandoffResolution(input) {
  const source = clone(input ?? {});
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
  const duplicatePinIds = new Set([...counts].filter(([, count]) => count > 1).map(([id8]) => id8));
  const known = /* @__PURE__ */ new Set();
  for (const pin of pins) {
    const key = keyOf(pin);
    if (known.has(key)) throw new TypeError(`Duplicate review comment identity: ${key}.`);
    known.add(key);
  }
  unknownMetadata(metadata2, known, diagnostics);
  const items = [...pins].sort((left, right) => compare(keyOf(left), keyOf(right))).map((pin) => {
    const revisionId2 = revisionOf(pin);
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
            revisionId: revisionId2,
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
            revisionId: revisionId2,
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
      revisionId: revisionId2,
      reviewOf: pin.reviewOf,
      current,
      category: resolved.category ?? "question",
      outcome,
      implementationScope: current && outcome === "accepted",
      anchor: pin.elementId ? { screenId: pin.screenId, elementId: pin.elementId } : pin.screenId ? { screenId: pin.screenId } : pin.anchor?.planrId ? { planrId: pin.anchor.planrId } : { artifactId: pin.artifactId },
      source: {
        text: pin.comment,
        author: clone(pin.author),
        status: pin.status,
        ...resolved.disposition && typeof resolved.disposition === "object" ? { decision: clone(resolved.disposition) } : {}
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
  const status = severity.has("stale") ? "stale" : severity.has("blocked") ? "blocked" : items.some((item3) => item3.outcome === "open") ? "attention" : "ready";
  return {
    kind: "openplanr-design-handoff-resolution",
    schemaVersion: "1.0.0",
    currentReviewOf: source.currentReviewOf ?? null,
    status,
    complete: source.historyComplete !== false && !["blocked", "stale"].includes(status),
    items,
    implementationScope: items.filter((item3) => item3.implementationScope).map((item3) => item3.id),
    diagnostics
  };
}

// packages/design/lib/design/share-status.mjs
import { existsSync as existsSync4, realpathSync as realpathSync4 } from "node:fs";
import { homedir as homedir3 } from "node:os";
import { dirname as dirname5, isAbsolute as isAbsolute3, join as join7, relative as relative3, resolve as resolve5 } from "node:path";

// packages/artifact/lib/artifact/owner-custody.mjs
import {
  chmodSync,
  closeSync as closeSync2,
  existsSync as existsSync3,
  fsyncSync,
  linkSync,
  lstatSync as lstatSync4,
  mkdirSync as mkdirSync4,
  openSync as openSync2,
  readFileSync as readFileSync5,
  realpathSync as realpathSync3,
  renameSync as renameSync4,
  unlinkSync,
  writeFileSync as writeFileSync4
} from "node:fs";
import { basename, dirname as dirname4, isAbsolute as isAbsolute2, join as join6, relative as relative2, resolve as resolve4 } from "node:path";
function custodyError(message2, code = "E_OWNER_CUSTODY_LOCATION") {
  return Object.assign(new Error(message2), { code, status: 400 });
}
function pathExists(path) {
  try {
    lstatSync4(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
function assertDirectoryAncestry(root, label) {
  for (let path = root; dirname4(path) !== path; path = dirname4(path)) {
    if (pathExists(path) && lstatSync4(path).isSymbolicLink())
      throw custodyError(`${label} custody directory must not contain symbolic links.`);
  }
}
function assertPrivateFile(path, label) {
  const stat = lstatSync4(path);
  if (!stat.isFile() || stat.isSymbolicLink() || process.platform !== "win32" && (stat.mode & 63 || stat.uid !== process.getuid()))
    throw custodyError(
      `${label} owner custody must be a private 0600 file.`,
      "E_OWNER_CUSTODY_INVALID"
    );
}
function assertPrivateDirectory(root, label, recoveryOutput = false) {
  const stat = lstatSync4(root);
  if (!stat.isDirectory() || stat.isSymbolicLink() || !recoveryOutput && process.platform !== "win32" && (stat.mode & 63 || stat.uid !== process.getuid()))
    throw custodyError(`${label} custody must use a private local directory.`);
}
function readCustody(path, { label = "Owner", format, recoveryInput = false } = {}) {
  if (recoveryInput && existsSync3(path)) {
    assertPrivateFile(path, label);
    path = realpathSync3(path);
  }
  assertDirectoryAncestry(dirname4(path), label);
  if (!pathExists(path)) return null;
  assertPrivateDirectory(dirname4(path), label, recoveryInput);
  assertPrivateFile(path, label);
  let record;
  try {
    record = JSON.parse(readFileSync5(path, "utf8"));
  } catch {
    throw custodyError(`${label} owner custody is invalid.`, "E_OWNER_CUSTODY_INVALID");
  }
  if (record?.kind !== format || record.schemaVersion !== "1.0.0" || !record.custody)
    throw custodyError(`${label} owner custody is invalid.`, "E_OWNER_CUSTODY_INVALID");
  return record;
}

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
  const root = resolve5(options.custodyRoot ?? join7(planrHome(env), "design-shares"));
  let project = current.root;
  for (let candidate = current.root; dirname5(candidate) !== candidate; candidate = dirname5(candidate)) {
    if (existsSync4(join7(candidate, ".git")) || existsSync4(join7(candidate, ".planr"))) {
      project = candidate;
      break;
    }
  }
  const key = hash(`${current.root}
${current.document.id}`);
  const path = join7(root, `${key}.json`);
  const within = relative3(project, root);
  if ((!allowMissing || existsSync4(path)) && (within === "" || !within.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && within !== ".." && !isAbsolute3(within)))
    throw new Error(
      "Design owner credentials must be stored outside the project. Set PLANR_HOME to a private user-level directory."
    );
  const legacyPath = !options.custodyRoot && !configuredPlanrHome(env) ? join7(realpathSync4(env.HOME || homedir3()), ".openplanr", "design-shares", `${key}.json`) : null;
  return { root, path, current, legacyPath };
}
function presentationFingerprint(current) {
  const state = readJson(join7(current.root, ".design/studio-state.json"), { state: {} }).state;
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

// packages/design/lib/design/handoff-reader.mjs
var metadataPath = (current) => join8(current.root, ".design/review-metadata.json");
var revisionOf2 = (pin) => pin.revisionId ?? pin.reviewId;
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
function snapshot2(file, env, shareOptions = {}) {
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
function readDesignHandoff(file, { env = process.env, ...shareOptions } = {}) {
  const value = snapshot2(file, env, shareOptions);
  const path = join8(dirname6(designSpecPath(value.current.root)), "review-handoff.json");
  const draft = readJson(path, null);
  if (draft) {
    assertDraft(draft);
    const markdownPath = path.replace(/\.json$/u, ".md");
    if (!existsSync5(markdownPath) || readFileSync6(markdownPath, "utf8") !== draft.markdown)
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

// packages/design/lib/design/plan-handoff-utility.mjs
function inspectPlanDesignHandoff(argv, { stdout = (value) => process.stdout.write(`${JSON.stringify(value)}
`) } = {}) {
  if (argv.length === 0 || ["--help", "help"].includes(argv[0])) {
    const help = {
      usage: "design.mjs handoff <design-document.json> [--action inspect] [--json]",
      note: "Reads the existing handoff and its current approval; never renders, publishes, or starts implementation."
    };
    stdout(help);
    return help;
  }
  const [command, input, ...args] = argv;
  if (command !== "handoff" || !input)
    throw new Error("Usage: design.mjs handoff <design-document.json> [--action inspect] [--json]");
  for (let index2 = 0; index2 < args.length; index2 += 1) {
    if (args[index2] === "--json") continue;
    if (args[index2] === "--action" && args[++index2] === "inspect") continue;
    throw new Error("Plan handoff support only accepts --action inspect and --json.");
  }
  const result = readDesignHandoff(resolve6(input), { recoverPublication: false });
  stdout(result);
  return result;
}
async function main(argv = process.argv.slice(2)) {
  try {
    return inspectPlanDesignHandoff(argv);
  } catch (error) {
    process.stderr.write(`${error.code ? `${error.code}: ` : ""}${error.message}
`);
    process.exitCode = 1;
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync5(process.argv[1]))
  await main();
export {
  inspectPlanDesignHandoff,
  main
};
