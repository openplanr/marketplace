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
  AA_NORMAL,
  ARTIFACT_ERROR_CODES,
  PipelineError,
  contrastRatio,
  createArtifactEnvelope,
  digestArtifactEnvelope,
  embedJson,
  escapeHtml,
  renderArtifactShellDocument,
  renderPlanrMark,
  validateJson
} from "./design-artifact-shell.mjs";
import {
  ARTIFACT_FRAME_GUARD_TEMPLATE,
  ARTIFACT_HOST_GUARD_TEMPLATE,
  ARTIFACT_WORKER_GUARD_SOURCE
} from "./design-sandbox-guards.mjs";

// packages/design/lib/design/document.mjs
import { createHash as createHash4, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync as existsSync3,
  mkdirSync as mkdirSync2,
  openSync,
  readFileSync as readFileSync6,
  realpathSync as realpathSync3,
  renameSync as renameSync2,
  rmSync as rmSync2,
  writeFileSync as writeFileSync2
} from "node:fs";
import { dirname as dirname4, join as join4, resolve as resolve4 } from "node:path";

// packages/artifact/lib/artifact/bridge.mjs
import { randomBytes as randomBytes3 } from "node:crypto";

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

// packages/artifact/lib/artifact/internal/board-token.mjs
import { randomBytes as randomBytes2, timingSafeEqual } from "node:crypto";

// packages/artifact/lib/artifact/internal/planr-home.mjs
import { homedir } from "node:os";
import { join, resolve } from "node:path";
var WARNED = /* @__PURE__ */ Symbol.for("openplanr.home-variable-warning");
function nonBlank(value) {
  return typeof value === "string" && value.trim() ? value : void 0;
}
function warnOnce(message) {
  if (globalThis[WARNED]) return;
  globalThis[WARNED] = true;
  process.stderr.write(`Warning: ${message}
`);
}
function homeVariables(env) {
  const home = nonBlank(env.PLANR_HOME);
  const legacy = nonBlank(env.OPENPLANR_HOME);
  if (legacy === void 0) return { home, legacy };
  const legacyHome = join(legacy, ".planr");
  if (home === void 0) {
    warnOnce(`OPENPLANR_HOME is deprecated; set PLANR_HOME=${legacyHome} instead.`);
    return { home, legacy };
  }
  warnOnce(
    resolve(home) === resolve(legacyHome) ? "OPENPLANR_HOME is deprecated and ignored because PLANR_HOME is set; unset OPENPLANR_HOME." : `PLANR_HOME=${home} and OPENPLANR_HOME=${legacy} name different OpenPlanr homes; using PLANR_HOME. OPENPLANR_HOME is deprecated; unset it.`
  );
  return { home, legacy: void 0 };
}
function configuredPlanrHome(env = process.env) {
  const { home, legacy } = homeVariables(env);
  return home ?? (legacy === void 0 ? void 0 : join(legacy, ".planr"));
}
function planrHome(env = process.env) {
  return configuredPlanrHome(env) ?? join(homedir(), ".planr");
}

// packages/artifact/lib/artifact/internal/server-util.mjs
import { randomBytes } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, join as join2 } from "node:path";
var LOOPBACK_HOST = "127.0.0.1";
function codedError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== void 0) error.details = details;
  return error;
}
function readJsonState(path) {
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
function writePrivateJsonState(path, value, { mode = 384 } = {}) {
  mkdirSync(dirname(path), { recursive: true, mode: 448 });
  const temporary = `${path}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}
`, { mode, flag: "wx" });
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}
function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === "EPERM";
  }
}
function listenLoopback(server, port = 0, { host = LOOPBACK_HOST } = {}) {
  if (host !== LOOPBACK_HOST) {
    return Promise.reject(
      codedError("E_LOOPBACK_HOST", `Refusing non-loopback bind host: ${host}`)
    );
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    return Promise.reject(codedError("E_LOOPBACK_PORT", `Invalid loopback port: ${String(port)}`));
  }
  return new Promise((resolveListen, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      const address = server.address();
      if (!address || typeof address === "string" || address.address !== LOOPBACK_HOST) {
        closeHttpServer(server).finally(
          () => reject(
            codedError(
              "E_LOOPBACK_BIND",
              "Server did not bind to the required IPv4 loopback interface."
            )
          )
        );
        return;
      }
      resolveListen(address.port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen({ port, host, exclusive: true });
  });
}
function closeHttpServer(server) {
  if (!server?.listening) return Promise.resolve();
  return new Promise((resolveClose, reject) => {
    server.close((error) => error ? reject(error) : resolveClose());
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
  });
}
function readRequestBody(req, { maxBytes, encoding = null } = {}) {
  if (!Number.isInteger(maxBytes) || maxBytes < 1) {
    return Promise.reject(
      codedError("E_REQUEST_BODY_LIMIT", "A positive request byte limit is required.")
    );
  }
  const declared = Number(req.headers?.["content-length"]);
  if (Number.isFinite(declared) && declared > maxBytes) {
    req.resume?.();
    return Promise.reject(
      codedError("E_REQUEST_BODY_LIMIT", `Request body exceeds ${maxBytes} bytes.`, {
        maxBytes,
        declaredBytes: declared
      })
    );
  }
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let bytes = 0;
    let settled = false;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    req.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.byteLength;
      if (bytes > maxBytes) {
        chunks.length = 0;
        rejectOnce(
          codedError("E_REQUEST_BODY_LIMIT", `Request body exceeds ${maxBytes} bytes.`, {
            maxBytes,
            receivedBytes: bytes
          })
        );
        return;
      }
      if (!settled) chunks.push(buffer);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      const body = Buffer.concat(chunks, bytes);
      resolveBody(encoding ? body.toString(encoding) : body);
    });
    req.on("error", rejectOnce);
    req.on(
      "aborted",
      () => rejectOnce(codedError("E_REQUEST_ABORTED", "Request body was aborted."))
    );
  });
}
function assertLoopbackRequest(req, { port, mutating = false, internal = false, hosts = [LOOPBACK_HOST] } = {}) {
  const allowedHosts = new Set(hosts);
  const hostHeaders = req.headersDistinct?.host;
  const receivedHost = req.headers?.host;
  const separator = typeof receivedHost === "string" ? receivedHost.lastIndexOf(":") : -1;
  const receivedName = separator > 0 ? receivedHost.slice(0, separator) : "";
  const receivedPort = separator > 0 ? receivedHost.slice(separator + 1) : "";
  const expectedHost = `${receivedName}:${port}`;
  const expectedOrigin = `http://${expectedHost}`;
  if (!allowedHosts.has(receivedName) || receivedPort !== String(port) || Array.isArray(hostHeaders) && hostHeaders.length !== 1) {
    throw codedError("E_LOOPBACK_HOST", "Loopback Host header rejected.");
  }
  const origin = req.headers?.origin;
  if (origin !== void 0 && origin !== expectedOrigin) {
    throw codedError("E_LOOPBACK_ORIGIN", "Loopback Origin header rejected.");
  }
  if (mutating && !internal && origin !== expectedOrigin) {
    throw codedError(
      "E_LOOPBACK_ORIGIN",
      "State-changing browser requests require the exact loopback origin."
    );
  }
  if (internal && origin !== void 0) {
    throw codedError(
      "E_LOOPBACK_ORIGIN",
      "Internal control requests must not carry a browser Origin."
    );
  }
  const fetchSite = String(req.headers?.["sec-fetch-site"] ?? "").toLowerCase();
  if (fetchSite && !["none", "same-origin"].includes(fetchSite)) {
    throw codedError("E_LOOPBACK_FETCH_SITE", "Cross-site loopback request rejected.");
  }
  return { expectedHost, expectedOrigin };
}
var wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
async function acquireStartLock(path, {
  timeout = 5e3,
  poll = 25,
  pid = process.pid,
  now = () => Date.now(),
  isAlive = isProcessAlive,
  waitImpl = wait
} = {}) {
  mkdirSync(dirname(path), { recursive: true, mode: 448 });
  const started = now();
  if (existsSync(path)) {
    throw codedError(
      "E_START_LOCK_LEGACY",
      `A legacy startup lock must be cleared after confirming its owner is stopped: ${path}`
    );
  }
  const directory = `${path}.writers`;
  mkdirSync(directory, { recursive: true, mode: 448 });
  const directoryInfo = lstatSync(directory);
  if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) {
    throw codedError("E_START_LOCK_UNSAFE", `Startup lock directory is unsafe: ${directory}`);
  }
  const owner = randomBytes(16).toString("hex");
  const name = `${pid}-${owner}.json`;
  const recordPath = join2(directory, name);
  const announce = (ticket) => writePrivateJsonState(recordPath, { pid, owner, ticket });
  const writers = () => {
    const result = [];
    for (const entry of readdirSync(directory)) {
      if (!entry.endsWith(".json")) continue;
      const match = /^([1-9]\d*)-([a-f0-9]{32})\.json$/u.exec(entry);
      if (!match)
        throw codedError("E_START_LOCK_UNSAFE", `Startup lock record is invalid: ${entry}`);
      const entryPath = join2(directory, entry);
      let info;
      try {
        info = lstatSync(entryPath);
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
      }
      if (!info.isFile() || info.isSymbolicLink() || info.size > 1024) {
        throw codedError("E_START_LOCK_UNSAFE", `Startup lock record is unsafe: ${entry}`);
      }
      const value = readJsonState(entryPath);
      if (value?.pid !== Number(match[1]) || value?.owner !== match[2] || !Number.isSafeInteger(value.ticket) || value.ticket < 0)
        throw codedError("E_START_LOCK_UNSAFE", `Startup lock record is invalid: ${entry}`);
      if (!isAlive(value.pid)) {
        rmSync(entryPath, { force: true });
        continue;
      }
      result.push({ ...value, name: entry });
    }
    return result;
  };
  try {
    announce(0);
    const ticket = Math.max(0, ...writers().map((writer) => writer.ticket)) + 1;
    if (!Number.isSafeInteger(ticket)) {
      throw codedError("E_START_LOCK_UNSAFE", "Startup lock ticket limit reached.");
    }
    announce(ticket);
    while (now() - started <= timeout) {
      const blocked = writers().some(
        (writer) => writer.name !== name && (writer.ticket === 0 || writer.ticket < ticket || writer.ticket === ticket && writer.name < name)
      );
      if (!blocked) {
        return () => {
          const current = readJsonState(recordPath);
          if (current?.owner === owner && current?.pid === pid) rmSync(recordPath, { force: true });
        };
      }
      await waitImpl(poll);
    }
    throw codedError("E_START_LOCK_TIMEOUT", `Timed out waiting for startup lock: ${path}`);
  } catch (error) {
    rmSync(recordPath, { force: true });
    throw error;
  }
}

// packages/artifact/lib/artifact/internal/board-token.mjs
var BASE64URL_TOKEN_RE = /^[A-Za-z0-9_-]+$/;
function mintCapabilityToken({
  bytes = 32,
  encoding = "base64url",
  randomBytesImpl = randomBytes2
} = {}) {
  if (!Number.isInteger(bytes) || bytes < 12 || bytes > 64) {
    throw new RangeError("Capability tokens require 12 through 64 random bytes.");
  }
  if (!["base64url", "hex"].includes(encoding)) {
    throw new TypeError(`Unsupported capability token encoding: ${String(encoding)}`);
  }
  const value = randomBytesImpl(bytes);
  if (!Buffer.isBuffer(value) || value.byteLength !== bytes) {
    throw new TypeError("Capability token random source returned the wrong byte length.");
  }
  return value.toString(encoding);
}
function isCapabilityToken(value, { bytes = 32, encoding = "base64url" } = {}) {
  if (typeof value !== "string") return false;
  if (encoding === "hex") return value.length === bytes * 2 && /^[a-f0-9]+$/.test(value);
  if (encoding !== "base64url" || !BASE64URL_TOKEN_RE.test(value)) return false;
  try {
    return Buffer.from(value, "base64url").byteLength === bytes && Buffer.from(value, "base64url").toString("base64url") === value;
  } catch {
    return false;
  }
}
function timingSafeTokenEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return leftBytes.byteLength === rightBytes.byteLength && timingSafeEqual(leftBytes, rightBytes);
}

