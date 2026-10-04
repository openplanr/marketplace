#!/usr/bin/env node
import {
  exportDesignReview,
  listArtifactReviewServers,
  resolveDesignPins,
  saveDesignState,
  serializeDesignReviewExport,
  startDesignReview,
  stopArtifactReviewServer
} from "./design-review.mjs";
import {
  readDesignFeedback,
  readDesignHandoff,
  updateDesignHandoff
} from "./design-handoff.mjs";
import {
  inspectDesignDocument,
  prepareDesignDocument,
  renderDesignDocument,
  standaloneDesignHtml
} from "./design-document.mjs";
import "./design-artifact-shell.mjs";
import "./design-sandbox-guards.mjs";
import {
  ARTIFACT_REVIEW_MAX_STATE_BYTES,
  createReviewLedger,
  decodeArtifactReviewSources,
  exportDesignShareRecovery,
  importDesignShareRecovery,
  manageDesignShare,
  mergeReviewLedger,
  normalizeArtifactReview,
  publishDesignShare,
  readArtifactReviewState,
  resolveArtifactReviewDestination,
  shareDesign,
  syncDesignShare,
  withArtifactReviewLock,
  writeArtifactReviewState
} from "./design-share.mjs";
import {
  atomicJson,
  currentDesign,
  hash,
  listDesignRevisions,
  readDesignRevision,
  readJson
} from "./design-escape.mjs";
import "./design-pako-esm.mjs";
import {
  acquireStartLock
} from "./design-planr-home.mjs";
import "./design-parse5-parser.mjs";
import "./design-parse5-tokenizer.mjs";
import "./design-entities.mjs";
import {
  ARTIFACT_ERROR_CODES,
  PipelineError,
  digestArtifactEnvelope
} from "./design-artifact-sources.mjs";
import "./design-bounded-json-data.mjs";

// packages/design/lib/design/utility.mjs
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join as join3, resolve as resolve2 } from "node:path";
import { fileURLToPath } from "node:url";

