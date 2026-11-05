// packages/protocol/src/canonical-json.mjs
var hasOwn = (value, key) => Object.hasOwn(value, key);
function assertUnicodeScalarString(value, path) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 55296 && code <= 56319) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 56320 && next <= 57343)) {
        throw new TypeError(`JCS cannot canonicalize a lone high surrogate at ${path}.`);
      }
      index += 1;
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
      for (let index = 0; index < value.length; index += 1) {
        if (!hasOwn(value, index))
          throw new TypeError(`JCS cannot canonicalize a sparse array at ${path}[${index}].`);
        entries2.push(serialize(value[index], `${path}[${index}]`, seen));
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
var SUPPORTED_FORMATS = /* @__PURE__ */ new Set(["date", "date-time"]);
var ANNOTATION_KEYWORDS = [
  "$schema",
  "$id",
  "$defs",
  "$comment",
  "title",
  "description",
  "default",
  "examples",
  "deprecated",
  "readOnly",
  "writeOnly"
];
var VALIDATION_KEYWORDS = [
  "$ref",
  "type",
  "const",
  "enum",
  "minLength",
  "maxLength",
  "pattern",
  "format",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "minItems",
  "maxItems",
  "prefixItems",
  "items",
  "uniqueItems",
  "contains",
  "minContains",
  "maxContains",
  "required",
  "properties",
  "propertyNames",
  "additionalProperties",
  "maxProperties",
  "dependentRequired",
  "unevaluatedProperties",
  "oneOf",
  "anyOf",
  "allOf",
  "if",
  "then",
  "else",
  "not"
];
var KNOWN_KEYWORDS = /* @__PURE__ */ new Set([...ANNOTATION_KEYWORDS, ...VALIDATION_KEYWORDS]);
var TYPE_NAMES = /* @__PURE__ */ new Set(["array", "boolean", "integer", "null", "number", "object", "string"]);
var isSchema = (value) => typeof value === "boolean" || value !== null && typeof value === "object" && !Array.isArray(value);
var isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var isCount = (value) => Number.isSafeInteger(value) && value >= 0;
var isUniqueStrings = (value) => Array.isArray(value) && value.every((item2) => typeof item2 === "string") && new Set(value).size === value.length;
var isSchemaArray = (value) => Array.isArray(value) && value.length > 0 && value.every(isSchema);
var isSchemaMap = (value) => isPlainObject(value) && Object.values(value).every(isSchema);
var compiledPatterns = /* @__PURE__ */ new Map();
var MAX_COMPILED_PATTERNS = 1024;
var tryCompilePattern = (source) => {
  try {
    return new RegExp(source);
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};
var compilePattern = (source) => {
  if (!compiledPatterns.has(source)) {
    if (compiledPatterns.size >= MAX_COMPILED_PATTERNS) compiledPatterns.clear();
    compiledPatterns.set(source, tryCompilePattern(source));
  }
  return compiledPatterns.get(source) ?? null;
};
var describeValue = (value) => {
  const text2 = String(JSON.stringify(value));
  return text2.length > 80 ? `${text2.slice(0, 77)}...` : text2;
};
var KEYWORD_SHAPES = {
  $ref: ["a string", (value) => typeof value === "string"],
  $defs: ["an object of schemas", isSchemaMap],
  type: [
    "a type name or a non-empty array of unique type names",
    (value) => typeof value === "string" && TYPE_NAMES.has(value) || isUniqueStrings(value) && value.length > 0 && value.every((name) => TYPE_NAMES.has(name))
  ],
  enum: ["an array", Array.isArray],
  minLength: ["a non-negative integer", isCount],
  maxLength: ["a non-negative integer", isCount],
  pattern: [
    "a valid regular expression string",
    (value) => typeof value === "string" && compilePattern(value) !== null
  ],
  minimum: ["a finite number", Number.isFinite],
  maximum: ["a finite number", Number.isFinite],
  exclusiveMinimum: ["a finite number", Number.isFinite],
  minItems: ["a non-negative integer", isCount],
  maxItems: ["a non-negative integer", isCount],
  prefixItems: ["a non-empty array of schemas", isSchemaArray],
  items: ["a schema", isSchema],
  uniqueItems: ["a boolean", (value) => typeof value === "boolean"],
  contains: ["a schema", isSchema],
  minContains: ["a non-negative integer", isCount],
  maxContains: ["a non-negative integer", isCount],
  required: ["an array of unique strings", isUniqueStrings],
  properties: ["an object of schemas", isSchemaMap],
  propertyNames: ["a schema", isSchema],
  additionalProperties: ["a schema", isSchema],
  maxProperties: ["a non-negative integer", isCount],
  dependentRequired: [
    "an object of unique string arrays",
    (value) => isPlainObject(value) && Object.values(value).every(isUniqueStrings)
  ],
  unevaluatedProperties: ["a schema", isSchema],
  oneOf: ["a non-empty array of schemas", isSchemaArray],
  anyOf: ["a non-empty array of schemas", isSchemaArray],
  allOf: ["a non-empty array of schemas", isSchemaArray],
  if: ["a schema", isSchema],
  then: ["a schema", isSchema],
  else: ["a schema", isSchema],
  not: ["a schema", isSchema]
};
function resolveJsonPointer(root, reference) {
  if (reference === "#") return root;
  if (!reference.startsWith("#/")) return null;
  return reference.slice(2).split("/").map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~")).reduce((value, part) => value?.[part], root);
}
var wellFormedSchemas = /* @__PURE__ */ new WeakSet();
var isFrozenNode = (schema2) => Object.isFrozen(schema2) && Object.values(schema2).every(Object.isFrozen) && (!isPlainObject(schema2.dependentRequired) || Object.values(schema2.dependentRequired).every(Object.isFrozen));
var checkSchemaNode = (schema2, path, context) => {
  if (wellFormedSchemas.has(schema2) || context.checkedSchemas.has(schema2)) return;
  context.checkedSchemas.add(schema2);
  const errorCount = context.schemaErrors.length;
  for (const keyword of Object.keys(schema2)) {
    if (!KNOWN_KEYWORDS.has(keyword) && !keyword.startsWith("x-")) {
      context.schemaErrors.push({
        path,
        rule: "unsupported-keyword",
        detail: `schema keyword '${keyword}' is not supported by this validator`
      });
    }
  }
  if (Object.hasOwn(schema2, "format") && !SUPPORTED_FORMATS.has(schema2.format)) {
    context.schemaErrors.push({
      path,
      rule: "unsupported-format",
      detail: `schema format ${JSON.stringify(schema2.format)} is not supported by this validator`
    });
  }
  for (const [keyword, [expected, isValid]] of Object.entries(KEYWORD_SHAPES)) {
    if (Object.hasOwn(schema2, keyword) && !isValid(schema2[keyword])) {
      context.schemaErrors.push({
        path,
        rule: "schema",
        detail: `schema keyword '${keyword}' must be ${expected}, got ${describeValue(schema2[keyword])}`
      });
    }
  }
  if (context.schemaErrors.length === errorCount && isFrozenNode(schema2)) {
    wellFormedSchemas.add(schema2);
  }
};
var reportReference = (schema2, path, detail, context) => {
  if (context.reportedReferences.has(schema2)) return;
  context.reportedReferences.add(schema2);
  context.schemaErrors.push({ path, rule: "$ref", detail });
};
var validateNode = (value, schema2, path, errs, context) => {
  const evaluated = /* @__PURE__ */ new Set();
  if (schema2 === true) return evaluated;
  if (schema2 === false) {
    errs.push({ path, rule: "schema:false", detail: "value not allowed" });
    return evaluated;
  }
  if (!isSchema(schema2)) return evaluated;
  checkSchemaNode(schema2, path, context);
  if (typeof schema2?.$ref === "string") {
    const reference = schema2.$ref;
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
    if (!isSchema(resolved)) {
      const detail = resolved === void 0 || resolved === null ? `could not resolve schema reference ${reference}` : `schema reference ${reference} resolved to ${typeOf(resolved)}, not a schema`;
      reportReference(schema2, path, detail, context);
      return evaluated;
    }
    const referenceKey = `${path} ${context.base ?? "<root>"}:${reference}`;
    if (context.referenceStack.includes(referenceKey)) {
      reportReference(schema2, path, `circular schema reference ${reference}`, context);
      return evaluated;
    }
    const referenced = validateNode(value, resolved, path, errs, {
      ...context,
      rootSchema: nextRoot,
      base: resolvedBase,
      referenceStack: [...context.referenceStack, referenceKey]
    });
    for (const key of referenced) evaluated.add(key);
  }
  if (schema2.type !== void 0) {
    const types = Array.isArray(schema2.type) ? schema2.type : [schema2.type];
    if (!types.some((t) => matchesType(value, t))) {
      errs.push({
        path,
        rule: "type",
        detail: `expected ${types.join("|")}, got ${typeOf(value)}`
      });
      return evaluated;
    }
  }
  if (schema2.const !== void 0) {
    if (value !== schema2.const) {
      errs.push({
        path,
        rule: "const",
        detail: `expected ${JSON.stringify(schema2.const)}, got ${JSON.stringify(value)}`
      });
    }
  }
  if (Array.isArray(schema2.enum)) {
    if (!schema2.enum.includes(value)) {
      errs.push({
        path,
        rule: "enum",
        detail: `value ${JSON.stringify(value)} not in enum [${schema2.enum.map((x) => JSON.stringify(x)).join(", ")}]`
      });
    }
  }
  if (typeof value === "string") {
    if (typeof schema2.minLength === "number" && value.length < schema2.minLength) {
      errs.push({
        path,
        rule: "minLength",
        detail: `length ${value.length} < ${schema2.minLength}`
      });
    }
    if (typeof schema2.maxLength === "number" && value.length > schema2.maxLength) {
      errs.push({
        path,
        rule: "maxLength",
        detail: `length ${value.length} > ${schema2.maxLength}`
      });
    }
    const pattern = typeof schema2.pattern === "string" ? compilePattern(schema2.pattern) : null;
    if (pattern && !pattern.test(value)) {
      errs.push({
        path,
        rule: "pattern",
        detail: `value ${JSON.stringify(value)} does not match /${schema2.pattern}/`
      });
    }
    if (typeof schema2.format === "string") {
      if (schema2.format === "date" && !FORMAT_DATE.test(value)) {
        errs.push({
          path,
          rule: "format:date",
          detail: `value ${JSON.stringify(value)} is not YYYY-MM-DD`
        });
      } else if (schema2.format === "date-time" && !FORMAT_DATETIME.test(value)) {
        errs.push({
          path,
          rule: "format:date-time",
          detail: `value ${JSON.stringify(value)} is not ISO 8601 date-time`
        });
      }
    }
  }
  if (typeof value === "number") {
    if (typeof schema2.minimum === "number" && value < schema2.minimum) {
      errs.push({ path, rule: "minimum", detail: `value ${value} < ${schema2.minimum}` });
    }
    if (typeof schema2.maximum === "number" && value > schema2.maximum) {
      errs.push({ path, rule: "maximum", detail: `value ${value} > ${schema2.maximum}` });
    }
    if (typeof schema2.exclusiveMinimum === "number" && value <= schema2.exclusiveMinimum) {
      errs.push({
        path,
        rule: "exclusiveMinimum",
        detail: `value ${value} <= ${schema2.exclusiveMinimum}`
      });
    }
  }
  if (Array.isArray(value)) {
    if (typeof schema2.minItems === "number" && value.length < schema2.minItems) {
      errs.push({ path, rule: "minItems", detail: `length ${value.length} < ${schema2.minItems}` });
    }
    if (typeof schema2.maxItems === "number" && value.length > schema2.maxItems) {
      errs.push({ path, rule: "maxItems", detail: `length ${value.length} > ${schema2.maxItems}` });
    }
    const prefixLength = Array.isArray(schema2.prefixItems) ? schema2.prefixItems.length : 0;
    if (prefixLength > 0) {
      for (let i = 0; i < Math.min(value.length, prefixLength); i++) {
        validateNode(value[i], schema2.prefixItems[i], `${path}[${i}]`, errs, context);
      }
    }
    if (schema2.items !== void 0) {
      for (let i = prefixLength; i < value.length; i++) {
        validateNode(value[i], schema2.items, `${path}[${i}]`, errs, context);
      }
    }
    if (schema2.uniqueItems === true) {
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
    if (schema2.contains !== void 0) {
      let matches = 0;
      for (let index = 0; index < value.length; index += 1) {
        const containedErrors = [];
        validateNode(value[index], schema2.contains, `${path}[${index}]`, containedErrors, context);
        if (containedErrors.length === 0) matches += 1;
      }
      const minimum = Number.isSafeInteger(schema2.minContains) ? schema2.minContains : 1;
      const maximum = Number.isSafeInteger(schema2.maxContains) ? schema2.maxContains : null;
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
    if (Array.isArray(schema2.required)) {
      for (const req of schema2.required) {
        if (!Object.hasOwn(value, req)) {
          errs.push({ path, rule: "required", detail: `missing required property '${req}'` });
        }
      }
    }
    if (typeof schema2.maxProperties === "number" && Object.keys(value).length > schema2.maxProperties) {
      errs.push({
        path,
        rule: "maxProperties",
        detail: `property count ${Object.keys(value).length} > ${schema2.maxProperties}`
      });
    }
    if (schema2.dependentRequired !== null && typeof schema2.dependentRequired === "object") {
      for (const [trigger, dependencies] of Object.entries(schema2.dependentRequired)) {
        if (!Object.hasOwn(value, trigger) || !Array.isArray(dependencies)) continue;
        for (const dependency of dependencies) {
          if (!Object.hasOwn(value, dependency)) {
            errs.push({
              path,
              rule: "dependentRequired",
              detail: `property '${trigger}' requires property '${dependency}'`
            });
          }
        }
      }
    }
    const props = schema2.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (schema2.propertyNames !== void 0)
        validateNode(k, schema2.propertyNames, `${path}.${k}`, errs, context);
      if (Object.hasOwn(props, k)) evaluated.add(k);
      else if (schema2.additionalProperties !== void 0) evaluated.add(k);
      if (!Object.hasOwn(props, k)) {
        if (schema2.additionalProperties === false) {
          errs.push({ path, rule: "additionalProperties", detail: `unknown property '${k}'` });
        } else if (schema2.additionalProperties === true || schema2.additionalProperties !== null && typeof schema2.additionalProperties === "object") {
          validateNode(v, schema2.additionalProperties, `${path}.${k}`, errs, context);
        }
      }
    }
    for (const [k, v] of Object.entries(value)) {
      if (Object.hasOwn(props, k)) validateNode(v, props[k], `${path}.${k}`, errs, context);
    }
  }
  if (Array.isArray(schema2.oneOf)) {
    let matched = 0;
    for (const sub of schema2.oneOf) {
      const e = [];
      const branch = validateNode(value, sub, path, e, context);
      if (e.length === 0) {
        matched++;
        for (const key of branch) evaluated.add(key);
      }
    }
    if (matched !== 1) {
      const titles = schema2.oneOf.map((s) => s.title || "(unnamed)").join(" | ");
      errs.push({
        path,
        rule: "oneOf",
        detail: `matched ${matched}/${schema2.oneOf.length} branches (expected exactly 1). Branches: ${titles}`
      });
    }
  }
  if (Array.isArray(schema2.anyOf)) {
    let matched = 0;
    for (const sub of schema2.anyOf) {
      const candidateErrors = [];
      const branch = validateNode(value, sub, path, candidateErrors, context);
      if (candidateErrors.length === 0) {
        matched += 1;
        for (const key of branch) evaluated.add(key);
      }
    }
    if (matched === 0) {
      const titles = schema2.anyOf.map((sub) => sub.title || "(unnamed)").join(" | ");
      errs.push({
        path,
        rule: "anyOf",
        detail: `matched 0/${schema2.anyOf.length} branches (expected at least 1). Branches: ${titles}`
      });
    }
  }
  if (Array.isArray(schema2.allOf)) {
    for (const sub of schema2.allOf) {
      for (const key of validateNode(value, sub, path, errs, context)) evaluated.add(key);
    }
  }
  if (schema2.if !== void 0) {
    const conditionErrors = [];
    const condition = validateNode(value, schema2.if, path, conditionErrors, context);
    const passed = conditionErrors.length === 0;
    if (passed) for (const key of condition) evaluated.add(key);
    const branch = passed ? schema2.then : schema2.else;
    if (branch !== void 0) {
      const branchErrors = [];
      const branchEvaluated = validateNode(value, branch, path, branchErrors, context);
      errs.push(...branchErrors);
      if (branchErrors.length === 0) for (const key of branchEvaluated) evaluated.add(key);
    }
  }
  if (schema2.not !== void 0) {
    const e = [];
    validateNode(value, schema2.not, path, e, context);
    if (e.length === 0) {
      errs.push({ path, rule: "not", detail: "value matched a forbidden subschema" });
    }
  }
  if (schema2.unevaluatedProperties !== void 0 && value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) {
      if (evaluated.has(k)) continue;
      if (schema2.unevaluatedProperties === false) {
        errs.push({ path, rule: "unevaluatedProperties", detail: `unevaluated property '${k}'` });
      } else {
        validateNode(v, schema2.unevaluatedProperties, `${path}.${k}`, errs, context);
      }
      evaluated.add(k);
    }
  }
  return evaluated;
};
var validateJson = (value, schema2, {
  resolveRef,
  base = (
    /** @type {{ $id?: string } | null | undefined} */
    schema2?.$id ?? null
  )
} = {}) => {
  const errs = [];
  const schemaErrors = [];
  if (!isSchema(schema2)) {
    return [
      {
        path: "$",
        rule: "schema",
        detail: `expected a schema object or boolean, got ${typeOf(schema2)}`
      }
    ];
  }
  validateNode(value, schema2, "$", errs, {
    rootSchema: schema2,
    resolveRef,
    base,
    referenceStack: [],
    schemaErrors,
    checkedSchemas: /* @__PURE__ */ new WeakSet(),
    reportedReferences: /* @__PURE__ */ new WeakSet()
  });
  return [...schemaErrors, ...errs];
};

// packages/protocol/src/design-contracts.mjs
var DESIGN_DOCUMENT_VERSION = "1.0.0";
var freeze = (value) => {
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) freeze(nested);
    Object.freeze(value);
  }
  return value;
};
var FRAME_SCHEMA = {
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
};
var DESIGN_DOCUMENT_V1_SCHEMA = freeze({
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
    frames: FRAME_SCHEMA,
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
var DESIGN_DOCUMENT_V120_SCHEMA = freeze({
  ...DESIGN_DOCUMENT_V1_SCHEMA,
  $id: "https://openplanr.dev/schemas/v1.20.0/design-document.schema.json",
  "x-openplanr-contract": { id: "design-document", version: "1.20.0" },
  properties: {
    .../** @type {Record<string, unknown>} */
    DESIGN_DOCUMENT_V1_SCHEMA.properties,
    frames: {
      ...FRAME_SCHEMA,
      items: {
        ...FRAME_SCHEMA.items,
        properties: {
          ...FRAME_SCHEMA.items.properties,
          height: { anyOf: [{ type: "integer", minimum: 1, maximum: 16384 }, { const: "auto" }] }
        }
      }
    },
    layout: {
      type: "object",
      additionalProperties: false,
      properties: {
        boards: {
          type: "object",
          description: "Keys are screenId, screenId/frameId or screenId/frameId/variantId; each ID must exist in the document.",
          additionalProperties: {
            type: "object",
            additionalProperties: false,
            required: ["x", "y"],
            properties: {
              x: { $ref: "#/$defs/coordinate" },
              y: { $ref: "#/$defs/coordinate" },
              title: { $ref: "#/$defs/text" }
            }
          }
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "x", "y", "text"],
            properties: {
              id: { $ref: "#/$defs/id" },
              x: { $ref: "#/$defs/coordinate" },
              y: { $ref: "#/$defs/coordinate" },
              text: { $ref: "#/$defs/text" },
              maxW: { type: "integer", minimum: 1, maximum: 16384 }
            }
          }
        }
      }
    }
  },
  $defs: {
    .../** @type {Record<string, unknown>} */
    DESIGN_DOCUMENT_V1_SCHEMA.$defs,
    coordinate: { type: "number", minimum: -1e7, maximum: 1e7 }
  }
});
var PROP_TOKEN_SCHEMA = {
  type: "string",
  minLength: 1,
  maxLength: 128,
  pattern: "^[a-z][a-z0-9-]*(?![\\s\\S])"
};
var propTokenPattern = new RegExp(PROP_TOKEN_SCHEMA.pattern, "u");
var currentDocument = (
  /** @type {{ properties: Record<string, unknown>; [key: string]: unknown }} */
  structuredClone(DESIGN_DOCUMENT_V120_SCHEMA)
);
currentDocument.$id = "https://openplanr.dev/schemas/v1.22.0/design-document.schema.json";
currentDocument["x-openplanr-contract"] = { id: "design-document", version: "1.22.0" };
currentDocument.properties.schemaVersion = { enum: ["1.0.0", "1.1.0"] };
var screenSchema = (
  /** @type {{ items: { properties: Record<string, unknown> } }} */
  currentDocument.properties.screens
);
screenSchema.items.properties.props = {
  type: "object",
  propertyNames: PROP_TOKEN_SCHEMA,
  additionalProperties: {
    oneOf: [
      {
        type: "object",
        additionalProperties: false,
        required: ["type", "options", "default"],
        properties: {
          type: { const: "enum" },
          options: {
            type: "array",
            minItems: 1,
            uniqueItems: true,
            items: PROP_TOKEN_SCHEMA
          },
          default: PROP_TOKEN_SCHEMA
        }
      },
      {
        type: "object",
        additionalProperties: false,
        required: ["type", "default"],
        properties: { type: { const: "boolean" }, default: { type: "boolean" } }
      }
    ]
  }
};
var variantSchema = (
  /** @type {{ items: { properties: Record<string, unknown> } }} */
  currentDocument.properties.variants
);
variantSchema.items.properties.props = {
  type: "object",
  propertyNames: { $ref: "#/$defs/id" },
  additionalProperties: {
    type: "object",
    propertyNames: PROP_TOKEN_SCHEMA,
    additionalProperties: { anyOf: [PROP_TOKEN_SCHEMA, { type: "boolean" }] }
  }
};
currentDocument.allOf = [
  {
    if: { properties: { schemaVersion: { const: "1.1.0" } }, required: ["schemaVersion"] },
    else: {
      properties: {
        screens: { items: { not: { required: ["props"] } } },
        variants: { items: { not: { required: ["props"] } } }
      }
    }
  }
];
var DESIGN_DOCUMENT_SCHEMA = freeze(currentDocument);

