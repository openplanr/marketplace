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
var validateNode = (value, schema6, path, errs, context) => {
  if (schema6 === true) return;
  if (schema6 === false) {
    errs.push({ path, rule: "schema:false", detail: "value not allowed" });
    return;
  }
  if (typeof schema6?.$ref === "string") {
    const reference = schema6.$ref;
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
  if (schema6.type !== void 0) {
    const types = Array.isArray(schema6.type) ? schema6.type : [schema6.type];
    if (!types.some((t) => matchesType(value, t))) {
      errs.push({
        path,
        rule: "type",
        detail: `expected ${types.join("|")}, got ${typeOf(value)}`
      });
      return;
    }
  }
  if (schema6.const !== void 0) {
    if (value !== schema6.const) {
      errs.push({
        path,
        rule: "const",
        detail: `expected ${JSON.stringify(schema6.const)}, got ${JSON.stringify(value)}`
      });
    }
  }
  if (Array.isArray(schema6.enum)) {
    if (!schema6.enum.includes(value)) {
      errs.push({
        path,
        rule: "enum",
        detail: `value ${JSON.stringify(value)} not in enum [${schema6.enum.map((x) => JSON.stringify(x)).join(", ")}]`
      });
    }
  }
  if (typeof value === "string") {
    if (typeof schema6.minLength === "number" && value.length < schema6.minLength) {
      errs.push({
        path,
        rule: "minLength",
        detail: `length ${value.length} < ${schema6.minLength}`
      });
    }
    if (typeof schema6.maxLength === "number" && value.length > schema6.maxLength) {
      errs.push({
        path,
        rule: "maxLength",
        detail: `length ${value.length} > ${schema6.maxLength}`
      });
    }
    if (typeof schema6.pattern === "string") {
      try {
        if (!new RegExp(schema6.pattern).test(value)) {
          errs.push({
            path,
            rule: "pattern",
            detail: `value ${JSON.stringify(value)} does not match /${schema6.pattern}/`
          });
        }
      } catch (e) {
        errs.push({
          path,
          rule: "pattern",
          detail: `invalid regex /${schema6.pattern}/: ${e instanceof Error ? e.message : String(e)}`
        });
      }
    }
    if (typeof schema6.format === "string") {
      if (schema6.format === "date" && !FORMAT_DATE.test(value)) {
        errs.push({
          path,
          rule: "format:date",
          detail: `value ${JSON.stringify(value)} is not YYYY-MM-DD`
        });
      } else if (schema6.format === "date-time" && !FORMAT_DATETIME.test(value)) {
        errs.push({
          path,
          rule: "format:date-time",
          detail: `value ${JSON.stringify(value)} is not ISO 8601 date-time`
        });
      }
    }
  }
  if (typeof value === "number") {
    if (typeof schema6.minimum === "number" && value < schema6.minimum) {
      errs.push({ path, rule: "minimum", detail: `value ${value} < ${schema6.minimum}` });
    }
    if (typeof schema6.maximum === "number" && value > schema6.maximum) {
      errs.push({ path, rule: "maximum", detail: `value ${value} > ${schema6.maximum}` });
    }
  }
  if (Array.isArray(value)) {
    if (typeof schema6.minItems === "number" && value.length < schema6.minItems) {
      errs.push({ path, rule: "minItems", detail: `length ${value.length} < ${schema6.minItems}` });
    }
    if (typeof schema6.maxItems === "number" && value.length > schema6.maxItems) {
      errs.push({ path, rule: "maxItems", detail: `length ${value.length} > ${schema6.maxItems}` });
    }
    const prefixLength = Array.isArray(schema6.prefixItems) ? schema6.prefixItems.length : 0;
    if (prefixLength > 0) {
      for (let i = 0; i < Math.min(value.length, prefixLength); i++) {
        validateNode(value[i], schema6.prefixItems[i], `${path}[${i}]`, errs, context);
      }
    }
    if (schema6.items !== void 0) {
      for (let i = prefixLength; i < value.length; i++) {
        validateNode(value[i], schema6.items, `${path}[${i}]`, errs, context);
      }
    }
    if (schema6.uniqueItems === true) {
      const seen = /* @__PURE__ */ new Set();
      for (const item2 of value) {
        const key = JSON.stringify(item2);
        if (seen.has(key)) {
          errs.push({ path, rule: "uniqueItems", detail: `duplicate item ${key}` });
          break;
        }
        seen.add(key);
      }
    }
    if (schema6.contains !== void 0) {
      let matches = 0;
      for (let index2 = 0; index2 < value.length; index2 += 1) {
        const containedErrors = [];
        validateNode(value[index2], schema6.contains, `${path}[${index2}]`, containedErrors, context);
        if (containedErrors.length === 0) matches += 1;
      }
      const minimum = Number.isSafeInteger(schema6.minContains) ? schema6.minContains : 1;
      const maximum = Number.isSafeInteger(schema6.maxContains) ? schema6.maxContains : null;
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
    if (Array.isArray(schema6.required)) {
      for (const req of schema6.required) {
        if (!Object.hasOwn(value, req)) {
          errs.push({ path, rule: "required", detail: `missing required property '${req}'` });
        }
      }
    }
    const props = schema6.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (!Object.hasOwn(props, k)) {
        if (schema6.additionalProperties === false) {
          errs.push({ path, rule: "additionalProperties", detail: `unknown property '${k}'` });
        } else if (schema6.additionalProperties === true || schema6.additionalProperties !== null && typeof schema6.additionalProperties === "object") {
          validateNode(v, schema6.additionalProperties, `${path}.${k}`, errs, context);
        }
      }
    }
    for (const [k, v] of Object.entries(value)) {
      if (Object.hasOwn(props, k)) validateNode(v, props[k], `${path}.${k}`, errs, context);
    }
  }
  if (Array.isArray(schema6.oneOf)) {
    let matched = 0;
    for (const sub of schema6.oneOf) {
      const e = [];
      validateNode(value, sub, path, e, context);
      if (e.length === 0) matched++;
    }
    if (matched !== 1) {
      const titles = schema6.oneOf.map((s) => s.title || "(unnamed)").join(" | ");
      errs.push({
        path,
        rule: "oneOf",
        detail: `matched ${matched}/${schema6.oneOf.length} branches (expected exactly 1). Branches: ${titles}`
      });
    }
  }
  if (Array.isArray(schema6.anyOf)) {
    let matched = 0;
    for (const sub of schema6.anyOf) {
      const candidateErrors = [];
      validateNode(value, sub, path, candidateErrors, context);
      if (candidateErrors.length === 0) matched += 1;
    }
    if (matched === 0) {
      const titles = schema6.anyOf.map((sub) => sub.title || "(unnamed)").join(" | ");
      errs.push({
        path,
        rule: "anyOf",
        detail: `matched 0/${schema6.anyOf.length} branches (expected at least 1). Branches: ${titles}`
      });
    }
  }
  if (Array.isArray(schema6.allOf)) {
    for (const sub of schema6.allOf) {
      validateNode(value, sub, path, errs, context);
    }
  }
  if (schema6.if !== void 0) {
    const conditionErrors = [];
    validateNode(value, schema6.if, path, conditionErrors, context);
    const branch = conditionErrors.length === 0 ? schema6.then : schema6.else;
    if (branch !== void 0) validateNode(value, branch, path, errs, context);
  }
  if (schema6.not !== void 0) {
    const e = [];
    validateNode(value, schema6.not, path, e, context);
    if (e.length === 0) {
      errs.push({ path, rule: "not", detail: "value matched a forbidden subschema" });
    }
  }
};
var validateJson = (value, schema6, {
  resolveRef,
  base = (
    /** @type {{ $id?: string } | null | undefined} */
    schema6?.$id ?? null
  )
} = {}) => {
  const errs = [];
  validateNode(value, schema6, "$", errs, {
    rootSchema: schema6,
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
var nullable = (schema6) => ({ anyOf: [{ type: "null" }, schema6] });
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

export {
  canonicalizeJson,
  assertPlainData,
  validateJson,
  DESIGN_REVIEW_BUNDLE_SCHEMA,
  LARGE_OBJECT_LIMITS
};
