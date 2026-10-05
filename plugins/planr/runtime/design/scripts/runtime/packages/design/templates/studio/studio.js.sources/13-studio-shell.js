

  // ../artifact/lib/artifact/ui/prototype-state.mjs
  function validatePrototypeSnapshot(value) {
    let keys = 0;
    function visit(node, depth) {
      if (depth > 6) return false;
      if (node === null || typeof node === "boolean") return true;
      if (typeof node === "number") return Number.isFinite(node);
      if (typeof node === "string") return node.length <= 8192;
      if (Array.isArray(node))
        return node.length <= 128 && node.every((item) => visit(item, depth + 1));
      if (!node || typeof node !== "object" || Object.getPrototypeOf(node) !== Object.prototype)
        return false;
      return Object.entries(node).every(
        ([key, item]) => ++keys <= 128 && key.length <= 256 && !["__proto__", "constructor", "prototype"].includes(key) && visit(item, depth + 1)
      );
    }
    try {
      const snapshot = value;
      return !!snapshot && Object.keys(snapshot).every((key) => key === "session" || key === "forms") && !!snapshot.session && !Array.isArray(snapshot.session) && typeof snapshot.session === "object" && !!snapshot.forms && !Array.isArray(snapshot.forms) && typeof snapshot.forms === "object" && visit(snapshot, 0) && new TextEncoder().encode(JSON.stringify(snapshot)).byteLength <= 16384;
    } catch {
      return false;
    }
  }
  function validatePrototypeStateAliases(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const aliases = value;
    return Object.keys(aliases).every((key) => ["version", "restoreType", "fields"].includes(key)) && aliases.version === 1 && typeof aliases.restoreType === "string" && /^[a-zA-Z][a-zA-Z0-9:_-]{0,127}$/.test(aliases.restoreType) && !aliases.restoreType.startsWith("openplanr:") && Array.isArray(aliases.fields) && aliases.fields.length > 0 && aliases.fields.length <= 32 && new Set(aliases.fields).size === aliases.fields.length && aliases.fields.every(
      (field) => typeof field === "string" && /^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/.test(field) && !["constructor", "prototype", "__proto__"].includes(field)
    );
  }
  function createPrototypeStateRelay({
    contextId,
    frames,
    parentWindow = globalThis.window,
    receiveOnly = false
  }) {
    if (!contextId) throw new TypeError("Prototype state requires a document/revision context.");
    let snapshot = { session: {}, forms: {} };
    let revision = 0, disposed = false;
    const sequences = /* @__PURE__ */ new WeakMap();
    const custody = (frame) => {
      if (!frame.window || !frame.nonce) return null;
      const generation = frame.generation === void 0 ? frame.nonce : frame.generation;
      if (typeof generation !== "string" || !/^[A-Za-z0-9_-][A-Za-z0-9._:-]{7,127}$/.test(generation))
        return null;
      let current = sequences.get(frame.window);
      if (current?.nonce !== frame.nonce || current.generation !== generation) {
        current = {
          nonce: frame.nonce,
          generation,
          sequence: 0,
          ...current?.nonce === frame.nonce && current.modern ? { modern: true } : {}
        };
        sequences.set(frame.window, current);
      }
      return current;
    };
    const restore = (frame, documentId) => {
      if (disposed || !frame.nonce || !/^[A-Za-z0-9_-]{43}$/.test(frame.nonce)) return;
      const current = custody(frame);
      if (!current) return;
      const aliases = validatePrototypeStateAliases(frame.aliases) ? frame.aliases : void 0;
      frame.window?.postMessage(
        {
          type: "openplanr:prototype-state:restore",
          version: 1,
          nonce: frame.nonce,
          screenId: frame.screenId,
          viewId: frame.viewId,
          state: snapshot,
          revision,
          acknowledgedSequence: current.sequence,
          ...frame.generation !== void 0 ? {
            generation: current.generation,
            ...documentId || current.documentId ? { documentId: documentId ?? current.documentId } : {}
          } : {},
          ...aliases ? { aliases } : {}
        },
        "*"
      );
      if (aliases && (frame.generation === void 0 || current.legacy || current.documentId && (!documentId || documentId === current.documentId))) {
        const state = Object.fromEntries(
          aliases.fields.flatMap((field) => {
            const value = snapshot.session[field];
            return typeof value === "string" && value.length <= 4e3 ? [[field, value]] : [];
          })
        );
        frame.window?.postMessage({ type: aliases.restoreType, nonce: frame.nonce, state }, "*");
      }
    };
    const receive = (event) => {
      const data = event.data;
      if (disposed || event.origin !== "null" || !data || typeof data.nonce !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(data.nonce) || !["openplanr:prototype-state", "openplanr:prototype-state:ready"].includes(data.type) || data.version !== 1)
        return false;
      const frame = frames().find(
        (frame2) => frame2.window === event.source && frame2.screenId === data.screenId && frame2.viewId === data.viewId && frame2.nonce === data.nonce
      );
      if (!frame) return false;
      const current = custody(frame);
      if (!current) return false;
      const modern = frame.generation !== void 0 && (data.generation !== void 0 || data.documentId !== void 0);
      if (modern) {
        if (typeof data.documentId !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(data.documentId))
          return false;
        if (data.generation === null) {
          current.modern = true;
          delete current.legacy;
          restore(frame, data.documentId);
          return data.type === "openplanr:prototype-state:ready";
        }
        if (data.generation !== current.generation || current.documentId && data.documentId !== current.documentId)
          return false;
      } else if (current.modern) return false;
      if (data.type === "openplanr:prototype-state:ready") {
        if (modern) {
          current.documentId = data.documentId;
          current.modern = true;
          delete current.legacy;
        } else current.legacy = true;
        restore(frame);
        return true;
      }
      if (!validatePrototypeSnapshot(data.state)) return false;
      if (data.sequence !== void 0) {
        if (!Number.isSafeInteger(data.sequence) || data.sequence <= 0 || !Array.isArray(data.sessionKeys) || data.sessionKeys.length > 256 || Object.keys(data.sessionKeys).length !== data.sessionKeys.length || new Set(data.sessionKeys).size !== data.sessionKeys.length || !Array.from(data.sessionKeys).every(
          (key) => typeof key === "string" && key.length <= 256 && !["__proto__", "constructor", "prototype"].includes(key)
        ) || new TextEncoder().encode(JSON.stringify(data.sessionKeys)).byteLength > 16384 || !data.sessionSequences || typeof data.sessionSequences !== "object" || Object.getPrototypeOf(data.sessionSequences) !== Object.prototype || Object.keys(data.sessionSequences).length !== data.sessionKeys.length || !data.sessionKeys.every(
          (key) => Object.hasOwn(data.sessionSequences, key) && Number.isSafeInteger(data.sessionSequences[key]) && data.sessionSequences[key] > 0 && data.sessionSequences[key] <= data.sequence
        ) || new TextEncoder().encode(JSON.stringify(data.sessionSequences)).byteLength > 16384 || data.reset !== void 0 && (data.reset !== true || !Number.isSafeInteger(data.resetSequence) || data.resetSequence <= 0 || data.resetSequence > data.sequence) || !frame.window)
          return false;
        const previous = current;
        if (data.sequence <= previous.sequence) return false;
        const next = data.reset && data.resetSequence > previous.sequence ? { session: {}, forms: {} } : structuredClone(snapshot);
        for (const key of data.sessionKeys) {
          if (data.sessionSequences[key] <= previous.sequence) continue;
          if (Object.hasOwn(data.state.session, key)) next.session[key] = data.state.session[key];
          else delete next.session[key];
        }
        if (Object.hasOwn(data.state.forms, frame.viewId))
          next.forms[frame.viewId] = data.state.forms[frame.viewId];
        if (!validatePrototypeSnapshot(next)) return false;
        snapshot = structuredClone(next);
        sequences.set(frame.window, {
          nonce: data.nonce,
          generation: current.generation,
          sequence: data.sequence,
          ...modern ? { documentId: data.documentId } : {},
          ...modern ? { modern: true } : {},
          ...!modern ? { legacy: true } : {}
        });
        revision++;
        for (const current2 of frames()) restore(current2);
      } else {
        if (current.sequence > 0 || current.documentId) return false;
        snapshot = structuredClone(data.state);
        current.legacy = true;
        revision++;
        for (const other of frames()) if (other.window !== event.source) restore(other);
      }
      return true;
    };
    if (!receiveOnly) parentWindow?.addEventListener("message", receive);
    return {
      receive,
      restore,
      snapshot: () => structuredClone(snapshot),
      dispose() {
        parentWindow?.removeEventListener("message", receive);
        disposed = true;
        snapshot = { session: {}, forms: {} };
      }
    };
  }

  // ../artifact/lib/artifact/ui/studio-shell-mount-impl.mjs
  var import_jsx_runtime16 = __toESM(require_jsx_runtime(), 1);
  var import_react4 = __toESM(require_react(), 1);
  var import_react_dom2 = __toESM(require_react_dom(), 1);
  var import_client = __toESM(require_client(), 1);

  // ../artifact/lib/artifact/ui/studio-shell-components.mjs
  var import_jsx_runtime15 = __toESM(require_jsx_runtime(), 1);