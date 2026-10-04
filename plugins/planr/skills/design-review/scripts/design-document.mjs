import {
  acquireStartLock,
  isProcessAlive
} from "./design-planr-home.mjs";
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
  ARTIFACT_MAX_SOURCES,
  ARTIFACT_MAX_VIEWS,
  MAX_ARTIFACT_HTML_BYTES,
  PipelineError,
  contrastRatio,
  createSharedArtifactEnvelope,
  digestArtifactEnvelope,
  embedJson,
  escapeHtml,
  renderArtifactShellDocument,
  renderPlanrMark,
  resolveArtifactHtml
} from "./design-artifact-shell.mjs";
import {
  DESIGN_REVIEW_BUNDLE_SCHEMA,
  assertDesignDocument,
  canonicalizeJson,
  sha256Hex,
  validateJson
} from "./design-bounded-json-data.mjs";
import {
  ARTIFACT_FRAME_GUARD_TEMPLATE,
  ARTIFACT_HOST_GUARD_TEMPLATE,
  ARTIFACT_WORKER_GUARD_SOURCE
} from "./design-sandbox-guards.mjs";

// packages/design/lib/design/document.mjs
import { createHash as createHash5, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync as existsSync3,
  mkdirSync,
  openSync,
  readFileSync as readFileSync6,
  realpathSync as realpathSync3,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname as dirname3, join as join2, resolve as resolve4 } from "node:path";

// packages/artifact/lib/artifact/bridge.mjs
import { randomBytes as randomBytes2 } from "node:crypto";