// packages/protocol/src/design-review-bundle-contracts.mjs
var DESIGN_WORKSPACE_VERSION = "1.0.0";
var designProperties = (
  /** @type {Record<string, { items: { properties: Record<string, unknown>; required: string[] } }>} */
  structuredClone(DESIGN_DOCUMENT_V1_SCHEMA.properties)
);
for (const key of ["kind", "schemaVersion", "brief", "assets", "designSystem"])
  delete designProperties[key];
delete designProperties.screens.items.properties.source;
designProperties.screens.items.required = ["id", "title"];
delete designProperties.variants.items.properties.sources;
var DESIGN_REVIEW_BUNDLE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://openplanr.dev/schemas/v1.9.0/design-review-bundle.schema.json",
  "x-openplanr-contract": { id: "design-review-bundle", version: "1.9.0" },
  type: "object",
  additionalProperties: false,
  properties: {
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
    envelope: {
      type: "object",
      required: ["schemaVersion", "artifacts", "viewer"]
    },
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
      properties: {
        status: { enum: ["verified", "unverified", "failed", "pending"] }
      }
    }
  },
  required: ["kind", "schemaVersion", "design", "envelope", "entries", "revision"],
  $defs: structuredClone(DESIGN_DOCUMENT_V1_SCHEMA.$defs)
};

