

  // ../canvas/src/camera.mjs
  function invalid(field, value) {
    throw new TypeError(`${field}: invalid value ${String(value)}`);
  }
  function finite(field, value) {
    (typeof value != "number" || !Number.isFinite(value)) && invalid(field, value);
  }
  function positive(field, value) {
    finite(field, value), value <= 0 && invalid(field, value);
  }
  function nonnegative(field, value) {
    finite(field, value), value < 0 && invalid(field, value);
  }
  function point(field, value) {
    (!value || typeof value != "object") && invalid(field, value), finite(`${field}.x`, value.x), finite(`${field}.y`, value.y);
  }
  function rect(field, value) {
    point(field, value), nonnegative(`${field}.width`, value.width), nonnegative(`${field}.height`, value.height);
  }
  function validateCamera(camera) {
    point("camera", camera), positive("camera.zoom", camera.zoom);
  }
  function worldToScreen(camera, value) {
    return { x: (value.x - camera.x) * camera.zoom, y: (value.y - camera.y) * camera.zoom };
  }
  function screenToWorld(camera, value) {
    return { x: value.x / camera.zoom + camera.x, y: value.y / camera.zoom + camera.y };
  }
  function cameraFromScreenTranslate(translate) {
    return point("translate", translate), positive("translate.scale", translate.scale), {
      x: -translate.x / translate.scale,
      y: -translate.y / translate.scale,
      zoom: translate.scale
    };
  }
  function cameraToScreenTranslate(camera) {
    return validateCamera(camera), { x: -camera.x * camera.zoom, y: -camera.y * camera.zoom, scale: camera.zoom };
  }

  // ../canvas/src/announcer.mjs
  function createAnnouncer(stage) {
    let view = stage.ownerDocument.defaultView;
    if (!view) throw new Error("Canvas announcer: the stage document has no window");
    let element = stage.ownerDocument.createElement("div");
    element.setAttribute("role", "status"), element.setAttribute("aria-live", "polite"), element.setAttribute("aria-atomic", "true"), Object.assign(element.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
      border: "0"
    }), stage.append(element);
    let timer, repeat, message = "";
    return {
      say(value) {
        message = value, timer === void 0 && (timer = view.setTimeout(() => {
          if (timer = void 0, element.textContent !== message) {
            element.textContent = message;
            return;
          }
          element.textContent = "";
          let text = message;
          repeat = view.setTimeout(() => {
            repeat = void 0, element.textContent = text;
          }, 0);
        }, 500));
      },
      dispose() {
        timer !== void 0 && view.clearTimeout(timer), repeat !== void 0 && view.clearTimeout(repeat), element.remove();
      }
    };
  }

  // ../canvas/src/spatial-grid.mjs
  function intersects(left, right) {
    return left.x <= right.x + right.width && left.x + left.width >= right.x && left.y <= right.y + right.height && left.y + left.height >= right.y;
  }
  function sameBounds(left, right) {
    return left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height;
  }
  function createSpatialGrid(cellSize = 512) {
    positive("culling.cellSize", cellSize);
    let bounds = /* @__PURE__ */ new Map(), cells = /* @__PURE__ */ new Map(), membership = /* @__PURE__ */ new Map(), spanning = /* @__PURE__ */ new Set();
    function range(value) {
      let left = Math.floor(value.x / cellSize), top = Math.floor(value.y / cellSize), right = Math.floor((value.x + value.width) / cellSize), bottom = Math.floor((value.y + value.height) / cellSize), columns = right - left + 1, rows = bottom - top + 1, count3 = columns * rows;
      return { left, top, columns, rows, count: Number.isFinite(count3) ? count3 : 1 / 0 };
    }
    function remove(id) {
      for (let key of membership.get(id) ?? []) {
        let cell = cells.get(key);
        cell?.delete(id), cell?.size === 0 && cells.delete(key);
      }
      return membership.delete(id), spanning.delete(id), bounds.delete(id);
    }
    function set(id, value) {
      let previous = bounds.get(id);
      if (previous && sameBounds(previous, value)) return !1;
      remove(id), bounds.set(id, { ...value });
      let area = range(value);
      if (area.count > 4096)
        return spanning.add(id), !0;
      let keys = [];
      for (let column = 0; column < area.columns; column += 1)
        for (let row = 0; row < area.rows; row += 1) {
          let key = `${area.left + column},${area.top + row}`, cell = cells.get(key);
          cell || (cell = /* @__PURE__ */ new Set(), cells.set(key, cell)), cell.add(id), keys.push(key);
        }
      return membership.set(id, keys), !0;
    }
    function query(value) {
      let area = range(value), candidates = new Set(spanning);
      if (area.count > cells.size)
        for (let id of bounds.keys()) candidates.add(id);
      else
        for (let column = 0; column < area.columns; column += 1)
          for (let row = 0; row < area.rows; row += 1)
            for (let id of cells.get(`${area.left + column},${area.top + row}`) ?? [])
              candidates.add(id);
      let result = /* @__PURE__ */ new Set();
      for (let id of candidates) {
        let entry = bounds.get(id);
        entry && intersects(entry, value) && result.add(id);
      }
      return result;
    }
    return {
      set,
      remove,
      query,
      clear() {
        bounds.clear(), cells.clear(), membership.clear(), spanning.clear();
      }
    };
  }

  // ../canvas/src/culling.mjs
  function createCulling(options2 = {}) {
    let marginFactor = options2.marginFactor ?? 2, chunkSize = options2.chunkSize ?? 200;
    positive("culling.marginFactor", marginFactor), marginFactor < 1 && invalid("culling.marginFactor", marginFactor), positive("culling.chunkSize", chunkSize);
    let grid = createSpatialGrid(options2.cellSize), nodes = /* @__PURE__ */ new Map(), sources = /* @__PURE__ */ new Map(), mounted = /* @__PURE__ */ new Set(), moved = /* @__PURE__ */ new Set(), region, dirty = !0, pinsDirty = !1, desired = /* @__PURE__ */ new Set(), queue = [], frozenUntil = -1 / 0, optionalMounts = !0;
    function getPinnedIds() {
      let pins = /* @__PURE__ */ new Set();
      for (let ids of sources.values())
        for (let id of ids) nodes.has(id) && pins.add(id);
      return pins;
    }
    function setNodes(next) {
      let changed = [];
      for (let [id, previous] of nodes)
        if (!next.has(id))
          grid.remove(id), moved.delete(id), changed.push(id);
        else {
          let current = next.get(id);
          current && !sameBounds(previous.bounds, current.bounds) ? (moved.add(id), changed.push(id)) : current && (previous.kind !== current.kind || previous.frame !== current.frame) && changed.push(id);
        }
      for (let [id, node] of next)
        nodes.has(id) || changed.push(id), grid.set(id, node.bounds);
      return nodes = new Map(next), changed.length && (dirty = !0), changed;
    }
    function update(viewport, now, gesture, zoomChanged, admitOptional = !0) {
      zoomChanged && (frozenUntil = now + 120);
      let outside = !region || viewport.x < region.x || viewport.y < region.y || viewport.x + viewport.width > region.x + region.width || viewport.y + viewport.height > region.y + region.height, reevaluate = dirty || outside || zoomChanged || optionalMounts !== admitOptional;
      optionalMounts = admitOptional;
      let pins = getPinnedIds();
      if (reevaluate && (region = {
        x: viewport.x - viewport.width * (marginFactor - 1) / 2,
        y: viewport.y - viewport.height * (marginFactor - 1) / 2,
        width: viewport.width * marginFactor,
        height: viewport.height * marginFactor
      }, desired = admitOptional ? grid.query(region) : /* @__PURE__ */ new Set()), reevaluate || pinsDirty) {
        let centerX = viewport.x + viewport.width / 2, centerY = viewport.y + viewport.height / 2, distance = (id) => {
          let node = nodes.get(id);
          return node ? (node.bounds.x + node.bounds.width / 2 - centerX) ** 2 + (node.bounds.y + node.bounds.height / 2 - centerY) ** 2 : 1 / 0;
        };
        queue = [...desired].filter((id) => !mounted.has(id) && !pins.has(id)).sort((left, right) => distance(left) - distance(right) || left.localeCompare(right));
      }
      let admitted = [], removed = [];
      for (let id of mounted)
        (!nodes.has(id) || !pins.has(id) && !desired.has(id)) && (mounted.delete(id), removed.push(id));
      for (let id of pins)
        mounted.has(id) || (mounted.add(id), admitted.push(id));
      let frozen = now < frozenUntil;
      if (!frozen && (!gesture || reevaluate)) {
        let batch = queue.splice(0, chunkSize);
        for (let id of batch)
          mounted.add(id), admitted.push(id);
      }
      let geometry = [...moved];
      return moved.clear(), dirty = !1, pinsDirty = !1, {
        ...admitted.length || removed.length ? { mount: { mounted: admitted, unmounted: removed } } : {},
        geometry,
        pending: queue.length > 0 && !gesture && !frozen,
        ...queue.length && frozen ? { resumeAt: frozenUntil } : {}
      };
    }
    return {
      setNodes,
      update,
      hitTest(point2) {
        return grid.query({ ...point2, width: 0, height: 0 }).values().next().value ?? null;
      },
      setPinned(source, ids) {
        let previous = sources.get(source);
        previous?.size === ids.length && ids.every((id) => previous.has(id)) || (ids.length ? sources.set(source, new Set(ids)) : sources.delete(source), pinsDirty = !0);
      },
      getMountedIds: () => [...mounted],
      getPinnedIds,
      query(region2) {
        let result = [];
        for (let id of grid.query(region2)) {
          let node = nodes.get(id);
          node && result.push(node);
        }
        return result;
      },
      getRegion: () => region,
      reset() {
        mounted.clear(), moved.clear(), region = void 0, desired.clear(), queue = [], frozenUntil = -1 / 0, dirty = !0;
      }
    };
  }

  // ../canvas/src/edges.mjs
  function boundsOf(points) {
    let left = 1 / 0, top = 1 / 0, right = -1 / 0, bottom = -1 / 0;
    for (let value of points)
      left = Math.min(left, value.x), top = Math.min(top, value.y), right = Math.max(right, value.x), bottom = Math.max(bottom, value.y);
    return { x: left, y: top, width: right - left, height: bottom - top };
  }
  function buildEdgeRoutes(nodes, edges, region, strict = !1) {
    let byId = new Map(Array.from(nodes, (node) => [node.id, node])), grouped = /* @__PURE__ */ new Map(), diagnostics = [], drawnBounds = [], ids = /* @__PURE__ */ new Set();
    for (let edge of edges) {
      (!edge || typeof edge != "object") && invalid("edge", edge);
      for (let field of ["id", "from", "to", "style"])
        (typeof edge[field] != "string" || !edge[field].length) && invalid(`edge.${field}`, edge[field]);
      ids.has(edge.id) && invalid("edge.id", edge.id), ids.add(edge.id), edge.points !== void 0 && ((!Array.isArray(edge.points) || edge.points.length < 2) && invalid(`edge.${edge.id}.points`, edge.points), edge.points.forEach((value, index2) => {
        point(`edge.${edge.id}.points[${index2}]`, value);
      }));
      let from = byId.get(edge.from), to = byId.get(edge.to);
      if (!from || !to) {
        let unknown = [from ? null : edge.from, to ? null : edge.to].filter((id) => id !== null), reason = `Edge ${edge.id} references unknown endpoint ${unknown.join(", ")}`;
        if (strict) throw new TypeError(`edge.${edge.id}: ${reason}`);
        diagnostics.push({ code: "unknown-endpoint", id: edge.id, reason });
        continue;
      }
      let points = edge.points ?? [
        { x: from.bounds.x + from.bounds.width / 2, y: from.bounds.y + from.bounds.height / 2 },
        { x: to.bounds.x + to.bounds.width / 2, y: to.bounds.y + to.bounds.height / 2 }
      ], bounds = boundsOf(points);
      if (!intersects(bounds, region)) continue;
      drawnBounds.push(
        { x: bounds.x, y: bounds.y },
        {
          x: bounds.x + bounds.width,
          y: bounds.y + bounds.height
        }
      );
      let path = points.map((value, index2) => `${index2 === 0 ? "M" : "L"}${value.x} ${value.y}`).join(" "), paths = grouped.get(edge.style);
      paths ? paths.push(path) : grouped.set(edge.style, [path]);
    }
    return {
      paths: new Map(Array.from(grouped, ([style, paths]) => [style, paths.join(" ")])),
      bounds: drawnBounds.length ? boundsOf(drawnBounds) : null,
      diagnostics
    };
  }
  function createEdgeLayer(element) {
    let document2 = element.ownerDocument, namespace = "http://www.w3.org/2000/svg", svg = element.localName === "svg" ? element : document2.createElementNS(namespace, "svg");
    svg !== element && element.append(svg);
    let paths = /* @__PURE__ */ new Map(), attributes = new Map(
      ["x", "y", "width", "height", "viewBox"].map((name) => [name, svg.getAttribute(name)])
    ), originalStyle = svg.getAttribute("style");
    return Object.assign(svg.style, { position: "absolute", overflow: "hidden", pointerEvents: "none" }), {
      update(routes) {
        let routeBounds = routes.bounds, bounds = routeBounds ? {
          x: routeBounds.x - (routeBounds.width === 0 ? 0.5 : 0),
          y: routeBounds.y - (routeBounds.height === 0 ? 0.5 : 0),
          width: routeBounds.width || 1,
          height: routeBounds.height || 1
        } : { x: 0, y: 0, width: 0, height: 0 };
        svg.setAttribute("x", String(bounds.x)), svg.setAttribute("y", String(bounds.y)), svg.setAttribute("width", String(bounds.width)), svg.setAttribute("height", String(bounds.height)), svg.setAttribute("viewBox", `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`), Object.assign(svg.style, {
          left: `${bounds.x}px`,
          top: `${bounds.y}px`,
          width: `${bounds.width}px`,
          height: `${bounds.height}px`
        });
        for (let [style, path] of paths)
          routes.paths.has(style) || (path.remove(), paths.delete(style));
        for (let [style, data] of routes.paths) {
          let path = paths.get(style);
          path || (path = document2.createElementNS(namespace, "path"), path.setAttribute("data-canvas-edge-style", style), path.setAttribute("class", style), path.setAttribute("fill", "none"), svg.append(path), paths.set(style, path)), path.getAttribute("d") !== data && path.setAttribute("d", data);
        }
      },
      dispose() {
        for (let path of paths.values()) path.remove();
        if (svg !== element) svg.remove();
        else {
          for (let [name, value] of attributes)
            value === null ? svg.removeAttribute(name) : svg.setAttribute(name, value);
          originalStyle === null ? svg.removeAttribute("style") : svg.setAttribute("style", originalStyle);
        }
      }
    };
  }

  // ../canvas/src/focus.mjs
  var CanvasFocusError = class extends Error {
    code;
    constructor(id, code) {
      super(
        `Cannot focus node ${id}: ${code === "unknown-node" ? "unknown node" : "no focusable element registered within two frames"}`
      ), this.name = "CanvasFocusError", this.code = code;
    }
  };
  function navigateSpatial(nodes, from, direction) {
    let x = from.bounds.x + from.bounds.width / 2, y = from.bounds.y + from.bounds.height / 2, nearest = null, distance = 1 / 0;
    for (let node of nodes) {
      if (node.id === from.id) continue;
      let dx = node.bounds.x + node.bounds.width / 2 - x, dy = node.bounds.y + node.bounds.height / 2 - y, forward = direction === "right" ? dx : direction === "left" ? -dx : direction === "down" ? dy : -dy, sideways = Math.abs(direction === "right" || direction === "left" ? dy : dx);
      if (forward <= 0 || sideways > forward) continue;
      let next = dx * dx + dy * dy;
      (next < distance || next === distance && nearest !== null && node.id.localeCompare(nearest, void 0, { numeric: !0 }) < 0) && (nearest = node.id, distance = next);
    }
    return nearest;
  }
  function createRovingFocus(stage, registered, outline, current, changed, reveal, pending) {
    let attributes = /* @__PURE__ */ new Map(), requests = /* @__PURE__ */ new Set(), pendingIds = "", parking = !1, parked = !1, skippingTab = !1, order, positions = /* @__PURE__ */ new Map(), fallback, fallbackDirty = !0, tabStop;
    function tabindex(element, value) {
      element.getAttribute("tabindex") !== value && element.setAttribute("tabindex", value);
    }
    function moveTabStop(element) {
      tabStop !== element && (tabStop && tabindex(tabStop, "-1"), tabStop = element, tabStop && tabindex(tabStop, "0"));
    }
    function sync() {
      let next = outline();
      order !== next && (order = next, positions = new Map(order.map((id2, index2) => [id2, index2])), fallbackDirty = !0, tabStop || (fallback = order[0]));
      let id = current(), first = id ?? fallback, stageIndex = id === null ? 0 : -1;
      stage.tabIndex !== stageIndex && (stage.tabIndex = stageIndex), moveTabStop(skippingTab || first === void 0 ? void 0 : registered.get(first));
    }
    function restore(element) {
      if (!attributes.has(element)) return;
      let original = attributes.get(element);
      original == null ? element.removeAttribute("tabindex") : element.setAttribute("tabindex", original), attributes.delete(element);
    }
    function focusElement(element) {
      return "focus" in element && typeof element.focus == "function" && element.focus({ preventScroll: !0 }), stage.ownerDocument.activeElement === element;
    }
    function updatePending() {
      let ids = [...requests].map((request) => request.id), key = JSON.stringify(ids);
      key !== pendingIds && (pendingIds = key, pending(ids));
    }
    let focusIn = (event) => {
      if (parking) return;
      let target = event.target, fallback2 = target && "closest" in target && typeof target.closest == "function" ? target.closest("[data-canvas-node-id]")?.getAttribute("data-canvas-node-id") : null, id = [...registered].find(([, element]) => event.composedPath().includes(element))?.[0] ?? (fallback2 && outline().includes(fallback2) ? fallback2 : null);
      parked = !1, changed(id), sync(), id !== null && reveal(id);
    }, focusOut = (event) => {
      let target = event.relatedTarget;
      target && "nodeType" in target && stage.contains(target) || parked && !target || (parked = !1, changed(null), sync());
    }, tab = (event) => {
      event.key !== "Tab" || current() !== null || stage.ownerDocument.activeElement !== stage || (skippingTab = !0, sync(), pending([...requests].map((request) => request.id)));
    };
    return stage.addEventListener("focusin", focusIn), stage.addEventListener("focusout", focusOut), stage.addEventListener("keydown", tab), sync(), {
      sync,
      register(id, element) {
        attributes.has(element) || attributes.set(element, element.getAttribute("tabindex")), !skippingTab && id === (current() ?? fallback) ? moveTabStop(element) : element !== tabStop && tabindex(element, "-1"), !fallbackDirty && (positions.get(id) ?? 1 / 0) < (fallback === void 0 ? 1 / 0 : positions.get(fallback) ?? 1 / 0) && (fallback = id);
      },
      unregister(id, element) {
        current() === id && stage.ownerDocument.activeElement === element && (parking = !0, parked = !0, stage.focus({ preventScroll: !0 }), parking = !1), element === tabStop && (tabStop = void 0), id === fallback && (fallbackDirty = !0), restore(element);
      },
      request(id) {
        return new Promise((resolve, reject) => {
          requests.add({ id, resolve, reject, frames: 0 }), updatePending();
        });
      },
      update(settled) {
        if (fallbackDirty) {
          let first = 1 / 0;
          fallback = void 0;
          for (let id2 of registered.keys()) {
            let position = positions.get(id2) ?? 1 / 0;
            position < first && (first = position, fallback = id2);
          }
          fallbackDirty = !1;
        }
        skippingTab && (skippingTab = !1), sync();
        let id = current(), element = id === null ? void 0 : registered.get(id);
        if (parked && element && focusElement(element) && (parked = !1), !settled) return requests.size > 0;
        for (let request of requests) {
          let element2 = registered.get(request.id);
          element2 && focusElement(element2) ? (changed(request.id), sync(), reveal(request.id), requests.delete(request), request.resolve()) : request.frames++ >= 2 && (requests.delete(request), request.reject(new CanvasFocusError(request.id, "no-element")));
        }
        return updatePending(), requests.size > 0;
      },
      dispose() {
        stage.removeEventListener("focusin", focusIn), stage.removeEventListener("focusout", focusOut), stage.removeEventListener("keydown", tab);
        for (let request of requests)
          request.reject(new CanvasFocusError(request.id, "no-element"));
        requests.clear(), pending([]);
        for (let element of attributes.keys()) restore(element);
      }
    };
  }

  // ../canvas/src/frame-loader.mjs
  function createFrameLoader(elements, getNodes, getMountedIds, getCenter, getBudget, onChange = () => {
  }) {
    let { stage } = elements, document2 = stage.ownerDocument, entries = /* @__PURE__ */ new Map(), cache = document2.createElement("div");
    cache.setAttribute("data-canvas-frame-cache", ""), Object.assign(cache.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "0",
      height: "0"
    });
    let moving = !1, disposed = !1, requested = null, expiry;
    function showTile(entry) {
      entry.anchor.parentNode && !entry.tile.isConnected && entry.anchor.after(entry.tile);
    }
    function suspend(entry) {
      entry.frame.removeAttribute("src"), entry.frame.removeAttribute("srcdoc"), entry.frame.removeAttribute("data-canvas-frame-live"), entry.frame.removeAttribute("data-canvas-frame-booting"), entry.frame.remove(), entry.portal.remove(), entry.live = !1, entry.booting = !1, entry.retainedUntil = null, showTile(entry);
    }
    function boot(entry) {
      entry.failed = !1, entry.tile.querySelector('[role="status"]')?.remove(), entry.live = !0, entry.booting = !0, entry.retainedUntil = null, entry.frame.setAttribute("data-canvas-frame-live", "true"), entry.frame.setAttribute("data-canvas-frame-booting", "true"), entry.source !== null && entry.frame.setAttribute("src", entry.source), entry.content !== null && entry.frame.setAttribute("srcdoc", entry.content), entry.tile.remove(), Object.assign(entry.frame.style, {
        position: "absolute",
        left: "0",
        top: "0",
        width: "100%",
        height: "100%",
        transform: "none"
      }), entry.portal.append(entry.frame), cache.isConnected || elements.world.append(cache), cache.append(entry.portal), onChange();
    }
    function createEntry(id, frame, node) {
      let anchor = document2.createComment(""), portal = document2.createElement("div");
      portal.setAttribute("data-canvas-node-id", id), portal.setAttribute("data-canvas-frame-portal", id), portal.style.position = "absolute";
      let tile = document2.createElement("div");
      tile.className = "canvas-frame-placeholder", tile.setAttribute("data-canvas-frame-placeholder", id), tile.style.cssText = frame.style.cssText, tile.style.width = `${node.bounds.width}px`, tile.style.height = `${node.bounds.height}px`, frame.getAttribute("data-canvas-node-id") === id && tile.setAttribute("data-canvas-node-id", id);
      let load = document2.createElement("button");
      load.type = "button", load.textContent = "Load", load.setAttribute("aria-label", `Load frame ${id}`), load.addEventListener("click", () => request(id)), tile.append(load);
      let entry = {
        id,
        frame,
        tile,
        portal,
        anchor,
        originalStyle: frame.getAttribute("style"),
        source: frame.getAttribute("src"),
        content: frame.getAttribute("srcdoc"),
        live: !1,
        booting: !1,
        retainedUntil: null,
        failed: !1,
        loaded() {
          !entry.live || !entry.booting || disposed || (entry.booting = !1, entry.frame.removeAttribute("data-canvas-frame-booting"), onChange(), refresh());
        },
        failedLoad() {
          if (!entry.live || !entry.booting || disposed) return;
          entry.failed = !0, suspend(entry);
          let error = document2.createElement("span");
          error.setAttribute("role", "status"), error.textContent = `Frame ${id} failed to load. `, entry.tile.prepend(error), onChange(), refresh();
        }
      };
      return frame.addEventListener("load", entry.loaded), frame.addEventListener("error", entry.failedLoad), frame.replaceWith(anchor, tile), frame.removeAttribute("src"), frame.removeAttribute("srcdoc"), entry;
    }
    function refresh() {
      if (disposed) return;
      expiry !== void 0 && clearTimeout(expiry), expiry = void 0;
      let nodes = new Map(
        Array.from(getNodes()).filter((node) => node.frame).map((node) => [node.id, node])
      );
      if (!nodes.size && !entries.size) return;
      let mounted = getMountedIds(), center = getCenter();
      for (let frame of stage.querySelectorAll("iframe")) {
        if (cache.contains(frame)) continue;
        let id = frame.closest("[data-canvas-node-id]")?.getAttribute("data-canvas-node-id");
        if (!id) continue;
        let node = nodes.get(id);
        if (!node) continue;
        let current = entries.get(id);
        current ? current.frame !== frame && (current.anchor.remove(), current.anchor = document2.createComment(""), frame.replaceWith(current.anchor), current.live || showTile(current)) : entries.set(id, createEntry(id, frame, node));
      }
      let now = Date.now();
      for (let [id, entry] of entries)
        if (!nodes.has(id))
          suspend(entry), entry.tile.remove(), entry.anchor.remove(), entry.frame.removeEventListener("load", entry.loaded), entry.frame.removeEventListener("error", entry.failedLoad), entries.delete(id);
        else {
          let node = nodes.get(id);
          if (!node) continue;
          let bounds = node.bounds, geometry = {
            left: `${bounds.x}px`,
            top: `${bounds.y}px`,
            width: `${bounds.width}px`,
            height: `${bounds.height}px`
          };
          for (let [property, value] of Object.entries(geometry))
            entry.portal.style.getPropertyValue(property) !== value && entry.portal.style.setProperty(property, value);
          entry.tile.style.width !== geometry.width && (entry.tile.style.width = geometry.width), entry.tile.style.height !== geometry.height && (entry.tile.style.height = geometry.height);
          let hidden = !mounted.has(id);
          entry.portal.hidden !== hidden && (entry.portal.hidden = hidden), !mounted.has(id) && entry.live ? (entry.retainedUntil ??= now + 18e4, now >= entry.retainedUntil && suspend(entry)) : mounted.has(id) && (entry.retainedUntil = null);
        }
      function distance(id) {
        let bounds = nodes.get(id)?.bounds;
        return bounds ? (bounds.x + bounds.width / 2 - center.x) ** 2 + (bounds.y + bounds.height / 2 - center.y) ** 2 : 1 / 0;
      }
      let candidates = Array.from(entries.values()).filter(
        (entry) => mounted.has(entry.id) && !entry.failed && (entry.live || entry.anchor.isConnected)
      );
      candidates.sort((a, b) => a.id === requested ? -1 : b.id === requested ? 1 : distance(a.id) - distance(b.id) || a.id.localeCompare(b.id));
      let budget = getBudget(), chosen = new Set(candidates.slice(0, budget).map((entry) => entry.id)), remaining = Math.max(0, budget - chosen.size), retained = Array.from(entries.values()).filter(
        (entry) => entry.live && !mounted.has(entry.id)
      );
      retained.sort((a, b) => (b.retainedUntil ?? 0) - (a.retainedUntil ?? 0));
      for (let entry of retained)
        remaining > 0 && (chosen.add(entry.id), remaining -= 1);
      for (let entry of entries.values()) entry.live && !chosen.has(entry.id) && suspend(entry);
      if (!moving && !Array.from(entries.values()).some((entry) => entry.booting)) {
        let next = candidates.find((entry) => chosen.has(entry.id) && !entry.live);
        next && boot(next);
      }
      let deadlines = Array.from(entries.values()).flatMap(
        (entry) => entry.retainedUntil === null ? [] : [entry.retainedUntil]
      );
      deadlines.length && (expiry = setTimeout(refresh, Math.max(0, Math.min(...deadlines) - now)));
    }
    function request(id) {
      requested = id;
      let entry = id === null ? void 0 : entries.get(id);
      entry && (entry.failed = !1), refresh();
    }
    let observer = document2.defaultView ? new document2.defaultView.MutationObserver(refresh) : void 0;
    return observer?.observe(stage, { childList: !0, subtree: !0 }), refresh(), {
      refresh,
      request,
      setMoving(value) {
        moving !== value && (moving = value, refresh());
      },
      getLiveIds: () => new Set(
        Array.from(entries.values()).filter((entry) => entry.live).map((entry) => entry.id)
      ),
      dispose() {
        disposed = !0, observer?.disconnect(), expiry !== void 0 && clearTimeout(expiry);
        for (let entry of entries.values())
          entry.frame.removeEventListener("load", entry.loaded), entry.frame.removeEventListener("error", entry.failedLoad), entry.frame.removeAttribute("data-canvas-frame-live"), entry.frame.removeAttribute("data-canvas-frame-booting"), entry.source !== null && entry.frame.setAttribute("src", entry.source), entry.content !== null && entry.frame.setAttribute("srcdoc", entry.content), entry.originalStyle === null ? entry.frame.removeAttribute("style") : entry.frame.setAttribute("style", entry.originalStyle), entry.tile.remove(), entry.anchor.parentNode && entry.anchor.replaceWith(entry.frame);
        entries.clear(), cache.remove();
      }
    };
  }

  // ../canvas/src/frames.mjs
  function createFrames(elements, getNodes, deactivate) {
    let { stage } = elements, document2 = stage.ownerDocument, originals = /* @__PURE__ */ new Map(), position = stage.style.position, done = document2.createElement("button"), active = null, moving = !1, wrapper = null;
    done.type = "button", done.textContent = "Done", done.className = "canvas-frame-done", done.setAttribute("data-canvas-frame-done", ""), done.setAttribute("aria-label", "Done interacting with frame"), Object.assign(done.style, {
      position: "absolute",
      zIndex: "var(--canvas-z-screen-overlays, 10)",
      pointerEvents: "auto"
    }), done.hidden = !0, stage.append(done), document2.defaultView?.getComputedStyle(stage).position === "static" && (stage.style.position = "relative");
    function setFrameState(frame, pointerEvents, tabindex) {
      frame.style.pointerEvents !== pointerEvents && (frame.style.pointerEvents = pointerEvents), frame.getAttribute("tabindex") !== tabindex && (tabindex === null ? frame.removeAttribute("tabindex") : frame.setAttribute("tabindex", tabindex));
    }
    function restore(frame) {
      let original = originals.get(frame);
      original && (setFrameState(frame, original.pointerEvents, original.tabindex), originals.delete(frame));
    }
    function updatePosition() {
      if (active === null) return;
      let stageRect = stage.getBoundingClientRect(), frameRect = wrapper?.getBoundingClientRect(), width = done.offsetWidth || 60, height = done.offsetHeight || 32, left = `${Math.max(0, Math.min(stageRect.width - width, (frameRect?.right ?? stageRect.right) - stageRect.left - width))}px`, top = `${Math.max(0, Math.min(stageRect.height - height, (frameRect?.top ?? stageRect.top) - stageRect.top))}px`;
      done.style.left !== left && (done.style.left = left), done.style.top !== top && (done.style.top = top);
    }
    function refresh() {
      let frameIds = /* @__PURE__ */ new Set();
      for (let node of getNodes()) node.frame && frameIds.add(node.id);
      if (wrapper = null, !frameIds.size && !originals.size && active === null) return;
      let present = /* @__PURE__ */ new Set(), frames = frameIds.size ? stage.querySelectorAll("iframe") : [];
      for (let frame of frames) {
        let owner = frame.closest("[data-canvas-node-id]"), id = owner?.getAttribute("data-canvas-node-id");
        if (!id || !frameIds.has(id)) continue;
        present.add(frame);
        let original = originals.get(frame);
        original || (original = {
          pointerEvents: frame.style.pointerEvents,
          tabindex: frame.getAttribute("tabindex")
        }, originals.set(frame, original));
        let interactive = id === active && !moving;
        setFrameState(frame, interactive ? "auto" : "none", interactive ? original.tabindex : "-1"), id === active && (wrapper = owner);
      }
      for (let frame of originals.keys()) present.has(frame) || restore(frame);
      let hidden = active === null;
      done.hidden !== hidden && (done.hidden = hidden), updatePosition();
    }
    function outside(event) {
      let path = event.composedPath();
      active !== null && !path.includes(done) && !(wrapper && path.includes(wrapper)) && deactivate();
    }
    function finish() {
      deactivate(), stage.focus({ preventScroll: !0 });
    }
    done.addEventListener("click", finish), document2.addEventListener("pointerdown", outside, !0), document2.defaultView?.addEventListener("resize", refresh), refresh();
    let observer = document2.defaultView ? new document2.defaultView.MutationObserver(refresh) : void 0;
    return observer?.observe(stage, { childList: !0, subtree: !0 }), {
      setActive(id) {
        active !== id && (active = id, refresh());
      },
      setMoving(value) {
        moving !== value && (moving = value, refresh());
      },
      refresh,
      updatePosition,
      dispose() {
        observer?.disconnect();
        for (let frame of originals.keys()) restore(frame);
        done.removeEventListener("click", finish), document2.removeEventListener("pointerdown", outside, !0), document2.defaultView?.removeEventListener("resize", refresh), done.remove(), stage.style.position !== position && (stage.style.position = position);
      }
    };
  }

  // ../canvas/src/input.mjs
  function editable(target) {
    if (!target || !("nodeType" in target)) return !1;
    let element = target.nodeType === 1 ? target : target.parentElement;
    if (!element) return !1;
    if (element.closest("input, textarea, select")) return !0;
    let owner = element.closest("[contenteditable]");
    return owner !== null && owner.getAttribute("contenteditable") !== "false";
  }
  function isEditable(event) {
    let target = event.target, active = (target && "ownerDocument" in target ? target.ownerDocument : event.view?.document ?? globalThis.document)?.activeElement ?? null;
    for (; active; ) {
      let nested = active.shadowRoot?.activeElement ?? (active.localName === "iframe" ? active.contentDocument?.activeElement : null);
      if (!nested) break;
      active = nested;
    }
    return editable(target) || editable(active) || event.composedPath().some(editable);
  }
  function normalizeWheel(event, stageHeight) {
    let multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stageHeight : 1;
    return { x: event.deltaX * multiplier, y: event.deltaY * multiplier };
  }
  function pinch(pointers) {
    let points = [...pointers.values()].filter((point2) => point2.touch), [first, second] = points;
    return !first || !second ? null : {
      center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
      distance: Math.hypot(first.x - second.x, first.y - second.y)
    };
  }
  function bindInput(elements, controller, getPointerMode, shortcutsEnabled, setGesture = () => {
  }) {
    let { stage } = elements, document2 = stage.ownerDocument, view = document2.defaultView, removers = [], pointers = /* @__PURE__ */ new Map(), touchAction = stage.style.touchAction, space = !1, composing = !1, gestureScale = 1;
    stage.style.touchAction = "none";
    function listen(target, type, listener, options2) {
      target.addEventListener(type, listener, options2), removers.push(() => target.removeEventListener(type, listener, options2));
    }
    function local(point2) {
      let rect2 = stage.getBoundingClientRect();
      return { x: point2.x - rect2.left, y: point2.y - rect2.top };
    }
    listen(
      stage,
      "wheel",
      (raw) => {
        let event = raw, delta = normalizeWheel(event, stage.getBoundingClientRect().height);
        event.preventDefault(), event.ctrlKey || event.metaKey ? controller.zoomAt(
          Math.min(
            1.25,
            Math.max(0.8, Math.exp(-delta.y * 0.01))
          ),
          local({ x: event.clientX, y: event.clientY })
        ) : controller.panBy(delta.x, delta.y);
      },
      { passive: !1 }
    ), listen(stage, "keydown", (raw) => {
      let event = raw;
      if (!(composing || event.isComposing || isEditable(event))) {
        if ((event.key === " " || event.code === "Space") && !event.ctrlKey && !event.metaKey && !event.altKey) {
          if (controller.handleKey(event)) return;
          document2.activeElement === stage && (space = !0, event.preventDefault());
          return;
        }
        event.key.length === 1 && !shortcutsEnabled() || controller.handleKey(event) && event.preventDefault();
      }
    }), listen(document2, "keyup", (raw) => {
      let event = raw;
      (event.key === " " || event.code === "Space") && (space = !1);
    }), listen(stage, "compositionstart", () => {
      composing = !0, space = !1;
    }), listen(stage, "compositionend", () => {
      composing = !1;
    }), listen(stage, "pointerdown", (raw) => {
      let event = raw, touch = event.pointerType === "touch", target = event.target;
      if (editable(target)) return;
      let interactive = target && "closest" in target && typeof target.closest == "function" && target.closest('button, a, [role="button"]');
      if (touch && interactive && !interactive.hasAttribute("data-canvas-node-id")) return;
      let occupied = interactive || target && "closest" in target && typeof target.closest == "function" && target.closest("[data-canvas-node-id]"), pan = event.button === 1 || space || event.button === 0 && getPointerMode() === "pan" && !occupied;
      !touch && !pan || (pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, touch }), setGesture(!0), stage.setPointerCapture && stage.setPointerCapture(event.pointerId), (touch || pan) && (stage.focus({ preventScroll: !0 }), event.preventDefault()));
    }), listen(stage, "pointermove", (raw) => {
      let event = raw, previous = pointers.get(event.pointerId);
      if (!previous) return;
      let before = pinch(pointers);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, touch: previous.touch });
      let after = pinch(pointers);
      before && after ? (controller.panBy(before.center.x - after.center.x, before.center.y - after.center.y), before.distance > 0 && after.distance > 0 && controller.zoomAt(after.distance / before.distance, local(after.center))) : (!previous.touch || space || getPointerMode() === "pan") && controller.panBy(previous.x - event.clientX, previous.y - event.clientY), event.preventDefault();
    });
    function release(raw) {
      let event = raw;
      pointers.delete(event.pointerId), setGesture(pointers.size > 0), stage.hasPointerCapture?.(event.pointerId) && stage.releasePointerCapture(event.pointerId);
    }
    listen(stage, "pointerup", release), listen(stage, "pointercancel", release), listen(stage, "lostpointercapture", (raw) => {
      pointers.delete(raw.pointerId), setGesture(pointers.size > 0);
    });
    function reset() {
      space = !1, composing = !1;
      for (let pointerId of pointers.keys())
        stage.hasPointerCapture?.(pointerId) && stage.releasePointerCapture(pointerId);
      pointers.clear(), setGesture(!1);
    }
    return view && listen(view, "blur", reset), listen(stage, "blur", () => {
      space = !1, composing = !1;
    }), listen(stage, "focusout", () => {
      space = !1, composing = !1;
    }), view && ("GestureEvent" in view || "ongesturestart" in stage) && (listen(
      stage,
      "gesturestart",
      (event) => {
        gestureScale = 1, setGesture(!0), event.preventDefault();
      },
      { passive: !1 }
    ), listen(
      stage,
      "gesturechange",
      (raw) => {
        let event = raw;
        !Number.isFinite(event.scale) || event.scale <= 0 || (event.preventDefault(), controller.zoomAt(
          event.scale / gestureScale,
          local({ x: event.clientX, y: event.clientY })
        ), gestureScale = event.scale);
      },
      { passive: !1 }
    ), listen(
      stage,
      "gestureend",
      (event) => {
        event.preventDefault(), gestureScale = 1, setGesture(!1);
      },
      { passive: !1 }
    )), {
      dispose() {
        reset();
        for (let remove of removers) remove();
        stage.style.touchAction = touchAction;
      }
    };
  }

  // ../canvas/src/keyboard.mjs
  function keyAction(event, arrows, shortcuts) {
    if (event.ctrlKey || event.metaKey || event.altKey) return null;
    let key = event.key;
    if (key.startsWith("Arrow")) {
      if (arrows === "none") return null;
      let direction = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[key];
      return direction ? { type: event.shiftKey ? "pan" : "navigate", direction } : null;
    }
    return key === "Enter" || key === " " ? { type: "select" } : key === "Escape" ? { type: "escape" } : key === "Home" ? { type: "first" } : key === "End" ? { type: "last" } : shortcuts() ? key === "+" || key === "=" ? { type: "zoom", factor: 1.25 } : key === "-" ? { type: "zoom", factor: 1 / 1.25 } : key === "0" && !event.shiftKey ? { type: "reset" } : event.shiftKey && (key === "1" || key === "!" || event.code === "Digit1") ? { type: "fit-all" } : event.shiftKey && (key === "2" || key === "@" || event.code === "Digit2") ? { type: "fit-selection" } : null : null;
  }

  // ../canvas/src/lod.mjs
  function createLod(options2) {
    options2 !== void 0 && options2 !== !1 && (!options2 || typeof options2 != "object" || Array.isArray(options2)) && invalid("lod", options2);
    let settings = options2 || {}, compact = settings.compactBelow === void 0 ? 0.6 : settings.compactBelow, overview = settings.overviewBelow === void 0 ? 0.4 : settings.overviewBelow, hysteresis = settings.hysteresis === void 0 ? 0.03 : settings.hysteresis;
    positive("lod.compactBelow", compact), positive("lod.overviewBelow", overview), nonnegative("lod.hysteresis", hysteresis), overview >= compact && invalid("lod.overviewBelow >= lod.compactBelow", `${overview} >= ${compact}`), hysteresis >= overview && invalid("lod.hysteresis >= lod.overviewBelow", `${hysteresis} >= ${overview}`);
    let level = "dom";
    return {
      get: () => level,
      update(zoom) {
        return positive("camera.zoom", zoom), options2 === !1 || (level === "dom" && zoom < compact - hysteresis ? level = "compact" : level === "compact" && zoom > compact + hysteresis && (level = "dom"), level === "compact" && zoom < overview - hysteresis ? level = "overview" : level === "overview" && zoom > overview + hysteresis && (level = zoom > compact + hysteresis ? "dom" : "compact")), level;
      }
    };
  }

  // ../canvas/src/outline.mjs
  function createOutline(nodes, order) {
    if (!order)
      return Object.freeze(
        [...nodes].sort(
          (a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x || a.id.localeCompare(b.id, void 0, { numeric: !0 })
        ).map((node) => node.id)
      );
    let result = order(nodes.map((node) => ({ ...node, bounds: { ...node.bounds } }))), ids = new Set(nodes.map((node) => node.id));
    return (!Array.isArray(result) || result.length !== nodes.length || new Set(result).size !== nodes.length || result.some((id) => !ids.has(id))) && invalid("outlineOrder", result), Object.freeze([...result]);
  }

  // ../canvas/src/overview.mjs
  function validateTarget(target) {
    positive("target.width", target.width), positive("target.height", target.height), positive("target.devicePixelRatio", target.devicePixelRatio);
  }
  function forcedColors(context) {
    return "ownerDocument" in context.canvas && context.canvas.ownerDocument.defaultView?.matchMedia?.("(forced-colors: active)").matches === !0;
  }
  function drawEdges(context, input, transform, forced) {
    let { scale, offsetX, offsetY } = transform, byId = new Map(input.nodes.map((node) => [node.id, node]));
    context.lineWidth = 1, context.strokeStyle = forced ? "CanvasText" : "#6b7280", context.beginPath();
    for (let edge of input.edges) {
      let from = byId.get(edge.from)?.bounds, to = byId.get(edge.to)?.bounds;
      (edge.points ?? (from && to ? [
        { x: from.x + from.width / 2, y: from.y + from.height / 2 },
        { x: to.x + to.width / 2, y: to.y + to.height / 2 }
      ] : [])).forEach((value, index2) => {
        let x = value.x * scale + offsetX, y = value.y * scale + offsetY;
        index2 === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
      });
    }
    context.stroke();
  }
  function draw(context, input, transform, focus2, forced) {
    let { scale, offsetX, offsetY } = transform;
    drawEdges(context, input, transform, forced);
    let selection = new Set(input.selection);
    for (let node of input.nodes) {
      rect(`node.${node.id}.bounds`, node.bounds);
      let style = input.style(node), { x, y, width, height } = node.bounds, left = x * scale + offsetX, top = y * scale + offsetY, w = width * scale, h = height * scale;
      context.fillStyle = forced ? "CanvasText" : style.fill, context.strokeStyle = forced ? "CanvasText" : style.stroke, context.lineWidth = 1, context.fillRect(left, top, w, h), w >= 1 && h >= 1 && context.strokeRect(left + 0.5, top + 0.5, w - 1, h - 1), (selection.has(node.id) || focus2 === node.id) && (context.strokeStyle = forced ? "Highlight" : style.stroke, context.lineWidth = focus2 === node.id ? 3 : 2, context.strokeRect(left - 2, top - 2, w + 4, h + 4));
    }
  }
  function paintCameraOverview(context, input, target, scaleX, scaleY) {
    context.save();
    try {
      context.setTransform(scaleX, 0, 0, scaleY, 0, 0), context.clearRect(0, 0, target.width, target.height);
      let { zoom, x, y } = input.camera;
      draw(
        context,
        input,
        { scale: zoom, offsetX: -x * zoom, offsetY: -y * zoom },
        input.focus,
        forcedColors(context)
      );
    } finally {
      context.restore();
    }
  }
  function reusable(cache, input, forced, viewport) {
    return cache.input.nodes === input.nodes && cache.input.edges === input.edges && cache.input.selection.join("\0") === input.selection.join("\0") && cache.input.focus === input.focus && cache.input.width === input.width && cache.input.height === input.height && cache.input.devicePixelRatio === input.devicePixelRatio && input.camera.zoom / cache.camera.zoom >= 0.5 && input.camera.zoom / cache.camera.zoom <= 2 && cache.forced === forced && viewport.x >= cache.region.x && viewport.y >= cache.region.y && viewport.x + viewport.width <= cache.region.x + cache.region.width && viewport.y + viewport.height <= cache.region.y + cache.region.height;
  }
  var MAX_CACHE_PIXELS = 4194304;
  function cacheTarget(input) {
    let viewportPixels = input.width * input.height, factor = viewportPixels > MAX_CACHE_PIXELS ? 2 : Math.min(2, Math.sqrt(MAX_CACHE_PIXELS / viewportPixels));
    return {
      width: input.width + 2 * Math.floor(input.width * (factor - 1) / 2),
      height: input.height + 2 * Math.floor(input.height * (factor - 1) / 2),
      devicePixelRatio: input.devicePixelRatio
    };
  }
  function createOverviewLayer(canvas, style = () => ({ fill: "#e5e7eb", stroke: "#6b7280" }), renderer = "canvas", onPresent) {
    let context = canvas.getContext("2d");
    if (!context) throw new Error("Overview canvas 2D context is unavailable");
    let ownerView = canvas.ownerDocument.defaultView;
    if (!ownerView) throw new Error("Overview canvas requires a window");
    let view = ownerView;
    renderer !== "canvas" && renderer !== "worker" && invalid("overviewRenderer", renderer);
    let originalStyle = canvas.getAttribute("style");
    Object.assign(canvas.style, {
      position: "absolute",
      left: "0px",
      top: "0px",
      transformOrigin: "0 0",
      pointerEvents: "none",
      willChange: "transform"
    });
    let worker;
    if (renderer === "worker") {
      if (typeof Worker != "function" || typeof OffscreenCanvas != "function")
        throw new Error("Overview worker renderer requires Worker and OffscreenCanvas");
      worker = new Worker(new URL("./overview-worker.mjs", document.baseURI), { type: "module" });
    }
    let cache, zoomWasActive = !1, pending, queued, awaitingPresentation, lastWorkerScene, workerReady = !1, requestId = 0, frameClock = 0, clockRequest = 0, presentationRequest = 0, waitingBitmap, disposed = !1, redraws = 0, cameraFrame = 0, presentedCameraFrame = 0, cachePixelBytes = 0, presentationLagFrames = [], workerError;
    function position(current, input) {
      let scale = input.camera.zoom / current.camera.zoom;
      canvas.style.transform = `translate(${(current.camera.x - input.camera.x) * input.camera.zoom}px, ${(current.camera.y - input.camera.y) * input.camera.zoom}px) scale(${scale})`;
    }
    function size4(target, capped) {
      let { width, height, devicePixelRatio: devicePixelRatio2 } = target, pixelWidth = Math.ceil(width * devicePixelRatio2), pixelHeight = Math.ceil(height * devicePixelRatio2);
      if (capped && pixelWidth * pixelHeight > MAX_CACHE_PIXELS) {
        let availableDensity = Math.min(
          devicePixelRatio2,
          Math.sqrt(MAX_CACHE_PIXELS / (width * height))
        ), density = availableDensity >= 1 ? Math.floor(availableDensity) : availableDensity;
        pixelWidth = Math.min(MAX_CACHE_PIXELS, Math.max(1, Math.floor(width * density))), pixelHeight = Math.min(
          Math.floor(MAX_CACHE_PIXELS / pixelWidth),
          Math.max(1, Math.floor(height * density))
        );
      }
      return canvas.width !== pixelWidth && (canvas.width = pixelWidth), canvas.height !== pixelHeight && (canvas.height = pixelHeight), canvas.style.width = `${width}px`, canvas.style.height = `${height}px`, cachePixelBytes = canvas.width * canvas.height * 4, { scaleX: pixelWidth / width, scaleY: pixelHeight / height };
    }
    function scene(input, region) {
      let nodes = input.queryNodes?.(region) ?? input.nodes.filter((node) => intersects(node.bounds, region)), byId = new Map(input.nodes.map((node) => [node.id, node.bounds])), edges = input.edges.flatMap((edge) => {
        let from = byId.get(edge.from), to = byId.get(edge.to);
        return !from || !to ? [] : [
          {
            ...edge,
            points: edge.points ?? [
              { x: from.x + from.width / 2, y: from.y + from.height / 2 },
              { x: to.x + to.width / 2, y: to.y + to.height / 2 }
            ]
          }
        ];
      });
      return { nodes, edges };
    }
    function tick() {
      frameClock += 1, clockRequest = pending || awaitingPresentation ? view.requestAnimationFrame(tick) : 0;
    }
    function recordPresentation(job) {
      presentedCameraFrame = job.frame, presentationLagFrames.push(frameClock - job.sourceTick);
    }
    function dispatch(job) {
      if (!worker) throw new Error("Overview worker is unavailable");
      pending = job, redraws += 1, worker.postMessage(job.drawing), clockRequest || (clockRequest = view.requestAnimationFrame(tick));
    }
    function updateWorker(input, forced) {
      let previous = lastWorkerScene;
      if (previous && previous.forced === forced && previous.input.nodes === input.nodes && previous.input.edges === input.edges && previous.input.selection.join("\0") === input.selection.join("\0") && previous.input.focus === input.focus && previous.input.width === input.width && previous.input.height === input.height && previous.input.devicePixelRatio === input.devicePixelRatio && previous.input.camera.x === input.camera.x && previous.input.camera.y === input.camera.y && previous.input.camera.zoom === input.camera.zoom) return workerReady;
      let snapshot = { ...input, camera: { ...input.camera }, selection: [...input.selection] };
      lastWorkerScene = { input: snapshot, forced };
      let { nodes, edges } = scene(snapshot, {
        x: input.camera.x,
        y: input.camera.y,
        width: input.width / input.camera.zoom,
        height: input.height / input.camera.zoom
      });
      requestId += 1;
      let job = {
        frame: input.frame,
        sourceTick: frameClock,
        drawing: {
          id: requestId,
          nodes: nodes.map((node) => ({ node, ...style(node) })),
          edges,
          selection: snapshot.selection,
          focus: input.focus,
          camera: snapshot.camera,
          target: {
            width: input.width,
            height: input.height,
            devicePixelRatio: input.devicePixelRatio
          },
          forced
        }
      };
      return pending ? queued = job : dispatch(job), workerReady;
    }
    return worker && (canvas.style.transform = "none", worker.onerror = (event) => {
      workerError = new Error(`Overview worker failed: ${event.message}`), pending = void 0, queued = void 0, awaitingPresentation = void 0, onPresent?.();
    }, worker.onmessage = (event) => {
      let { id, bitmap } = event.data;
      if (disposed || id !== pending?.drawing.id) {
        bitmap.close();
        return;
      }
      let completed = pending;
      presentationRequest && view.cancelAnimationFrame(presentationRequest), waitingBitmap?.close(), waitingBitmap = bitmap, presentationRequest = view.requestAnimationFrame(() => {
        if (presentationRequest = 0, waitingBitmap = void 0, disposed) {
          bitmap.close();
          return;
        }
        size4(completed.drawing.target, !1), context.setTransform(1, 0, 0, 1, 0, 0), context.drawImage(bitmap, 0, 0), bitmap.close(), workerReady = !0, pending = void 0, canvas.style.visibility === "hidden" ? awaitingPresentation = completed : (awaitingPresentation = void 0, recordPresentation(completed));
        let next = queued;
        queued = void 0, next && dispatch(next), onPresent?.();
      });
    }), {
      update(input) {
        if (disposed) throw new Error("Overview layer is disposed");
        if (workerError) throw workerError;
        validateTarget(input), validateCamera(input.camera), cameraFrame = input.frame;
        let forced = forcedColors(context);
        if (worker) return updateWorker(input, forced);
        let settled = zoomWasActive && input.zooming !== !0;
        zoomWasActive = input.zooming === !0;
        let viewport = {
          x: input.camera.x,
          y: input.camera.y,
          width: input.width / input.camera.zoom,
          height: input.height / input.camera.zoom
        }, candidate = cache, same = candidate && !settled && reusable(candidate, input, forced, viewport);
        if (cache && (position(cache, input), presentedCameraFrame = input.frame), same) return cache !== void 0;
        let target = cacheTarget(input), camera = {
          x: viewport.x - (target.width - input.width) / (2 * input.camera.zoom),
          y: viewport.y - (target.height - input.height) / (2 * input.camera.zoom),
          zoom: input.camera.zoom
        }, region = {
          x: camera.x,
          y: camera.y,
          width: target.width / input.camera.zoom,
          height: target.height / input.camera.zoom
        }, next = { input, camera, region, forced }, { nodes, edges } = scene(input, region);
        redraws += 1;
        let { scaleX, scaleY } = size4(target, !0);
        return paintCameraOverview(
          context,
          { nodes, edges, camera, selection: input.selection, focus: input.focus, style },
          target,
          scaleX,
          scaleY
        ), cache = next, position(next, input), presentedCameraFrame = input.frame, cache !== void 0;
      },
      present() {
        if (disposed) throw new Error("Overview layer is disposed");
        awaitingPresentation && (recordPresentation(awaitingPresentation), awaitingPresentation = void 0);
      },
      metrics() {
        return {
          cachePixelBytes,
          redraws,
          cameraFrame,
          presentedCameraFrame,
          presentationLagFrames: [...presentationLagFrames]
        };
      },
      dispose() {
        disposed = !0, worker?.terminate(), clockRequest && view.cancelAnimationFrame(clockRequest), presentationRequest && view.cancelAnimationFrame(presentationRequest), waitingBitmap?.close(), waitingBitmap = void 0, originalStyle === null ? canvas.removeAttribute("style") : canvas.setAttribute("style", originalStyle), cachePixelBytes = 0;
      }
    };
  }

  // ../canvas/src/safe-area.mjs
  function computeSafeArea(stage, surfaces) {
    let top = 0, left = 0, right = stage.width, bottom = stage.height;
    for (let surface of surfaces) {
      if (!surface.open) continue;
      let { rect: rect2, edge } = surface;
      edge === "top" ? top = Math.max(top, rect2.y + rect2.height) : edge === "left" ? left = Math.max(left, rect2.x + rect2.width) : edge === "right" ? right = Math.min(right, rect2.x) : bottom = Math.min(bottom, rect2.y);
    }
    let x = Math.min(stage.width, left + 12), y = Math.min(stage.height, top + 12);
    return {
      x,
      y,
      width: Math.max(0, right - 12 - x),
      height: Math.max(0, bottom - 12 - y)
    };
  }

  // ../canvas/src/controller.mjs
  function object(field, value) {
    (!value || typeof value != "object" || Array.isArray(value)) && invalid(field, value);
  }
  var CAMERA_MOVE_MS = 200;
  function createCanvas(options2) {
    object("options", options2), options2.culling !== void 0 && object("culling", options2.culling), options2.zoom !== void 0 && object("zoom", options2.zoom), options2.keyboard !== void 0 && object("keyboard", options2.keyboard), options2.worldBounds !== void 0 && object("worldBounds", options2.worldBounds), (typeof options2.label != "string" || !options2.label.trim()) && invalid("label", options2.label), options2.breakpoints !== void 0 && !Array.isArray(options2.breakpoints) && invalid("breakpoints", options2.breakpoints);
    let breakpoints = (options2.breakpoints ?? []).map((entry, index2) => (object(`breakpoints[${index2}]`, entry), (typeof entry.name != "string" || !entry.name.trim()) && invalid(`breakpoints[${index2}].name`, entry.name), nonnegative(`breakpoints[${index2}].minWidth`, entry.minWidth), { ...entry })).sort((a, b) => a.minWidth - b.minWidth);
    new Set(breakpoints.map((entry) => entry.name)).size !== breakpoints.length && invalid(
      "breakpoints duplicate name",
      breakpoints.map((entry) => entry.name)
    ), new Set(breakpoints.map((entry) => entry.minWidth)).size !== breakpoints.length && invalid(
      "breakpoints duplicate minWidth",
      breakpoints.map((entry) => entry.minWidth)
    );
    let culling = createCulling(options2.culling), lod = createLod(options2.lod);
    options2.overviewStyle !== void 0 && typeof options2.overviewStyle != "function" && invalid("overviewStyle", options2.overviewStyle), options2.overviewRenderer !== void 0 && !["canvas", "worker"].includes(options2.overviewRenderer) && invalid("overviewRenderer", options2.overviewRenderer);
    let min2 = options2.zoom?.min === void 0 ? 0.04 : options2.zoom.min, max2 = options2.zoom?.max === void 0 ? 4 : options2.zoom.max;
    positive("zoom.min", min2), positive("zoom.max", max2), min2 > max2 && invalid("zoom.min > zoom.max", `${min2} > ${max2}`), options2.motion !== void 0 && options2.motion !== "auto" && options2.motion !== "none" && invalid("motion", options2.motion), options2.keyboard?.arrows !== void 0 && !["navigate", "none"].includes(options2.keyboard.arrows) && invalid("keyboard.arrows", options2.keyboard.arrows), options2.strict !== void 0 && typeof options2.strict != "boolean" && invalid("strict", options2.strict), options2.shortcutsEnabled !== void 0 && typeof options2.shortcutsEnabled != "function" && invalid("shortcutsEnabled", options2.shortcutsEnabled);
    for (let field of ["navigate", "outlineOrder"])
      options2[field] !== void 0 && typeof options2[field] != "function" && invalid(field, options2[field]);
    let pointerMode = options2.pointerMode === void 0 ? "pan" : options2.pointerMode;
    validatePointerMode(pointerMode), options2.worldBounds && (rect("worldBounds.rect", options2.worldBounds.rect), nonnegative("worldBounds.padding", options2.worldBounds.padding));
    let worldBounds = options2.worldBounds ? { rect: { ...options2.worldBounds.rect }, padding: options2.worldBounds.padding } : void 0, camera = { x: 0, y: 0, zoom: Math.max(min2, Math.min(max2, 1)) }, nodes = /* @__PURE__ */ new Map(), outline = [], roving, announcer, announceZoom = !1, overviewNodes = [], level = lod.update(camera.zoom), overviewLayer, overviewCanvas, ownsOverview = !1, writeFrame = 0, cameraWriteFrame = 0, detailDirty = !0, visibility = /* @__PURE__ */ new Map(), restoreOverview, selection = [], edges = [], diagnostics = [], breakpoint = null, focused = null, registered = /* @__PURE__ */ new Map(), inputGesture = !1, zoomChanged = !1, zooming = !1, zoomIdleTimer, edgesDirty = !0, loaderDirty = !0, lastRegion, resumeTimer, loader, edgeLayer, activeFrame = null, destroyed = !1, detaching = !1, stageSize = { width: 0, height: 0 }, chrome = /* @__PURE__ */ new Map(), safeArea = computeSafeArea(stageSize, chrome.values()), composing = !1, elements, view, frameId, idleTimer, isMoving = !1, consumedKeys = /* @__PURE__ */ new WeakSet(), dirty = !1, cameraEvent = !1, activeFrameEvent = !1, animation, input, frames, restore, listeners = {
      camera: /* @__PURE__ */ new Set(),
      "active-frame": /* @__PURE__ */ new Set(),
      mount: /* @__PURE__ */ new Set(),
      geometry: /* @__PURE__ */ new Set(),
      level: /* @__PURE__ */ new Set(),
      selection: /* @__PURE__ */ new Set(),
      focus: /* @__PURE__ */ new Set(),
      breakpoint: /* @__PURE__ */ new Set(),
      "safe-area": /* @__PURE__ */ new Set(),
      diagnostics: /* @__PURE__ */ new Set()
    }, queued = [];
    function emit(event, payload) {
      let callbacks = listeners[event];
      for (let listener of callbacks) listener(payload);
    }
    function enqueue(event, payload) {
      queued.push(() => emit(event, payload)), schedule();
    }
    function updateDiagnostics(next) {
      JSON.stringify(next) !== JSON.stringify(diagnostics) && (diagnostics = next, enqueue(
        "diagnostics",
        next.map((entry) => ({ ...entry }))
      ));
    }
    function viewport() {
      let stage = size4();
      return {
        x: camera.x,
        y: camera.y,
        width: stage.width / camera.zoom,
        height: stage.height / camera.zoom
      };
    }
    function budget() {
      if (!breakpoints.length) return 10;
      let index2 = breakpoints.findIndex((entry) => entry.name === breakpoint);
      return index2 === breakpoints.length - 1 ? 10 : index2 === breakpoints.length - 2 ? 6 : 3;
    }
    function updateSafeArea() {
      let next = computeSafeArea(stageSize, chrome.values());
      next.x === safeArea.x && next.y === safeArea.y && next.width === safeArea.width && next.height === safeArea.height || (safeArea = next, enqueue("safe-area", { ...next }));
    }
    function boundsFor(ids) {
      let values = ids.map((id) => requireNode(id, "target.id").bounds);
      if (!values.length) return;
      let x = Math.min(...values.map((bounds) => bounds.x)), y = Math.min(...values.map((bounds) => bounds.y));
      return {
        x,
        y,
        width: Math.max(...values.map((bounds) => bounds.x + bounds.width)) - x,
        height: Math.max(...values.map((bounds) => bounds.y + bounds.height)) - y
      };
    }
    function revealBounds(bounds, mode = "minimal", duration = CAMERA_MOVE_MS) {
      let start2 = worldToScreen(camera, bounds);
      function offset4(value, length, origin, available) {
        return mode === "center" || length > available ? value + length / 2 - origin - available / 2 : value < origin ? value - origin : Math.max(0, value + length - origin - available);
      }
      let dx = offset4(start2.x, bounds.width * camera.zoom, safeArea.x, safeArea.width), dy = offset4(start2.y, bounds.height * camera.zoom, safeArea.y, safeArea.height);
      (dx !== 0 || dy !== 0) && moveCamera(
        { ...camera, x: camera.x + dx / camera.zoom, y: camera.y + dy / camera.zoom },
        duration
      );
    }
    function moveCamera(value, duration) {
      animation = void 0, duration !== void 0 && view && options2.motion !== "none" && !view.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? (animation = {
        from: { ...camera },
        to: clamp2(value),
        start: view.performance.now(),
        duration
      }, moving(), schedule()) : change(value);
    }
    function resize() {
      let bounds = elements?.stage.getBoundingClientRect();
      stageSize = { width: bounds?.width ?? 0, height: bounds?.height ?? 0 }, loaderDirty = !0, updateSafeArea();
      let width = stageSize.width, next = breakpoints.filter((entry) => entry.minWidth <= width).at(-1)?.name ?? null;
      next !== breakpoint && (breakpoint = next, enqueue("breakpoint", next)), schedule();
    }
    function setGesture(value) {
      inputGesture !== value && (inputGesture = value, loader?.setMoving(isMoving || value), frames?.setMoving(isMoving || value), schedule());
    }
    function setFocus(id) {
      focused !== id && (focused = id, culling.setPinned("focus", id === null ? [] : [id]), detailDirty = !0, roving?.sync(), enqueue("focus", id));
    }
    async function focusNode(id, announce = !0) {
      if (alive(), !nodes.has(id)) throw new CanvasFocusError(id, "unknown-node");
      if (!roving) throw new CanvasFocusError(id, "no-element");
      let result = roving.request(id);
      if (revealBounds(requireNode(id).bounds), schedule(), await result, announce) {
        let element = registered.get(id);
        announcer?.say(element?.getAttribute("aria-label") || element?.textContent || "");
      }
    }
    let shortcutsEnabled = () => options2.shortcutsEnabled?.() ?? !0;
    function alive() {
      if (destroyed) throw new Error("Canvas controller is destroyed");
    }
    function size4() {
      return stageSize;
    }
    function clamp2(value) {
      let zoom = Math.max(min2, Math.min(max2, value.zoom)), { x, y } = value;
      if (worldBounds) {
        let { rect: bounds, padding } = worldBounds, stage = size4(), left = bounds.x - padding, top = bounds.y - padding, right = bounds.x + bounds.width + padding - stage.width / zoom, bottom = bounds.y + bounds.height + padding - stage.height / zoom;
        x = right < left ? (left + right) / 2 : Math.max(left, Math.min(right, x)), y = bottom < top ? (top + bottom) / 2 : Math.max(top, Math.min(bottom, y));
      }
      return { x, y, zoom };
    }
    function layers() {
      return elements ? [.../* @__PURE__ */ new Set([elements.world, ...elements.overlays ?? []])] : [];
    }
    function nodeVisibility(element, id, pins) {
      let realm = elements?.stage.ownerDocument.defaultView;
      if (!realm || !(element instanceof realm.HTMLElement) && !(element instanceof realm.SVGElement))
        return;
      visibility.has(element) || visibility.set(element, element.style.visibility);
      let original = visibility.get(element) ?? "", value = level === "overview" ? pins.has(id) ? "visible" : "hidden" : original;
      element.style.visibility !== value && (element.style.visibility = value);
    }
    function updateVisibility(levelChanged) {
      if (!elements) return;
      let pins = culling.getPinnedIds();
      for (let layer of layers())
        visibility.has(layer) || visibility.set(layer, layer.style.visibility), layer.style.visibility = level === "overview" ? "hidden" : visibility.get(layer) ?? "";
      let edge = elements.edges;
      if (edge && (visibility.has(edge) || visibility.set(edge, edge.style.visibility), edge.style.visibility = level === "overview" ? "hidden" : visibility.get(edge) ?? ""), level === "overview") {
        for (let [id, element] of registered) nodeVisibility(element, id, pins);
        for (let element of elements.stage.querySelectorAll("[data-canvas-node-id]")) {
          let id = element.getAttribute("data-canvas-node-id");
          id !== null && nodeVisibility(element, id, pins);
        }
      } else if (levelChanged) {
        let realm = elements.stage.ownerDocument.defaultView;
        for (let [element, original] of visibility)
          realm && (element instanceof realm.HTMLElement || element instanceof realm.SVGElement) && element.style.visibility !== original && (element.style.visibility = original);
      }
      overviewCanvas && (overviewCanvas.style.visibility = level === "overview" ? "visible" : "hidden"), detailDirty = !1;
    }
    function drawOverview() {
      return !elements || !view || stageSize.width === 0 || stageSize.height === 0 ? !1 : (overviewCanvas || (overviewCanvas = elements.overview ?? elements.stage.ownerDocument.createElement("canvas"), ownsOverview = !elements.overview, ownsOverview && (overviewCanvas.setAttribute("data-canvas-overview", ""), overviewCanvas.setAttribute("aria-hidden", "true"), elements.stage.prepend(overviewCanvas)), overviewLayer = createOverviewLayer(
        overviewCanvas,
        options2.overviewStyle,
        options2.overviewRenderer,
        schedule
      )), overviewLayer?.update({
        camera,
        nodes: overviewNodes,
        edges,
        selection,
        focus: focused,
        pinned: [...culling.getPinnedIds()],
        width: stageSize.width,
        height: stageSize.height,
        devicePixelRatio: view.devicePixelRatio || 1,
        frame: cameraWriteFrame,
        zooming,
        queryNodes: culling.query
      }) ?? !1);
    }
    function schedule() {
      view && !detaching && frameId === void 0 && (frameId = view.requestAnimationFrame(write));
    }
    function moving() {
      if (view) {
        if (!isMoving) {
          for (let layer of layers())
            layer.style.willChange !== "transform" && (layer.style.willChange = "transform");
          frames?.setMoving(!0), loader?.setMoving(!0);
        }
        isMoving = !0, idleTimer !== void 0 && view.clearTimeout(idleTimer), idleTimer = view.setTimeout(() => {
          idleTimer = void 0;
          for (let layer of layers())
            layer.style.willChange && layer.style.removeProperty("will-change");
          isMoving = !1, frames?.setMoving(inputGesture), loader?.setMoving(inputGesture), schedule();
        }, 150);
      }
    }
    function change(value) {
      let next = clamp2(value), changed = next.x !== camera.x || next.y !== camera.y || next.zoom !== camera.zoom, changedZoom = next.zoom !== camera.zoom;
      zoomChanged ||= changedZoom, changedZoom && view && (zooming = !0, zoomIdleTimer !== void 0 && view.clearTimeout(zoomIdleTimer), zoomIdleTimer = view.setTimeout(() => {
        zoomIdleTimer = void 0, zooming = !1, schedule();
      }, 150)), camera = next, elements || (level = lod.update(camera.zoom)), dirty = !0, cameraEvent = !0, changed && moving(), schedule();
    }
    function zoomTo(value, screenPoint) {
      let anchor = screenPoint ?? {
        x: safeArea.x + safeArea.width / 2,
        y: safeArea.y + safeArea.height / 2
      };
      point("screenPoint", anchor);
      let world = screenToWorld(camera, anchor), zoom = Math.max(min2, Math.min(max2, value));
      controller.setCamera({ x: world.x - anchor.x / zoom, y: world.y - anchor.y / zoom, zoom });
    }
    function write(time) {
      if (frameId = void 0, !elements) return;
      if (writeFrame += 1, animation) {
        let progress = Math.min(1, (time - animation.start) / animation.duration), { from, to } = animation;
        change(
          progress === 1 ? to : {
            x: from.x + (to.x - from.x) * progress,
            y: from.y + (to.y - from.y) * progress,
            zoom: from.zoom + (to.zoom - from.zoom) * progress
          }
        ), progress === 1 && (animation = void 0);
      }
      if (dirty) {
        dirty = !1;
        let { x, y, zoom } = camera, wroteCamera = !1;
        for (let layer of layers()) {
          let transform = `scale(${zoom}) translate(${-x}px, ${-y}px)`;
          layer.style.transform !== transform && (layer.style.transform = transform, wroteCamera = !0);
        }
        wroteCamera && (cameraWriteFrame = writeFrame), activeFrame !== null && frames?.updatePosition();
      }
      let requestedLevel = lod.update(camera.zoom), overviewReady = requestedLevel === "overview" || level === "overview" ? drawOverview() : !1, update = culling.update(
        viewport(),
        time,
        inputGesture,
        zoomChanged,
        requestedLevel !== "overview" || !overviewReady
      ), nextLevel = requestedLevel;
      if (requestedLevel === "overview" && !overviewReady && (nextLevel = level), level === "overview" && requestedLevel !== "overview") {
        let pins = culling.getPinnedIds(), mounted = new Set(culling.getMountedIds());
        culling.query(viewport()).some((node) => !pins.has(node.id) && !mounted.has(node.id)) && (nextLevel = level);
      }
      let levelChanged = level !== nextLevel;
      level = nextLevel, detailDirty ||= levelChanged, zoomChanged = !1;
      let region = culling.getRegion();
      if (level !== "overview" && (edgesDirty || region !== lastRegion)) {
        if (region) {
          let routes = buildEdgeRoutes(nodes.values(), edges, region, options2.strict);
          edgeLayer?.update(routes), updateDiagnostics(routes.diagnostics);
        }
        lastRegion = region, edgesDirty = !1;
      }
      let events = queued;
      queued = [];
      let notifyCamera = cameraEvent, notifyFrame = activeFrameEvent, framePayload = activeFrame, cameraPayload = { ...camera };
      cameraEvent = !1, activeFrameEvent = !1, notifyCamera && emit("camera", cameraPayload), notifyFrame && emit("active-frame", framePayload), levelChanged && emit("level", level);
      for (let event of events) event();
      update.geometry.length && emit("geometry", new Set(update.geometry)), update.mount ? (loader?.refresh(), detailDirty = !0, emit("mount", new Set(culling.getMountedIds())), loader?.refresh()) : (update.geometry.length || loaderDirty) && loader?.refresh(), loaderDirty = !1, detailDirty && updateVisibility(levelChanged), level === "overview" && overviewLayer?.present(), announceZoom && !animation && (announceZoom = !1, announcer?.say(`Zoom ${Math.round(camera.zoom * 100)}%`)), (roving?.update(!animation) || animation || update.pending) && schedule(), resumeTimer !== void 0 && view?.clearTimeout(resumeTimer), resumeTimer = void 0, update.resumeAt !== void 0 && view && (resumeTimer = view.setTimeout(
        () => {
          resumeTimer = void 0, schedule();
        },
        Math.max(0, update.resumeAt - time)
      ));
    }
    function validatePointerMode(mode) {
      mode !== "pan" && mode !== "none" && invalid("pointerMode", mode);
    }
    function requireNode(id, field = "id") {
      let node = nodes.get(id);
      return node || invalid(field, id), node;
    }
    function validateWorld(field, value, stage) {
      let realm = stage.ownerDocument.defaultView;
      (!realm || !(value instanceof realm.HTMLElement)) && invalid(field, value);
    }
    function detach() {
      if (alive(), !!elements) {
        detaching = !0, frameId !== void 0 && view?.cancelAnimationFrame(frameId), idleTimer !== void 0 && view?.clearTimeout(idleTimer), resumeTimer !== void 0 && view?.clearTimeout(resumeTimer), zoomIdleTimer !== void 0 && view?.clearTimeout(zoomIdleTimer), zoomIdleTimer = void 0, zooming = !1, resumeTimer = void 0, frameId = void 0, idleTimer = void 0, isMoving = !1, composing = !1, animation = void 0, roving?.dispose(), roving = void 0, announcer?.dispose(), announcer = void 0, announceZoom = !1, input?.dispose(), loader?.dispose(), edgeLayer?.dispose(), overviewLayer?.dispose(), ownsOverview && overviewCanvas?.remove(), restoreOverview?.();
        for (let [element, original] of visibility) {
          let realm = elements.stage.ownerDocument.defaultView;
          realm && (element instanceof realm.HTMLElement || element instanceof realm.SVGElement) && (element.style.visibility = original);
        }
        visibility.clear(), overviewLayer = void 0, overviewCanvas = void 0, restoreOverview = void 0, ownsOverview = !1, detailDirty = !0, frames?.dispose(), culling.reset(), registered.clear(), setFocus(null), lastRegion = void 0, edgesDirty = !0, zoomChanged = !1, inputGesture = !1, restore?.(), input = void 0, frames = void 0, loader = void 0, edgeLayer = void 0, restore = void 0, elements = void 0, view = void 0, stageSize = { width: 0, height: 0 }, updateSafeArea(), detaching = !1;
      }
    }
    let controller = {
      attach(next) {
        alive();
        let stage = next?.stage, realm = stage?.ownerDocument?.defaultView;
        if ((!realm || !(stage instanceof realm.HTMLElement)) && invalid("elements.stage", stage), validateWorld("elements.world", next.world, stage), next.overview !== void 0 && !(next.overview instanceof realm.HTMLCanvasElement) && invalid("elements.overview", next.overview), next.edges !== void 0 && (!(next.edges instanceof realm.SVGElement) || !["svg", "g"].includes(next.edges.localName)) && invalid("elements.edges", next.edges), next.overlays !== void 0 && !Array.isArray(next.overlays) && invalid("elements.overlays", next.overlays), next.overlays?.forEach((overlay, index2) => {
          validateWorld(`elements.overlays[${index2}]`, overlay, stage);
        }), elements?.stage === stage && elements.world === next.world && elements.edges === next.edges && elements.overview === next.overview && (elements.overlays ?? []).length === (next.overlays ?? []).length && (elements.overlays ?? []).every((overlay, index2) => overlay === next.overlays?.[index2]))
          return;
        if (detach(), elements = { ...next, overlays: [...next.overlays ?? []] }, level = "dom", view = realm, next.overview) {
          let canvas = next.overview, style = canvas.getAttribute("style"), width = canvas.width, height = canvas.height;
          restoreOverview = () => {
            style === null ? canvas.removeAttribute("style") : canvas.setAttribute("style", style), canvas.width = width, canvas.height = height;
          }, canvas.style.visibility = "hidden";
        }
        let attributes = ["tabindex", "role", "aria-label", "aria-roledescription"].map(
          (key) => [key, stage.getAttribute(key)]
        ), touchAction = stage.style.touchAction, previous = layers().map((layer) => ({
          layer,
          transform: layer.style.transform,
          origin: layer.style.transformOrigin,
          willChange: layer.style.willChange
        })), compositionStart = () => {
          composing = !0;
        }, compositionEnd = () => {
          composing = !1;
        };
        stage.addEventListener("compositionstart", compositionStart), stage.addEventListener("compositionend", compositionEnd), stage.addEventListener("blur", compositionEnd), stage.addEventListener("focusout", compositionEnd);
        let observer = realm.ResizeObserver ? new realm.ResizeObserver(resize) : void 0;
        observer?.observe(stage), realm.addEventListener("resize", resize);
        let forcedColors2 = realm.matchMedia?.("(forced-colors: active)");
        forcedColors2?.addEventListener?.("change", schedule), restore = () => {
          observer?.disconnect(), realm.removeEventListener("resize", resize), forcedColors2?.removeEventListener?.("change", schedule), stage.removeEventListener("compositionstart", compositionStart), stage.removeEventListener("compositionend", compositionEnd), stage.removeEventListener("blur", compositionEnd), stage.removeEventListener("focusout", compositionEnd), stage.style.touchAction = touchAction;
          for (let [key, value] of attributes)
            value === null ? stage.removeAttribute(key) : stage.setAttribute(key, value);
          for (let entry of previous)
            entry.layer.style.transform = entry.transform, entry.layer.style.transformOrigin = entry.origin, entry.layer.style.willChange = entry.willChange;
        }, stage.tabIndex = 0, stage.setAttribute("role", "group"), stage.setAttribute("aria-label", options2.label), stage.setAttribute("aria-roledescription", "canvas"), announcer = createAnnouncer(stage), roving = createRovingFocus(
          stage,
          registered,
          () => outline,
          () => focused,
          setFocus,
          (id) => {
            inputGesture || revealBounds(requireNode(id).bounds, "minimal", 0);
          },
          (ids) => {
            culling.setPinned("focus-request", ids), detailDirty = !0, schedule();
          }
        ), stage.style.touchAction = "none";
        for (let layer of layers()) layer.style.transformOrigin = "0 0";
        frames = createFrames(
          elements,
          () => nodes.values(),
          () => controller.deactivateFrame()
        ), frames.setActive(activeFrame), edgeLayer = next.edges ? createEdgeLayer(next.edges) : void 0, loader = createFrameLoader(
          elements,
          () => nodes.values(),
          () => controller.getMountedIds(),
          () => {
            let region = viewport();
            return { x: region.x + region.width / 2, y: region.y + region.height / 2 };
          },
          budget,
          () => frames?.refresh()
        ), loader.request(activeFrame), input = bindInput(elements, controller, () => pointerMode, shortcutsEnabled, setGesture), resize(), change(camera);
      },
      detach,
      destroy() {
        alive(), detach(), destroyed = !0;
        for (let callbacks of Object.values(listeners)) callbacks.clear();
        queued = [], nodes.clear(), chrome.clear(), selection = [];
      },
      setNodes(values) {
        alive(), Array.isArray(values) || invalid("nodes", values);
        let next = /* @__PURE__ */ new Map();
        for (let [index2, node] of values.entries())
          (!node || typeof node != "object") && invalid(`nodes[${index2}]`, node), (typeof node.id != "string" || !node.id.trim()) && invalid(`nodes[${index2}].id`, node.id), next.has(node.id) && invalid("nodes.id duplicate", node.id), rect(`nodes[${index2}].bounds`, node.bounds), node.frame !== void 0 && typeof node.frame != "boolean" && invalid(`nodes[${index2}].frame`, node.frame), node.kind !== void 0 && typeof node.kind != "string" && invalid(`nodes[${index2}].kind`, node.kind), next.set(node.id, { ...node, bounds: { ...node.bounds } });
        let nextOutline = createOutline([...next.values()], options2.outlineOrder), result = buildEdgeRoutes(next.values(), edges, viewport(), options2.strict), changed = culling.setNodes(next);
        nodes = next, outline = nextOutline, roving?.sync(), changed.length && (overviewNodes = [...nodes.values()]), edgesDirty ||= changed.length > 0, loaderDirty ||= changed.length > 0, updateDiagnostics(result.diagnostics);
        for (let id of registered.keys())
          nodes.has(id) || controller.registerNodeElement(id, null);
        let remaining = selection.filter((id) => nodes.has(id));
        remaining.length !== selection.length && (selection = remaining, enqueue("selection", [...selection])), culling.setPinned("selection", selection), focused !== null && !nodes.has(focused) && (elements?.stage.focus({ preventScroll: !0 }), setFocus(null)), activeFrame !== null && !nodes.get(activeFrame)?.frame && controller.deactivateFrame(), frames?.refresh(), schedule();
      },
      setEdges(values) {
        alive(), Array.isArray(values) || invalid("edges", values);
        let ids = /* @__PURE__ */ new Set(), next = values.map((edge, index2) => {
          object(`edges[${index2}]`, edge);
          for (let field of ["id", "from", "to", "style"])
            (typeof edge[field] != "string" || !edge[field].trim()) && invalid(`edges[${index2}].${field}`, edge[field]);
          return ids.has(edge.id) && invalid("edges.id duplicate", edge.id), ids.add(edge.id), edge.points !== void 0 && ((!Array.isArray(edge.points) || edge.points.length < 2) && invalid(`edges[${index2}].points`, edge.points), edge.points.forEach((value, offset4) => {
            point(`edges[${index2}].points[${offset4}]`, value);
          })), { ...edge, points: edge.points?.map((value) => ({ ...value })) };
        }), result = buildEdgeRoutes(nodes.values(), next, viewport(), options2.strict);
        edges = next, updateDiagnostics(result.diagnostics), edgesDirty = !0, schedule();
      },
      registerNodeElement(id, element) {
        alive(), element !== null && requireNode(id);
        let realm = elements?.stage.ownerDocument.defaultView;
        if (element !== null && (!realm || !(element instanceof realm.Element)) && invalid("element", element), element === null) {
          let previous = registered.get(id);
          previous && roving?.unregister(id, previous);
          let realm2 = elements?.stage.ownerDocument.defaultView;
          previous && realm2 && (previous instanceof realm2.HTMLElement || previous instanceof realm2.SVGElement) && (previous.style.visibility = visibility.get(previous) ?? previous.style.visibility, visibility.delete(previous)), registered.delete(id);
        } else {
          let previous = registered.get(id);
          previous && previous !== element && roving?.unregister(id, previous), registered.set(id, element), roving?.register(id, element), level === "overview" && nodeVisibility(element, id, culling.getPinnedIds());
        }
        loaderDirty = !0, detailDirty = !0, schedule();
      },
      setPinned(source, ids) {
        alive(), (typeof source != "string" || !source.trim()) && invalid("source", source), Array.isArray(ids) || invalid("pinned", ids), ids.forEach((id) => {
          requireNode(id, "pinned.id");
        });
        let changed = /* @__PURE__ */ new Set([...culling.getPinnedIds(), ...ids]);
        culling.setPinned(`product:${source}`, ids), detailDirty = !0, enqueue("geometry", changed), schedule();
      },
      getMountedIds() {
        return alive(), new Set(culling.getMountedIds());
      },
      getDiagnostics() {
        return alive(), diagnostics.map((entry) => ({ ...entry }));
      },
      getBreakpoint() {
        return alive(), breakpoint;
      },
      setChrome(surface) {
        alive(), object("chrome", surface), (typeof surface.id != "string" || !surface.id.trim()) && invalid("chrome.id", surface.id), ["top", "right", "bottom", "left"].includes(surface.edge) || invalid("chrome.edge", surface.edge), rect("chrome.rect", surface.rect), typeof surface.open != "boolean" && invalid("chrome.open", surface.open);
        let previous = chrome.get(surface.id), next = { ...surface, rect: { ...surface.rect } };
        if (chrome.set(next.id, next), updateSafeArea(), !next.open || !(!previous?.open || previous.edge !== next.edge || next.rect.x < previous.rect.x || next.rect.y < previous.rect.y || next.rect.x + next.rect.width > previous.rect.x + previous.rect.width || next.rect.y + next.rect.height > previous.rect.y + previous.rect.height)) return;
        let bounds = boundsFor(selection);
        if (!bounds) return;
        let start2 = worldToScreen(camera, bounds), width = bounds.width * camera.zoom, height = bounds.height * camera.zoom, coveredWidth = Math.max(
          0,
          Math.min(start2.x + width, next.rect.x + next.rect.width) - Math.max(start2.x, next.rect.x)
        ), coveredHeight = Math.max(
          0,
          Math.min(start2.y + height, next.rect.y + next.rect.height) - Math.max(start2.y, next.rect.y)
        );
        coveredWidth * coveredHeight > width * height / 2 && revealBounds(bounds, "minimal", 180);
      },
      removeChrome(id) {
        alive(), chrome.delete(id) || invalid("chrome.id", id), updateSafeArea();
      },
      getSafeArea() {
        return alive(), { ...safeArea };
      },
      getLevel(id) {
        return alive(), id !== void 0 && requireNode(id), id !== void 0 && culling.getPinnedIds().has(id) ? "dom" : level;
      },
      getOverviewMetrics() {
        return alive(), overviewLayer?.metrics() ?? {
          cachePixelBytes: 0,
          redraws: 0,
          cameraFrame: 0,
          presentedCameraFrame: 0,
          presentationLagFrames: []
        };
      },
      getCamera() {
        return alive(), { ...camera };
      },
      setCamera(value, settings) {
        alive(), validateCamera(value), settings !== void 0 && object("setCamera.options", settings), settings?.animate !== void 0 && typeof settings.animate != "boolean" && invalid("animate", settings.animate), moveCamera(value, settings?.animate ? CAMERA_MOVE_MS : void 0);
      },
      panBy(dxScreen, dyScreen) {
        alive(), finite("dxScreen", dxScreen), finite("dyScreen", dyScreen), controller.setCamera({
          ...camera,
          x: camera.x + dxScreen / camera.zoom,
          y: camera.y + dyScreen / camera.zoom
        });
      },
      zoomAt(factor, screenPoint) {
        alive(), positive("factor", factor), zoomTo(camera.zoom * factor, screenPoint), screenPoint === void 0 && (announceZoom = !0, schedule());
      },
      fit(target, settings) {
        alive(), target !== "all" && target !== "selection" && !Array.isArray(target) && invalid("target", target), settings !== void 0 && object("fit.options", settings);
        let padding = settings?.padding === void 0 ? 32 : settings.padding, maxZoom = settings?.maxZoom === void 0 ? max2 : settings.maxZoom;
        nonnegative("padding", padding), positive("maxZoom", maxZoom);
        let ids = target === "all" ? [...nodes.keys()] : target === "selection" ? selection : target, bounds = boundsFor(ids);
        if (!bounds) return;
        let zoom = Math.max(
          min2,
          Math.min(
            max2,
            maxZoom,
            Math.max(0, safeArea.width - 2 * padding) / (bounds.width || 1),
            Math.max(0, safeArea.height - 2 * padding) / (bounds.height || 1)
          )
        );
        announceZoom = !0, controller.setCamera(
          {
            x: bounds.x + bounds.width / 2 - (safeArea.x + safeArea.width / 2) / zoom,
            y: bounds.y + bounds.height / 2 - (safeArea.y + safeArea.height / 2) / zoom,
            zoom
          },
          { animate: !0 }
        );
      },
      reveal(id, settings) {
        alive();
        let bounds = requireNode(id).bounds;
        settings !== void 0 && object("reveal.options", settings);
        let mode = settings?.mode === void 0 ? "minimal" : settings.mode;
        mode !== "minimal" && mode !== "center" && invalid("mode", mode), revealBounds(bounds, mode);
      },
      worldToScreen(value) {
        return alive(), point("point", value), worldToScreen(camera, value);
      },
      screenToWorld(value) {
        return alive(), point("point", value), screenToWorld(camera, value);
      },
      hitTest(value) {
        return alive(), point("screenPoint", value), culling.hitTest(screenToWorld(camera, value));
      },
      setSelection(ids) {
        alive(), Array.isArray(ids) || invalid("selection", ids), ids.forEach((id) => {
          requireNode(id, "selection.id");
        }), new Set(ids).size !== ids.length && invalid("selection duplicate", ids.join(",")), !(selection.length === ids.length && selection.every((id, index2) => id === ids[index2])) && (selection = [...ids], culling.setPinned("selection", selection), detailDirty = !0, enqueue("selection", [...selection]));
      },
      getSelection() {
        return alive(), [...selection];
      },
      focusNode,
      getFocus() {
        return alive(), focused;
      },
      getOutline() {
        return alive(), outline;
      },
      setPointerMode(mode) {
        alive(), validatePointerMode(mode), pointerMode = mode;
      },
      handleKey(event) {
        if (alive(), consumedKeys.has(event) || composing || !elements || event.isComposing || isEditable(event))
          return !1;
        let target = event.target, realm = elements.stage.ownerDocument.defaultView;
        if (target && realm && target instanceof realm.Element && !elements.stage.contains(target))
          return !1;
        let action = keyAction(event, options2.keyboard?.arrows ?? "navigate", shortcutsEnabled);
        if (!action) return !1;
        if (action.type === "zoom") controller.zoomAt(action.factor);
        else if (action.type === "reset") zoomTo(1);
        else if (action.type === "fit-all") controller.fit("all");
        else if (action.type === "fit-selection") controller.fit("selection");
        else if (action.type === "pan")
          controller.panBy(
            action.direction === "left" ? -safeArea.width / 4 : action.direction === "right" ? safeArea.width / 4 : 0,
            action.direction === "up" ? -safeArea.height / 4 : action.direction === "down" ? safeArea.height / 4 : 0
          );
        else if (action.type === "select") {
          if (focused === null) return !1;
          controller.setSelection([focused]);
        } else if (action.type === "escape")
          if (activeFrame !== null) controller.deactivateFrame();
          else if (selection.length) controller.setSelection([]);
          else if (focused !== null)
            elements.stage.focus({ preventScroll: !0 }), setFocus(null);
          else return !1;
        else {
          let id, jump = action.type === "first" || action.type === "last";
          if (action.type === "first") id = outline[0] ?? null;
          else if (action.type === "last") id = outline.at(-1) ?? null;
          else if (action.type === "navigate")
            id = focused === null ? (action.direction === "left" || action.direction === "up" ? outline.at(-1) : outline[0]) ?? null : options2.navigate ? options2.navigate(focused, action.direction) : navigateSpatial(nodes.values(), requireNode(focused), action.direction);
          else return !1;
          id === null ? announcer?.say("Edge of canvas") : focusNode(id, jump);
        }
        return ["zoom", "reset", "fit-all", "fit-selection"].includes(action.type) && (announceZoom = !0, schedule()), consumedKeys.add(event), event.preventDefault(), !0;
      },
      setActiveFrame(id) {
        alive(), id !== null && !requireNode(id).frame && invalid("frame.id", id), id !== activeFrame && (activeFrame = id, culling.setPinned("active-frame", id === null ? [] : [id]), detailDirty = !0, enqueue("geometry", new Set(culling.getPinnedIds())), activeFrameEvent = !0, frames?.setActive(id), loader?.request(id), schedule());
      },
      getActiveFrame() {
        return alive(), activeFrame;
      },
      deactivateFrame() {
        alive(), controller.setActiveFrame(null);
      },
      on(event, listener) {
        if (alive(), typeof listener != "function" && invalid("listener", listener), !Object.hasOwn(listeners, event)) return invalid("event", event);
        let callbacks = listeners[event];
        return callbacks.add(listener), () => {
          callbacks.delete(listener);
        };
      }
    };
    return controller;
  }

  // ../canvas/src/styles.css
  var styles_default = `:root {
  --canvas-z-stage: 0;
  --canvas-z-world-overlays: 5;
  --canvas-z-screen-overlays: 10;
  --canvas-z-chrome: 20;
  --canvas-z-popovers: 30;
  --canvas-z-toasts: 40;
  --canvas-z-modals: 50;
}

.canvas-stage {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  touch-action: none;
  z-index: var(--canvas-z-stage);
}

.canvas-world {
  position: absolute;
  inset: 0;
  transform-origin: 0 0;
}

.canvas-overview {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.canvas-edges {
  position: absolute;
  overflow: visible;
  pointer-events: none;
}

.canvas-chrome-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: var(--canvas-z-chrome);
}

:root {
  --canvas-chrome-inset: 12px;
  --canvas-chrome-gap: 12px;
  --canvas-chrome-pill-height: 40px;
  --canvas-chrome-toolbar-height: 44px;
  --canvas-chrome-help-size: 40px;
  --canvas-chrome-zoom-width: 144px;
  --canvas-chrome-sidebar-width: 312px;
  --canvas-chrome-navigation-width: 264px;
  --canvas-chrome-panel-inset: 64px;
  --canvas-chrome-transition: 180ms;
  --canvas-chrome-background: Canvas;
  --canvas-chrome-foreground: CanvasText;
  --canvas-chrome-muted: CanvasText;
  --canvas-chrome-border: ButtonBorder;
  --canvas-chrome-hover: ButtonFace;
  --canvas-chrome-accent: ButtonText;
  --canvas-chrome-on-accent: Canvas;
  --canvas-chrome-focus: Highlight;
  --canvas-chrome-shadow: 0 2px 12px rgb(0 0 0 / 12%);
}

.canvas-chrome-root {
  color-scheme: light dark;
  color: var(--canvas-chrome-foreground);
  font:
    14px system-ui,
    sans-serif;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
    env(safe-area-inset-left);
}

.canvas-chrome-root *,
.canvas-chrome-root *::before,
.canvas-chrome-root *::after {
  box-sizing: border-box;
}

.canvas-chrome-slot {
  position: fixed;
  display: flex;
  align-items: center;
  gap: 4px;
  height: var(--canvas-chrome-pill-height);
  padding: 2px;
  border: 1px solid var(--canvas-chrome-border);
  border-radius: 12px;
  background: var(--canvas-chrome-background);
  box-shadow: var(--canvas-chrome-shadow);
  pointer-events: auto;
}

.canvas-chrome-root button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 34px;
  min-height: 34px;
  border: 0;
  border-radius: 8px;
  padding: 6px 10px;
  color: inherit;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.canvas-chrome-root button:hover {
  background: var(--canvas-chrome-hover);
}

.canvas-chrome-root button:disabled {
  color: var(--canvas-chrome-muted);
  cursor: default;
}

.canvas-chrome-root :focus-visible {
  outline: 2px solid var(--canvas-chrome-focus);
  outline-offset: 2px;
}

.canvas-chrome-root .canvas-chrome-tool[aria-pressed="true"],
.canvas-chrome-root .canvas-chrome-sidebar-toggle[aria-pressed="true"],
.canvas-chrome-root button.canvas-chrome-primary {
  color: var(--canvas-chrome-on-accent);
  background: var(--canvas-chrome-accent);
}

.canvas-chrome-menu {
  top: calc(var(--canvas-chrome-inset) + env(safe-area-inset-top));
  left: calc(var(--canvas-chrome-inset) + env(safe-area-inset-left));
}

.canvas-chrome-toolbar {
  top: calc(var(--canvas-chrome-inset) + env(safe-area-inset-top));
  left: 50%;
  height: var(--canvas-chrome-toolbar-height);
  transform: translateX(-50%);
}

.canvas-chrome-tool {
  height: 38px;
  min-width: 40px;
  padding: 6px 14px 10px 10px;
}

.canvas-chrome-tool-shortcut {
  position: absolute;
  right: 3px;
  bottom: 1px;
  font:
    9px system-ui,
    sans-serif;
}

.canvas-chrome-action {
  top: calc(var(--canvas-chrome-inset) + env(safe-area-inset-top));
  right: calc(var(--canvas-chrome-inset) + env(safe-area-inset-right));
}

.canvas-chrome-view-picker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-right: 8px;
}

.canvas-chrome-more {
  position: relative;
}

.canvas-chrome-menu-card {
  position: absolute;
  top: calc(100% + var(--canvas-chrome-gap));
  left: 0;
  min-width: 240px;
  max-width: calc(100vw - 2 * var(--canvas-chrome-inset));
  padding: 6px;
  border: 1px solid var(--canvas-chrome-border);
  border-radius: 12px;
  background: var(--canvas-chrome-background);
  box-shadow: var(--canvas-chrome-shadow);
  z-index: var(--canvas-z-popovers);
  pointer-events: auto;
}

.canvas-chrome-more .canvas-chrome-menu-card {
  left: auto;
  right: 0;
}

.canvas-chrome-root .canvas-chrome-menu-item {
  display: flex;
  width: 100%;
  justify-content: flex-start;
  text-align: left;
  white-space: nowrap;
}

.canvas-chrome-menu-icon {
  width: 20px;
  text-align: center;
}

.canvas-chrome-menu-item kbd {
  margin-left: auto;
  padding-left: 20px;
  color: var(--canvas-chrome-muted);
  font:
    11px system-ui,
    sans-serif;
}

.canvas-chrome-selection-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.canvas-chrome-sidebar,
.canvas-chrome-navigation {
  top: calc(var(--canvas-chrome-panel-inset) + env(safe-area-inset-top));
  bottom: calc(var(--canvas-chrome-panel-inset) + env(safe-area-inset-bottom));
  height: auto;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  pointer-events: none;
}

.canvas-chrome-sidebar {
  right: calc(var(--canvas-chrome-inset) + env(safe-area-inset-right));
  width: var(--canvas-chrome-panel-width, var(--canvas-chrome-sidebar-width));
  min-width: 280px;
  max-width: 400px;
}

.canvas-chrome-navigation {
  left: calc(var(--canvas-chrome-inset) + env(safe-area-inset-left));
  width: var(--canvas-chrome-panel-width, var(--canvas-chrome-navigation-width));
  min-width: 240px;
  max-width: 320px;
}

.canvas-chrome-panel-surface {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border: 1px solid var(--canvas-chrome-border);
  border-radius: 12px;
  background: var(--canvas-chrome-background);
  box-shadow: var(--canvas-chrome-shadow);
  overflow: auto;
  opacity: 0;
  transform: translateX(16px);
  transition:
    transform var(--canvas-chrome-transition) ease,
    opacity var(--canvas-chrome-transition) ease;
  pointer-events: none;
}

.canvas-chrome-navigation .canvas-chrome-panel-surface {
  transform: translateX(-16px);
}

.canvas-chrome-slot[data-open="true"] .canvas-chrome-panel-surface {
  opacity: 1;
  transform: translate(0);
  pointer-events: auto;
}

.canvas-chrome-panel-surface header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid var(--canvas-chrome-border);
}

.canvas-chrome-panel-surface header > :first-child {
  margin-right: auto;
}

.canvas-chrome-panel-surface [role="tablist"] {
  display: flex;
}

.canvas-chrome-panel-surface [role="tab"][aria-selected="true"] {
  background: var(--canvas-chrome-hover);
}

.canvas-chrome-panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

.canvas-chrome-empty {
  display: grid;
  justify-items: center;
  gap: var(--canvas-chrome-gap);
  padding: 32px 12px;
  text-align: center;
}

.canvas-chrome-zoom {
  width: var(--canvas-chrome-zoom-width);
  bottom: calc(var(--canvas-chrome-inset) + env(safe-area-inset-bottom));
  left: calc(var(--canvas-chrome-inset) + env(safe-area-inset-left));
}

.canvas-chrome-zoom output {
  min-width: 52px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.canvas-chrome-history {
  bottom: calc(var(--canvas-chrome-inset) + env(safe-area-inset-bottom));
  left: calc(
    var(--canvas-chrome-inset) +
    var(--canvas-chrome-zoom-width) +
    var(--canvas-chrome-gap) +
    env(safe-area-inset-left)
  );
}

.canvas-chrome-help {
  bottom: calc(var(--canvas-chrome-inset) + env(safe-area-inset-bottom));
  right: calc(var(--canvas-chrome-inset) + env(safe-area-inset-right));
  width: var(--canvas-chrome-help-size);
  height: var(--canvas-chrome-help-size);
  justify-content: center;
  border-radius: 50%;
}

.canvas-chrome-help button {
  border-radius: 50%;
}

.canvas-chrome-toolbar-hint {
  position: fixed;
  top: calc(
    var(--canvas-chrome-inset) +
    var(--canvas-chrome-toolbar-height) +
    4px +
    env(safe-area-inset-top)
  );
  left: 50%;
  display: flex;
  align-items: center;
  gap: 4px;
  transform: translateX(-50%);
  border-radius: 8px;
  background: var(--canvas-chrome-background);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: auto;
}

.canvas-chrome-welcome-actions {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 1px solid var(--canvas-chrome-border);
  border-radius: 12px;
  padding: 8px;
  background: var(--canvas-chrome-background);
  box-shadow: var(--canvas-chrome-shadow);
  pointer-events: auto;
}

.canvas-chrome-welcome-label {
  position: fixed;
  padding: 2px 4px;
  border-radius: 4px;
  background: var(--canvas-chrome-background);
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
  pointer-events: none;
}

.canvas-chrome-root [hidden] {
  display: none;
}

.canvas-chrome-root[data-chrome-hidden="true"] > :not(.canvas-chrome-zoom) {
  visibility: hidden;
  pointer-events: none;
}

.canvas-chrome-root[data-layout="mobile"] button {
  min-width: 44px;
  min-height: 44px;
  flex-shrink: 0;
}

.canvas-chrome-root[data-layout="mobile"] {
  display: grid;
  grid-template-columns: minmax(48px, max-content) minmax(96px, 152px) minmax(48px, 1fr);
  align-content: start;
  gap: var(--canvas-chrome-gap);
  padding: calc(var(--canvas-chrome-inset) + env(safe-area-inset-top))
    calc(16px + env(safe-area-inset-right)) 0 calc(16px + env(safe-area-inset-left));
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-slot {
  height: 48px;
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-menu,
.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-zoom,
.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-action {
  position: relative;
  inset: auto;
  grid-row: 1;
  min-width: 0;
  padding: 1px;
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-menu {
  grid-column: 1;
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-view-picker {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-view-picker > :first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-action {
  grid-column: 3;
  justify-self: end;
}

.canvas-chrome-mobile-menu-label {
  display: none;
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-toolbar {
  top: auto;
  bottom: calc(var(--canvas-chrome-inset) + env(safe-area-inset-bottom));
  padding: 1px;
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-zoom {
  grid-column: 2;
  width: auto;
  container-type: inline-size;
  container-name: canvas-chrome-zoom;
  justify-content: space-between;
}

@container canvas-chrome-zoom (width < 148px) {
  .canvas-chrome-zoom output {
    display: none;
  }
}

@media (max-width: 359.99px) {
  .canvas-chrome-root[data-layout="mobile"] {
    grid-template-columns: minmax(48px, max-content) 96px minmax(48px, 1fr);
  }
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-sidebar,
.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-navigation {
  top: auto;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 55vh;
  min-width: 0;
  max-width: none;
  z-index: var(--canvas-z-popovers);
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-panel-surface {
  padding-bottom: env(safe-area-inset-bottom);
  border-radius: 16px 16px 0 0;
  transform: translateY(16px);
}

.canvas-chrome-root[data-layout="mobile"] [data-open="true"] .canvas-chrome-panel-surface {
  transform: translate(0);
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-menu-overflow {
  display: grid;
  gap: 4px;
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-toolbar-hint {
  position: static;
  transform: none;
  white-space: normal;
}

@media (prefers-reduced-motion: reduce) {
  .canvas-chrome-root .canvas-chrome-panel-surface {
    transition: none;
  }
}

.canvas-chrome-root[data-layout="mobile"] .canvas-chrome-more .canvas-chrome-menu-card {
  top: auto;
  bottom: calc(100% + var(--canvas-chrome-gap));
}

.canvas-chrome-root[data-layout="desktop"]:has(.canvas-chrome-welcome) .canvas-chrome-toolbar-hint,
.canvas-chrome-root[data-layout="one-panel"]:has(.canvas-chrome-welcome)
  .canvas-chrome-toolbar-hint {
  top: calc(
    var(--canvas-chrome-inset) +
    var(--canvas-chrome-toolbar-height) +
    28px +
    env(safe-area-inset-top)
  );
}

.canvas-chrome-glyph::before {
  content: attr(data-chrome-glyph);
}
`;