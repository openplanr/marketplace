

  // lib/design/ui/studio-chrome.mjs
  function mountDesignChrome(input) {
    return mountDesignStudioChrome(input);
  }
  function mountDesignPanels(input) {
    return mountStudioPanelDialogs(input);
  }

  // lib/design/ui/studio.mjs
  function mountDesignStudio({ payload, stage: artifactStage }) {
    let design = payload.document, entries = payload.entries, options2 = globalThis.__OPENPLANR_DESIGN_STUDIO_OPTIONS__ ?? {}, storageKey = `openplanr.design-studio.${design.id}`, q = (selector) => document.querySelector(selector), qa = (selector) => [...document.querySelectorAll(selector)], clone = (value) => JSON.parse(JSON.stringify(value)), clamp2 = (value, min2, max2) => Math.min(max2, Math.max(min2, value)), readyVariants = design.variants.filter(({ status: status2 }) => status2 === "ready"), views = ["canvas", "prototype", "walkthrough"], validId = (items, id, fallback) => items.some((item) => (typeof item == "string" ? item : item.id) === id) ? id : fallback, normalizedViewport = (value) => !Number.isFinite(value?.x) || !Number.isFinite(value?.y) || !Number.isFinite(value?.zoom) ? null : {
      x: clamp2(value.x, -1e7, 1e7),
      y: clamp2(value.y, -1e7, 1e7),
      zoom: clamp2(value.zoom, 0.05, 2)
    };
    function normalizeState(input = {}) {
      let view = views.includes(input.view) ? input.view : design.defaultView, viewports = {};
      for (let name of views) {
        let viewport = normalizedViewport(input.viewports?.[name]);
        viewport && (viewports[name] = viewport);
      }
      let legacyViewport = Number.isFinite(input.zoom) ? normalizedViewport({
        x: Number.isFinite(input.camera?.x) ? input.camera.x : 40,
        y: Number.isFinite(input.camera?.y) ? input.camera.y : 40,
        zoom: input.zoom
      }) : null, activeViewport = viewports[view] ?? legacyViewport ?? { x: 40, y: 40, zoom: 0.5 }, state2 = {
        schemaVersion: "1.1.0",
        view,
        screenId: validId(design.screenOrder, input.screenId, design.screenOrder[0]),
        frameId: validId(design.frames, input.frameId, design.frames[0].id),
        variantId: validId(readyVariants, input.variantId, design.selectedVariant),
        selectedVariant: validId(readyVariants, input.selectedVariant, design.selectedVariant),
        compare: !!input.compare,
        navOpen: input.navOpen === void 0 ? !0 : !!input.navOpen,
        reviewOpen: input.reviewOpen === void 0 ? !0 : !!input.reviewOpen,
        inspectionScale: input.inspectionScale === "actual" ? "actual" : "fit",
        zoom: activeViewport.zoom,
        camera: { x: activeViewport.x, y: activeViewport.y },
        viewports,
        ratings: {},
        remix: {},
        preferences: { selected: [], rejected: [] }
      };
      for (let variant of readyVariants) {
        let rating = input.ratings?.[variant.id];
        Number.isInteger(rating) && rating >= 1 && rating <= 5 && (state2.ratings[variant.id] = rating), typeof input.remix?.[variant.id] == "string" && (state2.remix[variant.id] = input.remix[variant.id].slice(0, 8192));
      }
      for (let kind of ["selected", "rejected"])
        state2.preferences[kind] = [
          ...new Set(
            (Array.isArray(input.preferences?.[kind]) ? input.preferences[kind] : []).filter(
              (id) => readyVariants.some((variant) => variant.id === id)
            )
          )
        ];
      return state2;
    }
    let savedDraft = null;
    try {
      savedDraft = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    } catch {
    }
    let state = normalizeState({
      ...savedDraft?.state ?? {},
      ...payload.state ?? {}
    });
    function linkedState() {
      let params = new URLSearchParams(location.hash.slice(1)), linked = {};
      for (let [key, query] of [
        ["screenId", "screen"],
        ["frameId", "frame"],
        ["variantId", "direction"],
        ["view", "view"]
      ])
        params.has(query) && (linked[key] = params.get(query));
      return linked;
    }
    state = normalizeState({ ...state, ...linkedState() });
    function recordLocation() {
      let next = `#${new URLSearchParams({
        screen: state.screenId,
        frame: state.frameId,
        direction: state.variantId,
        view: state.view
      })}`;
      location.hash !== next && history.pushState(null, "", next);
    }
    let revision = payload.revision, layout = clone(design.layout ?? {}), undoMoves = [], redoMoves = [], layoutOperations = [], pendingLayoutDraft = savedDraft?.pendingLayout ?? null, layoutSaving = !1, layoutFailed = !1, sessionLost = !1, startupSettled = !1, layoutDragDirty = !1, activeLayoutOperation = null, layoutBlocked = !1, legacyMigrated = !1, legacyServerPositions = payload.state?.positions, stateVersion = null, stage = null, root = null, chrome = null, scroll = null, surface = null, grid = null, canvasAttached = !1, canvas = createCanvas({
      label: "Design canvas",
      zoom: { min: 0.05, max: 2 },
      lod: !1,
      motion: "none",
      keyboard: { arrows: "none" },
      shortcutsEnabled: () => !1
    }), cameraFrame = null, selectionOutline = null, dirty = !1, contentDirty = !1, contentSerial = 0, reviewDirty = !1, reviewSerial = 0, reviewSaving = Promise.resolve(), reviewTimer = null, latestReview = null, serial = 0, saveTimer = null, saving = Promise.resolve(), pollTimer = null, noticeTimer = null, activeNotice = null, dismissedNotices = /* @__PURE__ */ new Map(), readyReported = !1, readyReporting = !1, destroyed = !1, panEnabled = !1, spacePan = !1, spaceReturnTool = null, activeTool = "interact", changingTool = !1, previousReviewMode = "interact", gesture = null, rendering = !1, previousStageZoom = 100, compactViewport = !1, activeArtifactId = "", inspectedSelection = null, viewContextTimer = null, viewContextPending = null, viewContextSignature = null, viewContextConflictRevision = null, viewContextSaving = !1, framesUsedWithComments = /* @__PURE__ */ new Set(), frameReload = 0, walkthroughTransition = null, pendingScreen = null, screenRequest = 0, frameDemandTimer = null, failedSelection = null, frameDemandKey = "", frameDemandGeneration = 0, queuedSelection = null, noteScreenId = null, notesReturnFocus = null, panels = /* @__PURE__ */ new Map(), sectionHeadings = [], sectionZoom = null, canvasPointers = /* @__PURE__ */ new Set(), cleanup = [];
    function listen(target, event, handler, settings) {
      target?.addEventListener(event, handler, settings), cleanup.push(() => target?.removeEventListener(event, handler, settings));
    }
    function status(message, phase = "saved") {
      if (!destroyed && !(phase === "saved" && hasPendingLayout())) {
        if (chrome) chrome.update({ saveLabel: message, savePhase: phase });
        else {
          let node = q("[data-design-save-state]");
          node.textContent = message, node.dataset.status = phase;
        }
        q("[data-design-save-state]").title = message;
      }
    }
    function hideNotice() {
      clearTimeout(noticeTimer);
      let node = q(".design-notice"), restoreFocus = node.contains(document.activeElement);
      node.hidden = !0, activeNotice = null, q("[data-design-retry-layout]")?.remove(), q("[data-design-reload-studio]")?.remove(), restoreFocus && q(`button[data-design-view="${state.view}"]`)?.focus();
    }
    function clearNotice(key) {
      dismissedNotices.delete(key), activeNotice?.key === key && hideNotice();
    }
    function clearFailedSelection() {
      failedSelection && clearNotice(`preview-load:${failedSelection.artifactId}`), failedSelection = null;
    }
    function notice(message, persistent = !1, key = message) {
      if (destroyed || dismissedNotices.get(key) === message || sessionLost && key !== "studio-restart" || layoutFailed && hasPendingLayout() && !["layout-save", "studio-restart"].includes(key))
        return;
      let node = q(".design-notice");
      clearTimeout(noticeTimer), q("[data-design-retry-layout]")?.remove(), q("[data-design-reload-studio]")?.remove(), activeNotice = { key, message, persistent }, q("[data-design-notice-message]").textContent = message, node.hidden = !1, persistent || (noticeTimer = setTimeout(hideNotice, 6e3));
    }
    function storeDraft() {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            revision,
            stateVersion,
            state: !legacyMigrated && (legacyServerPositions || savedDraft?.state?.positions) ? {
              ...state,
              positions: { ...savedDraft?.state?.positions, ...legacyServerPositions }
            } : state,
            unsaved: contentDirty,
            personalPending: dirty && !contentDirty,
            pendingLayout: pendingLayoutDraft ?? (layoutOperations.length ? {
              contentIdentity: payload.contentIdentity,
              operations: layoutOperations.map((operation) => ({
                revision: operation.revision ?? revision,
                boards: operation.replayBoards ?? operation.input().boards
              }))
            } : void 0)
          })
        );
      } catch (error) {
        notice(`The browser draft could not be stored: ${error.message}`, !0, "draft-storage");
      }
    }
    async function jsonRequest(url, init = {}) {
      let response = await fetch(url, { credentials: "same-origin", ...init }), result = await response.json().catch(() => ({}));
      if (!response.ok) {
        let error = new Error(
          result.error?.message ?? result.error ?? result.message ?? `Save failed (${response.status}).`
        );
        throw error.conflict = response.status === 409, error.statusCode = response.status, error;
      }
      return result;
    }
    function scheduleViewContext() {
      if (!options2.viewContextUrl || !stage || !scroll || destroyed || state.view === "canvas" && !canvasAttached || viewContextConflictRevision !== null && revision === viewContextConflictRevision) return;
      viewContextConflictRevision = null, inspectedSelection?.artifactId !== activeArtifactId && (inspectedSelection = null);
      let board = ({ screenId, frameId, variantId }) => ({ screenId, frameId, variantId }), visible = state.view === "canvas" ? visibleEntries().filter((entry) => {
        let bounds = placedBoardBounds(entry);
        if (!bounds) return !1;
        let { width, height } = bounds, { x, y } = canvas.worldToScreen(bounds);
        return x < scroll.clientWidth && y < scroll.clientHeight && x + width * state.zoom > 0 && y + height * state.zoom > 0;
      }) : [entryFor()];
      visible.sort(
        (a, b) => design.screenOrder.indexOf(a.screenId) - design.screenOrder.indexOf(b.screenId)
      );
      let context = {
        revision,
        view: state.view,
        visibleScreens: visible.map(board),
        selected: { ...board(state), planrId: inspectedSelection?.planrId ?? null },
        dirty: contentDirty || reviewDirty || layoutDragDirty || layoutOperations.length > 0
      }, signature = JSON.stringify(context);
      signature !== viewContextSignature && (viewContextSignature = signature, viewContextPending = signature, clearTimeout(viewContextTimer), viewContextTimer = setTimeout(() => {
        viewContextTimer = null, flushViewContext();
      }, 250));
    }
    async function flushViewContext() {
      if (viewContextSaving || !viewContextPending || destroyed) return;
      let body = viewContextPending;
      viewContextPending = null, viewContextSaving = !0;
      try {
        await jsonRequest(options2.viewContextUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-openplanr-design": "1" },
          body
        }), clearNotice("view-context");
      } catch (error) {
        viewContextSignature = null, error.conflict ? (viewContextConflictRevision = JSON.parse(body).revision, viewContextPending = null, clearTimeout(viewContextTimer), viewContextTimer = null, clearNotice("view-context"), revision !== viewContextConflictRevision && scheduleViewContext()) : notice(`View context could not be synchronized: ${error.message}`, !1, "view-context");
      } finally {
        viewContextSaving = !1, viewContextPending && viewContextTimer === null && flushViewContext();
      }
    }
    function persist({ content = !1 } = {}) {
      dirty = !0, serial += 1, content && (contentDirty = !0, contentSerial += 1, status("Saving changes", "saving")), storeDraft(), scheduleViewContext(), root.dispatchEvent(
        new CustomEvent("planr:design-state-change", {
          bubbles: !0,
          detail: clone(state)
        })
      ), clearTimeout(saveTimer), saveTimer = setTimeout(flush, 180);
    }
    function flushState() {
      if (clearTimeout(saveTimer), !dirty) return saving;
      let captured = clone(state), capturedSerial = serial, capturedContent = contentDirty, capturedContentSerial = contentSerial;
      return saving = saving.catch(() => {
      }).then(async () => {
        if (!destroyed)
          try {
            !legacyMigrated && (legacyServerPositions || savedDraft?.state?.positions) && (captured.positions = { ...savedDraft?.state?.positions, ...legacyServerPositions });
            let result;
            !capturedContent && typeof options2.savePersonalState == "function" ? result = await options2.savePersonalState(captured, { revision, stateVersion }) : typeof options2.saveState == "function" ? result = await options2.saveState(captured, {
              revision,
              stateVersion,
              personal: !capturedContent
            }) : options2.stateUrl && (result = await jsonRequest(options2.stateUrl, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: captured, revision, stateVersion })
            })), result?.stateVersion !== void 0 && (stateVersion = result.stateVersion), result?.revision !== void 0 && (revision = result.revision), clearNotice("personal-save"), capturedContent && clearNotice("content-save"), capturedSerial === serial && (dirty = !1), capturedContent && capturedContentSerial === contentSerial && (contentDirty = !1, !reviewDirty && !layoutOperations.length && status(
              options2.stateUrl || options2.saveState ? "All changes saved" : "Saved in this browser"
            )), storeDraft(), scheduleViewContext();
          } catch (error) {
            capturedContent && status(
              error.conflict ? "Save conflict" : "Disconnected · unsaved",
              error.conflict ? "failed" : "disconnected"
            ), notice(
              capturedContent ? error.conflict ? "This review changed in another window. Your unsaved edits remain in this browser. Reload to read the saved review before applying them again." : "Changes could not be saved. Your draft remains in this browser; reconnect to retry." : "Canvas preferences could not be synchronized. Your arrangement remains saved in this browser.",
              !0,
              capturedContent ? "content-save" : "personal-save"
            ), storeDraft();
          }
      }), saving;
    }
    function layoutUrl() {
      return options2.layoutUrl ?? options2.stateUrl?.replace(/design-state$/, "design-layout");
    }
    function canSaveLayout() {
      return !!(options2.saveLayout || layoutUrl());
    }
    function hasPendingLayout() {
      return !!(pendingLayoutDraft || layoutOperations.length || layoutSaving || layoutDragDirty);
    }
    function studioRestarted() {
      sessionLost = !0, storeDraft(), status(hasPendingLayout() ? "Layout unsaved · reload required" : "Reload required", "failed"), notice(
        "Studio restarted. Reload to reconnect; pending board moves remain in this browser.",
        !0,
        "studio-restart"
      );
      let reload = document.createElement("button");
      reload.type = "button", reload.dataset.designReloadStudio = "", reload.textContent = "Reload", reload.addEventListener("click", () => {
        storeDraft(), window.location.reload();
      }), q(".design-notice").append(reload);
    }
    function applyBoardMoves(boards) {
      for (let [key, point2] of Object.entries(boards))
        layout.boards ??= {}, point2 === null ? delete layout.boards[key] : layout.boards[key] = { ...layout.boards[key], ...point2 };
    }
    function restorePendingLayout() {
      if (!pendingLayoutDraft) return;
      let pending = pendingLayoutDraft;
      if (pendingLayoutDraft = null, layoutBlocked || !payload.contentIdentity || pending.contentIdentity !== payload.contentIdentity) {
        storeDraft(), notice(
          "Pending board moves were dropped because authored content changed. Review the current design before moving boards again.",
          !0,
          "layout-dropped"
        );
        return;
      }
      if (!(Array.isArray(pending.operations) && pending.operations.every(
        (operation) => typeof operation?.revision == "string" && operation.boards && typeof operation.boards == "object" && !Array.isArray(operation.boards) && Object.entries(operation.boards).every(
          ([key, point2]) => entries.some((entry) => boardKey(entry) === key) && (point2 === null || Number.isFinite(point2?.x) && Number.isFinite(point2?.y) && Math.abs(point2.x) <= 1e7 && Math.abs(point2.y) <= 1e7)
        )
      ))) {
        storeDraft(), notice(
          "Pending board moves could not be recovered because the browser draft contains invalid positions.",
          !0,
          "layout-dropped"
        );
        return;
      }
      for (let operation of pending.operations) {
        let boards = clone(operation.boards);
        applyBoardMoves(boards), layoutOperations.push({ revision, input: () => ({ boards }) });
      }
      storeDraft(), render(), layoutOperations.length && status("Recovering layout", "saving");
    }
    function newRevisionNotice() {
      notice(
        "A new design revision is ready. Save or recover this browser’s unsaved changes before reloading.",
        !0,
        "new-revision"
      );
    }
    async function rebaseLayout({ announce = !0, expectedRevision = revision } = {}) {
      let url = options2.statusUrl ?? options2.stateUrl?.replace(/design-state$/, "design-status");
      if (!url) throw new Error("Layout conflict recovery requires a design status URL.");
      let current = await jsonRequest(url);
      if (revision !== expectedRevision) return !0;
      if (typeof current.revision != "string" || typeof current.contentIdentity != "string")
        throw new Error("Design status did not return a revision and authored content identity.");
      if (current.contentIdentity !== payload.contentIdentity)
        return layoutBlocked = !0, layoutOperations.length = 0, layoutFailed = !1, storeDraft(), status("Design changed · reload required", "failed"), notice(
          "A new design revision is ready. Pending board moves were dropped because authored content changed. Reload to read the current design.",
          !0,
          "new-revision"
        ), !1;
      revision = current.revision, layout = clone(current.layout ?? {});
      let discardedRestores = layoutOperations.some((operation) => operation.restore);
      for (let index2 = layoutOperations.length - 1; index2 >= 0; index2--)
        layoutOperations[index2].restore && layoutOperations.splice(index2, 1);
      for (let moves of [undoMoves, redoMoves])
        for (let index2 = moves.length - 1; index2 >= 0; index2--)
          moves[index2].afterRevision !== null && moves.splice(index2, 1);
      for (let operation of layoutOperations) {
        operation.revision = revision;
        let boards = operation.input().boards;
        if (operation.move?.applied && (operation.move.before = clone(layout)), applyBoardMoves(boards), operation.move?.applied) operation.move.after = clone(layout);
        else if (operation.move) {
          let move = operation.move, movedBoard = move.after.boards?.[move.key];
          move.before = clone(layout), move.after = clone(layout), movedBoard ? move.after.boards = { ...move.after.boards, [move.key]: movedBoard } : move.after.boards && delete move.after.boards[move.key];
        }
      }
      return storeDraft(), render(), announce && notice(
        `The layout changed in another window. Pending board moves were rebased onto the current revision.${discardedRestores ? " Stale undo and redo operations were dropped." : ""}`,
        !0,
        "layout-rebase"
      ), !0;
    }
    function flushLayout() {
      return layoutSaving || layoutBlocked || sessionLost || !layoutOperations.length || (layoutSaving = !0, status("Saving layout", "saving"), saving = saving.then(async () => {
        let rebased = !1;
        try {
          for (; layoutOperations.length; ) {
            let operation = layoutOperations[0], input = { revision, ...operation.input() };
            activeLayoutOperation = operation, operation.attempted = !0, operation.appliedAtSave = operation.move?.applied, status("Saving layout", "saving");
            let result;
            try {
              if (typeof options2.saveLayout == "function") result = await options2.saveLayout(input);
              else if (layoutUrl())
                result = await jsonRequest(layoutUrl(), {
                  method: "PUT",
                  headers: { "Content-Type": "application/json", "x-openplanr-design": "1" },
                  body: JSON.stringify(input)
                });
              else
                throw new Error("Layout save requires a studio layout URL or saveLayout callback.");
            } catch (error) {
              if (activeLayoutOperation = null, operation.canceled = !1, !error.conflict || rebased) throw error;
              if (rebased = !0, !await rebaseLayout()) return;
              continue;
            }
            if (typeof result.revision != "string")
              throw new Error("Layout save did not return a design revision.");
            operation.saved?.(revision, result.revision), revision = result.revision, layoutOperations.shift(), activeLayoutOperation = null, storeDraft(), scheduleViewContext();
          }
          layoutFailed = !1, clearNotice("layout-save");
        } catch (error) {
          if (layoutFailed = !0, storeDraft(), error.statusCode === 404) {
            studioRestarted();
            return;
          }
          status(error.conflict ? "Layout conflict" : "Layout unsaved", "failed"), notice(`Board layout could not be saved: ${error.message}`, !0, "layout-save");
          let retry = document.createElement("button");
          retry.type = "button", retry.dataset.designRetryLayout = "", retry.textContent = "Retry", retry.addEventListener("click", () => {
            flushLayout();
          }), q(".design-notice").append(retry);
        } finally {
          activeLayoutOperation = null, layoutSaving = !1, !hasPendingLayout() && !contentDirty && !reviewDirty && !layoutBlocked && !sessionLost && status("All changes saved");
        }
      })), saving;
    }
    function boardKey(entry) {
      return `${entry.screenId}/${entry.frameId}/${entry.variantId}`;
    }
    function queueMove(move) {
      let point2 = (value) => {
        let board = value.boards?.[move.key];
        return board ? { x: board.x, y: board.y } : null;
      }, operation = {
        revision,
        move,
        boards: { [move.key]: point2(move.after) },
        input: () => ({ boards: operation.boards }),
        saved(previous, next) {
          if (operation.appliedAtSave && (move.beforeRevision = previous, move.afterRevision = next), operation.canceled) {
            let boards = { [move.key]: point2(layout) };
            layoutOperations.push({ input: () => ({ boards }) });
          }
        }
      };
      layoutOperations.push(operation), storeDraft(), scheduleViewContext(), flushLayout();
    }
    function completeMove(entry, before) {
      let after = clone(layout);
      if (JSON.stringify(before) === JSON.stringify(after)) return;
      let move = {
        key: boardKey(entry),
        before,
        after,
        beforeRevision: null,
        afterRevision: null,
        applied: !0
      };
      undoMoves.push(move), redoMoves.length = 0, storeDraft(), canSaveLayout() && queueMove(move);
    }
    function restoreMove(redo) {
      let source = redo ? redoMoves : undoMoves, target = redo ? undoMoves : redoMoves, move = source.pop();
      if (move && (move.applied = redo, layout = clone(redo ? move.after : move.before), target.push(move), render(), !!canSaveLayout())) {
        if (move.beforeRevision === null || move.afterRevision === null) {
          let pending = layoutOperations.find((operation) => operation.move === move);
          if (pending) {
            let board = layout.boards?.[move.key];
            pending.boards = { [move.key]: board ? { x: board.x, y: board.y } : null };
          }
          pending === activeLayoutOperation && pending ? pending.canceled = !redo : pending?.attempted || (pending && layoutOperations.splice(layoutOperations.indexOf(pending), 1), redo && queueMove(move)), !layoutOperations.length && !layoutSaving && (layoutFailed = !1, clearNotice("layout-save"), !contentDirty && !reviewDirty && status("All changes saved")), storeDraft(), scheduleViewContext();
          return;
        }
        layoutOperations.push({
          revision,
          restore: !0,
          replayBoards: {
            [move.key]: layout.boards?.[move.key] ? {
              x: layout.boards[move.key].x,
              y: layout.boards[move.key].y
            } : null
          },
          input: () => ({ restoreRevision: redo ? move.afterRevision : move.beforeRevision })
        }), storeDraft(), scheduleViewContext(), flushLayout();
      }
    }
    function migrateLegacyPositions() {
      if (layoutBlocked) return;
      if (!legacyServerPositions && !savedDraft?.state?.positions) {
        legacyMigrated = !0;
        return;
      }
      let boards = {};
      for (let positions of [legacyServerPositions, savedDraft?.state?.positions])
        for (let entry of entries) {
          let key = boardKey(entry), point2 = positions?.[entry.artifactId];
          layout.boards?.[key] !== void 0 || boards[key] !== void 0 || !point2 || !Number.isFinite(point2.x) || !Number.isFinite(point2.y) || Math.abs(point2.x) > 1e7 || Math.abs(point2.y) > 1e7 || (boards[key] = { x: Math.round(point2.x), y: Math.round(point2.y) });
        }
      Object.keys(boards).length && (layout.boards = { ...layout.boards, ...boards }), render();
      let migrated = () => {
        legacyMigrated = !0, legacyServerPositions = void 0, storeDraft(), options2.stateUrl && persist();
      };
      Object.keys(boards).length && canSaveLayout() ? (layoutOperations.push({ revision, input: () => ({ boards }), saved: migrated }), storeDraft()) : canSaveLayout() && migrated();
    }
    function reviewUrl() {
      return options2.reviewUrl ?? (options2.stateUrl ? options2.stateUrl.replace(/design-state$/, "review") : null);
    }
    function storeReviewDraft() {
      if (latestReview)
        try {
          localStorage.setItem(
            `${storageKey}.review`,
            JSON.stringify({ review: latestReview, unsaved: reviewDirty })
          );
        } catch {
        }
    }
    function flushReview() {
      if (clearTimeout(reviewTimer), !reviewDirty || !latestReview) return reviewSaving;
      let captured = clone(latestReview), capturedSerial = reviewSerial;
      return reviewSaving = reviewSaving.catch(() => {
      }).then(async () => {
        try {
          reviewUrl() && await jsonRequest(reviewUrl(), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ review: captured })
          }), clearNotice("review-save"), capturedSerial === reviewSerial && (reviewDirty = !1, !contentDirty && !layoutOperations.length && status(reviewUrl() ? "All changes saved" : "Saved in this browser")), storeReviewDraft(), scheduleViewContext();
        } catch (error) {
          status("Comments unsaved", "disconnected"), notice(
            `Comments could not be saved: ${error.message} Your draft remains in this browser.`,
            !0,
            "review-save"
          ), storeReviewDraft();
        }
      }), reviewSaving;
    }
    function flush() {
      return Promise.all([flushState(), flushLayout(), flushReview()]);
    }
    function entryFor(screenId = state.screenId, variantId = state.variantId, frameId = state.frameId) {
      return entries.find(
        (entry) => entry.screenId === screenId && entry.variantId === variantId && entry.frameId === frameId
      );
    }
    function viewportFor(entry) {
      let frame = design.frames.find(({ id }) => id === entry.frameId);
      return stage.getState().artifacts.find(({ id }) => id === entry.artifactId)?.viewport ?? designFrameViewport(design, frame);
    }
    function visibleEntries() {
      return entries.filter(
        (entry) => (state.view === "canvas" && state.compare || entry.variantId === state.variantId) && (state.view === "canvas" || entry.screenId === state.screenId && entry.frameId === state.frameId)
      );
    }
    function syncFrameGestures(frame, panel) {
      frame?.__openPlanrBridge?.setViewportGestures?.(state.view === "canvas" && !panel.hidden);
    }
    function updatePan() {
      root.dataset.designPanActive = String(state.view === "canvas" && (panEnabled || spacePan)), root.dataset.designTool = activeTool, canvas.setPointerMode(root.dataset.designInspect === "true" ? "none" : "pan"), q("[data-design-pan]").setAttribute("aria-pressed", String(activeTool === "pan")), q('[data-planr-mode="interact"]').setAttribute(
        "aria-pressed",
        String(activeTool === "interact")
      ), q('[data-planr-mode="comment"]').setAttribute(
        "aria-pressed",
        String(activeTool === "annotate")
      ), q("[data-design-inspect-mode]")?.setAttribute("aria-pressed", String(activeTool === "inspect"));
      for (let [id, panel] of panels) {
        let frame = stage.getFrame(id);
        if (frame) {
          let tabIndex = activeTool === "interact" && !panel.hidden && stage.getState().status === "ready" ? 0 : -1;
          frame.tabIndex !== tabIndex && (frame.tabIndex = tabIndex), syncFrameGestures(frame, panel);
        }
      }
    }
    function finishGesture() {
      if (!gesture) return;
      let completed = gesture, pointerId = completed.pointerId;
      gesture = null, layoutDragDirty = !1;
      try {
        scroll.hasPointerCapture?.(pointerId) && scroll.releasePointerCapture(pointerId);
      } catch {
      }
      updatePan(), completed.mode === "artboard" ? completeMove(
        entries.find((entry) => entry.artifactId === completed.artifactId),
        completed.before
      ) : persist(), scheduleViewContext();
    }
    function noteFramesUsedWithComments() {
      if (!(state.view !== "canvas" || activeTool !== "annotate"))
        for (let id of stage.getLoadedArtifactIds()) framesUsedWithComments.add(id);
    }
    function reloadFrameUsedWithComments(artifactId) {
      if (!framesUsedWithComments.delete(artifactId) || !stage.getLoadedArtifactIds().includes(artifactId)) return;
      let reload = ++frameReload;
      root.dataset.designScreenLoading = "true";
      let settle = () => destroyed || reload !== frameReload ? !1 : (pendingScreen || delete root.dataset.designScreenLoading, updateFramePlaceholders(), !0);
      stage.retryFrames([artifactId]).then(settle, (error) => {
        !settle() || error.name === "AbortError" || notice(
          "This screen could not reload. Select it again to retry; your review is preserved.",
          !0,
          `preview-load:${artifactId}`
        );
      });
    }
    function setTool(tool) {
      if (["interact", "annotate", "pan", "inspect"].includes(tool) && !(tool === "pan" && state.view !== "canvas") && !(tool === "annotate" && root.hasAttribute("data-planr-room-comments-paused"))) {
        if (finishWalkthroughTransition(), finishGesture(), canvasAttached && canvasPointers.size) {
          saveViewport();
          for (let pointerId of canvasPointers)
            scroll.hasPointerCapture?.(pointerId) && scroll.releasePointerCapture(pointerId);
          canvasPointers.clear();
        }
        spacePan = !1, spaceReturnTool = null, activeTool = tool, panEnabled = tool === "pan", previousReviewMode = tool === "annotate" ? "comment" : "interact", changingTool = !0;
        try {
          stage.dispatch({ type: "set-review-mode", reviewMode: previousReviewMode });
        } finally {
          changingTool = !1;
        }
        noteFramesUsedWithComments(), root.dispatchEvent(new CustomEvent("planr:design-tool-change", { detail: { tool } })), updatePan();
      }
    }
    function releaseTemporaryPan() {
      let previous = spaceReturnTool;
      finishGesture(), spacePan && setTool(previous || "interact");
    }
    function readCanvasCamera() {
      if (!canvasAttached || state.view !== "canvas") return;
      let { x, y, scale } = cameraToScreenTranslate(canvas.getCamera());
      state.camera = { x, y }, state.zoom = scale;
    }
    function applyCanvasCamera() {
      canvas.setCamera(cameraFromScreenTranslate({ ...state.camera, scale: state.zoom })), saveViewport();
    }
    function saveViewport() {
      readCanvasCamera(), state.viewports[state.view] = {
        x: state.camera.x,
        y: state.camera.y,
        zoom: state.zoom
      };
    }
    function restoreViewport(view) {
      let viewport = state.viewports[view];
      return viewport ? (state.camera = { x: viewport.x, y: viewport.y }, state.zoom = viewport.zoom, canvasAttached && view === "canvas" && applyCanvasCamera(), !0) : !1;
    }
    function switchView(view, { save = !0 } = {}) {
      if (!views.includes(view)) throw new TypeError(`Unknown design view: ${view}`);
      if (view === state.view) return;
      let queued = pendingScreen ? null : queuedSelection;
      finishWalkthroughTransition(), closeDesignNotes(), saveViewport(), state.view = view;
      let restored = view === "canvas" && restoreViewport(view);
      setTool(view === "canvas" && activeTool === "annotate" ? "annotate" : "interact"), root.dispatchEvent(new CustomEvent("planr:design-view-change", { detail: { view } })), render(), restored || fit({ save: !1 }), queued && selectEntry(queued.entry, { ...queued.settings, save: !1 }), save && (persist(), recordLocation());
    }
    function syncCanvasChrome() {
      if (!canvasAttached) return;
      let stageRect = scroll.getBoundingClientRect();
      for (let [id, selector, open] of [
        ["toolbar", ".design-toolbar", !0],
        ["tools", ".design-canvas-tools", !0],
        ["context", ".design-stage-context", !0],
        ["navigator", ".design-navigator", state.navOpen],
        ["review", ".planr-review-rail", stage.getState().railOpen]
      ]) {
        let rect2 = q(selector).getBoundingClientRect(), x = Math.max(0, rect2.left - stageRect.left), y = Math.max(0, rect2.top - stageRect.top), width = Math.max(0, Math.min(stageRect.width, rect2.right - stageRect.left) - x), height = Math.max(0, Math.min(stageRect.height, rect2.bottom - stageRect.top) - y), edge = width >= height ? y + height / 2 < stageRect.height / 2 ? "top" : "bottom" : x + width / 2 < stageRect.width / 2 ? "left" : "right";
        canvas.setChrome({
          id,
          edge,
          rect: { x, y, width, height },
          open: open && width > 0 && height > 0
        });
      }
    }
    function placedBoardBounds(entry) {
      let panel = panels.get(entry.artifactId);
      if (!panel || panel.hidden) return null;
      let bounds = {
        ...viewportFor(entry),
        x: parseFloat(panel.style.left),
        y: parseFloat(panel.style.top)
      };
      return Object.values(bounds).every(Number.isFinite) ? bounds : null;
    }
    function syncCanvasNodes() {
      if (!canvasAttached) return;
      grid.style.setProperty("--design-zoom", String(state.zoom));
      let placed = visibleEntries().flatMap((entry) => {
        let bounds = placedBoardBounds(entry);
        return bounds ? [{ entry, bounds }] : [];
      }), nodes = placed.flatMap(({ entry, bounds }) => [
        { id: entry.artifactId, bounds },
        {
          id: `label:${entry.artifactId}`,
          bounds: { ...bounds, y: bounds.y - 34 / state.zoom, height: 28 / state.zoom }
        }
      ]);
      sectionHeadings.forEach((heading, index2) => {
        let section = layout.sections[index2];
        heading.hidden = !1, heading.style.fontSize = `${clamp2(28 * state.zoom, 14, 28) / state.zoom}px`, section.maxW && (heading.style.maxWidth = `${section.maxW / state.zoom}px`);
        let below = placed.filter(
          ({ bounds: board }) => board.y >= section.y && section.x < board.x + board.width && section.x + heading.offsetWidth > board.x
        ), bottom = Math.min(section.y, ...below.map(({ bounds: bounds2 }) => bounds2.y - 42 / state.zoom));
        heading.style.top = `${bottom - heading.offsetHeight}px`;
        let bounds = {
          x: parseFloat(heading.style.left),
          y: parseFloat(heading.style.top),
          width: heading.offsetWidth,
          height: heading.offsetHeight
        };
        heading.hidden = nodes.some(
          ({ bounds: other }) => bounds.x < other.x + other.width && bounds.x + bounds.width > other.x && bounds.y < other.y + other.height && bounds.y + bounds.height > other.y
        ), !heading.hidden && Object.values(bounds).every(Number.isFinite) && nodes.push({ id: `section:${section.id}`, bounds });
      }), sectionZoom = state.zoom, canvas.setNodes(nodes);
      for (let { entry } of placed) {
        canvas.registerNodeElement(entry.artifactId, panels.get(entry.artifactId));
        let label = panels.get(entry.artifactId).querySelector(".design-artboard-label"), title = label.querySelector("strong"), size4 = label.querySelector("span");
        label.title = `${title.textContent} · ${size4.textContent}`, size4.hidden = !1, size4.hidden = title.scrollWidth > title.clientWidth || size4.scrollWidth > size4.clientWidth;
      }
      canvas.setSelection(
        placed.some(({ entry }) => entry.artifactId === activeArtifactId) ? [activeArtifactId] : []
      );
    }
    function syncCanvas() {
      if (state.view !== "canvas") {
        canvasAttached && canvas.detach(), canvasPointers.clear(), canvasAttached = !1;
        return;
      }
      canvasAttached || (canvas.attach({ stage: scroll, world: grid }), canvasAttached = !0, applyCanvasCamera()), syncCanvasNodes(), syncCanvasChrome();
    }
    function centerEntry(entry) {
      state.view !== "canvas" || !placedBoardBounds(entry) || fit({ selection: entry, save: !1, maxZoom: state.zoom });
    }
    function updateDesignNotes() {
      let notes = q("[data-design-notes]");
      if (!notes) return;
      notes.querySelector(":scope > summary").setAttribute("aria-expanded", String(notes.open));
      for (let button of qa("[data-design-note]"))
        button.setAttribute(
          "aria-expanded",
          String(notes.open && button.dataset.designNote === noteScreenId)
        );
      if (!notes.open) return;
      let panel = q(".design-guidance-panel"), anchor = notes.querySelector(":scope > summary").getBoundingClientRect(), width = panel.getBoundingClientRect().width || Math.min(340, window.innerWidth - 24), top = clamp2(anchor.bottom + 7, 12, Math.max(12, window.innerHeight - 100));
      panel.style.left = `${clamp2(anchor.right - width, 12, Math.max(12, window.innerWidth - width - 12))}px`, panel.style.top = `${top}px`, panel.style.maxHeight = `${Math.min(520, Math.max(60, window.innerHeight - top - 12))}px`;
    }
    function closeDesignNotes({ restoreFocus = !1 } = {}) {
      let notes = q("[data-design-notes]");
      notes?.open && (notes.open = !1, noteScreenId = null, updateDesignNotes(), restoreFocus && (notesReturnFocus?.isConnected ? notesReturnFocus : notes.querySelector(":scope > summary"))?.focus({ preventScroll: !0 }), notesReturnFocus = null);
    }
    function openDesignNote(screenId, trigger) {
      let notes = q("[data-design-notes]");
      if (!notes) return;
      if (notes.open && noteScreenId === screenId) {
        closeDesignNotes();
        return;
      }
      notesReturnFocus = trigger, noteScreenId = screenId, notes.open = !0;
      let target = null;
      for (let item of qa("[data-design-note-screen]")) {
        let selected = item.dataset.designNoteScreen === screenId;
        item.open = selected, item.dataset.active = String(selected), selected && (target = item);
      }
      updateDesignNotes();
      let panel = q(".design-guidance-panel");
      target && (panel.scrollTop = Math.max(0, target.offsetTop - panel.querySelector("header").offsetHeight));
    }
    function render() {
      if (!(!stage || rendering || destroyed)) {
        rendering = !0;
        try {
          window.innerWidth <= 680 ? root.style.setProperty(
            "--planr-toolbar-height",
            `${q(".design-toolbar").getBoundingClientRect().height}px`
          ) : root.style.removeProperty("--planr-toolbar-height");
          let screen = design.screens.find(({ id }) => id === state.screenId), variant = design.variants.find(({ id }) => id === state.variantId), stageState = stage.getState();
          root.dataset.designView = state.view, root.dataset.designNavOpen = String(state.navOpen);
          let navigator2 = q(".design-navigator");
          navigator2.inert = !state.navOpen, navigator2.setAttribute("aria-hidden", String(!state.navOpen));
          for (let toggle of qa("[data-design-toggle-nav]"))
            toggle.setAttribute("aria-expanded", String(state.navOpen));
          for (let button of qa("[data-design-view]"))
            button.tagName === "BUTTON" && button.setAttribute("aria-pressed", String(button.dataset.designView === state.view));
          for (let button of qa("[data-design-screen]"))
            button.setAttribute(
              "aria-current",
              button.dataset.designScreen === state.screenId ? "page" : "false"
            );
          q("[data-design-variant]").value = failedSelection?.variantId ?? state.variantId, q("[data-design-frame]").value = failedSelection?.frameId ?? state.frameId, q("[data-design-compare]") && (q("[data-design-compare]").checked = state.compare), q("[data-design-screen-title]").textContent = state.view === "canvas" ? design.title : screen.title, q("[data-design-stage-description]").textContent = state.view === "canvas" ? `${design.screenOrder.length} screens · ${design.frames.length} responsive ${design.frames.length === 1 ? "frame" : "frames"}${state.compare ? ` · ${readyVariants.length} directions` : ""}` : state.view === "prototype" ? "Explore the working journey" : "A guided journey through the design", q("[data-design-direction-label]").textContent = variant.label;
          let chosen = state.selectedVariant === state.variantId && state.preferences.selected.includes(state.variantId);
          q("[data-design-selected-direction]").textContent = chosen ? "Selected" : "", q("[data-design-select-direction]").disabled = chosen, q("[data-design-select-direction]").textContent = chosen ? "Selected direction" : "Use this direction";
          for (let button of qa("[data-design-rating]")) {
            let selected = Number(button.dataset.designRating) <= (state.ratings[state.variantId] ?? 0);
            button.setAttribute("aria-pressed", String(selected)), button.textContent = selected ? "★" : "☆";
          }
          document.activeElement !== q("[data-design-remix]") && (q("[data-design-remix]").value = state.remix[state.variantId] ?? ""), q("[data-design-pan]").hidden = state.view !== "canvas";
          for (let control of qa("[data-design-zoom]")) control.hidden = state.view !== "canvas";
          q("[data-design-actual-size]").hidden = state.view === "canvas", q("[data-design-actual-size]").setAttribute(
            "aria-pressed",
            String(state.inspectionScale === "actual")
          ), root.dataset.designInspectionScale = state.inspectionScale, q(".design-canvas-tools").setAttribute(
            "aria-label",
            state.view === "canvas" ? "Canvas controls" : "Screen controls"
          );
          let fitControl = q("[data-design-fit]");
          fitControl.textContent = state.view === "canvas" ? "Fit" : "Fit screen", fitControl.setAttribute(
            "aria-label",
            state.view === "canvas" ? "Fit all visible artboards" : "Fit screen"
          );
          let comparison = q("[data-design-compare]");
          comparison && (comparison.closest("label").hidden = state.view !== "canvas");
          let caption = q(".design-walkthrough-caption");
          caption.hidden = state.view !== "walkthrough", q("[data-design-step]").textContent = `Step ${design.screenOrder.indexOf(state.screenId) + 1} of ${design.screenOrder.length}`, q("[data-design-narrative-title]").textContent = screen.title, q("[data-design-narrative]").textContent = screen.description ?? design.flows?.find((flow) => flow.screens.includes(screen.id))?.title ?? design.brief?.text ?? "", q('[data-design-step-change="-1"]').disabled = requestedScreen() === design.screenOrder[0], q('[data-design-step-change="1"]').disabled = requestedScreen() === design.screenOrder.at(-1);
          for (let item of qa("[data-design-note-screen]"))
            item.dataset.active = String(item.dataset.designNoteScreen === state.screenId);
          for (let heading of sectionHeadings) heading.hidden = state.view !== "canvas";
          let visible = visibleEntries(), visibleIds = new Set(visible.map(({ artifactId }) => artifactId));
          for (let entry of entries) {
            let panel = panels.get(entry.artifactId), isVisible = visibleIds.has(entry.artifactId), outgoing = walkthroughTransition?.from === entry.artifactId;
            panel.hidden = !isVisible && !outgoing, panel.dataset.designActive = String(entry.artifactId === activeArtifactId);
            let frameElement = stage.getFrame(entry.artifactId), layer = panel.querySelector("[data-planr-annotation-layer]"), ready = stageState.status === "ready" && (!stage.frameBudget || frameElement.dataset.planrFrameState === "ready");
            if (frameElement.tabIndex = isVisible && ready && stageState.reviewMode === "interact" ? 0 : -1, layer.tabIndex = isVisible && ready && stageState.reviewMode === "comment" ? 0 : -1, layer.setAttribute("aria-disabled", String(layer.tabIndex < 0)), !isVisible && !outgoing) continue;
            let placement = boardPlacement(design, entry, {
              layout,
              compare: state.compare,
              variantId: state.variantId
            }), { x, y } = placement;
            state.view !== "canvas" && (x = 0, y = 0), panel.style.left = `${x}px`, panel.style.top = `${y}px`, panel.querySelector(".design-artboard-drag strong").textContent = placement.title;
          }
          grid.style.width = "1px", grid.style.height = "1px", surface.style.width = "100%", surface.style.height = "100%", syncCanvas(), updatePan(), renderCamera(), chrome?.update({ view: state.view, navOpen: state.navOpen, reviewOpen: stageState.railOpen }), state.view !== "canvas" && activeArtifactId && reloadFrameUsedWithComments(activeArtifactId), root.dispatchEvent(new CustomEvent("planr:design-render", { detail: clone(state) }));
        } finally {
          rendering = !1;
        }
      }
    }
    function scheduleCamera() {
      cameraFrame !== null || destroyed || (cameraFrame = requestAnimationFrame(() => {
        cameraFrame = null, renderCamera();
      }));
    }
    function renderCamera() {
      if (!stage || destroyed) return;
      if (cameraFrame !== null && (cancelAnimationFrame(cameraFrame), cameraFrame = null), readCanvasCamera(), state.view !== "canvas") {
        let frame = viewportFor(entryFor()), inset = window.innerWidth <= 680 ? 12 : 24;
        state.zoom = state.inspectionScale === "actual" ? 1 : Math.max(
          1e-3,
          Math.min(
            1,
            Math.max(1, scroll.clientWidth - inset * 2) / frame.width,
            Math.max(1, scroll.clientHeight - inset * 2) / frame.height
          )
        ), state.camera = {
          x: state.inspectionScale === "actual" ? inset : (scroll.clientWidth - frame.width * state.zoom) / 2,
          y: state.inspectionScale === "actual" ? inset : (scroll.clientHeight - frame.height * state.zoom) / 2
        }, state.inspectionScale === "actual" && (surface.style.width = `${Math.max(scroll.clientWidth, frame.width + inset * 2)}px`, surface.style.height = `${Math.max(scroll.clientHeight, frame.height + inset * 2)}px`), saveViewport();
      }
      let zoom = String(state.zoom);
      grid.style.getPropertyValue("--design-zoom") !== zoom && grid.style.setProperty("--design-zoom", zoom), state.view === "canvas" && sectionZoom !== state.zoom && syncCanvasNodes(), state.view !== "canvas" && (grid.style.transform = `translate(${state.camera.x}px, ${state.camera.y}px) scale(${state.zoom})`);
      let active = entries.find((entry) => entry.artifactId === activeArtifactId), bounds = active ? placedBoardBounds(active) : null;
      if (selectionOutline && (selectionOutline.hidden = state.view !== "canvas" || !bounds, !selectionOutline.hidden)) {
        let frame = design.frames.find((item) => item.id === active.frameId), ratio = window.devicePixelRatio || 1, pixel = (value) => Math.round(value * ratio) / ratio, x = pixel(state.camera.x + bounds.x * state.zoom), y = pixel(state.camera.y + bounds.y * state.zoom);
        selectionOutline.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`, selectionOutline.style.width = `${pixel(frame.width * state.zoom) + 6}px`, selectionOutline.style.height = `${pixel(viewportFor(active).height * state.zoom) + 6}px`;
      }
      let label = `${Math.round(state.zoom * 100)}%`, reset = q('[data-design-zoom="reset"]');
      reset.textContent !== label && (reset.textContent = label), scheduleFrameDemand(), root.dispatchEvent(
        new CustomEvent("planr:design-camera", {
          detail: { view: state.view, zoom: state.zoom, camera: { ...state.camera } }
        })
      );
    }
    function updateFramePlaceholders() {
      if (!(!stage?.frameBudget || destroyed))
        for (let [id, panel] of panels) {
          let frame = stage.getFrame(id), placeholder = panel.querySelector("[data-design-load-frame]");
          if (syncFrameGestures(frame, panel), !placeholder) continue;
          let status2 = frame.dataset.planrFrameState || "unloaded";
          placeholder.hidden = status2 === "ready", placeholder.disabled = status2 === "loading";
          let copy = status2 === "loading" ? "Loading screen…" : status2 === "error" ? "Retry screen" : "Open screen";
          placeholder.textContent !== copy && (placeholder.textContent = copy), frame.style.visibility = status2 === "ready" ? "" : "hidden";
        }
    }
    function scheduleFrameDemand() {
      if (!stage?.frameBudget || destroyed) return;
      clearTimeout(frameDemandTimer);
      let generation = frameDemandGeneration;
      frameDemandTimer = setTimeout(() => {
        if (destroyed || generation !== frameDemandGeneration || !readyReported || pendingScreen || walkthroughTransition || state.view !== "canvas" || root.dataset.sharedOpening || document.querySelector(".design-welcome[open]"))
          return;
        let box = scroll.getBoundingClientRect(), nearby = visibleEntries().map((entry) => {
          let rect2 = panels.get(entry.artifactId).getBoundingClientRect();
          return {
            id: entry.artifactId,
            visible: rect2.right > box.left && rect2.left < box.right && rect2.bottom > box.top && rect2.top < box.bottom,
            distance: Math.hypot(
              (rect2.left + rect2.right - box.left - box.right) / 2,
              (rect2.top + rect2.bottom - box.top - box.bottom) / 2
            )
          };
        }).filter((item) => item.visible).sort((a, b) => a.distance - b.distance), ids = [
          ...new Set([activeArtifactId, ...nearby.map((item) => item.id)].filter(Boolean))
        ].slice(0, stage.frameBudget), key = ids.join("|");
        key !== frameDemandKey && (frameDemandKey = key, stage.ensureFrames(ids, () => !destroyed && generation === frameDemandGeneration).then(() => {
          noteFramesUsedWithComments(), updateFramePlaceholders();
        }).catch((error) => {
          !destroyed && error.name !== "AbortError" && (frameDemandKey = "", updateFramePlaceholders());
        }));
      }, 120);
    }
    function finishWalkthroughTransition({ continueQueued = !1 } = {}) {
      let transition = walkthroughTransition, queued = continueQueued ? queuedSelection : null;
      if (queuedSelection = null, !!transition) {
        walkthroughTransition = null, cancelAnimationFrame(transition.frame), clearTimeout(transition.timeout);
        for (let animation of transition.animations ?? []) animation.cancel();
        for (let visual of transition.visuals ?? []) delete visual.dataset.designTransitionVisual;
        for (let id of [transition.from, transition.to]) {
          let panel = panels.get(id);
          panel.inert = !1, panel.removeAttribute("aria-hidden"), delete panel.dataset.designTransitionOutgoing, delete panel.dataset.designTransitionIncoming;
        }
        delete root.dataset.designTransition, render(), queued && !destroyed && selectEntry(queued.entry, queued.settings);
      }
    }
    function prepareWalkthroughTransition(entry) {
      let from = activeArtifactId, outgoing = panels.get(from), incoming = panels.get(entry.artifactId), direction = design.screenOrder.indexOf(entry.screenId) < design.screenOrder.indexOf(state.screenId) ? -1 : 1, transition = {
        from,
        to: entry.artifactId,
        direction,
        frame: null,
        timeout: null,
        animations: [],
        visuals: []
      };
      walkthroughTransition = transition, root.dataset.designTransition = "preparing", outgoing.dataset.designTransitionOutgoing = "", incoming.dataset.designTransitionIncoming = "", outgoing.contains(document.activeElement) && q(`[data-design-step-change="${direction}"]`).focus({ preventScroll: !0 }), outgoing.inert = incoming.inert = !0, outgoing.setAttribute("aria-hidden", "true");
      let finish = () => {
        walkthroughTransition === transition && finishWalkthroughTransition({ continueQueued: !0 });
      };
      transition.timeout = setTimeout(finish, 1e3), transition.frame = requestAnimationFrame(() => {
        transition.frame = requestAnimationFrame(() => {
          if (walkthroughTransition !== transition || destroyed) return;
          if (document.hidden || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || typeof incoming.animate != "function") {
            finish();
            return;
          }
          root.dataset.designTransition = "running";
          let frameVisual = incoming.querySelector(".planr-frame iframe"), annotationVisual = incoming.querySelector("[data-planr-annotation-layer]");
          transition.visuals = [frameVisual, annotationVisual].filter(Boolean);
          for (let visual of transition.visuals) visual.dataset.designTransitionVisual = "";
          let options3 = { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" };
          transition.animations = [
            frameVisual.animate(
              [
                { opacity: 0, transform: `translate3d(${direction * 12 / state.zoom}px, 0, 0)` },
                { opacity: 1, transform: "translate3d(0, 0, 0)" }
              ],
              options3
            )
          ], annotationVisual && transition.animations.push(
            annotationVisual.animate([{ opacity: 0 }, { opacity: 1 }], options3)
          ), Promise.all(transition.animations.map((animation) => animation.finished)).then(
            finish,
            () => {
            }
          );
        });
      });
    }
    function requestedSelection() {
      return pendingScreen?.entry ?? queuedSelection?.entry ?? failedSelection ?? state;
    }
    function requestedEntry(changes = {}) {
      let requested = requestedSelection();
      return entryFor(
        changes.screenId ?? requested.screenId,
        changes.variantId ?? requested.variantId,
        changes.frameId ?? requested.frameId
      );
    }
    function requestedScreen() {
      return requestedSelection().screenId;
    }
    function selectEntry(entry, { save = !0, reveal = !1, loaded = !1 } = {}) {
      if (!entry) return !1;
      if (stage.frameBudget && !loaded && (pendingScreen || !stage.getLoadedArtifactIds().includes(entry.artifactId))) {
        if (queuedSelection = null, pendingScreen?.entry.artifactId === entry.artifactId) return !0;
        clearFailedSelection();
        let request = ++screenRequest;
        pendingScreen = { entry }, root.dataset.designScreenLoading = "true";
        let ids = [...new Set([activeArtifactId, entry.artifactId].filter(Boolean))];
        return stage.ensureFrames(ids).then(() => {
          destroyed || request !== screenRequest || (pendingScreen = null, delete root.dataset.designScreenLoading, selectEntry(entry, { save, reveal, loaded: !0 }), updateFramePlaceholders());
        }).catch((error) => {
          destroyed || request !== screenRequest || error.name === "AbortError" || (pendingScreen = null, failedSelection = entry, delete root.dataset.designScreenLoading, notice(
            "This screen could not load. Select it again to retry; your review is preserved.",
            !0,
            `preview-load:${entry.artifactId}`
          ), render(), updateFramePlaceholders());
        }), !0;
      }
      clearFailedSelection();
      let sameFrame = entry.frameId === state.frameId && entry.variantId === state.variantId;
      return walkthroughTransition && state.view === "walkthrough" && sameFrame ? (queuedSelection = entry.artifactId === activeArtifactId ? null : { entry, settings: { save, reveal } }, q('[data-design-step-change="-1"]').disabled = requestedScreen() === design.screenOrder[0], q('[data-design-step-change="1"]').disabled = requestedScreen() === design.screenOrder.at(-1), !0) : (finishWalkthroughTransition(), state.view === "walkthrough" && sameFrame && readyReported && entry.artifactId !== activeArtifactId && !document.hidden && prepareWalkthroughTransition(entry), state.screenId = entry.screenId, state.frameId = entry.frameId, state.variantId = entry.variantId, activeArtifactId = entry.artifactId, stage.dispatch({ type: "set-active", artifactId: entry.artifactId }), render(), reveal && centerEntry(entry), save && (persist(), recordLocation()), !0);
    }
    function fit({ save = !0, selection = null, maxZoom = 1 } = {}) {
      if (state.inspectionScale = "fit", render(), state.view !== "canvas") {
        save && persist();
        return;
      }
      syncCanvasChrome();
      for (let attempt = 0; attempt < 12; attempt++) {
        let previousZoom = state.zoom;
        if (canvas.fit(selection ? [selection.artifactId, `label:${selection.artifactId}`] : "all", {
          padding: 36,
          maxZoom
        }), saveViewport(), renderCamera(), Math.abs(state.zoom - previousZoom) < 1e-6) break;
      }
      save && persist();
    }
    function zoomTo(value, point2 = null) {
      if (state.view !== "canvas") return;
      let rect2 = scroll.getBoundingClientRect();
      canvas.zoomAt(
        value / canvas.getCamera().zoom,
        point2 ? { x: point2.x - rect2.left, y: point2.y - rect2.top } : void 0
      ), saveViewport(), renderCamera(), persist();
    }
    async function exportArtifact(kind) {
      let artifactId = activeArtifactId;
      try {
        let blob;
        if (kind === "png") {
          let result = typeof options2.exportPng == "function" ? await options2.exportPng({ artifactId }) : await stage.getFrame(artifactId)?.__openPlanrBridge?.exportPng("screen"), dataUrl = typeof result == "string" ? result : result?.dataUrl;
          if (!dataUrl?.startsWith("data:image/png;base64,"))
            throw new Error(
              "PNG capture is unavailable. Open the local review with the artifact bridge and retry."
            );
          let bytes = Uint8Array.from(
            atob(dataUrl.split(",")[1]),
            (character) => character.charCodeAt(0)
          );
          blob = new Blob([bytes], { type: "image/png" });
        } else {
          let result = typeof options2.exportHtml == "function" ? await options2.exportHtml({ artifactId }) : null;
          if (result instanceof Blob) blob = result;
          else if (typeof result == "string")
            blob = new Blob([result], { type: "text/html;charset=utf-8" });
          else
            throw new Error(
              "Portable export is unavailable in this viewer. Use the design export utility from the project."
            );
        }
        let url = URL.createObjectURL(blob), anchor = document.createElement("a");
        anchor.href = url, anchor.download = `${design.id}-${state.screenId}.${kind === "png" ? "png" : "html"}`, anchor.click(), setTimeout(() => URL.revokeObjectURL(url), 1e3), q(".design-export").open = !1, notice(kind === "png" ? "Screen PNG exported." : "Portable HTML exported.");
      } catch (error) {
        notice(error.message, !0);
      }
    }
    function editable2(target) {
      return !!target?.closest?.('input,textarea,select,[contenteditable="true"]');
    }
    function installEvents() {
      if (listen(scroll, "focusin", (event) => {
        event.target.closest("[data-design-note]") && event.stopImmediatePropagation();
      }), listen(scroll, "keydown", (event) => {
        if (state.view === "canvas") {
          if (["Escape", " ", "Enter", "Home", "End"].includes(event.key) || event.code === "Space") {
            if (event.stopImmediatePropagation(), event.key !== "Escape" || event.defaultPrevented || event.isComposing || editable2(event.target) || event.ctrlKey || event.metaKey || event.altKey)
              return;
            if (q(".planr-more-menu:not([hidden])")) {
              q('[data-planr-action="more"]')?.click();
              return;
            }
            if (!root.dispatchEvent(new CustomEvent("planr:design-escape", { cancelable: !0 })))
              return;
            stage.getState().railOpen && (stage.dispatch({ type: "set-rail-open", railOpen: !1 }), q('[data-planr-action="feedback"]')?.focus());
            return;
          }
          canvas.handleKey(event) && event.stopPropagation();
        }
      }), listen(scroll, "gotpointercapture", (event) => {
        canvasAttached && gesture?.pointerId !== event.pointerId && canvasPointers.add(event.pointerId);
      }), listen(root, "planr:design-camera", scheduleViewContext), listen(root, "planr:design-inspection-change", (event) => {
        let { screenId, frameId, variantId, planrId } = event.detail;
        screenId !== state.screenId || frameId !== state.frameId || variantId !== state.variantId || (inspectedSelection = { artifactId: activeArtifactId, planrId }, scheduleViewContext());
      }), listen(window, "message", (event) => {
        if (event.origin !== "null" || !["openplanr:design-size", "openplanr:design-size-error"].includes(event.data?.type))
          return;
        let entry = entries.find(
          ({ artifactId }) => stage.getFrame(artifactId)?.contentWindow === event.source
        );
        if (!entry) return;
        let frame = design.frames.find(({ id }) => id === entry.frameId);
        if (frame.height !== "auto") return;
        if (event.data.type === "openplanr:design-size-error") {
          notice(`Could not measure ${entry.screenId}: ${event.data.message}`, !0);
          return;
        }
        let { screenId, width, height } = event.data;
        if (screenId !== entry.screenId || width !== frame.width || !Number.isInteger(height) || height < 1 || height > 16384)
          return;
        let viewport = viewportFor(entry);
        viewport.height !== height && (viewport.height = height, panels.get(entry.artifactId).style.setProperty("--planr-artifact-height", `${height}px`), render());
      }), listen(root, "planr:artifact-viewport-zoom", (event) => {
        if (state.view !== "canvas") return;
        let entry = entries.find((item) => stage.getFrame(item.artifactId) === event.target);
        if (!entry || panels.get(entry.artifactId)?.hidden) return;
        let { x, y, deltaY } = event.detail, frame = design.frames.find((item) => item.id === entry.frameId), rect2 = event.target.getBoundingClientRect();
        chrome?.update({ exportMenuOpen: !1 }), zoomTo(
          canvas.getCamera().zoom * clamp2(Math.exp(-deltaY * 0.01), 0.8, 1.25),
          {
            x: rect2.left + x * rect2.width / frame.width,
            y: rect2.top + y * rect2.height / viewportFor(entry).height
          },
          { scheduled: !0 }
        );
      }), listen(root, "planr:artifact-viewport-pan", (event) => {
        if (state.view !== "canvas") return;
        let entry = entries.find((item) => stage.getFrame(item.artifactId) === event.target);
        !entry || panels.get(entry.artifactId)?.hidden || (chrome?.update({ exportMenuOpen: !1 }), canvas.panBy(event.detail.deltaX, event.detail.deltaY), saveViewport(), scheduleCamera(), persist());
      }), listen(
        root,
        "click",
        (event) => {
          let button = event.target.closest('[data-planr-mode],[data-planr-action="add-comment"]');
          !button || button.disabled || setTool(button.dataset.planrMode === "interact" ? "interact" : "annotate");
        },
        !0
      ), listen(
        document,
        "keydown",
        (event) => {
          if (editable2(event.target) || event.altKey || event.ctrlKey || event.metaKey || document.querySelector("dialog[open],[role=dialog][data-state=open]"))
            return;
          let key = event.key.toLowerCase();
          if (["i", "c", "h"].includes(key)) {
            if (key === "h" && state.view !== "canvas") return;
            event.preventDefault(), setTool({ i: "interact", c: "annotate", h: "pan" }[key]);
          } else event.key === "Escape" && (panEnabled || spacePan || gesture || activeTool === "inspect") && !q("[data-design-notes][open]") && !q("[data-planr-annotation-composer]") && (event.preventDefault(), setTool("interact"), event.stopPropagation(), q('[data-planr-mode="interact"]').focus());
        },
        !0
      ), typeof ResizeObserver == "function") {
        let observer = new ResizeObserver(() => {
          state.view !== "canvas" && root.dataset.designRestoring !== "true" && fit({ save: !1 }), syncCanvasChrome(), updateDesignNotes(), scheduleViewContext();
        });
        for (let selector of [
          ".design-toolbar",
          ".design-canvas-tools",
          ".design-stage-context",
          ".design-navigator",
          ".planr-review-rail"
        ])
          observer.observe(q(selector));
        observer.observe(scroll), cleanup.push(() => observer.disconnect());
      }
      let notes = q("[data-design-notes]");
      listen(notes?.querySelector(":scope > summary"), "click", (event) => {
        event.preventDefault(), notes.open ? closeDesignNotes() : (notesReturnFocus = event.currentTarget, notes.open = !0, updateDesignNotes());
      }), listen(notes, "toggle", updateDesignNotes), listen(
        document,
        "pointerdown",
        (event) => {
          notes?.open && !notes.contains(event.target) && !event.target.closest?.("[data-design-note]") && closeDesignNotes();
        },
        !0
      ), listen(
        document,
        "keydown",
        (event) => {
          event.key === "Escape" && notes?.open && (event.preventDefault(), event.stopPropagation(), closeDesignNotes({ restoreFocus: !0 }));
        },
        !0
      ), listen(root, "click", (event) => {
        let button = event.target.closest("button");
        if (button)
          if (button.dataset.designLoadFrame)
            selectEntry(
              entries.find((item) => item.artifactId === button.dataset.designLoadFrame),
              { reveal: !0 }
            );
          else if (button.hasAttribute("data-design-actual-size"))
            state.inspectionScale = "actual", render(), persist();
          else if (button.hasAttribute("data-design-focus"))
            state.navOpen = !1, state.reviewOpen = !1, stage.dispatch({ type: "set-rail-open", railOpen: !1 }), state.view === "canvas" && switchView("prototype"), render(), persist();
          else if (button.dataset.designView)
            switchView(button.dataset.designView);
          else if (button.hasAttribute("data-design-toggle-nav"))
            state.navOpen = !state.navOpen, !state.navOpen && button.closest(".design-navigator") && q(".design-toolbar [data-design-toggle-nav]").focus(), render(), persist();
          else if (button.dataset.designScreen)
            selectEntry(requestedEntry({ screenId: button.dataset.designScreen }), {
              reveal: state.view === "canvas"
            });
          else if (button.dataset.designNote)
            openDesignNote(button.dataset.designNote, button);
          else if (button.hasAttribute("data-design-close-notes"))
            closeDesignNotes({ restoreFocus: !0 });
          else if (button.hasAttribute("data-design-fit")) fit();
          else if (button.dataset.designZoom)
            zoomTo(
              button.dataset.designZoom === "reset" ? 1 : state.zoom * (button.dataset.designZoom === "in" ? 1.2 : 1 / 1.2)
            );
          else if (button.hasAttribute("data-design-pan")) {
            if (state.view !== "canvas") return;
            setTool(activeTool === "pan" ? "interact" : "pan");
          } else if (button.dataset.designStepChange) {
            let index2 = clamp2(
              design.screenOrder.indexOf(requestedScreen()) + Number(button.dataset.designStepChange),
              0,
              design.screenOrder.length - 1
            );
            selectEntry(requestedEntry({ screenId: design.screenOrder[index2] }));
          } else if (button.dataset.designRating) {
            let rating = Number(button.dataset.designRating);
            state.ratings[state.variantId] = rating, rating <= 2 ? state.preferences.rejected = [
              .../* @__PURE__ */ new Set([...state.preferences.rejected, state.variantId])
            ] : state.preferences.rejected = state.preferences.rejected.filter(
              (id) => id !== state.variantId
            ), render(), persist({ content: !0 });
          } else button.hasAttribute("data-design-select-direction") ? (state.selectedVariant = state.variantId, state.preferences.selected = [.../* @__PURE__ */ new Set([...state.preferences.selected, state.variantId])], state.preferences.rejected = state.preferences.rejected.filter(
            (id) => id !== state.variantId
          ), render(), persist({ content: !0 })) : button.hasAttribute("data-design-save-remix") ? (state.remix[state.variantId] = q("[data-design-remix]").value.trim(), persist({ content: !0 }), notice("Refinement note saved for the next design iteration.")) : button.dataset.designExport && exportArtifact(button.dataset.designExport);
      }), listen(
        q("[data-design-variant]"),
        "change",
        (event) => selectEntry(requestedEntry({ variantId: event.target.value }))
      ), listen(q("[data-design-frame]"), "change", (event) => {
        selectEntry(requestedEntry({ frameId: event.target.value }), {
          reveal: state.view === "canvas"
        });
      }), listen(q("[data-design-compare]"), "change", (event) => {
        state.compare = event.target.checked, render(), persist();
      }), listen(root, "planr:stage-change", (event) => {
        let next = event.detail;
        !changingTool && next.reviewMode !== previousReviewMode && setTool(next.reviewMode === "comment" ? "annotate" : "interact");
        let reviewChanged = typeof next.railOpen == "boolean" && next.railOpen !== state.reviewOpen;
        reviewChanged && (state.reviewOpen = next.railOpen);
        let entry = entries.find(({ artifactId }) => artifactId === next.activeArtifactId);
        entry && entry.artifactId !== activeArtifactId && (stage.frameBudget && !stage.getLoadedArtifactIds().includes(entry.artifactId) ? selectEntry(entry, { save: !1 }) : (finishWalkthroughTransition(), activeArtifactId = entry.artifactId, state.screenId = entry.screenId, state.frameId = entry.frameId, state.variantId = entry.variantId)), next.zoom !== previousStageZoom && (state.zoom = clamp2(next.zoom / 100, 0.05, 2), canvasAttached && applyCanvasCamera(), previousStageZoom = next.zoom, saveViewport()), render(), reviewChanged && persist();
      }), listen(root, "planr:artifact-review-change", (event) => {
        latestReview = clone(event.detail), reviewDirty = !0, scheduleViewContext(), reviewSerial += 1, status("Saving comments", "saving"), storeReviewDraft(), clearTimeout(reviewTimer), reviewTimer = setTimeout(flushReview, 180);
      }), listen(
        root,
        "pointerdown",
        (event) => {
          let panel = event.target.closest(".planr-artifact-panel");
          event.button === 0 && panel && !panEnabled && !spacePan && !event.target.closest("[data-design-note]") && selectEntry(
            entries.find(({ artifactId }) => artifactId === panel.dataset.artifactId),
            { save: !1 }
          );
        },
        !0
      ), listen(scroll, "pointerdown", (event) => {
        if (state.view !== "canvas" || root.dataset.designInspect === "true" || event.button !== 0 && event.button !== 1) return;
        let label = event.target.closest("[data-design-drag]");
        if (!(event.button === 0 && state.view === "canvas" && label && !panEnabled && !spacePan)) return;
        event.preventDefault();
        let panel = label?.closest(".planr-artifact-panel"), entry = entries.find((item) => item.artifactId === panel.dataset.artifactId), bounds = placedBoardBounds(entry);
        bounds && (gesture = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          mode: "artboard",
          artifactId: panel.dataset.artifactId,
          left: bounds.x,
          top: bounds.y,
          before: clone(layout)
        }, scroll.setPointerCapture?.(event.pointerId), updatePan());
      }), listen(scroll, "pointermove", (event) => {
        if (!gesture || gesture.pointerId !== event.pointerId) return;
        let dx = event.clientX - gesture.x, dy = event.clientY - gesture.y, entry = entries.find((item) => item.artifactId === gesture.artifactId), key = boardKey(entry), point2 = {
          x: Math.round(clamp2(gesture.left + dx / state.zoom, -1e7, 1e7)),
          y: Math.round(clamp2(gesture.top + dy / state.zoom, -1e7, 1e7))
        };
        layout.boards = { ...layout.boards, [key]: { ...layout.boards?.[key], ...point2 } };
        let panel = panels.get(gesture.artifactId);
        layoutDragDirty = point2.x !== gesture.left || point2.y !== gesture.top, layoutDragDirty && status("Moving board", "saving"), panel.style.left = `${point2.x}px`, panel.style.top = `${point2.y}px`, syncCanvasNodes(), scheduleCamera();
      });
      for (let eventName of ["pointerup", "pointercancel", "lostpointercapture"])
        listen(scroll, eventName, (event) => {
          canvasPointers.delete(event.pointerId), !(!gesture || gesture.pointerId !== event.pointerId) && (eventName === "pointerup" ? finishGesture() : releaseTemporaryPan());
        });
      listen(
        document,
        "keydown",
        (event) => {
          if (!editable2(event.target) && state.view === "canvas" && event.code === "Space" && !event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.altKey && !document.querySelector("dialog[open],[role=dialog][data-state=open]") && !event.target.closest("button,[data-planr-annotation-layer]")) {
            if (event.preventDefault(), event.stopPropagation(), event.repeat) return;
            let previous = activeTool;
            setTool("pan"), panEnabled = !1, spacePan = !0, spaceReturnTool = previous, updatePan();
          }
        },
        !0
      ), listen(document, "keydown", (event) => {
        if (editable2(event.target)) return;
        if (state.view === "canvas" && !event.defaultPrevented && !event.altKey && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !document.querySelector("dialog[open],[role=dialog][data-state=open]")) {
          event.preventDefault(), restoreMove(event.shiftKey);
          return;
        }
        let label = event.target.closest("[data-design-drag]");
        if (label && state.view === "canvas" && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault();
          let panel = label.closest(".planr-artifact-panel"), distance = event.shiftKey ? 40 : 8, entry = entries.find((item) => item.artifactId === panel.dataset.artifactId), bounds = placedBoardBounds(entry);
          if (!bounds) return;
          let key = boardKey(entry), before = clone(layout), point2 = {
            x: Math.round(
              clamp2(
                bounds.x + (event.key === "ArrowRight" ? distance : event.key === "ArrowLeft" ? -distance : 0),
                -1e7,
                1e7
              )
            ),
            y: Math.round(
              clamp2(
                bounds.y + (event.key === "ArrowDown" ? distance : event.key === "ArrowUp" ? -distance : 0),
                -1e7,
                1e7
              )
            )
          };
          layout.boards = { ...layout.boards, [key]: { ...layout.boards?.[key], ...point2 } }, render(), completeMove(entry, before);
        } else if (state.view === "walkthrough" && ["ArrowLeft", "ArrowRight"].includes(event.key) && !event.target.closest('button,[role="radio"]')) {
          event.preventDefault();
          let index2 = clamp2(
            design.screenOrder.indexOf(requestedScreen()) + (event.key === "ArrowRight" ? 1 : -1),
            0,
            design.screenOrder.length - 1
          );
          selectEntry(requestedEntry({ screenId: design.screenOrder[index2] }));
        }
      }), listen(document, "keyup", (event) => {
        event.code === "Space" && releaseTemporaryPan();
      }), listen(window, "blur", () => {
        releaseTemporaryPan(), document.activeElement?.tagName === "IFRAME" && closeDesignNotes();
      }), listen(document, "visibilitychange", () => {
        document.hidden && (releaseTemporaryPan(), finishWalkthroughTransition());
      }), listen(
        window.matchMedia?.("(prefers-reduced-motion: reduce)"),
        "change",
        () => finishWalkthroughTransition()
      ), listen(window, "resize", () => {
        let compact = window.innerWidth <= 960;
        compact && !compactViewport && (state.navOpen = !1, state.reviewOpen = !1, stage.dispatch({ type: "set-rail-open", railOpen: !1 }), persist()), compactViewport = compact, render(), state.view !== "canvas" && root.dataset.designRestoring !== "true" && fit({ save: !1 }), updateDesignNotes();
      }), listen(window, "online", () => {
        (dirty || reviewDirty || layoutOperations.length) && flush(), viewContextSignature = null, scheduleViewContext();
      }), listen(window, "beforeunload", (event) => {
        clearTimeout(frameDemandTimer), frameDemandGeneration += 1, frameDemandKey = "", storeDraft(), storeReviewDraft(), (contentDirty || reviewDirty || layoutOperations.length) && (options2.stateUrl || options2.saveState || options2.layoutUrl || options2.saveLayout || reviewUrl()) && (event.preventDefault(), event.returnValue = "");
      }), listen(window, "message", (event) => {
        if (event.origin !== "null" || !["openplanr:design-navigate", "navigate"].includes(event.data?.type) || typeof event.data.screenId != "string")
          return;
        let source = entries.find(
          ({ artifactId }) => stage.getFrame(artifactId)?.contentWindow === event.source
        );
        if (!source || !design.screenOrder.includes(event.data.screenId)) return;
        let nonce = stage.getFrame(source.artifactId)?.__openPlanrBridge?.getPrototypeNonce?.();
        nonce && (event.data.type === "navigate" && (event.data.channel !== nonce || event.data.viewId !== source.artifactId || event.data.schemaVersion !== "1.0.0") || state.view !== "canvas" && (source.artifactId !== activeArtifactId || walkthroughTransition) || (chrome?.update({ exportMenuOpen: !1 }), selectEntry(entryFor(event.data.screenId, source.variantId, source.frameId))));
      });
    }
    async function refreshSavedState() {
      if (options2.stateUrl)
        try {
          let observedRevision = revision, result = await jsonRequest(options2.stateUrl);
          if (destroyed) return;
          observedRevision === revision && result.revision !== void 0 && result.revision !== revision && await rebaseLayout({ announce: !1, expectedRevision: observedRevision }), result.stateVersion !== void 0 && (stateVersion = result.stateVersion), legacyServerPositions = result.state?.positions ?? legacyServerPositions, result.state && !dirty && (state = normalizeState({ ...result.state, ...linkedState() }), canvasAttached && state.view === "canvas" && applyCanvasCamera(), compactViewport && (state.navOpen = !1, state.reviewOpen = !1), stage.dispatch({ type: "set-rail-open", railOpen: state.reviewOpen })), savedDraft?.unsaved && notice(
            "A previous unsaved draft is available in this browser. The saved review is shown; your draft has not overwritten it.",
            !0
          ), selectEntry(entryFor(), { save: !1 }), layoutOperations.length || status("All changes saved");
        } catch {
          status("Disconnected · local draft", "disconnected");
        }
    }
    function renderVerification(verification) {
      q("[data-design-verification]").textContent = verification === "verified" ? "Browser inspection complete" : verification === "failed" ? "Browser inspection failed" : "Browser inspection pending";
    }
    async function pollRevision() {
      if (!(!options2.statusUrl || destroyed || sessionLost)) {
        try {
          let observedRevision = revision, result = await jsonRequest(options2.statusUrl);
          if (destroyed) return;
          if (typeof result.verification == "string" && renderVerification(result.verification), observedRevision === revision && result.revision !== void 0 && revision !== null && result.revision !== revision)
            if (contentDirty || reviewDirty || layoutOperations.length || layoutSaving)
              newRevisionNotice();
            else {
              storeDraft(), window.location.reload();
              return;
            }
          result.status === "failed" && notice(
            result.message ?? "The new revision failed. This working design remains available.",
            !0
          );
        } catch (error) {
          error.statusCode === 404 ? studioRestarted() : !dirty && !hasPendingLayout() && status("Disconnected", "disconnected");
        }
        pollTimer = setTimeout(pollRevision, 4e3);
      }
    }
    async function reportReady() {
      if (!(!startupSettled || readyReported || readyReporting || destroyed)) {
        readyReporting = !0;
        try {
          let requiredEntries = [entryFor()];
          if (await stage.ensureFrames(requiredEntries.map((entry) => entry.artifactId)), destroyed) return;
          let loaded = requiredEntries.filter(({ artifactId }) => {
            let frame = stage.getFrame(artifactId);
            return (frame?.src?.startsWith("blob:") || !!frame?.srcdoc) && frame.dataset.planrFrameState === "ready" && frame.dataset.planrArtifactDigest && (!frame.__openPlanrBridge || frame.dataset.planrBridgeTrusted === "true");
          });
          if (loaded.length !== requiredEntries.length) throw new Error("Preview bridge is not ready.");
          if (readyReported = !0, render(), await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))), destroyed) return;
          root.dataset.designReady = "true", root.dataset.sharedOpening || delete document.documentElement.dataset.designOpening, chrome?.update({ previewLabel: "Preview ready" }), chrome || (q("[data-design-preview-state]").textContent = "Preview ready"), !contentDirty && !reviewDirty && !layoutOperations.length && (!options2.stateUrl || stateVersion !== null) && status(options2.stateUrl ? "All changes saved" : "Local preview");
          let detail = {
            revision,
            status: "ready",
            artifacts: loaded.map((entry) => entry.artifactId)
          };
          if (root.dispatchEvent(new CustomEvent("planr:design-ready", { bubbles: !0, detail })), typeof options2.onReady == "function" && await options2.onReady(detail), options2.readyUrl)
            try {
              await jsonRequest(options2.readyUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(detail)
              });
            } catch {
              status("Server disconnected · local draft", "disconnected");
            }
        } catch {
          if (destroyed) return;
          delete document.documentElement.dataset.designOpening, chrome?.update({ previewLabel: "Preview unavailable" }), chrome || (q("[data-design-preview-state]").textContent = "Preview unavailable"), notice(
            "This preview could not load. Use Retry screen; your saved feedback remains available.",
            !0
          );
        } finally {
          readyReporting = !1;
        }
      }
    }
    function mount() {
      if (stage = artifactStage, !stage)
        return status("Review runtime unavailable", "failed"), null;
      root = q(".planr-shell");
      let structuralStyle = document.createElement("style");
      structuralStyle.textContent = styles_default, document.head.prepend(structuralStyle), cleanup.push(() => structuralStyle.remove()), cleanup.push(
        canvas.on("camera", () => {
          if (!canvasAttached || state.view !== "canvas") return;
          let previous = state.viewports.canvas;
          saveViewport(), renderCamera();
          let next = state.viewports.canvas;
          (previous?.x !== next.x || previous?.y !== next.y || previous?.zoom !== next.zoom) && persist();
        })
      ), chrome = mountDesignChrome({ root, title: design.title, state }), hasPendingLayout() && status("Recovering layout", "saving"), chrome && cleanup.push(() => chrome.destroy()), previousReviewMode = stage.getState().reviewMode, activeTool = previousReviewMode === "comment" ? "annotate" : "interact", scroll = q(".planr-stage-scroll"), surface = q(".planr-stage-surface"), grid = q(".planr-frame-grid"), selectionOutline = document.createElement("div"), selectionOutline.className = "design-selection-outline", selectionOutline.setAttribute("aria-hidden", "true"), selectionOutline.hidden = !0, scroll.append(selectionOutline);
      for (let section of layout.sections ?? []) {
        let heading = document.createElement("div");
        heading.className = "design-section-heading", heading.setAttribute("role", "heading"), heading.setAttribute("aria-level", "2"), heading.textContent = section.text, heading.style.left = `${section.x}px`, heading.style.top = `${section.y}px`, section.maxW && (heading.style.maxWidth = `${section.maxW}px`), grid.append(heading), sectionHeadings.push(heading);
      }
      for (let entry of entries) {
        let panel = stage.getPanel(entry.artifactId);
        if (!panel)
          return status("Missing design preview", "failed"), null;
        panels.set(entry.artifactId, panel);
        let nodeId = panel.getAttribute("data-canvas-node-id");
        panel.dataset.canvasNodeId = entry.artifactId, cleanup.push(() => {
          nodeId === null ? panel.removeAttribute("data-canvas-node-id") : panel.setAttribute("data-canvas-node-id", nodeId);
        });
        let screen = design.screens.find(({ id }) => id === entry.screenId), variant = design.variants.find(({ id }) => id === entry.variantId), frame = design.frames.find(({ id }) => id === entry.frameId), iframe = stage.getFrame(entry.artifactId), syncGestures = () => syncFrameGestures(iframe, panel);
        if (listen(iframe, "planr:artifact-bridge-ready", syncGestures), listen(iframe, "load", syncGestures), frame.height === "auto") {
          let measure = () => iframe.contentWindow?.postMessage({ type: "openplanr:design-measure" }, "*");
          listen(iframe, "planr:artifact-bridge-ready", measure), listen(iframe, "load", measure), measure();
        }
        let label = document.createElement("div");
        label.className = "design-artboard-label", label.setAttribute("role", "group");
        let drag = document.createElement("button");
        drag.type = "button", drag.className = "design-artboard-drag", drag.dataset.designDrag = entry.artifactId, drag.setAttribute(
          "aria-label",
          `Move ${screen.title}, ${variant.label}, ${frame.label}. Use arrow keys to arrange.`
        );
        let title = document.createElement("strong");
        title.textContent = `${screen.title}${readyVariants.length > 1 ? ` / ${variant.label}` : ""}`;
        let size4 = document.createElement("span");
        if (size4.textContent = designFrameLabel(frame), drag.append(title, size4), label.append(drag), screen.description) {
          let note = document.createElement("button");
          note.type = "button", note.className = "design-artboard-note", note.dataset.designNote = screen.id, note.setAttribute("aria-controls", "design-guidance-panel"), note.setAttribute("aria-expanded", "false"), note.title = screen.description, note.setAttribute("aria-label", `Open design notes for ${screen.title}`), note.textContent = "i", label.append(note);
        }
        if (panel.prepend(label), stage.frameBudget) {
          let load = document.createElement("button");
          load.type = "button", load.className = "design-frame-placeholder", load.dataset.designLoadFrame = entry.artifactId, load.setAttribute("aria-label", `Open screen: ${screen.title}, ${frame.label}`), load.textContent = "Open screen", panel.querySelector(".planr-frame").append(load);
        }
      }
      renderVerification(payload.verification?.status);
      let prototypeState = createPrototypeStateRelay({
        contextId: `${design.id}:${payload.revision ?? payload.reviewOf ?? "local"}`,
        parentWindow: window,
        frames: () => entries.map((entry) => ({
          screenId: entry.screenId,
          viewId: entry.artifactId,
          window: stage.getFrame(entry.artifactId)?.contentWindow ?? null,
          nonce: stage.getFrame(entry.artifactId)?.__openPlanrBridge?.getPrototypeNonce?.() ?? null,
          generation: stage.getFrame(entry.artifactId)?.__openPlanrBridge?.getPrototypeGeneration?.(),
          aliases: options2.prototypeStateAliases?.[entry.screenId]
        }))
      });
      cleanup.push(() => prototypeState.dispose()), installEvents(), listen(q("[data-design-dismiss-notice]"), "click", () => {
        activeNotice?.persistent && dismissedNotices.set(activeNotice.key, activeNotice.message), hideNotice();
      });
      function previewHealth() {
        for (let entry of entries) {
          let frame = stage.getFrame(entry.artifactId), nonce = frame?.__openPlanrBridge?.getPrototypeNonce?.() ?? null;
          nonce && prototypeState.restore({
            screenId: entry.screenId,
            viewId: entry.artifactId,
            window: frame.contentWindow,
            nonce,
            generation: frame.__openPlanrBridge?.getPrototypeGeneration?.(),
            aliases: options2.prototypeStateAliases?.[entry.screenId]
          });
        }
        let selected = stage.getFrameDiagnostics?.().find((item) => item.artifactId === activeArtifactId), node = q("[data-design-preview-state]"), phase = selected?.status ?? stage.getState().status, previewLabel = phase === "ready" ? "Preview ready" : phase === "error" || phase === "invalid" ? "Preview unavailable" : "Loading preview";
        chrome ? chrome.update({ previewLabel }) : node.textContent = previewLabel, node.dataset.status = phase, selected && (node.title = `${selected.phase} · ${Math.round(selected.elapsedMs ?? 0)} ms${selected.code ? ` · ${selected.code}` : ""}`), !readyReported && phase === "ready" && reportReady();
      }
      listen(root, "planr:artifact-frame-state", previewHealth), listen(root, "planr:artifact-state", previewHealth), previewHealth();
      let search = q("[data-design-screen-search]"), group = q("[data-design-screen-group]");
      function filterScreens() {
        let term = search.value.trim().toLocaleLowerCase(), flow = design.flows?.find((item) => item.id === group?.value), count3 = 0;
        for (let button of qa("[data-design-screen]"))
          button.hidden = !(button.textContent.toLocaleLowerCase().includes(term) && (!flow || flow.screens.includes(button.dataset.designScreen))), button.hidden || count3++;
        q("[data-design-search-empty]").hidden = count3 > 0;
      }
      listen(search, "input", filterScreens), listen(group, "change", filterScreens);
      function followLocation() {
        let next = normalizeState({ ...state, ...linkedState() });
        next.view !== state.view && switchView(next.view, { save: !1 }), selectEntry(entryFor(next.screenId, next.variantId, next.frameId), { save: !1 });
      }
      if (listen(window, "popstate", followLocation), listen(window, "hashchange", followLocation), stage.frameBudget && (listen(root, "planr:artifact-frame-state", updateFramePlaceholders), updateFramePlaceholders()), compactViewport = window.innerWidth <= 960, compactViewport ? (state.navOpen = !1, state.reviewOpen = !1, stage.dispatch({ type: "set-rail-open", railOpen: !1 })) : stage.dispatch({ type: "set-rail-open", railOpen: state.reviewOpen }), selectEntry(entryFor(), { save: !1 }), !reviewUrl() && !stage.review.getState().review)
        try {
          let storedReview = JSON.parse(localStorage.getItem(`${storageKey}.review`) ?? "null");
          storedReview?.review && stage.review.replaceReview(storedReview.review);
        } catch {
        }
      let panelDialogs = mountDesignPanels({
        root,
        closePanel(side) {
          side === "left" ? state.navOpen = !1 : (state.reviewOpen = !1, stage.dispatch({ type: "set-rail-open", railOpen: !1 })), render(), persist(), q(
            side === "left" ? ".design-toolbar [data-design-toggle-nav]" : ".design-toolbar [data-planr-action=feedback]"
          )?.focus();
        }
      });
      cleanup.push(() => panelDialogs.destroy());
      let controller = Object.freeze({
        setTool,
        getTool: () => activeTool,
        getState: () => (readCanvasCamera(), clone(state)),
        getLayout: () => clone(layout),
        getViewport: (artifactId) => ({
          ...viewportFor(entries.find((entry) => entry.artifactId === artifactId))
        }),
        getRevision: () => revision,
        getSaveState: () => ({
          dirty: contentDirty || reviewDirty || hasPendingLayout(),
          personalPending: dirty && !contentDirty,
          commentsPending: reviewDirty,
          revision,
          stateVersion
        }),
        selectScreen: (screenId) => selectEntry(requestedEntry({ screenId })),
        selectEntry: (entry) => selectEntry(entry),
        fitSelection: ({ save = !0 } = {}) => fit({ selection: entryFor(), save }),
        setCamera(camera) {
          state.view === "canvas" && (!Number.isFinite(camera?.x) || !Number.isFinite(camera?.y) || (state.camera = { x: clamp2(camera.x, -1e7, 1e7), y: clamp2(camera.y, -1e7, 1e7) }, Number.isFinite(camera.zoom) && (state.zoom = clamp2(camera.zoom, 0.05, 2)), applyCanvasCamera(), saveViewport(), renderCamera(), persist()));
        },
        setPanels({ navOpen = state.navOpen, reviewOpen = state.reviewOpen }, { save = !0 } = {}) {
          state.navOpen = !!navOpen, state.reviewOpen = !!reviewOpen, stage.dispatch({ type: "set-rail-open", railOpen: state.reviewOpen }), render(), save && persist();
        },
        restorePresentation(snapshot) {
          finishWalkthroughTransition();
          let personal = {};
          for (let key of [
            "view",
            "screenId",
            "frameId",
            "variantId",
            "compare",
            "navOpen",
            "reviewOpen",
            "inspectionScale",
            "zoom",
            "camera",
            "viewports"
          ])
            snapshot[key] !== void 0 && (personal[key] = clone(snapshot[key]));
          state = normalizeState({ ...state, ...personal }), canvasAttached && state.view === "canvas" && applyCanvasCamera(), stage.dispatch({ type: "set-rail-open", railOpen: state.reviewOpen }), selectEntry(entryFor(), { save: !1 }), render(), persist();
        },
        setView(view) {
          switchView(view);
        },
        fit,
        flush,
        exportArtifact,
        destroy() {
          if (!destroyed) {
            finishWalkthroughTransition(), root.dispatchEvent(new CustomEvent("planr:design-destroy"));
            for (let { artifactId } of entries)
              stage.getFrame(artifactId)?.__openPlanrBridge?.setViewportGestures?.(!1);
            destroyed = !0, canvasAttached = !1, canvas.destroy(), ++screenRequest, pendingScreen = null, failedSelection = null, clearTimeout(frameDemandTimer), clearTimeout(saveTimer), clearTimeout(reviewTimer), clearTimeout(pollTimer), clearTimeout(noticeTimer), clearTimeout(viewContextTimer), cameraFrame !== null && cancelAnimationFrame(cameraFrame);
            for (let heading of sectionHeadings) heading.remove();
            selectionOutline?.remove();
            for (let remove of cleanup.splice(0)) remove();
          }
        }
      });
      return refreshSavedState().then(async () => (restorePendingLayout(), migrateLegacyPositions(), await flushLayout(), startupSettled = !0, reportReady())), pollTimer = setTimeout(pollRevision, 4e3), controller;
    }
    return mount();
  }

  // lib/design/ui/studio-runtime.mjs
  var PAYLOAD_ID = "planr-design-studio-payload", STAGE_TIMEOUT_MS = 15e3;
  function documentReady() {
    return document.readyState !== "loading" ? Promise.resolve() : new Promise((resolve) => {
      document.addEventListener("DOMContentLoaded", resolve, { once: !0 });
    });
  }
  function stageBefore(deadline) {
    let timer, timeout = new Promise((resolve) => {
      timer = setTimeout(resolve, Math.max(0, deadline - Date.now()), null);
    });
    return Promise.race([whenArtifactStage(window), timeout]).finally(() => clearTimeout(timer));
  }
  async function start(payloadNode2, payload, deadline) {
    let current = () => document.getElementById(PAYLOAD_ID) === payloadNode2;
    if (await documentReady(), !current()) return;
    let stage = await stageBefore(deadline);
    if (!current()) return;
    let studio = mountDesignStudio({ payload, stage });
    if (!studio) return;
    window.__openPlanrDesignStudio = studio;
    let { experience, handoffCenter } = mountDesignEnhancements({ payload, studio, stage });
    window.__openPlanrDesignExperience = experience, handoffCenter && (window.__openPlanrDesignHandoffCenter = handoffCenter);
  }
  var script = document.currentScript, payloadNode = document.getElementById(PAYLOAD_ID);
  (!script || script.isConnected) && payloadNode && start(payloadNode, JSON.parse(payloadNode.textContent), Date.now() + STAGE_TIMEOUT_MS);