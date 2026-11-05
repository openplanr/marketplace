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
  MAX_ARTIFACT_HTML_BYTES,
  validateJson
} from "./design-shared-artifact-support-protocol-contracts-9f6918b0.mjs";

// packages/artifact/lib/artifact/local-document.mjs
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
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
var isPropToken = (value) => typeof value === "string" && value.length <= 128 && /^[a-z][a-z0-9-]*(?![\s\S])/u.test(value);
var text = (node) => children(node).map((item2) => item2.value ?? "").join("");
function setText(node, value) {
  node.childNodes = [{ nodeName: "#text", value, parentNode: node }];
}
function element(name, value) {
  const node = parseFragment(`<${name}></${name}>`).childNodes[0];
  setText(node, value);
  return node;
}
function parseBodySource(html) {
  const roots = [];
  const parser = new Parser({ sourceCodeLocationInfo: true });
  const onStartTag = parser.onStartTag.bind(parser);
  parser.onStartTag = (token) => {
    if (token.tagName === "body") roots.push(token);
    onStartTag(token);
  };
  parser.tokenizer.write(html, true);
  const body = parser.document.childNodes.find((node) => node.tagName === "html")?.childNodes.find((node) => node.tagName === "body");
  const root = roots.length === 1 && body?.sourceCodeLocation?.startTag?.startOffset === roots[0].location?.startOffset ? roots[0] : null;
  return { document: parser.document, roots, root };
}
function inspectLocalDocumentBody(html) {
  const { root } = parseBodySource(html);
  return root ? { attrs: root.attrs, location: root.location } : null;
}
function resolveLocalDocumentFile(root, path, from = root) {
  if (typeof path !== "string" || !path || /^(?:[a-z][a-z\d+.-]*:|\/|\\)/iu.test(path))
    throw new Error(`Expected a local relative asset: ${path}`);
  const candidate = resolve(from, path);
  const inside = (file) => {
    const r = relative(root, file);
    return r !== ".." && !r.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(r);
  };
  if (!inside(candidate)) throw new Error(`Asset escapes design root: ${path}`);
  const actual = realpathSync(candidate);
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
  passive = false,
  screenProps
}) {
  const root = realpathSync(inputRoot);
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
      const value = checked?.value ?? readFileSync(file);
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
        payload = Buffer.from(passiveSvg(value.toString("utf8"), dirname(file)));
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
          dirname(next.file),
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
  const propEntries = Object.entries(screenProps ?? {});
  let document;
  if (propEntries.length) {
    const parsed = parseBodySource(input.value.toString("utf8"));
    if (!parsed.root)
      throw new Error(
        `Screen ${screenId} source ${source.html} requires a single authored <body> root for props; found ${parsed.roots.length}.`
      );
    document = parsed.document;
  } else document = parse(input.value.toString("utf8"));
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
    if (node.tagName === "style") setText(node, css(text(node), dirname(input.file)));
    if (node.tagName === "link" && attr(node, "rel")?.value.toLowerCase().split(/\s+/u).includes("stylesheet")) {
      const linked = read(attr(node, "href")?.value, dirname(input.file));
      node.tagName = "style";
      node.nodeName = "style";
      node.attrs = [];
      setText(
        node,
        css(linked.value.toString("utf8"), dirname(linked.file), /* @__PURE__ */ new Set([linked.file]))
      );
    }
    if (node.tagName === "script") {
      const src = attr(node, "src");
      if (passive) {
        if (src) read(src.value, dirname(input.file));
        node.parentNode.childNodes = node.parentNode.childNodes.filter((child) => child !== node);
        continue;
      }
      const type = attr(node, "type")?.value.trim().toLowerCase();
      if (type === "module")
        throw new Error("Compile module scripts before using them in a portable design.");
      if (!type || /(?:javascript|ecmascript)/u.test(type)) {
        const linked = src ? read(src.value, dirname(input.file)) : null;
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
      if (item2.name === "style") item2.value = css(item2.value, dirname(input.file));
      if (["src", "poster"].includes(item2.name))
        item2.value = asset(item2.value, dirname(input.file));
      if (item2.name === "srcset")
        throw new Error("Use a local src and responsive CSS for portable design images.");
      if (["action", "formaction", "target", "formtarget"].includes(item2.name) && item2.value.trim())
        throw new Error("Design forms must use local submit handlers without navigation targets.");
      if (item2.name === "href" && !item2.value.startsWith("#")) {
        if (node.tagName === "link" || node.namespaceURI === "http://www.w3.org/2000/svg")
          item2.value = asset(item2.value, dirname(input.file));
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
        css(linked.value.toString("utf8"), dirname(linked.file), /* @__PURE__ */ new Set([linked.file]))
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
  if (propEntries.length) {
    const classes = (attr(body, "class")?.value ?? "").split(/\s+/u).filter(Boolean).filter((item2) => !propEntries.some(([name]) => item2.startsWith(`prop-${name}-`)));
    for (const [name, value] of propEntries) {
      if (!isPropToken(name) || !(typeof value === "boolean" || isPropToken(value)))
        throw new TypeError(
          `Screen ${screenId} source ${source.html} has invalid prop ${name}: ${JSON.stringify(value)}.`
        );
      const attribute = `data-prop-${name}`;
      body.attrs = body.attrs.filter((item2) => item2.name !== attribute);
      body.attrs.push({ name: attribute, value: String(value) });
      const prefix = `prop-${name}-`;
      classes.push(`${prefix}${value}`);
    }
    body.attrs = body.attrs.filter((item2) => item2.name !== "class");
    body.attrs.push({ name: "class", value: classes.join(" ") });
  }
  const html = serialize(document);
  if (Buffer.byteLength(html) > maxBytes)
    throw new Error("Bundled design exceeds the output budget.");
  return {
    html,
    files: [...files.keys()].map((path) => relative(root, path)),
    sourceDigests: Object.fromEntries(
      [...files].map(([path, value]) => [
        relative(root, path),
        createHash("sha256").update(value).digest("hex")
      ])
    ),
    inputBytes: bytes,
    bytes: Buffer.byteLength(html)
  };
}

// packages/protocol/src/design-contracts.mjs
var DESIGN_DOCUMENT_VERSION = "1.0.0";
function initialFrameHeight(document) {
  const fixed = document.frames.flatMap(
    ({ height }) => typeof height === "number" && Number.isInteger(height) ? [height] : []
  );
  return fixed.length ? Math.max(...fixed) : 900;
}
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
var isPropToken2 = (value) => typeof value === "string" && value.length <= PROP_TOKEN_SCHEMA.maxLength && propTokenPattern.test(value);
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
function validateDesignProps(document) {
  const errors = [];
  const checkToken = (value, path) => {
    if (!isPropToken2(value))
      errors.push(
        `${path}: ${JSON.stringify(value)} must be a lowercase token matching ${PROP_TOKEN_SCHEMA.pattern} with at most ${PROP_TOKEN_SCHEMA.maxLength} characters`
      );
  };
  const screens = new Map(document.screens.map((screen) => [screen.id, screen]));
  for (const [index, screen] of document.screens.entries()) {
    for (const [name, prop] of Object.entries(screen.props ?? {})) {
      const path = `$.screens[${index}].props.${name}`;
      checkToken(name, path);
      if (prop.type === "enum") {
        for (const [optionIndex, option] of prop.options.entries())
          checkToken(option, `${path}.options[${optionIndex}]`);
        checkToken(prop.default, `${path}.default`);
        if (!prop.options.includes(prop.default))
          errors.push(`${path}.default: '${prop.default}' is not an enum option`);
      }
    }
  }
  for (const [index, variant] of document.variants.entries()) {
    for (const [screenId, values] of Object.entries(variant.props ?? {})) {
      const screen = screens.get(screenId);
      const path = `$.variants[${index}].props.${screenId}`;
      if (!screen) {
        errors.push(`${path}: unknown screen '${screenId}'`);
        continue;
      }
      for (const [name, value] of Object.entries(values)) {
        checkToken(name, `${path}.${name}`);
        if (typeof value === "string") checkToken(value, `${path}.${name}`);
        const props = screen.props ?? {};
        const prop = Object.hasOwn(props, name) ? props[name] : void 0;
        if (!prop) errors.push(`${path}.${name}: unknown prop '${name}' on screen '${screenId}'`);
        else if (prop.type === "boolean" && typeof value !== "boolean")
          errors.push(`${path}.${name}: expected a boolean, received ${JSON.stringify(value)}`);
        else if (prop.type === "enum" && (typeof value !== "string" || !prop.options.includes(value)))
          errors.push(`${path}.${name}: ${JSON.stringify(value)} is not an enum option`);
      }
    }
  }
  return errors;
}
function validateDesignDocument(value) {
  const errors = validateJson(value, DESIGN_DOCUMENT_SCHEMA).map(
    ({ path, detail }) => `${path}: ${detail}`
  );
  if (value?.schemaVersion === "1.0.0" && ["screens", "variants"].some(
    (field) => Array.isArray(value[field]) && value[field].some((item2) => item2 && Object.hasOwn(item2, "props"))
  ))
    errors.push('$.schemaVersion: props require schemaVersion "1.1.0"');
  if (errors.length > 0) return { ok: false, errors };
  errors.push(...validateDesignProps(value));
  for (const field of ["frames", "screens", "flows", "variants"]) {
    const seen = /* @__PURE__ */ new Set();
    for (const [index, item2] of (value[field] ?? []).entries()) {
      if (seen.has(item2.id))
        errors.push(`$.${field}[${index}].id: duplicate identity '${item2.id}'`);
      seen.add(item2.id);
    }
  }
  const screenIds = new Set(value.screens.map(({ id: id2 }) => id2));
  const orderedIds = new Set(value.screenOrder);
  for (const id2 of value.screenOrder) {
    if (!screenIds.has(id2)) errors.push(`$.screenOrder: unknown screen '${id2}'`);
  }
  for (const id2 of screenIds) {
    if (!orderedIds.has(id2)) errors.push(`$.screenOrder: missing screen '${id2}'`);
  }
  for (const [index, flow] of (value.flows ?? []).entries()) {
    for (const id2 of flow.screens) {
      if (!screenIds.has(id2)) errors.push(`$.flows[${index}].screens: unknown screen '${id2}'`);
    }
  }
  for (const [index, variant] of value.variants.entries()) {
    for (const id2 of Object.keys(variant.sources ?? {})) {
      if (!screenIds.has(id2)) errors.push(`$.variants[${index}].sources: unknown screen '${id2}'`);
    }
  }
  const frameIds = new Set(value.frames.map(({ id: id2 }) => id2));
  const variantIds = new Set(value.variants.map(({ id: id2 }) => id2));
  for (const [key, position] of Object.entries(value.layout?.boards ?? {})) {
    const parts = key.split("/");
    const path = `$.layout.boards['${key}']`;
    if (parts.length > 3 || parts.some((id2) => !/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(id2))) {
      errors.push(`${path}: expected screenId, screenId/frameId or screenId/frameId/variantId`);
    } else {
      const [screenId, frameId, variantId] = parts;
      if (!screenIds.has(screenId)) errors.push(`${path}: unknown screen '${screenId}'`);
      if (frameId !== void 0 && !frameIds.has(frameId))
        errors.push(`${path}: unknown frame '${frameId}'`);
      if (variantId !== void 0 && !variantIds.has(variantId))
        errors.push(`${path}: unknown variant '${variantId}'`);
    }
    for (const axis of ["x", "y"]) {
      if (!Number.isFinite(position[axis]))
        errors.push(`${path}.${axis}: expected a finite coordinate`);
    }
  }
  const sectionIds = /* @__PURE__ */ new Set();
  for (const [index, section] of (value.layout?.sections ?? []).entries()) {
    if (sectionIds.has(section.id))
      errors.push(`$.layout.sections[${index}].id: duplicate identity '${section.id}'`);
    sectionIds.add(section.id);
    for (const axis of ["x", "y"]) {
      if (!Number.isFinite(section[axis]))
        errors.push(`$.layout.sections[${index}].${axis}: expected a finite coordinate`);
    }
  }
  const selected = value.variants.find(({ id: id2 }) => id2 === value.selectedVariant);
  if (!selected) errors.push(`$.selectedVariant: unknown variant '${value.selectedVariant}'`);
  else if (selected.status !== "ready")
    errors.push("$.selectedVariant: selected variant must be ready");
  for (const [index, spacing] of (value.designSystem?.spacing ?? []).entries()) {
    if (!Number.isFinite(spacing))
      errors.push(`$.designSystem.spacing[${index}]: expected a finite spacing value`);
  }
  return { ok: errors.length === 0, errors };
}
function assertDesignDocument(value) {
  const result = validateDesignDocument(value);
  if (!result.ok) throw new TypeError(`Invalid design document:
${result.errors.join("\n")}`);
  return value;
}

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
function serialize2(value, path, seen) {
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
        entries2.push(serialize2(value[index], `${path}[${index}]`, seen));
      }
      return `[${entries2.join(",")}]`;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`JCS requires a plain JSON object at ${path}.`);
    }
    const entries = Object.keys(value).sort().map((key) => {
      assertUnicodeScalarString(key, `${path} key`);
      return `${JSON.stringify(key)}:${serialize2(value[key], `${path}.${key}`, seen)}`;
    });
    return `{${entries.join(",")}}`;
  } finally {
    seen.delete(value);
  }
}
function canonicalizeJson(value) {
  return serialize2(value, "$", /* @__PURE__ */ new Set());
}
var SHA256_K = /* @__PURE__ */ new Int32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var rotr = (value, bits) => value >>> bits | value << 32 - bits;
function sha256Hex(value) {
  const candidate = typeof value === "string" ? new TextEncoder().encode(value) : value;
  if (!ArrayBuffer.isView(candidate) || Object.prototype.toString.call(candidate) !== "[object Uint8Array]") {
    throw new TypeError("sha256Hex expects a string or Uint8Array.");
  }
  const input = new Uint8Array(candidate.buffer, candidate.byteOffset, candidate.byteLength);
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(input);
  bytes[input.length] = 128;
  const view = new DataView(bytes.buffer);
  const bitLength = BigInt(input.length) * 8n;
  view.setUint32(paddedLength - 8, Number(bitLength >> 32n & 0xffffffffn));
  view.setUint32(paddedLength - 4, Number(bitLength & 0xffffffffn));
  let h0 = 1779033703;
  let h1 = 3144134277;
  let h2 = 1013904242;
  let h3 = 2773480762;
  let h4 = 1359893119;
  let h5 = 2600822924;
  let h6 = 528734635;
  let h7 = 1541459225;
  const words = new Int32Array(64);
  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4);
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotr(words[index - 15], 7) ^ rotr(words[index - 15], 18) ^ words[index - 15] >>> 3;
      const s1 = rotr(words[index - 2], 17) ^ rotr(words[index - 2], 19) ^ words[index - 2] >>> 10;
      words[index] = words[index - 16] + s0 + words[index - 7] + s1 | 0;
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const choice = e & f ^ ~e & g;
      const temp1 = h + s1 + choice + SHA256_K[index] + words[index] | 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const majority = a & b ^ a & c ^ b & c;
      const temp2 = s0 + majority | 0;
      h = g;
      g = f;
      f = e;
      e = d + temp1 | 0;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2 | 0;
    }
    h0 = h0 + a | 0;
    h1 = h1 + b | 0;
    h2 = h2 + c | 0;
    h3 = h3 + d | 0;
    h4 = h4 + e | 0;
    h5 = h5 + f | 0;
    h6 = h6 + g | 0;
    h7 = h7 + h | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((part) => (part >>> 0).toString(16).padStart(8, "0")).join("");
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

