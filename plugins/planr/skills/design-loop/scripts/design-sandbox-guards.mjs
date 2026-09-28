// packages/artifact/lib/artifact/ui/generated/sandbox-guards.mjs
var ARTIFACT_WORKER_GUARD_SOURCE = '// lib/artifact/ui/sandbox/worker-guard.mjs\n(() => {\n  "use strict";\n  const blocked = () => new DOMException("Blocked by OpenPlanr artifact sandbox", "SecurityError");\n  const replace = (owner, key, value) => {\n    try {\n      Object.defineProperty(owner, key, { value, writable: false, configurable: false });\n    } catch {\n      try {\n        owner[key] = value;\n      } catch {\n      }\n    }\n  };\n  const reject = () => Promise.reject(blocked());\n  replace(globalThis, "fetch", reject);\n  for (const key of [\n    "XMLHttpRequest",\n    "WebSocket",\n    "EventSource",\n    "WebTransport",\n    "RTCPeerConnection",\n    "webkitRTCPeerConnection"\n  ]) {\n    if (key in globalThis)\n      replace(\n        globalThis,\n        key,\n        class {\n          constructor() {\n            throw blocked();\n          }\n        }\n      );\n  }\n  for (const key of ["indexedDB", "caches", "cookieStore"]) {\n    try {\n      Object.defineProperty(globalThis, key, {\n        get() {\n          throw blocked();\n        },\n        configurable: false\n      });\n    } catch {\n    }\n  }\n  try {\n    replace(Navigator.prototype, "sendBeacon", () => false);\n  } catch {\n  }\n  try {\n    Object.defineProperty(Navigator.prototype, "serviceWorker", {\n      get() {\n        throw blocked();\n      },\n      configurable: false\n    });\n  } catch {\n  }\n  try {\n    Object.defineProperty(Navigator.prototype, "clipboard", {\n      get() {\n        throw blocked();\n      },\n      configurable: false\n    });\n  } catch {\n  }\n  try {\n    if (typeof StorageManager === "function" && "getDirectory" in StorageManager.prototype)\n      replace(StorageManager.prototype, "getDirectory", reject);\n  } catch {\n  }\n  try {\n    if (typeof StorageManager === "function" && "persist" in StorageManager.prototype)\n      replace(StorageManager.prototype, "persist", reject);\n  } catch {\n  }\n  for (const key of ["Worker", "SharedWorker"]) {\n    if (key in globalThis)\n      replace(\n        globalThis,\n        key,\n        class {\n          constructor() {\n            throw blocked();\n          }\n        }\n      );\n  }\n  const nativeImportScripts = typeof importScripts === "function" ? importScripts.bind(globalThis) : null;\n  if (nativeImportScripts)\n    replace(globalThis, "importScripts", (...urls) => {\n      if (!urls.every((value) => /^(?:blob:|data:)/i.test(String(value)))) throw blocked();\n      return nativeImportScripts(...urls);\n    });\n})();\n';
var ARTIFACT_FRAME_GUARD_TEMPLATE = `// lib/artifact/ui/sandbox/frame-guard.mjs
(() => {
  "use strict";
  const injectedScript = document.currentScript;
  injectedScript?.remove();
  const contract = __PLANR_SANDBOX_CONTRACT__;
  __PLANR_SANDBOX_BRIDGE_TOOLS__;
  const inspectionTools = createArtifactBridgeTools(document, globalThis);
  const postToParent = parent.postMessage.bind(parent);
  const elementFromPoint = document.elementFromPoint.bind(document);
  const queryAll = document.querySelectorAll.bind(document);
  const elementClosest = Element.prototype.closest;
  const elementGetAttribute = Element.prototype.getAttribute;
  const elementSetAttribute = Element.prototype.setAttribute;
  const elementRect = Element.prototype.getBoundingClientRect;
  const nativeCloneNode = Node.prototype.cloneNode;
  const nativeAppendChild = Node.prototype.appendChild;
  const nativeCreateElement = Document.prototype.createElement;
  const nativeGetComputedStyle = globalThis.getComputedStyle.bind(globalThis);
  const nativeSerializeToString = XMLSerializer.prototype.serializeToString;
  const NativeImage = globalThis.Image;
  const nativeExecCommand = Document.prototype.execCommand;
  const nativeDocumentWrite = Document.prototype.write;
  const nativeDocumentWriteln = Document.prototype.writeln;
  const NativeWorker = globalThis.Worker;
  const NativeSharedWorker = globalThis.SharedWorker;
  const NativeBlob = globalThis.Blob;
  const NativeResizeObserver = globalThis.ResizeObserver;
  const nativeCreateObjectURL = URL.createObjectURL.bind(URL);
  const nativeRevokeObjectURL = URL.revokeObjectURL.bind(URL);
  const workerGuard = __PLANR_SANDBOX_WORKER_GUARD__;
  const blocked = () => new DOMException("Blocked by OpenPlanr artifact sandbox", "SecurityError");
  const replace = (owner, key, value) => {
    try {
      Object.defineProperty(owner, key, { value, writable: false, configurable: false });
    } catch {
      try {
        owner[key] = value;
      } catch {
      }
    }
  };
  const reject = () => Promise.reject(blocked());
  const workerUrls = /* @__PURE__ */ new Set();
  let liveWorkerCount = 0;
  replace(globalThis, "fetch", reject);
  for (const key of [
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "WebTransport",
    "RTCPeerConnection",
    "webkitRTCPeerConnection"
  ]) {
    if (key in globalThis)
      replace(
        globalThis,
        key,
        class {
          constructor() {
            throw blocked();
          }
        }
      );
  }
  replace(globalThis, "open", () => null);
  try {
    replace(Navigator.prototype, "sendBeacon", () => false);
  } catch {
  }
  try {
    Object.defineProperty(Navigator.prototype, "serviceWorker", {
      get() {
        throw blocked();
      },
      configurable: false
    });
  } catch {
  }
  try {
    Object.defineProperty(Navigator.prototype, "clipboard", {
      get() {
        throw blocked();
      },
      configurable: false
    });
  } catch {
  }
  try {
    if ("share" in Navigator.prototype) replace(Navigator.prototype, "share", reject);
  } catch {
  }
  try {
    if (typeof StorageManager === "function" && "getDirectory" in StorageManager.prototype)
      replace(StorageManager.prototype, "getDirectory", reject);
  } catch {
  }
  try {
    if (typeof StorageManager === "function" && "persist" in StorageManager.prototype)
      replace(StorageManager.prototype, "persist", reject);
  } catch {
  }
  for (const key of ["localStorage", "sessionStorage", "indexedDB", "caches", "cookieStore"]) {
    try {
      Object.defineProperty(globalThis, key, {
        get() {
          throw blocked();
        },
        configurable: false
      });
    } catch {
    }
  }
  try {
    replace(HTMLFormElement.prototype, "submit", function() {
      throw blocked();
    });
    replace(HTMLFormElement.prototype, "requestSubmit", function() {
      throw blocked();
    });
  } catch {
  }
  try {
    replace(Document.prototype, "open", function() {
      throw blocked();
    });
  } catch {
  }
  try {
    if (typeof nativeDocumentWrite === "function")
      replace(Document.prototype, "write", function(...values) {
        if (this.readyState !== "loading") throw blocked();
        return nativeDocumentWrite.apply(this, values);
      });
  } catch {
  }
  try {
    if (typeof nativeDocumentWriteln === "function")
      replace(Document.prototype, "writeln", function(...values) {
        if (this.readyState !== "loading") throw blocked();
        return nativeDocumentWriteln.apply(this, values);
      });
  } catch {
  }
  try {
    if (typeof nativeExecCommand === "function")
      replace(Document.prototype, "execCommand", function(command, ...args) {
        if (["copy", "cut", "paste"].includes(String(command).toLowerCase())) throw blocked();
        return nativeExecCommand.call(this, command, ...args);
      });
  } catch {
  }
  const workerWrapper = (url, options, Shared) => {
    if (liveWorkerCount >= 32) throw blocked();
    const source = String(url);
    if (!/^(?:blob:|data:)/i.test(source)) throw blocked();
    const module = options && options.type === "module";
    if (module) throw blocked();
    const loader = "__planrLoadWorker(" + JSON.stringify(source) + ")";
    const body = "(function(__planrLoadWorker){" + workerGuard + ";" + loader + "})(globalThis.importScripts.bind(globalThis));";
    const wrapper = nativeCreateObjectURL(new NativeBlob([body], { type: "text/javascript" }));
    workerUrls.add(wrapper);
    liveWorkerCount += 1;
    try {
      const instance = Shared ? new NativeSharedWorker(wrapper, options) : new NativeWorker(wrapper, options);
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        liveWorkerCount = Math.max(0, liveWorkerCount - 1);
        workerUrls.delete(wrapper);
        nativeRevokeObjectURL(wrapper);
      };
      if (!Shared && typeof instance.terminate === "function") {
        const terminate = instance.terminate.bind(instance);
        replace(instance, "terminate", () => {
          release();
          return terminate();
        });
      }
      if (Shared && instance.port && typeof instance.port.close === "function") {
        const close = instance.port.close.bind(instance.port);
        replace(instance.port, "close", () => {
          release();
          return close();
        });
      }
      return instance;
    } catch (error) {
      liveWorkerCount = Math.max(0, liveWorkerCount - 1);
      workerUrls.delete(wrapper);
      nativeRevokeObjectURL(wrapper);
      throw error;
    }
  };
  const installWorker = (name, Native, Shared) => {
    if (typeof Native !== "function") return;
    const Wrapped = function(url, options) {
      return workerWrapper(url, options, Shared);
    };
    try {
      Object.defineProperty(Wrapped, "name", { value: name });
      Object.setPrototypeOf(Wrapped, Native);
      Object.defineProperty(Wrapped, "prototype", { value: Native.prototype });
    } catch {
    }
    replace(globalThis, name, Wrapped);
  };
  try {
    installWorker("Worker", NativeWorker, false);
  } catch {
  }
  try {
    installWorker("SharedWorker", NativeSharedWorker, true);
  } catch {
  }
  try {
    replace(Location.prototype, "assign", function() {
      throw blocked();
    });
    replace(Location.prototype, "replace", function() {
      throw blocked();
    });
  } catch {
  }
  try {
    navigation?.addEventListener("navigate", (event) => {
      if (event.cancelable) event.preventDefault();
    });
  } catch {
  }
  addEventListener(
    "click",
    (event) => {
      if (event.target?.closest?.("a,[formaction]")) event.preventDefault();
    },
    true
  );
  addEventListener("submit", (event) => event.preventDefault(), true);
  for (const type of ["copy", "cut", "paste"])
    addEventListener(
      type,
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
  addEventListener(
    "pagehide",
    () => {
      for (const url of workerUrls) nativeRevokeObjectURL(url);
      workerUrls.clear();
      liveWorkerCount = 0;
    },
    { once: true }
  );
  const plain = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  };
  const own = (value, key) => {
    const descriptor = plain(value) ? Object.getOwnPropertyDescriptor(value, key) : null;
    return descriptor && Object.hasOwn(descriptor, "value") ? descriptor.value : void 0;
  };
  const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
  const validText = (value, max) => typeof value === "string" && value.length > 0 && value.length <= max;
  const validId = (value) => validText(value, 512) && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/.test(value);
  const validScreen = (value) => (
    // biome-ignore lint/suspicious/noControlCharactersInRegex: a screen name must not contain control characters.
    typeof value === "string" && /^[^\\u0000-\\u001f\\u007f]{1,128}$/.test(value)
  );
  const validRequestId = (value) => validText(value, 128) && /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(value);
  const validBase = (data, type, keys) => exact(data, keys) && own(data, "channel") === contract.channel && own(data, "schemaVersion") === contract.schemaVersion && own(data, "type") === type && own(data, "artifactId") === contract.artifactId && validRequestId(own(data, "requestId"));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const closest = (element, selector) => element ? elementClosest.call(element, selector) : null;
  const attribute = (element, name) => element ? elementGetAttribute.call(element, name) : null;
  const screenFor = (element) => attribute(closest(element, "[data-planr-screen]"), "data-planr-screen") || void 0;
  const anchorFor = (element) => {
    const anchor = closest(element, "[data-planr-id]");
    if (!anchor) return null;
    const planrId = attribute(anchor, "data-planr-id");
    if (!validText(planrId, 512)) return null;
    const rect = elementRect.call(anchor);
    const width = Math.max(1, innerWidth), height = Math.max(1, innerHeight);
    const x = clamp(rect.left, 0, width), y = clamp(rect.top, 0, height);
    const right = clamp(rect.right, 0, width), bottom = clamp(rect.bottom, 0, height);
    const screen = screenFor(anchor);
    return {
      planrId,
      ...screen === void 0 ? {} : { screen },
      rect: { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) },
      viewport: { width, height }
    };
  };
  const findById = (id, screen) => {
    for (const element of queryAll("[data-planr-id]")) {
      if (attribute(element, "data-planr-id") !== id) continue;
      if (screen !== void 0 && screenFor(element) !== screen) continue;
      return element;
    }
    return null;
  };
  const exportTarget = (target) => {
    if (target === "full") return { node: document.body, label: "full" };
    let node = elementFromPoint(innerWidth / 2, innerHeight / 2);
    node = closest(node, "[data-planr-id],[data-dc-slot],[data-planr-screen],section[id]") || document.body;
    const label = attribute(node, "data-planr-screen") || attribute(node, "data-dc-slot") || attribute(node, "data-planr-id") || attribute(node, "id") || "screen";
    return { node, label };
  };
  const exportPng = async (target) => {
    const selected = exportTarget(target), node = selected.node;
    const width = Math.ceil(
      Math.max(node.scrollWidth || 0, node.clientWidth || 0, elementRect.call(node).width || 0)
    );
    const height = Math.ceil(
      Math.max(node.scrollHeight || 0, node.clientHeight || 0, elementRect.call(node).height || 0)
    );
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > __PLANR_SANDBOX_EXPORT_MAX_EDGE__ || height > __PLANR_SANDBOX_EXPORT_MAX_EDGE__ || width * height > 4e7)
      throw new Error("export dimensions are unavailable or too large");
    let count = 0;
    const cloneStyled = (src) => {
      if (++count > 1e4) throw new Error("export node limit exceeded");
      if (src.nodeType === 8 || src.nodeType === 1 && src.tagName === "SCRIPT")
        return document.createTextNode("");
      const dst = nativeCloneNode.call(src, false);
      if (src.nodeType === 1) {
        const style = nativeGetComputedStyle(src);
        let css = "";
        for (let index = 0; index < style.length; index += 1) {
          const name = style[index];
          css += name + ":" + style.getPropertyValue(name) + ";";
        }
        elementSetAttribute.call(dst, "style", css + "animation:none;transition:none;");
        if (src.tagName === "CANVAS") {
          try {
            const image2 = nativeCreateElement.call(document, "img");
            image2.src = src.toDataURL("image/png");
            elementSetAttribute.call(image2, "style", css);
            return image2;
          } catch {
          }
        }
      }
      for (let child = src.firstChild; child; child = child.nextSibling)
        nativeAppendChild.call(dst, cloneStyled(child));
      return dst;
    };
    await (document.fonts?.ready?.catch(() => {
    }) ?? Promise.resolve());
    const clone = cloneStyled(node);
    if (clone.nodeType === 1) {
      elementSetAttribute.call(clone, "xmlns", "http://www.w3.org/1999/xhtml");
      clone.style.boxShadow = "none";
      clone.style.borderRadius = "0";
    }
    const markup = nativeSerializeToString.call(new XMLSerializer(), clone);
    if (markup.length > 10 * 1024 * 1024) throw new Error("export markup limit exceeded");
    const scale = clamp(
      Math.floor(__PLANR_SANDBOX_EXPORT_MAX_EDGE__ / Math.max(width, height)) || 1,
      1,
      3
    );
    const outputWidth = width * scale, outputHeight = height * scale;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + outputWidth + '" height="' + outputHeight + '" viewBox="0 0 ' + width + " " + height + '"><foreignObject width="' + width + '" height="' + height + '">' + markup + "</foreignObject></svg>";
    const image = new NativeImage();
    await new Promise((resolve, reject2) => {
      image.onload = resolve;
      image.onerror = () => reject2(new Error("render failed"));
      image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
    const canvas = nativeCreateElement.call(document, "canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    canvas.getContext("2d").drawImage(image, 0, 0, outputWidth, outputHeight);
    const dataUrl = canvas.toDataURL("image/png");
    if (typeof dataUrl !== "string" || dataUrl.length > __PLANR_SANDBOX_EXPORT_MAX_DATA_URL__)
      throw new Error("export PNG limit exceeded");
    return {
      dataUrl,
      width: outputWidth,
      height: outputHeight,
      label: String(selected.label).slice(0, 128)
    };
  };
  const send = (type, requestId, anchor) => {
    const message = {
      channel: contract.channel,
      schemaVersion: contract.schemaVersion,
      type,
      nonce: contract.nonce,
      artifactId: contract.artifactId
    };
    if (requestId) message.requestId = requestId;
    if (anchor) message.anchor = anchor;
    postToParent(message, contract.parentOrigin === "null" ? "*" : contract.parentOrigin);
  };
  const sendExport = (type, requestId, value) => {
    const message = {
      channel: contract.channel,
      schemaVersion: contract.schemaVersion,
      type,
      nonce: contract.nonce,
      artifactId: contract.artifactId,
      requestId
    };
    if (type === "export.result") Object.assign(message, value);
    else message.reason = String(value || "export failed").slice(0, 256);
    postToParent(message, contract.parentOrigin === "null" ? "*" : contract.parentOrigin);
  };
  const viewportGestures = createArtifactViewportGestures(
    window,
    (type, value) => postToParent(
      {
        channel: contract.channel,
        schemaVersion: contract.schemaVersion,
        type,
        nonce: contract.nonce,
        artifactId: contract.artifactId,
        ...value
      },
      contract.parentOrigin === "null" ? "*" : contract.parentOrigin
    )
  );
  let lastLayout = "";
  let layoutTimer = 0;
  const measureLayout = () => {
    layoutTimer = 0;
    const root = document.documentElement, body = document.body;
    const width = Math.ceil(
      Math.max(
        root?.scrollWidth || 0,
        root?.clientWidth || 0,
        body?.scrollWidth || 0,
        body?.clientWidth || 0,
        innerWidth || 0
      )
    );
    const height = Math.ceil(
      Math.max(
        root?.scrollHeight || 0,
        root?.clientHeight || 0,
        body?.scrollHeight || 0,
        body?.clientHeight || 0,
        innerHeight || 0
      )
    );
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > __PLANR_SANDBOX_LAYOUT_MAX_WIDTH__ || height > __PLANR_SANDBOX_LAYOUT_MAX_HEIGHT__)
      return;
    const signature = width + "x" + height;
    if (signature === lastLayout) return;
    lastLayout = signature;
    postToParent(
      {
        channel: contract.channel,
        schemaVersion: contract.schemaVersion,
        type: "layout.measurement",
        nonce: contract.nonce,
        artifactId: contract.artifactId,
        layout: { width, height }
      },
      contract.parentOrigin === "null" ? "*" : contract.parentOrigin
    );
  };
  const scheduleLayout = () => {
    if (layoutTimer) return;
    layoutTimer = setTimeout(measureLayout, 80);
  };
  try {
    if (typeof NativeResizeObserver === "function") {
      const observer = new NativeResizeObserver(scheduleLayout);
      observer.observe(document.documentElement);
      if (document.body) observer.observe(document.body);
    }
  } catch {
  }
  let windowStart = performance.now(), messageCount = 0;
  addEventListener("message", (event) => {
    if (event.source !== parent || event.origin !== contract.parentOrigin) return;
    const now = performance.now();
    if (now - windowStart > 1e3) {
      windowStart = now;
      messageCount = 0;
    }
    if (++messageCount > 60) return;
    const data = event.data;
    if (validBase(data, "bridge.challenge", [
      "channel",
      "schemaVersion",
      "type",
      "artifactId",
      "requestId"
    ])) {
      send("bridge.challenge-ack", data.requestId);
      scheduleLayout();
      return;
    }
    if (validBase(data, "viewport.gestures", [
      "channel",
      "schemaVersion",
      "type",
      "artifactId",
      "requestId",
      "enabled"
    ]) && typeof own(data, "enabled") === "boolean") {
      viewportGestures.setEnabled(own(data, "enabled"));
      return;
    }
    const toolReply = (type, value = {}) => postToParent(
      {
        channel: contract.channel,
        schemaVersion: contract.schemaVersion,
        type,
        nonce: contract.nonce,
        artifactId: contract.artifactId,
        requestId: data.requestId,
        ...value
      },
      contract.parentOrigin === "null" ? "*" : contract.parentOrigin
    );
    if (validBase(data, "thumbnail.request", [
      "channel",
      "schemaVersion",
      "type",
      "artifactId",
      "requestId"
    ])) {
      inspectionTools.thumbnail().then((value) => toolReply("thumbnail.result", value)).catch(() => toolReply("thumbnail.error", { reason: "Thumbnail capture unavailable." }));
      return;
    }
    if (validBase(data, "inspect.point", [
      "channel",
      "schemaVersion",
      "type",
      "artifactId",
      "requestId",
      "x",
      "y"
    ])) {
      const inspection = inspectionTools.inspectAt(own(data, "x"), own(data, "y"));
      toolReply(inspection ? "inspect.result" : "inspect.miss", inspection ? { inspection } : {});
      return;
    }
    const inspectionKeys = own(data, "screen") === void 0 ? ["channel", "schemaVersion", "type", "artifactId", "requestId", "planrId"] : ["channel", "schemaVersion", "type", "artifactId", "requestId", "planrId", "screen"];
    if (validBase(data, "inspect.anchor", inspectionKeys)) {
      const inspection = inspectionTools.inspect({
        planrId: own(data, "planrId"),
        ...own(data, "screen") === void 0 ? {} : { screen: own(data, "screen") }
      });
      toolReply(inspection ? "inspect.result" : "inspect.miss", inspection ? { inspection } : {});
      return;
    }
    if (validBase(data, "export.request", [
      "channel",
      "schemaVersion",
      "type",
      "artifactId",
      "requestId",
      "target"
    ]) && ["screen", "full"].includes(own(data, "target"))) {
      exportPng(own(data, "target")).then((value) => sendExport("export.result", data.requestId, value)).catch((error) => sendExport("export.error", data.requestId, error?.message));
      return;
    }
    if (validBase(data, "anchor.hit-test", [
      "channel",
      "schemaVersion",
      "type",
      "artifactId",
      "requestId",
      "x",
      "y"
    ])) {
      const x = own(data, "x"), y = own(data, "y");
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > innerWidth || y > innerHeight)
        return;
      const anchor = anchorFor(elementFromPoint(x, y));
      send(anchor ? "anchor.result" : "anchor.miss", data.requestId, anchor);
      return;
    }
    const resolveKeys = own(data, "screen") === void 0 ? ["channel", "schemaVersion", "type", "artifactId", "requestId", "planrId"] : ["channel", "schemaVersion", "type", "artifactId", "requestId", "planrId", "screen"];
    if (validBase(data, "anchor.resolve", resolveKeys)) {
      const planrId = own(data, "planrId"), screen = own(data, "screen");
      if (!validId(planrId) || screen !== void 0 && !validScreen(screen)) return;
      const anchor = anchorFor(findById(planrId, screen));
      send(anchor ? "anchor.result" : "anchor.miss", data.requestId, anchor);
    }
  });
  const ready = () => send("bridge.ready");
  if (document.readyState === "loading")
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        ready();
        scheduleLayout();
      },
      { once: true }
    );
  else
    queueMicrotask(() => {
      ready();
      scheduleLayout();
    });
})();
`;
var ARTIFACT_HOST_GUARD_TEMPLATE = `// lib/artifact/ui/sandbox/host-guard.mjs
(() => {
  "use strict";
  const config = __PLANR_SANDBOX_CONFIG__;
  __PLANR_SANDBOX_BRIDGE_TOOLS__;
  const requestId = () => crypto.randomUUID?.() || "request-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  const bridgeClient = {
    attach({ artifact, frame, getState }) {
      const pending = /* @__PURE__ */ new Map();
      let windowStart = performance.now(), messageCount = 0;
      let immutableSource = "", trustedLoad = false, recovering = false, navigationAttempts = 0, failedClosed = false;
      let inertSource = "";
      let pendingChallenge = null;
      let measuredLayout = null;
      let viewportGesturesEnabled = false, disposed = false;
      const syncViewportGestures = () => {
        if (trustedLoad && !disposed)
          frame.contentWindow?.postMessage(
            {
              channel: config.channel,
              schemaVersion: config.schemaVersion,
              type: "viewport.gestures",
              artifactId: artifact.id,
              requestId: requestId(),
              enabled: viewportGesturesEnabled
            },
            "*"
          );
      };
      const plain = (value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return false;
        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
      };
      const own = (value, key) => {
        const descriptor = plain(value) ? Object.getOwnPropertyDescriptor(value, key) : null;
        return descriptor && Object.hasOwn(descriptor, "value") ? descriptor.value : void 0;
      };
      const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
      const validText = (value, max) => typeof value === "string" && value.length > 0 && value.length <= max;
      const validId = (value) => validText(value, 512) && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/.test(value);
      const validScreen = (value) => (
        // biome-ignore lint/suspicious/noControlCharactersInRegex: a screen name must not contain control characters.
        typeof value === "string" && /^[^\\u0000-\\u001f\\u007f]{1,128}$/.test(value)
      );
      const validRequestId = (value) => validText(value, 128) && /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(value);
      const validNumber = (value) => typeof value === "number" && Number.isFinite(value);
      const originalPointerEvents = frame.style.pointerEvents;
      const originalInert = frame.inert;
      const quarantine = (active) => {
        frame.inert = active ? true : originalInert;
        frame.style.pointerEvents = active ? "none" : originalPointerEvents;
        if (active) frame.setAttribute("aria-busy", "true");
        else frame.removeAttribute("aria-busy");
        frame.dataset.planrBridgeTrusted = String(!active);
      };
      frame.setAttribute("csp", config.frameCsp);
      quarantine(true);
      const receive = (event) => {
        if (event.source !== frame.contentWindow || event.origin !== "null") return;
        const now = performance.now();
        if (now - windowStart > 1e3) {
          windowStart = now;
          messageCount = 0;
        }
        if (++messageCount > 120) return;
        const data = event.data;
        if (!data || typeof data !== "object" || Array.isArray(data)) return;
        if (own(data, "channel") !== config.channel || own(data, "schemaVersion") !== config.schemaVersion || own(data, "nonce") !== config.nonce || own(data, "artifactId") !== artifact.id)
          return;
        const type = own(data, "type");
        if (type === "bridge.ready") {
          if (!exact(data, ["channel", "schemaVersion", "type", "nonce", "artifactId"])) return;
          return;
        }
        if (type === "bridge.challenge-ack") {
          if (!exact(data, [
            "channel",
            "schemaVersion",
            "type",
            "nonce",
            "artifactId",
            "requestId"
          ]) || !validRequestId(own(data, "requestId")) || !pendingChallenge || own(data, "requestId") !== pendingChallenge.id)
            return;
          clearTimeout(pendingChallenge.timer);
          pendingChallenge = null;
          trustedLoad = true;
          recovering = false;
          quarantine(false);
          syncViewportGestures();
          frame.dispatchEvent(
            new CustomEvent(config.readyEvent, {
              detail: { artifactId: artifact.id, authenticated: true }
            })
          );
          return;
        }
        if (type === "viewport.zoom") {
          if (!trustedLoad || !viewportGesturesEnabled || disposed || !exact(data, [
            "channel",
            "schemaVersion",
            "type",
            "nonce",
            "artifactId",
            "x",
            "y",
            "deltaY"
          ]))
            return;
          const value2 = normalizeArtifactViewportZoom(
            { x: own(data, "x"), y: own(data, "y"), deltaY: own(data, "deltaY") },
            artifact.viewport
          );
          if (value2)
            frame.dispatchEvent(
              new CustomEvent(config.viewportZoomEvent, { bubbles: true, detail: value2 })
            );
          return;
        }
        if (type === "viewport.pan") {
          if (!trustedLoad || !viewportGesturesEnabled || disposed || !exact(data, [
            "channel",
            "schemaVersion",
            "type",
            "nonce",
            "artifactId",
            "deltaX",
            "deltaY"
          ]))
            return;
          const value2 = normalizeArtifactViewportPan({
            deltaX: own(data, "deltaX"),
            deltaY: own(data, "deltaY")
          });
          if (value2)
            frame.dispatchEvent(
              new CustomEvent(config.viewportPanEvent, { bubbles: true, detail: value2 })
            );
          return;
        }
        if (type === "layout.measurement") {
          const layout = own(data, "layout");
          if (!trustedLoad || !exact(data, ["channel", "schemaVersion", "type", "nonce", "artifactId", "layout"]) || !exact(layout, ["width", "height"]) || !Number.isInteger(layout.width) || !Number.isInteger(layout.height) || layout.width < 1 || layout.width > __PLANR_SANDBOX_LAYOUT_MAX_WIDTH__ || layout.height < 1 || layout.height > __PLANR_SANDBOX_LAYOUT_MAX_HEIGHT__)
            return;
          measuredLayout = Object.freeze({ width: layout.width, height: layout.height });
          frame.dispatchEvent(new CustomEvent(config.layoutEvent, { detail: measuredLayout }));
          return;
        }
        const receivedRequestId = own(data, "requestId");
        if (!trustedLoad || !validRequestId(receivedRequestId) || !pending.has(receivedRequestId))
          return;
        const settle = pending.get(receivedRequestId);
        if (["inspect.point", "inspect.anchor", "thumbnail.request"].includes(settle.type)) {
          const result = normalizeArtifactBridgeToolResult(settle.type, data, artifact.viewport);
          if (!result.valid) return;
          pending.delete(receivedRequestId);
          clearTimeout(settle.timer);
          settle.resolve(result.value);
          return;
        }
        if (settle.type === "export.request") {
          if (type === "export.error") {
            if (!exact(data, [
              "channel",
              "schemaVersion",
              "type",
              "nonce",
              "artifactId",
              "requestId",
              "reason"
            ]) || typeof own(data, "reason") !== "string" || own(data, "reason").length > 256)
              return;
            pending.delete(receivedRequestId);
            clearTimeout(settle.timer);
            settle.resolve(null);
            return;
          }
          if (type !== "export.result" || !exact(data, [
            "channel",
            "schemaVersion",
            "type",
            "nonce",
            "artifactId",
            "requestId",
            "dataUrl",
            "width",
            "height",
            "label"
          ]))
            return;
          const dataUrl = own(data, "dataUrl"), width = own(data, "width"), height = own(data, "height"), label = own(data, "label");
          pending.delete(receivedRequestId);
          clearTimeout(settle.timer);
          if (typeof dataUrl !== "string" || dataUrl.length > __PLANR_SANDBOX_EXPORT_MAX_DATA_URL__ || !/^data:image\\/png;base64,[A-Za-z0-9+/]+=*$/.test(dataUrl) || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > __PLANR_SANDBOX_EXPORT_MAX_EDGE__ || height > __PLANR_SANDBOX_EXPORT_MAX_EDGE__ || !validText(label, 128)) {
            settle.resolve(null);
            return;
          }
          settle.resolve(Object.freeze({ dataUrl, width, height, label }));
          return;
        }
        if (!["anchor.result", "anchor.miss"].includes(type)) return;
        if (type === "anchor.miss" && !exact(data, ["channel", "schemaVersion", "type", "nonce", "artifactId", "requestId"]))
          return;
        if (type === "anchor.result" && !exact(data, [
          "channel",
          "schemaVersion",
          "type",
          "nonce",
          "artifactId",
          "requestId",
          "anchor"
        ]))
          return;
        pending.delete(receivedRequestId);
        clearTimeout(settle.timer);
        if (type === "anchor.miss") {
          settle.resolve(null);
          return;
        }
        const anchor = data.anchor, rect = anchor?.rect, viewport = anchor?.viewport;
        const frozen = getState?.()?.presentation === "document" && measuredLayout ? measuredLayout : artifact.viewport;
        const anchorKeys = anchor?.screen === void 0 ? ["planrId", "rect", "viewport"] : ["planrId", "screen", "rect", "viewport"];
        if (!exact(anchor, anchorKeys) || !exact(rect, ["x", "y", "width", "height"]) || !exact(viewport, ["width", "height"]) || !validId(anchor?.planrId) || anchor.screen !== void 0 && !validScreen(anchor.screen) || !["x", "y", "width", "height"].every((key) => validNumber(rect?.[key])) || viewport?.width !== frozen.width || viewport?.height !== frozen.height || rect.x < 0 || rect.y < 0 || rect.width < 0 || rect.height < 0 || rect.x + rect.width > frozen.width || rect.y + rect.height > frozen.height) {
          settle.resolve(null);
          return;
        }
        const value = Object.freeze({
          artifactId: artifact.id,
          planrId: anchor.planrId,
          ...anchor.screen === void 0 ? {} : { screen: anchor.screen },
          rect: Object.freeze({ ...rect }),
          viewport: frozen
        });
        settle.resolve(value);
        frame.dispatchEvent(new CustomEvent(config.anchorEvent, { detail: value }));
      };
      addEventListener("message", receive);
      const rememberSource = () => {
        if (immutableSource) return;
        const html = frame.getAttribute("srcdoc") || "";
        if (html) {
          immutableSource = { type: "srcdoc", value: html };
          return;
        }
        const value = frame.getAttribute("src") || "";
        if (value.startsWith("blob:")) immutableSource = { type: "url", value };
      };
      const sourceObserver = new MutationObserver(rememberSource);
      sourceObserver.observe(frame, { attributes: true, attributeFilter: ["src", "srcdoc"] });
      const settlePending = () => {
        for (const value of pending.values()) {
          clearTimeout(value.timer);
          value.resolve(null);
        }
        pending.clear();
      };
      const clearChallenge = () => {
        if (pendingChallenge) {
          clearTimeout(pendingChallenge.timer);
          pendingChallenge = null;
        }
      };
      const failClosed = () => {
        if (failedClosed) return;
        failedClosed = true;
        recovering = false;
        clearChallenge();
        settlePending();
        quarantine(true);
        const inertPolicy = config.frameCsp.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
        inertSource = URL.createObjectURL(
          new Blob(
            [
              '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="' + inertPolicy + '"><meta name="referrer" content="no-referrer"><title>Artifact blocked</title><p>Artifact navigation was blocked.</p>'
            ],
            { type: "text/html" }
          )
        );
        frame.dispatchEvent(
          new CustomEvent(config.navigationEvent, {
            detail: {
              artifactId: artifact.id,
              recovered: false,
              failedClosed: true,
              attempts: navigationAttempts
            }
          })
        );
        frame.removeAttribute("srcdoc");
        frame.src = inertSource;
      };
      const recoverNavigation = () => {
        if (failedClosed || !immutableSource) return;
        navigationAttempts += 1;
        if (navigationAttempts >= 3) {
          failClosed();
          return;
        }
        recovering = true;
        trustedLoad = false;
        quarantine(true);
        clearChallenge();
        frame.dispatchEvent(
          new CustomEvent(config.navigationEvent, {
            detail: {
              artifactId: artifact.id,
              recovered: true,
              failedClosed: false,
              attempts: navigationAttempts
            }
          })
        );
        if (immutableSource.type === "srcdoc") {
          frame.removeAttribute("src");
          frame.removeAttribute("srcdoc");
          frame.srcdoc = immutableSource.value;
        } else {
          frame.removeAttribute("srcdoc");
          frame.src = immutableSource.value;
        }
      };
      const challengeCurrentDocument = () => {
        if (failedClosed) return;
        clearChallenge();
        const id = requestId();
        const timer = setTimeout(() => {
          if (pendingChallenge?.id !== id) return;
          pendingChallenge = null;
          recoverNavigation();
        }, 750);
        pendingChallenge = { id, timer };
        frame.contentWindow?.postMessage(
          {
            channel: config.channel,
            schemaVersion: config.schemaVersion,
            type: "bridge.challenge",
            artifactId: artifact.id,
            requestId: id
          },
          "*"
        );
      };
      const onFrameLoad = () => {
        rememberSource();
        trustedLoad = false;
        measuredLayout = null;
        quarantine(true);
        challengeCurrentDocument();
      };
      frame.addEventListener("load", onFrameLoad);
      const send = (type, payload = {}) => new Promise((resolve) => {
        if (!trustedLoad || pending.size >= 32) {
          resolve(null);
          return;
        }
        const id = requestId();
        const timer = setTimeout(() => {
          pending.delete(id);
          resolve(null);
        }, ARTIFACT_BRIDGE_OPERATION_TIMEOUTS[type] || 750);
        pending.set(id, { resolve, timer, type });
        frame.contentWindow?.postMessage(
          {
            channel: config.channel,
            schemaVersion: config.schemaVersion,
            type,
            artifactId: artifact.id,
            requestId: id,
            ...payload
          },
          "*"
        );
      });
      Object.defineProperty(frame, "__openPlanrBridge", {
        value: Object.freeze({
          setViewportGestures: (enabled) => {
            if (typeof enabled !== "boolean" || disposed) return false;
            if (enabled === viewportGesturesEnabled) return true;
            viewportGesturesEnabled = enabled;
            syncViewportGestures();
            return true;
          },
          hitTest: (x, y) => Number.isFinite(x) && Number.isFinite(y) ? send("anchor.hit-test", { x, y }) : Promise.resolve(null),
          resolve: (planrId, screen) => validText(planrId, 512) ? send("anchor.resolve", { planrId, ...screen ? { screen } : {} }) : Promise.resolve(null),
          inspectAt: (x, y) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 ? send("inspect.point", { x, y }) : Promise.resolve(null),
          inspect: (anchor) => validId(anchor?.planrId) && (anchor.screen === void 0 || validScreen(anchor.screen)) ? send("inspect.anchor", {
            planrId: anchor.planrId,
            ...anchor.screen === void 0 ? {} : { screen: anchor.screen }
          }) : Promise.resolve(null),
          thumbnail: () => send("thumbnail.request"),
          exportPng: (target) => ["screen", "full"].includes(target) ? send("export.request", { target }) : Promise.resolve(null)
        }),
        configurable: true
      });
      return () => {
        viewportGesturesEnabled = false;
        syncViewportGestures();
        disposed = true;
        removeEventListener("message", receive);
        frame.removeEventListener("load", onFrameLoad);
        sourceObserver.disconnect();
        clearChallenge();
        settlePending();
        if (inertSource) URL.revokeObjectURL(inertSource);
        frame.inert = originalInert;
        frame.style.pointerEvents = originalPointerEvents;
        frame.removeAttribute("aria-busy");
        frame.removeAttribute("csp");
        delete frame.dataset.planrBridgeTrusted;
        try {
          delete frame.__openPlanrBridge;
        } catch {
        }
      };
    }
  };
  globalThis.__OPENPLANR_ARTIFACT_STAGE_OPTIONS__ = Object.freeze({
    async resolveArtifactSource(artifact) {
      if (config.inlineArtifacts) {
        const html = config.inlineArtifacts[artifact.id];
        if (typeof html !== "string") throw new Error("Artifact source unavailable");
        return new Blob([html], { type: "text/html" });
      }
      const response = await fetch(config.artifactBaseUrl + encodeURIComponent(artifact.id), {
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer"
      });
      if (!response.ok || !(response.headers.get("content-type") || "").toLowerCase().startsWith("application/octet-stream"))
        throw new Error("Artifact source unavailable");
      return new Blob([await response.arrayBuffer()], { type: "text/html" });
    },
    bridgeClient,
    onState(state) {
      dispatchEvent(new CustomEvent("planr:artifact-state", { detail: state }));
    }
  });
  const loadStage = () => {
    const stage = document.createElement("script");
    stage.src = config.stageRuntimeUrl;
    stage.async = false;
    document.head.append(stage);
  };
  if (config.adapterRuntimeUrl) {
    const adapter = document.createElement("script");
    adapter.src = config.adapterRuntimeUrl;
    adapter.async = false;
    adapter.addEventListener("load", loadStage, { once: true });
    adapter.addEventListener(
      "error",
      () => {
        document.documentElement.dataset.planrAdapterError = "true";
      },
      { once: true }
    );
    document.head.append(adapter);
  } else loadStage();
})();
`;

export {
  ARTIFACT_WORKER_GUARD_SOURCE,
  ARTIFACT_FRAME_GUARD_TEMPLATE,
  ARTIFACT_HOST_GUARD_TEMPLATE
};
