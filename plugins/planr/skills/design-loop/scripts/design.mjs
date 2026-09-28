#!/usr/bin/env node
import {
  exportDesignReview,
  readDesignFeedback,
  readDesignHandoff,
  resolveDesignPins,
  saveDesignState,
  serializeDesignReviewExport,
  startDesignReview,
  updateDesignHandoff
} from "./design-review-handoff.mjs";
import {
  exportDesignShareRecovery,
  importDesignShareRecovery,
  manageDesignShare,
  publishDesignShare,
  shareDesign,
  syncDesignShare
} from "./design-share.mjs";
import {
  atomicJson,
  currentDesign,
  inspectDesignDocument,
  prepareDesignDocument,
  readJson,
  renderDesignDocument,
  standaloneDesignHtml
} from "./design-document.mjs";
import "./design-parse5-parser.mjs";
import "./design-parse5-tokenizer.mjs";
import "./design-entities.mjs";
import "./design-artifact-shell.mjs";
import "./design-sandbox-guards.mjs";

// packages/design/lib/design/utility.mjs
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
      return typeof path === "string" && isPng(readFileSync(resolve(path)));
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
  atomicJson(join(current.root, ".design/verification", `${current.revision}.json`), saved);
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
      usage: "design.mjs inspect|validate|render|open|export|feedback|verify|share|publish|sync|manage|handoff <design-document.json>",
      flags: [
        "--json",
        "--no-open",
        "--view canvas|prototype|walkthrough",
        "--port <number>",
        "--format html|json|markdown",
        "--scope current|all",
        "--output <path>",
        "--report <browser-report.json>",
        "--action inspect|export|select|resolve|rotate|pause|resume|revoke|delete|recovery|restore",
        "--input <private recovery file>",
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
      "Usage: design.mjs inspect|validate|render|open|export|feedback|verify|share|publish|sync|manage|handoff <design-document.json> [--json] [--no-open] [--view canvas|prototype|walkthrough]"
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
      "pins",
      "summary",
      "variant",
      "input",
      "scope"
    ].includes(key))
      throw new Error(`Unknown option: ${args[i]}`);
    flags[key] = ["json", "no-open"].includes(key) ? true : args[++i];
  }
  if (flags.view && !["canvas", "prototype", "walkthrough"].includes(flags.view))
    throw new Error("View must be canvas, prototype, or walkthrough.");
  const file = resolve(input);
  let result;
  if (command === "handoff") {
    const action = flags.action ?? "inspect";
    if (action === "inspect") result = readDesignHandoff(file);
    else {
      const snapshot = readDesignHandoff(file);
      const input2 = flags.input ? readJson(resolve(flags.input)) : {};
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
      openUrl
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
    const state = readJson(join(current.root, ".design/studio-state.json"), { state: {} }).state;
    if (flags.format && flags.format !== "html")
      throw new Error(
        "Portable export supports HTML. Use the studio PNG action for browser-rendered captures."
      );
    const output = resolve(flags.output ?? join(current.root, `${view}-export.html`));
    if (existsSync(output))
      throw new Error(`Export already exists: ${output}. Choose a new --output path.`);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, standaloneDesignHtml({ ...current, state }, view), { flag: "wx" });
    result = { ok: true, output, view, revision: current.revision };
  }
  if (command === "verify") {
    if (!flags.report) throw new Error("verify requires --report <browser-report.json>.");
    result = verifyDesignDocument(file, readJson(resolve(flags.report)));
  }
  if (command === "feedback") {
    await syncDesignShare(file, { env, fetchImpl });
    const action = flags.action ?? "inspect";
    if (action === "inspect") result = readDesignFeedback(file, env);
    else if (action === "export") {
      const format = flags.format ?? "json", scope = flags.scope ?? "all";
      if (!["json", "markdown"].includes(format))
        throw new Error("Feedback export format must be json or markdown.");
      if (!["current", "all"].includes(scope))
        throw new Error("Feedback export scope must be current or all.");
      if (!flags.output) throw new Error("Feedback export requires --output <path>.");
      const output = resolve(flags.output);
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
      const current = currentDesign(file), saved = readJson(join(current.root, ".design/studio-state.json"), {
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
    } else throw new Error("Feedback action must be inspect, export, select, or resolve.");
  }
  stdout(result);
  return result;
}
var main = process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]);
if (main)
  designUtility(process.argv.slice(2), {
    openUrl: async (url) => {
      const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer.exe" : "xdg-open";
      const child = spawn(command, [url], { stdio: "ignore" });
      child.on("error", () => {
      });
      child.unref();
    }
  }).then((result) => {
    if (result?.ok === false || result?.status === "failed") process.exitCode = 1;
  }).catch((error) => {
    process.stderr.write(`${error.message}
`);
    process.exitCode = 1;
  });
export {
  auditDesignPage,
  auditRenderedScreen,
  designUtility,
  verifyDesignDocument
};