// packages/design/lib/design/context.mjs
import { createHash as createHash2 } from "node:crypto";
import { existsSync, readdirSync, readFileSync as readFileSync2, realpathSync as realpathSync2 } from "node:fs";
import { dirname as dirname2, join, resolve as resolve2 } from "node:path";
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
function loadReviewContext(root, document, { readSource } = {}) {
  const file = join(root, "review-context.json");
  if (!existsSync(file)) return emptyReviewContext(document);
  const context = JSON.parse(
    readSource ? readSource("review-context.json", root).value.toString("utf8") : readFileSync2(resolveLocalDocumentFile(root, "review-context.json"), "utf8")
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
  const values = Object.hasOwn(variant.props ?? {}, screen.id) ? variant.props[screen.id] : {};
  return {
    screenId: screen.id,
    variantId: variant.id,
    frameId: frame.id,
    contentDigest: reviewDigest({
      files: Object.entries(sourceDigests).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0),
      width: frame.width,
      height: frame.height,
      ...screen.props === void 0 ? {} : {
        props: Object.fromEntries(
          Object.entries(screen.props).map(([name, declaration]) => [
            name,
            Object.hasOwn(values, name) ? values[name] : declaration.default
          ])
        )
      }
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
      ...document.screens.some((screen) => screen.props !== void 0) || document.variants.some((variant) => variant.props !== void 0) ? { schemaVersion: document.schemaVersion } : {},
      ...pick(document, [
        "id",
        "title",
        "defaultView",
        "selectedVariant",
        "screenOrder",
        "frames",
        "flows",
        "layout"
      ]),
      screens: document.screens.map(
        (screen) => pick(screen, ["id", "title", "description", "anchors", "props"])
      ),
      selectedVariant: document.variants.some(
        (variant) => variant.id === state.selectedVariant && variant.status === "ready"
      ) ? state.selectedVariant : document.selectedVariant,
      variants: document.variants.filter((variant) => variant.status === "ready").map((variant) => pick(variant, ["id", "label", "status", "props"]))
    },
    envelope: structuredClone(current.envelope),
    entries: structuredClone(current.entries),
    state: {},
    revision: current.revision,
    verification: pick(current.verification ?? {}, ["status"]),
    reviewContext: context,
    contextDigest: current.contextDigest ?? reviewDigest(context),
    fingerprints: current.fingerprints ?? []
  };
}
var localRoot = (file) => realpathSync2(dirname2(resolve2(file)));
function listDesignRevisions(file) {
  const root = localRoot(file);
  const pointer = JSON.parse(readFileSync2(join(root, ".design/current.json"), "utf8"));
  const revisions = readdirSync(join(root, ".design/revisions")).filter((name) => /^[a-f0-9]{64}$/u.test(name)).map((revision) => {
    const value = JSON.parse(
      readFileSync2(join(root, ".design/revisions", revision, "render.json"), "utf8")
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
    readFileSync2(
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
  inspectLocalDocumentBody,
  resolveLocalDocumentFile,
  bundleLocalDocument,
  initialFrameHeight,
  DESIGN_DOCUMENT_SCHEMA,
  validateDesignProps,
  assertDesignDocument,
  canonicalizeJson,
  sha256Hex,
  deepFreeze,
  assertPlainData,
  DESIGN_HANDOFF_CONTENT_SCHEMA,
  DESIGN_HANDOFF_SCHEMA,
  assertReviewExperience,
  reviewDigest,
  emptyReviewContext,
  loadReviewContext,
  reviewFingerprints,
  listDesignRevisions,
  readDesignRevision
};