// packages/artifact/lib/artifact/internal/board-token.mjs
import { randomBytes, timingSafeEqual } from "node:crypto";
var BASE64URL_TOKEN_RE = /^[A-Za-z0-9_-]+$/;
function mintCapabilityToken({
  bytes = 32,
  encoding = "base64url",
  randomBytesImpl = randomBytes
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
function createArtifactViewportGestures(window2, emit) {
  const add = window2.addEventListener.bind(window2), remove = window2.removeEventListener.bind(window2);
  const schedule = window2.setTimeout.bind(window2), cancel = window2.clearTimeout.bind(window2);
  const prevent = window2.Event.prototype.preventDefault, stop = window2.Event.prototype.stopImmediatePropagation;
  const getter = (prototype, name) => Object.getOwnPropertyDescriptor(prototype, name)?.get;
  const native = {
    x: getter(window2.MouseEvent.prototype, "clientX"),
    y: getter(window2.MouseEvent.prototype, "clientY"),
    ctrl: getter(window2.MouseEvent.prototype, "ctrlKey"),
    meta: getter(window2.MouseEvent.prototype, "metaKey"),
    shift: getter(window2.MouseEvent.prototype, "shiftKey"),
    deltaX: getter(window2.WheelEvent.prototype, "deltaX"),
    deltaY: getter(window2.WheelEvent.prototype, "deltaY"),
    mode: getter(window2.WheelEvent.prototype, "deltaMode")
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
    const scaleX = mode === 1 ? 16 : mode === 2 ? window2.innerWidth : 1;
    const scaleY = mode === 1 ? 16 : mode === 2 ? window2.innerHeight : 1;
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
        { width: window2.innerWidth, height: window2.innerHeight }
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
function createArtifactBridgeTools(document2, window2) {
  const fromPoint = document2.elementFromPoint.bind(document2);
  const query = document2.querySelectorAll.bind(document2);
  const attr2 = window2.Element.prototype.getAttribute;
  const closest = window2.Element.prototype.closest;
  const bounds = window2.Element.prototype.getBoundingClientRect;
  const computed = window2.getComputedStyle.bind(window2);
  const cloneNode = window2.Node.prototype.cloneNode;
  const append = window2.Node.prototype.appendChild;
  const create = document2.createElement.bind(document2);
  const setAttribute = window2.Element.prototype.setAttribute;
  const serialize2 = window2.XMLSerializer.prototype.serializeToString;
  const Image = window2.Image;
  const Serializer = window2.XMLSerializer;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const get = (element2, key) => attr2.call(element2, key);
  const validId = (id2) => typeof id2 === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/.test(id2);
  const screen = (element2) => {
    const owner = closest.call(element2, "[data-planr-screen]");
    const value = owner && get(owner, "data-planr-screen");
    return typeof value === "string" && /^[^\u0000-\u001f\u007f]{1,128}$/.test(value) ? value : void 0;
  };
  const clean = (value) => String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 256);
  const inspectElement = (element2) => {
    if (!(element2 instanceof window2.Element)) return null;
    const tagName = element2.localName;
    if (typeof tagName !== "string" || !/^[a-z][a-z0-9-]{0,63}$/.test(tagName)) return null;
    const rect = bounds.call(element2), width = window2.innerWidth, height = window2.innerHeight;
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
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > window2.innerWidth || y > window2.innerHeight)
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
        const width = window2.innerWidth, height = window2.innerHeight;
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
        const markup = serialize2.call(new Serializer(), clone);
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
  const parent2 = treeAdapter.getParentNode(node);
  const parentTn = parent2 && treeAdapter.isElementNode(parent2) && treeAdapter.getTagName(parent2);
  return parentTn && treeAdapter.getNamespaceURI(parent2) === NS.HTML && hasUnescapedText(parentTn, options.scriptingEnabled) ? content : escapeText(content);
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

// packages/artifact/lib/artifact/ui/prototype-state.mjs
function installPrototypeState(screenId, viewId, parentOrigin, nonce) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(nonce)) return;
  const win = window;
  let snapshot = { session: {}, forms: {} }, restoring = false;
  let aliasFields = [];
  let aliasRestoreType = "";
  let aliasesConfigured = false;
  const earlyFields = /* @__PURE__ */ new Map();
  let sequence = 0, hostRevision = -1, acknowledgedSequence = 0, pendingReset = 0;
  const documentId = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
  let generation = null;
  const pendingSession = /* @__PURE__ */ new Map();
  let pendingForm = null;
  function valid(value) {
    let keys = 0;
    function visit(node, depth) {
      if (depth > 6) return false;
      if (node === null || typeof node === "boolean") return true;
      if (typeof node === "number") return Number.isFinite(node);
      if (typeof node === "string") return node.length <= 8192;
      if (Array.isArray(node))
        return node.length <= 128 && node.every((item2) => visit(item2, depth + 1));
      if (!node || typeof node !== "object" || Object.getPrototypeOf(node) !== Object.prototype)
        return false;
      return Object.entries(node).every(
        ([key, item2]) => ++keys <= 128 && key.length <= 256 && !["__proto__", "constructor", "prototype"].includes(key) && visit(item2, depth + 1)
      );
    }
    try {
      return !!value && Object.keys(value).every((key) => key === "session" || key === "forms") && !!value.session && !Array.isArray(value.session) && typeof value.session === "object" && !!value.forms && !Array.isArray(value.forms) && typeof value.forms === "object" && visit(value, 0) && new TextEncoder().encode(JSON.stringify(value)).byteLength <= 16384;
    } catch {
      return false;
    }
  }
  const post = (type, update) => win.parent.postMessage(
    {
      type,
      version: 1,
      nonce,
      screenId,
      viewId,
      documentId,
      generation,
      ...type === "openplanr:prototype-state" ? { state: snapshot, sequence, ...update } : {}
    },
    parentOrigin
  );
  const fields = () => [
    ...document.querySelectorAll(
      "input,textarea,select"
    )
  ].filter(
    (field) => !["password", "file", "hidden", "submit", "button", "reset"].includes(field.type) && !field.hasAttribute("data-planr-state-private")
  );
  const fieldKey = (field, index) => (field.id || field.name || `field-${index}`).slice(0, 256) + (field.type === "radio" ? `:${field.value}` : "");
  function capture(sessionValue = snapshot.session) {
    if (restoring) return;
    const form = {};
    fields().forEach((field, index) => {
      const input = field;
      form[fieldKey(field, index)] = ["checkbox", "radio"].includes(field.type) ? input.checked : field instanceof HTMLSelectElement && field.multiple ? [...field.selectedOptions].map((option) => option.value) : field.value;
    });
    const session = { ...sessionValue };
    for (const field of fields()) {
      if (aliasesConfigured && aliasFields.includes(field.id) && typeof field.value === "string" && field.value.length <= 4e3)
        session[field.id] = field.value;
    }
    const next = { session, forms: { ...snapshot.forms, [viewId]: form } };
    return commit(next);
  }
  function commit(next, reset = false) {
    if (!valid(next) || sequence === Number.MAX_SAFE_INTEGER) return false;
    const keys = [
      .../* @__PURE__ */ new Set([...Object.keys(snapshot.session), ...Object.keys(next.session)])
    ].filter(
      (key) => Object.hasOwn(snapshot.session, key) !== Object.hasOwn(next.session, key) || JSON.stringify(snapshot.session[key]) !== JSON.stringify(next.session[key])
    );
    const pending = new Map(pendingSession);
    if (reset) pending.clear();
    for (const key of keys)
      pending.set(key, {
        sequence: sequence + 1,
        present: Object.hasOwn(next.session, key),
        value: next.session[key]
      });
    if (pending.size > 256 || new TextEncoder().encode(JSON.stringify([...pending])).byteLength > 16384)
      return false;
    sequence++;
    pendingSession.clear();
    for (const [key, value] of pending) pendingSession.set(key, value);
    if (reset) {
      earlyFields.clear();
      pendingReset = sequence;
      pendingForm = null;
    } else if (Object.hasOwn(next.forms, viewId))
      pendingForm = { sequence, value: structuredClone(next.forms[viewId]) };
    snapshot = structuredClone(next);
    postPending();
    return true;
  }
  function postPending() {
    post("openplanr:prototype-state", {
      sessionKeys: [...pendingSession.keys()],
      sessionSequences: Object.fromEntries(
        [...pendingSession].map(([key, update]) => [key, update.sequence])
      ),
      ...pendingReset ? { reset: true, resetSequence: pendingReset } : {}
    });
  }
  function apply() {
    const form = snapshot.forms[viewId];
    if (!form) return;
    restoring = true;
    fields().forEach((field, index) => {
      const value = form[fieldKey(field, index)];
      if (value === void 0) return;
      if (["checkbox", "radio"].includes(field.type) && typeof value === "boolean")
        field.checked = value;
      else if (field instanceof HTMLSelectElement && field.multiple && Array.isArray(value))
        for (const option of field.options) option.selected = value.includes(option.value);
      else if (typeof value === "string") field.value = value;
    });
    restoring = false;
  }
  win.__OPENPLANR_PROTOTYPE_STATE__ = Object.freeze({
    get: () => structuredClone(snapshot.session),
    set(value) {
      const next = { session: value, forms: snapshot.forms };
      if (!valid(next)) throw new TypeError("Prototype state exceeds its bounded JSON contract.");
      if (!capture(structuredClone(value)))
        throw new TypeError("Pending prototype edits exceed their bounded JSON contract.");
      for (const key of Object.keys(value)) earlyFields.delete(key);
    },
    reset() {
      if (!commit({ session: {}, forms: {} }, true))
        throw new TypeError("Pending prototype edits exceed their bounded JSON contract.");
    }
  });
  win.addEventListener("message", (event) => {
    const data = event.data;
    if (event.source === win.parent && (parentOrigin === "*" || event.origin === parentOrigin) && data?.nonce === nonce && aliasRestoreType && data.type === aliasRestoreType) {
      data.state = Object.fromEntries(
        aliasFields.flatMap((field) => {
          const early = !aliasesConfigured ? earlyFields.get(field) : void 0;
          const value = early?.value ?? snapshot.session[field];
          return typeof value === "string" && value.length <= 4e3 ? [[field, value]] : [];
        })
      );
      return;
    }
    if (event.source !== win.parent || parentOrigin !== "*" && event.origin !== parentOrigin || data?.type !== "openplanr:prototype-state:restore" || data.version !== 1 || data.nonce !== nonce || data.screenId !== screenId || data.viewId !== viewId || !valid(data.state))
      return;
    const configuring = generation === null && data.generation !== void 0;
    if (data.generation !== void 0) {
      if (typeof data.generation !== "string" || !/^[A-Za-z0-9_-][A-Za-z0-9._:-]{7,127}$/.test(data.generation))
        return;
      if (data.documentId === void 0) {
        post("openplanr:prototype-state:ready");
        return;
      }
      if (data.documentId !== documentId || generation !== null && data.generation !== generation)
        return;
    } else if (generation !== null) return;
    if (data.revision !== void 0) {
      if (!Number.isSafeInteger(data.revision) || data.revision < 0 || data.revision < hostRevision || !Number.isSafeInteger(data.acknowledgedSequence) || data.acknowledgedSequence < acknowledgedSequence || data.acknowledgedSequence > sequence)
        return;
    } else if (hostRevision >= 0) return;
    const aliases = data.aliases;
    aliasRestoreType = aliases?.version === 1 && typeof aliases.restoreType === "string" && /^[a-zA-Z][a-zA-Z0-9:_-]{0,127}$/.test(aliases.restoreType) && !aliases.restoreType.startsWith("openplanr:") ? aliases.restoreType : "";
    aliasFields = aliases?.version === 1 && Array.isArray(aliases.fields) && aliases.fields.length <= 32 && aliases.fields.every(
      (field) => typeof field === "string" && /^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/.test(field) && !["constructor", "prototype", "__proto__"].includes(field)
    ) ? aliases.fields : [];
    const ack = data.revision === void 0 ? sequence : data.acknowledgedSequence;
    const next = structuredClone(data.state);
    if (pendingReset > ack) {
      next.session = {};
      next.forms = {};
    }
    for (const [key, update] of pendingSession) {
      if (update.sequence <= ack) continue;
      if (update.present && update.value !== void 0) next.session[key] = update.value;
      else delete next.session[key];
    }
    if (pendingForm && pendingForm.sequence > ack) next.forms[viewId] = pendingForm.value;
    if (!valid(next)) return;
    for (const [field, early] of earlyFields)
      if (early.sequence <= ack && JSON.stringify(data.state.forms[viewId]?.[early.fieldKey]) !== JSON.stringify(early.formValue))
        earlyFields.delete(field);
    hostRevision = data.revision ?? hostRevision;
    if (data.generation !== void 0) generation = data.generation;
    acknowledgedSequence = data.revision === void 0 ? 0 : ack;
    if (pendingReset <= ack) pendingReset = 0;
    for (const [key, update] of pendingSession)
      if (update.sequence <= ack) pendingSession.delete(key);
    if (pendingForm && pendingForm.sequence <= ack) pendingForm = null;
    snapshot = next;
    if (!aliasesConfigured && aliasRestoreType) {
      const promoted = structuredClone(snapshot);
      for (const field of aliasFields) {
        const early = earlyFields.get(field);
        if (!early || (pendingSession.get(field)?.sequence ?? 0) > early.sequence) continue;
        promoted.session[field] = early.value;
        promoted.forms[viewId] ??= {};
        promoted.forms[viewId][early.fieldKey] = early.formValue;
      }
      if (!aliasFields.some((field) => earlyFields.has(field)) || commit(promoted)) {
        aliasesConfigured = true;
        earlyFields.clear();
      }
    }
    apply();
    win.dispatchEvent(
      new CustomEvent("openplanr:prototype-state-restored", {
        detail: structuredClone(snapshot.session)
      })
    );
    if (data.revision !== void 0 && (pendingSession.size || pendingReset || pendingForm))
      postPending();
    else if (configuring) post("openplanr:prototype-state:ready");
  });
  const captureField = (event) => {
    if (!capture() || aliasesConfigured) return;
    const field = fields().find((candidate) => candidate === event.target);
    if (!field || !/^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/.test(field.id) || ["constructor", "prototype", "__proto__"].includes(field.id) || field.value.length > 4e3)
      return;
    const key = fieldKey(field, fields().indexOf(field));
    const next = new Map(earlyFields);
    next.set(field.id, {
      value: field.value,
      fieldKey: key,
      formValue: snapshot.forms[viewId][key],
      sequence
    });
    if (next.size > 128 || new TextEncoder().encode(JSON.stringify([...next])).byteLength > 16384)
      return;
    earlyFields.clear();
    for (const [id2, value] of next) earlyFields.set(id2, value);
  };
  document.addEventListener("input", captureField, true);
  document.addEventListener("change", captureField, true);
  document.addEventListener("submit", () => capture(), true);
  if (document.readyState === "loading")
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        apply();
        post("openplanr:prototype-state:ready");
      },
      { once: true }
    );
  else {
    apply();
    post("openplanr:prototype-state:ready");
  }
  post("openplanr:prototype-state:ready");
  win.setTimeout(() => post("openplanr:prototype-state:ready"), 500);
}
function renderPrototypeStateInstaller() {
  return installPrototypeState.toString();
}