// packages/design/lib/design/feedback-import.mjs
import { closeSync, constants, fstatSync, openSync, readSync } from "node:fs";
import { join, resolve } from "node:path";
function invalid(message, code = ARTIFACT_ERROR_CODES.REVIEW_IMPORT) {
  throw new PipelineError(code, message);
}
function readDesignFeedbackImport(input) {
  if (typeof input !== "string" || !input.trim()) invalid("Feedback import requires a JSON file.");
  let fd;
  try {
    fd = openSync(resolve(input), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const stat = fstatSync(fd);
    if (!stat.isFile()) invalid("Feedback import must be a regular JSON file.");
    if (stat.size > ARTIFACT_REVIEW_MAX_STATE_BYTES)
      invalid("Feedback import exceeds the 5 MB limit.", ARTIFACT_ERROR_CODES.REQUEST_LIMIT);
    const bytes = Buffer.alloc(ARTIFACT_REVIEW_MAX_STATE_BYTES + 1);
    let size = 0;
    while (size < bytes.length) {
      const read = readSync(fd, bytes, size, bytes.length - size, null);
      if (!read) break;
      size += read;
    }
    if (size > ARTIFACT_REVIEW_MAX_STATE_BYTES)
      invalid("Feedback import exceeds the 5 MB limit.", ARTIFACT_ERROR_CODES.REQUEST_LIMIT);
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, size)));
  } catch (error) {
    if (error instanceof PipelineError) throw error;
    invalid("Feedback import is unreadable or is not valid UTF-8 JSON.");
  } finally {
    if (fd !== void 0) closeSync(fd);
  }
}
function originalBundles(file, current) {
  return { file, current, cache: /* @__PURE__ */ new Map([[current.revision, current]]) };
}
function originalBundle(bundles, reviewOf, revisionId) {
  if (!/^[a-f0-9]{64}$/u.test(reviewOf ?? ""))
    invalid("Feedback has an invalid original artifact digest.");
  const load = (revision) => {
    if (!bundles.cache.has(revision)) {
      try {
        const historical = readDesignRevision(bundles.file, revision);
        bundles.cache.set(revision, { ...historical, document: historical.design });
      } catch {
        invalid(
          "The original feedback revision is unavailable. Restore its immutable render bundle before importing."
        );
      }
    }
    const bundle = bundles.cache.get(revision);
    if (bundle.document.id !== bundles.current.document.id)
      invalid("Feedback revision belongs to another design document.");
    return bundle;
  };
  if (revisionId && /^[a-f0-9]{64}$/u.test(revisionId)) {
    const exact = load(revisionId);
    if (digestArtifactEnvelope(exact.envelope) !== reviewOf)
      invalid("Feedback revision does not match its original artifact digest.");
    return exact;
  }
  for (const bundle of bundles.cache.values())
    if (digestArtifactEnvelope(bundle.envelope) === reviewOf) return bundle;
  for (const { revision } of listDesignRevisions(bundles.file).revisions) {
    const bundle = load(revision);
    if (digestArtifactEnvelope(bundle.envelope) === reviewOf) return bundle;
  }
  invalid(
    "The original feedback revision is unavailable. Restore its immutable render bundle before importing."
  );
}
function validatePin(pin, bundle) {
  const entry = bundle.entries.find((value) => value.artifactId === pin.artifactId);
  const frame = bundle.document.frames.find((value) => value.id === entry?.frameId);
  const screen = bundle.document.screens.find((value) => value.id === entry?.screenId);
  if (!entry || pin.viewport.width !== frame?.width || pin.viewport.height !== frame?.height)
    invalid("Feedback pin does not match its original screen and captured frame.");
  if (pin.variant !== void 0 && pin.variant !== entry.variantId)
    invalid("Feedback pin targets another design direction.");
  if (pin.region.x + pin.region.w > 1.000001 || pin.region.y + pin.region.h > 1.000001)
    invalid("Feedback pin region extends beyond its original viewport or anchor.");
  if (pin.anchor && (pin.anchor.screen !== void 0 && pin.anchor.screen !== entry.screenId || pin.anchor.planrId !== screen.id && !screen.anchors?.includes(pin.anchor.planrId)))
    invalid("Feedback pin anchor is not declared in its original screen.");
}
function identity(value) {
  return { name: value?.name, ...value?.id == null ? {} : { id: value.id } };
}
function projectedPin(thread, group, bundle) {
  const source = thread.source;
  if (!source || source.reviewId !== group.reviewId || source.reviewOf !== group.reviewOf || source.artifactId !== group.artifactId || source.revisionId !== group.sourceRevisionId)
    invalid("Feedback thread and group have conflicting source identities.");
  const entry = bundle.entries.find((value) => value.artifactId === group.artifactId);
  if (!entry || entry.screenId !== group.screen?.id || entry.variantId !== group.direction?.id || entry.frameId !== group.frame?.id)
    invalid("Feedback group has an invalid original screen mapping.");
  const location = thread.location;
  if (!location || !["anchor-normalized", "viewport-normalized"].includes(location.coordinateSpace) || Boolean(location.anchor) !== (location.coordinateSpace === "anchor-normalized"))
    invalid("Feedback location has an invalid coordinate space.");
  if (!Array.isArray(thread.replies)) invalid("Feedback replies must be an array.");
  const pin = {
    id: thread.id,
    artifactId: source.artifactId,
    author: identity(thread.author),
    intent: thread.originalIntent,
    status: thread.status,
    comment: thread.comment,
    region: location.region,
    viewport: location.capturedViewport,
    ...location.anchor ? {
      anchor: {
        planrId: location.anchor.planrId,
        ...location.anchor.screen == null ? {} : { screen: location.anchor.screen }
      }
    } : {},
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    replies: thread.replies.map((reply) => ({ ...reply, author: identity(reply.author) }))
  };
  return pin;
}
function appendProjectedThread(entry, thread, group, bundle, stored) {
  const pin = projectedPin(thread, group, bundle);
  const previousPin = stored?.reviews.find((value) => value.review.reviewId === group.reviewId)?.review.pins.find((value) => value.id === pin.id);
  if (previousPin?.variant !== void 0) pin.variant = previousPin.variant;
  entry.review.pins.push(pin);
  if (!entry.review.updatedAt || Date.parse(pin.updatedAt) > Date.parse(entry.review.updatedAt))
    entry.review.updatedAt = pin.updatedAt;
  entry.stale ||= thread.stale === true;
}
function decodeProjection(value, current, bundles, stored) {
  if (value.schemaVersion !== "1.0.0" || value.design?.id !== current.document.id || !Array.isArray(value.groups) || value.groups.length > 1e4 || !Array.isArray(value.overallNotes) || value.overallNotes.length > 1e4)
    invalid("Feedback export does not match this design document or supported schema.");
  originalBundle(bundles, value.currentArtifactDigest, value.currentRevisionId);
  const reviews = /* @__PURE__ */ new Map();
  const reviewFor = (reviewId, reviewOf) => {
    if (typeof reviewId !== "string" || !reviewId || reviewId.length > 128)
      invalid("Feedback export is missing its original review identity.");
    const previous = reviews.get(reviewId);
    if (previous && previous.review.reviewOf !== reviewOf)
      invalid("Feedback review identity is bound to conflicting artifact digests.");
    if (previous) return previous;
    const existing = stored?.reviews.find((entry2) => entry2.review.reviewId === reviewId)?.review;
    const entry = {
      review: {
        schemaVersion: "1.0.0",
        reviewId,
        reviewOf,
        decision: "pending",
        overall: "",
        pins: [],
        ...existing?.createdAt ? { createdAt: existing.createdAt } : {},
        ...existing?.updatedAt ? { updatedAt: existing.updatedAt } : {}
      },
      stale: false
    };
    reviews.set(reviewId, entry);
    return entry;
  };
  for (const group of value.groups) {
    if (!group || !Array.isArray(group.threads) || group.threads.length > 1e4 || group.sourceMapping !== "original-bundle")
      invalid("Feedback export lacks its original thread mapping.");
    const bundle = originalBundle(bundles, group.reviewOf, group.sourceRevisionId);
    const entry = reviewFor(group.reviewId, group.reviewOf);
    for (const thread of group.threads) appendProjectedThread(entry, thread, group, bundle, stored);
  }
  for (const note of value.overallNotes) {
    originalBundle(bundles, note?.reviewOf);
    const entry = reviewFor(note?.reviewId, note?.reviewOf);
    if (entry.review.overall) invalid("Feedback export contains duplicate overall notes.");
    entry.review.overall = note.comment;
  }
  return [...reviews.values()].map((entry) => ({
    ...entry,
    review: normalizeArtifactReview(entry.review)
  }));
}
function rejectLegacy(value) {
  if (value?.kind === "openplanr-design-review-export" || value?.kind === "artifact-review-state" || value?.artifacts || value?.reviewId || value?.review)
    return;
  invalid(
    "Legacy notes.json is not canonical review feedback. Keep the file and re-export JSON from the original supported Studio; it cannot be converted safely without its revision and anchor mapping."
  );
}
function rebaseLedger(stored, artifactId, digest) {
  if (stored && stored.artifactId !== artifactId)
    invalid("Stored feedback belongs to another design document.");
  return createReviewLedger({
    artifactId,
    currentReviewOf: digest,
    reviews: (stored?.reviews ?? []).map((entry) => ({
      ...entry,
      stale: entry.stale || entry.review.reviewOf !== digest
    }))
  });
}
function mergeImportedEntries(stored, artifactId, digest, entries, bundles, allowStale) {
  let ledger = rebaseLedger(stored, artifactId, digest);
  const imported = [];
  for (const entry of entries) {
    const bundle = originalBundle(bundles, entry.review.reviewOf);
    for (const pin of entry.review.pins) validatePin(pin, bundle);
    const stale = entry.stale || entry.review.reviewOf !== digest;
    if (stale && !allowStale)
      invalid(
        "Feedback belongs to an earlier revision. Inspect it and retry with explicit --allow-stale confirmation.",
        ARTIFACT_ERROR_CODES.STALE_REVIEW
      );
    const previous = ledger.reviews.find(
      (value) => value.review.reviewId === entry.review.reviewId
    )?.review;
    const review = { ...entry.review, decision: previous?.decision ?? "pending" };
    ledger = mergeReviewLedger(ledger, review, { stale });
    imported.push({ reviewId: review.reviewId, stale, pins: review.pins.length });
  }
  return { ledger, imported };
}
async function importDesignFeedback(file, { input, revision, allowStale = false, env = process.env } = {}) {
  if (!/^[a-f0-9]{64}$/u.test(revision ?? ""))
    invalid("Feedback import requires the current render revision from feedback inspect.");
  if (typeof allowStale !== "boolean")
    invalid("Stale feedback requires an explicit boolean confirmation.");
  const source = readDesignFeedbackImport(input);
  rejectLegacy(source);
  const initial = currentDesign(file);
  const release = await acquireStartLock(join(initial.root, ".design/render.lock"), {
    timeout: 1e3,
    stale: 3e4
  });
  try {
    const current = currentDesign(file);
    if (current.revision !== revision)
      invalid(
        "The design changed before feedback import. Inspect the current revision and retry.",
        ARTIFACT_ERROR_CODES.STALE_REVIEW
      );
    const artifactId = `design-${hash(current.document.id).slice(0, 24)}`;
    const path = resolveArtifactReviewDestination({ cwd: current.root, env, artifactId }).path;
    return await withArtifactReviewLock(path, async () => {
      const stored = readArtifactReviewState(path, { allowMissing: true });
      const bundles = originalBundles(file, current);
      const entries = source.kind === "openplanr-design-review-export" ? decodeProjection(source, current, bundles, stored) : await decodeArtifactReviewSources(source, { withMetadata: true });
      if (source.kind === "artifact-review-state" && source.artifactId !== artifactId)
        invalid("Imported ledger belongs to another design document.");
      const digest = digestArtifactEnvelope(current.envelope);
      const { ledger, imported } = mergeImportedEntries(
        stored,
        artifactId,
        digest,
        entries,
        bundles,
        allowStale
      );
      writeArtifactReviewState(path, ledger);
      return {
        ok: true,
        action: "design_feedback_imported",
        revision: current.revision,
        imported,
        note: "Feedback merged. Imported votes, dispositions and decisions do not change owner selection or handoff approval."
      };
    });
  } finally {
    release();
  }
}