// packages/artifact/lib/artifact/ui/bridge-tools.mjs
var ARTIFACT_THUMBNAIL_MAX_EDGE = 320;
var ARTIFACT_THUMBNAIL_MAX_DATA_URL = 256 * 1024;
var ARTIFACT_VIEWPORT_ZOOM_MAX_DELTA = 1e3;
var ARTIFACT_VIEWPORT_PAN_MAX_DELTA = 1e3;
function normalizeArtifactViewportZoom(value, viewport) {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    return null;
  const keys = ["x", "y", "deltaY"];
  if (Object.keys(value).length !== keys.length || !Object.keys(value).every((key) => keys.includes(key)))
    return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (!keys.every(
    (key) => Object.hasOwn(descriptors[key], "value") && typeof descriptors[key].value === "number" && Number.isFinite(descriptors[key].value)
  ))
    return null;
  const { x, y, deltaY } = value;
  if (!Number.isFinite(viewport?.width) || !Number.isFinite(viewport?.height) || viewport.width < 1 || viewport.height < 1 || viewport.width > 16384 || viewport.height > 16384 || x < 0 || y < 0 || x > viewport.width || y > viewport.height || deltaY === 0 || Math.abs(deltaY) > ARTIFACT_VIEWPORT_ZOOM_MAX_DELTA)
    return null;
  return Object.freeze({ x, y, deltaY });
}
function normalizeArtifactViewportPan(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    return null;
  const keys = ["deltaX", "deltaY"];
  if (Object.keys(value).length !== keys.length || !Object.keys(value).every((key) => keys.includes(key)))
    return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (!keys.every(
    (key) => Object.hasOwn(descriptors[key], "value") && typeof descriptors[key].value === "number" && Number.isFinite(descriptors[key].value)
  ))
    return null;
  const { deltaX, deltaY } = value;
  if (!deltaX && !deltaY || Math.abs(deltaX) > ARTIFACT_VIEWPORT_PAN_MAX_DELTA || Math.abs(deltaY) > ARTIFACT_VIEWPORT_PAN_MAX_DELTA)
    return null;
  return Object.freeze({ deltaX, deltaY });
}
function createArtifactViewportGestures(window, emit) {
  const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window);
  const schedule = window.setTimeout.bind(window), cancel = window.clearTimeout.bind(window);
  const prevent = window.Event.prototype.preventDefault, stop = window.Event.prototype.stopImmediatePropagation;
  const getter = (prototype, name) => Object.getOwnPropertyDescriptor(prototype, name)?.get;
  const native = {
    x: getter(window.MouseEvent.prototype, "clientX"),
    y: getter(window.MouseEvent.prototype, "clientY"),
    ctrl: getter(window.MouseEvent.prototype, "ctrlKey"),
    meta: getter(window.MouseEvent.prototype, "metaKey"),
    shift: getter(window.MouseEvent.prototype, "shiftKey"),
    deltaX: getter(window.WheelEvent.prototype, "deltaX"),
    deltaY: getter(window.WheelEvent.prototype, "deltaY"),
    mode: getter(window.WheelEvent.prototype, "deltaMode")
  };
  let enabled = false, disposed = false, timer = 0, pending = null, pendingType = "";
  const clear = () => {
    if (timer) cancel(timer);
    timer = 0;
    pending = null;
    pendingType = "";
  };
  const flush = () => {
    timer = 0;
    const value = pending;
    const type = pendingType;
    pending = null;
    pendingType = "";
    if (enabled && !disposed && value) emit(type, value);
  };
  const wheel = (event) => {
    if (!enabled || disposed || !event.isTrusted || !event.cancelable) return;
    let x, y, deltaX, deltaY, mode, zooming, shift;
    try {
      x = native.x.call(event);
      y = native.y.call(event);
      mode = native.mode.call(event);
      zooming = native.ctrl.call(event) || native.meta.call(event);
      shift = native.shift.call(event);
      deltaX = native.deltaX.call(event);
      deltaY = native.deltaY.call(event);
    } catch {
      return;
    }
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return;
    const scaleX = mode === 1 ? 16 : mode === 2 ? window.innerWidth : 1;
    const scaleY = mode === 1 ? 16 : mode === 2 ? window.innerHeight : 1;
    deltaX *= scaleX;
    deltaY *= scaleY;
    let type;
    let value;
    if (zooming) {
      type = "viewport.zoom";
      deltaY = Math.max(
        -ARTIFACT_VIEWPORT_ZOOM_MAX_DELTA,
        Math.min(ARTIFACT_VIEWPORT_ZOOM_MAX_DELTA, deltaY)
      );
      value = normalizeArtifactViewportZoom(
        { x, y, deltaY },
        { width: window.innerWidth, height: window.innerHeight }
      );
    } else {
      type = "viewport.pan";
      if (shift && !deltaX) {
        deltaX = deltaY;
        deltaY = 0;
      }
      deltaX = Math.max(
        -ARTIFACT_VIEWPORT_PAN_MAX_DELTA,
        Math.min(ARTIFACT_VIEWPORT_PAN_MAX_DELTA, deltaX)
      );
      deltaY = Math.max(
        -ARTIFACT_VIEWPORT_PAN_MAX_DELTA,
        Math.min(ARTIFACT_VIEWPORT_PAN_MAX_DELTA, deltaY)
      );
      value = normalizeArtifactViewportPan({ deltaX, deltaY });
    }
    if (!value) return;
    prevent.call(event);
    stop.call(event);
    if (pendingType && pendingType !== type) flush();
    pendingType = type;
    pending = type === "viewport.zoom" ? {
      ...value,
      deltaY: Math.max(
        -ARTIFACT_VIEWPORT_ZOOM_MAX_DELTA,
        Math.min(ARTIFACT_VIEWPORT_ZOOM_MAX_DELTA, (pending?.deltaY || 0) + deltaY)
      )
    } : {
      deltaX: Math.max(
        -ARTIFACT_VIEWPORT_PAN_MAX_DELTA,
        Math.min(ARTIFACT_VIEWPORT_PAN_MAX_DELTA, (pending?.deltaX || 0) + deltaX)
      ),
      deltaY: Math.max(
        -ARTIFACT_VIEWPORT_PAN_MAX_DELTA,
        Math.min(ARTIFACT_VIEWPORT_PAN_MAX_DELTA, (pending?.deltaY || 0) + deltaY)
      )
    };
    if (!timer) timer = schedule(flush, 16);
  };
  const destroy = () => {
    disposed = true;
    enabled = false;
    clear();
    remove("wheel", wheel, true);
    remove("pagehide", destroy);
  };
  add("wheel", wheel, { capture: true, passive: false });
  add("pagehide", destroy, { once: true });
  return Object.freeze({
    setEnabled(value) {
      if (disposed || typeof value !== "boolean") return false;
      enabled = value;
      if (!value) clear();
      return true;
    },
    destroy
  });
}
var ARTIFACT_BRIDGE_OPERATION_TIMEOUTS = Object.freeze({
  "inspect.point": 1200,
  "inspect.anchor": 1200,
  "thumbnail.request": 3e3,
  "export.request": 8e3
});
var ARTIFACT_INSPECTION_PROPERTIES = Object.freeze([
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "color",
  "background-color",
  "display",
  "position",
  "gap",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "border-radius",
  "border-width",
  "border-color",
  "box-sizing"
]);
function normalizeArtifactInspection(value, viewport) {
  const plain = (entry) => entry && typeof entry === "object" && !Array.isArray(entry) && [Object.prototype, null].includes(Object.getPrototypeOf(entry));
  const own = (entry, key) => {
    const descriptor = plain(entry) ? Object.getOwnPropertyDescriptor(entry, key) : null;
    return descriptor && Object.hasOwn(descriptor, "value") ? descriptor.value : void 0;
  };
  const exact = (entry, keys) => plain(entry) && Object.keys(entry).length === keys.length && Object.keys(entry).every((key) => keys.includes(key));
  if (!exact(value, ["tagName", "anchor", "rect", "viewport", "styles", "accessibility"]))
    return null;
  const tagName = own(value, "tagName");
  const anchor = own(value, "anchor");
  const rect = own(value, "rect");
  const size = own(value, "viewport");
  const styles = own(value, "styles");
  const accessibility = own(value, "accessibility");
  if (typeof tagName !== "string" || !/^[a-z][a-z0-9-]{0,63}$/.test(tagName)) return null;
  if (!exact(size, ["width", "height"]) || !exact(rect, ["x", "y", "width", "height"])) return null;
  if (!["width", "height"].every(
    (key) => Number.isInteger(own(size, key)) && own(size, key) >= 1 && own(size, key) <= 16384 && own(size, key) === viewport?.[key]
  ))
    return null;
  if (!["x", "y", "width", "height"].every(
    (key) => typeof own(rect, key) === "number" && Number.isFinite(own(rect, key)) && own(rect, key) >= 0
  ))
    return null;
  if (rect.x + rect.width > size.width || rect.y + rect.height > size.height) return null;
  if (anchor !== null && (!exact(anchor, own(anchor, "screen") === void 0 ? ["planrId"] : ["planrId", "screen"]) || typeof own(anchor, "planrId") !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/.test(anchor.planrId) || own(anchor, "screen") !== void 0 && (typeof anchor.screen !== "string" || !/^[^\u0000-\u001f\u007f]{1,128}$/.test(anchor.screen))))
    return null;
  if (!exact(styles, ARTIFACT_INSPECTION_PROPERTIES) || !ARTIFACT_INSPECTION_PROPERTIES.every((key) => {
    const text3 = own(styles, key);
    return typeof text3 === "string" && text3.length <= 256 && !/[\u0000-\u001f\u007f]/.test(text3) && !/(?:url\s*\(|https?:|file:)/i.test(text3);
  }))
    return null;
  if (!exact(accessibility, ["role", "ariaLabel", "alt", "tabIndex", "disabled"]) || !["role", "ariaLabel", "alt"].every(
    (key) => typeof own(accessibility, key) === "string" && own(accessibility, key).length <= 256 && !/[\u0000-\u001f\u007f]/.test(own(accessibility, key))
  ) || !Number.isInteger(own(accessibility, "tabIndex")) || accessibility.tabIndex < -1 || accessibility.tabIndex > 32767 || typeof own(accessibility, "disabled") !== "boolean")
    return null;
  return Object.freeze({
    tagName,
    anchor: anchor === null ? null : Object.freeze({ ...anchor }),
    rect: Object.freeze({ ...rect }),
    viewport: Object.freeze({ ...size }),
    styles: Object.freeze({ ...styles }),
    accessibility: Object.freeze({ ...accessibility })
  });
}
function normalizeArtifactThumbnail(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 4 || !Object.keys(value).every((key) => ["dataUrl", "width", "height", "label"].includes(key)) || !Object.values(Object.getOwnPropertyDescriptors(value)).every(
    (descriptor) => Object.hasOwn(descriptor, "value")
  ))
    return null;
  const { dataUrl, width, height, label } = value;
  if (typeof dataUrl !== "string" || dataUrl.length > ARTIFACT_THUMBNAIL_MAX_DATA_URL || !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(dataUrl) || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > ARTIFACT_THUMBNAIL_MAX_EDGE || height > ARTIFACT_THUMBNAIL_MAX_EDGE || typeof label !== "string" || label.length < 1 || label.length > 128)
    return null;
  return Object.freeze({ dataUrl, width, height, label });
}
function normalizeArtifactBridgeToolResult(requestType, message, viewport) {
  const base = ["channel", "schemaVersion", "type", "nonce", "artifactId", "requestId"];
  const exact = (keys) => message && typeof message === "object" && !Array.isArray(message) && Object.keys(message).length === keys.length && Object.keys(message).every((key) => keys.includes(key)) && Object.values(Object.getOwnPropertyDescriptors(message)).every(
    (descriptor) => Object.hasOwn(descriptor, "value")
  );
  if (requestType === "inspect.point" || requestType === "inspect.anchor") {
    if (exact(base) && message.type === "inspect.miss") return { valid: true, value: null };
    if (!exact([...base, "inspection"]) || message.type !== "inspect.result")
      return { valid: false };
    const value = normalizeArtifactInspection(message.inspection, viewport);
    return value ? { valid: true, value } : { valid: false };
  }
  if (requestType === "thumbnail.request") {
    if (exact([...base, "reason"]) && message.type === "thumbnail.error" && typeof message.reason === "string" && message.reason.length <= 256)
      return { valid: true, value: null };
    if (!exact([...base, "dataUrl", "width", "height", "label"]) || message.type !== "thumbnail.result")
      return { valid: false };
    const value = normalizeArtifactThumbnail({
      dataUrl: message.dataUrl,
      width: message.width,
      height: message.height,
      label: message.label
    });
    return value ? { valid: true, value } : { valid: false };
  }
  return { valid: false };
}
function createArtifactBridgeTools(document2, window) {
  const fromPoint = document2.elementFromPoint.bind(document2);
  const query = document2.querySelectorAll.bind(document2);
  const attr2 = window.Element.prototype.getAttribute;
  const closest = window.Element.prototype.closest;
  const bounds = window.Element.prototype.getBoundingClientRect;
  const computed = window.getComputedStyle.bind(window);
  const cloneNode = window.Node.prototype.cloneNode;
  const append = window.Node.prototype.appendChild;
  const create = document2.createElement.bind(document2);
  const setAttribute = window.Element.prototype.setAttribute;
  const serialize3 = window.XMLSerializer.prototype.serializeToString;
  const Image = window.Image;
  const Serializer = window.XMLSerializer;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const get = (element2, key) => attr2.call(element2, key);
  const validId = (id3) => typeof id3 === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/.test(id3);
  const screen = (element2) => {
    const owner = closest.call(element2, "[data-planr-screen]");
    const value = owner && get(owner, "data-planr-screen");
    return typeof value === "string" && /^[^\u0000-\u001f\u007f]{1,128}$/.test(value) ? value : void 0;
  };
  const clean = (value) => String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 256);
  const inspectElement = (element2) => {
    if (!(element2 instanceof window.Element)) return null;
    const tagName = element2.localName;
    if (typeof tagName !== "string" || !/^[a-z][a-z0-9-]{0,63}$/.test(tagName)) return null;
    const rect = bounds.call(element2), width = window.innerWidth, height = window.innerHeight;
    const x = clamp(rect.left, 0, width), y = clamp(rect.top, 0, height);
    const owner = closest.call(element2, "[data-planr-id]");
    const planrId = owner && get(owner, "data-planr-id");
    const anchorScreen = owner && screen(owner);
    const style = computed(element2);
    const styles = Object.fromEntries(
      ARTIFACT_INSPECTION_PROPERTIES.map((key) => {
        const value = clean(style.getPropertyValue(key));
        return [key, /(?:url\s*\(|https?:|file:)/i.test(value) ? "" : value];
      })
    );
    return {
      tagName,
      anchor: validId(planrId) ? { planrId, ...anchorScreen ? { screen: anchorScreen } : {} } : null,
      rect: {
        x,
        y,
        width: Math.max(0, clamp(rect.right, 0, width) - x),
        height: Math.max(0, clamp(rect.bottom, 0, height) - y)
      },
      viewport: { width, height },
      styles,
      accessibility: {
        role: clean(get(element2, "role")),
        ariaLabel: clean(get(element2, "aria-label")),
        alt: clean(get(element2, "alt")),
        tabIndex: clamp(Number(element2.tabIndex) || 0, -1, 32767),
        disabled: get(element2, "disabled") !== null || get(element2, "aria-disabled") === "true"
      }
    };
  };
  let capturing = false;
  return Object.freeze({
    inspectAt(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight)
        return null;
      return inspectElement(fromPoint(x, y));
    },
    inspect(anchor) {
      if (!anchor || !validId(anchor.planrId) || Object.keys(anchor).some((key) => !["planrId", "screen"].includes(key)) || anchor.screen !== void 0 && (typeof anchor.screen !== "string" || !/^[^\u0000-\u001f\u007f]{1,128}$/.test(anchor.screen)))
        return null;
      let count = 0;
      for (const element2 of query("[data-planr-id]")) {
        if (++count > 1e4) return null;
        if (get(element2, "data-planr-id") === anchor.planrId && (anchor.screen === void 0 || screen(element2) === anchor.screen))
          return inspectElement(element2);
      }
      return null;
    },
    async thumbnail() {
      if (capturing) throw new Error("Thumbnail capture is busy.");
      capturing = true;
      let image;
      try {
        const deadline = Date.now() + 2400;
        const width = window.innerWidth, height = window.innerHeight;
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 16384 || height > 16384)
          throw new Error("Thumbnail dimensions are unavailable.");
        let count = 0, contentSize = 0;
        const cloneStyled = (source) => {
          if (++count > 4e3 || Date.now() > deadline)
            throw new Error("Thumbnail capture limit exceeded.");
          if (source.nodeType === 8 || source.nodeType === 1 && ["SCRIPT", "STYLE", "LINK", "META"].includes(source.tagName))
            return document2.createTextNode("");
          const target = cloneNode.call(source, false);
          if (source.nodeType === 1) {
            const styles = computed(source);
            let css = "";
            for (let index = 0; index < styles.length; index++) {
              if (index >= 2048 || Date.now() > deadline)
                throw new Error("Thumbnail style limit exceeded.");
              const name = styles[index];
              if (!name.startsWith("--")) css += name + ":" + styles.getPropertyValue(name) + ";";
            }
            contentSize += css.length + (source.textContent?.length || 0);
            if (contentSize > 4 * 1024 * 1024) throw new Error("Thumbnail markup limit exceeded.");
            setAttribute.call(target, "style", css + "animation:none;transition:none;");
            for (const attribute of [...target.attributes])
              if (/^on/i.test(attribute.name) || ["value", "srcdoc"].includes(attribute.name))
                target.removeAttribute(attribute.name);
            if (source.tagName === "INPUT" || source.tagName === "TEXTAREA") {
              target.value = "";
              target.textContent = "";
            }
            if (source.tagName === "CANVAS") {
              try {
                const replacement = create("img");
                replacement.src = source.toDataURL("image/png");
                setAttribute.call(replacement, "style", css);
                return replacement;
              } catch {
              }
            }
          }
          if (source.nodeType !== 1 || source.tagName !== "TEXTAREA")
            for (let child = source.firstChild; child; child = child.nextSibling)
              append.call(target, cloneStyled(child));
          return target;
        };
        const clone = cloneStyled(document2.documentElement);
        setAttribute.call(clone, "xmlns", "http://www.w3.org/1999/xhtml");
        const markup = serialize3.call(new Serializer(), clone);
        if (markup.length > 4 * 1024 * 1024) throw new Error("Thumbnail markup limit exceeded.");
        const scale = Math.min(1, ARTIFACT_THUMBNAIL_MAX_EDGE / Math.max(width, height));
        const outputWidth = Math.max(1, Math.round(width * scale)), outputHeight = Math.max(1, Math.round(height * scale));
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + outputWidth + '" height="' + outputHeight + '" viewBox="0 0 ' + width + " " + height + '"><foreignObject width="' + width + '" height="' + height + '">' + markup + "</foreignObject></svg>";
        image = new Image();
        await new Promise((resolve5, reject) => {
          const timer = setTimeout(
            () => reject(new Error("Thumbnail capture timed out.")),
            Math.max(1, deadline - Date.now())
          );
          image.onload = () => {
            clearTimeout(timer);
            resolve5();
          };
          image.onerror = () => {
            clearTimeout(timer);
            reject(new Error("Thumbnail rendering unavailable."));
          };
          image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        });
        const canvas = create("canvas");
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        canvas.getContext("2d").drawImage(image, 0, 0, outputWidth, outputHeight);
        const dataUrl = canvas.toDataURL("image/png");
        if (dataUrl.length > ARTIFACT_THUMBNAIL_MAX_DATA_URL)
          throw new Error("Thumbnail output limit exceeded.");
        return { dataUrl, width: outputWidth, height: outputHeight, label: "screen" };
      } finally {
        if (image) {
          image.onload = null;
          image.onerror = null;
        }
        capturing = false;
      }
    }
  });
}
function renderArtifactBridgeToolsSource() {
  return `const ARTIFACT_THUMBNAIL_MAX_EDGE=${ARTIFACT_THUMBNAIL_MAX_EDGE};
const ARTIFACT_THUMBNAIL_MAX_DATA_URL=${ARTIFACT_THUMBNAIL_MAX_DATA_URL};
const ARTIFACT_VIEWPORT_ZOOM_MAX_DELTA=${ARTIFACT_VIEWPORT_ZOOM_MAX_DELTA};
const ARTIFACT_VIEWPORT_PAN_MAX_DELTA=${ARTIFACT_VIEWPORT_PAN_MAX_DELTA};
const ARTIFACT_INSPECTION_PROPERTIES=${JSON.stringify(ARTIFACT_INSPECTION_PROPERTIES)};
const ARTIFACT_BRIDGE_OPERATION_TIMEOUTS=${JSON.stringify(ARTIFACT_BRIDGE_OPERATION_TIMEOUTS)};
${normalizeArtifactInspection.toString()}
${normalizeArtifactThumbnail.toString()}
${normalizeArtifactBridgeToolResult.toString()}
${normalizeArtifactViewportZoom.toString()}
${normalizeArtifactViewportPan.toString()}
${createArtifactViewportGestures.toString()}
${createArtifactBridgeTools.toString()}`;
}

