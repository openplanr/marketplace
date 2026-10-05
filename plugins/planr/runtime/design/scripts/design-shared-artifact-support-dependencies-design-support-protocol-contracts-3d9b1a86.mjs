import {
  isProcessAlive
} from "./design-loopback-server.mjs";
import {
  Parser,
  defaultTreeAdapter
} from "./design-parse5-parser.mjs";
import {
  NS,
  TAG_NAMES,
  hasUnescapedText
} from "./design-parse5-tokenizer.mjs";
import {
  MAX_ARTIFACT_HTML_BYTES
} from "./design-shared-artifact-support-protocol-contracts-ea2cd15e.mjs";
import {
  DESIGN_REVIEW_BUNDLE_SCHEMA,
  validateJson
} from "./design-shared-protocol-contracts-31a760fc.mjs";
import {
  canonicalizeJson,
  sha256Hex
} from "./design-shared-protocol-contracts-75a938cc.mjs";

// packages/design/lib/design/document-state.mjs
import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";
var hash = (value) => createHash("sha256").update(value).digest("hex");
var json = (value) => `${JSON.stringify(value, null, 2)}
`;
function readJson(path, fallback = void 0) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== void 0) return fallback;
    throw error;
  }
}
function atomicJson(path, value) {
  atomicBytes(path, json(value));
}
function atomicBytes(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, bytes, { mode: 384, flag: "wx" });
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}
function recoverDesignPublication(root, { ownsRenderLock = false } = {}) {
  const journalPath = join(root, ".design/publication.json");
  let journal = readJson(journalPath, null);
  if (!journal) return;
  const lockPath = join(root, ".design/render.lock");
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
    const pointer = readJson(join(root, ".design/current.json"), null);
    const manifestPath = join(root, "finalized.json");
    if (pointer?.revision === journal.revision) atomicJson(manifestPath, journal.manifest);
    else if ((pointer?.revision ?? null) === journal.previousRevision) {
      if (journal.previousManifest === null) rmSync(manifestPath, { force: true });
      else atomicBytes(manifestPath, Buffer.from(journal.previousManifest, "base64"));
    } else if (pointer?.revision && /^[a-f0-9]{64}$/u.test(pointer.revision)) {
      atomicJson(
        manifestPath,
        readJson(join(root, ".design/revisions", pointer.revision, "render.json")).manifest
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
  return /(?:^|\/)output\/feats\/feat-[^/]+\/design$/u.test(root.replaceAll("\\", "/")) ? join(dirname(root), "design-spec.md") : join(root, "design-spec.md");
}
function currentDesign(file, { recoverPublication = true } = {}) {
  const root = realpathSync(dirname(resolve(file)));
  if (recoverPublication) recoverDesignPublication(root);
  else {
    try {
      lstatSync(join(root, ".design/publication.json"));
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
  const pointer = readJson(join(root, ".design/current.json"), null);
  if (!pointer || !/^[a-f0-9]{64}$/u.test(pointer.revision))
    throw new Error("Design has no completed render. Run the render utility first.");
  const directory = join(root, ".design/revisions", pointer.revision);
  const prepared = readJson(join(directory, "render.json"));
  return {
    ...prepared,
    root,
    directory,
    file: resolve(file),
    verification: readJson(join(root, ".design/verification", `${pointer.revision}.json`), {
      status: "unverified",
      revision: pointer.revision
    })
  };
}

// packages/artifact/lib/artifact/local-document.mjs
import { createHash as createHash2 } from "node:crypto";
import { readFileSync as readFileSync2, realpathSync as realpathSync2, statSync } from "node:fs";
import { dirname as dirname2, extname, isAbsolute, relative, resolve as resolve2 } from "node:path";
import { Script } from "node:vm";

// node_modules/entities/dist/escape.js
var getCodePoint = typeof String.prototype.codePointAt === "function" ? (input, index) => input.codePointAt(index) : (
  // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
  (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index)
);
function getEscaper(regex, map) {
  return function escape(data) {
    let match;
    let lastIndex = 0;
    let result = "";
    while (match = regex.exec(data)) {
      if (lastIndex !== match.index) {
        result += data.substring(lastIndex, match.index);
      }
      result += map.get(match[0].charCodeAt(0));
      lastIndex = match.index + 1;
    }
    return result + data.substring(lastIndex);
  };
}
var escapeAttribute = /* @__PURE__ */ getEscaper(/["&\u00A0]/g, /* @__PURE__ */ new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [160, "&nbsp;"]
]));
var escapeText = /* @__PURE__ */ getEscaper(/[&<>\u00A0]/g, /* @__PURE__ */ new Map([
  [38, "&amp;"],
  [60, "&lt;"],
  [62, "&gt;"],
  [160, "&nbsp;"]
]));

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
function isVoidElement(node, options) {
  return options.treeAdapter.isElementNode(node) && options.treeAdapter.getNamespaceURI(node) === NS.HTML && VOID_ELEMENTS.has(options.treeAdapter.getTagName(node));
}
var defaultOpts = { treeAdapter: defaultTreeAdapter, scriptingEnabled: true };
function serialize(node, options) {
  const opts = { ...defaultOpts, ...options };
  if (isVoidElement(node, opts)) {
    return "";
  }
  return serializeChildNodes(node, opts);
}
function serializeChildNodes(parentNode, options) {
  let html = "";
  const container = options.treeAdapter.isElementNode(parentNode) && options.treeAdapter.getTagName(parentNode) === TAG_NAMES.TEMPLATE && options.treeAdapter.getNamespaceURI(parentNode) === NS.HTML ? options.treeAdapter.getTemplateContent(parentNode) : parentNode;
  const childNodes = options.treeAdapter.getChildNodes(container);
  if (childNodes) {
    for (const currentNode of childNodes) {
      html += serializeNode(currentNode, options);
    }
  }
  return html;
}
function serializeNode(node, options) {
  if (options.treeAdapter.isElementNode(node)) {
    return serializeElement(node, options);
  }
  if (options.treeAdapter.isTextNode(node)) {
    return serializeTextNode(node, options);
  }
  if (options.treeAdapter.isCommentNode(node)) {
    return serializeCommentNode(node, options);
  }
  if (options.treeAdapter.isDocumentTypeNode(node)) {
    return serializeDocumentTypeNode(node, options);
  }
  return "";
}
function serializeElement(node, options) {
  const tn = options.treeAdapter.getTagName(node);
  return `<${tn}${serializeAttributes(node, options)}>${isVoidElement(node, options) ? "" : `${serializeChildNodes(node, options)}</${tn}>`}`;
}
function serializeAttributes(node, { treeAdapter }) {
  let html = "";
  for (const attr2 of treeAdapter.getAttrList(node)) {
    html += " ";
    if (attr2.namespace) {
      switch (attr2.namespace) {
        case NS.XML: {
          html += `xml:${attr2.name}`;
          break;
        }
        case NS.XMLNS: {
          if (attr2.name !== "xmlns") {
            html += "xmlns:";
          }
          html += attr2.name;
          break;
        }
        case NS.XLINK: {
          html += `xlink:${attr2.name}`;
          break;
        }
        default: {
          html += `${attr2.prefix}:${attr2.name}`;
        }
      }
    } else {
      html += attr2.name;
    }
    html += `="${escapeAttribute(attr2.value)}"`;
  }
  return html;
}
function serializeTextNode(node, options) {
  const { treeAdapter } = options;
  const content = treeAdapter.getTextNodeContent(node);
  const parent = treeAdapter.getParentNode(node);
  const parentTn = parent && treeAdapter.isElementNode(parent) && treeAdapter.getTagName(parent);
  return parentTn && treeAdapter.getNamespaceURI(parent) === NS.HTML && hasUnescapedText(parentTn, options.scriptingEnabled) ? content : escapeText(content);
}
function serializeCommentNode(node, { treeAdapter }) {
  return `<!--${treeAdapter.getCommentNodeContent(node)}-->`;
}
function serializeDocumentTypeNode(node, { treeAdapter }) {
  return `<!DOCTYPE ${treeAdapter.getDocumentTypeNodeName(node)}>`;
}

// node_modules/parse5/dist/index.js
function parse(html, options) {
  return Parser.parse(html, options);
}
function parseFragment(fragmentContext, html, options) {
  if (typeof fragmentContext === "string") {
    options = html;
    html = fragmentContext;
    fragmentContext = null;
  }
  const parser = Parser.getFragmentParser(fragmentContext, options);
  parser.tokenizer.write(html, true);
  return parser.getFragment();
}

// packages/artifact/lib/artifact/local-document.mjs
var MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon"
};
var children = (node) => [...node.childNodes ?? [], ...node.content?.childNodes ?? []];
var attr = (node, name) => node.attrs?.find((item2) => item2.name === name);
var text = (node) => children(node).map((item2) => item2.value ?? "").join("");
function setText(node, value) {
  node.childNodes = [{ nodeName: "#text", value, parentNode: node }];
}
function element(name, value) {
  const node = parseFragment(`<${name}></${name}>`).childNodes[0];
  setText(node, value);
  return node;
}
function resolveLocalDocumentFile(root, path, from = root) {
  if (typeof path !== "string" || !path || /^(?:[a-z][a-z\d+.-]*:|\/|\\)/iu.test(path))
    throw new Error(`Expected a local relative asset: ${path}`);
  const candidate = resolve2(from, path);
  const inside = (file) => {
    const r = relative(root, file);
    return r !== ".." && !r.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(r);
  };
  if (!inside(candidate)) throw new Error(`Asset escapes design root: ${path}`);
  const actual = realpathSync2(candidate);
  if (!inside(actual) || !statSync(actual).isFile())
    throw new Error(`Asset is not a contained regular file: ${path}`);
  return actual;
}
function bundleLocalDocument({
  root: inputRoot,
  source,
  sharedStyles = [],
  screenId,
  maxBytes = MAX_ARTIFACT_HTML_BYTES,
  readSource,
  passive = false
}) {
  const root = realpathSync2(inputRoot);
  const files = /* @__PURE__ */ new Map();
  const mediaStack = /* @__PURE__ */ new Set();
  let svgDepth = 0;
  let cssExpansionBytes = 0;
  let cssExpansions = 0;
  let bytes = 0;
  function read(path, from = root) {
    const checked = readSource?.(path, from);
    const file = checked?.file ?? resolveLocalDocumentFile(root, path, from);
    if (!files.has(file)) {
      const value = checked?.value ?? readFileSync2(file);
      bytes += value.length;
      if (bytes > maxBytes || files.size >= 1e3)
        throw new Error("Design source exceeds the local asset budget.");
      files.set(file, value);
    }
    return { file, value: files.get(file) };
  }
  function asset(ref, from) {
    if (/^#/iu.test(ref)) return ref;
    if (/^data:/iu.test(ref)) {
      if (!passive) return ref;
      const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/iu.exec(ref);
      if (!match || !Object.values(MIME).includes(match[1].toLowerCase()))
        throw new Error("Passive design media must be a supported image or font.");
      if (match[1].toLowerCase() !== "image/svg+xml") return ref;
      const svg = match[2] ? Buffer.from(match[3], "base64").toString("utf8") : decodeURIComponent(match[3]);
      return `data:image/svg+xml;base64,${Buffer.from(passiveSvg(svg, from)).toString("base64")}`;
    }
    const fragmentIndex = ref.indexOf("#");
    const fragment = fragmentIndex < 0 ? "" : ref.slice(fragmentIndex);
    const { file, value } = read(fragmentIndex < 0 ? ref : ref.slice(0, fragmentIndex), from);
    if (!MIME[extname(file).toLowerCase()]) throw new Error(`Unsupported local media: ${ref}`);
    let payload = value;
    if (passive && extname(file).toLowerCase() === ".svg") {
      if (mediaStack.has(file) || mediaStack.size >= 16)
        throw new Error("Circular or excessively nested SVG media cannot be published.");
      mediaStack.add(file);
      try {
        payload = Buffer.from(passiveSvg(value.toString("utf8"), dirname2(file)));
      } finally {
        mediaStack.delete(file);
      }
    }
    return `data:${MIME[extname(file).toLowerCase()]};base64,${payload.toString("base64")}${fragment}`;
  }
  function passiveSvg(value, from) {
    if (++svgDepth > 16) throw new Error("Excessively nested SVG media cannot be published.");
    try {
      const fragment = parseFragment(value);
      if (!fragment.childNodes.some((node) => node.tagName === "svg"))
        throw new Error("SVG media must contain an SVG drawing.");
      const queue2 = [...children(fragment)];
      while (queue2.length) {
        const node = queue2.shift();
        if (["script", "foreignObject", "iframe", "object", "embed"].includes(node.tagName)) {
          node.parentNode.childNodes = node.parentNode.childNodes.filter((child) => child !== node);
          continue;
        }
        node.attrs = (node.attrs ?? []).filter((item2) => !/^on/iu.test(item2.name));
        if (node.tagName === "style") setText(node, css(text(node), from));
        for (const item2 of node.attrs) {
          if (item2.name === "style") item2.value = css(item2.value, from);
          if (["href", "src"].includes(item2.name)) item2.value = asset(item2.value, from);
        }
        queue2.unshift(...children(node));
      }
      return serialize(fragment);
    } finally {
      svgDepth--;
    }
  }
  function replaceCss(value, pattern, replacement) {
    const parts = [];
    let offset = 0, outputBytes = 0;
    function append(part) {
      const size = Buffer.byteLength(part);
      outputBytes += size;
      cssExpansionBytes += size;
      if (outputBytes > maxBytes || cssExpansionBytes > maxBytes * 8)
        throw new Error("Stylesheet expansion exceeds the local asset budget.");
      parts.push(part);
    }
    for (const match of value.matchAll(pattern)) {
      append(value.slice(offset, match.index));
      append(replacement(...match));
      offset = match.index + match[0].length;
    }
    append(value.slice(offset));
    return parts.join("");
  }
  function css(value, from, stack = /* @__PURE__ */ new Set()) {
    if (++cssExpansions > 4096)
      throw new Error("Stylesheet expansion complexity exceeds the local asset budget.");
    let result = replaceCss(
      value,
      /@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?\s*([^;]*);/giu,
      (_all, ref, media) => {
        const next = read(ref, from);
        if (stack.has(next.file)) throw new Error(`Circular stylesheet import: ${ref}`);
        const expanded = css(
          next.value.toString("utf8"),
          dirname2(next.file),
          /* @__PURE__ */ new Set([...stack, next.file])
        );
        return media.trim() ? `@media ${media.trim()}{${expanded}}` : expanded;
      }
    );
    if (/@import\b/iu.test(result)) throw new Error("Use quoted local stylesheet imports.");
    result = replaceCss(
      result,
      /url\(\s*(["']?)(.*?)\1\s*\)/giu,
      (_all, _quote, ref) => `url("${asset(ref, from)}")`
    );
    return replaceCss(result, /<\/style/giu, () => "<\\/style");
  }
  function js(value, label) {
    try {
      new Script(value, { filename: label });
    } catch (error) {
      throw new Error(
        `Use compiled, self-contained browser JavaScript in ${label}: ${error.message}`
      );
    }
    return value.replace(/<\/script/giu, "<\\/script");
  }
  const input = read(source.html);
  const document = parse(input.value.toString("utf8"));
  let head, body;
  const deferredScripts = [];
  const queue = [...children(document)];
  while (queue.length) {
    const node = queue.shift();
    if (node.tagName === "head") head = node;
    if (node.tagName === "body") body = node;
    if (["base", "iframe", "frame", "frameset", "object", "embed"].includes(node.tagName))
      throw new Error(
        `Unsupported <${node.tagName}> in a local design. Use local controls and button handlers.`
      );
    if (node.tagName === "meta" && attr(node, "http-equiv")?.value.toLowerCase() === "refresh")
      throw new Error("Design screens cannot redirect.");
    if (node.tagName === "style") setText(node, css(text(node), dirname2(input.file)));
    if (node.tagName === "link" && attr(node, "rel")?.value.toLowerCase().split(/\s+/u).includes("stylesheet")) {
      const linked = read(attr(node, "href")?.value, dirname2(input.file));
      node.tagName = "style";
      node.nodeName = "style";
      node.attrs = [];
      setText(
        node,
        css(linked.value.toString("utf8"), dirname2(linked.file), /* @__PURE__ */ new Set([linked.file]))
      );
    }
    if (node.tagName === "script") {
      const src = attr(node, "src");
      if (passive) {
        if (src) read(src.value, dirname2(input.file));
        node.parentNode.childNodes = node.parentNode.childNodes.filter((child) => child !== node);
        continue;
      }
      const type = attr(node, "type")?.value.trim().toLowerCase();
      if (type === "module")
        throw new Error("Compile module scripts before using them in a portable design.");
      if (!type || /(?:javascript|ecmascript)/u.test(type)) {
        const linked = src ? read(src.value, dirname2(input.file)) : null;
        setText(
          node,
          js(linked ? linked.value.toString("utf8") : text(node), linked?.file ?? input.file)
        );
        if (src && attr(node, "defer")) {
          deferredScripts.push(node);
          node.parentNode.childNodes = node.parentNode.childNodes.filter((child) => child !== node);
        }
        node.attrs = (node.attrs ?? []).filter(
          (item2) => !["src", "async", "defer"].includes(item2.name)
        );
      }
    }
    if (passive) node.attrs = (node.attrs ?? []).filter((item2) => !/^on/iu.test(item2.name));
    for (const item2 of node.attrs ?? []) {
      if (item2.name === "style") item2.value = css(item2.value, dirname2(input.file));
      if (["src", "poster"].includes(item2.name))
        item2.value = asset(item2.value, dirname2(input.file));
      if (item2.name === "srcset")
        throw new Error("Use a local src and responsive CSS for portable design images.");
      if (["action", "formaction", "target", "formtarget"].includes(item2.name) && item2.value.trim())
        throw new Error("Design forms must use local submit handlers without navigation targets.");
      if (item2.name === "href" && !item2.value.startsWith("#")) {
        if (node.tagName === "link" || node.namespaceURI === "http://www.w3.org/2000/svg")
          item2.value = asset(item2.value, dirname2(input.file));
        else if (node.tagName === "a")
          throw new Error('Use data-design-navigate="screen-id" for prototype navigation.');
      }
    }
    queue.unshift(...children(node));
  }
  const prepend = [];
  for (const path of [...sharedStyles, ...source.styles ?? []]) {
    const linked = read(path);
    prepend.push(
      element(
        "style",
        css(linked.value.toString("utf8"), dirname2(linked.file), /* @__PURE__ */ new Set([linked.file]))
      )
    );
  }
  head.childNodes = [...prepend, ...head.childNodes];
  for (const node of prepend) node.parentNode = head;
  for (const path of source.scripts ?? []) {
    const linked = read(path);
    if (passive) continue;
    const node = element("script", js(linked.value.toString("utf8"), path));
    node.parentNode = body;
    body.childNodes.push(node);
  }
  for (const node of deferredScripts) {
    node.parentNode = body;
    body.childNodes.push(node);
  }
  body.attrs.push({ name: "data-planr-screen", value: screenId });
  const html = serialize(document);
  if (Buffer.byteLength(html) > maxBytes)
    throw new Error("Bundled design exceeds the output budget.");
  return {
    html,
    files: [...files.keys()].map((path) => relative(root, path)),
    sourceDigests: Object.fromEntries(
      [...files].map(([path, value]) => [
        relative(root, path),
        createHash2("sha256").update(value).digest("hex")
      ])
    ),
    inputBytes: bytes,
    bytes: Buffer.byteLength(html)
  };
}

// packages/protocol/src/review-experience-contracts.mjs
var text2 = { type: "string", maxLength: 16384 };
var id = { type: "string", minLength: 1, maxLength: 128 };
var digest = { type: "string", pattern: "^[a-f0-9]{64}$" };
var texts = { type: "array", maxItems: 256, items: text2 };
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
    brief: closed({ purpose: text2, requests: { ...texts, maxItems: 3 }, audience: text2 }, [
      "purpose",
      "requests"
    ]),
    revisionSummary: text2,
    implementation: closed({
      tokens: list(closed({ name: id, value: text2, description: text2 }, ["name", "value"]), 512),
      components: list(
        closed(
          {
            id,
            name: text2,
            screenIds: list(id),
            anchorIds: list(id),
            states: list(closed({ name: id, description: text2 })),
            notes: text2,
            responsive: text2,
            accessibility: text2
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
var DESIGN_REVIEW_BUNDLE_V12_SCHEMA = bundleV12;
var item = closed(
  {
    pinId: id,
    reviewId: id,
    screenId: id,
    revisionId: id,
    text: text2,
    refinement: text2,
    stale: { type: "boolean" },
    author: text2,
    reviewOf: digest,
    source: text2
  },
  ["pinId", "text"]
);
var DESIGN_HANDOFF_CONTENT_SCHEMA = closed({
  summary: text2,
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
    title: text2,
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
    reviewNotes: list(closed({ reviewId: id, text: text2 }), 1e4),
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
      author: { ...text2, minLength: 1, maxLength: 160 },
      reviewOf: digest,
      pinId: id,
      category: { enum: ["question", "suggestion", "blocker"] },
      disposition: { enum: ["accepted", "deferred", "rejected"] },
      reason: text2,
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
var DESIGN_REVIEW_METADATA_PAYLOAD_V11_SCHEMA = payloadV11;
function assertReviewExperience(value, contract) {
  const errors = validateJson(value, contract);
  if (errors.length)
    throw new TypeError(
      `Invalid ${contract["x-openplanr-contract"]?.id ?? "review data"}: ${errors.slice(0, 4).map((item2) => `${item2.path} ${item2.detail}`).join("; ")}`
    );
  return value;
}
function assertDesignReviewMetadata(value) {
  return assertReviewExperience(
    value,
    value?.schemaVersion === "1.1.0" ? DESIGN_REVIEW_METADATA_PAYLOAD_V11_SCHEMA : DESIGN_REVIEW_METADATA_PAYLOAD_SCHEMA
  );
}
function assertDesignReviewBundle(value) {
  assertReviewExperience(
    value,
    value?.schemaVersion === "1.2.0" ? DESIGN_REVIEW_BUNDLE_V12_SCHEMA : value?.schemaVersion === "1.1.0" ? DESIGN_REVIEW_BUNDLE_V11_SCHEMA : DESIGN_REVIEW_BUNDLE_SCHEMA
  );
  if (["1.1.0", "1.2.0"].includes(value.schemaVersion)) {
    if (value.reviewContext.designId !== value.design.id || value.contextDigest !== sha256Hex(canonicalizeJson(value.reviewContext)))
      throw new TypeError("Review context identity or digest does not match its published design.");
    const entries = new Set(
      value.entries.map((entry) => `${entry.screenId}:${entry.variantId}:${entry.frameId}`)
    );
    const seen = /* @__PURE__ */ new Set();
    for (const item2 of value.fingerprints) {
      const key = `${item2.screenId}:${item2.variantId}:${item2.frameId}`;
      if (!entries.has(key) || seen.has(key))
        throw new TypeError("Review fingerprints must identify distinct published artboards.");
      seen.add(key);
    }
    if (seen.size && seen.size !== entries.size)
      throw new TypeError("Review fingerprints must cover every published artboard.");
  }
  return value;
}
var REVIEW_EXPERIENCE_SCHEMAS = Object.freeze({
  "design-review-context": DESIGN_REVIEW_CONTEXT_SCHEMA,
  "design-review-bundle": DESIGN_REVIEW_BUNDLE_V11_SCHEMA,
  "design-review-handoff": DESIGN_HANDOFF_SCHEMA,
  "design-review-metadata-payload": DESIGN_REVIEW_METADATA_PAYLOAD_SCHEMA
});

// packages/design/lib/design/context.mjs
import { createHash as createHash3 } from "node:crypto";
import { existsSync, readdirSync, readFileSync as readFileSync3, realpathSync as realpathSync3 } from "node:fs";
import { dirname as dirname3, join as join2, resolve as resolve3 } from "node:path";
var reviewDigest = (value) => createHash3("sha256").update(canonicalizeJson(value)).digest("hex");
function emptyReviewContext(document) {
  return {
    kind: "openplanr-design-review-context",
    schemaVersion: "1.0.0",
    designId: document.id,
    brief: { purpose: "", requests: [] },
    implementation: { tokens: [], components: [], responsive: [], accessibility: [] }
  };
}
function loadReviewContext(root, document, { readSource } = {}) {
  const file = join2(root, "review-context.json");
  if (!existsSync(file)) return emptyReviewContext(document);
  const context = JSON.parse(
    readSource ? readSource("review-context.json", root).value.toString("utf8") : readFileSync3(resolveLocalDocumentFile(root, "review-context.json"), "utf8")
  );
  assertReviewExperience(context, DESIGN_REVIEW_CONTEXT_SCHEMA);
  if (context.designId !== document.id)
    throw new Error("Review context belongs to a different design.");
  const screens = new Set(document.screenOrder);
  const ids = /* @__PURE__ */ new Set();
  for (const component of context.implementation.components) {
    if (ids.has(component.id)) throw new Error("Review component identities must be unique.");
    ids.add(component.id);
    if (component.screenIds?.some((id2) => !screens.has(id2)))
      throw new Error(`Component ${component.id} references an unknown screen.`);
  }
  if (/(?:file:\/\/|\/(?:Users|home|private|tmp|var|etc|opt|Volumes)\/|[A-Za-z]:\\\\|\\\\\\\\)/u.test(
    JSON.stringify(context)
  ))
    throw new Error(
      "Review context contains a local filesystem path. Use share-safe implementation guidance."
    );
  return context;
}
function reviewFingerprints({ document, context, screen, variant, frame, sourceDigests }) {
  const components = context.implementation.components.filter(
    (component) => !component.screenIds?.length || component.screenIds.includes(screen.id)
  );
  return {
    screenId: screen.id,
    variantId: variant.id,
    frameId: frame.id,
    contentDigest: reviewDigest({
      files: Object.entries(sourceDigests).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0),
      width: frame.width,
      height: frame.height
    }),
    guidanceDigest: reviewDigest({
      title: screen.title,
      description: screen.description ?? "",
      anchors: screen.anchors ?? [],
      variant: { label: variant.label, description: variant.description ?? "" },
      frameLabel: frame.label,
      components,
      tokens: context.implementation.tokens,
      responsive: context.implementation.responsive,
      accessibility: context.implementation.accessibility
    })
  };
}
function bundleDesignRevision(current, state = {}) {
  const { document } = current;
  const pick = (value, keys) => Object.fromEntries(
    keys.filter((key) => value?.[key] !== void 0).map((key) => [key, structuredClone(value[key])])
  );
  const context = current.reviewContext ?? emptyReviewContext(document);
  return {
    kind: "openplanr-design-review-bundle",
    schemaVersion: current.envelope.schemaVersion === "1.1.0" ? "1.2.0" : "1.1.0",
    design: {
      ...pick(document, [
        "id",
        "title",
        "defaultView",
        "selectedVariant",
        "screenOrder",
        "frames",
        "flows"
      ]),
      screens: document.screens.map(
        (screen) => pick(screen, ["id", "title", "description", "anchors"])
      ),
      selectedVariant: document.variants.some(
        (variant) => variant.id === state.selectedVariant && variant.status === "ready"
      ) ? state.selectedVariant : document.selectedVariant,
      variants: document.variants.filter((variant) => variant.status === "ready").map((variant) => pick(variant, ["id", "label", "status"]))
    },
    envelope: structuredClone(current.envelope),
    entries: structuredClone(current.entries),
    state: pick(state, ["positions"]),
    revision: current.revision,
    verification: pick(current.verification ?? {}, ["status"]),
    reviewContext: context,
    contextDigest: current.contextDigest ?? reviewDigest(context),
    fingerprints: current.fingerprints ?? []
  };
}
var localRoot = (file) => realpathSync3(dirname3(resolve3(file)));
function listDesignRevisions(file) {
  const root = localRoot(file);
  const pointer = JSON.parse(readFileSync3(join2(root, ".design/current.json"), "utf8"));
  const revisions = readdirSync(join2(root, ".design/revisions")).filter((name) => /^[a-f0-9]{64}$/u.test(name)).map((revision) => {
    const value = JSON.parse(
      readFileSync3(join2(root, ".design/revisions", revision, "render.json"), "utf8")
    );
    return {
      revision,
      createdAt: value.manifest.generated_at,
      summary: value.reviewContext?.revisionSummary ?? "",
      fingerprints: value.fingerprints ?? []
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { revisions, currentRevision: pointer.revision };
}
function readDesignRevision(file, revision) {
  if (!/^[a-f0-9]{64}$/u.test(revision)) throw new Error("Invalid design revision identity.");
  const root = localRoot(file);
  const value = JSON.parse(
    readFileSync3(
      resolveLocalDocumentFile(root, `.design/revisions/${revision}/render.json`),
      "utf8"
    )
  );
  return bundleDesignRevision(value);
}

export {
  serialize,
  parse,
  parseFragment,
  resolveLocalDocumentFile,
  bundleLocalDocument,
  DESIGN_HANDOFF_CONTENT_SCHEMA,
  DESIGN_HANDOFF_SCHEMA,
  assertReviewExperience,
  assertDesignReviewMetadata,
  assertDesignReviewBundle,
  reviewDigest,
  emptyReviewContext,
  loadReviewContext,
  reviewFingerprints,
  bundleDesignRevision,
  listDesignRevisions,
  readDesignRevision,
  hash,
  json,
  readJson,
  atomicJson,
  recoverDesignPublication,
  designSpecPath,
  currentDesign
};