// packages/design/lib/design/studio-lifecycle.mjs
import { join as join2 } from "node:path";
function localUrl(value, service, path) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === `http://127.0.0.1:${service.port}` && !url.search && !url.hash && path.test(url.pathname) ? url.href : null;
  } catch {
    return null;
  }
}
async function manageDesignStudio(file, { action = "status", instanceId, env = process.env, fetchImpl = fetch } = {}) {
  if (!["status", "stop"].includes(action))
    throw new Error("Studio action must be status or stop.");
  if (instanceId !== void 0 && (typeof instanceId !== "string" || !/^[A-Za-z0-9_-]{22}$/u.test(instanceId)))
    throw new Error("Studio requires a valid exact instance ID.");
  const current = currentDesign(file);
  const services = (await listArtifactReviewServers({ env, fetchImpl })).filter(
    (service2) => service2.kind === "design" && service2.projectRoot === current.root
  );
  const launcher = readJson(join2(current.root, ".design/server.json"), null);
  let service = services.find((value) => value.instanceId === (instanceId ?? launcher?.instanceId));
  if (instanceId !== void 0 && !service)
    throw new Error(
      "That Studio instance is not owned by this design in the current state directory."
    );
  const result = {
    ok: true,
    action: `design_studio_${action}`,
    documentId: current.document.id,
    revision: current.revision,
    verification: current.verification.status
  };
  if (action === "stop") {
    if (!service && services.length === 1) service = services[0];
    if (!service && services.length > 1)
      throw new Error(
        `Multiple owned Studio services need recovery. Run studio --action status, then stop an exact service with --instance-id. Owned instances: ${services.map((value) => value.instanceId).join(", ")}.`
      );
    if (!service)
      return {
        ...result,
        status: "stopped",
        notice: "Studio is stopped. Open the design to start it again."
      };
    const stopped = await stopArtifactReviewServer(service.instanceId, { env, fetchImpl });
    return {
      ...result,
      status: stopped.status,
      instanceId: service.instanceId,
      notice: "Feedback and arrangement are saved. Open the design to start Studio again."
    };
  }
  if (!service)
    return {
      ...result,
      status: services.length ? "attention" : "stopped",
      services,
      notice: services.length ? services.length === 1 ? "Stop this design\u2019s owned Studio service, then open the design again to restore its session link." : "Stop an exact owned Studio service with --instance-id, then reopen after all obsolete services are stopped." : "Open the design to start Studio."
    };
  const url = localUrl(launcher?.studioUrl, service, /^\/studio\/[A-Za-z0-9._-]+\/$/u) ?? service.url;
  let browserStatus = "not-checked";
  const privateUrl = localUrl(launcher?.url, service, /^\/r\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/$/u);
  if (privateUrl) {
    try {
      const response = await fetchImpl(`${privateUrl}api/design-status`, {
        signal: AbortSignal.timeout(700)
      });
      const data = await response.json();
      if (response.ok && data.documentId === current.document.id && data.revision === current.revision && ["loading", "ready", "failed"].includes(data.status))
        browserStatus = data.status;
    } catch {
    }
  }
  return {
    ...result,
    status: "running",
    instanceId: service.instanceId,
    url,
    browserStatus,
    services
  };
}

