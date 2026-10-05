

  // lib/artifact/ui/stage.mjs
  var stage_exports = {};
  __export(stage_exports, {
    ARTIFACT_STAGE_EVENTS: () => ARTIFACT_STAGE_EVENTS,
    ARTIFACT_STAGE_LIMITS: () => ARTIFACT_STAGE_LIMITS,
    bootstrapArtifactStage: () => bootstrapArtifactStage,
    clientPointToNormalized: () => clientPointToNormalized,
    createArtifactStagePayload: () => createArtifactStagePayload,
    createArtifactStageState: () => createArtifactStageState,
    mountArtifactStage: () => mountArtifactStage,
    normalizedPointToClient: () => normalizedPointToClient,
    reduceArtifactStageState: () => reduceArtifactStageState,
    resolveArtifactPresentation: () => resolveArtifactPresentation,
    visibleArtifactIds: () => visibleArtifactIds
  });

  // lib/artifact/ui/presentation.mjs
  function resolveArtifactPresentation(value, {
    mode,
    viewMode = mode ?? "single",
    artifactCount = 1
  } = {}) {
    if (value === "document" || value === "canvas") return value;
    return artifactCount > 1 || viewMode === "variants" || viewMode === "split" ? "canvas" : "document";
  }

  // lib/artifact/ui/annotations.mjs
  var ARTIFACT_ANNOTATION_EVENTS = Object.freeze({
    draft: "planr:artifact-annotation-draft",
    focus: "planr:artifact-annotation-focus"
  });
  var ARTIFACT_ANNOTATION_LIMITS = Object.freeze({
    dragThreshold: 4,
    maxCommentLength: 65536,
    maxIdentityLength: 256
  });
  var INTENTS = Object.freeze(["fix", "improve", "question"]);
  function finite(value, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }
  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, finite(value)));
  }
  function normalized(value) {
    return Math.round(clamp(value) * 1e6) / 1e6;
  }
  function assertRect(rect) {
    if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.top) || !Number.isFinite(rect.width) || !Number.isFinite(rect.height) || rect.width <= 0 || rect.height <= 0) {
      throw new RangeError("Artifact bounds must have positive finite dimensions.");
    }
  }
  function clientSelectionToNormalized(rect, start, end = start, { dragThreshold = ARTIFACT_ANNOTATION_LIMITS.dragThreshold } = {}) {
    assertRect(rect);
    const startX = clamp(
      finite(start?.x ?? start?.clientX, rect.left),
      rect.left,
      rect.left + rect.width
    );
    const startY = clamp(
      finite(start?.y ?? start?.clientY, rect.top),
      rect.top,
      rect.top + rect.height
    );
    const endX = clamp(finite(end?.x ?? end?.clientX, startX), rect.left, rect.left + rect.width);
    const endY = clamp(finite(end?.y ?? end?.clientY, startY), rect.top, rect.top + rect.height);
    const dragged = Math.hypot(endX - startX, endY - startY) >= Math.max(0, finite(dragThreshold, 4));
    const left = dragged ? Math.min(startX, endX) : startX;
    const top = dragged ? Math.min(startY, endY) : startY;
    const right = dragged ? Math.max(startX, endX) : startX;
    const bottom = dragged ? Math.max(startY, endY) : startY;
    return Object.freeze({
      x: normalized((left - rect.left) / rect.width),
      y: normalized((top - rect.top) / rect.height),
      w: normalized((right - left) / rect.width),
      h: normalized((bottom - top) / rect.height)
    });
  }
  function artifactAnchorPoint(region, viewport) {
    const width = Number.isInteger(viewport?.width) && viewport.width > 0 ? viewport.width : 1;
    const height = Number.isInteger(viewport?.height) && viewport.height > 0 ? viewport.height : 1;
    return Object.freeze({
      x: Math.round(clamp(region?.x + finite(region?.w) / 2) * width),
      y: Math.round(clamp(region?.y + finite(region?.h) / 2) * height)
    });
  }
  function annotationStyle(region) {
    const percent = (value) => `${Math.round(clamp(value) * 1e6) / 1e4}%`;
    return Object.freeze({
      left: percent(region?.x),
      top: percent(region?.y),
      width: percent(region?.w),
      height: percent(region?.h)
    });
  }
  function viewportRegionToAnchorRegion(region, viewport, anchorRect) {
    const width = Number.isInteger(viewport?.width) && viewport.width > 0 ? viewport.width : 1;
    const height = Number.isInteger(viewport?.height) && viewport.height > 0 ? viewport.height : 1;
    const anchorWidth = Math.max(1, finite(anchorRect?.width, 1));
    const anchorHeight = Math.max(1, finite(anchorRect?.height, 1));
    const left = clamp(region?.x) * width;
    const top = clamp(region?.y) * height;
    const right = left + clamp(region?.w) * width;
    const bottom = top + clamp(region?.h) * height;
    const x = clamp((left - finite(anchorRect?.x)) / anchorWidth);
    const y = clamp((top - finite(anchorRect?.y)) / anchorHeight);
    return Object.freeze({
      x: normalized(x),
      y: normalized(y),
      w: normalized(Math.max(0, Math.min(1 - x, (right - left) / anchorWidth))),
      h: normalized(Math.max(0, Math.min(1 - y, (bottom - top) / anchorHeight)))
    });
  }
  function anchorRegionToViewportRegion(region, viewport, anchorRect) {
    const width = Number.isInteger(viewport?.width) && viewport.width > 0 ? viewport.width : 1;
    const height = Number.isInteger(viewport?.height) && viewport.height > 0 ? viewport.height : 1;
    const anchorWidth = Math.max(0, finite(anchorRect?.width));
    const anchorHeight = Math.max(0, finite(anchorRect?.height));
    return Object.freeze({
      x: normalized((finite(anchorRect?.x) + clamp(region?.x) * anchorWidth) / width),
      y: normalized((finite(anchorRect?.y) + clamp(region?.y) * anchorHeight) / height),
      w: normalized(clamp(region?.w) * anchorWidth / width),
      h: normalized(clamp(region?.h) * anchorHeight / height)
    });
  }
  function domToken(value) {
    const source = String(value);
    let token3 = "";
    for (let index2 = 0; index2 < source.length; index2 += 1) {
      token3 += source.charCodeAt(index2).toString(16).padStart(4, "0");
    }
    return token3;
  }
  function annotationDomIds(pinId) {
    const suffix = domToken(pinId);
    return Object.freeze({
      pin: `planr-pin-${suffix}`,
      thread: `planr-thread-${suffix}`
    });
  }
  function text(value, max = ARTIFACT_ANNOTATION_LIMITS.maxCommentLength) {
    return typeof value === "string" ? value.trim().slice(0, max) : "";
  }
  function make(document2, tag, { className, textContent, attributes = {} } = {}) {
    const node2 = document2.createElement(tag);
    if (className) node2.className = className;
    if (textContent !== void 0) node2.textContent = textContent;
    for (const [name, value] of Object.entries(attributes)) {
      if (value !== void 0 && value !== null) node2.setAttribute(name, String(value));
    }
    return node2;
  }
  function setRegionStyle(node2, region) {
    const style = annotationStyle(region);
    if (node2.style.left !== style.left) node2.style.left = style.left;
    if (node2.style.top !== style.top) node2.style.top = style.top;
    if (region.w > 0 || region.h > 0) {
      if (node2.style.width !== style.width) node2.style.width = style.width;
      if (node2.style.height !== style.height) node2.style.height = style.height;
    }
  }
  function announce(document2, value) {
    const node2 = document2.querySelector('[data-planr-slot="review-announcer"]');
    if (node2) node2.textContent = value;
  }
  function identityName(reviewController) {
    return text(
      reviewController?.getIdentity?.()?.name,
      ARTIFACT_ANNOTATION_LIMITS.maxIdentityLength
    );
  }
  function createIntentPicker(document2) {
    const group = make(document2, "div", {
      className: "planr-intent-picker",
      attributes: { role: "radiogroup", "aria-label": "Feedback intent" }
    });
    for (const [index2, intent] of INTENTS.entries()) {
      const button = make(document2, "button", {
        textContent: intent[0].toUpperCase() + intent.slice(1),
        attributes: {
          type: "button",
          role: "radio",
          "aria-checked": String(index2 === 0),
          tabindex: index2 === 0 ? 0 : -1,
          "data-planr-intent": intent
        }
      });
      group.append(button);
    }
    return group;
  }
  function mountArtifactAnnotations({
    document: document2 = globalThis.document,
    window = document2?.defaultView,
    root = document2?.querySelector?.(".planr-shell"),
    stageController,
    reviewController,
    onFocusPin
  } = {}) {
    if (!document2 || !window || !root || !stageController || !reviewController) return null;
    const cleanup = [];
    let draft = null;
    let suspendedDraft = null;
    let draftToken = 0;
    let draftFieldCleanup = null;
    let composerLayoutCleanup = null;
    let composerReturnFocus = null;
    const pinRecords = /* @__PURE__ */ new Map();
    const anchorRequests = /* @__PURE__ */ new Map();
    let destroyed = false;
    function listen(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      cleanup.push(() => target.removeEventListener(type, handler, options));
    }
    function review() {
      return reviewController.getReview?.() ?? reviewController.getState?.()?.review ?? reviewController.getState?.();
    }
    function layerFor(artifactId) {
      return [...document2.querySelectorAll("[data-planr-annotation-layer]")].find(
        (node2) => node2.dataset.planrAnnotationLayer === artifactId
      ) ?? null;
    }
    function frameFor(artifactId) {
      return [...document2.querySelectorAll("[data-planr-artifact-frame]")].find(
        (node2) => node2.dataset.planrArtifactFrame === artifactId
      ) ?? null;
    }
    function focusThread(pinId) {
      const pin = review()?.pins?.find((item2) => item2.id === pinId);
      if (!pin) return;
      reviewController.selectPin?.(pinId);
      const state = stageController.getState();
      if (state.activeArtifactId !== pin.artifactId) {
        stageController.dispatch({ type: "set-active", artifactId: pin.artifactId });
      }
      stageController.dispatch({ type: "set-rail-open", railOpen: true });
      queueMicrotask(() => document2.getElementById(annotationDomIds(pinId).thread)?.focus());
    }
    function focusPin(pinId) {
      const pin = review()?.pins?.find((item2) => item2.id === pinId);
      if (!pin) return;
      reviewController.selectPin?.(pinId);
      const state = stageController.getState();
      if (state.activeArtifactId !== pin.artifactId) {
        stageController.dispatch({ type: "set-active", artifactId: pin.artifactId });
      }
      queueMicrotask(() => {
        const marker = document2.getElementById(annotationDomIds(pinId).pin);
        if (marker?.hidden) {
          announce(
            document2,
            "This pin’s element is not currently visible. The original comment remains in Review."
          );
          return;
        }
        if (onFocusPin) onFocusPin(pin);
        else marker?.scrollIntoView?.({ block: "center", inline: "center", behavior: "smooth" });
        marker?.focus?.({ preventScroll: true });
        marker?.classList.add("planr-pin-highlight");
        window.setTimeout(() => marker?.classList.remove("planr-pin-highlight"), 1200);
      });
    }
    function pinGeometryKey(pin) {
      return JSON.stringify([
        reviewController.getReviewOf?.() ?? review()?.reviewOf,
        pin.artifactId,
        pin.anchor,
        pin.region,
        pin.viewport
      ]);
    }
    function setPinPosition(record2, region) {
      const point2 = { x: region.x + region.w / 2, y: region.y + region.h / 2, w: 0, h: 0 };
      setRegionStyle(record2.button, point2);
      if (record2.region) setRegionStyle(record2.region, region);
      if (record2.button.hidden) record2.button.hidden = false;
      if (record2.region?.hidden) record2.region.hidden = false;
    }
    function hidePin(record2) {
      if (!record2.button.hidden) record2.button.hidden = true;
      if (record2.region && !record2.region.hidden) record2.region.hidden = true;
    }
    function removePin(record2) {
      record2.pending = null;
      record2.button.remove();
      record2.region?.remove();
    }
    function refreshAnchors() {
      if (destroyed) return;
      const now = window.performance.now();
      const frames = new Map(
        [...document2.querySelectorAll("[data-planr-artifact-frame]")].map((frame) => [
          frame.dataset.planrArtifactFrame,
          frame
        ])
      );
      const records = [...pinRecords.values()].flatMap((records2) => [...records2.values()]).filter((record2) => record2.pin.anchor?.planrId).sort((a, b) => a.requestedAt - b.requestedAt);
      for (const record2 of records) {
        if (record2.pending || now - record2.requestedAt < 200 || !record2.button.isConnected) continue;
        const frame = frames.get(record2.pin.artifactId);
        const bridge = frame?.__openPlanrBridge;
        if (!bridge?.resolve || frame.closest("[hidden]") || frame.dataset.planrBridgeTrusted === "false" || (anchorRequests.get(frame) ?? 0) >= 8)
          continue;
        const request = {}, key = record2.geometryKey, pin = record2.pin;
        record2.pending = request;
        record2.requestedAt = now;
        anchorRequests.set(frame, (anchorRequests.get(frame) ?? 0) + 1);
        Promise.resolve().then(() => bridge.resolve(pin.anchor.planrId, pin.anchor.screen)).then((anchor2) => {
          if (destroyed || record2.pending !== request || record2.geometryKey !== key || !record2.button.isConnected || frame.__openPlanrBridge !== bridge)
            return;
          if (!anchor2 || anchor2.rect.width <= 0 || anchor2.rect.height <= 0) {
            hidePin(record2);
            if (record2.button.dataset.planrAnchorStatus !== "unavailable")
              record2.button.dataset.planrAnchorStatus = "unavailable";
            return;
          }
          const projected = anchorRegionToViewportRegion(
            pin.region,
            anchor2.viewport ?? pin.viewport,
            anchor2.rect
          );
          setPinPosition(record2, projected);
          if (record2.button.dataset.planrAnchorStatus !== "resolved")
            record2.button.dataset.planrAnchorStatus = "resolved";
        }).catch(() => {
        }).finally(() => {
          const remaining = (anchorRequests.get(frame) ?? 1) - 1;
          if (remaining > 0) anchorRequests.set(frame, remaining);
          else anchorRequests.delete(frame);
          if (record2.pending === request) record2.pending = null;
        });
      }
    }
    function renderPins() {
      if (destroyed) return;
      const pins = Array.isArray(review()?.pins) ? review().pins : [];
      const layers = new Set(document2.querySelectorAll("[data-planr-annotation-layer]"));
      for (const [layer, records] of pinRecords) {
        if (layers.has(layer)) continue;
        for (const record2 of records.values()) removePin(record2);
        pinRecords.delete(layer);
      }
      for (const layer of layers) {
        let records = pinRecords.get(layer);
        if (!records) {
          records = /* @__PURE__ */ new Map();
          pinRecords.set(layer, records);
        }
        const current = /* @__PURE__ */ new Set();
        for (const [index2, pin] of pins.entries()) {
          if (pin.artifactId !== layer.dataset.planrAnnotationLayer) continue;
          current.add(pin.id);
          const ids2 = annotationDomIds(pin.id), ordinal = index2 + 1;
          const hasRegion = pin.region.w > 0 || pin.region.h > 0;
          let record2 = records.get(pin.id);
          if (!record2) {
            const button = make(document2, "button", {
              attributes: {
                type: "button",
                id: ids2.pin,
                "data-planr-pin-id": pin.id,
                "aria-controls": ids2.thread
              }
            });
            button.addEventListener("click", () => focusThread(pin.id));
            layer.append(button);
            record2 = {
              button,
              region: null,
              pin,
              geometryKey: null,
              pending: null,
              requestedAt: -Infinity
            };
            records.set(pin.id, record2);
          }
          record2.pin = pin;
          if (hasRegion && !record2.region) {
            record2.region = make(document2, "span", {
              attributes: { "data-planr-pin-region-id": pin.id, "aria-hidden": "true" }
            });
            layer.insertBefore(record2.region, record2.button);
          } else if (!hasRegion && record2.region) {
            record2.region.remove();
            record2.region = null;
          }
          const buttonClass = `planr-pin planr-pin-${pin.intent} planr-pin-${pin.status}${hasRegion ? " planr-pin-region-handle" : ""}${record2.button.classList.contains("planr-pin-highlight") ? " planr-pin-highlight" : ""}`;
          if (record2.button.className !== buttonClass) record2.button.className = buttonClass;
          if (record2.button.textContent !== String(ordinal))
            record2.button.textContent = String(ordinal);
          for (const [name, value] of Object.entries({
            "data-planr-intent": pin.intent,
            "data-planr-status": pin.status,
            "aria-label": `${pin.intent} comment ${ordinal}: ${pin.comment}`
          })) {
            if (record2.button.getAttribute(name) !== value) record2.button.setAttribute(name, value);
          }
          if (record2.region) {
            const regionClass = `planr-pin-region planr-pin-region-${pin.intent} planr-pin-region-${pin.status}`;
            if (record2.region.className !== regionClass) record2.region.className = regionClass;
          }
          const key = pinGeometryKey(pin);
          if (record2.geometryKey !== key) {
            record2.geometryKey = key;
            record2.pending = null;
            record2.requestedAt = -Infinity;
            if (pin.anchor?.planrId) hidePin(record2);
            else {
              delete record2.button.dataset.planrAnchorStatus;
              setPinPosition(record2, pin.region);
            }
          }
        }
        for (const [id7, record2] of records) {
          if (!current.has(id7)) {
            removePin(record2);
            records.delete(id7);
          }
        }
      }
      refreshAnchors();
    }
    function closeComposer({ restoreFocus = false, preserveDraft = false } = {}) {
      const snapshot2 = preserveDraft ? snapshotDraft() : null;
      draftFieldCleanup?.();
      draftFieldCleanup = null;
      composerLayoutCleanup?.();
      composerLayoutCleanup = null;
      const activeLayer = draft ? layerFor(draft.artifactId) : null;
      const composer = root.querySelector("[data-planr-annotation-composer]");
      try {
        if (composer?.matches(":popover-open")) composer.hidePopover();
      } catch {
      }
      composer?.remove();
      draft = null;
      suspendedDraft = snapshot2;
      draftToken += 1;
      if (activeLayer && stageController.getState().reviewMode !== "comment") {
        activeLayer.setAttribute("aria-disabled", "true");
      }
      if (restoreFocus) {
        const target = composerReturnFocus?.isConnected && composerReturnFocus !== document2.body ? composerReturnFocus : activeLayer;
        target?.focus?.({ preventScroll: true });
      }
      composerReturnFocus = null;
    }
    async function resolveAnchor(token3, candidate) {
      const frame = frameFor(candidate.artifactId);
      const point2 = artifactAnchorPoint(candidate.region, candidate.viewport);
      let result = null;
      try {
        const anchor2 = frame?.__openPlanrBridge?.hitTest?.(point2.x, point2.y);
        if (anchor2) {
          result = await Promise.race([
            anchor2,
            new Promise((resolve) => window.setTimeout(() => resolve(null), 800))
          ]);
        }
      } catch {
        result = null;
      }
      if (token3 !== draftToken || !draft || draft.artifactId !== candidate.artifactId) return;
      if (result?.planrId) {
        draft.anchor = Object.freeze({
          planrId: String(result.planrId).slice(0, 512),
          ...result.screen ? { screen: String(result.screen).slice(0, 128) } : {}
        });
        draft.region = viewportRegionToAnchorRegion(draft.region, draft.viewport, result.rect);
      }
    }
    function positionComposer() {
      const composer = root.querySelector("[data-planr-annotation-composer]");
      const layer = draft && layerFor(draft.artifactId);
      if (!composer || !layer) return;
      const visual = window.visualViewport;
      const viewport = {
        x: finite(visual?.offsetLeft),
        y: finite(visual?.offsetTop),
        width: finite(visual?.width, window.innerWidth),
        height: finite(visual?.height, window.innerHeight)
      };
      const margin = Math.min(12, viewport.width / 8, viewport.height / 8);
      const availableWidth = Math.max(1, viewport.width - margin * 2), availableHeight = Math.max(1, viewport.height - margin * 2);
      composer.style.width = `${Math.min(360, availableWidth)}px`;
      composer.style.maxHeight = `${Math.min(620, availableHeight)}px`;
      const bounds2 = layer.getBoundingClientRect();
      const point2 = {
        x: bounds2.left + clamp(draft.displayRegion.x + draft.displayRegion.w / 2) * bounds2.width,
        y: bounds2.top + clamp(draft.displayRegion.y + draft.displayRegion.h / 2) * bounds2.height
      };
      const size = composer.getBoundingClientRect();
      const width = Math.min(size.width || 360, availableWidth), height = Math.min(size.height || 360, availableHeight);
      const left = point2.x + 16 + width <= viewport.x + viewport.width - margin ? point2.x + 16 : point2.x - width - 16;
      composer.style.left = `${clamp(left, viewport.x + margin, viewport.x + viewport.width - width - margin)}px`;
      composer.style.top = `${clamp(point2.y + 16, viewport.y + margin, viewport.y + viewport.height - height - margin)}px`;
    }
    function openComposer(detail, { restoredDraft = null } = {}) {
      const opener = document2.activeElement;
      closeComposer();
      composerReturnFocus = opener;
      const layer = layerFor(detail.artifactId);
      if (!layer) return;
      draftToken += 1;
      const token3 = draftToken;
      draft = {
        artifactId: detail.artifactId,
        region: Object.freeze({ ...detail.region }),
        viewport: Object.freeze({ ...detail.viewport }),
        variant: typeof detail.variant === "string" && detail.variant.length > 0 ? detail.variant : detail.artifactId,
        anchor: restoredDraft?.anchor ?? null,
        displayRegion: Object.freeze({ ...restoredDraft?.displayRegion ?? detail.region })
      };
      const composer = make(document2, "form", {
        className: "planr-annotation-composer",
        attributes: {
          "data-planr-annotation-composer": "",
          role: "dialog",
          popover: "manual",
          "aria-label": "Add artifact comment"
        }
      });
      const header = make(document2, "header", { className: "planr-composer-header" });
      const heading = make(document2, "strong", { textContent: "New comment" });
      const close = make(document2, "button", {
        textContent: "×",
        attributes: {
          type: "button",
          "data-planr-composer-close": "",
          "aria-label": "Close new comment",
          title: "Close new comment (Escape)"
        }
      });
      header.append(heading, close);
      const identityLabel = make(document2, "label", { textContent: "Your name" });
      const identity = make(document2, "input", {
        attributes: {
          type: "text",
          maxlength: ARTIFACT_ANNOTATION_LIMITS.maxIdentityLength,
          autocomplete: "name",
          value: identityName(reviewController),
          "data-planr-composer-identity": "",
          "aria-describedby": "planr-composer-error"
        }
      });
      identityLabel.append(identity);
      const intentPicker = createIntentPicker(document2);
      const commentLabel = make(document2, "label", { textContent: "Comment" });
      const comment = make(document2, "textarea", {
        attributes: {
          maxlength: ARTIFACT_ANNOTATION_LIMITS.maxCommentLength,
          required: "",
          placeholder: "Describe what the coding agent should change or consider…",
          "data-planr-composer-comment": "",
          "aria-describedby": "planr-composer-error"
        }
      });
      commentLabel.append(comment);
      const error = make(document2, "p", {
        className: "planr-field-error",
        attributes: { id: "planr-composer-error", role: "alert", "data-planr-composer-error": "" }
      });
      const actions = make(document2, "div", { className: "planr-composer-actions" });
      actions.append(
        make(document2, "button", {
          textContent: "Cancel",
          attributes: { type: "button", "data-planr-composer-cancel": "" }
        }),
        make(document2, "button", {
          textContent: "Add comment",
          attributes: { type: "submit", "data-planr-composer-submit": "" }
        })
      );
      composer.append(header, identityLabel, intentPicker, commentLabel, error, actions);
      root.append(composer);
      try {
        if (typeof composer.showPopover === "function") composer.showPopover();
        else composer.removeAttribute("popover");
      } catch {
        composer.removeAttribute("popover");
      }
      positionComposer();
      const observer = typeof window.ResizeObserver === "function" ? new window.ResizeObserver(positionComposer) : null;
      observer?.observe(composer);
      composerLayoutCleanup = () => observer?.disconnect();
      let selectedIntent = "fix";
      listen(intentPicker, "click", (event) => {
        const button = event.target.closest?.("[data-planr-intent]");
        if (!button || !INTENTS.includes(button.dataset.planrIntent)) return;
        selectedIntent = button.dataset.planrIntent;
        for (const option of intentPicker.querySelectorAll("[data-planr-intent]")) {
          option.setAttribute("aria-checked", String(option === button));
          option.tabIndex = option === button ? 0 : -1;
        }
      });
      listen(intentPicker, "keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key))
          return;
        const options = [...intentPicker.querySelectorAll("[data-planr-intent]")];
        const current = options.findIndex((option) => option.getAttribute("aria-checked") === "true");
        const delta = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
        const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (Math.max(0, current) + delta + options.length) % options.length;
        event.preventDefault();
        options[nextIndex].click();
        options[nextIndex].focus();
      });
      listen(close, "click", () => closeComposer({ restoreFocus: true }));
      listen(
        composer.querySelector("[data-planr-composer-cancel]"),
        "click",
        () => {
          closeComposer({ restoreFocus: true });
        },
        { once: true }
      );
      listen(composer, "keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          closeComposer({ restoreFocus: true });
        } else if (event.key === "Enter" && !event.isComposing && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          composer.requestSubmit();
        }
      });
      listen(composer, "submit", (event) => {
        event.preventDefault();
        if (!draft) return;
        const author = text(identity.value, ARTIFACT_ANNOTATION_LIMITS.maxIdentityLength);
        const body = text(comment.value);
        identity.setAttribute("aria-invalid", String(!author));
        comment.setAttribute("aria-invalid", String(!body));
        if (!author || !body) {
          error.textContent = !author ? "Enter your name before adding a comment." : "Enter a comment before submitting.";
          (!author ? identity : comment).focus();
          return;
        }
        reviewController.setIdentity?.({ name: author });
        const existingIds = new Set(review()?.pins?.map(({ id: id7 }) => id7) ?? []);
        const action = {
          type: "add-pin",
          pin: {
            artifactId: draft.artifactId,
            region: draft.region,
            viewport: draft.viewport,
            variant: draft.variant,
            ...draft.anchor ? { anchor: draft.anchor } : {},
            intent: selectedIntent,
            comment: body
          }
        };
        const next = reviewController.dispatch(action);
        const nextReview = next?.review ?? next;
        const created = nextReview?.pins?.find?.(({ id: id7 }) => !existingIds.has(id7));
        closeComposer();
        renderPins();
        announce(document2, `${selectedIntent} comment added.`);
        if (created?.id) queueMicrotask(() => focusThread(created.id));
      });
      comment.focus();
      root.dispatchEvent(
        new window.CustomEvent(ARTIFACT_ANNOTATION_EVENTS.draft, {
          bubbles: true,
          detail: Object.freeze({ ...draft })
        })
      );
      if (restoredDraft) {
        identity.value = restoredDraft.identity;
        comment.value = restoredDraft.comment;
        selectedIntent = restoredDraft.intent;
        for (const option of intentPicker.querySelectorAll("[data-planr-intent]")) {
          const selected = option.dataset.planrIntent === selectedIntent;
          option.setAttribute("aria-checked", String(selected));
          option.tabIndex = selected ? 0 : -1;
        }
        if (Number.isInteger(restoredDraft.selectionStart))
          comment.setSelectionRange(
            restoredDraft.selectionStart,
            restoredDraft.selectionEnd,
            restoredDraft.selectionDirection
          );
        const fields = new Map(
          Object.entries(restoredDraft.fields ?? {}).slice(0, 32).filter(
            ([key, value]) => key.length <= 128 && typeof value === "string" && value.length <= ARTIFACT_ANNOTATION_LIMITS.maxCommentLength
          )
        );
        if (fields.size) {
          let restoreFields = function() {
            if (token3 !== draftToken || !composer.isConnected) {
              finish();
              return;
            }
            for (const field of composer.querySelectorAll("[data-planr-draft-key]")) {
              const key = field.dataset.planrDraftKey;
              if (!fields.has(key) || typeof field.value !== "string") continue;
              field.value = fields.get(key);
              fields.delete(key);
              field.dispatchEvent(new window.Event("change", { bubbles: true }));
            }
            if (!fields.size) finish();
          };
          let timer;
          const observer2 = new window.MutationObserver(restoreFields);
          const finish = () => {
            observer2.disconnect();
            window.clearTimeout(timer);
          };
          observer2.observe(composer, { childList: true, subtree: true });
          timer = window.setTimeout(finish, 1500);
          draftFieldCleanup = finish;
          restoreFields();
        }
      } else void resolveAnchor(token3, draft);
    }
    function snapshotDraft() {
      const composer = document2.querySelector("[data-planr-annotation-composer]");
      if (!draft || !composer) return suspendedDraft;
      const comment = composer.querySelector("[data-planr-composer-comment]");
      return Object.freeze({
        ...draft,
        reviewOf: reviewController.getReviewOf?.() ?? review()?.reviewOf ?? null,
        identity: composer.querySelector("[data-planr-composer-identity]").value,
        fields: Object.fromEntries(
          [...composer.querySelectorAll("[data-planr-draft-key]")].slice(0, 32).filter(
            (field) => field.dataset.planrDraftKey.length <= 128 && typeof field.value === "string"
          ).map((field) => [
            field.dataset.planrDraftKey,
            field.value.slice(0, ARTIFACT_ANNOTATION_LIMITS.maxCommentLength)
          ])
        ),
        comment: comment.value,
        intent: composer.querySelector('[data-planr-intent][aria-checked="true"]')?.dataset.planrIntent ?? "fix",
        selectionStart: comment.selectionStart,
        selectionEnd: comment.selectionEnd,
        selectionDirection: comment.selectionDirection
      });
    }
    function restoreDraft(snapshot2) {
      if (!snapshot2 || snapshot2.reviewOf !== (reviewController.getReviewOf?.() ?? review()?.reviewOf ?? null))
        return false;
      const artifact = stageController.getState().artifacts.find((entry) => entry.id === snapshot2.artifactId);
      if (!artifact || artifact.viewport.width !== snapshot2.viewport?.width || artifact.viewport.height !== snapshot2.viewport?.height || !["x", "y", "w", "h"].every(
        (key) => Number.isFinite(snapshot2.region?.[key]) && snapshot2.region[key] >= 0 && snapshot2.region[key] <= 1
      ) || !["x", "y", "w", "h"].every(
        (key) => Number.isFinite(snapshot2.displayRegion?.[key]) && snapshot2.displayRegion[key] >= 0 && snapshot2.displayRegion[key] <= 1
      ) || typeof snapshot2.comment !== "string" || snapshot2.comment.length > ARTIFACT_ANNOTATION_LIMITS.maxCommentLength || typeof snapshot2.identity !== "string" || snapshot2.identity.length > ARTIFACT_ANNOTATION_LIMITS.maxIdentityLength || !INTENTS.includes(snapshot2.intent) || snapshot2.anchor && (typeof snapshot2.anchor.planrId !== "string" || snapshot2.anchor.planrId.length > 512))
        return false;
      openComposer(snapshot2, { restoredDraft: snapshot2 });
      return Boolean(draft);
    }
    listen(window, "resize", positionComposer);
    if (window.visualViewport) {
      listen(window.visualViewport, "resize", positionComposer);
      listen(window.visualViewport, "scroll", positionComposer);
    }
    listen(root, "planr:artifact-region", (event) => openComposer(event.detail));
    listen(root, "planr:stage-change", () => {
      const state = stageController.getState();
      const visible = state.viewMode === "split" ? [state.activeArtifactId, state.comparisonArtifactId] : [state.activeArtifactId];
      if (!draft) {
        if (suspendedDraft && state.status === "ready" && state.reviewMode === "comment" && visible.includes(suspendedDraft.artifactId))
          restoreDraft(suspendedDraft);
        return;
      }
      if (state.status !== "ready" || state.presentation !== "document" && state.reviewMode !== "comment") {
        closeComposer({ preserveDraft: true });
        return;
      }
      if (!visible.includes(draft.artifactId)) closeComposer({ preserveDraft: true });
      else {
        draftToken += 1;
        positionComposer();
      }
    });
    listen(root, "planr:artifact-review-change", renderPins);
    const anchorRefresh = window.setInterval(refreshAnchors, 250);
    cleanup.push(() => window.clearInterval(anchorRefresh));
    listen(root, ARTIFACT_ANNOTATION_EVENTS.focus, (event) => {
      if (event.detail?.target === "pin") focusPin(event.detail.pinId);
      if (event.detail?.target === "thread") focusThread(event.detail.pinId);
    });
    listen(root, "planr:artifact-review-select", (event) => {
      if (event.detail?.source === "thread" && typeof event.detail?.pinId === "string") {
        focusPin(event.detail.pinId);
      }
    });
    renderPins();
    const controller = Object.freeze({
      render: renderPins,
      openComposer,
      closeComposer,
      snapshotDraft,
      restoreDraft,
      focusPin,
      focusThread,
      destroy() {
        destroyed = true;
        closeComposer();
        for (const remove of cleanup.splice(0)) remove();
        for (const records of pinRecords.values())
          for (const record2 of records.values()) removePin(record2);
        pinRecords.clear();
        anchorRequests.clear();
      }
    });
    window.__openPlanrArtifactAnnotations = controller;
    return controller;
  }