// packages/protocol/src/review-experience-contracts.mjs
var text = { type: "string", maxLength: 16384 };
var id = { type: "string", minLength: 1, maxLength: 128 };
var digest = { type: "string", pattern: "^[a-f0-9]{64}$" };
var texts = { type: "array", maxItems: 256, items: text };
var closed = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required
});
var list = (items, maxItems = 256) => ({ type: "array", maxItems, items });
var schema = (name, properties, required) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.10.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: "1.10.0" },
  ...closed(properties, required)
});
var DESIGN_REVIEW_CONTEXT_SCHEMA = schema(
  "design-review-context",
  {
    kind: { const: "openplanr-design-review-context" },
    schemaVersion: { const: "1.0.0" },
    designId: id,
    brief: closed({ purpose: text, requests: { ...texts, maxItems: 3 }, audience: text }, [
      "purpose",
      "requests"
    ]),
    revisionSummary: text,
    implementation: closed({
      tokens: list(closed({ name: id, value: text, description: text }, ["name", "value"]), 512),
      components: list(
        closed(
          {
            id,
            name: text,
            screenIds: list(id),
            anchorIds: list(id),
            states: list(closed({ name: id, description: text })),
            notes: text,
            responsive: text,
            accessibility: text
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
var DESIGN_FINGERPRINT_SCHEMA = closed({
  screenId: id,
  variantId: id,
  frameId: id,
  contentDigest: digest,
  guidanceDigest: digest
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
  contextDigest: digest,
  fingerprints: list(DESIGN_FINGERPRINT_SCHEMA)
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
  fingerprints: list(DESIGN_FINGERPRINT_SCHEMA, 4096)
});
var bundleCurrent = (
  /** @type {MutableSchema} */
  structuredClone(bundleV12)
);
bundleCurrent.$id = "https://openplanr.dev/schemas/v1.20.0/design-review-bundle.schema.json";
bundleCurrent["x-openplanr-contract"] = { id: "design-review-bundle", version: "1.20.0" };
bundleCurrent.properties.schemaVersion = { enum: ["1.1.0", "1.2.0"] };
bundleCurrent.properties.envelope = bundleV11.properties.envelope;
bundleCurrent.allOf = [
  {
    if: { properties: { schemaVersion: { const: "1.2.0" } } },
    then: { properties: { envelope: bundleV12.properties.envelope } }
  }
];
var currentDesign = (
  /** @type {MutableSchema} */
  bundleCurrent.properties.design
);
for (const key of ["frames", "layout"])
  currentDesign.properties[key] = /** @type {Record<string, unknown>} */
  DESIGN_DOCUMENT_V120_SCHEMA.properties[key];
bundleCurrent.$defs = structuredClone(DESIGN_DOCUMENT_V120_SCHEMA.$defs);
var currentEntries = (
  /** @type {{ items: { properties: Record<string, unknown> } }} */
  bundleCurrent.properties.entries
);
currentEntries.items.properties.height = { const: "auto" };
var bundleProps = (
  /** @type {MutableSchema} */
  structuredClone(bundleCurrent)
);
bundleProps.$id = "https://openplanr.dev/schemas/v1.22.0/design-review-bundle.schema.json";
bundleProps["x-openplanr-contract"] = { id: "design-review-bundle", version: "1.22.0" };
var propsDesign = (
  /** @type {MutableSchema} */
  bundleProps.properties.design
);
var authoredProperties = (
  /** @type {Record<string, unknown>} */
  DESIGN_DOCUMENT_SCHEMA.properties
);
propsDesign.properties.schemaVersion = authoredProperties.schemaVersion;
for (const key of ["screens", "variants"]) {
  const projected = (
    /** @type {{ items: { properties: Record<string, unknown> } }} */
    propsDesign.properties[key]
  );
  const authored = (
    /** @type {{ items: { properties: Record<string, unknown> } }} */
    authoredProperties[key]
  );
  projected.items.properties.props = authored.items.properties.props;
}
propsDesign.allOf = structuredClone(DESIGN_DOCUMENT_SCHEMA.allOf);
var item = closed(
  {
    pinId: id,
    reviewId: id,
    screenId: id,
    revisionId: id,
    text,
    refinement: text,
    stale: { type: "boolean" },
    author: text,
    reviewOf: digest,
    source: text
  },
  ["pinId", "text"]
);
var DESIGN_HANDOFF_CONTENT_SCHEMA = closed({
  summary: text,
  agreedChanges: list(item, 1e4),
  openQuestions: list(item, 1e4),
  deferred: list(item, 1e4),
  rejected: list(item, 1e4)
});
var DESIGN_HANDOFF_SCHEMA = schema(
  "design-review-handoff",
  {
    kind: { const: "openplanr-design-review-handoff" },
    schemaVersion: { const: "1.0.0" },
    title: text,
    version: { type: "integer", minimum: 1 },
    status: { enum: ["draft", "approved"] },
    basis: closed({
      designId: id,
      sourceRevision: digest,
      contextDigest: digest,
      reviewOf: digest,
      selectedVariant: id,
      feedbackDigest: digest,
      verificationDigest: digest,
      feedbackWatermark: { type: "integer", minimum: 0 }
    }),
    content: DESIGN_HANDOFF_CONTENT_SCHEMA,
    contentHash: digest,
    markdown: { type: "string", maxLength: 2097152 },
    affectedScreens: list(id),
    verificationGaps: texts,
    reviewNotes: list(closed({ reviewId: id, text }), 1e4),
    approval: closed({ contentHash: digest, at: { type: "string", format: "date-time" } })
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
  ...schema(
    "design-review-metadata-payload",
    {
      schemaVersion: { const: "1.0.0" },
      kind: { enum: ["category", "disposition"] },
      author: { ...text, minLength: 1, maxLength: 160 },
      reviewOf: digest,
      pinId: id,
      category: { enum: ["question", "suggestion", "blocker"] },
      disposition: { enum: ["accepted", "deferred", "rejected"] },
      reason: text,
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
function assertReviewExperience(value, contract) {
  const errors = validateJson(value, contract);
  if (errors.length)
    throw new TypeError(
      `Invalid ${contract["x-openplanr-contract"]?.id ?? "review data"}: ${errors.slice(0, 4).map((item2) => `${item2.path} ${item2.detail}`).join("; ")}`
    );
  return value;
}
var REVIEW_EXPERIENCE_SCHEMAS = Object.freeze({
  "design-review-context": DESIGN_REVIEW_CONTEXT_SCHEMA,
  "design-review-bundle": DESIGN_REVIEW_BUNDLE_V11_SCHEMA,
  "design-review-handoff": DESIGN_HANDOFF_SCHEMA,
  "design-review-metadata-payload": DESIGN_REVIEW_METADATA_PAYLOAD_SCHEMA
});

export {
  validateJson,
  canonicalizeJson,
  assertPlainData,
  DESIGN_REVIEW_CONTEXT_SCHEMA,
  DESIGN_HANDOFF_SCHEMA,
  assertReviewExperience
};
