

  // ../artifact/lib/artifact/ui/prototype-state.mjs
  function validatePrototypeSnapshot(value) {
    let keys = 0;
    function visit(node, depth) {
      return depth > 6 ? !1 : node === null || typeof node == "boolean" ? !0 : typeof node == "number" ? Number.isFinite(node) : typeof node == "string" ? node.length <= 8192 : Array.isArray(node) ? node.length <= 128 && node.every((item) => visit(item, depth + 1)) : !node || typeof node != "object" || Object.getPrototypeOf(node) !== Object.prototype ? !1 : Object.entries(node).every(
        ([key, item]) => ++keys <= 128 && key.length <= 256 && !["__proto__", "constructor", "prototype"].includes(key) && visit(item, depth + 1)
      );
    }
    try {
      let snapshot = value;
      return !!snapshot && Object.keys(snapshot).every((key) => key === "session" || key === "forms") && !!snapshot.session && !Array.isArray(snapshot.session) && typeof snapshot.session == "object" && !!snapshot.forms && !Array.isArray(snapshot.forms) && typeof snapshot.forms == "object" && visit(snapshot, 0) && new TextEncoder().encode(JSON.stringify(snapshot)).byteLength <= 16384;
    } catch {
      return !1;
    }
  }
  function validatePrototypeStateAliases(value) {
    if (!value || typeof value != "object" || Array.isArray(value)) return !1;
    let aliases = value;
    return Object.keys(aliases).every((key) => ["version", "restoreType", "fields"].includes(key)) && aliases.version === 1 && typeof aliases.restoreType == "string" && /^[a-zA-Z][a-zA-Z0-9:_-]{0,127}$/.test(aliases.restoreType) && !aliases.restoreType.startsWith("openplanr:") && Array.isArray(aliases.fields) && aliases.fields.length > 0 && aliases.fields.length <= 32 && new Set(aliases.fields).size === aliases.fields.length && aliases.fields.every(
      (field) => typeof field == "string" && /^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/.test(field) && !["constructor", "prototype", "__proto__"].includes(field)
    );
  }
  function createPrototypeStateRelay({
    contextId,
    frames,
    parentWindow = globalThis.window,
    receiveOnly = !1
  }) {
    if (!contextId) throw new TypeError("Prototype state requires a document/revision context.");
    let snapshot = { session: {}, forms: {} }, revision = 0, disposed = !1, sequences = /* @__PURE__ */ new WeakMap(), custody = (frame) => {
      if (!frame.window || !frame.nonce) return null;
      let generation = frame.generation === void 0 ? frame.nonce : frame.generation;
      if (typeof generation != "string" || !/^[A-Za-z0-9_-][A-Za-z0-9._:-]{7,127}$/.test(generation))
        return null;
      let current = sequences.get(frame.window);
      return (current?.nonce !== frame.nonce || current.generation !== generation) && (current = {
        nonce: frame.nonce,
        generation,
        sequence: 0,
        ...current?.nonce === frame.nonce && current.modern ? { modern: !0 } : {}
      }, sequences.set(frame.window, current)), current;
    }, restore = (frame, documentId) => {
      if (disposed || !frame.nonce || !/^[A-Za-z0-9_-]{43}$/.test(frame.nonce)) return;
      let current = custody(frame);
      if (!current) return;
      let aliases = validatePrototypeStateAliases(frame.aliases) ? frame.aliases : void 0;
      if (frame.window?.postMessage(
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
      ), aliases && (frame.generation === void 0 || current.legacy || current.documentId && (!documentId || documentId === current.documentId))) {
        let state = Object.fromEntries(
          aliases.fields.flatMap((field) => {
            let value = snapshot.session[field];
            return typeof value == "string" && value.length <= 4e3 ? [[field, value]] : [];
          })
        );
        frame.window?.postMessage({ type: aliases.restoreType, nonce: frame.nonce, state }, "*");
      }
    }, receive = (event) => {
      let data = event.data;
      if (disposed || event.origin !== "null" || !data || typeof data.nonce != "string" || !/^[A-Za-z0-9_-]{43}$/.test(data.nonce) || !["openplanr:prototype-state", "openplanr:prototype-state:ready"].includes(data.type) || data.version !== 1)
        return !1;
      let frame = frames().find(
        (frame2) => frame2.window === event.source && frame2.screenId === data.screenId && frame2.viewId === data.viewId && frame2.nonce === data.nonce
      );
      if (!frame) return !1;
      let current = custody(frame);
      if (!current) return !1;
      let modern = frame.generation !== void 0 && (data.generation !== void 0 || data.documentId !== void 0);
      if (modern) {
        if (typeof data.documentId != "string" || !/^[A-Za-z0-9_-]{43}$/.test(data.documentId))
          return !1;
        if (data.generation === null)
          return current.modern = !0, delete current.legacy, restore(frame, data.documentId), data.type === "openplanr:prototype-state:ready";
        if (data.generation !== current.generation || current.documentId && data.documentId !== current.documentId)
          return !1;
      } else if (current.modern) return !1;
      if (data.type === "openplanr:prototype-state:ready")
        return modern ? (current.documentId = data.documentId, current.modern = !0, delete current.legacy) : current.legacy = !0, restore(frame), !0;
      if (!validatePrototypeSnapshot(data.state)) return !1;
      if (data.sequence !== void 0) {
        if (!Number.isSafeInteger(data.sequence) || data.sequence <= 0 || !Array.isArray(data.sessionKeys) || data.sessionKeys.length > 256 || Object.keys(data.sessionKeys).length !== data.sessionKeys.length || new Set(data.sessionKeys).size !== data.sessionKeys.length || !Array.from(data.sessionKeys).every(
          (key) => typeof key == "string" && key.length <= 256 && !["__proto__", "constructor", "prototype"].includes(key)
        ) || new TextEncoder().encode(JSON.stringify(data.sessionKeys)).byteLength > 16384 || !data.sessionSequences || typeof data.sessionSequences != "object" || Object.getPrototypeOf(data.sessionSequences) !== Object.prototype || Object.keys(data.sessionSequences).length !== data.sessionKeys.length || !data.sessionKeys.every(
          (key) => Object.hasOwn(data.sessionSequences, key) && Number.isSafeInteger(data.sessionSequences[key]) && data.sessionSequences[key] > 0 && data.sessionSequences[key] <= data.sequence
        ) || new TextEncoder().encode(JSON.stringify(data.sessionSequences)).byteLength > 16384 || data.reset !== void 0 && (data.reset !== !0 || !Number.isSafeInteger(data.resetSequence) || data.resetSequence <= 0 || data.resetSequence > data.sequence) || !frame.window)
          return !1;
        let previous = current;
        if (data.sequence <= previous.sequence) return !1;
        let next = data.reset && data.resetSequence > previous.sequence ? { session: {}, forms: {} } : structuredClone(snapshot);
        for (let key of data.sessionKeys)
          data.sessionSequences[key] <= previous.sequence || (Object.hasOwn(data.state.session, key) ? next.session[key] = data.state.session[key] : delete next.session[key]);
        if (Object.hasOwn(data.state.forms, frame.viewId) && (next.forms[frame.viewId] = data.state.forms[frame.viewId]), !validatePrototypeSnapshot(next)) return !1;
        snapshot = structuredClone(next), sequences.set(frame.window, {
          nonce: data.nonce,
          generation: current.generation,
          sequence: data.sequence,
          ...modern ? { documentId: data.documentId } : {},
          ...modern ? { modern: !0 } : {},
          ...modern ? {} : { legacy: !0 }
        }), revision++;
        for (let current2 of frames()) restore(current2);
      } else {
        if (current.sequence > 0 || current.documentId) return !1;
        snapshot = structuredClone(data.state), current.legacy = !0, revision++;
        for (let other of frames()) other.window !== event.source && restore(other);
      }
      return !0;
    };
    return receiveOnly || parentWindow?.addEventListener("message", receive), {
      receive,
      restore,
      snapshot: () => structuredClone(snapshot),
      dispose() {
        parentWindow?.removeEventListener("message", receive), disposed = !0, snapshot = { session: {}, forms: {} };
      }
    };
  }