// packages/artifact/lib/artifact/bridge.mjs
var ARTIFACT_BRIDGE_CHANNEL = "openplanr.artifact-anchor";
var ARTIFACT_BRIDGE_VERSION = "1.0.0";
var ARTIFACT_BRIDGE_EVENT = "planr:artifact-anchor";
var ARTIFACT_BRIDGE_READY_EVENT = "planr:artifact-bridge-ready";
var ARTIFACT_BRIDGE_LAYOUT_EVENT = "planr:artifact-layout";
var ARTIFACT_VIEWPORT_ZOOM_EVENT = "planr:artifact-viewport-zoom";
var ARTIFACT_VIEWPORT_PAN_EVENT = "planr:artifact-viewport-pan";
var ARTIFACT_EXPORT_MAX_EDGE = 11e3;
var ARTIFACT_EXPORT_MAX_DATA_URL = 24 * 1024 * 1024;
var ARTIFACT_LAYOUT_MAX_WIDTH = 16384;
var ARTIFACT_LAYOUT_MAX_HEIGHT = 262144;
var ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/;
var SCRIPT_NONCE_RE = /^[A-Za-z0-9_-]{24}$/;
var FORBIDDEN_TAGS = /* @__PURE__ */ new Set([
  "applet",
  "base",
  "embed",
  "fencedframe",
  "form",
  "frame",
  "frameset",
  "iframe",
  "noembed",
  "noframes",
  "noscript",
  "object",
  "portal"
]);
var URL_ATTRIBUTES = /* @__PURE__ */ new Set([
  "action",
  "archive",
  "background",
  "classid",
  "codebase",
  "formaction",
  "href",
  "longdesc",
  "manifest",
  "ping",
  "profile",
  "src",
  "srcdoc",
  "target",
  "xlink:href"
]);
var REMOTE_URL_RE = /^(?:https?:|file:|ftp:|wss?:|\/\/)/i;
function pipelineError(code, message, details) {
  return new PipelineError(code, message, "", details);
}
function getAttr(node, name) {
  return node.attrs?.find((attribute) => attribute.name.toLowerCase() === name)?.value;
}
function setAttr(node, name, value) {
  const existing = node.attrs?.find((attribute) => attribute.name.toLowerCase() === name);
  if (existing) existing.value = value;
  else (node.attrs ??= []).push({ name, value });
}
function createElement(tagName) {
  return parseFragment(`<${tagName}></${tagName}>`).childNodes[0];
}
function createText(value, parentNode) {
  return { nodeName: "#text", value, parentNode };
}
function descendants(node) {
  return [...node?.childNodes ?? [], ...node?.content?.childNodes ?? []];
}
function removeNode(node) {
  const parent = node.parentNode;
  const index = parent?.childNodes?.indexOf(node) ?? -1;
  if (index >= 0) parent.childNodes.splice(index, 1);
}
function findElement(document2, tagName) {
  const queue = descendants(document2);
  while (queue.length > 0) {
    const node = queue.shift();
    if (node?.tagName?.toLowerCase() === tagName) return node;
    queue.push(...descendants(node));
  }
  return null;
}
function createArtifactBridgeNonce({ randomBytesImpl = randomBytes3 } = {}) {
  return mintCapabilityToken({ bytes: 32, randomBytesImpl });
}
function artifactContentSecurityPolicy(scriptNonce) {
  if (typeof scriptNonce !== "string" || !SCRIPT_NONCE_RE.test(scriptNonce)) {
    throw pipelineError(ARTIFACT_ERROR_CODES.SANDBOX_POLICY, "Artifact script nonce is invalid.");
  }
  return [
    "default-src 'none'",
    `script-src 'nonce-${scriptNonce}' data: blob:`,
    `script-src-elem 'nonce-${scriptNonce}' data: blob:`,
    "script-src-attr 'unsafe-inline'",
    "style-src 'unsafe-inline' data: blob:",
    "img-src data: blob:",
    "media-src data: blob:",
    "font-src data:",
    "worker-src data: blob:",
    "connect-src 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "object-src 'none'",
    "manifest-src 'none'",
    "form-action 'none'",
    "base-uri 'none'"
  ].join("; ");
}
function assertSandboxableTree(document2, { allowLocalForms = false } = {}) {
  const queue = descendants(document2);
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node?.tagName) {
      queue.push(...descendants(node));
      continue;
    }
    const tag = node.tagName.toLowerCase();
    if (FORBIDDEN_TAGS.has(tag) && !(tag === "form" && allowLocalForms)) {
      throw pipelineError(
        ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
        `Unsafe <${tag}> cannot enter an artifact review sandbox.`
      );
    }
    if (tag === "meta" && getAttr(node, "http-equiv")?.trim().toLowerCase() === "refresh") {
      throw pipelineError(
        ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
        "Meta refresh navigation is forbidden."
      );
    }
    for (const attribute of node.attrs ?? []) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (["srcdoc", "target", "action", "formaction"].includes(name)) {
        throw pipelineError(
          ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
          `Artifact navigation attribute ${name} is forbidden.`
        );
      }
      if (URL_ATTRIBUTES.has(name) && REMOTE_URL_RE.test(value)) {
        throw pipelineError(
          ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
          `Remote artifact resource is forbidden: ${value.slice(0, 80)}`
        );
      }
      if (name === "style" && /(?:@import|url\s*\(\s*['"]?(?:https?:|file:|\/\/))/i.test(value)) {
        throw pipelineError(ARTIFACT_ERROR_CODES.SANDBOX_POLICY, "Remote inline CSS is forbidden.");
      }
    }
    if (tag === "style") {
      const css = (node.childNodes ?? []).map((child) => child.value ?? "").join("");
      if (/(?:@import|url\s*\(\s*['"]?(?:https?:|file:|\/\/))/i.test(css)) {
        throw pipelineError(
          ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
          "Remote stylesheet resources are forbidden."
        );
      }
    }
    queue.push(...descendants(node));
  }
}
var SANDBOX_GUARD_LIMITS = Object.freeze({
  __PLANR_SANDBOX_EXPORT_MAX_EDGE__: String(ARTIFACT_EXPORT_MAX_EDGE),
  __PLANR_SANDBOX_EXPORT_MAX_DATA_URL__: String(ARTIFACT_EXPORT_MAX_DATA_URL),
  __PLANR_SANDBOX_LAYOUT_MAX_WIDTH__: String(ARTIFACT_LAYOUT_MAX_WIDTH),
  __PLANR_SANDBOX_LAYOUT_MAX_HEIGHT__: String(ARTIFACT_LAYOUT_MAX_HEIGHT)
});
function sandboxGuardFiller(name, template, keys) {
  const pattern = new RegExp(keys.join("|"), "gu");
  const unfilled = [...new Set(template.replace(pattern, "").match(/__PLANR_SANDBOX_[A-Z_]+__/gu))];
  const missing = keys.filter((key) => !template.includes(key));
  if (unfilled.length > 0 || missing.length > 0) {
    throw pipelineError(
      ARTIFACT_ERROR_CODES.BRIDGE_INVALID,
      `The generated ${name} does not match bridge.mjs (unfilled: ${unfilled.join(", ") || "none"}; missing: ${missing.join(", ") || "none"}). Run npm run generate.`
    );
  }
  return (values) => template.replace(pattern, (key) => {
    if (typeof values[key] !== "string") {
      throw pipelineError(
        ARTIFACT_ERROR_CODES.BRIDGE_INVALID,
        `The ${name} needs a string for ${key}; received ${typeof values[key]}.`
      );
    }
    return values[key];
  });
}
var fillFrameGuard = sandboxGuardFiller("frame guard", ARTIFACT_FRAME_GUARD_TEMPLATE, [
  "__PLANR_SANDBOX_CONTRACT__",
  "__PLANR_SANDBOX_BRIDGE_TOOLS__;",
  "__PLANR_SANDBOX_WORKER_GUARD__",
  ...Object.keys(SANDBOX_GUARD_LIMITS)
]);
var fillHostGuard = sandboxGuardFiller("host guard", ARTIFACT_HOST_GUARD_TEMPLATE, [
  "__PLANR_SANDBOX_CONFIG__",
  "__PLANR_SANDBOX_BRIDGE_TOOLS__;",
  ...Object.keys(SANDBOX_GUARD_LIMITS)
]);
function artifactGuardAndBridgeSource({ artifactId, nonce, parentOrigin }) {
  const contract = JSON.stringify({
    channel: ARTIFACT_BRIDGE_CHANNEL,
    schemaVersion: ARTIFACT_BRIDGE_VERSION,
    artifactId,
    nonce,
    parentOrigin
  });
  return fillFrameGuard({
    __PLANR_SANDBOX_CONTRACT__: contract,
    "__PLANR_SANDBOX_BRIDGE_TOOLS__;": renderArtifactBridgeToolsSource(),
    __PLANR_SANDBOX_WORKER_GUARD__: JSON.stringify(ARTIFACT_WORKER_GUARD_SOURCE),
    ...SANDBOX_GUARD_LIMITS
  });
}
function prepareArtifactDocument({
  html,
  artifactId,
  nonce,
  parentOrigin,
  scriptNonce = mintCapabilityToken({ bytes: 18 }),
  allowLocalForms = false,
  portable = false
} = {}) {
  if (typeof html !== "string" || html.length === 0) {
    throw pipelineError(ARTIFACT_ERROR_CODES.SANDBOX_POLICY, "Artifact HTML is required.");
  }
  if (typeof artifactId !== "string" || !ID_RE.test(artifactId)) {
    throw pipelineError(ARTIFACT_ERROR_CODES.SANDBOX_POLICY, "Artifact id is invalid.");
  }
  if (!isCapabilityToken(nonce)) {
    throw pipelineError(ARTIFACT_ERROR_CODES.SANDBOX_POLICY, "Artifact bridge nonce is invalid.");
  }
  const originMatch = /^http:\/\/127\.0\.0\.1:(\d{1,5})$/.exec(parentOrigin ?? "");
  const originPort = Number(originMatch?.[1]);
  if (!(portable && parentOrigin === "null") && (!originMatch || !Number.isInteger(originPort) || originPort < 1 || originPort > 65535 || String(originPort) !== originMatch[1])) {
    throw pipelineError(
      ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
      "Artifact parent origin must be IPv4 loopback."
    );
  }
  const document2 = parse(html, { sourceCodeLocationInfo: false });
  assertSandboxableTree(document2, { allowLocalForms });
  const head = findElement(document2, "head");
  if (!head)
    throw pipelineError(
      ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
      "Artifact document has no head element."
    );
  for (const node of [...descendants(head)]) {
    if (node?.tagName?.toLowerCase() === "meta") {
      const httpEquiv = getAttr(node, "http-equiv")?.trim().toLowerCase();
      if (httpEquiv === "content-security-policy") removeNode(node);
    }
  }
  const csp = artifactContentSecurityPolicy(scriptNonce);
  const hasViewport = descendants(head).some(
    (node) => node?.tagName?.toLowerCase() === "meta" && getAttr(node, "name")?.trim().toLowerCase() === "viewport"
  );
  const viewportMeta = hasViewport ? null : createElement("meta");
  if (viewportMeta) {
    setAttr(viewportMeta, "name", "viewport");
    setAttr(viewportMeta, "content", "width=device-width,initial-scale=1,viewport-fit=cover");
    viewportMeta.parentNode = head;
  }
  const cspMeta = createElement("meta");
  setAttr(cspMeta, "http-equiv", "Content-Security-Policy");
  setAttr(cspMeta, "content", csp);
  cspMeta.parentNode = head;
  const referrerMeta = createElement("meta");
  setAttr(referrerMeta, "name", "referrer");
  setAttr(referrerMeta, "content", "no-referrer");
  referrerMeta.parentNode = head;
  const bridge = createElement("script");
  setAttr(bridge, "nonce", scriptNonce);
  bridge.childNodes = [
    createText(artifactGuardAndBridgeSource({ artifactId, nonce, parentOrigin }), bridge)
  ];
  bridge.parentNode = head;
  const queue = descendants(document2);
  while (queue.length > 0) {
    const node = queue.shift();
    if (node?.tagName?.toLowerCase() === "script") setAttr(node, "nonce", scriptNonce);
    queue.push(...descendants(node));
  }
  head.childNodes = [
    cspMeta,
    referrerMeta,
    ...viewportMeta ? [viewportMeta] : [],
    bridge,
    ...head.childNodes ?? []
  ];
  return Object.freeze({ html: serialize(document2), csp, scriptNonce });
}
function renderArtifactParentRuntime({
  artifactBaseUrl,
  stageRuntimeUrl,
  adapterRuntimeUrl,
  nonce,
  inlineArtifacts
} = {}) {
  const canonicalPath = (value, { trailingSlash = false } = {}) => {
    if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("?") || value.includes("#") || /[\u0000-\u001f]/.test(value) || /%(?:00|2f|5c)/i.test(value) || (trailingSlash ? !value.endsWith("/") : value.endsWith("/")))
      return false;
    try {
      return value.split("/").filter(Boolean).every((segment) => {
        const decoded = decodeURIComponent(segment);
        return decoded !== "." && decoded !== ".." && !decoded.includes("/") && !decoded.includes("\\");
      });
    } catch {
      return false;
    }
  };
  const portable = inlineArtifacts && typeof inlineArtifacts === "object" && !Array.isArray(inlineArtifacts) && Object.values(inlineArtifacts).every((html) => typeof html === "string");
  if (!portable && !canonicalPath(artifactBaseUrl, { trailingSlash: true }) || !(canonicalPath(stageRuntimeUrl) || portable && /^data:text\/javascript;base64,[A-Za-z0-9+/=]+$/u.test(stageRuntimeUrl)) || adapterRuntimeUrl !== void 0 && !canonicalPath(adapterRuntimeUrl) || !isCapabilityToken(nonce)) {
    throw pipelineError(
      ARTIFACT_ERROR_CODES.BRIDGE_INVALID,
      "Artifact parent runtime configuration is invalid."
    );
  }
  const config = JSON.stringify({
    artifactBaseUrl,
    stageRuntimeUrl,
    adapterRuntimeUrl: adapterRuntimeUrl ?? null,
    nonce,
    inlineArtifacts: portable ? inlineArtifacts : null,
    channel: ARTIFACT_BRIDGE_CHANNEL,
    schemaVersion: ARTIFACT_BRIDGE_VERSION,
    anchorEvent: ARTIFACT_BRIDGE_EVENT,
    readyEvent: ARTIFACT_BRIDGE_READY_EVENT,
    layoutEvent: ARTIFACT_BRIDGE_LAYOUT_EVENT,
    viewportZoomEvent: ARTIFACT_VIEWPORT_ZOOM_EVENT,
    viewportPanEvent: ARTIFACT_VIEWPORT_PAN_EVENT,
    navigationEvent: "planr:artifact-navigation-blocked",
    frameCsp: [
      "default-src 'none'",
      "script-src 'unsafe-inline' data: blob:",
      "script-src-attr 'unsafe-inline'",
      "style-src 'unsafe-inline' data: blob:",
      "img-src data: blob:",
      "media-src data: blob:",
      "font-src data:",
      "worker-src data: blob:",
      "connect-src 'none'",
      "frame-src 'none'",
      "child-src 'none'",
      "object-src 'none'",
      "manifest-src 'none'",
      "form-action 'none'",
      "base-uri 'none'"
    ].join("; ")
  });
  return fillHostGuard({
    __PLANR_SANDBOX_CONFIG__: config,
    "__PLANR_SANDBOX_BRIDGE_TOOLS__;": renderArtifactBridgeToolsSource(),
    ...SANDBOX_GUARD_LIMITS
  });
}

// packages/artifact/lib/artifact/local-document.mjs
import { createHash } from "node:crypto";
import { readFileSync as readFileSync2, realpathSync, statSync } from "node:fs";
import { dirname as dirname2, extname, isAbsolute, relative, resolve as resolve2 } from "node:path";
import { Script } from "node:vm";
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
  maxBytes = 100 * 1024 * 1024,
  readSource,
  passive = false
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
  const document2 = parse(input.value.toString("utf8"));
  let head, body;
  const deferredScripts = [];
  const queue = [...children(document2)];
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
  const html = serialize(document2);
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
function validateDesignDocument(value) {
  const errors = validateJson(value, DESIGN_DOCUMENT_SCHEMA).map(
    ({ path, detail }) => `${path}: ${detail}`
  );
  if (errors.length > 0) return { ok: false, errors };
  for (const field of ["frames", "screens", "flows", "variants"]) {
    const seen = /* @__PURE__ */ new Set();
    for (const [index, item2] of (value[field] ?? []).entries()) {
      if (seen.has(item2.id))
        errors.push(`$.${field}[${index}].id: duplicate identity '${item2.id}'`);
      seen.add(item2.id);
    }
  }
  const screenIds = new Set(value.screens.map(({ id: id3 }) => id3));
  const orderedIds = new Set(value.screenOrder);
  for (const id3 of value.screenOrder) {
    if (!screenIds.has(id3)) errors.push(`$.screenOrder: unknown screen '${id3}'`);
  }
  for (const id3 of screenIds) {
    if (!orderedIds.has(id3)) errors.push(`$.screenOrder: missing screen '${id3}'`);
  }
  for (const [index, flow] of (value.flows ?? []).entries()) {
    for (const id3 of flow.screens) {
      if (!screenIds.has(id3)) errors.push(`$.flows[${index}].screens: unknown screen '${id3}'`);
    }
  }
  for (const [index, variant] of value.variants.entries()) {
    for (const id3 of Object.keys(variant.sources ?? {})) {
      if (!screenIds.has(id3)) errors.push(`$.variants[${index}].sources: unknown screen '${id3}'`);
    }
  }
  const selected = value.variants.find(({ id: id3 }) => id3 === value.selectedVariant);
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

// packages/design/lib/design/context.mjs
import { createHash as createHash2 } from "node:crypto";
import { existsSync as existsSync2, readdirSync as readdirSync2, readFileSync as readFileSync3, realpathSync as realpathSync2 } from "node:fs";
import { dirname as dirname3, join as join3, resolve as resolve3 } from "node:path";

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
var SHA256_K = /* @__PURE__ */ new Uint32Array([
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
  const words = new Uint32Array(64);
  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4);
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotr(words[index - 15], 7) ^ rotr(words[index - 15], 18) ^ words[index - 15] >>> 3;
      const s1 = rotr(words[index - 2], 17) ^ rotr(words[index - 2], 19) ^ words[index - 2] >>> 10;
      words[index] = words[index - 16] + s0 + words[index - 7] + s1 >>> 0;
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
      const temp1 = h + s1 + choice + SHA256_K[index] + words[index] >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const majority = a & b ^ a & c ^ b & c;
      const temp2 = s0 + majority >>> 0;
      h = g;
      g = f;
      f = e;
      e = d + temp1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2 >>> 0;
    }
    h0 = h0 + a >>> 0;
    h1 = h1 + b >>> 0;
    h2 = h2 + c >>> 0;
    h3 = h3 + d >>> 0;
    h4 = h4 + e >>> 0;
    h5 = h5 + f >>> 0;
    h6 = h6 + g >>> 0;
    h7 = h7 + h >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((part) => part.toString(16).padStart(8, "0")).join("");
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

// packages/protocol/src/workspace-contracts.mjs
var DESIGN_WORKSPACE_VERSION = "1.0.0";
var DESIGN_WORKSPACE_API = "/api/v1/design-workspaces";
var DESIGN_WORKSPACE_MAX_BYTES = 5 * 1024 * 1024;
var DESIGN_WORKSPACE_MAX_EVENT_BYTES = 256 * 1024;
var DESIGN_WORKSPACE_ID_PATTERN = "^[A-Za-z0-9_-]{22,64}$";
var id = { type: "string", pattern: DESIGN_WORKSPACE_ID_PATTERN };
var digest = { type: "string", pattern: "^[a-f0-9]{64}$" };
var b64 = { type: "string", pattern: "^[A-Za-z0-9_-]+$" };
var epoch = { type: "integer", minimum: 1, maximum: 2147483647 };
var cipherProperties = {
  iv: { ...b64, minLength: 16, maxLength: 16 },
  ciphertext: { ...b64, minLength: 22, maxLength: Math.ceil(DESIGN_WORKSPACE_MAX_BYTES * 4 / 3) }
};
var signature = { ...b64, minLength: 86, maxLength: 86 };
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
var schema = (name, properties, required = Object.keys(properties)) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.9.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: "1.9.0" },
  type: "object",
  additionalProperties: false,
  properties,
  required
});
var DESIGN_WORKSPACE_REVISION_SCHEMA = schema("design-workspace-revision", {
  id,
  epoch,
  reviewOf: digest,
  createdAt: { type: "string", format: "date-time" },
  ...cipherProperties,
  signature
});
var DESIGN_WORKSPACE_EVENT_SCHEMA = schema("design-workspace-event", {
  id,
  revisionId: id,
  reviewOf: digest,
  epoch,
  ...cipherProperties,
  publicKey,
  signature
});
var sealed = {
  type: "object",
  additionalProperties: false,
  required: ["iv", "ciphertext"],
  properties: cipherProperties
};
var DESIGN_WORKSPACE_CREATE_SCHEMA = schema("design-workspace-create", {
  schemaVersion: { const: DESIGN_WORKSPACE_VERSION },
  id,
  ownerPublicKey: publicKey,
  ownerAuthHash: digest,
  reviewerAuthHash: digest,
  epoch: { const: 1 },
  keyring: sealed,
  revision: DESIGN_WORKSPACE_REVISION_SCHEMA,
  operationId: id,
  signature
});
var DESIGN_WORKSPACE_SCHEMA = schema("design-review-workspace", {
  schemaVersion: { const: DESIGN_WORKSPACE_VERSION },
  id,
  version: epoch,
  epoch,
  currentRevision: id,
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
  ...schema(
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
function assertWorkspaceContract(value, contract) {
  const errors = validateJson(value, contract);
  if (errors.length)
    throw new TypeError(
      `Invalid ${contract["x-openplanr-contract"].id}: ${errors.slice(0, 5).map(({ path, detail }) => `${path}: ${detail}`).join("; ")}`
    );
  return value;
}
var DESIGN_WORKSPACE_SCHEMAS = Object.freeze({
  "design-review-workspace": DESIGN_WORKSPACE_SCHEMA,
  "design-workspace-create": DESIGN_WORKSPACE_CREATE_SCHEMA,
  "design-workspace-revision": DESIGN_WORKSPACE_REVISION_SCHEMA,
  "design-workspace-event": DESIGN_WORKSPACE_EVENT_SCHEMA,
  "design-review-bundle": DESIGN_REVIEW_BUNDLE_SCHEMA
});

// packages/protocol/src/review-experience-contracts.mjs
var text2 = { type: "string", maxLength: 16384 };
var id2 = { type: "string", minLength: 1, maxLength: 128 };
var digest2 = { type: "string", pattern: "^[a-f0-9]{64}$" };
var texts = { type: "array", maxItems: 256, items: text2 };
var closed = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required
});
var list = (items, maxItems = 256) => ({ type: "array", maxItems, items });
var schema2 = (name, properties, required) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `https://openplanr.dev/schemas/v1.10.0/${name}.schema.json`,
  "x-openplanr-contract": { id: name, version: "1.10.0" },
  ...closed(properties, required)
});
var DESIGN_REVIEW_CONTEXT_SCHEMA = schema2(
  "design-review-context",
  {
    kind: { const: "openplanr-design-review-context" },
    schemaVersion: { const: "1.0.0" },
    designId: id2,
    brief: closed({ purpose: text2, requests: { ...texts, maxItems: 3 }, audience: text2 }, [
      "purpose",
      "requests"
    ]),
    revisionSummary: text2,
    implementation: closed({
      tokens: list(closed({ name: id2, value: text2, description: text2 }, ["name", "value"]), 512),
      components: list(
        closed(
          {
            id: id2,
            name: text2,
            screenIds: list(id2),
            anchorIds: list(id2),
            states: list(closed({ name: id2, description: text2 })),
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
  screenId: id2,
  variantId: id2,
  frameId: id2,
  contentDigest: digest2,
  guidanceDigest: digest2
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
  contextDigest: digest2,
  fingerprints: list(DESIGN_FINGERPRINT_SCHEMA)
});
bundleV11.required.push("reviewContext", "contextDigest", "fingerprints");
var DESIGN_REVIEW_BUNDLE_V11_SCHEMA = bundleV11;
var item = closed(
  {
    pinId: id2,
    reviewId: id2,
    screenId: id2,
    revisionId: id2,
    text: text2,
    refinement: text2,
    stale: { type: "boolean" },
    author: text2,
    reviewOf: digest2,
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
var DESIGN_HANDOFF_SCHEMA = schema2(
  "design-review-handoff",
  {
    kind: { const: "openplanr-design-review-handoff" },
    schemaVersion: { const: "1.0.0" },
    title: text2,
    version: { type: "integer", minimum: 1 },
    status: { enum: ["draft", "approved"] },
    basis: closed({
      designId: id2,
      sourceRevision: digest2,
      contextDigest: digest2,
      reviewOf: digest2,
      selectedVariant: id2,
      feedbackDigest: digest2,
      verificationDigest: digest2,
      feedbackWatermark: { type: "integer", minimum: 0 }
    }),
    content: DESIGN_HANDOFF_CONTENT_SCHEMA,
    contentHash: digest2,
    markdown: { type: "string", maxLength: 2097152 },
    affectedScreens: list(id2),
    verificationGaps: texts,
    reviewNotes: list(closed({ reviewId: id2, text: text2 }), 1e4),
    approval: closed({ contentHash: digest2, at: { type: "string", format: "date-time" } })
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
  ...schema2(
    "design-review-metadata-payload",
    {
      schemaVersion: { const: "1.0.0" },
      kind: { enum: ["category", "disposition"] },
      author: { ...text2, minLength: 1, maxLength: 160 },
      reviewOf: digest2,
      pinId: id2,
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
    value?.schemaVersion === "1.1.0" ? DESIGN_REVIEW_BUNDLE_V11_SCHEMA : DESIGN_REVIEW_BUNDLE_SCHEMA
  );
  if (value.schemaVersion === "1.1.0") {
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
var reviewDigest = (value) => createHash2("sha256").update(canonicalizeJson(value)).digest("hex");
function emptyReviewContext(document2) {
  return {
    kind: "openplanr-design-review-context",
    schemaVersion: "1.0.0",
    designId: document2.id,
    brief: { purpose: "", requests: [] },
    implementation: { tokens: [], components: [], responsive: [], accessibility: [] }
  };
}
function loadReviewContext(root, document2, { readSource } = {}) {
  const file = join3(root, "review-context.json");
  if (!existsSync2(file)) return emptyReviewContext(document2);
  const context = JSON.parse(
    readSource ? readSource("review-context.json", root).value.toString("utf8") : readFileSync3(resolveLocalDocumentFile(root, "review-context.json"), "utf8")
  );
  assertReviewExperience(context, DESIGN_REVIEW_CONTEXT_SCHEMA);
  if (context.designId !== document2.id)
    throw new Error("Review context belongs to a different design.");
  const screens = new Set(document2.screenOrder);
  const ids = /* @__PURE__ */ new Set();
  for (const component of context.implementation.components) {
    if (ids.has(component.id)) throw new Error("Review component identities must be unique.");
    ids.add(component.id);
    if (component.screenIds?.some((id3) => !screens.has(id3)))
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
function reviewFingerprints({ document: document2, context, screen, variant, frame, sourceDigests }) {
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
  const { document: document2 } = current;
  const pick = (value, keys) => Object.fromEntries(
    keys.filter((key) => value?.[key] !== void 0).map((key) => [key, structuredClone(value[key])])
  );
  const context = current.reviewContext ?? emptyReviewContext(document2);
  return {
    kind: "openplanr-design-review-bundle",
    schemaVersion: "1.1.0",
    design: {
      ...pick(document2, [
        "id",
        "title",
        "defaultView",
        "selectedVariant",
        "screenOrder",
        "frames",
        "flows"
      ]),
      screens: document2.screens.map(
        (screen) => pick(screen, ["id", "title", "description", "anchors"])
      ),
      selectedVariant: document2.variants.some(
        (variant) => variant.id === state.selectedVariant && variant.status === "ready"
      ) ? state.selectedVariant : document2.selectedVariant,
      variants: document2.variants.filter((variant) => variant.status === "ready").map((variant) => pick(variant, ["id", "label", "status"]))
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
var localRoot = (file) => realpathSync2(dirname3(resolve3(file)));
function listDesignRevisions(file) {
  const root = localRoot(file);
  const pointer = JSON.parse(readFileSync3(join3(root, ".design/current.json"), "utf8"));
  const revisions = readdirSync2(join3(root, ".design/revisions")).filter((name) => /^[a-f0-9]{64}$/u.test(name)).map((revision) => {
    const value = JSON.parse(
      readFileSync3(join3(root, ".design/revisions", revision, "render.json"), "utf8")
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

// packages/design/lib/design/lint.mjs
import { readFileSync as readFileSync4 } from "node:fs";
import { fileURLToPath } from "node:url";

// packages/design/lib/design/tokens.mjs
var SPACING_STEP = 4;
var FRAMES = {
  desktop: { w: 1440, h: 1024 },
  tablet: { w: 834, h: 1194 },
  mobile: { w: 390, h: 844 }
};
var DEFAULT_FRAME = FRAMES.desktop;
var RESPONSIVE_FRAMES = [
  { name: "desktop", ...FRAMES.desktop },
  { name: "tablet", ...FRAMES.tablet },
  { name: "mobile", ...FRAMES.mobile }
];
function isOnSpacingScale(px) {
  const n = Math.abs(Number(px));
  if (!Number.isInteger(n)) return false;
  return n === 0 || n === 2 || n % SPACING_STEP === 0;
}
function nearestSpacing(px) {
  const v = Number(px) || 0;
  const n = Math.abs(v);
  const sign = v < 0 ? -1 : 1;
  const candidates = [.../* @__PURE__ */ new Set([0, 2, Math.round(n / SPACING_STEP) * SPACING_STEP])].sort(
    (a, b) => a - b
  );
  const best = candidates.reduce(
    (b, c) => Math.abs(c - n) <= Math.abs(b - n) ? c : b,
    candidates[0]
  );
  return sign * best;
}
function isCanonicalFrame({ w, h } = {}) {
  return Object.values(FRAMES).some((f) => f.w === Number(w) && f.h === Number(h));
}

// packages/design/lib/design/lint.mjs
var SPACING_PROP = /^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)(-(top|right|bottom|left|block|inline)(-(start|end))?)?$/;
var SIZING_PROP = /^(width|height|min-width|min-height|max-width|max-height|padding|margin|font-size|gap)/;
var COLOR_PROP = /^(color|background|background-color|border(-(top|right|bottom|left))?-color|outline-color|fill|stroke|caret-color|text-decoration-color)$/;
var COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|oklch\([^)]*\)/gi;
var SYSTEM_FONTS = /* @__PURE__ */ new Set([
  "inherit",
  "initial",
  "sans-serif",
  "serif",
  "monospace",
  "system-ui",
  "ui-sans-serif",
  "ui-monospace",
  "ui-serif",
  "-apple-system",
  "blinkmacsystemfont",
  "segoe ui",
  "roboto",
  "helvetica neue",
  "helvetica",
  "arial",
  "sfmono-regular",
  "sf mono",
  "menlo",
  "consolas",
  "liberation mono",
  "cursive"
]);
function literalColors(value) {
  return /gradient/i.test(value) ? [] : value.match(COLOR_LITERAL) || [];
}
function firstColor(value) {
  if (/var\(|gradient/i.test(value)) return null;
  const m = value.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|oklch\([^)]*\)|\b(?:white|black)\b/i);
  return m ? m[0] : null;
}
function firstFontFamily(value) {
  const first = value.split(",")[0].trim().replace(/^["']|["']$/g, "");
  return first ? first.toLowerCase() : null;
}
function declBlocks(html) {
  const blocks = [];
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    for (const b of cssDeclBlocks(m[1])) blocks.push(declsFromBlock(b));
  for (const m of html.matchAll(/style\s*=\s*(["'])([\s\S]*?)\1/gi))
    blocks.push(declsFromBlock(m[2]));
  return blocks;
}
function pxValues(value) {
  if (/\bvar\(|\bcalc\(/.test(value)) return [];
  const out = [];
  for (const m of value.matchAll(/-?\d+(?:\.\d+)?(px|rem|em)\b/g)) {
    const n = parseFloat(m[0]);
    out.push(/r?em/.test(m[1]) ? Math.round(n * 16 * 1e3) / 1e3 : n);
  }
  return out;
}
function declsFromBlock(block) {
  return block.split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
    const i = s.indexOf(":");
    if (i < 0) return null;
    return { prop: s.slice(0, i).trim().toLowerCase(), value: s.slice(i + 1).trim() };
  }).filter(Boolean);
}
function cssDeclBlocks(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [];
  let depth = 0;
  let buf = "";
  for (const ch of clean) {
    if (ch === "{") {
      depth += 1;
      buf = "";
      continue;
    }
    if (ch === "}") {
      if (depth >= 1) blocks.push(buf);
      depth -= 1;
      buf = "";
      continue;
    }
    if (depth >= 1) buf += ch;
  }
  return blocks;
}
function styleBlockDecls(html) {
  const out = [];
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const block of cssDeclBlocks(m[1])) {
      for (const d of declsFromBlock(block)) out.push({ ...d, where: "style" });
    }
  }
  return out;
}
function inlineStyleDecls(html) {
  const out = [];
  for (const m of html.matchAll(/style\s*=\s*(["'])([\s\S]*?)\1/gi)) {
    for (const d of declsFromBlock(m[2])) out.push({ ...d, where: "inline" });
  }
  return out;
}
function inlineSizingDrift(html) {
  const out = [];
  for (const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
    const attrs = m[2];
    const cls = /\bclass\s*=\s*(["'])([\s\S]*?)\1/i.exec(attrs);
    const style = /\bstyle\s*=\s*(["'])([\s\S]*?)\1/i.exec(attrs);
    if (!cls || !style) continue;
    const sized = declsFromBlock(style[2]).filter((d) => SIZING_PROP.test(d.prop));
    if (sized.length) {
      out.push({
        rule: "inline-sizing-drift",
        level: "warn",
        tag: m[1],
        class: cls[2].trim(),
        props: sized.map((d) => d.prop).join(", "),
        message: `<${m[1]} class="${cls[2].trim()}"> carries inline sizing (${sized.map((d) => d.prop).join(", ")}) \u2014 move it to the shared class so siblings can't drift`
      });
    }
  }
  return out;
}
function lintDesign(html, opts = {}) {
  const { designSystem = null } = opts;
  const errors = [];
  const warnings = [];
  const decls = [...styleBlockDecls(html), ...inlineStyleDecls(html)];
  for (const d of decls) {
    if (SPACING_PROP.test(d.prop)) {
      for (const px of pxValues(d.value)) {
        const scale = opts.spacing ?? designSystem?.spacing;
        const onScale = scale?.length ? scale.includes(Math.abs(px)) : isOnSpacingScale(px);
        if (!onScale) {
          errors.push({
            rule: "spacing-off-grid",
            level: "error",
            prop: d.prop,
            value: `${px}px`,
            suggestion: `${nearestSpacing(px)}px`,
            where: d.where,
            message: `${d.prop}: ${px}px is off the 4-point grid (${d.where}) \u2192 use ${nearestSpacing(px)}px`
          });
        }
      }
    }
    if (COLOR_PROP.test(d.prop)) {
      for (const lit of literalColors(d.value)) {
        warnings.push({
          rule: "color-not-token",
          level: "warn",
          prop: d.prop,
          value: lit,
          where: d.where,
          message: `${d.prop}: ${lit} is a raw color \u2014 use a design-system token via var(--\u2026)`
        });
      }
    }
    if ((d.prop === "font-family" || d.prop === "font") && designSystem?.fonts?.length) {
      const fam = firstFontFamily(d.value);
      const allowed = new Set(designSystem.fonts.map((f) => String(f.family || "").toLowerCase()));
      if (fam && !allowed.has(fam) && !SYSTEM_FONTS.has(fam)) {
        warnings.push({
          rule: "font-not-token",
          level: "warn",
          value: fam,
          where: d.where,
          message: `font "${fam}" is not in the design system (${[...allowed].join(", ") || "none"})`
        });
      }
    }
  }
  for (const block of declBlocks(html)) {
    const c = block.find((d) => d.prop === "color");
    const bg = block.find((d) => d.prop === "background" || d.prop === "background-color");
    if (!c || !bg) continue;
    const fg = firstColor(c.value);
    const back = firstColor(bg.value);
    if (!fg || !back) continue;
    const ratio = contrastRatio(fg, back);
    if (ratio != null && ratio < AA_NORMAL) {
      errors.push({
        rule: "contrast-below-aa",
        level: "error",
        value: `${ratio.toFixed(1)}:1`,
        fg,
        bg: back,
        message: `text/background contrast ${ratio.toFixed(1)}:1 is below AA 4.5:1 (${fg} on ${back})`
      });
    }
  }
  warnings.push(...inlineSizingDrift(html));
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    declarations: decls.length,
    summary: `${errors.length} error(s), ${warnings.length} warning(s)`
  };
}
function lintCanvasData(data, { frames } = {}) {
  const errors = [];
  for (const section of data?.sections || []) {
    for (const a of section.artboards || []) {
      const accepted = frames?.length ? frames.some((frame) => frame.width === a.width && frame.height === a.height) : isCanonicalFrame({ w: a.width, h: a.height });
      if (!accepted) {
        errors.push({
          rule: "frame-not-canonical",
          level: "error",
          artboard: a.id || a.label || "(unnamed)",
          value: `${a.width}\xD7${a.height}`,
          suggestion: `${FRAMES.desktop.w}\xD7${FRAMES.desktop.h}`,
          message: `artboard "${a.id || a.label || "?"}" is ${a.width}\xD7${a.height} \u2014 use the canonical ${FRAMES.desktop.w}\xD7${FRAMES.desktop.h} desktop frame`
        });
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
function extractCanvasData(html) {
  const m = /(?:var\s+DATA\s*=|__CANVAS_DATA\s*=)\s*(\{[\s\S]*?\})\s*;/.exec(html);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}
var isMain = process.argv[1] && fileURLToPath(new URL("./runtime/packages/design/lib/design/lint.mjs", import.meta.url).href) === process.argv[1];
if (isMain) {
  const expectStyles = process.argv.includes("--expect-styles");
  const files = process.argv.slice(2).filter((a) => a !== "--expect-styles");
  if (!files.length) {
    console.error("usage: node lib/design/lint.mjs [--expect-styles] <file.html> [<file2.html> \u2026]");
    process.exit(2);
  }
  let totalErrors = 0;
  let emptyParsed = false;
  for (const file of files) {
    let html;
    try {
      html = readFileSync4(file, "utf-8");
    } catch (e) {
      console.error(`\u2717 cannot read ${file}: ${e.message}`);
      totalErrors += 1;
      continue;
    }
    if (/\.s?css$/i.test(file) || !/<style[\s>]/i.test(html) && /\{[^}]*:[^}]*\}/.test(html)) {
      html = `<style>${html}</style>`;
    }
    const res = lintDesign(html);
    const data = extractCanvasData(html);
    const frame = data ? lintCanvasData(data) : { ok: true, errors: [] };
    const allErrors = [...res.errors, ...frame.errors];
    totalErrors += allErrors.length;
    console.log(
      `
${file} \u2014 ${res.declarations} declaration(s), ${allErrors.length} error(s), ${res.warnings.length} warning(s)`
    );
    for (const e of allErrors) console.log(`  \u2717 [${e.rule}] ${e.message}`);
    for (const w of res.warnings) console.log(`  \u26A0 [${w.rule}] ${w.message}`);
    if (res.declarations === 0) {
      emptyParsed = true;
      console.log(
        `  \u26A0 [no-styles-parsed] 0 CSS declarations found \u2014 point at COMPILED CSS, or wrap raw CSS as <style>\u2026</style>${expectStyles ? " (fails --expect-styles)" : ""}`
      );
    } else if (!allErrors.length && !res.warnings.length) {
      console.log("  \u2713 clean");
    }
  }
  process.exit(totalErrors ? 1 : expectStyles && emptyParsed ? 3 : 0);
}

// packages/design/lib/design/recommend-format.mjs
var DESIGN_FORMATS = Object.freeze(["prototype", "walkthrough", "canvas"]);
var EXPLORATORY_KEYWORDS = Object.freeze([
  "option",
  "options",
  "concept",
  "concepts",
  "explore",
  "exploration",
  "variant",
  "variants",
  "moodboard",
  "brainstorm",
  "compare",
  "comparison"
]);

// packages/design/lib/design/manifest.mjs
var DESIGN_SOURCES = Object.freeze(["spec", "png", "describe"]);
var CONTENT_PROVENANCE = Object.freeze(["spec", "inferred"]);
var FRAMEWORKS = Object.freeze(["vanilla", "react"]);
var NAV_MODES = Object.freeze(["anchor", "lazy"]);
var SCHEMA_VERSION = "1.0.0";
function defaultFramework(designFormat) {
  return designFormat === "canvas" ? "react" : "vanilla";
}
function buildManifest({
  designFormat,
  source,
  generatedAt,
  screens = [],
  contentProvenance = "spec",
  framework,
  navMode = null,
  screenName = "",
  iterations = 0,
  branch = "",
  specId = "",
  htmlFile = "",
  pretextTier = ""
} = {}) {
  if (!designFormat) throw new Error("buildManifest: designFormat is required");
  if (!source) throw new Error("buildManifest: source is required");
  if (!generatedAt) throw new Error("buildManifest: generatedAt is required");
  const manifest = {
    schema_version: SCHEMA_VERSION,
    design_format: designFormat,
    source,
    content_provenance: contentProvenance,
    framework: framework ?? defaultFramework(designFormat),
    screens: [...screens],
    screen_count: screens.length,
    iterations,
    generated_at: generatedAt
  };
  if (navMode) manifest.nav_mode = navMode;
  if (screenName) manifest.screen_name = screenName;
  if (branch) manifest.branch = branch;
  if (specId) manifest.spec_id = specId;
  if (htmlFile) manifest.html_file = htmlFile;
  if (pretextTier) manifest.pretext_tier = pretextTier;
  return manifest;
}

// packages/design/lib/design/studio.mjs
import { createHash as createHash3 } from "node:crypto";
import { readFileSync as readFileSync5 } from "node:fs";

// packages/design/lib/design/studio-render.mjs
var DESIGN_STUDIO_VERSION = "1.9.0";
var DESIGN_STUDIO_ASSETS = Object.freeze({
  style: "templates/studio/studio.css",
  runtime: "templates/studio/studio.js",
  enhancementsStyle: "templates/studio/enhancements.css",
  handoffCenterStyle: "templates/studio/handoff-center.css"
});
function applyDesignStudioTheme(preference) {
  if (!preference) {
    try {
      preference = localStorage.getItem("openplanr.design.theme");
    } catch {
    }
  }
  if (!["dark", "light", "system"].includes(preference)) preference = "dark";
  const resolved = preference === "system" ? globalThis.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark" : preference;
  Object.assign(document.documentElement.dataset, {
    planrTheme: resolved,
    designTheme: resolved,
    designThemePreference: preference
  });
  const modelNode = document.getElementById("planr-artifact-shell-model");
  if (modelNode) {
    try {
      const model = JSON.parse(modelNode.textContent);
      model.theme = resolved;
      modelNode.textContent = JSON.stringify(model);
    } catch {
    }
  }
  return { preference, resolved };
}
function applyDesignStudioResourcePolicy() {
  const root = document.querySelector(".planr-shell");
  if (!root || !document.documentElement.hasAttribute("data-design-studio")) return;
  if (globalThis.matchMedia?.("(pointer: coarse)").matches) {
    root.dataset.planrFrameBudget = "3";
    root.dataset.designResourceMode = "bounded";
  }
}
function designStudioThemeBootstrapSource() {
  return `(${applyDesignStudioTheme.toString()})();(${applyDesignStudioResourcePolicy.toString()})();`;
}
function button(label, attributes = "", className = "") {
  return `<button type="button"${className ? ` class="${className}"` : ""} ${attributes}>${escapeHtml(label)}</button>`;
}
var icons = {
  left: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  right: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  canvas: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  prototype: '<path d="m8 4 12 8-12 8Z"/>',
  walkthrough: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="m9 22 3-4 3 4M9 9h6M9 13h3"/>',
  share: '<path d="M12 16V3m-4 4 4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  export: '<path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/>',
  pointer: '<path d="m5 3 15 9-7 1-3 7Z"/>',
  comment: '<path d="M21 11a8 8 0 0 1-8 8H7l-4 3V11a9 9 0 0 1 18 0Z"/><path d="M8 9h8M8 13h5"/>'
};
function icon(name) {
  return `<svg class="design-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}
function iconButton(label, name, attributes = "", className = "") {
  return `<button type="button" class="${className}" ${attributes} title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${icon(name)}<span class="design-button-label">${escapeHtml(label)}</span></button>`;
}
function toolbar(document2) {
  return `<header class="planr-toolbar design-toolbar">
  <div class="design-toolbar-leading">
    ${iconButton("Screens", "left", 'data-design-toggle-nav aria-controls="design-navigator" aria-expanded="true"', "planr-toolbar-action design-panel-toggle")}
    <div class="planr-brand">${renderPlanrMark()}<span class="design-wordmark" aria-label="OpenPlanr">Open<span>Planr</span></span><span class="planr-title-block"><strong title="${escapeHtml(document2.title)}">${escapeHtml(document2.title)}</strong></span></div>
  </div>
  <div class="planr-segment design-view-picker" role="group" aria-label="Design view">${["canvas", "prototype", "walkthrough"].map((view) => iconButton(view[0].toUpperCase() + view.slice(1), view, `data-design-view="${view}" aria-pressed="${document2.defaultView === view}"`)).join("")}</div>
  <div class="design-toolbar-trailing">
    <span class="design-save-state" role="status" aria-live="polite" data-design-save-state>Loading studio</span>
    ${iconButton("Review", "right", 'data-planr-action="feedback" data-planr-review-label="Review" aria-controls="planr-review-rail" aria-expanded="true"', "planr-toolbar-action design-review-toggle")}
    ${iconButton("Share design", "share", 'data-planr-action="share" aria-haspopup="dialog"', "planr-toolbar-action design-share")}
    <details class="design-export"><summary aria-label="Export" title="Export">${icon("export")}</summary><div>${button("Portable HTML", 'data-design-export="html"')}${button("Screen PNG", 'data-design-export="png"')}</div></details>
  </div>
</header>`;
}
function navigator(document2) {
  const failed = document2.variants.filter(({ status }) => status === "failed");
  return `<nav class="design-navigator" id="design-navigator" aria-label="Design screens">
  <div class="design-nav-title"><strong>Screens <span>${document2.screenOrder.length}</span></strong>${iconButton("Close screens", "left", 'data-design-toggle-nav aria-controls="design-navigator" aria-expanded="true"', "design-nav-close")}</div>
  <label class="design-field" for="design-variant">Direction<select id="design-variant" data-design-variant>${document2.variants.map((variant) => `<option value="${escapeHtml(variant.id)}"${variant.status !== "ready" ? " disabled" : ""}>${escapeHtml(variant.label)}${variant.status === "failed" ? " \u2014 unavailable" : ""}</option>`).join("")}</select></label>
  ${document2.variants.filter(({ status }) => status === "ready").length > 1 ? `<label class="design-compare"><input type="checkbox" data-design-compare> Compare directions</label>` : ""}
  <div class="design-screen-list">${document2.screenOrder.map((screenId, index) => {
    const screen = document2.screens.find(({ id: id3 }) => id3 === screenId);
    return `<button type="button" class="design-screen" data-design-screen="${escapeHtml(screen.id)}" aria-current="${index === 0 ? "page" : "false"}" title="${escapeHtml(screen.title)}"><span class="design-screen-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(screen.title)}</span></button>`;
  }).join("")}</div>
  <div class="design-nav-footer"><span data-design-verification>Browser inspection pending</span><span class="design-local">Local workspace</span></div>
  ${failed.length ? `<details class="design-failed-variants"><summary>${failed.length} unavailable ${failed.length === 1 ? "direction" : "directions"}</summary>${failed.map((variant) => `<p><strong>${escapeHtml(variant.label)}</strong><br>${escapeHtml(variant.issue ?? "Generation did not complete. The previous design remains available.")}</p>`).join("")}</details>` : ""}
</nav>`;
}
function designNotes(document2) {
  const screens = document2.screens.filter(({ description }) => description);
  if (!screens.length) return "";
  return `<details class="design-guidance" data-design-notes><summary aria-controls="design-guidance-panel" aria-expanded="false">Notes <span>${screens.length}</span></summary><div class="design-guidance-panel" id="design-guidance-panel" role="region" aria-labelledby="design-guidance-title"><header><div><strong id="design-guidance-title">Design notes</strong><p>Implementation context stays outside the product UI.</p></div><button type="button" data-design-close-notes aria-label="Close design notes" title="Close design notes">\xD7</button></header>${screens.map(
    (screen, index) => `<details data-design-note-screen="${escapeHtml(screen.id)}"${index === 0 ? " open" : ""}><summary>${escapeHtml(screen.title)}</summary><p>${escapeHtml(screen.description)}</p></details>`
  ).join("")}</div></details>`;
}
function stageDetails(document2) {
  return `<div class="design-stage-context"><div><strong data-design-screen-title>${escapeHtml(document2.screens.find(({ id: id3 }) => id3 === document2.screenOrder[0]).title)}</strong><span data-design-stage-description>Every screen, one connected design</span></div><div class="design-stage-actions">${designNotes(document2)}<label class="design-frame-picker">Frame<select aria-label="Responsive frame" data-design-frame>${document2.frames.map((frame) => `<option value="${escapeHtml(frame.id)}">${escapeHtml(frame.label)} \xB7 ${frame.width} \xD7 ${frame.height}</option>`).join("")}</select></label></div></div>
	  <div class="design-canvas-tools" role="group" aria-label="Canvas controls"><div class="planr-segment design-interaction-picker" role="group" aria-label="Review mode">${iconButton("Interact", "pointer", 'data-planr-mode="interact" aria-pressed="true" aria-keyshortcuts="I"')}${iconButton("Annotate", "comment", 'data-planr-mode="comment" aria-pressed="false" aria-keyshortcuts="C"')}</div><span></span>${button("\u2212", 'data-design-zoom="out" aria-label="Zoom out"')}${button("100%", 'data-design-zoom="reset" aria-label="Reset zoom"')}${button("+", 'data-design-zoom="in" aria-label="Zoom in"')}<span></span>${button("Fit", 'data-design-fit aria-label="Fit all visible artboards"')}${button("Pan", 'data-design-pan aria-pressed="false" aria-label="Pan canvas" aria-keyshortcuts="H Space" title="Pan canvas (H). Hold Space to pan temporarily; Escape returns to Interact."')}</div>
  <div class="design-walkthrough-caption" hidden><div><span data-design-step></span><h2 data-design-narrative-title></h2><p data-design-narrative></p></div><div>${button("Previous", 'data-design-step-change="-1"')}${button("Next", 'data-design-step-change="1"')}</div></div>
  <div class="design-notice" role="status" aria-live="polite" hidden></div>`;
}
function directionDetails() {
  return `<section class="planr-domain-rail design-direction-review" data-planr-slot="domain-rail" aria-label="Direction review"><div><strong data-design-direction-label>Direction</strong><span data-design-selected-direction></span></div><div class="design-rating" role="group" aria-label="Rate this direction">${[1, 2, 3, 4, 5].map((rating) => button("\u2606", `data-design-rating="${rating}" aria-label="Rate ${rating} out of 5" aria-pressed="false"`)).join("")}</div>${button("Use this direction", "data-design-select-direction")}<details class="design-refinement"><summary>Refine this direction</summary><div><label for="design-remix">Refinement note<textarea id="design-remix" maxlength="8192" data-design-remix placeholder="What should change in the next iteration?"></textarea></label>${button("Save refinement note", "data-design-save-remix")}<p data-design-review-hint>Saved with your review for the next iteration.</p></div></details></section>`;
}
function earlierFeedback(pins) {
  if (!pins.length) return "";
  return `<section class="design-stale-feedback" aria-label="Earlier feedback"><details open><summary>Earlier feedback <span>${pins.length}</span></summary><p>These comments refer to an earlier revision or a missing anchor. Review them before resolving.</p>${pins.map((pin) => `<article data-design-stale-pin="${escapeHtml(pin.id)}"><div><strong>${escapeHtml(pin.screenId ?? pin.anchor?.screen ?? "Earlier screen")}</strong><span>Stale</span></div><p>${escapeHtml(pin.comment)}</p>${pin.anchor?.planrId ? `<small>Anchor: ${escapeHtml(pin.anchor.planrId)}</small>` : ""}</article>`).join("")}</details></section>`;
}
function renderDesignStudioMarkup({
  document: document2,
  envelope,
  entries,
  state = null,
  revision = null,
  verification = null,
  stalePins = [],
  reviewContext = null,
  contextDigest = null,
  fingerprints = []
} = {}, { stageRuntimeUrl = "./artifact-review-stage.js", renderShell, style = "", runtime = "" } = {}) {
  if (!document2 || !envelope)
    throw new TypeError("Design studio requires a design document and artifact envelope.");
  const artifactIds = new Set(envelope.artifacts.map(({ id: id3 }) => id3));
  for (const entry of entries) {
    if (!artifactIds.has(entry.artifactId) || !document2.screens.some(({ id: id3 }) => id3 === entry.screenId) || !document2.variants.some(({ id: id3, status }) => id3 === entry.variantId && status === "ready") || !document2.frames.some(({ id: id3 }) => id3 === entry.frameId)) {
      throw new TypeError(`Invalid design studio entry: ${entry.artifactId}.`);
    }
  }
  const activeEntry = entries.find(
    ({ variantId, screenId, frameId }) => variantId === document2.selectedVariant && screenId === document2.screenOrder[0] && frameId === document2.frames[0].id
  );
  if (!activeEntry)
    throw new TypeError("Design studio requires the selected direction and first screen/frame.");
  const payload = {
    schemaVersion: DESIGN_STUDIO_VERSION,
    document: document2,
    entries,
    state,
    revision,
    verification,
    reviewContext,
    contextDigest,
    fingerprints,
    artifactKinds: Object.fromEntries(
      envelope.artifacts.map((artifact) => [artifact.id, artifact.kind])
    ),
    staticArtifacts: envelope.artifacts.filter(
      (artifact) => artifact.kind !== "html" || /\bdata-(?:design|planr)-static(?:\s|=|>)/u.test(artifact.html || "")
    ).map((artifact) => artifact.id)
  };
  let html = renderShell(
    {
      envelope,
      viewer: {
        mode: "single",
        presentation: "canvas",
        activeArtifactId: activeEntry.artifactId
      },
      shell: {
        title: document2.title,
        theme: "dark",
        railOpen: true,
        zoom: 100
      }
    },
    { stageRuntimeUrl }
  );
  html = html.replace(
    /(<iframe\b[^>]*\bsandbox=")allow-scripts(")/g,
    "$1allow-scripts allow-forms$2"
  );
  html = html.replace(/<header class="planr-toolbar">[\s\S]*?<\/header>/, toolbar(document2));
  html = html.replace(
    '<div class="planr-workspace">',
    `<div class="planr-workspace">${navigator(document2)}`
  );
  html = html.replace(
    '<main class="planr-stage" aria-label="Artifact review stage">',
    `<main class="planr-stage" aria-label="Design canvas">${stageDetails(document2)}`
  );
  html = html.replace(/<section class="planr-domain-rail"[^>]*><\/section>/, directionDetails());
  html = html.replace("<h2>Review comments</h2>", "<h2>Review</h2>");
  html = html.replace(
    'aria-label="Close comments">\xD7',
    `aria-label="Close review" title="Close review">${icon("right")}`
  );
  html = html.replace("Overall note for the coding agent\u2026", "Summarize your review\u2026");
  html = html.replace(
    '<div class="planr-feedback-slot"',
    `${earlierFeedback(stalePins)}<div class="design-comment-action">${iconButton("Add comment", "comment", 'data-planr-action="add-comment" aria-pressed="false"')}</div><div class="planr-feedback-slot"`
  );
  html = html.replace(
    '<html lang="en"',
    `<html lang="en" data-design-studio="${DESIGN_STUDIO_VERSION}" data-design-opening="true"`
  );
  html = html.replace(
    "</head>",
    `<style>${style}</style><script>${designStudioThemeBootstrapSource()}</script></head>`
  );
  html = html.replace(
    "</body>",
    `<script type="application/json" id="planr-design-studio-payload">${embedJson(payload)}</script><script>${designStudioThemeBootstrapSource()}</script><script>${runtime}</script></body>`
  );
  return html;
}

// packages/design/lib/design/studio.mjs
var templateRoot = new URL("../../templates/studio/", new URL("./runtime/packages/design/lib/design/studio.mjs", import.meta.url).href);
function designStudioArtifactId(variantId, screenId, frameId) {
  const id3 = [
    "design",
    ...[variantId, screenId, frameId].map((value) => `${value.length}-${value}`)
  ].join(".");
  return id3.length <= 128 ? id3 : `design.${createHash3("sha256").update(JSON.stringify([variantId, screenId, frameId])).digest("hex")}`;
}
function createDesignStudioEntries(document2, envelope) {
  const ids = new Set(envelope.artifacts.map(({ id: id3 }) => id3));
  const entries = [];
  for (const variant of document2.variants.filter(({ status }) => status === "ready")) {
    for (const screenId of document2.screenOrder) {
      for (const frame of document2.frames) {
        const artifactId = designStudioArtifactId(variant.id, screenId, frame.id);
        if (!ids.has(artifactId))
          throw new Error(`Design studio is missing artifact ${artifactId}.`);
        entries.push({
          artifactId,
          variantId: variant.id,
          screenId,
          frameId: frame.id
        });
      }
    }
  }
  return entries;
}
function renderDesignStudio(input = {}, options = {}) {
  return renderDesignStudioMarkup(
    {
      ...input,
      entries: input.entries ?? createDesignStudioEntries(input.document, input.envelope)
    },
    {
      ...options,
      renderShell: renderArtifactShellDocument,
      style: ["studio.css", "enhancements.css", "handoff-center.css"].map((file) => readFileSync5(new URL(file, templateRoot), "utf8")).join("\n"),
      runtime: readFileSync5(new URL("studio.js", templateRoot), "utf8")
    }
  );
}

// packages/design/lib/design/document.mjs
var DESIGN_VIEWS = Object.freeze(["canvas", "prototype", "walkthrough"]);
var DESIGN_RENDERER_VERSION = "1.2.0";
var hash = (value) => createHash4("sha256").update(value).digest("hex");
var json = (value) => `${JSON.stringify(value, null, 2)}
`;
function readJson(path, fallback = void 0) {
  try {
    return JSON.parse(readFileSync6(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== void 0) return fallback;
    throw error;
  }
}
function atomicJson(path, value) {
  atomicBytes(path, json(value));
}
function atomicBytes(path, bytes) {
  mkdirSync2(dirname4(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync2(temporary, bytes, { mode: 384, flag: "wx" });
    renameSync2(temporary, path);
  } finally {
    rmSync2(temporary, { force: true });
  }
}
function recoverDesignPublication(root, { ownsRenderLock = false } = {}) {
  const journalPath = join4(root, ".design/publication.json");
  let journal = readJson(journalPath, null);
  if (!journal) return;
  const lockPath = join4(root, ".design/render.lock");
  let recoveryOwner;
  if (!ownsRenderLock) {
    const lock = readJson(lockPath, null);
    if (lock && isProcessAlive(lock.pid)) return;
    if (lock) rmSync2(lockPath, { force: true });
    recoveryOwner = randomUUID();
    let descriptor;
    try {
      descriptor = openSync(lockPath, "wx", 384);
      writeFileSync2(
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
    const pointer = readJson(join4(root, ".design/current.json"), null);
    const manifestPath = join4(root, "finalized.json");
    if (pointer?.revision === journal.revision) atomicJson(manifestPath, journal.manifest);
    else if ((pointer?.revision ?? null) === journal.previousRevision) {
      if (journal.previousManifest === null) rmSync2(manifestPath, { force: true });
      else atomicBytes(manifestPath, Buffer.from(journal.previousManifest, "base64"));
    } else if (pointer?.revision && /^[a-f0-9]{64}$/u.test(pointer.revision)) {
      atomicJson(
        manifestPath,
        readJson(join4(root, ".design/revisions", pointer.revision, "render.json")).manifest
      );
    } else
      throw new Error("Design publication recovery could not identify the committed revision.");
    rmSync2(journalPath, { force: true });
  } finally {
    if (recoveryOwner && readJson(lockPath, null)?.owner === recoveryOwner)
      rmSync2(lockPath, { force: true });
  }
}
function loadDesignDocument(file, { readSource } = {}) {
  const checked = readSource?.(file, process.cwd());
  const path = checked?.file ?? realpathSync3(resolve4(file));
  const document2 = assertDesignDocument(
    checked ? JSON.parse(checked.value.toString("utf8")) : readJson(path)
  );
  return { path, root: dirname4(path), document: document2 };
}
function designSpecPath(root) {
  return /(?:^|\/)output\/feats\/feat-[^/]+\/design$/u.test(root.replaceAll("\\", "/")) ? join4(dirname4(root), "design-spec.md") : join4(root, "design-spec.md");
}
function inspectDesignDocument(file, { readSource } = {}) {
  const { path, root, document: document2 } = loadDesignDocument(file, { readSource });
  const sources = new Set(document2.assets ?? []);
  if (existsSync3(join4(root, "review-context.json"))) sources.add("review-context.json");
  if (document2.designSystem?.tokens) sources.add(document2.designSystem.tokens);
  for (const screen of document2.screens)
    for (const source of [
      screen.source,
      ...document2.variants.filter((variant) => variant.status === "ready").map((variant) => variant.sources?.[screen.id]).filter(Boolean)
    ]) {
      sources.add(source.html);
      for (const item2 of [...source.styles ?? [], ...source.scripts ?? []]) sources.add(item2);
    }
  const missing = [];
  for (const source of sources) {
    try {
      if (readSource) readSource(source, root);
      else resolveLocalDocumentFile(root, source);
    } catch (error) {
      missing.push({ path: source, message: error.message });
    }
  }
  return {
    ok: missing.length === 0,
    path,
    root,
    document: document2,
    sources: [...sources],
    missing,
    specPath: designSpecPath(root),
    // Guarded source preparation is independent of local render cache state.
    current: readSource ? null : readJson(join4(root, ".design/current.json"), null)
  };
}
function prepareDesignDocument(file, { readSource, passive = false, maxBytes } = {}) {
  const inspected = inspectDesignDocument(file, { readSource });
  if (!inspected.ok)
    throw new Error(inspected.missing.map((item2) => `${item2.path}: ${item2.message}`).join("\n"));
  const { document: document2, root } = inspected;
  const reviewContext = loadReviewContext(root, document2, { readSource });
  const contextDigest = reviewDigest(reviewContext);
  const fingerprints = [];
  const artifacts = [], entries = [], lint = [], sourceFiles = new Set(inspected.sources);
  const sourceContents = new Map(
    inspected.sources.map((source) => [
      source,
      readSource ? readSource(source, root).value : readFileSync6(resolveLocalDocumentFile(root, source))
    ])
  );
  for (const variant of document2.variants.filter((item2) => item2.status === "ready")) {
    for (const screenId of document2.screenOrder) {
      const screen = document2.screens.find((item2) => item2.id === screenId);
      const bundled = bundleLocalDocument({
        root,
        source: variant.sources?.[screenId] ?? screen.source,
        sharedStyles: document2.designSystem?.tokens ? [document2.designSystem.tokens] : [],
        screenId,
        readSource,
        passive,
        ...maxBytes === void 0 ? {} : { maxBytes }
      });
      const navigate = `<script>document.addEventListener('click',function(event){var link=event.target.closest('[data-design-target],[data-planr-navigate],[data-design-navigate]');if(!link)return;event.preventDefault();parent.postMessage({type:'openplanr:design-navigate',screenId:link.getAttribute('data-design-target')||link.getAttribute('data-planr-navigate')||link.getAttribute('data-design-navigate')},'*')});document.addEventListener('submit',function(event){event.preventDefault()});</script>`;
      if (!passive) bundled.html = bundled.html.replace("</body>", `${navigate}</body>`);
      for (const name of bundled.files) {
        sourceFiles.add(name);
        if (!sourceContents.has(name))
          sourceContents.set(
            name,
            readSource ? readSource(name, root).value : readFileSync6(resolveLocalDocumentFile(root, name))
          );
        if (hash(sourceContents.get(name)) !== bundled.sourceDigests[name])
          throw new Error(
            `Source ${name} changed during rendering. Retry with the completed source revision.`
          );
      }
      const report = lintDesign(bundled.html, {
        designSystem: document2.designSystem
      });
      lint.push({ variantId: variant.id, screenId, ...report });
      for (const anchor of screen.anchors ?? []) {
        if (!bundled.html.includes(`data-planr-id="${anchor}"`) && !bundled.html.includes(`id="${anchor}"`))
          throw new Error(`Screen ${screenId} is missing its declared anchor ${anchor}.`);
      }
      for (const frame of document2.frames) {
        fingerprints.push(
          reviewFingerprints({
            document: document2,
            context: reviewContext,
            screen,
            variant,
            frame,
            sourceDigests: bundled.sourceDigests
          })
        );
        const artifactId = designStudioArtifactId(
          `${document2.id}-${variant.id}`,
          screenId,
          frame.id
        );
        artifacts.push({
          id: artifactId,
          kind: "html",
          title: `${screen.title} \xB7 ${variant.label} \xB7 ${frame.label}`,
          html: bundled.html,
          viewport: { width: frame.width, height: frame.height },
          colorScheme: "light"
        });
        entries.push({
          artifactId,
          screenId,
          variantId: variant.id,
          frameId: frame.id
        });
      }
    }
  }
  const activeArtifactId = [...artifacts].sort((a, b) => a.id.localeCompare(b.id))[0].id;
  const envelope = createArtifactEnvelope({
    artifacts,
    viewer: {
      mode: artifacts.length > 1 ? "variants" : "single",
      activeArtifactId,
      presentation: "canvas"
    }
  });
  const revision = hash(
    json({ document: document2, contextDigest, digest: digestArtifactEnvelope(envelope) })
  );
  return {
    ...inspected,
    reviewContext,
    contextDigest,
    fingerprints,
    envelope,
    entries,
    revision,
    lint,
    sourceFiles: [...sourceFiles],
    sourceContents
  };
}
function currentDesign(file) {
  const root = realpathSync3(dirname4(resolve4(file)));
  recoverDesignPublication(root);
  const pointer = readJson(join4(root, ".design/current.json"), null);
  if (!pointer || !/^[a-f0-9]{64}$/u.test(pointer.revision))
    throw new Error("Design has no completed render. Run the render utility first.");
  const directory = join4(root, ".design/revisions", pointer.revision);
  const prepared = readJson(join4(directory, "render.json"));
  return {
    ...prepared,
    root,
    directory,
    file: resolve4(file),
    verification: readJson(join4(root, ".design/verification", `${pointer.revision}.json`), {
      status: "unverified",
      revision: pointer.revision
    })
  };
}
function stageRuntimeBytes() {
  const stagePath = new URL(
    "../../../artifact/templates/artifact-review-stage.js",
    new URL("./runtime/packages/design/lib/design/document.mjs", import.meta.url).href
  );
  try {
    return readFileSync6(stagePath);
  } catch {
    return readFileSync6(new URL("../../templates/artifact-review-stage.js", new URL("./runtime/packages/design/lib/design/document.mjs", import.meta.url).href));
  }
}
function designRendererRevision() {
  return hash(
    json({
      version: DESIGN_RENDERER_VERSION,
      stage: hash(stageRuntimeBytes()),
      assets: ["studio.css", "studio.js", "enhancements.css", "handoff-center.css"].filter((name) => existsSync3(new URL(`../../templates/studio/${name}`, new URL("./runtime/packages/design/lib/design/document.mjs", import.meta.url).href))).map(
        (name) => hash(readFileSync6(new URL(`../../templates/studio/${name}`, new URL("./runtime/packages/design/lib/design/document.mjs", import.meta.url).href)))
      )
    })
  );
}
function standaloneDesignHtml(prepared, view = prepared.document.defaultView) {
  const nonce = createArtifactBridgeNonce();
  const artifacts = Object.fromEntries(
    prepared.envelope.artifacts.map((artifact) => [
      artifact.id,
      prepareArtifactDocument({
        html: artifact.html,
        artifactId: artifact.id,
        nonce,
        parentOrigin: "null",
        portable: true,
        allowLocalForms: true
      }).html
    ])
  );
  const stage = stageRuntimeBytes();
  const stageRuntimeUrl = `data:text/javascript;base64,${Buffer.from(stage).toString("base64")}`;
  const runtime = renderArtifactParentRuntime({
    nonce,
    parentOrigin: "null",
    inlineArtifacts: artifacts,
    stageRuntimeUrl
  });
  const runtimeUrl = `data:text/javascript;base64,${Buffer.from(runtime).toString("base64")}`;
  const state = { ...prepared.state, view };
  if (state.selectedVariant) state.variantId = state.selectedVariant;
  return renderDesignStudio(
    {
      ...prepared,
      state,
      verification: prepared.verification ?? { status: "unverified" }
    },
    { stageRuntimeUrl: runtimeUrl }
  );
}
async function renderDesignDocument(file, {
  beforeCommit,
  writePointer = atomicJson,
  rendererRevision = designRendererRevision(),
  now = () => (/* @__PURE__ */ new Date()).toISOString()
} = {}) {
  const { root } = loadDesignDocument(file);
  const work = join4(root, ".design");
  mkdirSync2(work, { recursive: true });
  const release = await acquireStartLock(join4(work, "render.lock"), {
    timeout: 1e3,
    stale: 3e4
  });
  let temporary;
  try {
    recoverDesignPublication(root, { ownsRenderLock: true });
    const prepared = prepareDesignDocument(file);
    const errors = prepared.lint.flatMap(
      (item2) => item2.errors.map((error) => `${item2.screenId}: ${error.message}`)
    );
    if (errors.length) throw new Error(`Design lint failed:
${errors.join("\n")}`);
    const specPath = designSpecPath(root);
    const spec = readFileSync6(specPath, "utf8");
    for (let section = 1; section <= 10; section++)
      if (!new RegExp(`^## ${section}\\. `, "m").test(spec))
        throw new Error(`design-spec.md is missing section ${section}.`);
    prepared.revision = hash(json({ source: prepared.revision, spec, rendererRevision }));
    const directory = join4(work, "revisions", prepared.revision);
    const previous = readJson(join4(work, "current.json"), null);
    const generatedAt = now();
    const manifest = existsSync3(directory) ? readJson(join4(directory, "render.json")).manifest : buildManifest({
      framework: "vanilla",
      designFormat: prepared.document.defaultView,
      source: prepared.document.brief.source,
      contentProvenance: prepared.document.brief.provenance,
      generatedAt,
      screens: prepared.document.screenOrder.map(
        (id3) => prepared.document.screens.find((item2) => item2.id === id3).title
      ),
      iterations: previous && previous.revision !== prepared.revision ? (previous.iterations ?? 0) + 1 : previous?.iterations ?? 0,
      htmlFile: `.design/revisions/${prepared.revision}/${prepared.document.defaultView}.html`
    });
    const record = {
      reviewContext: prepared.reviewContext,
      contextDigest: prepared.contextDigest,
      fingerprints: prepared.fingerprints,
      document: prepared.document,
      envelope: prepared.envelope,
      entries: prepared.entries,
      revision: prepared.revision,
      rendererRevision,
      lint: prepared.lint,
      manifest
    };
    if (!existsSync3(directory)) {
      temporary = join4(work, `pending-${randomUUID()}`);
      mkdirSync2(join4(temporary, "sources"), { recursive: true });
      writeFileSync2(join4(temporary, "render.json"), json(record));
      writeFileSync2(join4(temporary, "design-document.json"), json(prepared.document));
      writeFileSync2(join4(temporary, "design-spec.md"), spec);
      for (const source of prepared.sourceFiles) {
        const destination = join4(temporary, "sources", source);
        mkdirSync2(dirname4(destination), { recursive: true });
        writeFileSync2(destination, prepared.sourceContents.get(source));
      }
      for (const view of DESIGN_VIEWS)
        writeFileSync2(join4(temporary, `${view}.html`), standaloneDesignHtml(record, view));
      beforeCommit?.(record);
      mkdirSync2(dirname4(directory), { recursive: true });
      renameSync2(temporary, directory);
      temporary = null;
    }
    const manifestPath = join4(root, "finalized.json");
    atomicJson(join4(work, "publication.json"), {
      revision: prepared.revision,
      previousRevision: previous?.revision ?? null,
      manifest,
      previousManifest: existsSync3(manifestPath) ? readFileSync6(manifestPath).toString("base64") : null
    });
    try {
      atomicJson(manifestPath, manifest);
      writePointer(join4(work, "current.json"), {
        revision: prepared.revision,
        previousRevision: previous?.revision === prepared.revision ? previous.previousRevision : previous?.revision ?? null,
        iterations: manifest.iterations,
        generatedAt: manifest.generated_at
      });
      rmSync2(join4(work, "publication.json"), { force: true });
    } catch (error) {
      recoverDesignPublication(root, { ownsRenderLock: true });
      throw error;
    }
    return {
      ok: true,
      revision: prepared.revision,
      document: resolve4(file),
      artifact: join4(directory, `${prepared.document.defaultView}.html`),
      views: Object.fromEntries(
        DESIGN_VIEWS.map((view) => [view, join4(directory, `${view}.html`)])
      ),
      manifest: join4(root, "finalized.json"),
      spec: specPath,
      verification: "unverified"
    };
  } finally {
    if (temporary) rmSync2(temporary, { recursive: true, force: true });
    release();
  }
}

export {
  configuredPlanrHome,
  planrHome,
  LOOPBACK_HOST,
  listenLoopback,
  closeHttpServer,
  readRequestBody,
  assertLoopbackRequest,
  acquireStartLock,
  mintCapabilityToken,
  isCapabilityToken,
  timingSafeTokenEqual,
  createArtifactBridgeNonce,
  prepareArtifactDocument,
  renderArtifactParentRuntime,
  canonicalizeJson,
  sha256Hex,
  deepFreeze,
  assertPlainData,
  DESIGN_WORKSPACE_VERSION,
  DESIGN_WORKSPACE_API,
  DESIGN_WORKSPACE_MAX_BYTES,
  DESIGN_WORKSPACE_MAX_EVENT_BYTES,
  DESIGN_WORKSPACE_REVISION_SCHEMA,
  DESIGN_WORKSPACE_EVENT_SCHEMA,
  DESIGN_WORKSPACE_CREATE_SCHEMA,
  DESIGN_WORKSPACE_SCHEMA,
  assertWorkspaceContract,
  DESIGN_HANDOFF_CONTENT_SCHEMA,
  DESIGN_HANDOFF_SCHEMA,
  assertReviewExperience,
  assertDesignReviewMetadata,
  assertDesignReviewBundle,
  reviewDigest,
  emptyReviewContext,
  bundleDesignRevision,
  listDesignRevisions,
  readDesignRevision,
  renderDesignStudio,
  DESIGN_VIEWS,
  DESIGN_RENDERER_VERSION,
  hash,
  json,
  readJson,
  atomicJson,
  recoverDesignPublication,
  loadDesignDocument,
  designSpecPath,
  inspectDesignDocument,
  prepareDesignDocument,
  currentDesign,
  designRendererRevision,
  standaloneDesignHtml,
  renderDesignDocument
};