// packages/design/lib/design/browser-audit.mjs
function auditRenderedScreen() {
  const issues = [];
  const add = (rule, severity, message) => issues.push({ rule, severity, message });
  const label = (node) => node.getAttribute("data-planr-id") || node.id || `${node.tagName.toLowerCase()} \u201C${(node.textContent || node.getAttribute("aria-label") || "").trim().replace(/\s+/gu, " ").slice(0, 60)}\u201D`;
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const screenId = document.body?.getAttribute("data-planr-screen") ?? null;
  if (!screenId)
    add("screen-not-loaded", "error", "The frame has no authored design screen identity.");
  if (document.readyState !== "complete")
    add("screen-loading", "error", `The frame is still ${document.readyState}.`);
  const nodes = [...document.querySelectorAll("body *")];
  if (nodes.length > 5e3)
    add(
      "audit-limit",
      "error",
      "The screen exceeds the 5,000 element audit limit; inspect and split the screen before verification."
    );
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const color = (input) => {
    if (!context) return null;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = input;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data].map((value) => value / 255);
  };
  const over = (foreground, background) => foreground.slice(0, 3).map((value, index) => value * foreground[3] + background[index] * (1 - foreground[3]));
  const luminance = (rgb) => rgb.reduce(
    (sum, value, index) => sum + [0.2126, 0.7152, 0.0722][index] * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4),
    0
  );
  const effectiveBackground = (node) => {
    const chain = [];
    for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) chain.unshift(ancestor);
    let background = [1, 1, 1];
    for (const ancestor of chain) {
      const style = getComputedStyle(ancestor);
      if (style.backgroundImage !== "none" || Number(style.opacity) < 1 || style.mixBlendMode !== "normal" || style.filter !== "none")
        return null;
      const resolved = color(style.backgroundColor);
      if (!resolved) return null;
      background = over(resolved, background);
    }
    return background;
  };
  const visible = (node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && !node.closest('[hidden],[aria-hidden="true"],[inert]') && style.visibility !== "hidden" && style.visibility !== "collapse" && Number(style.opacity) > 0;
  };
  let checkedElements = 0, checkedContrast = 0, skippedContrast = 0, checkedFocus = 0;
  const focusTargets = [];
  for (const node of nodes.slice(0, 5e3)) {
    if (!visible(node)) continue;
    checkedElements += 1;
    const style = getComputedStyle(node);
    const directText = [...node.childNodes].some(
      (child) => child.nodeType === 3 && child.textContent.trim()
    );
    if (node.tagName === "IMG" && (!node.complete || node.naturalWidth === 0))
      add("missing-image", "error", `${label(node)} has not loaded its image.`);
    if (directText) {
      const background = effectiveBackground(node);
      const foreground = color(style.color);
      if (background && foreground) {
        const a = luminance(over(foreground, background)), b = luminance(background);
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        const large = parseFloat(style.fontSize) >= 24 || parseFloat(style.fontSize) >= 18.666 && parseFloat(style.fontWeight) >= 700;
        const required = large ? 3 : 4.5;
        checkedContrast += 1;
        if (ratio + 0.01 < required)
          add(
            "contrast-below-aa",
            "error",
            `${label(node)} has computed contrast ${ratio.toFixed(2)}:1; ${required}:1 is required.`
          );
      } else skippedContrast += 1;
      if (!["INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(node.tagName)) {
        const clipsX = ["hidden", "clip"].includes(style.overflowX) && node.scrollWidth > node.clientWidth + 1;
        const clipsY = ["hidden", "clip"].includes(style.overflowY) && node.scrollHeight > node.clientHeight + 1;
        if (clipsX || clipsY) {
          const intentional = style.textOverflow === "ellipsis" || style.webkitLineClamp && style.webkitLineClamp !== "none";
          add(
            "clipped-content",
            intentional ? "warning" : "error",
            `${label(node)} clips ${clipsX ? "horizontal" : "vertical"} text${intentional ? "; confirm intentional truncation in the screenshot" : ""}.`
          );
        }
      }
    }
    if (node.tabIndex >= 0 && !node.disabled && node.matches(
      'button,a[href],input:not([type="hidden"]),select,textarea,[tabindex],[contenteditable="true"]'
    )) {
      focusTargets.push(node);
      const name = node.getAttribute("aria-label") || (node.getAttribute("aria-labelledby") || "").split(/\s+/u).map((id) => document.getElementById(id)?.textContent || "").join(" ").trim() || [...node.labels || []].map((item) => item.textContent).join(" ").trim() || node.getAttribute("title") || (node.matches('input[type="button"],input[type="submit"],input[type="reset"]') ? node.value : node.matches("input,select,textarea") ? "" : node.textContent.trim());
      if (!name) add("unnamed-control", "error", `${label(node)} has no accessible name.`);
    }
  }
  if (document.documentElement.scrollWidth > viewport.width + 1)
    add(
      "horizontal-overflow",
      "error",
      `The screen is ${document.documentElement.scrollWidth}px wide in a ${viewport.width}px frame.`
    );
  if (checkedElements === 0)
    add("empty-render", "error", "The frame contains no visible rendered content.");
  if (skippedContrast > 0)
    add(
      "contrast-needs-inspection",
      "warning",
      `${skippedContrast} text elements use images, blending or transparency effects; inspect their screenshot contrast.`
    );
  if (document.fonts?.status === "loading")
    add("fonts-loading", "error", "Fonts are still loading; inspect again after they settle.");
  const previousFocus = document.activeElement;
  const previousScroll = { x: window.scrollX, y: window.scrollY };
  let keyboardInspectionNeeded = 0;
  for (const node of focusTargets.slice(0, 150)) {
    const before = getComputedStyle(node);
    const baseline = [
      before.boxShadow,
      before.backgroundColor,
      before.borderColor,
      before.textDecorationLine
    ];
    node.focus({ preventScroll: true });
    if (document.activeElement !== node) {
      add("unreachable-control", "error", `${label(node)} cannot receive focus.`);
      continue;
    }
    if (!node.matches(":focus-visible")) {
      keyboardInspectionNeeded += 1;
      continue;
    }
    const focused = getComputedStyle(node);
    const outlined = focused.outlineStyle !== "none" && parseFloat(focused.outlineWidth) > 0 && (color(focused.outlineColor)?.[3] ?? 0) > 0;
    const changed = [
      focused.boxShadow,
      focused.backgroundColor,
      focused.borderColor,
      focused.textDecorationLine
    ].some((value, index) => value !== baseline[index]);
    checkedFocus += 1;
    if (!outlined && !changed)
      add(
        "missing-focus-indicator",
        "error",
        `${label(node)} has no visible keyboard focus style.`
      );
  }
  previousFocus?.focus?.({ preventScroll: true });
  if (document.activeElement !== previousFocus) document.activeElement?.blur?.();
  if (window.scrollX !== previousScroll.x || window.scrollY !== previousScroll.y)
    window.scrollTo(previousScroll.x, previousScroll.y);
  if (keyboardInspectionNeeded > 0)
    add(
      "focus-needs-keyboard-inspection",
      "warning",
      `${keyboardInspectionNeeded} controls need a keyboard focus walkthrough.`
    );
  if (focusTargets.length > 150)
    add("focus-audit-limit", "warning", "Only the first 150 focusable controls were inspected.");
  return {
    screenId,
    viewport,
    checkedElements,
    checkedContrast,
    skippedContrast,
    checkedFocus,
    issues
  };
}
async function auditDesignPage(page, { revision, entries = [], screenshotPaths = [], scenarios = [] } = {}) {
  const issues = [], checkedArtifacts = [], screens = [];
  const expected = new Map(entries.map((entry) => [entry.artifactId, entry]));
  const add = (artifactId, rule, severity, message) => issues.push({ artifactId, rule, severity, message });
  if (!entries.length || expected.size !== entries.length)
    add(
      "studio",
      "invalid-audit-scope",
      "error",
      "Audit scope must contain every expected artifact exactly once."
    );
  if (!page || typeof page.frames !== "function") {
    return {
      schemaVersion: "1.0.0",
      revision,
      status: "unverified",
      checkedArtifacts,
      issues: [
        {
          artifactId: "studio",
          rule: "browser-unavailable",
          severity: "warning",
          message: "A browser page is required for rendered verification."
        }
      ],
      screenshots: screenshotPaths,
      scenarios,
      screens
    };
  }
  const loaded = /* @__PURE__ */ new Set();
  for (const frame of page.frames()) {
    let handle, artifactId, panelState;
    try {
      if (frame === page.mainFrame?.()) continue;
      handle = await frame.frameElement();
      artifactId = await handle.getAttribute("data-planr-artifact-frame") ?? await handle.getAttribute("data-planr-artifact-id");
      if (!expected.has(artifactId)) continue;
      if (loaded.has(artifactId)) {
        add(
          artifactId,
          "duplicate-frame",
          "error",
          "Multiple frames claim the same artifact identity."
        );
        continue;
      }
      loaded.add(artifactId);
      await frame.waitForLoadState?.("load", { timeout: 5e3 });
      panelState = await handle.evaluate((element) => {
        const panel = element.closest("[data-artifact-id]");
        if (!panel) return null;
        const hidden = panel.hidden;
        panel.hidden = false;
        return { hidden };
      });
      await page.keyboard?.press("Tab");
      const result = await frame.evaluate(auditRenderedScreen);
      if (result.screenId !== expected.get(artifactId).screenId) {
        add(
          artifactId,
          "screen-identity-mismatch",
          "error",
          `Expected screen ${expected.get(artifactId).screenId}; loaded ${result.screenId ?? "none"}.`
        );
        continue;
      }
      checkedArtifacts.push(artifactId);
      screens.push({ artifactId, ...result });
      for (const issue of result.issues) add(artifactId, issue.rule, issue.severity, issue.message);
    } catch (error) {
      if (artifactId && expected.has(artifactId))
        add(
          artifactId,
          "frame-load-error",
          "error",
          `The rendered frame could not be inspected: ${error.message}`
        );
    } finally {
      if (panelState && handle) {
        await handle.evaluate((element, state) => {
          const panel = element.closest("[data-artifact-id]");
          if (panel) panel.hidden = state.hidden;
        }, panelState).catch(() => {
        });
      }
      await handle?.dispose?.();
    }
  }
  for (const artifactId of expected.keys()) {
    if (!checkedArtifacts.includes(artifactId))
      add(
        artifactId,
        "missing-frame-inspection",
        "error",
        "The expected artifact has no completed rendered inspection."
      );
  }
  for (const error of await page.pageErrors?.() ?? [])
    add("studio", "browser-script-error", "error", error.message ?? String(error));
  const evidenceComplete = screenshotPaths.length > 0 && scenarios.length > 0 && scenarios.every(({ status: status2 }) => status2 === "passed");
  const status = issues.some(({ severity }) => severity === "error") ? "failed" : evidenceComplete ? "verified" : "unverified";
  return {
    schemaVersion: "1.0.0",
    revision,
    status,
    checkedArtifacts,
    issues,
    screenshots: screenshotPaths,
    scenarios,
    screens
  };
}

