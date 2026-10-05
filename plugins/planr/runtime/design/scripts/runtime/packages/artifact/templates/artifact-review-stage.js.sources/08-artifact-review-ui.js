

  // lib/artifact/ui/share-dialog.mjs
  var ARTIFACT_SHARE_FRAGMENT_LIMIT = 8e3;
  var ARTIFACT_SHARE_TTLS2 = Object.freeze({
    "1d": Object.freeze({ label: "1 day", milliseconds: 864e5 }),
    "7d": Object.freeze({ label: "7 days", milliseconds: 6048e5 }),
    "30d": Object.freeze({ label: "30 days", milliseconds: 2592e6 })
  });
  var ARTIFACT_SHARE_TRANSPORTS = Object.freeze(["live", "fragment", "short"]);
  var PHASES = Object.freeze([
    "idle",
    "previewing",
    "ready",
    "custody-preparing",
    "custody-ready",
    "creating",
    "ambiguous",
    "created",
    "error"
  ]);
  var LIVE_ROOM_ID_RE = /^[A-Za-z0-9_-]{16,128}$/;
  var LIVE_ROOM_SECRET_RE = /^[A-Za-z0-9_-]{43}$/;
  var LIVE_ROOM_KEY_ID_RE = /^sha256:[a-f0-9]{64}$/;
  var LIVE_ROOM_REVIEW_RE = /^[a-f0-9]{64}$/;
  var BASE64URL_RE = /^[A-Za-z0-9_-]+$/;
  var OWNER_SECRET_MAX_BYTES = 64 * 1024;
  var ROOM_RECOVERY_MAX_BYTES = 8 * 1024 * 1024;
  var ArtifactShareUiError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "ArtifactShareUiError";
      this.code = code;
      this.details = Object.freeze({ ...details });
    }
  };
  function member(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
  }
  function count(value, name) {
    if (!Number.isInteger(value) || value < 0) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_PREVIEW_INVALID",
        `${name} must be a non-negative integer.`,
        { field: name }
      );
    }
    return value;
  }
  function text4(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
  }
  function record(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
  function exactKeys(value, expected) {
    return record(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
  }
  function exactLoopback(hostname) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
  }
  function parseLiveResultUrl(value, capability) {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_RESULT_INVALID",
        "Live room creation returned a malformed capability URL."
      );
    }
    const fields = new URLSearchParams(url.hash.slice(1));
    const keys = [...fields.keys()];
    const authenticatedRead = fields.has("r");
    const expected = ["k", capability, ...authenticatedRead ? ["r"] : []];
    const roomId = /^\/r\/([A-Za-z0-9_-]{16,128})\/?$/.exec(url.pathname)?.[1];
    if (url.username || url.password || url.search || url.protocol !== "https:" && !(url.protocol === "http:" && exactLoopback(url.hostname)) || !roomId || !LIVE_ROOM_ID_RE.test(roomId) || keys.length !== expected.length || !keys.includes("k") || !keys.includes(capability) || keys.some((key) => !expected.includes(key) || fields.getAll(key).length !== 1) || authenticatedRead && !LIVE_ROOM_SECRET_RE.test(fields.get("r") ?? "") || !LIVE_ROOM_SECRET_RE.test(fields.get("k") ?? "") || !LIVE_ROOM_SECRET_RE.test(fields.get(capability) ?? "")) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_RESULT_INVALID",
        "Live room creation returned an invalid or mixed capability URL."
      );
    }
    return Object.freeze({
      origin: url.origin,
      pathname: url.pathname.replace(/\/$/, ""),
      key: fields.get("k"),
      capability: fields.get(capability),
      readCapability: fields.get("r")
    });
  }
  function validateLiveResultUrls({ url, ownerUrl, manageUrl }) {
    const reviewer = parseLiveResultUrl(url, "w");
    const owner = parseLiveResultUrl(ownerUrl, "o");
    const management = parseLiveResultUrl(manageUrl, "m");
    if (reviewer.origin !== owner.origin || reviewer.origin !== management.origin || reviewer.pathname !== owner.pathname || reviewer.pathname !== management.pathname || reviewer.key !== owner.key || reviewer.key !== management.key || reviewer.readCapability !== owner.readCapability || reviewer.readCapability !== management.readCapability || (/* @__PURE__ */ new Set([reviewer.capability, owner.capability, management.capability])).size !== 3) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_RESULT_INVALID",
        "Live room creation must return separate reviewer, owner-verdict, and management capabilities for one room."
      );
    }
  }
  function normalizeOwnerCustody(value) {
    if (record(value?.prepared) && record(value?.recovery)) {
      const { prepared, recovery } = value;
      if (prepared.protocolVersion === "3.0.0") {
        try {
          assertLiveRoomV3RecoveryMatchesPreparation(prepared, recovery);
        } catch {
          throw new ArtifactShareUiError(
            "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
            "Live room recovery custody does not match its prepared creation."
          );
        }
        validateLiveResultUrls(prepared);
        if (recovery.schemaVersion !== "2.0.0")
          throw new ArtifactShareUiError(
            "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
            "Live room recovery version is invalid."
          );
        const signerCustody2 = normalizeOwnerCustody({
          signer: prepared.ownerSigner,
          secret: recovery.ownerSigner
        });
        if (JSON.stringify(prepared.ownerKey) !== JSON.stringify({
          algorithm: signerCustody2.signer.algorithm,
          encoding: signerCustody2.signer.encoding,
          keyId: signerCustody2.signer.keyId,
          value: signerCustody2.signer.value ?? signerCustody2.signer.publicKey
        }))
          throw new ArtifactShareUiError(
            "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
            "Live room recovery owner key does not match its prepared signer."
          );
        const serialized3 = `${JSON.stringify(recovery, null, 2)}
`;
        if (new TextEncoder().encode(serialized3).byteLength > ROOM_RECOVERY_MAX_BYTES)
          throw new ArtifactShareUiError(
            "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
            "Live room recovery bundle exceeds its bounded export size."
          );
        return Object.freeze({
          credential: prepared,
          signer: signerCustody2.signer,
          serialized: serialized3,
          filename: `openplanr-live-room-recovery-${prepared.roomId.slice(0, 12)}.json`
        });
      }
      if (recovery.schemaVersion !== "1.0.0")
        throw new ArtifactShareUiError(
          "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
          "Live room recovery version is invalid."
        );
      if (!exactKeys(prepared, [
        "schemaVersion",
        "kind",
        "protocolVersion",
        "id",
        "roomId",
        "reviewOf",
        "ttl",
        "ownerKey"
      ]) || prepared.schemaVersion !== "1.0.0" || prepared.kind !== "openplanr-live-room-preparation" || prepared.protocolVersion !== "2.0.0" || prepared.id !== prepared.roomId || !LIVE_ROOM_ID_RE.test(prepared.roomId ?? "") || !LIVE_ROOM_REVIEW_RE.test(prepared.reviewOf ?? "") || !Object.hasOwn(ARTIFACT_SHARE_TTLS2, prepared.ttl) || !record(prepared.ownerKey) || !exactKeys(prepared.ownerKey, ["algorithm", "encoding", "keyId", "value"]) || !record(prepared.ownerSigner) || !exactKeys(recovery, [
        "schemaVersion",
        "kind",
        "protocolVersion",
        "id",
        "roomId",
        "reviewOf",
        "ttl",
        "ownerKey",
        "url",
        "ownerUrl",
        "manageUrl",
        "ownerSigner"
      ]) || recovery.schemaVersion !== "1.0.0" || recovery.kind !== "openplanr-live-room-recovery" || recovery.protocolVersion !== "2.0.0" || recovery.id !== prepared.id || recovery.roomId !== prepared.roomId || recovery.reviewOf !== prepared.reviewOf || recovery.ttl !== prepared.ttl || JSON.stringify(recovery.ownerKey) !== JSON.stringify(prepared.ownerKey) || recovery.url !== prepared.url || recovery.ownerUrl !== prepared.ownerUrl || recovery.manageUrl !== prepared.manageUrl) {
        throw new ArtifactShareUiError(
          "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
          "Live room recovery custody does not match its prepared creation."
        );
      }
      validateLiveResultUrls(recovery);
      const signerCustody = normalizeOwnerCustody({
        signer: prepared.ownerSigner,
        secret: recovery.ownerSigner
      });
      if (prepared.ownerKey.algorithm !== signerCustody.signer.algorithm || prepared.ownerKey.encoding !== signerCustody.signer.encoding || prepared.ownerKey.keyId !== signerCustody.signer.keyId || prepared.ownerKey.value !== (signerCustody.signer.value ?? signerCustody.signer.publicKey)) {
        throw new ArtifactShareUiError(
          "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
          "Live room recovery owner key does not match its prepared signer."
        );
      }
      const serialized2 = `${JSON.stringify(recovery, null, 2)}
`;
      const byteLength2 = new TextEncoder().encode(serialized2).byteLength;
      if (byteLength2 < 2 || byteLength2 > OWNER_SECRET_MAX_BYTES) {
        throw new ArtifactShareUiError(
          "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
          "Live room recovery bundle exceeds its bounded export size."
        );
      }
      return Object.freeze({
        credential: prepared,
        signer: signerCustody.signer,
        serialized: serialized2,
        filename: `openplanr-live-room-recovery-${prepared.roomId.slice(0, 12)}.json`
      });
    }
    if (!record(value) || !record(value.signer) || !record(value.secret)) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
        "Live room owner custody could not be prepared safely."
      );
    }
    const { signer, secret } = value;
    if (signer.role !== "owner" || typeof signer.sign !== "function" || signer.algorithm !== "ECDSA-P256-SHA256" || signer.encoding !== "spki-base64url" || !LIVE_ROOM_KEY_ID_RE.test(signer.keyId ?? "") || !BASE64URL_RE.test(signer.value ?? signer.publicKey ?? "") || (signer.value ?? signer.publicKey).length < 64 || (signer.value ?? signer.publicKey).length > 512) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
        "Live room owner signer is invalid."
      );
    }
    if (!exactKeys(secret, [
      "schemaVersion",
      "kind",
      "role",
      "algorithm",
      "keyId",
      "publicKey",
      "privateKey"
    ]) || secret.schemaVersion !== "1.0.0" || secret.kind !== "openplanr-live-room-signer" || secret.role !== "owner" || secret.algorithm !== "ECDSA-P256-SHA256" || secret.keyId !== signer.keyId || secret.publicKey !== (signer.value ?? signer.publicKey) || !BASE64URL_RE.test(secret.publicKey ?? "") || !BASE64URL_RE.test(secret.privateKey ?? "") || secret.publicKey.length < 64 || secret.publicKey.length > 512 || secret.privateKey.length < 64 || secret.privateKey.length > 1024) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
        "Live room owner secret does not match its signer."
      );
    }
    const serialized = `${JSON.stringify(secret, null, 2)}
`;
    const byteLength = new TextEncoder().encode(serialized).byteLength;
    if (byteLength < 2 || byteLength > OWNER_SECRET_MAX_BYTES) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_OWNER_CUSTODY_INVALID",
        "Live room owner secret exceeds its bounded export size."
      );
    }
    return Object.freeze({
      credential: signer,
      signer,
      serialized,
      filename: `openplanr-live-room-owner-${signer.keyId.slice(7, 19)}.json`
    });
  }
  function defaultSaveOwnerCustody(document2, window, { filename, serialized }) {
    if (typeof window?.Blob !== "function" || typeof window?.URL?.createObjectURL !== "function" || typeof window?.URL?.revokeObjectURL !== "function" || typeof document2?.createElement !== "function" || !document2.body) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_OWNER_CUSTODY_UNAVAILABLE",
        "This browser cannot save the private owner key. No room was created."
      );
    }
    const blobUrl = window.URL.createObjectURL(
      new window.Blob([serialized], { type: "application/json;charset=utf-8" })
    );
    try {
      const anchor2 = document2.createElement("a");
      anchor2.hidden = true;
      anchor2.href = blobUrl;
      anchor2.download = filename;
      anchor2.rel = "noreferrer";
      document2.body.append(anchor2);
      anchor2.click();
      anchor2.remove();
    } catch (error) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_OWNER_CUSTODY_UNAVAILABLE",
        "The private owner key could not be handed to the browser download manager. No room was created.",
        { cause: error?.name }
      );
    } finally {
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 0);
    }
    return true;
  }
  async function establishArtifactOwnerCustody({
    prepareOwnerCustody,
    saveOwnerCustody
  } = {}) {
    if (typeof prepareOwnerCustody !== "function" || typeof saveOwnerCustody !== "function") {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_OWNER_CUSTODY_REQUIRED",
        "Live room creation requires explicit private owner-key custody. No room was created."
      );
    }
    const custody = normalizeOwnerCustody(await prepareOwnerCustody());
    const saved = await saveOwnerCustody(
      Object.freeze({
        filename: custody.filename,
        serialized: custody.serialized
      })
    );
    if (saved !== true && saved?.saved !== true) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_OWNER_CUSTODY_UNAVAILABLE",
        "Private owner-key custody was not confirmed. No room was created."
      );
    }
    return custody.credential;
  }
  function frozenResult(value) {
    if (!value || typeof value !== "object" || typeof value.url !== "string" || value.url.length === 0) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_RESULT_INVALID",
        "Share creation must return a non-empty review URL."
      );
    }
    if (!ARTIFACT_SHARE_TRANSPORTS.includes(value.transport)) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_RESULT_INVALID",
        "Share creation must return a known transport.",
        { field: "transport" }
      );
    }
    const deletionToken = text4(value.deletionToken);
    const ownerUrl = text4(value.ownerUrl);
    const manageUrl = text4(value.manageUrl);
    if (deletionToken && value.url.includes(deletionToken)) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_DELETION_TOKEN_LEAK",
        "The deletion token must never be included in the review URL."
      );
    }
    if (value.transport === "live") {
      validateLiveResultUrls({ url: value.url, ownerUrl, manageUrl });
    } else if (ownerUrl || manageUrl) {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_RESULT_INVALID",
        "Snapshot creation cannot return live room capabilities."
      );
    }
    return Object.freeze({
      transport: value.transport,
      url: value.url,
      ownerUrl,
      manageUrl,
      deletionToken,
      expiresAt: text4(value.expiresAt)
    });
  }
  function normalizeArtifactSharePreview(value = {}) {
    const preview = value && typeof value === "object" ? value : {};
    const fragmentLength = count(preview.fragmentLength, "fragmentLength");
    return Object.freeze({
      fragmentLength,
      compressedBytes: count(preview.compressedBytes, "compressedBytes"),
      ciphertextBytes: count(preview.ciphertextBytes, "ciphertextBytes"),
      fragmentEligible: fragmentLength <= ARTIFACT_SHARE_FRAGMENT_LIMIT
    });
  }
  function freezeState(value) {
    return Object.freeze({
      open: Boolean(value.open),
      phase: member(value.phase, PHASES, "idle"),
      transport: member(value.transport, ARTIFACT_SHARE_TRANSPORTS, "live"),
      ttl: Object.hasOwn(ARTIFACT_SHARE_TTLS2, value.ttl) ? value.ttl : "7d",
      preview: value.preview ? normalizeArtifactSharePreview(value.preview) : null,
      ownerCustodyEstablished: Boolean(value.ownerCustodyEstablished),
      result: value.result ? frozenResult(value.result) : null,
      error: text4(value.error)
    });
  }
  function createArtifactShareDialogState({ preview, ttl = "7d" } = {}) {
    const normalizedPreview = preview ? normalizeArtifactSharePreview(preview) : null;
    return freezeState({
      open: false,
      phase: normalizedPreview ? "ready" : "idle",
      transport: "live",
      ttl,
      preview: normalizedPreview,
      ownerCustodyEstablished: false,
      result: null,
      error: ""
    });
  }
  function reduceArtifactShareDialog(state, action = {}) {
    const current = state ?? createArtifactShareDialogState();
    if (current.phase === "created" && action.type !== "close") return current;
    if (current.phase === "ambiguous" && !["create-start", "create-success", "failure"].includes(action.type))
      return current;
    if (current.phase === "custody-ready" && ["select-transport", "set-ttl"].includes(action.type))
      return current;
    switch (action.type) {
      case "open":
        return freezeState({
          ...current,
          open: true,
          ownerCustodyEstablished: false,
          result: null,
          error: ""
        });
      case "close":
        return freezeState({
          ...current,
          open: false,
          phase: current.preview ? "ready" : "idle",
          ownerCustodyEstablished: false,
          error: ""
        });
      case "preview-start":
        return freezeState({
          ...current,
          open: true,
          phase: "previewing",
          preview: null,
          ownerCustodyEstablished: false,
          result: null,
          error: ""
        });
      case "preview-ready": {
        const preview = normalizeArtifactSharePreview(action.preview);
        return freezeState({
          ...current,
          phase: "ready",
          preview,
          ownerCustodyEstablished: false,
          transport: current.transport === "fragment" && !preview.fragmentEligible ? "short" : current.transport,
          result: null,
          error: ""
        });
      }
      case "select-transport": {
        const transport = member(action.transport, ARTIFACT_SHARE_TRANSPORTS, current.transport);
        if (transport === "fragment" && current.preview?.fragmentEligible === false) return current;
        return transport === current.transport ? current : freezeState({
          ...current,
          phase: current.preview ? "ready" : "idle",
          transport,
          ownerCustodyEstablished: false,
          result: null,
          error: ""
        });
      }
      case "set-ttl": {
        const ttl = Object.hasOwn(ARTIFACT_SHARE_TTLS2, action.ttl) ? action.ttl : current.ttl;
        return ttl === current.ttl ? current : freezeState({ ...current, ttl, result: null, error: "" });
      }
      case "custody-start":
        return freezeState({
          ...current,
          phase: "custody-preparing",
          ownerCustodyEstablished: false,
          result: null,
          error: ""
        });
      case "custody-ready":
        return freezeState({
          ...current,
          phase: "custody-ready",
          ownerCustodyEstablished: true,
          result: null,
          error: ""
        });
      case "create-start":
        return freezeState({ ...current, phase: "creating", result: null, error: "" });
      case "create-success":
        return freezeState({ ...current, phase: "created", result: action.result, error: "" });
      case "failure":
        return freezeState({
          ...current,
          phase: action.ambiguous ? "ambiguous" : "error",
          ownerCustodyEstablished: Boolean(action.ownerCustodyEstablished),
          result: null,
          error: text4(action.error, "Share creation failed.")
        });
      default:
        return current;
    }
  }
  function artifactShareExpiry(ttl, now = /* @__PURE__ */ new Date()) {
    const choice = ARTIFACT_SHARE_TTLS2[ttl] ?? ARTIFACT_SHARE_TTLS2["7d"];
    const base = now instanceof Date ? now.getTime() : new Date(now).getTime();
    if (!Number.isFinite(base)) throw new TypeError("Share expiry requires a valid date.");
    return new Date(base + choice.milliseconds).toISOString();
  }
  function formatArtifactShareBytes(value) {
    const bytes = count(value, "bytes");
    if (bytes < 1e3) return `${bytes} B`;
    if (bytes < 1e6) return `${(bytes / 1e3).toFixed(bytes >= 1e4 ? 0 : 1)} KB`;
    return `${(bytes / 1e6).toFixed(1)} MB`;
  }
  function focusableElements(dialog) {
    return [
      ...dialog.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )
    ].filter((element) => !element.hidden && !element.closest("[hidden]"));
  }
  function defaultCopy(window, value) {
    if (typeof window?.navigator?.clipboard?.writeText !== "function") {
      throw new ArtifactShareUiError(
        "E_ARTIFACT_SHARE_CLIPBOARD_UNAVAILABLE",
        "Clipboard access is unavailable. Copy the value manually."
      );
    }
    return window.navigator.clipboard.writeText(value);
  }
  function reviewForShare(stageController) {
    return stageController?.review?.getReview?.() ?? null;
  }
  function artifactShareCapabilities({
    prepareShare,
    prepareOwnerCustody,
    createShare,
    supportedTransports
  } = {}) {
    const canCreate = typeof prepareShare === "function" && typeof createShare === "function";
    return Object.freeze(
      ARTIFACT_SHARE_TRANSPORTS.filter(
        (transport) => canCreate && (transport !== "live" || typeof prepareOwnerCustody === "function") && (supportedTransports === void 0 || Array.isArray(supportedTransports) && supportedTransports.includes(transport))
      )
    );
  }
  function mountArtifactShareDialog({
    document: document2 = globalThis.document,
    window = document2?.defaultView,
    root = document2?.querySelector?.(".planr-shell"),
    stageController,
    prepareShare,
    prepareOwnerCustody,
    saveOwnerCustody,
    createShare,
    supportedTransports,
    unavailableReason,
    copyText,
    existingRoom = false,
    existingShareUrl = null,
    now = () => /* @__PURE__ */ new Date()
  } = {}) {
    if (!document2 || !window || !root) return null;
    const backdrop = document2.querySelector("[data-planr-share-dialog]");
    const dialog = backdrop?.querySelector('[role="dialog"]');
    const trigger = root.querySelector('[data-planr-action="share"]');
    if (!backdrop || !dialog || !trigger) return null;
    let state = createArtifactShareDialogState();
    const capabilities = artifactShareCapabilities({
      prepareShare,
      prepareOwnerCustody,
      createShare,
      supportedTransports
    });
    const unavailable = text4(unavailableReason) || "Sharing is not configured in this viewer. Open the review with an updated OpenPlanr installation that supports sharing.";
    let returnFocus = null;
    let generation = 0;
    let pendingOwnerCustody = null;
    const copyResetTimers = /* @__PURE__ */ new Map();
    const cleanup = [];
    const handlers = {
      prepareShare: typeof prepareShare === "function" ? prepareShare : null,
      prepareOwnerCustody: typeof prepareOwnerCustody === "function" ? prepareOwnerCustody : null,
      saveOwnerCustody: typeof saveOwnerCustody === "function" ? saveOwnerCustody : (value) => defaultSaveOwnerCustody(document2, window, value),
      createShare: typeof createShare === "function" ? createShare : null,
      copyText: typeof copyText === "function" ? copyText : (value) => defaultCopy(window, value)
    };
    const stableShareUrl = typeof existingShareUrl === "function" ? existingShareUrl : () => existingShareUrl;
    function supports(transport) {
      return capabilities.includes(transport) && (transport !== "fragment" || state.preview?.fragmentEligible !== false);
    }
    function selectSupportedTransport() {
      if (!supports(state.transport)) {
        const transport = capabilities.find(supports);
        if (transport)
          state = reduceArtifactShareDialog(state, { type: "select-transport", transport });
      }
    }
    function listen(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      cleanup.push(() => target.removeEventListener(type, handler, options));
    }
    function announce2(message) {
      const live = dialog.querySelector("[data-planr-share-status]");
      if (live) live.textContent = message;
    }
    function resetCopyButton(button) {
      const timer = copyResetTimers.get(button);
      if (timer) window.clearTimeout(timer);
      copyResetTimers.delete(button);
      button.removeAttribute("data-planr-copy-state");
      const label = button.querySelector?.(".planr-action-label");
      if (label) label.textContent = button.dataset.planrCopyLabel ?? label.textContent;
      else button.textContent = button.dataset.planrCopyLabel ?? button.textContent;
    }
    function showCopyState(button, stateValue) {
      if (!button) return;
      const label = button.querySelector?.(".planr-action-label");
      if (!button.dataset.planrCopyLabel) {
        button.dataset.planrCopyLabel = (label?.textContent ?? button.textContent).trim();
      }
      const prior = copyResetTimers.get(button);
      if (prior) window.clearTimeout(prior);
      button.dataset.planrCopyState = stateValue;
      if (label) label.textContent = stateValue === "copied" ? "Copied" : "Try again";
      else button.textContent = stateValue === "copied" ? "Copied" : "Try again";
      copyResetTimers.set(
        button,
        window.setTimeout(() => resetCopyButton(button), 1800)
      );
    }
    function resetCopyButtons() {
      for (const button of dialog.querySelectorAll("[data-planr-copy-state]"))
        resetCopyButton(button);
    }
    function clearPendingOwnerSigner() {
      pendingOwnerCustody = null;
    }
    function pendingOwnerSigner() {
      return pendingOwnerCustody?.ownerSigner ?? pendingOwnerCustody;
    }
    async function copyExistingRoom() {
      const value = stableShareUrl();
      if (!value) return;
      try {
        await handlers.copyText(value);
        showCopyState(trigger, "copied");
        announce2("Live review URL copied. This remains the same collaboration room.");
      } catch (error) {
        showCopyState(trigger, "error");
        announce2(error?.message ?? "Review URL could not be copied.");
      }
    }
    function render() {
      const preview = state.preview;
      backdrop.hidden = !state.open;
      backdrop.style.pointerEvents = state.open ? "auto" : "";
      root.toggleAttribute("inert", state.open);
      root.setAttribute("aria-hidden", String(state.open));
      if (!state.open) root.removeAttribute("aria-hidden");
      dialog.dataset.planrSharePhase = state.phase;
      dialog.dataset.planrShareSelected = state.transport;
      for (const button of dialog.querySelectorAll("[data-planr-share-transport]")) {
        const transport = button.dataset.planrShareTransport;
        const selected = transport === state.transport;
        button.hidden = state.phase === "created";
        button.setAttribute("aria-pressed", String(selected));
        button.classList.toggle("is-selected", selected);
        button.disabled = [
          "previewing",
          "custody-preparing",
          "custody-ready",
          "creating",
          "ambiguous",
          "created"
        ].includes(state.phase) || !supports(transport);
        button.setAttribute("aria-disabled", String(button.disabled));
        button.title = capabilities.includes(transport) ? "" : transport === "live" && capabilities.length ? "Live review requires this host to provide private owner-key custody. Choose an available snapshot option." : unavailable;
        if (transport === "live")
          button.querySelector(".planr-share-receipt-size").textContent = capabilities.includes(
            "live"
          ) ? "Default" : "Unavailable";
      }
      const fragmentSize = dialog.querySelector("[data-planr-share-fragment-size]");
      if (fragmentSize)
        fragmentSize.textContent = !capabilities.includes("fragment") ? "Unavailable" : preview ? `${preview.fragmentLength.toLocaleString("en-US")} chars · ${formatArtifactShareBytes(preview.compressedBytes)}` : state.phase === "previewing" ? "Calculating…" : "Size unavailable";
      const shortSize = dialog.querySelector("[data-planr-share-short-size]");
      if (shortSize)
        shortSize.textContent = !capabilities.includes("short") ? "Unavailable" : preview ? formatArtifactShareBytes(preview.ciphertextBytes) : state.phase === "previewing" ? "Calculating…" : "Size unavailable";
      const threshold = dialog.querySelector("[data-planr-share-threshold]");
      if (threshold) {
        threshold.hidden = !capabilities.includes("fragment");
        threshold.textContent = preview?.fragmentEligible === false ? `Private fragment snapshot unavailable (${preview.fragmentLength.toLocaleString("en-US")} characters; 8,000 limit). Choose an available sharing option.` : preview ? "Private fragment snapshot available for links up to 8,000 characters." : "Preparing the snapshot size before sharing.";
      }
      const ttlRow = dialog.querySelector("[data-planr-share-ttl-row]");
      if (ttlRow)
        ttlRow.hidden = state.phase === "created" || !supports(state.transport) || !["live", "short"].includes(state.transport);
      const ttlSelect2 = dialog.querySelector("[data-planr-share-ttl]");
      if (ttlSelect2) {
        ttlSelect2.value = state.ttl;
        ttlSelect2.disabled = [
          "custody-preparing",
          "custody-ready",
          "creating",
          "ambiguous",
          "created"
        ].includes(state.phase);
      }
      const expiry = artifactShareExpiry(state.ttl, now());
      const expiryNode = dialog.querySelector("[data-planr-share-expiry]");
      if (expiryNode) {
        expiryNode.dateTime = expiry;
        expiryNode.textContent = new Intl.DateTimeFormat("en", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC"
        }).format(new Date(expiry));
      }
      const primary = dialog.querySelector("[data-planr-share-confirm]");
      if (primary) {
        primary.hidden = state.phase === "created";
        primary.disabled = !supports(state.transport) || !preview && state.phase !== "error" || state.phase === "previewing" || state.phase === "custody-preparing" || state.phase === "creating" || state.phase === "created";
        primary.textContent = !supports(state.transport) ? "Sharing unavailable" : state.phase === "error" && !preview ? "Retry preparation" : state.phase === "custody-preparing" ? "Preparing owner key…" : state.phase === "creating" ? "Creating…" : state.phase === "ambiguous" ? "Retry exact room creation" : state.transport === "live" ? state.ownerCustodyEstablished ? state.phase === "error" ? "Retry live review room" : "I saved it — create live room" : "Download recovery bundle" : state.transport === "short" ? "Create encrypted link" : "Copy private link";
      }
      for (const closeControl of dialog.querySelectorAll(
        "[data-planr-share-close], [data-planr-share-cancel]"
      )) {
        const closeBlocked = state.phase === "creating" || state.phase === "ambiguous";
        closeControl.disabled = closeBlocked;
        closeControl.setAttribute("aria-disabled", String(closeBlocked));
      }
      const custody = dialog.querySelector("[data-planr-share-owner-custody]");
      if (custody)
        custody.hidden = state.transport !== "live" || !supports("live") || state.phase === "created";
      const custodyStatus = dialog.querySelector("[data-planr-share-owner-custody-status]");
      if (custodyStatus)
        custodyStatus.textContent = state.ownerCustodyEstablished ? "Full recovery bundle handed to the browser. It contains the three scoped URLs and owner key; no room exists until you confirm creation." : "No room will be created until the full private recovery bundle is downloaded successfully.";
      const receipt2 = dialog.querySelector("[data-planr-share-result]");
      if (receipt2) receipt2.hidden = state.phase !== "created" || !state.result;
      const resultUrl = dialog.querySelector("[data-planr-share-url]");
      if (resultUrl) resultUrl.value = state.result?.url ?? "";
      const owner = dialog.querySelector("[data-planr-share-owner]");
      if (owner) owner.hidden = !state.result?.ownerUrl;
      const ownerUrl = dialog.querySelector("[data-planr-share-owner-url]");
      if (ownerUrl) ownerUrl.value = state.result?.ownerUrl ?? "";
      const manage = dialog.querySelector("[data-planr-share-manage]");
      if (manage) manage.hidden = !state.result?.manageUrl;
      const manageUrl = dialog.querySelector("[data-planr-share-manage-url]");
      if (manageUrl) manageUrl.value = state.result?.manageUrl ?? "";
      const deletion = dialog.querySelector("[data-planr-share-deletion]");
      if (deletion) deletion.hidden = !state.result?.deletionToken;
      const deletionToken = dialog.querySelector("[data-planr-share-deletion-token]");
      if (deletionToken) deletionToken.textContent = state.result?.deletionToken ?? "";
      const error = dialog.querySelector("[data-planr-share-error]");
      if (error) {
        error.hidden = !state.error;
        error.textContent = state.error;
      }
    }
    async function open() {
      clearPendingOwnerSigner();
      resetCopyButtons();
      if (!state.open)
        returnFocus = document2.activeElement instanceof window.HTMLElement ? document2.activeElement : trigger;
      state = reduceArtifactShareDialog(state, { type: "open" });
      state = reduceArtifactShareDialog(state, { type: "preview-start" });
      selectSupportedTransport();
      state = reduceArtifactShareDialog(state, { type: "preview-start" });
      render();
      dialog.querySelector("[data-planr-share-close]")?.focus();
      const request = ++generation;
      try {
        if (!capabilities.length)
          throw new ArtifactShareUiError("E_ARTIFACT_SHARE_HANDLER_REQUIRED", unavailable);
        const preview = await handlers.prepareShare(
          Object.freeze({
            review: reviewForShare(stageController),
            fragmentLimit: ARTIFACT_SHARE_FRAGMENT_LIMIT
          })
        );
        if (request !== generation || !state.open) return state;
        state = reduceArtifactShareDialog(state, { type: "preview-ready", preview });
        selectSupportedTransport();
        if (!supports(state.transport))
          throw new ArtifactShareUiError(
            "E_ARTIFACT_SHARE_TRANSPORT_UNAVAILABLE",
            "This review is too large for the sharing options supported by this viewer. Open it with an updated OpenPlanr installation or export the review."
          );
        render();
        announce2(
          capabilities.includes("fragment") && state.preview.fragmentEligible ? "Private fragment is available. Nothing will be uploaded." : "Review prepared. Choose an available sharing option."
        );
      } catch (error) {
        if (request !== generation || !state.open) return state;
        state = reduceArtifactShareDialog(state, { type: "failure", error: error?.message });
        render();
        announce2(state.error);
      }
      return state;
    }
    function close() {
      if (state.phase === "creating" || state.phase === "ambiguous") {
        announce2(
          state.phase === "ambiguous" ? "Room creation may have completed. Retry the exact attempt until its receipt is shown." : "Room creation is in progress. Keep this dialog open until its receipt is shown."
        );
        return state;
      }
      generation += 1;
      clearPendingOwnerSigner();
      state = reduceArtifactShareDialog(state, { type: "close" });
      resetCopyButtons();
      render();
      returnFocus?.focus?.();
      returnFocus = null;
      return state;
    }
    async function confirm() {
      if (!state.open || !supports(state.transport)) return state;
      if (!state.preview && state.phase === "error") return open();
      if (!state.preview || ["custody-preparing", "creating", "created"].includes(state.phase))
        return state;
      const transport = state.transport;
      const request = generation;
      if (transport === "live" && !state.ownerCustodyEstablished) {
        state = reduceArtifactShareDialog(state, { type: "custody-start" });
        render();
        try {
          const custody = await establishArtifactOwnerCustody({
            prepareOwnerCustody: () => handlers.prepareOwnerCustody(
              Object.freeze({
                review: reviewForShare(stageController),
                ttl: state.ttl
              })
            ),
            saveOwnerCustody: handlers.saveOwnerCustody
          });
          if (request !== generation || !state.open) return state;
          pendingOwnerCustody = custody;
          state = reduceArtifactShareDialog(state, { type: "custody-ready" });
          render();
          announce2(
            "Private recovery-bundle download started. Verify the file is saved, then confirm room creation."
          );
        } catch (error) {
          if (request !== generation || !state.open) return state;
          clearPendingOwnerSigner();
          state = reduceArtifactShareDialog(state, {
            type: "failure",
            ownerCustodyEstablished: false,
            error: error?.message
          });
          render();
          announce2(state.error);
        }
        return state;
      }
      if (transport === "live" && !pendingOwnerCustody) {
        state = reduceArtifactShareDialog(state, {
          type: "failure",
          ownerCustodyEstablished: false,
          error: "The prepared recovery attempt is no longer available. Download a new bundle before creating a room."
        });
        render();
        announce2(state.error);
        return state;
      }
      state = reduceArtifactShareDialog(state, { type: "create-start" });
      render();
      try {
        const input = {
          review: reviewForShare(stageController),
          preview: state.preview,
          transport,
          ttl: ["live", "short"].includes(transport) ? state.ttl : void 0,
          confirmed: ["live", "short"].includes(transport)
        };
        if (transport === "live") {
          if (pendingOwnerCustody?.kind === "openplanr-live-room-preparation") {
            Object.defineProperty(input, "prepared", {
              enumerable: false,
              value: pendingOwnerCustody
            });
          } else {
            Object.defineProperty(input, "ownerSigner", {
              enumerable: false,
              value: pendingOwnerCustody
            });
          }
        }
        const result = await handlers.createShare(Object.freeze(input));
        if (request !== generation || !state.open) return state;
        if (transport === "live" && result?.ownerSigner !== pendingOwnerSigner()) {
          throw new ArtifactShareUiError(
            "E_ARTIFACT_SHARE_OWNER_CUSTODY_MISMATCH",
            "The created room did not bind the prepared owner key. Retry the exact prepared attempt.",
            { effect: "ambiguous" }
          );
        }
        state = reduceArtifactShareDialog(state, {
          type: "create-success",
          result: { ...result, transport }
        });
        clearPendingOwnerSigner();
        render();
        announce2(
          transport === "live" ? "Live room created. Keep the downloaded owner key with the separate owner-verdict URL; management cannot set a verdict." : transport === "short" ? "Encrypted short link copied. Store the one-time deletion token now." : "Private fragment copied. Nothing was uploaded."
        );
        try {
          await handlers.copyText(state.result.url);
          announce2(
            transport === "live" ? "Live review URL copied. Keep the downloaded owner key with the separate owner-verdict URL." : transport === "short" ? "Encrypted short link copied. Store the one-time deletion token now." : "Private fragment copied. Nothing was uploaded."
          );
        } catch {
          announce2(
            transport === "live" ? "Live room created. Copy the review and owner-verdict URLs manually; the room receipt remains visible." : "Share created. Copy the URL manually; the receipt remains visible."
          );
        }
      } catch (error) {
        if (request !== generation || !state.open) return state;
        const ambiguous = transport === "live" && error?.details?.effect === "ambiguous";
        if (transport === "live" && !ambiguous) clearPendingOwnerSigner();
        state = reduceArtifactShareDialog(state, {
          type: "failure",
          ambiguous,
          ownerCustodyEstablished: transport === "live" && Boolean(pendingOwnerCustody),
          error: error?.message
        });
        render();
        announce2(state.error);
      }
      return state;
    }
    async function copy(value, successMessage, button) {
      if (!value) return;
      try {
        await handlers.copyText(value);
        showCopyState(button, "copied");
        announce2(successMessage);
      } catch (error) {
        showCopyState(button, "error");
        announce2(
          error?.message ?? "The value could not be copied. The share receipt remains visible."
        );
      }
    }
    if (existingRoom) {
      const value = stableShareUrl();
      if (value) {
        const label = trigger.querySelector(".planr-action-label");
        if (label) label.textContent = "Copy link";
        else trigger.textContent = "Copy link";
        trigger.dataset.planrCopyLabel = "Copy link";
        trigger.dataset.planrTooltip = "Copy link";
        trigger.removeAttribute("aria-haspopup");
        trigger.setAttribute("aria-label", "Copy this live review room link");
        listen(trigger, "click", () => {
          void copyExistingRoom();
        });
      } else {
        trigger.hidden = true;
      }
    } else {
      listen(trigger, "click", open);
    }
    listen(backdrop, "click", (event) => {
      const button = event.target.closest?.("button");
      if (!button) return;
      if (button.dataset.planrShareClose !== void 0 || button.dataset.planrShareCancel !== void 0) {
        close();
        return;
      }
      if (button.dataset.planrShareTransport) {
        if (!supports(button.dataset.planrShareTransport)) return;
        if (["custody-ready", "creating", "ambiguous", "created"].includes(state.phase)) return;
        if (button.dataset.planrShareTransport !== state.transport) clearPendingOwnerSigner();
        state = reduceArtifactShareDialog(state, {
          type: "select-transport",
          transport: button.dataset.planrShareTransport
        });
        render();
        announce2(
          state.transport === "live" ? "Live encrypted review selected. Anyone with this link can comment." : state.transport === "short" ? "Encrypted short link selected. Creation requires confirmation." : "Private fragment selected. Nothing will be uploaded."
        );
        return;
      }
      if (button.dataset.planrShareConfirm !== void 0) {
        void confirm();
        return;
      }
      if (button.dataset.planrShareCopyUrl !== void 0) {
        void copy(state.result?.url, "Review URL copied.", button);
        return;
      }
      if (button.dataset.planrShareCopyOwner !== void 0) {
        void copy(
          state.result?.ownerUrl,
          "Private owner-verdict URL copied. It requires the matching downloaded owner key.",
          button
        );
        return;
      }
      if (button.dataset.planrShareCopyManage !== void 0) {
        void copy(
          state.result?.manageUrl,
          "Private management URL copied. It can pause, reopen, or delete the room, but cannot set a verdict.",
          button
        );
        return;
      }
      if (button.dataset.planrShareCopyDeletion !== void 0) {
        void copy(state.result?.deletionToken, "One-time deletion token copied.", button);
      }
    });
    const ttlSelect = dialog.querySelector("[data-planr-share-ttl]");
    if (ttlSelect)
      listen(ttlSelect, "change", () => {
        if (["custody-ready", "creating", "ambiguous", "created"].includes(state.phase)) {
          ttlSelect.value = state.ttl;
          return;
        }
        state = reduceArtifactShareDialog(state, { type: "set-ttl", ttl: ttlSelect.value });
        render();
        announce2(`Expiry set to ${ARTIFACT_SHARE_TTLS2[state.ttl].label}.`);
      });
    listen(
      document2,
      "keydown",
      (event) => {
        if (!state.open) return;
        if (event.key === "Escape") {
          event.preventDefault();
          close();
          return;
        }
        if (event.key !== "Tab") return;
        const focusable = focusableElements(dialog);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document2.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document2.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      },
      true
    );
    render();
    const controller = Object.freeze({
      getState: () => state,
      open,
      close,
      confirm,
      dispatch(action) {
        if (action.type === "select-transport" && !supports(action.transport)) return state;
        state = reduceArtifactShareDialog(state, action);
        render();
        return state;
      },
      destroy() {
        if (state.phase === "creating" || state.phase === "ambiguous") {
          announce2(
            state.phase === "ambiguous" ? "Room creation may have completed. Retry the exact attempt until its receipt is shown." : "Room creation is in progress. Keep this review open until its receipt is shown."
          );
          return false;
        }
        generation += 1;
        clearPendingOwnerSigner();
        for (const timer of copyResetTimers.values()) window.clearTimeout(timer);
        copyResetTimers.clear();
        for (const remove of cleanup.splice(0)) remove();
        if (state.open) {
          state = reduceArtifactShareDialog(state, { type: "close" });
          render();
        }
        return true;
      }
    });
    window.__openPlanrArtifactShare = controller;
    return controller;
  }

  // lib/artifact/ui/hosted-viewer.mjs
  var HOSTED_ARTIFACT_VIEWER_STATES = Object.freeze([
    "idle",
    "empty-hash",
    "loading",
    "ready",
    "invalid-version",
    "malformed-payload",
    "too-large",
    "paste-missing",
    "expired",
    "decryption-failed",
    "unsupported-browser",
    "network-error",
    "room-closed"
  ]);
  var HOSTED_ARTIFACT_STATE_COPY = Object.freeze({
    "empty-hash": Object.freeze({
      title: "Open a private review link",
      detail: "This page needs a complete OpenPlanr fragment or encrypted short-link URL.",
      action: ""
    }),
    loading: Object.freeze({
      title: "Loading private review",
      detail: "Validating the immutable payload before opening the artifact.",
      action: ""
    }),
    "invalid-version": Object.freeze({
      title: "This review version is not supported",
      detail: "Ask the sender to create a new link with a compatible OpenPlanr release.",
      action: ""
    }),
    "malformed-payload": Object.freeze({
      title: "This review link is incomplete",
      detail: "Copy the complete URL again, including everything after the # character.",
      action: ""
    }),
    "too-large": Object.freeze({
      title: "This private fragment is too large",
      detail: "Ask the sender to create an encrypted expiring short link instead.",
      action: ""
    }),
    "paste-missing": Object.freeze({
      title: "This encrypted review is unavailable",
      detail: "It may have been deleted. Ask the sender for a new immutable review link.",
      action: ""
    }),
    expired: Object.freeze({
      title: "This encrypted review expired",
      detail: "Ask the sender for a new immutable review link.",
      action: ""
    }),
    "decryption-failed": Object.freeze({
      title: "This key cannot decrypt the review",
      detail: "Use the complete link, including its private fragment key. The payload may also have been changed.",
      action: ""
    }),
    "unsupported-browser": Object.freeze({
      title: "Browser support is required",
      detail: "Use a current browser with raw DEFLATE and Web Crypto support.",
      action: ""
    }),
    "network-error": Object.freeze({
      title: "The encrypted review could not be loaded",
      detail: "Your link remains unchanged. Check the connection and try again safely.",
      action: "Try again"
    }),
    "room-closed": Object.freeze({
      title: "Comments are paused",
      detail: "This review remains available to read, but the owner has paused new feedback.",
      action: ""
    })
  });
  var HostedArtifactViewerError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "HostedArtifactViewerError";
      this.code = code;
      this.details = Object.freeze({ ...details });
    }
  };
  function freezeState2(value) {
    const status = HOSTED_ARTIFACT_VIEWER_STATES.includes(value.status) ? value.status : "idle";
    return Object.freeze({
      status,
      transport: ["fragment", "short", "room"].includes(value.transport) ? value.transport : null,
      request: value.request ? Object.freeze({ ...value.request }) : null,
      envelope: value.envelope ?? null,
      retryable: status === "network-error"
    });
  }
  function locationParts(location) {
    if (typeof location === "string") {
      const parsed = new URL(location, "https://share.openplanr.dev/");
      return { pathname: parsed.pathname, hash: parsed.hash };
    }
    return {
      pathname: typeof location?.pathname === "string" ? location.pathname : "/",
      hash: typeof location?.hash === "string" ? location.hash : ""
    };
  }
  function malformed(status, details = {}) {
    return Object.freeze({ ok: false, status, details: Object.freeze(details) });
  }
  function parseHostedArtifactLocation(location, { fragmentLimit = ARTIFACT_SHARE_FRAGMENT_LIMIT } = {}) {
    const { pathname, hash } = locationParts(location);
    const shortMatch = pathname.match(/^\/p\/([A-Za-z0-9_-]{1,128})\/?$/);
    if (shortMatch) {
      if (!hash.startsWith("#k=")) return malformed("malformed-payload", { transport: "short" });
      const key = hash.slice(3);
      if (!/^[A-Za-z0-9_-]{43}$/.test(key)) {
        return malformed("malformed-payload", { transport: "short" });
      }
      return Object.freeze({
        ok: true,
        transport: "short",
        id: shortMatch[1],
        key
      });
    }
    const roomMatch = pathname.match(/^\/r\/([A-Za-z0-9_-]{16,128})\/?$/);
    if (roomMatch) {
      const params = new URLSearchParams(hash.slice(1));
      const key = params.get("k");
      const readCapability = params.get("r");
      const write = params.get("w");
      const owner = params.get("o");
      const manage = params.get("m");
      const authority = [write, owner, manage].filter(Boolean);
      if (!key || !/^[A-Za-z0-9_-]{43}$/.test(key) || authority.length > 1 || readCapability !== null && (!/^[A-Za-z0-9_-]{43}$/.test(readCapability) || params.size !== 2 + authority.length || [...params.keys()].some((name) => !["k", "r", "w", "o", "m"].includes(name)) || new Set(params.keys()).size !== params.size) || write && !/^[A-Za-z0-9_-]{43}$/.test(write) || owner && !/^[A-Za-z0-9_-]{43}$/.test(owner) || manage && !/^[A-Za-z0-9_-]{43}$/.test(manage)) {
        return malformed("malformed-payload", { transport: "room" });
      }
      return Object.freeze({
        ok: true,
        transport: "room",
        id: roomMatch[1],
        key,
        ...readCapability ? { readCapability } : {},
        ...write ? { write } : {},
        ...owner ? { owner } : {},
        ...manage ? { manage } : {}
      });
    }
    if (!hash || hash === "#") return malformed("empty-hash");
    const fragment = hash.slice(1);
    if (fragment.length > fragmentLimit) {
      return malformed("too-large", { fragmentLength: fragment.length, fragmentLimit });
    }
    if (!fragment.startsWith("v1.")) {
      return malformed(/^v\d+\./.test(fragment) ? "invalid-version" : "malformed-payload");
    }
    const payload = fragment.slice(3);
    if (!payload || !/^[A-Za-z0-9_-]+$/.test(payload)) return malformed("malformed-payload");
    return Object.freeze({ ok: true, transport: "fragment", version: "v1", payload });
  }
  function hostedArtifactStateForError(error) {
    const code = typeof error?.code === "string" ? error.code : "";
    if (["E_ARTIFACT_BROWSER_UNSUPPORTED", "E_ARTIFACT_CODEC_UNSUPPORTED"].includes(code)) {
      return "unsupported-browser";
    }
    if ([
      "E_ARTIFACT_FRAGMENT_TOO_LARGE",
      "E_ARTIFACT_PAYLOAD_TOO_LARGE",
      "E_ARTIFACT_DECOMPRESSION_LIMIT"
    ].includes(code)) {
      return "too-large";
    }
    if ([
      "E_ARTIFACT_PASTE_NOT_FOUND",
      "E_ARTIFACT_SHARE_NOT_FOUND",
      "E_ARTIFACT_PASTE_UNAVAILABLE"
    ].includes(code)) {
      return "paste-missing";
    }
    if (["E_ARTIFACT_PASTE_EXPIRED", "E_ARTIFACT_SHARE_EXPIRED"].includes(code)) {
      return "expired";
    }
    if ([
      "E_ARTIFACT_DECRYPTION_FAILED",
      "E_ARTIFACT_AUTH_FAILED",
      "E_ARTIFACT_PAYLOAD_TAMPERED",
      "OperationError"
    ].includes(code)) {
      return "decryption-failed";
    }
    if (["E_ARTIFACT_SHARE_NETWORK", "E_ARTIFACT_NETWORK", "E_ARTIFACT_FETCH_FAILED"].includes(code) || error?.name === "TypeError") {
      return "network-error";
    }
    if ([
      "E_ARTIFACT_VERSION_UNSUPPORTED",
      "E_ARTIFACT_FRAGMENT_VERSION",
      "E_ARTIFACT_FRAGMENT_VERSION_UNSUPPORTED"
    ].includes(code)) {
      return "invalid-version";
    }
    if (code === "E_ARTIFACT_PASTE_INVALID") return "malformed-payload";
    return "malformed-payload";
  }
  function setCopy(document2, status) {
    const copy = HOSTED_ARTIFACT_STATE_COPY[status] ?? { title: "", detail: "", action: "" };
    const title2 = document2.querySelector("[data-planr-hosted-title]");
    const detail = document2.querySelector("[data-planr-hosted-detail]");
    const action = document2.querySelector("[data-planr-hosted-retry]");
    if (title2) title2.textContent = copy.title;
    if (detail) detail.textContent = copy.detail;
    if (action) {
      action.textContent = copy.action;
      action.hidden = !copy.action;
    }
  }
  function mountHostedArtifactViewer({
    document: document2 = globalThis.document,
    window = document2?.defaultView,
    enabled = false,
    location = window?.location,
    decodeFragment,
    loadShort,
    loadRoom,
    onEnvelope,
    supportsTransport = () => true,
    fragmentLimit = ARTIFACT_SHARE_FRAGMENT_LIMIT
  } = {}) {
    if (!enabled || !document2 || !window) return null;
    const slot = document2.querySelector("[data-planr-hosted-viewer]");
    if (!slot) return null;
    let state = freezeState2({ status: "idle" });
    let generation = 0;
    const cleanup = [];
    function render() {
      const visible = !["idle", "ready"].includes(state.status);
      slot.hidden = !visible;
      slot.dataset.planrHostedState = state.status;
      slot.setAttribute("aria-busy", String(state.status === "loading"));
      setCopy(document2, state.status);
    }
    function setState(next) {
      state = freezeState2(next);
      render();
      return state;
    }
    async function load() {
      const parsed = parseHostedArtifactLocation(location, { fragmentLimit });
      if (!parsed.ok) return setState({ status: parsed.status });
      const request = parsed.transport === "fragment" ? { transport: "fragment", version: parsed.version, payload: parsed.payload } : {
        transport: parsed.transport,
        id: parsed.id,
        key: parsed.key,
        ...parsed.readCapability ? { readCapability: parsed.readCapability } : {},
        ...parsed.write ? { write: parsed.write } : {},
        ...parsed.owner ? { owner: parsed.owner } : {},
        ...parsed.manage ? { manage: parsed.manage } : {}
      };
      if (!supportsTransport(parsed.transport)) {
        return setState({ status: "unsupported-browser", transport: parsed.transport, request });
      }
      const sequence = ++generation;
      setState({ status: "loading", transport: parsed.transport, request });
      try {
        const envelope2 = parsed.transport === "fragment" ? await (typeof decodeFragment === "function" ? decodeFragment(Object.freeze({ version: parsed.version, payload: parsed.payload })) : Promise.reject(
          new HostedArtifactViewerError(
            "E_ARTIFACT_CODEC_UNSUPPORTED",
            "No private-fragment decoder is installed."
          )
        )) : parsed.transport === "short" ? await (typeof loadShort === "function" ? loadShort(Object.freeze({ id: parsed.id, key: parsed.key })) : Promise.reject(
          new HostedArtifactViewerError(
            "E_ARTIFACT_BROWSER_UNSUPPORTED",
            "No encrypted short-link loader is installed."
          )
        )) : await (typeof loadRoom === "function" ? loadRoom(
          Object.freeze({
            id: parsed.id,
            key: parsed.key,
            ...parsed.readCapability ? { readCapability: parsed.readCapability } : {},
            ...parsed.write ? { write: parsed.write } : {},
            ...parsed.owner ? { owner: parsed.owner } : {},
            ...parsed.manage ? { manage: parsed.manage } : {}
          })
        ) : Promise.reject(
          new HostedArtifactViewerError(
            "E_ARTIFACT_BROWSER_UNSUPPORTED",
            "No live review room loader is installed."
          )
        ));
        if (sequence !== generation) return state;
        setState({ status: "ready", transport: parsed.transport, request, envelope: envelope2 });
        if (typeof onEnvelope === "function")
          await onEnvelope(envelope2, Object.freeze({ transport: parsed.transport }));
      } catch (error) {
        if (sequence !== generation) return state;
        setState({
          status: hostedArtifactStateForError(error),
          transport: parsed.transport,
          request
        });
      }
      return state;
    }
    function onClick(event) {
      if (!event.target.closest?.("[data-planr-hosted-retry]") || !state.retryable) return;
      void load();
    }
    slot.addEventListener("click", onClick);
    cleanup.push(() => slot.removeEventListener("click", onClick));
    render();
    const ready = load();
    const controller = Object.freeze({
      getState: () => state,
      ready,
      retry() {
        return state.retryable ? load() : Promise.resolve(state);
      },
      load,
      destroy() {
        generation += 1;
        for (const remove of cleanup.splice(0)) remove();
      }
    });
    window.__openPlanrHostedArtifactViewer = controller;
    return controller;
  }

  // lib/artifact/ui/stage-mount.mjs
  var ARTIFACT_STAGE_MOUNT_EVENT = "planr:artifact-stage-mount";
  function publishArtifactStage(window, stage) {
    window.__openPlanrArtifactStage = stage;
    window.dispatchEvent(new window.CustomEvent(ARTIFACT_STAGE_MOUNT_EVENT, { detail: stage }));
  }

  // lib/artifact/ui/stage-payload.mjs
  var PRESENTATIONS = Object.freeze(["document", "canvas"]);
  function positiveInteger(value, fallback) {
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }
  function freezeArtifactMetadata(artifact, index2) {
    if (!artifact || typeof artifact !== "object") {
      throw new TypeError(`Artifact ${index2 + 1} must be an object.`);
    }
    if (typeof artifact.id !== "string" || artifact.id.length === 0) {
      throw new TypeError(`Artifact ${index2 + 1} requires an id.`);
    }
    return Object.freeze({
      id: artifact.id,
      title: typeof artifact.title === "string" && artifact.title.length > 0 ? artifact.title : `Artifact ${index2 + 1}`,
      sha256: typeof artifact.sha256 === "string" ? artifact.sha256 : "",
      viewport: Object.freeze({
        width: positiveInteger(artifact.viewport?.width, 1440),
        height: positiveInteger(artifact.viewport?.height, 900)
      }),
      colorScheme: ["light", "dark"].includes(artifact.colorScheme) ? artifact.colorScheme : "light"
    });
  }
  function requestedArtifactId(value) {
    if (typeof value === "string") return value;
    return typeof value?.id === "string" ? value.id : "";
  }
  function availableId(artifacts, requested, fallback = "") {
    return artifacts.some(({ id: id7 }) => id7 === requested) ? requested : fallback;
  }
  function normalizeViewMode(value, artifactCount) {
    if (artifactCount < 2) return "single";
    return ["single", "variants", "split"].includes(value) ? value : "variants";
  }
  function createArtifactStagePayload(envelope2 = {}, { viewer } = {}) {
    const artifacts = Object.freeze(
      (Array.isArray(envelope2?.artifacts) ? envelope2.artifacts : []).map(freezeArtifactMetadata)
    );
    const sourceViewer = viewer && typeof viewer === "object" ? viewer : envelope2?.viewer && typeof envelope2.viewer === "object" ? envelope2.viewer : {};
    const firstId = artifacts[0]?.id ?? "";
    const activeArtifactId = availableId(
      artifacts,
      requestedArtifactId(sourceViewer.activeArtifactId),
      firstId
    );
    const mode = normalizeViewMode(sourceViewer.mode, artifacts.length);
    return Object.freeze({
      schemaVersion: "1.0.0",
      artifacts,
      viewer: Object.freeze({
        mode,
        activeArtifactId,
        ...PRESENTATIONS.includes(sourceViewer.presentation) ? { presentation: sourceViewer.presentation } : {}
      })
    });
  }

  // lib/artifact/ui/stage.mjs
  var ARTIFACT_STAGE_EVENTS = Object.freeze({
    change: "planr:stage-change",
    point: "planr:artifact-point",
    region: "planr:artifact-region",
    layout: "planr:artifact-layout",
    frameState: "planr:artifact-frame-state"
  });
  var ARTIFACT_STAGE_LIMITS = Object.freeze({
    defaultZoom: 72,
    minZoom: 25,
    maxZoom: 200,
    zoomStep: 10,
    maxDocumentWidth: 16384,
    maxDocumentHeight: 262144,
    defaultFrameBudget: 3,
    frameLoadTimeoutMs: 15e3
  });
  var VIEW_MODES = Object.freeze(["single", "variants", "split"]);
  var REVIEW_MODES = Object.freeze(["interact", "comment"]);
  var THEMES = Object.freeze(["auto", "light", "dark"]);
  var PRESENTATIONS2 = Object.freeze(["document", "canvas"]);
  var STATUSES = Object.freeze([
    "ready",
    "empty",
    "bundling",
    "loading",
    "invalid",
    "expired",
    "decryption-failed",
    "unsupported-browser"
  ]);
  var STATUS_COPY = Object.freeze({
    empty: Object.freeze({
      title: "No artifact content",
      detail: "Choose a bundled HTML artifact to begin this review."
    }),
    bundling: Object.freeze({
      title: "Bundling artifact",
      detail: "Packaging local scripts, styles, fonts, and images without network access."
    }),
    loading: Object.freeze({
      title: "Loading private review",
      detail: "Validating the envelope and frozen artifact viewport."
    }),
    invalid: Object.freeze({
      title: "This review is invalid",
      detail: "The artifact envelope could not be decoded or validated."
    }),
    expired: Object.freeze({
      title: "This encrypted review expired",
      detail: "Ask the sender for a new immutable review link."
    }),
    "decryption-failed": Object.freeze({
      title: "This key cannot decrypt the review",
      detail: "Use the complete link, including its private fragment key."
    }),
    "unsupported-browser": Object.freeze({
      title: "Browser support is required",
      detail: "Use a current browser with Blob URL support to review this artifact."
    })
  });
  function member2(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
  }
  function finite2(value, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }
  function clamp2(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function normalized2(value) {
    return Math.round(clamp2(finite2(value), 0, 1) * 1e6) / 1e6;
  }
  function artifactMetadata(artifact) {
    return Object.freeze({
      id: artifact.id,
      title: artifact.title,
      sha256: artifact.sha256,
      viewport: artifact.viewport,
      colorScheme: artifact.colorScheme
    });
  }
  function requestedArtifactId2(value) {
    if (typeof value === "string") return value;
    return typeof value?.id === "string" ? value.id : "";
  }
  function availableId2(artifacts, requested, fallback = "") {
    return artifacts.some(({ id: id7 }) => id7 === requested) ? requested : fallback;
  }
  function comparisonIdFor(artifacts, activeArtifactId, requested = "") {
    if (requested !== activeArtifactId && artifacts.some(({ id: id7 }) => id7 === requested))
      return requested;
    return artifacts.find(({ id: id7 }) => id7 !== activeArtifactId)?.id ?? "";
  }
  function normalizeViewMode2(value, artifactCount) {
    if (artifactCount < 2) return "single";
    return member2(value, VIEW_MODES, "variants");
  }
  function createArtifactStageState(payload = {}, shellModel = {}) {
    const artifacts = Object.freeze(
      (Array.isArray(payload?.artifacts) ? payload.artifacts : []).map(artifactMetadata)
    );
    const firstId = artifacts[0]?.id ?? "";
    const activeArtifactId = availableId2(
      artifacts,
      requestedArtifactId2(shellModel.activeArtifact ?? shellModel.activeArtifactId) || requestedArtifactId2(payload?.viewer?.activeArtifactId),
      firstId
    );
    const comparisonArtifactId = comparisonIdFor(
      artifacts,
      activeArtifactId,
      requestedArtifactId2(shellModel.comparisonArtifact ?? shellModel.comparisonArtifactId)
    );
    const statusFallback = artifacts.length === 0 ? "empty" : "ready";
    let status = member2(shellModel.status, STATUSES, statusFallback);
    if (artifacts.length === 0 && status === "ready") status = "empty";
    const viewMode = normalizeViewMode2(
      shellModel.viewMode ?? payload?.viewer?.mode,
      artifacts.length
    );
    const presentation = resolveArtifactPresentation(
      shellModel.presentation ?? payload?.viewer?.presentation,
      { viewMode, artifactCount: artifacts.length }
    );
    return Object.freeze({
      schemaVersion: "1.0.0",
      artifacts,
      activeArtifactId,
      comparisonArtifactId,
      viewMode,
      presentation,
      reviewMode: member2(shellModel.reviewMode, REVIEW_MODES, "interact"),
      zoom: clamp2(
        Number.isInteger(shellModel.zoom) ? shellModel.zoom : ARTIFACT_STAGE_LIMITS.defaultZoom,
        ARTIFACT_STAGE_LIMITS.minZoom,
        ARTIFACT_STAGE_LIMITS.maxZoom
      ),
      railOpen: shellModel.railOpen === void 0 ? presentation === "canvas" : Boolean(shellModel.railOpen),
      theme: member2(shellModel.theme, THEMES, "auto"),
      status
    });
  }
  function nextState(state, changes) {
    return Object.freeze({ ...state, ...changes });
  }
  function reduceArtifactStageState(state, action = {}) {
    switch (action.type) {
      case "set-active": {
        const id7 = availableId2(state.artifacts, action.artifactId);
        if (!id7 || id7 === state.activeArtifactId) return state;
        const comparisonArtifactId = id7 === state.comparisonArtifactId ? state.activeArtifactId : comparisonIdFor(state.artifacts, id7, state.comparisonArtifactId);
        return nextState(state, { activeArtifactId: id7, comparisonArtifactId });
      }
      case "set-comparison": {
        const id7 = comparisonIdFor(state.artifacts, state.activeArtifactId, action.artifactId);
        return id7 === state.comparisonArtifactId ? state : nextState(state, { comparisonArtifactId: id7 });
      }
      case "set-view-mode": {
        const viewMode = normalizeViewMode2(action.viewMode, state.artifacts.length);
        return viewMode === state.viewMode ? state : nextState(state, { viewMode });
      }
      case "set-review-mode": {
        const reviewMode = member2(action.reviewMode, REVIEW_MODES, state.reviewMode);
        return reviewMode === state.reviewMode ? state : nextState(state, { reviewMode });
      }
      case "set-zoom": {
        const zoom = clamp2(
          Math.round(finite2(action.zoom, state.zoom)),
          ARTIFACT_STAGE_LIMITS.minZoom,
          ARTIFACT_STAGE_LIMITS.maxZoom
        );
        return zoom === state.zoom ? state : nextState(state, { zoom });
      }
      case "zoom-by":
        return reduceArtifactStageState(state, {
          type: "set-zoom",
          zoom: state.zoom + finite2(action.delta)
        });
      case "set-rail-open": {
        const railOpen = Boolean(action.railOpen);
        return railOpen === state.railOpen ? state : nextState(state, { railOpen });
      }
      case "toggle-rail":
        return nextState(state, { railOpen: !state.railOpen });
      case "set-theme": {
        const theme = member2(action.theme, THEMES, state.theme);
        return theme === state.theme ? state : nextState(state, { theme });
      }
      case "cycle-theme": {
        const index2 = THEMES.indexOf(state.theme);
        return nextState(state, { theme: THEMES[(index2 + 1) % THEMES.length] });
      }
      case "set-status": {
        const status = member2(action.status, STATUSES, state.status);
        return status === state.status ? state : nextState(state, { status });
      }
      default:
        return state;
    }
  }
  function visibleArtifactIds(state) {
    if (!state.activeArtifactId) return Object.freeze([]);
    if (state.viewMode === "split" && state.comparisonArtifactId) {
      return Object.freeze([state.activeArtifactId, state.comparisonArtifactId]);
    }
    return Object.freeze([state.activeArtifactId]);
  }
  function assertRect2(rect) {
    if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.top) || !Number.isFinite(rect.width) || !Number.isFinite(rect.height) || rect.width <= 0 || rect.height <= 0) {
      throw new RangeError("Artifact bounds must have positive finite dimensions.");
    }
  }
  function clientPointToNormalized(rect, point2) {
    assertRect2(rect);
    return Object.freeze({
      x: normalized2((finite2(point2?.x ?? point2?.clientX) - rect.left) / rect.width),
      y: normalized2((finite2(point2?.y ?? point2?.clientY) - rect.top) / rect.height)
    });
  }
  function normalizedPointToClient(rect, point2) {
    assertRect2(rect);
    return Object.freeze({
      x: rect.left + normalized2(point2?.x) * rect.width,
      y: rect.top + normalized2(point2?.y) * rect.height
    });
  }
  function parseDataScript(document2, id7) {
    const node2 = document2.getElementById(id7);
    if (!node2) throw new Error(`Missing artifact shell data: ${id7}`);
    return JSON.parse(node2.textContent ?? "null");
  }
  function isEditableTarget(target) {
    const HTMLElement = target?.ownerDocument?.defaultView?.HTMLElement;
    return Boolean(
      HTMLElement && target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
    );
  }
  function stageArtifactById(state, id7) {
    return state.artifacts.find((artifact) => artifact.id === id7) ?? null;
  }
  function updateStatus(document2, state) {
    const statusPanel = document2.querySelector(".planr-stage-status");
    const surface = document2.querySelector(".planr-stage-surface");
    if (!statusPanel || !surface) return;
    const ready = state.status === "ready";
    statusPanel.hidden = ready;
    surface.toggleAttribute("inert", !ready);
    surface.setAttribute("aria-hidden", String(!ready));
    if (ready) surface.removeAttribute("aria-hidden");
    const copy = STATUS_COPY[state.status];
    if (copy) {
      const title2 = statusPanel.querySelector("strong");
      const detail = statusPanel.querySelector("p");
      if (title2) title2.textContent = copy.title;
      if (detail) detail.textContent = copy.detail;
    }
  }
  function emit(root, window, type, detail) {
    root.dispatchEvent(new window.CustomEvent(type, { detail, bubbles: true }));
  }
  async function htmlForSource(window, source) {
    if (typeof source === "string" && source.trimStart().startsWith("<")) return source;
    if (source && typeof source === "object" && typeof source.html === "string") return source.html;
    if (source instanceof window.Blob) return source.text();
    if (source instanceof window.ArrayBuffer) return new window.TextDecoder().decode(source);
    if (window.ArrayBuffer.isView(source)) {
      return new window.TextDecoder().decode(
        new window.Uint8Array(source.buffer, source.byteOffset, source.byteLength)
      );
    }
    return null;
  }
  function mountArtifactStage({
    document: document2 = globalThis.document,
    window = document2?.defaultView,
    resolveArtifactSource,
    sourceTransport = "blob",
    frameBudget: requestedFrameBudget,
    frameLoadTimeoutMs = ARTIFACT_STAGE_LIMITS.frameLoadTimeoutMs,
    bridgeClient,
    onState,
    review: reviewOptions = {},
    share: shareOptions = {},
    hosted: hostedOptions = {}
  } = {}) {
    if (!document2 || !window) return null;
    const root = document2.querySelector(".planr-shell");
    if (!root) return null;
    const initializationError = globalThis.__OPENPLANR_ARTIFACT_STAGE_INITIALIZATION_ERROR__;
    if (initializationError) {
      const status = root.querySelector('[data-planr-slot="status"]');
      if (status) {
        status.textContent = initializationError;
        status.setAttribute("data-error", "");
        status.setAttribute("role", "alert");
      }
      root.setAttribute("data-planr-initialization-error", "");
      return null;
    }
    if (!["blob", "srcdoc"].includes(sourceTransport)) {
      throw new TypeError("Artifact source transport must be blob or srcdoc.");
    }
    let payload;
    let shellModel;
    let reviewConfig;
    try {
      payload = parseDataScript(document2, "planr-artifact-stage-payload");
      shellModel = parseDataScript(document2, "planr-artifact-shell-model");
      reviewConfig = parseDataScript(document2, "planr-artifact-review-state");
    } catch {
      payload = { artifacts: [], viewer: { mode: "single", activeArtifactId: "" } };
      shellModel = { status: "invalid" };
      reviewConfig = { reviewOf: "0".repeat(64), review: null };
    }
    let state;
    try {
      state = createArtifactStageState(payload, shellModel);
    } catch {
      state = createArtifactStageState({}, { status: "invalid" });
    }
    const frames = new Map(
      [...document2.querySelectorAll("[data-planr-artifact-frame]")].map((frame) => [
        frame.dataset.planrArtifactFrame,
        frame
      ])
    );
    const panels = new Map(
      [...document2.querySelectorAll(".planr-artifact-panel[data-artifact-id]")].map((panel) => [
        panel.dataset.artifactId,
        panel
      ])
    );
    const documentLayouts = /* @__PURE__ */ new Map();
    const cleanup = [];
    const frameBudget = requestedFrameBudget === void 0 ? Number(root.dataset.planrFrameBudget || ARTIFACT_STAGE_LIMITS.defaultFrameBudget) : requestedFrameBudget;
    if (frameBudget !== null && (!Number.isInteger(frameBudget) || frameBudget < 1 || frameBudget > 8)) {
      throw new RangeError(
        "Artifact frame budget must be between 1 and 8, or null for eager loading."
      );
    }
    if (!Number.isInteger(frameLoadTimeoutMs) || frameLoadTimeoutMs < 1 || frameLoadTimeoutMs > 12e4) {
      throw new RangeError("Artifact frame load timeout must be between 1 and 120000 milliseconds.");
    }
    const frameDiagnostics = /* @__PURE__ */ new Map();
    const frameLoads = /* @__PURE__ */ new Map();
    const frameSlots = /* @__PURE__ */ new Map();
    if (frameBudget !== null) {
      for (const [id7, frame] of frames) {
        const host = frame.parentNode;
        if (!host || !root.contains(host) || frame.hasAttribute("src") || frame.hasAttribute("srcdoc"))
          continue;
        const placeholder = document2.createComment("Artifact preview");
        frameSlots.set(id7, { host, placeholder });
        host.replaceChild(placeholder, frame);
      }
    }
    let frameUse = 0;
    let frameQueue = Promise.resolve();
    let activationGeneration = 0;
    let disposed = false;
    for (const frame of frames.values()) frame.dataset.planrFrameState = "unloaded";
    function listen(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      cleanup.push(() => target.removeEventListener(type, handler, options));
    }
    function render({ announce: announce2 = false } = {}) {
      const visible = new Set(visibleArtifactIds(state));
      root.dataset.planrView = state.viewMode;
      root.dataset.planrReviewMode = state.reviewMode;
      root.dataset.planrState = state.status;
      root.dataset.planrRailOpen = String(state.railOpen);
      root.dataset.planrPresentation = state.presentation;
      document2.documentElement.dataset.planrPresentation = state.presentation;
      document2.documentElement.dataset.planrTheme = state.theme;
      const grid = document2.querySelector(".planr-frame-grid");
      const surface = document2.querySelector(".planr-stage-surface");
      const tablist = document2.querySelector(".planr-variants");
      const rail = document2.getElementById("planr-review-rail");
      const feedbackButton = document2.querySelector('[data-planr-action="feedback"]');
      const addCommentButton = document2.querySelector('[data-planr-action="add-comment"]');
      const themeButton = document2.querySelector('[data-planr-action="theme"]');
      const statusSlot = document2.querySelector('[data-planr-slot="status"]');
      const metadata = document2.querySelector(
        ".planr-toolbar:not([data-studio-react-chrome]) .planr-title-block > span"
      );
      const breadcrumb = document2.querySelector(".planr-stage-heading > span:first-child");
      const activeArtifact = stageArtifactById(state, state.activeArtifactId);
      if (grid) grid.dataset.planrLayout = state.viewMode;
      const visualOrder = state.viewMode === "split" ? [...visible, ...state.artifacts.map(({ id: id7 }) => id7).filter((id7) => !visible.has(id7))] : state.artifacts.map(({ id: id7 }) => id7);
      if (surface) surface.style.setProperty("--planr-shell-zoom", String(state.zoom / 100));
      if (tablist) tablist.hidden = state.viewMode === "single" || state.artifacts.length < 2;
      if (rail) {
        rail.toggleAttribute("inert", !state.railOpen);
        rail.setAttribute("aria-hidden", String(!state.railOpen));
        if (state.railOpen) rail.removeAttribute("aria-hidden");
      }
      if (feedbackButton) feedbackButton.setAttribute("aria-expanded", String(state.railOpen));
      if (addCommentButton) {
        const paused = root.hasAttribute("data-planr-room-comments-paused");
        addCommentButton.disabled = paused;
        addCommentButton.setAttribute("aria-pressed", String(state.reviewMode === "comment"));
        addCommentButton.setAttribute(
          "aria-label",
          paused ? "Add comment unavailable: comments are paused" : "Add comment"
        );
        addCommentButton.dataset.planrTooltip = paused ? "Comments are paused" : "Add comment (C)";
      }
      if (themeButton) {
        themeButton.textContent = state.theme;
        themeButton.setAttribute("aria-label", `Shell theme ${state.theme}`);
      }
      if (statusSlot)
        statusSlot.textContent = state.reviewMode === "comment" ? "Comment mode" : "Interactions enabled";
      if (metadata && activeArtifact) {
        metadata.textContent = `HTML · ${activeArtifact.viewport.width}×${activeArtifact.viewport.height}`;
      }
      if (breadcrumb)
        breadcrumb.textContent = `ARTIFACT / ${(activeArtifact?.title ?? "Artifact").toUpperCase()}`;
      for (const button of document2.querySelectorAll("[data-planr-view]")) {
        const mode = button.dataset.planrView;
        button.setAttribute("aria-pressed", String(mode === state.viewMode));
        button.disabled = state.artifacts.length < 2 && mode !== "single";
      }
      for (const button of document2.querySelectorAll("[data-planr-mode]")) {
        button.setAttribute("aria-pressed", String(button.dataset.planrMode === state.reviewMode));
      }
      for (const button of document2.querySelectorAll('[data-planr-action="zoom-reset"]')) {
        button.textContent = `${state.zoom}%`;
      }
      for (const tab of document2.querySelectorAll('[role="tab"][data-artifact-id]')) {
        const selected = tab.dataset.artifactId === state.activeArtifactId;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      }
      for (const [id7, panel] of panels) {
        const isVisible = visible.has(id7);
        const isPrimary = id7 === state.activeArtifactId;
        panel.hidden = !isVisible;
        panel.style.order = String(visualOrder.indexOf(id7));
        const artifact = stageArtifactById(state, id7);
        panel.setAttribute(
          "aria-label",
          `${isPrimary ? "Primary" : "Comparison"} artifact: ${artifact?.title ?? id7}`
        );
        const frame = frames.get(id7);
        const frameReady = frame?.dataset.planrFrameState === "ready";
        const annotationLayer = panel.querySelector("[data-planr-annotation-layer]");
        if (frame) {
          frame.tabIndex = isVisible && frameReady && state.status === "ready" && state.reviewMode === "interact" ? 0 : -1;
          if (state.presentation === "document") {
            frame.setAttribute("scrolling", "no");
            frame.style.overflow = "hidden";
          } else {
            frame.removeAttribute("scrolling");
            frame.style.removeProperty("overflow");
          }
        }
        if (annotationLayer) {
          const enabled = isVisible && frameReady && state.status === "ready" && state.reviewMode === "comment";
          const hasComposer = Boolean(
            annotationLayer.querySelector("[data-planr-annotation-composer]")
          );
          annotationLayer.tabIndex = enabled ? 0 : -1;
          annotationLayer.setAttribute("aria-disabled", String(!enabled && !hasComposer));
        }
      }
      updateStatus(document2, state);
      renderFrameLoadingStatus();
      if (typeof onState === "function") {
        try {
          onState(state);
        } catch {
        }
      }
      if (announce2) emit(root, window, ARTIFACT_STAGE_EVENTS.change, state);
    }
    function renderFrameLoadingStatus() {
      const activeDiagnostic = frameDiagnostics.get(state.activeArtifactId);
      const statusPanel = document2.querySelector(".planr-stage-status");
      if (!statusPanel || !activeDiagnostic) return;
      const detail = statusPanel.querySelector("p");
      if (detail && state.status === "loading") {
        const copy = {
          source: "Preparing the selected screen.",
          document: "Loading the selected screen.",
          bridge: "Connecting the selected screen to the review."
        };
        detail.textContent = copy[activeDiagnostic.phase] ?? "Loading the selected screen.";
      }
      if (detail && state.status === "invalid" && activeDiagnostic.status === "error") {
        detail.textContent = `The selected screen did not finish its ${activeDiagnostic.failedPhase ?? "preview"} step. Retry to load it again; saved feedback remains available.`;
      }
      let retry = statusPanel.querySelector('[data-planr-action="retry-frame"]');
      if (!retry) {
        retry = document2.createElement("button");
        retry.className = "planr-toolbar-action";
        retry.dataset.planrAction = "retry-frame";
        retry.textContent = "Retry screen";
        statusPanel.querySelector("div")?.append(retry);
      }
      retry.hidden = state.status !== "invalid" || activeDiagnostic.status !== "error";
    }
    function dispatch(action, { announce: announce2 = true } = {}) {
      const previous = state;
      state = reduceArtifactStageState(state, action);
      if (state !== previous) {
        render({ announce: announce2 });
        if (["set-active", "set-comparison", "set-view-mode"].includes(action.type) && typeof resolveArtifactSource === "function") {
          readyPromise = activateVisibleFrames();
        }
      }
      return state;
    }
    function setActiveFromTab(tab, { focus = false } = {}) {
      dispatch({ type: "set-active", artifactId: tab.dataset.artifactId });
      if (focus) tab.focus();
    }
    function onClick(event) {
      const target = event.target.closest?.("button");
      if (!target) return;
      if (target.hasAttribute("data-planr-close-feedback")) {
        dispatch({ type: "set-rail-open", railOpen: false });
        document2.querySelector('[data-planr-action="feedback"]')?.focus();
        return;
      }
      if (target.dataset.planrView) {
        dispatch({ type: "set-view-mode", viewMode: target.dataset.planrView });
        return;
      }
      if (target.dataset.artifactId && target.getAttribute("role") === "tab") {
        setActiveFromTab(target);
        return;
      }
      if (target.dataset.planrMode) {
        dispatch({ type: "set-review-mode", reviewMode: target.dataset.planrMode });
        return;
      }
      switch (target.dataset.planrAction) {
        case "add-comment":
          if (!root.hasAttribute("data-planr-room-comments-paused")) {
            dispatch({ type: "set-review-mode", reviewMode: "comment" });
          }
          break;
        case "zoom-out":
          dispatch({ type: "zoom-by", delta: -ARTIFACT_STAGE_LIMITS.zoomStep });
          break;
        case "zoom-reset":
          dispatch({ type: "set-zoom", zoom: ARTIFACT_STAGE_LIMITS.defaultZoom });
          break;
        case "zoom-in":
          dispatch({ type: "zoom-by", delta: ARTIFACT_STAGE_LIMITS.zoomStep });
          break;
        case "feedback": {
          const rail = document2.getElementById("planr-review-rail");
          if (state.railOpen && rail?.contains(document2.activeElement)) target.focus();
          dispatch({ type: "toggle-rail" });
          break;
        }
        case "more": {
          const menu = target.closest(".planr-more")?.querySelector(".planr-more-menu");
          if (!menu) break;
          const open = menu.hidden;
          menu.hidden = !open;
          target.setAttribute("aria-expanded", String(open));
          if (open) menu.querySelector('[role="menuitem"]')?.focus();
          break;
        }
        case "sharing-options":
          target.closest(".planr-more-menu").hidden = true;
          document2.querySelector('[data-planr-action="more"]')?.setAttribute("aria-expanded", "false");
          shareController?.open?.();
          break;
        case "retry-frame":
          void retryFrames([state.activeArtifactId]);
          break;
        case "theme":
          dispatch({ type: "cycle-theme" });
          break;
        default:
          break;
      }
    }
    function onKeyDown(event) {
      if (event.defaultPrevented) return;
      if (!event.altKey && !event.ctrlKey && !event.metaKey && !isEditableTarget(event.target)) {
        if (event.key.toLowerCase() === "i") {
          dispatch({ type: "set-review-mode", reviewMode: "interact" });
          return;
        }
        if (event.key.toLowerCase() === "c") {
          if (!root.hasAttribute("data-planr-room-comments-paused")) {
            dispatch({ type: "set-review-mode", reviewMode: "comment" });
            document2.querySelector('[data-planr-action="add-comment"]')?.focus();
          }
          return;
        }
        if (event.key === "Escape") {
          const more = document2.querySelector(".planr-more-menu:not([hidden])");
          if (more) {
            more.hidden = true;
            const trigger = document2.querySelector('[data-planr-action="more"]');
            trigger?.setAttribute("aria-expanded", "false");
            trigger?.focus();
            return;
          }
          if (state.presentation === "document" && state.reviewMode === "comment") {
            dispatch({ type: "set-review-mode", reviewMode: "interact" });
            document2.querySelector('[data-planr-action="add-comment"]')?.focus();
            return;
          }
          if (state.railOpen) {
            dispatch({ type: "set-rail-open", railOpen: false });
            document2.querySelector('[data-planr-action="feedback"]')?.focus();
            return;
          }
        }
      }
      const tab = event.target.closest?.('[role="tab"][data-artifact-id]');
      if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const tabs = [...document2.querySelectorAll('[role="tab"][data-artifact-id]')];
      const index2 = tabs.indexOf(tab);
      if (index2 < 0) return;
      event.preventDefault();
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index2 + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      setActiveFromTab(tabs[nextIndex], { focus: true });
    }
    function emitSelection(layer, start, end = start) {
      if (state.reviewMode !== "comment" || state.status !== "ready") return;
      const artifactId = layer.dataset.planrAnnotationLayer;
      if (!visibleArtifactIds(state).includes(artifactId)) return;
      const artifact = stageArtifactById(state, artifactId);
      if (!artifact) return;
      const region = clientSelectionToNormalized(layer.getBoundingClientRect(), start, end);
      const measured = state.presentation === "document" ? documentLayouts.get(artifactId) : null;
      const detail = Object.freeze({
        schemaVersion: "1.0.0",
        artifactId,
        region,
        viewport: measured ?? artifact.viewport
      });
      emit(root, window, ARTIFACT_STAGE_EVENTS.region, detail);
      emit(root, window, ARTIFACT_STAGE_EVENTS.point, detail);
      if (state.presentation === "document") {
        dispatch({ type: "set-review-mode", reviewMode: "interact" });
      }
    }
    for (const layer of document2.querySelectorAll("[data-planr-annotation-layer]")) {
      let selection = null;
      let selectionPreview = null;
      listen(layer, "pointerdown", (event) => {
        if (event.button !== 0 || state.reviewMode !== "comment" || state.status !== "ready") return;
        if (event.target !== layer) return;
        event.preventDefault();
        selection = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY } };
        layer.setPointerCapture?.(event.pointerId);
        selectionPreview = document2.createElement("span");
        selectionPreview.className = "planr-region-selection";
        selectionPreview.setAttribute("aria-hidden", "true");
        layer.append(selectionPreview);
      });
      listen(layer, "pointermove", (event) => {
        if (!selection || selection.pointerId !== event.pointerId || !selectionPreview) return;
        const region = clientSelectionToNormalized(layer.getBoundingClientRect(), selection.start, {
          x: event.clientX,
          y: event.clientY
        });
        selectionPreview.style.left = `${region.x * 100}%`;
        selectionPreview.style.top = `${region.y * 100}%`;
        selectionPreview.style.width = `${region.w * 100}%`;
        selectionPreview.style.height = `${region.h * 100}%`;
      });
      listen(layer, "pointercancel", (event) => {
        if (!selection || selection.pointerId !== event.pointerId) return;
        layer.releasePointerCapture?.(event.pointerId);
        selection = null;
        selectionPreview?.remove();
        selectionPreview = null;
      });
      listen(layer, "pointerup", (event) => {
        if (!selection || selection.pointerId !== event.pointerId) return;
        const start = selection.start;
        layer.releasePointerCapture?.(event.pointerId);
        selection = null;
        selectionPreview?.remove();
        selectionPreview = null;
        emitSelection(layer, start, { x: event.clientX, y: event.clientY });
      });
      listen(layer, "keydown", (event) => {
        if (!["Enter", " "].includes(event.key)) return;
        if (event.target !== layer) return;
        event.preventDefault();
        const bounds2 = layer.getBoundingClientRect();
        emitSelection(layer, {
          x: bounds2.left + bounds2.width / 2,
          y: bounds2.top + bounds2.height / 2
        });
      });
    }
    for (const [artifactId, frame] of frames) {
      listen(frame, ARTIFACT_STAGE_EVENTS.layout, (event) => {
        if (state.presentation !== "document") return;
        const width = event.detail?.width;
        const height = event.detail?.height;
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || width > ARTIFACT_STAGE_LIMITS.maxDocumentWidth || height < 1 || height > ARTIFACT_STAGE_LIMITS.maxDocumentHeight)
          return;
        const layout = Object.freeze({ width, height });
        documentLayouts.set(artifactId, layout);
        const panel = panels.get(artifactId);
        if (!panel) return;
        panel.dataset.planrLayoutMeasured = "true";
        panel.style.setProperty("--planr-document-width", `${width}px`);
        panel.style.setProperty("--planr-document-height", `${height}px`);
      });
    }
    listen(root, "click", onClick);
    listen(document2, "keydown", onKeyDown);
    listen(document2, "click", (event) => {
      const more = document2.querySelector(".planr-more-menu:not([hidden])");
      if (!more || event.target.closest?.(".planr-more")) return;
      more.hidden = true;
      document2.querySelector('[data-planr-action="more"]')?.setAttribute("aria-expanded", "false");
    });
    const roomStateObserver = typeof window.MutationObserver === "function" ? new window.MutationObserver(() => {
      if (root.hasAttribute("data-planr-room-comments-paused") && state.reviewMode === "comment") {
        dispatch({ type: "set-review-mode", reviewMode: "interact" });
      } else {
        render();
      }
    }) : null;
    roomStateObserver?.observe(root, {
      attributes: true,
      attributeFilter: ["data-planr-room-comments-paused"]
    });
    if (roomStateObserver) cleanup.push(() => roomStateObserver.disconnect());
    render();
    let readyPromise = Promise.resolve(state);
    let feedbackController = null;
    let annotationController = null;
    let shareController = null;
    let hostedController = null;
    function disposeStage() {
      if (disposed) return true;
      disposed = true;
      for (const id7 of [...frameLoads.keys()]) releaseFrame(id7);
      for (const remove of cleanup.splice(0)) remove();
      return true;
    }
    const controller = Object.freeze({
      frameBudget,
      ensureFrames,
      retryFrames,
      getFrameDiagnostics: () => [...frameDiagnostics.values()],
      getLoadedArtifactIds: () => [...frameLoads].filter(([, record2]) => record2.status === "ready").map(([id7]) => id7),
      getState: () => state,
      getFrame: (artifactId) => frames.get(artifactId) ?? null,
      getPanel: (artifactId) => panels.get(artifactId) ?? null,
      get review() {
        return feedbackController;
      },
      get annotations() {
        return annotationController;
      },
      get share() {
        return shareController;
      },
      get hosted() {
        return hostedController;
      },
      get ready() {
        return readyPromise;
      },
      dispatch,
      destroy() {
        if (["creating", "ambiguous"].includes(shareController?.getState?.().phase)) {
          shareController.destroy?.();
          return false;
        }
        return disposeStage();
      }
    });
    publishArtifactStage(window, controller);
    listen(window, "pagehide", (event) => {
      if (!event.persisted) disposeStage();
    });
    feedbackController = mountArtifactFeedbackRail({
      document: document2,
      window,
      root,
      stageController: controller,
      reviewOf: reviewConfig?.reviewOf,
      initialReview: reviewConfig?.review ?? null,
      artifacts: state.artifacts,
      ...reviewOptions
    });
    annotationController = mountArtifactAnnotations({
      document: document2,
      window,
      root,
      stageController: controller,
      reviewController: feedbackController
    });
    const durablePasteShare = shareOptions.createShare && shareOptions.resumePreparedShare ? createDurablePasteShare({
      scope: () => ({
        workspaceId: window.location.pathname,
        revisionId: reviewConfig.reviewOf ?? "unknown-revision",
        actorId: "local-paste-owner"
      }),
      create: (request) => shareOptions.createShare(request),
      commit: shareOptions.resumePreparedShare,
      indexedDB: window.indexedDB
    }) : null;
    if (durablePasteShare) cleanup.push(() => durablePasteShare.close());
    shareController = mountArtifactShareDialog({
      document: document2,
      window,
      root,
      stageController: controller,
      ...shareOptions,
      ...durablePasteShare ? {
        createShare: (request) => durablePasteShare.run(request)
      } : {}
    });
    hostedController = mountHostedArtifactViewer({
      document: document2,
      window,
      ...hostedOptions
    });
    if (feedbackController?.destroy) cleanup.push(() => feedbackController.destroy());
    if (annotationController?.destroy) cleanup.push(() => annotationController.destroy());
    if (shareController?.destroy) cleanup.push(() => shareController.destroy());
    if (hostedController?.destroy) cleanup.push(() => hostedController.destroy());
    function cancelledFrame() {
      const error = new Error("Artifact frame loading was cancelled.");
      error.name = "AbortError";
      return error;
    }
    function frameStatus(artifactId, status, phase, failure) {
      const frame = frames.get(artifactId);
      if (frame) {
        frame.dataset.planrFrameState = status;
        frame.dataset.planrFramePhase = phase;
      }
      const previous = frameDiagnostics.get(artifactId);
      const now = window.performance.now();
      const starting = status === "loading" && phase === "source";
      const startedAt = starting ? now : previous?.startedAt ?? now;
      const diagnostic = Object.freeze({
        artifactId,
        status,
        phase,
        startedAt,
        elapsedMs: Math.max(0, Math.round(now - startedAt)),
        attempt: (previous?.attempt ?? 0) + (starting ? 1 : 0),
        transport: sourceTransport,
        ...failure
      });
      frameDiagnostics.set(artifactId, diagnostic);
      if (!disposed) {
        emit(root, window, ARTIFACT_STAGE_EVENTS.frameState, diagnostic);
        if (artifactId === state.activeArtifactId) render();
      }
    }
    function releaseFrame(artifactId, {
      status = "unloaded",
      error = cancelledFrame(),
      failure
    } = {}) {
      const record2 = frameLoads.get(artifactId);
      if (!record2) return;
      frameLoads.delete(artifactId);
      record2.cancelled = true;
      record2.abort.abort();
      record2.unlisten?.();
      record2.detach?.();
      record2.reject(error);
      const frame = frames.get(artifactId);
      const slot = frameSlots.get(artifactId);
      if (slot && frame.parentNode === slot.host && !slot.placeholder.parentNode) {
        slot.host.replaceChild(slot.placeholder, frame);
      }
      frame.removeAttribute("srcdoc");
      frame.removeAttribute("src");
      delete frame.dataset.planrArtifactDigest;
      delete frame.dataset.planrBridgeTrusted;
      try {
        delete frame.__openPlanrBridge;
      } catch {
      }
      if (record2.sourceUrl) window.URL.revokeObjectURL(record2.sourceUrl);
      documentLayouts.delete(artifactId);
      const panel = panels.get(artifactId);
      if (panel) {
        delete panel.dataset.planrLayoutMeasured;
        panel.style.removeProperty("--planr-document-width");
        panel.style.removeProperty("--planr-document-height");
      }
      frameStatus(artifactId, status, status, failure);
    }
    function assignArtifactSource(artifact) {
      if (disposed) return Promise.reject(cancelledFrame());
      const frame = frames.get(artifact.id);
      if (!frame) return Promise.reject(new Error(`Missing artifact frame: ${artifact.id}`));
      const slot = frameSlots.get(artifact.id);
      const existing = frameLoads.get(artifact.id);
      if (slot && (!slot.host.isConnected || !root.contains(slot.host) || existing?.status === "ready" && frame.parentNode !== slot.host)) {
        releaseFrame(artifact.id);
        return Promise.reject(cancelledFrame());
      }
      if (existing) {
        if (existing.status === "ready" && existing.requireTrust && frames.get(artifact.id)?.dataset.planrBridgeTrusted !== "true") {
          releaseFrame(artifact.id);
        } else {
          existing.used = ++frameUse;
          return existing.promise;
        }
      }
      const record2 = {
        status: "loading",
        used: ++frameUse,
        cancelled: false,
        abort: typeof window.AbortController === "function" ? new window.AbortController() : { signal: void 0, abort() {
        } }
      };
      record2.promise = new Promise((resolve, reject) => {
        record2.resolve = resolve;
        record2.reject = reject;
      });
      frameLoads.set(artifact.id, record2);
      const current = () => !disposed && !record2.cancelled && frameLoads.get(artifact.id) === record2;
      const fail = (error) => {
        if (current())
          releaseFrame(artifact.id, {
            status: "error",
            error,
            failure: {
              failedPhase: frameDiagnostics.get(artifact.id)?.phase ?? "source",
              code: error?.code ?? "E_ARTIFACT_FRAME_LOAD"
            }
          });
      };
      const timer = window.setTimeout(() => {
        const error = new Error(`Artifact frame did not finish loading: ${artifact.id}`);
        error.code = "E_ARTIFACT_FRAME_TIMEOUT";
        fail(error);
      }, frameLoadTimeoutMs);
      let loaded = false;
      const ready = () => {
        if (current() && slot && (!slot.host.isConnected || !root.contains(slot.host) || frame.parentNode !== slot.host)) {
          fail(cancelledFrame());
          return;
        }
        if (!current() || !loaded || record2.requireTrust && frame.dataset.planrBridgeTrusted !== "true")
          return;
        record2.status = "ready";
        record2.unlisten();
        frameStatus(artifact.id, "ready", "ready");
        record2.resolve(artifact.id);
      };
      const onLoad = () => {
        loaded = true;
        if (record2.requireTrust && frame.dataset.planrBridgeTrusted !== "true") {
          frameStatus(artifact.id, "loading", "bridge");
        }
        ready();
      };
      const onError = () => fail(new Error(`Artifact frame failed: ${artifact.id}`));
      record2.unlisten = () => {
        window.clearTimeout(timer);
        frame.removeEventListener("load", onLoad);
        frame.removeEventListener("error", onError);
        frame.removeEventListener("planr:artifact-bridge-ready", ready);
      };
      frameStatus(artifact.id, "loading", "source");
      if (!current()) return record2.promise;
      void (async () => {
        const source = await resolveArtifactSource(artifact, {
          frame,
          getState: () => state,
          signal: record2.abort.signal
        });
        if (!current()) return;
        if (typeof window.TextDecoder !== "function") {
          const error = new Error("UTF-8 decoding support is required for artifact sources.");
          error.code = "E_ARTIFACT_BROWSER_UNSUPPORTED";
          throw error;
        }
        const html = await htmlForSource(window, source);
        if (!current()) return;
        if (!html) {
          throw new TypeError(
            `Artifact source resolver must return HTML bytes or a Blob for ${artifact.id}.`
          );
        }
        if (slot) {
          if (!slot.host.isConnected || !root.contains(slot.host) || slot.placeholder.parentNode !== slot.host || frame.parentNode) {
            throw cancelledFrame();
          }
          slot.host.replaceChild(frame, slot.placeholder);
        }
        if (typeof bridgeClient?.attach === "function") {
          const detach = bridgeClient.attach({
            artifact,
            frame,
            getState: () => state
          });
          if (typeof detach === "function") record2.detach = detach;
          if (!current()) {
            record2.detach?.();
            return;
          }
          record2.requireTrust = true;
        }
        frame.addEventListener("load", onLoad);
        frame.addEventListener("error", onError);
        frame.addEventListener("planr:artifact-bridge-ready", ready);
        frame.dataset.planrArtifactDigest = artifact.sha256;
        frameStatus(artifact.id, "loading", "document");
        if (!current()) return;
        if (slot && (!slot.host.isConnected || !root.contains(slot.host) || frame.parentNode !== slot.host))
          throw cancelledFrame();
        if (sourceTransport === "srcdoc") {
          frame.removeAttribute("src");
          frame.srcdoc = html;
        } else {
          if (typeof window.URL?.createObjectURL !== "function" || typeof window.Blob !== "function") {
            const error = new Error("Blob URL support is required for artifact sources.");
            error.code = "E_ARTIFACT_BROWSER_UNSUPPORTED";
            throw error;
          }
          const sourceUrl = window.URL.createObjectURL(
            new window.Blob([html], {
              type: "text/html;charset=utf-8"
            })
          );
          record2.sourceUrl = sourceUrl;
          frame.removeAttribute("srcdoc");
          frame.src = sourceUrl;
        }
      })().catch(fail);
      return record2.promise;
    }
    function ensureFrames(artifactIds, isCurrent = () => true) {
      if (disposed || !isCurrent()) return Promise.reject(cancelledFrame());
      if (!Array.isArray(artifactIds) || artifactIds.some((id7) => typeof id7 !== "string" || !frames.has(id7))) {
        return Promise.reject(new TypeError("Requested artifact frames must be known artifact IDs."));
      }
      const requested = [...new Set(artifactIds)];
      if (frameBudget !== null && requested.length > frameBudget) {
        return Promise.reject(
          new RangeError(`At most ${frameBudget} artifact frames may be requested together.`)
        );
      }
      if (frameBudget === null)
        return Promise.all(requested.map((id7) => assignArtifactSource(stageArtifactById(state, id7))));
      const run = async () => {
        if (disposed || !isCurrent()) throw cancelledFrame();
        for (const id7 of requested) {
          if (disposed || !isCurrent()) throw cancelledFrame();
          if (!frameLoads.has(id7)) {
            while (frameLoads.size >= frameBudget) {
              const candidates = [...frameLoads].filter(([loadedId]) => !requested.includes(loadedId)).sort((a, b) => a[1].used - b[1].used);
              if (!candidates.length) throw new Error("The artifact frame budget is exhausted.");
              releaseFrame(candidates[0][0]);
            }
          }
          await assignArtifactSource(stageArtifactById(state, id7));
        }
        return requested;
      };
      const result = frameQueue.then(run);
      frameQueue = result.catch(() => {
      });
      return result;
    }
    function frameIsReady(id7) {
      const frame = frames.get(id7);
      return frame?.dataset.planrFrameState === "ready" && (!frame.__openPlanrBridge || frame.dataset.planrBridgeTrusted === "true");
    }
    function setSelectionStatus(status, selection, generation) {
      if (disposed || generation !== activationGeneration || visibleArtifactIds(state).join("|") !== selection)
        return;
      state = reduceArtifactStageState(state, { type: "set-status", status });
      render({ announce: true });
    }
    function cancelInactiveLoads(ids2) {
      for (const [id7, record2] of frameLoads) {
        if (record2.status === "loading" && !ids2.includes(id7)) releaseFrame(id7);
      }
    }
    async function activateVisibleFrames() {
      const generation = ++activationGeneration;
      const isCurrent = () => generation === activationGeneration;
      const ids2 = visibleArtifactIds(state);
      const selection = ids2.join("|");
      if (ids2.length === 0) return state;
      cancelInactiveLoads(ids2);
      if (ids2.every(frameIsReady)) {
        setSelectionStatus("ready", selection, generation);
        return state;
      }
      setSelectionStatus("loading", selection, generation);
      try {
        await ensureFrames(ids2, isCurrent);
        setSelectionStatus("ready", selection, generation);
      } catch (error) {
        const status = error?.code === "E_ARTIFACT_BROWSER_UNSUPPORTED" ? "unsupported-browser" : "invalid";
        setSelectionStatus(status, selection, generation);
      }
      return state;
    }
    function retryFrames(artifactIds = visibleArtifactIds(state)) {
      if (!Array.isArray(artifactIds) || artifactIds.some((id7) => !frames.has(id7))) {
        return Promise.reject(new TypeError("Requested artifact frames must be known artifact IDs."));
      }
      for (const id7 of artifactIds) releaseFrame(id7);
      if (artifactIds.some((id7) => visibleArtifactIds(state).includes(id7))) {
        readyPromise = activateVisibleFrames();
        return readyPromise;
      }
      return ensureFrames(artifactIds);
    }
    if (state.status === "ready" && state.artifacts.length > 0) {
      if (typeof resolveArtifactSource !== "function") {
        frameStatus(state.activeArtifactId, "loading", "source");
        frameStatus(state.activeArtifactId, "error", "error", {
          failedPhase: "source",
          code: "E_ARTIFACT_SOURCE_UNAVAILABLE"
        });
        state = reduceArtifactStageState(state, { type: "set-status", status: "invalid" });
        render();
        readyPromise = Promise.resolve(state);
      } else {
        state = reduceArtifactStageState(state, { type: "set-status", status: "loading" });
        render();
        readyPromise = activateVisibleFrames();
        if (frameBudget === null) {
          void Promise.allSettled(
            state.artifacts.filter(({ id: id7 }) => id7 !== state.activeArtifactId).map(assignArtifactSource)
          );
        }
      }
    }
    return controller;
  }
  function bootstrapArtifactStage(document2 = globalThis.document, options = {}) {
    return mountArtifactStage({ ...options, document: document2, window: document2?.defaultView });
  }
  if (typeof document !== "undefined") {
    const options = globalThis.__OPENPLANR_ARTIFACT_STAGE_OPTIONS__ ?? {};
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => bootstrapArtifactStage(document, options), {
        once: true
      });
    } else {
      queueMicrotask(() => bootstrapArtifactStage(document, options));
    }
  }