// packages/artifact/lib/artifact/browser-sandbox.mjs
function pipelineError(code, message, details) {
  return new PipelineError(code, message, "", details);
}
function browserCapabilityToken({ bytes = 32 } = {}) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}
function isCapabilityToken2(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/u.test(value)) return false;
  try {
    const decoded = atob(value.replaceAll("-", "+").replaceAll("_", "/") + "=");
    return decoded.length === 32 && btoa(decoded).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "") === value;
  } catch {
    return false;
  }
}
function validHostedOrigin(origin) {
  if (typeof origin !== "string") return false;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" && parsed.origin === origin && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}
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
function getAttr(node, name) {
  return node.attrs?.find((attribute) => attribute.name.toLowerCase() === name)?.value;
}
function setAttr(node, name, value) {
  const existing = node.attrs?.find((attribute) => attribute.name.toLowerCase() === name);
  if (existing) existing.value = value;
  else {
    node.attrs ??= [];
    node.attrs.push({ name, value });
  }
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
  const parent2 = node.parentNode;
  const index = parent2?.childNodes?.indexOf(node) ?? -1;
  if (index >= 0) parent2.childNodes.splice(index, 1);
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
function artifactGuardAndBridgeSource({
  artifactId,
  nonce,
  parentOrigin,
  prototypeState = false,
  reviewSelection = false,
  screenId = artifactId
}) {
  const contract = JSON.stringify({
    channel: ARTIFACT_BRIDGE_CHANNEL,
    schemaVersion: ARTIFACT_BRIDGE_VERSION,
    artifactId,
    nonce,
    parentOrigin,
    ...prototypeState ? { screenId } : {},
    ...reviewSelection ? { reviewSelection: true } : {}
  }).replace(/</gu, "\\u003c");
  const guard = fillFrameGuard({
    __PLANR_SANDBOX_CONTRACT__: prototypeState || reviewSelection ? "__openplanrPrototypeContract" : contract,
    "__PLANR_SANDBOX_BRIDGE_TOOLS__;": renderArtifactBridgeToolsSource(),
    __PLANR_SANDBOX_WORKER_GUARD__: JSON.stringify(ARTIFACT_WORKER_GUARD_SOURCE),
    ...SANDBOX_GUARD_LIMITS
  });
  if (!prototypeState && !reviewSelection) return guard;
  const prototypeInstaller = prototypeState ? `(${renderPrototypeStateInstaller()})(__openplanrPrototypeContract.screenId,__openplanrPrototypeContract.artifactId,__openplanrPrototypeContract.parentOrigin === 'null' ? '*' : __openplanrPrototypeContract.parentOrigin,__openplanrPrototypeContract.nonce);` : "";
  return `(function(__openplanrPrototypeContract){${guard};${prototypeInstaller}(${installPreviewNavigation.toString()})(__openplanrPrototypeContract);})(${contract});`;
}
function installPreviewNavigation(contract) {
  const trustedParent = parent, post = trustedParent.postMessage.bind(trustedParent), NativeElement = Element, svgRoots = [], svgClick = () => {
  }, addListener = EventTarget.prototype.addEventListener, removeListener = EventTarget.prototype.removeEventListener, queryAll = Document.prototype.querySelectorAll, query = NativeElement.prototype.querySelector, closest = NativeElement.prototype.closest, attribute = NativeElement.prototype.getAttribute, preventDefault = Event.prototype.preventDefault, stopImmediatePropagation = Event.prototype.stopImmediatePropagation, descriptors = Object.getOwnPropertyDescriptors, prototype = Object.getPrototypeOf, objectPrototype = Object.prototype, keys = Reflect.ownKeys;
  let selectionEnabled = false;
  if (contract.reviewSelection === true)
    addEventListener("message", (event) => {
      if (event.source !== trustedParent || event.origin !== contract.parentOrigin) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const dataPrototype = prototype(data);
      if (dataPrototype !== objectPrototype && dataPrototype !== null) return;
      const fields = descriptors(data), allowed = ["schemaVersion", "type", "channel", "viewId", "enabled"];
      if (keys(fields).length !== allowed.length || allowed.some((key) => !fields[key]?.enumerable || !("value" in fields[key])))
        return;
      if (fields.schemaVersion.value !== "1.0.0" || fields.type.value !== "openplanr:review-selection" || fields.channel.value !== contract.nonce || fields.viewId.value !== contract.artifactId || typeof fields.enabled.value !== "boolean")
        return;
      selectionEnabled = fields.enabled.value;
      for (const svg of svgRoots) removeListener.call(svg, "click", svgClick);
      svgRoots.length = 0;
      if (selectionEnabled)
        for (const svg of queryAll.call(document, "svg")) {
          if (!attribute.call(svg, "data-planr-id") && !attribute.call(svg, "data-element-id") && !query.call(svg, "[data-planr-id],[data-element-id]"))
            continue;
          addListener.call(svg, "click", svgClick);
          svgRoots.push(svg);
        }
    });
  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof NativeElement)) return;
      if (selectionEnabled) {
        const target2 = closest.call(event.target, "[data-planr-id],[data-element-id]"), elementId = target2 ? attribute.call(target2, "data-planr-id") ?? attribute.call(target2, "data-element-id") : null;
        if (!elementId || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(elementId)) return;
        preventDefault.call(event);
        stopImmediatePropagation.call(event);
        post(
          {
            schemaVersion: "1.0.0",
            channel: contract.nonce,
            type: "select",
            viewId: contract.artifactId,
            elementId
          },
          contract.parentOrigin === "null" ? "*" : contract.parentOrigin
        );
        return;
      }
      if (!contract.screenId) return;
      const target = closest.call(
        event.target,
        "[data-design-target],[data-planr-navigate],[data-design-navigate]"
      );
      if (!target) return;
      const screenId = target.getAttribute("data-design-target") || target.getAttribute("data-planr-navigate") || target.getAttribute("data-design-navigate");
      if (!screenId || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(screenId)) return;
      event.preventDefault();
      post(
        {
          schemaVersion: "1.0.0",
          channel: contract.nonce,
          type: "navigate",
          viewId: contract.artifactId,
          screenId
        },
        contract.parentOrigin === "null" ? "*" : contract.parentOrigin
      );
    },
    true
  );
}
function prepareArtifactDocument({
  html,
  artifactId,
  nonce,
  parentOrigin,
  scriptNonce = browserCapabilityToken({ bytes: 18 }),
  allowLocalForms = false,
  portable = false,
  trustedParentOrigin,
  screenId = artifactId,
  prototypeState = false,
  reviewSelection = false
} = {}) {
  if (typeof html !== "string" || html.length === 0) {
    throw pipelineError(ARTIFACT_ERROR_CODES.SANDBOX_POLICY, "Artifact HTML is required.");
  }
  if (typeof artifactId !== "string" || !ID_RE.test(artifactId)) {
    throw pipelineError(ARTIFACT_ERROR_CODES.SANDBOX_POLICY, "Artifact id is invalid.");
  }
  if (!isCapabilityToken2(nonce)) {
    throw pipelineError(ARTIFACT_ERROR_CODES.SANDBOX_POLICY, "Artifact bridge nonce is invalid.");
  }
  if (typeof reviewSelection !== "boolean")
    throw pipelineError(
      ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
      "Artifact review selection option must be a boolean."
    );
  if (reviewSelection && artifactId.length > 128)
    throw pipelineError(
      ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
      "Review selection requires an artifact view id of at most 128 characters."
    );
  if (prototypeState && (typeof screenId !== "string" || !ID_RE.test(screenId)))
    throw pipelineError(
      ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
      "Prototype screen identity is invalid."
    );
  const originMatch = /^http:\/\/127\.0\.0\.1:(\d{1,5})$/.exec(parentOrigin ?? "");
  const originPort = Number(originMatch?.[1]);
  if (!(portable && parentOrigin === "null") && !(portable && parentOrigin === trustedParentOrigin && validHostedOrigin(parentOrigin)) && (!originMatch || !Number.isInteger(originPort) || originPort < 1 || originPort > 65535 || String(originPort) !== originMatch[1])) {
    throw pipelineError(
      ARTIFACT_ERROR_CODES.SANDBOX_POLICY,
      "Artifact parent origin must be IPv4 loopback or an explicitly trusted HTTPS origin."
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
    createText(
      artifactGuardAndBridgeSource({
        artifactId,
        nonce,
        parentOrigin,
        prototypeState,
        reviewSelection,
        screenId
      }),
      bridge
    )
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
function prepareArtifactSourceTemplate(options = {}) {
  const artifactId = `template-${browserCapabilityToken()}`;
  const prepared = prepareArtifactDocument({
    ...options,
    artifactId,
    portable: true,
    parentOrigin: options.parentOrigin ?? "null"
  });
  const artifactIdToken = `"artifactId":${JSON.stringify(artifactId)}`;
  if (prepared.html.split(artifactIdToken).length !== 2)
    throw pipelineError(
      ARTIFACT_ERROR_CODES.BRIDGE_INVALID,
      "Shared source bridge identity is not unique."
    );
  return Object.freeze({ html: prepared.html, artifactIdToken });
}

// packages/artifact/lib/artifact/bridge.mjs
var ID_RE2 = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/;
function pipelineError2(code, message, details) {
  return new PipelineError(code, message, "", details);
}
function createArtifactBridgeNonce({ randomBytesImpl = randomBytes2 } = {}) {
  return mintCapabilityToken({ bytes: 32, randomBytesImpl });
}
var fillHostGuard = sandboxGuardFiller("host guard", ARTIFACT_HOST_GUARD_TEMPLATE, [
  "__PLANR_SANDBOX_CONFIG__",
  "__PLANR_SANDBOX_BRIDGE_TOOLS__;",
  ...Object.keys(SANDBOX_GUARD_LIMITS)
]);
function validInlineSourcePool(sources, references) {
  if (!sources || typeof sources !== "object" || Array.isArray(sources) || !references || typeof references !== "object" || Array.isArray(references))
    return false;
  const entries = Object.entries(sources), views = Object.entries(references);
  if (!entries.length || entries.length > ARTIFACT_MAX_SOURCES || !views.length || views.length > ARTIFACT_MAX_VIEWS)
    return false;
  let bytes = 0;
  for (const [id2, source] of entries) {
    if (!ID_RE2.test(id2) || !source || Object.keys(source).length !== 2 || typeof source.html !== "string" || !/^"artifactId":"template-[A-Za-z0-9_-]{43}"$/u.test(source.artifactIdToken) || source.html.split(source.artifactIdToken).length !== 2)
      return false;
    bytes += Buffer.byteLength(source.html);
    if (bytes > 100 * 1024 * 1024) return false;
  }
  return views.every(
    ([id2, sourceId]) => ID_RE2.test(id2) && typeof sourceId === "string" && Object.hasOwn(sources, sourceId)
  ) && new Set(Object.values(references)).size === entries.length;
}
function renderArtifactParentRuntime({
  artifactBaseUrl,
  stageRuntimeUrl,
  adapterRuntimeUrl,
  nonce,
  inlineArtifacts,
  inlineSources,
  inlineArtifactSources,
  sourceTransport = "blob",
  frameBudget
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
  const legacyPortable = inlineArtifacts && typeof inlineArtifacts === "object" && !Array.isArray(inlineArtifacts) && Object.values(inlineArtifacts).every((html) => typeof html === "string");
  const pooledPortable = validInlineSourcePool(inlineSources, inlineArtifactSources);
  const portable = legacyPortable || pooledPortable;
  if ((inlineSources !== void 0 || inlineArtifactSources !== void 0) && (!pooledPortable || inlineArtifacts !== void 0) || !portable && !canonicalPath(artifactBaseUrl, { trailingSlash: true }) || !(canonicalPath(stageRuntimeUrl) || portable && /^data:text\/javascript;base64,[A-Za-z0-9+/=]+$/u.test(stageRuntimeUrl)) || adapterRuntimeUrl !== void 0 && !canonicalPath(adapterRuntimeUrl) || !isCapabilityToken(nonce) || !["blob", "srcdoc"].includes(sourceTransport) || frameBudget !== void 0 && (!Number.isInteger(frameBudget) || frameBudget < 1 || frameBudget > 8)) {
    throw pipelineError2(
      ARTIFACT_ERROR_CODES.BRIDGE_INVALID,
      "Artifact parent runtime configuration is invalid."
    );
  }
  const config = JSON.stringify({
    artifactBaseUrl,
    stageRuntimeUrl,
    adapterRuntimeUrl: adapterRuntimeUrl ?? null,
    nonce,
    inlineArtifacts: legacyPortable ? inlineArtifacts : null,
    ...pooledPortable ? { inlineSources, inlineArtifactSources } : {},
    sourceTransport,
    ...frameBudget === void 0 ? {} : { frameBudget },
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
import { readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
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

// packages/design/lib/design/context.mjs
import { createHash as createHash2 } from "node:crypto";
import { existsSync, readdirSync, readFileSync as readFileSync2, realpathSync as realpathSync2 } from "node:fs";
import { dirname as dirname2, join, resolve as resolve2 } from "node:path";

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
  const file = join(root, "review-context.json");
  if (!existsSync(file)) return emptyReviewContext(document2);
  const context = JSON.parse(
    readSource ? readSource("review-context.json", root).value.toString("utf8") : readFileSync2(resolveLocalDocumentFile(root, "review-context.json"), "utf8")
  );
  assertReviewExperience(context, DESIGN_REVIEW_CONTEXT_SCHEMA);
  if (context.designId !== document2.id)
    throw new Error("Review context belongs to a different design.");
  const screens = new Set(document2.screenOrder);
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
    schemaVersion: current.envelope.schemaVersion === "1.1.0" ? "1.2.0" : "1.1.0",
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

// packages/design/lib/design/lint.mjs
import { readFileSync as readFileSync3 } from "node:fs";
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
      html = readFileSync3(file, "utf-8");
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
import { createHash as createHash4 } from "node:crypto";
import { readFileSync as readFileSync5 } from "node:fs";

// packages/artifact/lib/artifact/internal/runtime-asset.mjs
import { createHash as createHash3 } from "node:crypto";
import { existsSync as existsSync2, readFileSync as readFileSync4 } from "node:fs";
import { resolve as resolve3 } from "node:path";
import { pathToFileURL } from "node:url";
var DIGEST = /^[a-f0-9]{64}$/u;
var MAX_FRAGMENT_BYTES = 128 * 1024;
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function readRuntimeAsset(file) {
  const url = typeof file === "string" ? pathToFileURL(resolve3(file)) : file;
  if (existsSync2(url)) return readFileSync4(url);
  const basename = url.pathname.split("/").at(-1);
  if (!basename) throw new Error("Studio runtime asset identity is invalid.");
  const manifest = JSON.parse(
    readFileSync4(new URL(`${basename}.parts.json`, url), "utf8")
  );
  if (!isRecord(manifest) || manifest.schemaVersion !== "1.0.0" || typeof manifest.sha256 !== "string" || !DIGEST.test(manifest.sha256) || !Array.isArray(manifest.parts) || !manifest.parts.length || manifest.parts.length > 64)
    throw new Error("Studio runtime fragment manifest is invalid.");
  const parts = manifest.parts.map((part, index) => {
    if (!isRecord(part) || part.name !== `${basename}.part-${String(index + 1).padStart(3, "0")}` || typeof part.sha256 !== "string" || !DIGEST.test(part.sha256))
      throw new Error("Studio runtime fragment identity is invalid.");
    const bytes2 = readFileSync4(new URL(part.name, url));
    if (bytes2.length > MAX_FRAGMENT_BYTES || createHash3("sha256").update(bytes2).digest("hex") !== part.sha256)
      throw new Error("Studio runtime fragment failed integrity verification.");
    return bytes2;
  });
  const bytes = Buffer.concat(parts);
  if (createHash3("sha256").update(bytes).digest("hex") !== manifest.sha256)
    throw new Error("Studio runtime failed integrity verification.");
  return bytes;
}

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
    <span class="design-preview-state" role="status" data-design-preview-state>Loading preview</span>
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
  <label class="design-field design-screen-search">Find a screen<input type="search" data-design-screen-search placeholder="Search screens" aria-label="Search screens"></label>
  ${document2.flows?.length ? `<label class="design-field">Journey<select data-design-screen-group aria-label="Filter screens by journey"><option value="">All screens</option>${document2.flows.map((flow) => `<option value="${escapeHtml(flow.id)}">${escapeHtml(flow.title)}</option>`).join("")}</select></label>` : ""}
  <p data-design-search-empty hidden>No screens match this search.</p>
  <div class="design-screen-list">${document2.screenOrder.map((screenId, index) => {
    const screen = document2.screens.find(({ id: id2 }) => id2 === screenId);
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
  return `<div class="design-stage-context"><div><strong data-design-screen-title>${escapeHtml(document2.screens.find(({ id: id2 }) => id2 === document2.screenOrder[0]).title)}</strong><span data-design-stage-description>Every screen, one connected design</span></div><div class="design-stage-actions">${designNotes(document2)}<label class="design-frame-picker">Frame<select aria-label="Responsive frame" data-design-frame>${document2.frames.map((frame) => `<option value="${escapeHtml(frame.id)}">${escapeHtml(frame.label)} \xB7 ${frame.width} \xD7 ${frame.height}</option>`).join("")}</select></label></div></div>
	  <div class="design-canvas-tools" role="group" aria-label="Canvas controls"><div class="planr-segment design-interaction-picker" role="group" aria-label="Review mode">${iconButton("Interact", "pointer", 'data-planr-mode="interact" aria-pressed="true" aria-keyshortcuts="I"')}${iconButton("Annotate", "comment", 'data-planr-mode="comment" aria-pressed="false" aria-keyshortcuts="C"')}</div><span></span>${button("\u2212", 'data-design-zoom="out" aria-label="Zoom out"')}${button("100%", 'data-design-zoom="reset" aria-label="Reset zoom"')}${button("+", 'data-design-zoom="in" aria-label="Zoom in"')}<span></span>${button("100%", 'data-design-actual-size aria-label="Inspect screen at actual size" aria-pressed="false"')}${button("Focus", 'data-design-focus aria-label="Focus on the preview"')}${button("Fit", 'data-design-fit aria-label="Fit all visible artboards"')}${button("Pan", 'data-design-pan aria-pressed="false" aria-label="Pan canvas" aria-keyshortcuts="H Space" title="Pan canvas (H). Hold Space to pan temporarily; Escape returns to Interact."')}</div>
  <div class="design-walkthrough-caption" hidden><div><span data-design-step></span><h2 data-design-narrative-title></h2><p data-design-narrative></p></div><div>${button("Previous", 'data-design-step-change="-1"')}${button("Next", 'data-design-step-change="1"')}</div></div>
  <div class="design-notice" role="status" aria-live="polite" hidden><span data-design-notice-message></span><button type="button" data-design-dismiss-notice aria-label="Dismiss notification" title="Dismiss notification"><span aria-hidden="true">\xD7</span></button></div>`;
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
} = {}, {
  stageRuntimeUrl = "./artifact-review-stage.js",
  renderShell,
  style = "",
  runtime = "",
  lazySources = false
} = {}) {
  if (!document2 || !envelope)
    throw new TypeError("Design studio requires a design document and artifact envelope.");
  const artifactIds = new Set(envelope.artifacts.map(({ id: id2 }) => id2));
  for (const entry of entries) {
    if (!artifactIds.has(entry.artifactId) || !document2.screens.some(({ id: id2 }) => id2 === entry.screenId) || !document2.variants.some(({ id: id2, status }) => id2 === entry.variantId && status === "ready") || !document2.frames.some(({ id: id2 }) => id2 === entry.frameId)) {
      throw new TypeError(`Invalid design studio entry: ${entry.artifactId}.`);
    }
  }
  const activeEntry = entries.find(
    ({ variantId, screenId, frameId }) => variantId === (state?.variantId ?? document2.selectedVariant) && screenId === (state?.screenId ?? document2.screenOrder[0]) && frameId === (state?.frameId ?? document2.frames[0].id)
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
      (artifact) => artifact.kind !== "html" || !lazySources && /\bdata-(?:design|planr)-static(?:\s|=|>)/u.test(
        resolveArtifactHtml(envelope, artifact)
      )
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
  html = html.replace('class="planr-shell"', 'class="planr-shell" data-planr-frame-budget="3"');
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
function readDesignStudioRuntime() {
  return readRuntimeAsset(new URL("studio.js", templateRoot)).toString("utf8");
}
function designStudioArtifactId(variantId, screenId, frameId) {
  const id2 = [
    "design",
    ...[variantId, screenId, frameId].map((value) => `${value.length}-${value}`)
  ].join(".");
  return id2.length <= 128 ? id2 : `design.${createHash4("sha256").update(JSON.stringify([variantId, screenId, frameId])).digest("hex")}`;
}
function createDesignStudioEntries(document2, envelope) {
  const ids = new Set(envelope.artifacts.map(({ id: id2 }) => id2));
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
      style: readFileSync5(
        new URL(new URL("./runtime/packages/artifact/lib/artifact/ui/studio-shell.css", import.meta.url).href),
        "utf8"
      ) + "\n" + ["studio.css", "enhancements.css", "handoff-center.css"].map((file) => readFileSync5(new URL(file, templateRoot), "utf8")).join("\n"),
      runtime: readDesignStudioRuntime()
    }
  );
}

// packages/design/lib/design/document.mjs
var DESIGN_VIEWS = Object.freeze(["canvas", "prototype", "walkthrough"]);
var DESIGN_RENDERER_VERSION = "1.3.0";
var hash = (value) => createHash5("sha256").update(value).digest("hex");
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
  mkdirSync(dirname3(path), { recursive: true });
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
function loadDesignDocument(file, { readSource } = {}) {
  const checked = readSource?.(file, process.cwd());
  const path = checked?.file ?? realpathSync3(resolve4(file));
  const document2 = assertDesignDocument(
    checked ? JSON.parse(checked.value.toString("utf8")) : readJson(path)
  );
  return { path, root: dirname3(path), document: document2 };
}
function designSpecPath(root) {
  return /(?:^|\/)output\/feats\/feat-[^/]+\/design$/u.test(root.replaceAll("\\", "/")) ? join2(dirname3(root), "design-spec.md") : join2(root, "design-spec.md");
}
function inspectDesignDocument(file, { readSource } = {}) {
  const { path, root, document: document2 } = loadDesignDocument(file, { readSource });
  const ready = document2.variants.filter((variant) => variant.status === "ready").length;
  const sourceCount = document2.screenOrder.length * ready;
  const viewCount = sourceCount * document2.frames.length;
  if (sourceCount > 256 || viewCount > 4096)
    throw new RangeError(
      `This board needs ${sourceCount} screen sources and ${viewCount} viewport references. Split it into linked boards: one board supports 256 sources and 4096 views.`
    );
  const sources = new Set(document2.assets ?? []);
  if (existsSync3(join2(root, "review-context.json"))) sources.add("review-context.json");
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
    current: readSource ? null : readJson(join2(root, ".design/current.json"), null)
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
  const artifacts = [], sources = [], entries = [], lint = [], sourceFiles = new Set(inspected.sources);
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
      const sourceId = `source-${hash(`${variant.id}:${screenId}`).slice(0, 32)}`;
      sources.push({ id: sourceId, kind: "html", html: bundled.html });
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
          sourceId,
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
  const envelope = createSharedArtifactEnvelope({
    sources,
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
  const root = realpathSync3(dirname3(resolve4(file)));
  recoverDesignPublication(root);
  const pointer = readJson(join2(root, ".design/current.json"), null);
  if (!pointer || !/^[a-f0-9]{64}$/u.test(pointer.revision))
    throw new Error("Design has no completed render. Run the render utility first.");
  const directory = join2(root, ".design/revisions", pointer.revision);
  const prepared = readJson(join2(directory, "render.json"));
  return {
    ...prepared,
    root,
    directory,
    file: resolve4(file),
    verification: readJson(join2(root, ".design/verification", `${pointer.revision}.json`), {
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
    return readRuntimeAsset(stagePath);
  } catch {
    return readRuntimeAsset(
      new URL("../../templates/artifact-review-stage.js", new URL("./runtime/packages/design/lib/design/document.mjs", import.meta.url).href)
    );
  }
}
function designRendererRevision() {
  return hash(
    json({
      version: DESIGN_RENDERER_VERSION,
      stage: hash(stageRuntimeBytes()),
      assets: ["studio.css", "studio.js", "enhancements.css", "handoff-center.css"].filter(
        (name) => name === "studio.js" || existsSync3(new URL(`../../templates/studio/${name}`, new URL("./runtime/packages/design/lib/design/document.mjs", import.meta.url).href))
      ).map(
        (name) => hash(
          name === "studio.js" ? readDesignStudioRuntime() : readFileSync6(new URL(`../../templates/studio/${name}`, new URL("./runtime/packages/design/lib/design/document.mjs", import.meta.url).href))
        )
      )
    })
  );
}
function standaloneDesignHtml(prepared, view = prepared.document.defaultView, {
  parentOrigin = "null",
  sourceTransport = parentOrigin === "null" ? "blob" : "srcdoc",
  prototypeStateAliases
} = {}) {
  const nonce = createArtifactBridgeNonce();
  const pool = prepared.envelope.schemaVersion === "1.1.0";
  const sources = pool ? Object.fromEntries(
    prepared.envelope.sources.map((source) => [
      source.id,
      prepareArtifactSourceTemplate({
        html: source.html,
        nonce,
        parentOrigin,
        allowLocalForms: true,
        prototypeState: true,
        screenId: prepared.entries.find(
          (entry) => prepared.envelope.artifacts.find((artifact) => artifact.id === entry.artifactId)?.sourceId === source.id
        )?.screenId ?? source.id
      })
    ])
  ) : null;
  const artifacts = pool ? null : Object.fromEntries(
    prepared.envelope.artifacts.map((artifact) => [
      artifact.id,
      prepareArtifactDocument({
        html: resolveArtifactHtml(prepared.envelope, artifact),
        artifactId: artifact.id,
        nonce,
        parentOrigin,
        portable: true,
        allowLocalForms: true,
        prototypeState: true,
        screenId: prepared.entries.find((entry) => entry.artifactId === artifact.id)?.screenId ?? artifact.id
      }).html
    ])
  );
  const stage = stageRuntimeBytes();
  const stageRuntimeUrl = `data:text/javascript;base64,${Buffer.from(stage).toString("base64")}`;
  const runtime = renderArtifactParentRuntime({
    nonce,
    ...pool ? {
      inlineSources: sources,
      inlineArtifactSources: Object.fromEntries(
        prepared.envelope.artifacts.map((artifact) => [artifact.id, artifact.sourceId])
      )
    } : { inlineArtifacts: artifacts },
    sourceTransport,
    frameBudget: 3,
    stageRuntimeUrl
  });
  const configuredRuntime = prototypeStateAliases ? `globalThis.__OPENPLANR_DESIGN_STUDIO_OPTIONS__=${JSON.stringify({ prototypeStateAliases }).replaceAll("<", "\\u003c")};
${runtime}` : runtime;
  const runtimeUrl = `data:text/javascript;base64,${Buffer.from(configuredRuntime).toString("base64")}`;
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
  const work = join2(root, ".design");
  mkdirSync(work, { recursive: true });
  const release = await acquireStartLock(join2(work, "render.lock"), {
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
    const directory = join2(work, "revisions", prepared.revision);
    const previous = readJson(join2(work, "current.json"), null);
    const generatedAt = now();
    const manifest = existsSync3(directory) ? readJson(join2(directory, "render.json")).manifest : buildManifest({
      framework: "vanilla",
      designFormat: prepared.document.defaultView,
      source: prepared.document.brief.source,
      contentProvenance: prepared.document.brief.provenance,
      generatedAt,
      screens: prepared.document.screenOrder.map(
        (id2) => prepared.document.screens.find((item2) => item2.id === id2).title
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
      temporary = join2(work, `pending-${randomUUID()}`);
      mkdirSync(join2(temporary, "sources"), { recursive: true });
      writeFileSync(join2(temporary, "render.json"), json(record));
      writeFileSync(join2(temporary, "design-document.json"), json(prepared.document));
      writeFileSync(join2(temporary, "design-spec.md"), spec);
      for (const source of prepared.sourceFiles) {
        const destination = join2(temporary, "sources", source);
        mkdirSync(dirname3(destination), { recursive: true });
        writeFileSync(destination, prepared.sourceContents.get(source));
      }
      for (const view of DESIGN_VIEWS)
        writeFileSync(join2(temporary, `${view}.html`), standaloneDesignHtml(record, view));
      beforeCommit?.(record);
      mkdirSync(dirname3(directory), { recursive: true });
      renameSync(temporary, directory);
      temporary = null;
    }
    const manifestPath = join2(root, "finalized.json");
    atomicJson(join2(work, "publication.json"), {
      revision: prepared.revision,
      previousRevision: previous?.revision ?? null,
      manifest,
      previousManifest: existsSync3(manifestPath) ? readFileSync6(manifestPath).toString("base64") : null
    });
    try {
      atomicJson(manifestPath, manifest);
      writePointer(join2(work, "current.json"), {
        revision: prepared.revision,
        previousRevision: previous?.revision === prepared.revision ? previous.previousRevision : previous?.revision ?? null,
        iterations: manifest.iterations,
        generatedAt: manifest.generated_at
      });
      rmSync(join2(work, "publication.json"), { force: true });
    } catch (error) {
      recoverDesignPublication(root, { ownsRenderLock: true });
      throw error;
    }
    return {
      ok: true,
      revision: prepared.revision,
      document: resolve4(file),
      artifact: join2(directory, `${prepared.document.defaultView}.html`),
      views: Object.fromEntries(
        DESIGN_VIEWS.map((view) => [view, join2(directory, `${view}.html`)])
      ),
      manifest: join2(root, "finalized.json"),
      spec: specPath,
      verification: "unverified"
    };
  } finally {
    if (temporary) rmSync(temporary, { recursive: true, force: true });
    release();
  }
}

export {
  mintCapabilityToken,
  isCapabilityToken,
  timingSafeTokenEqual,
  prepareArtifactDocument,
  createArtifactBridgeNonce,
  renderArtifactParentRuntime,
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
  readRuntimeAsset,
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