// packages/design/lib/design/utility.mjs
function isPng(bytes) {
  if (bytes.length < 57 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return false;
  let offset = 8, header = false, pixels = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset), type = bytes.toString("ascii", offset + 4, offset + 8);
    if (length > bytes.length - offset - 12) return false;
    if (!header) {
      if (type !== "IHDR" || length !== 13 || bytes.readUInt32BE(offset + 8) === 0 || bytes.readUInt32BE(offset + 12) === 0)
        return false;
      header = true;
    } else if (type === "IHDR") return false;
    if (type === "IDAT" && length > 0) pixels = true;
    offset += length + 12;
    if (type === "IEND") return length === 0 && pixels && offset === bytes.length;
  }
  return false;
}
function verifyDesignDocument(file, report) {
  const current = currentDesign(file);
  if (!report || report.revision !== current.revision)
    throw new Error("Browser report belongs to a different render revision.");
  const screenEvidence = Array.isArray(report.screens) ? report.screens : [];
  const checkedArtifacts = Array.isArray(report.checkedArtifacts) ? report.checkedArtifacts : [];
  const coverage = current.entries.every((entry) => {
    const frame = current.document.frames.find((item) => item.id === entry.frameId);
    const matches = screenEvidence.filter((item) => item?.artifactId === entry.artifactId);
    return checkedArtifacts.includes(entry.artifactId) && matches.length === 1 && matches[0].screenId === entry.screenId && matches[0].viewport?.width === frame.width && matches[0].viewport?.height === frame.height && Number.isInteger(matches[0].checkedElements) && matches[0].checkedElements > 0;
  });
  const images = (Array.isArray(report.screenshots) ? report.screenshots : []).filter((item) => {
    const path = typeof item === "string" ? item : item?.path;
    try {
      return typeof path === "string" && isPng(readFileSync(resolve2(path)));
    } catch {
      return false;
    }
  });
  const journeys = Array.isArray(report.scenarios) && report.scenarios.length > 0 && report.scenarios.every(
    (item) => item?.status === "passed" && [item.name, item.id].some((value) => typeof value === "string" && value.trim().length > 0)
  );
  const issues = [
    ...Array.isArray(report.issues) ? report.issues : [],
    ...screenEvidence.flatMap((item) => Array.isArray(item?.issues) ? item.issues : [])
  ];
  const status = issues.some((item) => item?.severity === "error") || report.status === "failed" ? "failed" : coverage && images.length > 0 && journeys && report.status !== "unverified" ? "verified" : "unverified";
  const saved = {
    ...report,
    issues,
    schemaVersion: "1.0.0",
    revision: current.revision,
    status,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    coverage,
    screenshotCount: images.length,
    primaryJourneysChecked: Boolean(journeys)
  };
  atomicJson(join3(current.root, ".design/verification", `${current.revision}.json`), saved);
  return saved;
}
async function designUtility(argv, {
  stdout = (value) => process.stdout.write(`${JSON.stringify(value)}
`),
  openUrl,
  env = process.env,
  fetchImpl = fetch
} = {}) {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "help") {
    const help = {
      usage: "design.mjs inspect|validate|render|open|studio|export|feedback|verify|share|publish|sync|manage|handoff <design-document.json>",
      flags: [
        "--json",
        "--no-open",
        "--view canvas|prototype|walkthrough",
        "--port <number>",
        "--format html|json|markdown",
        "--scope current|all",
        "--output <path>",
        "--report <browser-report.json>",
        "--action inspect|export|import|select|resolve|rotate|pause|resume|revoke|delete|recovery|restore|status|stop",
        "--input <private recovery or feedback JSON file>",
        "--revision <current-render-revision>",
        "--allow-stale",
        "--variant <id>",
        "--pins <id,id>",
        "--summary <text>"
      ],
      note: "The host authors design sources. This utility only validates, renders, reviews and exports them."
    };
    stdout(help);
    return help;
  }
  const [command, input, ...args] = argv;
  if (![
    "inspect",
    "validate",
    "render",
    "open",
    "studio",
    "export",
    "feedback",
    "verify",
    "share",
    "publish",
    "sync",
    "manage",
    "handoff"
  ].includes(command) || !input)
    throw new Error(
      "Usage: design.mjs inspect|validate|render|open|studio|export|feedback|verify|share|publish|sync|manage|handoff <design-document.json> [--json] [--no-open] [--view canvas|prototype|walkthrough]"
    );
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--")) throw new Error(`Unexpected argument: ${args[i]}`);
    const key = args[i].slice(2);
    if (![
      "json",
      "no-open",
      "view",
      "format",
      "output",
      "port",
      "report",
      "action",
      "instance-id",
      "pins",
      "summary",
      "variant",
      "input",
      "scope",
      "revision",
      "allow-stale"
    ].includes(key))
      throw new Error(`Unknown option: ${args[i]}`);
    flags[key] = ["json", "no-open", "allow-stale"].includes(key) ? true : args[++i];
  }
  if (flags.view && !["canvas", "prototype", "walkthrough"].includes(flags.view))
    throw new Error("View must be canvas, prototype, or walkthrough.");
  const file = resolve2(input);
  let result;
  if (command === "studio")
    result = await manageDesignStudio(file, {
      action: flags.action,
      instanceId: flags["instance-id"],
      env,
      fetchImpl
    });
  if (command === "handoff") {
    const action = flags.action ?? "inspect";
    if (action === "inspect") result = readDesignHandoff(file);
    else {
      const snapshot = readDesignHandoff(file);
      const input2 = flags.input ? readJson(resolve2(flags.input)) : {};
      result = await updateDesignHandoff(file, {
        ...input2,
        action,
        revision: input2.revision ?? snapshot.revision,
        version: input2.version ?? snapshot.draft?.version ?? 0
      });
    }
  }
  if (command === "share") result = await shareDesign(file);
  if (command === "publish") result = await publishDesignShare(file);
  if (command === "sync") result = await syncDesignShare(file);
  if (command === "manage" && !["rotate", "pause", "resume", "revoke", "delete", "recovery", "restore"].includes(flags.action))
    throw new Error("manage requires --action rotate|pause|resume|revoke|delete|recovery|restore.");
  if (command === "manage")
    result = flags.action === "restore" ? await importDesignShareRecovery(file, { input: flags.input }) : flags.action === "recovery" ? await exportDesignShareRecovery(file, { output: flags.output }) : await manageDesignShare(file, flags.action);
  if (command === "inspect") result = inspectDesignDocument(file);
  if (command === "validate") {
    const prepared = prepareDesignDocument(file);
    result = {
      ok: prepared.lint.every((item) => item.ok),
      lint: prepared.lint,
      screens: prepared.document.screens.length,
      artifacts: prepared.entries.length,
      verification: "unverified"
    };
  }
  if (command === "render") result = await renderDesignDocument(file);
  if (command === "open") {
    const port = flags.port === void 0 ? 0 : Number(flags.port);
    if (!Number.isInteger(port) || port < 0 || port > 65535)
      throw new Error("Port must be 0\u201365535.");
    result = await startDesignReview(file, {
      port,
      view: flags.view,
      noOpen: Boolean(flags["no-open"]),
      openUrl,
      env,
      fetchImpl
    });
    const close = result.close;
    if (close) {
      process.once("SIGINT", async () => {
        await close();
        process.exit(0);
      });
      process.once("SIGTERM", async () => {
        await close();
        process.exit(0);
      });
    }
  }
  if (command === "export") {
    const current = currentDesign(file), view = flags.view ?? current.document.defaultView;
    const state = readJson(join3(current.root, ".design/studio-state.json"), { state: {} }).state;
    if (flags.format && flags.format !== "html")
      throw new Error(
        "Portable export supports HTML. Use the studio PNG action for browser-rendered captures."
      );
    const output = resolve2(flags.output ?? join3(current.root, `${view}-export.html`));
    if (existsSync(output))
      throw new Error(`Export already exists: ${output}. Choose a new --output path.`);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, standaloneDesignHtml({ ...current, state }, view), { flag: "wx" });
    result = { ok: true, output, view, revision: current.revision };
  }
  if (command === "verify") {
    if (!flags.report) throw new Error("verify requires --report <browser-report.json>.");
    result = verifyDesignDocument(file, readJson(resolve2(flags.report)));
  }
  if (command === "feedback") {
    const action = flags.action ?? "inspect";
    if (action !== "import") await syncDesignShare(file, { env, fetchImpl });
    if (action === "import")
      result = await importDesignFeedback(file, {
        input: flags.input,
        revision: flags.revision,
        allowStale: Boolean(flags["allow-stale"]),
        env
      });
    else if (action === "inspect") result = readDesignFeedback(file, env);
    else if (action === "export") {
      const format = flags.format ?? "json", scope = flags.scope ?? "all";
      if (!["json", "markdown"].includes(format))
        throw new Error("Feedback export format must be json or markdown.");
      if (!["current", "all"].includes(scope))
        throw new Error("Feedback export scope must be current or all.");
      if (!flags.output) throw new Error("Feedback export requires --output <path>.");
      const output = resolve2(flags.output);
      if (existsSync(output))
        throw new Error("Feedback export already exists. Choose a new --output path.");
      const snapshot = exportDesignReview(file, { scope, env });
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, serializeDesignReviewExport(snapshot, format), {
        flag: "wx",
        mode: 384
      });
      result = {
        ok: true,
        output,
        format,
        scope,
        revision: snapshot.currentRevisionId,
        summary: snapshot.summary
      };
    } else if (action === "resolve")
      result = await resolveDesignPins(file, {
        pinIds: flags.pins?.split(",").filter(Boolean),
        summary: flags.summary,
        env
      });
    else if (action === "select") {
      const current = currentDesign(file), saved = readJson(join3(current.root, ".design/studio-state.json"), {
        state: {},
        stateVersion: 0
      });
      const variant = flags.variant ?? saved.state.selectedVariant;
      if (!current.document.variants.some((item) => item.id === variant && item.status === "ready"))
        throw new Error("Select a ready variant with --variant.");
      const selected = [variant], rejected = (saved.state.preferences?.rejected ?? []).filter((id) => id !== variant);
      result = await saveDesignState(file, {
        ...saved,
        revision: current.revision,
        state: { ...saved.state, selectedVariant: variant, preferences: { selected, rejected } }
      });
      result = {
        ok: true,
        selectedVariant: variant,
        tastePath: result.tastePath,
        revision: current.revision
      };
    } else throw new Error("Feedback action must be inspect, export, import, select, or resolve.");
  }
  stdout(result);
  return result;
}
async function main(argv = process.argv.slice(2)) {
  try {
    const result = await designUtility(argv, {
      openUrl: async (url) => {
        const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer.exe" : "xdg-open";
        const child = spawn(command, [url], { stdio: "ignore" });
        child.on("error", () => {
        });
        child.unref();
      }
    });
    if (result?.ok === false || result?.status === "failed") process.exitCode = 1;
    return result;
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    process.exitCode = 1;
  }
}
var invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]);
if (invokedDirectly) await main();
export {
  auditDesignPage,
  auditRenderedScreen,
  designUtility,
  main,
  verifyDesignDocument
};
