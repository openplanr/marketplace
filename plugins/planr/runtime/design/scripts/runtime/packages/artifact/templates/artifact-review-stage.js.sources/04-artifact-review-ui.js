

  // lib/artifact/ui/feedback-rail.mjs
  var ARTIFACT_REVIEW_CHANGE_EVENT = "planr:artifact-review-change";
  var ARTIFACT_REVIEW_SELECT_EVENT = "planr:artifact-review-select";
  var ARTIFACT_REVIEW_DRAFT_CHANGE_EVENT = "planr:artifact-review-draft-change";
  var ARTIFACT_REVIEW_LIMITS = Object.freeze({
    id: 128,
    authorName: 256,
    artifactId: 128,
    variant: 128,
    anchor: 512,
    screen: 128,
    text: 65536,
    pins: 1e4,
    replies: 1e4,
    viewport: 16384
  });
  var ARTIFACT_REVIEW_DECISIONS = Object.freeze([
    "pending",
    "approved",
    "changes_requested"
  ]);
  var ARTIFACT_REVIEW_INTENTS = Object.freeze(["fix", "improve", "question"]);
  var ARTIFACT_REVIEW_STATUSES = Object.freeze(["open", "addressed", "resolved"]);
  var REVIEW_OF_RE = /^[a-f0-9]{64}$/;
  var ArtifactReviewStateError = class extends Error {
    constructor(code, message) {
      super(message);
      this.name = "ArtifactReviewStateError";
      this.code = code;
    }
  };
  function invalid(message) {
    throw new ArtifactReviewStateError("E_ARTIFACT_REVIEW_INVALID", message);
  }
  function identityRequired() {
    throw new ArtifactReviewStateError(
      "E_ARTIFACT_REVIEW_IDENTITY_REQUIRED",
      "Enter your name before adding a comment."
    );
  }
  function clonePlain(value) {
    if (Array.isArray(value)) return value.map(clonePlain);
    if (!value || typeof value !== "object") return value;
    const clone = {};
    for (const [key, entry] of Object.entries(value)) clone[key] = clonePlain(entry);
    return clone;
  }
  function cloneFrozenArtifactReview(review) {
    return deepFreeze(clonePlain(review));
  }
  function boundedString(value, label, { min = 0, max, trim = false, pattern } = {}) {
    if (typeof value !== "string") invalid(`${label} must be a string.`);
    const normalized3 = trim ? value.trim() : value;
    if (normalized3.length < min || max !== void 0 && normalized3.length > max) {
      invalid(`${label} must contain ${min} through ${max ?? "unlimited"} characters.`);
    }
    if (pattern && !pattern.test(normalized3)) invalid(`${label} has an invalid format.`);
    return normalized3;
  }
  function optionalString(value, label, options) {
    if (value === void 0) return void 0;
    return boundedString(value, label, options);
  }
  function enumValue(value, values, label) {
    if (!values.includes(value)) invalid(`${label} must be one of: ${values.join(", ")}.`);
    return value;
  }
  function isoTimestamp(value, label) {
    const timestamp = value instanceof Date ? value.toISOString() : value;
    if (typeof timestamp !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) || !Number.isFinite(Date.parse(timestamp))) {
      invalid(`${label} must be an ISO-8601 date-time.`);
    }
    return timestamp;
  }
  function dependencyTimestamp(now) {
    return isoTimestamp(now(), "now()");
  }
  function defaultNow() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  function createSecureArtifactReviewId(cryptoProvider = globalThis.crypto) {
    const randomUuid = cryptoProvider?.randomUUID?.();
    if (randomUuid) return randomUuid;
    const bytes = new Uint8Array(16);
    if (typeof cryptoProvider?.getRandomValues !== "function") {
      throw new ArtifactReviewStateError(
        "E_ARTIFACT_REVIEW_UUID_UNAVAILABLE",
        "Secure UUID generation is unavailable in this browser."
      );
    }
    cryptoProvider.getRandomValues(bytes);
    bytes[6] = bytes[6] & 15 | 64;
    bytes[8] = bytes[8] & 63 | 128;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  function defaultCreateId() {
    return createSecureArtifactReviewId();
  }
  function dependencyId(createId, kind) {
    return boundedString(createId(kind), `${kind} id`, {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.id,
      trim: true
    });
  }
  function uniqueDependencyId(createId, kind, existingIds) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = dependencyId(createId, kind);
      if (!existingIds.has(candidate)) return candidate;
    }
    throw new ArtifactReviewStateError(
      "E_ARTIFACT_REVIEW_ID_COLLISION",
      `Could not create a unique ${kind} id.`
    );
  }
  function normalizeArtifactReviewIdentity(value, { allowEmpty = false } = {}) {
    if (value === null || value === void 0 || value === "") {
      if (allowEmpty) return null;
      identityRequired();
    }
    const source = typeof value === "string" ? { name: value } : value;
    if (!source || typeof source !== "object" || Array.isArray(source)) identityRequired();
    const name = boundedString(source.name, "author.name", {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.authorName,
      trim: true
    });
    const id = optionalString(source.id, "author.id", {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.id,
      trim: true
    });
    return deepFreeze(id === void 0 ? { name } : { id, name });
  }
  function normalizeRegion(region) {
    if (!region || typeof region !== "object" || Array.isArray(region)) {
      invalid("pin.region must be an object.");
    }
    const finite3 = (value, label) => {
      if (typeof value !== "number" || !Number.isFinite(value)) invalid(`${label} must be finite.`);
      return value;
    };
    const x = finite3(region.x, "pin.region.x");
    const y = finite3(region.y, "pin.region.y");
    const w = finite3(region.w, "pin.region.w");
    const h = finite3(region.h, "pin.region.h");
    if (x >= 0 && y >= 0 && w >= 0 && h >= 0 && x + w <= 1 && y + h <= 1) {
      return { x, y, w, h };
    }
    const unit = (value) => Math.round(Math.min(1, Math.max(0, value)) * 1e6) / 1e6;
    const boundedX = unit(x);
    const boundedY = unit(y);
    return {
      x: boundedX,
      y: boundedY,
      w: Math.round(Math.min(unit(w), 1 - boundedX) * 1e6) / 1e6,
      h: Math.round(Math.min(unit(h), 1 - boundedY) * 1e6) / 1e6
    };
  }
  function normalizeViewport(viewport) {
    if (!viewport || typeof viewport !== "object" || Array.isArray(viewport)) {
      invalid("pin.viewport must be an object.");
    }
    const dimension = (value, label) => {
      if (!Number.isInteger(value) || value < 1 || value > ARTIFACT_REVIEW_LIMITS.viewport) {
        invalid(`${label} must be an integer from 1 through ${ARTIFACT_REVIEW_LIMITS.viewport}.`);
      }
      return value;
    };
    return {
      width: dimension(viewport.width, "pin.viewport.width"),
      height: dimension(viewport.height, "pin.viewport.height")
    };
  }
  function normalizeAnchor(anchor) {
    if (anchor === void 0 || anchor === null) return void 0;
    if (typeof anchor !== "object" || Array.isArray(anchor)) invalid("pin.anchor must be an object.");
    const planrId = boundedString(anchor.planrId, "pin.anchor.planrId", {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.anchor,
      trim: true
    });
    const screen = optionalString(anchor.screen, "pin.anchor.screen", {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.screen,
      trim: true
    });
    return screen === void 0 ? { planrId } : { planrId, screen };
  }
  function normalizeReply(reply, label = "reply") {
    if (!reply || typeof reply !== "object" || Array.isArray(reply))
      invalid(`${label} must be an object.`);
    return {
      id: boundedString(reply.id, `${label}.id`, {
        min: 1,
        max: ARTIFACT_REVIEW_LIMITS.id,
        trim: true
      }),
      author: normalizeArtifactReviewIdentity(reply.author),
      comment: boundedString(reply.comment, `${label}.comment`, {
        min: 1,
        max: ARTIFACT_REVIEW_LIMITS.text,
        trim: true
      }),
      createdAt: isoTimestamp(reply.createdAt, `${label}.createdAt`)
    };
  }
  function compareTimestampThenId(left, right) {
    const byTime = left.createdAt.localeCompare(right.createdAt);
    return byTime === 0 ? left.id.localeCompare(right.id) : byTime;
  }
  function normalizePin(pin, label = "pin") {
    if (!pin || typeof pin !== "object" || Array.isArray(pin)) invalid(`${label} must be an object.`);
    if (!Array.isArray(pin.replies) || pin.replies.length > ARTIFACT_REVIEW_LIMITS.replies) {
      invalid(`${label}.replies must contain no more than ${ARTIFACT_REVIEW_LIMITS.replies} items.`);
    }
    const replies = pin.replies.map(
      (reply, index) => normalizeReply(reply, `${label}.replies[${index}]`)
    );
    const replyIds = new Set(replies.map(({ id }) => id));
    if (replyIds.size !== replies.length) invalid(`${label}.replies must have unique ids.`);
    const normalized3 = {
      id: boundedString(pin.id, `${label}.id`, {
        min: 1,
        max: ARTIFACT_REVIEW_LIMITS.id,
        trim: true
      }),
      author: normalizeArtifactReviewIdentity(pin.author),
      artifactId: boundedString(pin.artifactId, `${label}.artifactId`, {
        min: 1,
        max: ARTIFACT_REVIEW_LIMITS.artifactId,
        trim: true
      }),
      region: normalizeRegion(pin.region),
      viewport: normalizeViewport(pin.viewport),
      intent: enumValue(pin.intent, ARTIFACT_REVIEW_INTENTS, `${label}.intent`),
      status: enumValue(pin.status, ARTIFACT_REVIEW_STATUSES, `${label}.status`),
      comment: boundedString(pin.comment, `${label}.comment`, {
        min: 1,
        max: ARTIFACT_REVIEW_LIMITS.text,
        trim: true
      }),
      replies: replies.sort(compareTimestampThenId),
      createdAt: isoTimestamp(pin.createdAt, `${label}.createdAt`),
      updatedAt: isoTimestamp(pin.updatedAt, `${label}.updatedAt`)
    };
    const variant = optionalString(pin.variant, `${label}.variant`, {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.variant,
      trim: true
    });
    const anchor = normalizeAnchor(pin.anchor);
    if (variant !== void 0) normalized3.variant = variant;
    if (anchor !== void 0) normalized3.anchor = anchor;
    return normalized3;
  }
  function normalizeArtifactReview(review) {
    if (!review || typeof review !== "object" || Array.isArray(review)) {
      invalid("Artifact review must be an object.");
    }
    if (!Array.isArray(review.pins) || review.pins.length > ARTIFACT_REVIEW_LIMITS.pins) {
      invalid(`review.pins must contain no more than ${ARTIFACT_REVIEW_LIMITS.pins} items.`);
    }
    const pins = review.pins.map((pin, index) => normalizePin(pin, `review.pins[${index}]`));
    const pinIds = new Set(pins.map(({ id }) => id));
    if (pinIds.size !== pins.length) invalid("review.pins must have unique ids.");
    const normalized3 = {
      schemaVersion: enumValue(review.schemaVersion, ["1.0.0"], "review.schemaVersion"),
      reviewId: boundedString(review.reviewId, "review.reviewId", {
        min: 1,
        max: ARTIFACT_REVIEW_LIMITS.id,
        trim: true
      }),
      reviewOf: boundedString(review.reviewOf, "review.reviewOf", {
        min: 64,
        max: 64,
        pattern: REVIEW_OF_RE
      }),
      decision: enumValue(review.decision, ARTIFACT_REVIEW_DECISIONS, "review.decision"),
      overall: boundedString(review.overall, "review.overall", {
        max: ARTIFACT_REVIEW_LIMITS.text
      }),
      pins: pins.sort(compareTimestampThenId)
    };
    if (review.createdAt !== void 0)
      normalized3.createdAt = isoTimestamp(review.createdAt, "review.createdAt");
    if (review.updatedAt !== void 0)
      normalized3.updatedAt = isoTimestamp(review.updatedAt, "review.updatedAt");
    return deepFreeze(normalized3);
  }
  function createArtifactReview({ reviewId, reviewOf, createId = defaultCreateId } = {}) {
    const normalizedReviewId = reviewId === void 0 ? dependencyId(createId, "review") : boundedString(reviewId, "reviewId", {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.id,
      trim: true
    });
    return normalizeArtifactReview({
      schemaVersion: "1.0.0",
      reviewId: normalizedReviewId,
      reviewOf: boundedString(reviewOf, "reviewOf", {
        min: 64,
        max: 64,
        pattern: REVIEW_OF_RE
      }),
      decision: "pending",
      overall: "",
      pins: []
    });
  }
  function replacePin(review, pin) {
    return review.pins.map((candidate) => candidate.id === pin.id ? pin : candidate);
  }
  function findPin(review, pinId) {
    const normalizedId = boundedString(pinId, "pinId", {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.id,
      trim: true
    });
    const pin = review.pins.find(({ id }) => id === normalizedId);
    if (!pin) {
      throw new ArtifactReviewStateError(
        "E_ARTIFACT_REVIEW_PIN_NOT_FOUND",
        `Unknown feedback pin: ${normalizedId}`
      );
    }
    return pin;
  }
  function preserveOptionalReviewTimestamps(review, next, timestamp) {
    if (review.createdAt !== void 0) next.createdAt = review.createdAt;
    if (review.updatedAt !== void 0) next.updatedAt = timestamp;
    return next;
  }
  function reduceArtifactReview(review, action, { createId = defaultCreateId, now = defaultNow } = {}) {
    const current = normalizeArtifactReview(review);
    if (!action || typeof action !== "object" || Array.isArray(action))
      invalid("Review action must be an object.");
    const timestamp = dependencyTimestamp(now);
    let next;
    switch (action.type) {
      case "add-pin": {
        if (current.pins.length >= ARTIFACT_REVIEW_LIMITS.pins) {
          invalid(`A review can contain at most ${ARTIFACT_REVIEW_LIMITS.pins} pins.`);
        }
        const author = normalizeArtifactReviewIdentity(action.author);
        const pinInput = action.pin && typeof action.pin === "object" ? action.pin : {};
        const pinId = pinInput.id === void 0 ? uniqueDependencyId(createId, "pin", new Set(current.pins.map(({ id }) => id))) : boundedString(pinInput.id, "pin.id", {
          min: 1,
          max: ARTIFACT_REVIEW_LIMITS.id,
          trim: true
        });
        if (current.pins.some(({ id }) => id === pinId)) {
          throw new ArtifactReviewStateError(
            "E_ARTIFACT_REVIEW_ID_COLLISION",
            `Duplicate pin id: ${pinId}`
          );
        }
        const pin = normalizePin({
          ...pinInput,
          id: pinId,
          author,
          status: pinInput.status ?? "open",
          replies: [],
          createdAt: pinInput.createdAt ?? timestamp,
          updatedAt: pinInput.updatedAt ?? timestamp
        });
        next = preserveOptionalReviewTimestamps(
          current,
          {
            ...current,
            pins: [...current.pins, pin]
          },
          timestamp
        );
        break;
      }
      case "add-reply": {
        const pin = findPin(current, action.pinId);
        if (pin.replies.length >= ARTIFACT_REVIEW_LIMITS.replies) {
          invalid(`A feedback thread can contain at most ${ARTIFACT_REVIEW_LIMITS.replies} replies.`);
        }
        const replyId = action.id === void 0 ? uniqueDependencyId(createId, "reply", new Set(pin.replies.map(({ id }) => id))) : boundedString(action.id, "reply.id", {
          min: 1,
          max: ARTIFACT_REVIEW_LIMITS.id,
          trim: true
        });
        if (pin.replies.some(({ id }) => id === replyId)) {
          throw new ArtifactReviewStateError(
            "E_ARTIFACT_REVIEW_ID_COLLISION",
            `Duplicate reply id: ${replyId}`
          );
        }
        const reply = normalizeReply({
          id: replyId,
          author: normalizeArtifactReviewIdentity(action.author),
          comment: action.comment,
          createdAt: action.createdAt ?? timestamp
        });
        const updatedPin = normalizePin({
          ...pin,
          replies: [...pin.replies, reply],
          updatedAt: timestamp
        });
        next = preserveOptionalReviewTimestamps(
          current,
          {
            ...current,
            pins: replacePin(current, updatedPin)
          },
          timestamp
        );
        break;
      }
      case "set-status": {
        const pin = findPin(current, action.pinId);
        const updatedPin = normalizePin({
          ...pin,
          status: enumValue(action.status, ARTIFACT_REVIEW_STATUSES, "status"),
          updatedAt: timestamp
        });
        next = preserveOptionalReviewTimestamps(
          current,
          {
            ...current,
            pins: replacePin(current, updatedPin)
          },
          timestamp
        );
        break;
      }
      case "set-overall":
        next = preserveOptionalReviewTimestamps(
          current,
          {
            ...current,
            overall: boundedString(action.overall, "overall", { max: ARTIFACT_REVIEW_LIMITS.text })
          },
          timestamp
        );
        break;
      case "set-decision":
        next = preserveOptionalReviewTimestamps(
          current,
          {
            ...current,
            decision: enumValue(action.decision, ARTIFACT_REVIEW_DECISIONS, "decision")
          },
          timestamp
        );
        break;
      default:
        throw new ArtifactReviewStateError(
          "E_ARTIFACT_REVIEW_ACTION_UNKNOWN",
          `Unknown artifact review action: ${String(action.type)}`
        );
    }
    return normalizeArtifactReview(next);
  }
  function createArtifactReviewController({
    initialReview = null,
    reviewOf,
    reviewId,
    identity = null,
    createId = defaultCreateId,
    now = defaultNow
  } = {}) {
    let review = initialReview === null || initialReview === void 0 ? null : normalizeArtifactReview(initialReview);
    if (review && reviewOf !== void 0 && review.reviewOf !== reviewOf) {
      throw new ArtifactReviewStateError(
        "E_ARTIFACT_REVIEW_DIGEST_MISMATCH",
        "The initial review does not match the artifact envelope digest."
      );
    }
    let localIdentity = normalizeArtifactReviewIdentity(identity, { allowEmpty: true });
    let activePinId = null;
    let destroyed = false;
    const listeners = /* @__PURE__ */ new Set();
    const assertAlive = () => {
      if (destroyed) {
        throw new ArtifactReviewStateError(
          "E_ARTIFACT_REVIEW_DESTROYED",
          "Artifact review controller is destroyed."
        );
      }
    };
    const ensureReview = () => {
      review ??= createArtifactReview({ reviewId, reviewOf, createId });
      return review;
    };
    const getState = () => deepFreeze({
      review,
      identity: localIdentity,
      activePinId
    });
    const notify = (change) => {
      const state = getState();
      for (const listener of [...listeners]) listener(state, deepFreeze({ ...change }));
    };
    const controller = {
      getReview() {
        return review;
      },
      getState,
      getIdentity() {
        return localIdentity;
      },
      setIdentity(value) {
        assertAlive();
        localIdentity = normalizeArtifactReviewIdentity(value, { allowEmpty: true });
        notify({ type: "identity" });
        return localIdentity;
      },
      dispatch(action) {
        assertAlive();
        const authored = action?.type === "add-pin" || action?.type === "add-reply";
        const nextAction = authored && action.author === void 0 ? { ...action, author: localIdentity ?? identityRequired() } : action;
        const previousPinIds = nextAction?.type === "add-pin" ? new Set(review?.pins.map(({ id }) => id) ?? []) : null;
        review = reduceArtifactReview(ensureReview(), nextAction, { createId, now });
        if (previousPinIds) {
          activePinId = review.pins.find(({ id }) => !previousPinIds.has(id))?.id ?? activePinId;
        }
        notify({ type: "review", action: nextAction.type });
        return review;
      },
      replaceReview(value) {
        assertAlive();
        const next = value === null || value === void 0 ? null : normalizeArtifactReview(value);
        if (next && reviewOf !== void 0 && next.reviewOf !== reviewOf) {
          throw new ArtifactReviewStateError(
            "E_ARTIFACT_REVIEW_DIGEST_MISMATCH",
            "The replacement review does not match the artifact envelope digest."
          );
        }
        review = next;
        if (activePinId && !review?.pins.some(({ id }) => id === activePinId)) activePinId = null;
        notify({ type: "review-replaced" });
        return review;
      },
      selectPin(pinId) {
        assertAlive();
        if (pinId === null || pinId === void 0) {
          activePinId = null;
        } else {
          activePinId = findPin(ensureReview(), pinId).id;
        }
        notify({ type: "selection" });
        return activePinId;
      },
      subscribe(listener) {
        assertAlive();
        if (typeof listener !== "function") invalid("Review subscriber must be a function.");
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        listeners.clear();
        review = null;
        localIdentity = null;
        activePinId = null;
      }
    };
    return Object.freeze(controller);
  }
  function createElement(document2, tagName, { className, text: text2, attributes = {} } = {}) {
    const element = document2.createElement(tagName);
    if (className) element.className = className;
    if (text2 !== void 0) element.textContent = text2;
    for (const [name, value] of Object.entries(attributes)) {
      if (value !== void 0 && value !== null) element.setAttribute(name, String(value));
    }
    return element;
  }
  function artifactReviewThreadDomId(pinId) {
    return annotationDomIds(pinId).thread;
  }
  function displayTimestamp(timestamp) {
    const canonical = new Date(timestamp).toISOString();
    return `${canonical.slice(0, 10)} ${canonical.slice(11, 16)} UTC`;
  }
  function renderReply(document2, reply) {
    const item = createElement(document2, "li", {
      className: "planr-reply",
      attributes: { "data-planr-reply-id": reply.id }
    });
    const heading = createElement(document2, "header");
    heading.append(createElement(document2, "strong", { text: reply.author.name }));
    const time = createElement(document2, "time", {
      text: displayTimestamp(reply.createdAt),
      attributes: { datetime: reply.createdAt }
    });
    heading.append(time);
    item.append(heading, createElement(document2, "p", { text: reply.comment }));
    return item;
  }
  function renderReplyForm(document2, pin, expanded = false) {
    const fieldId = `${annotationDomIds(pin.id).thread}-reply`;
    const wrapper = createElement(document2, "div", { className: "planr-reply-editor" });
    const toggle = createElement(document2, "button", {
      className: "planr-reply-toggle",
      text: expanded ? "− Reply" : "+ Reply",
      attributes: {
        type: "button",
        id: `${fieldId}-toggle`,
        "data-planr-reply-toggle": pin.id,
        "aria-expanded": String(expanded),
        "aria-controls": `${fieldId}-form`,
        title: expanded ? "Collapse reply" : "Reply to this comment"
      }
    });
    const form = createElement(document2, "form", {
      className: "planr-reply-form",
      attributes: {
        "data-planr-reply-form": pin.id,
        id: `${fieldId}-form`,
        ...expanded ? {} : { hidden: "" }
      }
    });
    const label = createElement(document2, "label", {
      className: "planr-reply-label",
      text: "Reply to thread",
      attributes: { for: fieldId }
    });
    const textarea = createElement(document2, "textarea", {
      attributes: {
        id: fieldId,
        name: "reply",
        maxlength: ARTIFACT_REVIEW_LIMITS.text,
        rows: 2,
        placeholder: "Write a reply…",
        required: "",
        "aria-describedby": "planr-review-error"
      }
    });
    const controls = createElement(document2, "div", { className: "planr-reply-controls" });
    const hint = createElement(document2, "span", {
      className: "planr-reply-hint",
      text: "Ctrl/⌘ + Enter to send"
    });
    const submit = createElement(document2, "button", {
      className: "planr-reply-send",
      attributes: {
        type: "submit",
        disabled: "",
        "aria-label": "Send reply",
        title: "Send reply (Ctrl/⌘ + Enter)"
      }
    });
    const svg = document2.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (const [name, value] of Object.entries({
      viewBox: "0 0 24 24",
      width: "16",
      height: "16",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.8",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      focusable: "false"
    }))
      svg.setAttribute(name, value);
    const path = document2.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M12 19V5m-6 6 6-6 6 6");
    svg.append(path);
    submit.append(svg);
    controls.append(hint, submit);
    form.append(label, textarea, controls);
    wrapper.append(toggle, form);
    return wrapper;
  }
  function renderThread(document2, pin, active, description = {}) {
    const intentLabel = typeof description.intentLabel === "string" ? description.intentLabel.slice(0, 128) : pin.intent;
    const article = createElement(document2, "article", {
      className: `planr-thread${active ? " is-active" : ""}`,
      attributes: {
        id: artifactReviewThreadDomId(pin.id),
        tabindex: "-1",
        "data-planr-pin-id": pin.id,
        "data-planr-intent": pin.intent,
        "data-planr-status": pin.status,
        "aria-controls": annotationDomIds(pin.id).pin,
        "aria-label": `${intentLabel} comment by ${pin.author.name}`,
        "data-planr-unread": description.unread === true ? "true" : "false",
        ...description.compact ? { "data-planr-compact": "true" } : {}
      }
    });
    const header = createElement(document2, "header");
    const byline = createElement(document2, "div", { className: "planr-review-byline" });
    byline.append(
      createElement(document2, "strong", { text: pin.author.name }),
      createElement(document2, "span", { className: "planr-intent", text: intentLabel })
    );
    const time = createElement(document2, "time", {
      text: description.compact ? `${new Date(pin.createdAt).toISOString().slice(11, 16)} UTC` : displayTimestamp(pin.createdAt),
      attributes: { datetime: pin.createdAt, title: displayTimestamp(pin.createdAt) }
    });
    header.append(byline, time);
    const comment = createElement(document2, "p", {
      className: "planr-thread-comment",
      text: pin.comment
    });
    const lifecycle = createElement(document2, "div", { className: "planr-thread-actions" });
    lifecycle.append(
      createElement(document2, "span", {
        className: "planr-thread-status",
        text: pin.status,
        attributes: { title: `Status: ${pin.status}` }
      }),
      createElement(document2, "button", {
        text: pin.status === "resolved" ? "Reopen" : "Resolve",
        attributes: {
          type: "button",
          "data-planr-thread-action": pin.status === "resolved" ? "reopen" : "resolve",
          "data-planr-pin-id": pin.id
        }
      }),
      createElement(document2, "button", {
        text: "Show pin",
        attributes: {
          type: "button",
          "data-planr-thread-focus": pin.id,
          "aria-controls": annotationDomIds(pin.id).pin
        }
      })
    );
    const replies = createElement(document2, "ol", {
      className: "planr-replies",
      attributes: { "aria-label": "Replies" }
    });
    const earlierReplies = description.compact ? Math.max(0, pin.replies.length - (description.replyLimit || 2)) : 0;
    for (const reply of pin.replies.slice(earlierReplies))
      replies.append(renderReply(document2, reply));
    const editor = renderReplyForm(document2, pin, description.replyExpanded);
    article.append(header, comment);
    if (description.compact && pin.comment.length > 240) {
      comment.dataset.planrCommentCollapsed = String(!description.commentExpanded);
      article.append(
        createElement(document2, "button", {
          className: "planr-comment-expand",
          text: description.commentExpanded ? "Show less" : "Read full comment",
          attributes: {
            type: "button",
            id: `${annotationDomIds(pin.id).thread}-expand`,
            "data-planr-comment-expand": pin.id,
            "aria-expanded": String(Boolean(description.commentExpanded))
          }
        })
      );
    }
    if (earlierReplies)
      article.append(
        createElement(document2, "button", {
          className: "planr-history-expand",
          text: `Show ${earlierReplies} earlier ${earlierReplies === 1 ? "reply" : "replies"}`,
          attributes: {
            type: "button",
            id: `${annotationDomIds(pin.id).thread}-history`,
            "data-planr-history-expand": pin.id,
            "aria-expanded": "false"
          }
        })
      );
    if (pin.replies.length) article.append(replies);
    if (description.compact) {
      lifecycle.append(editor.querySelector("[data-planr-reply-toggle]"));
      article.append(lifecycle, editor);
    } else article.append(lifecycle, editor);
    return article;
  }
  function decisionCopy(decision) {
    if (decision === "approved") return "Review approved";
    if (decision === "changes_requested") return "Changes requested";
    return "Decision pending";
  }
  function mountArtifactFeedbackRail({
    root,
    document: document2 = root?.ownerDocument,
    window = document2?.defaultView,
    controller: providedController,
    initialReview = null,
    reviewOf,
    reviewId,
    identity = null,
    createId = defaultCreateId,
    now = defaultNow,
    onSelectPin,
    presentation: initialPresentation = {}
  } = {}) {
    if (!root || !document2 || !window) invalid("A browser root, document, and window are required.");
    const slot = root.querySelector('[data-planr-slot="feedback-rail"]');
    const identityInput = root.querySelector("[data-planr-reviewer-name]");
    const identityStatus = root.querySelector("[data-planr-identity-status]");
    const overall = root.querySelector("#planr-overall-note");
    const decisionStatus = root.querySelector('[data-planr-slot="decision-status"]');
    const decisionButtons = [...root.querySelectorAll("[data-planr-decision]")];
    if (!slot || !identityInput || !overall || !decisionStatus || decisionButtons.length === 0) {
      invalid("Artifact feedback renderer slots are missing.");
    }
    const ownsController = !providedController;
    const controller = providedController ?? createArtifactReviewController({
      initialReview,
      reviewOf,
      reviewId,
      identity,
      createId,
      now
    });
    let destroyed = false;
    let presentation = { ...initialPresentation };
    const replyDrafts = /* @__PURE__ */ new Map();
    const expandedReplies = /* @__PURE__ */ new Set();
    const expandedHistory = /* @__PURE__ */ new Map(), expandedComments = /* @__PURE__ */ new Set();
    let visibleLimit = Number.isInteger(initialPresentation.pageSize) ? initialPresentation.pageSize : Infinity;
    const extraDrafts = /* @__PURE__ */ new Map();
    let overallDirty = false;
    let composing = false;
    let renderQueued = false;
    const captureDrafts = () => {
      for (const form of slot.querySelectorAll("[data-planr-reply-form]")) {
        const field = form.elements.namedItem("reply");
        if (field) replyDrafts.set(form.dataset.planrReplyForm, field.value);
      }
      for (const field of slot.querySelectorAll("[data-planr-draft-key]")) {
        if (typeof field.value === "string")
          extraDrafts.set(field.dataset.planrDraftKey, field.value);
      }
    };
    const snapshotDrafts = () => {
      captureDrafts();
      return cloneFrozenArtifactReview({
        reviewOf: controller.getReview()?.reviewOf ?? reviewOf,
        replies: Object.fromEntries(replyDrafts),
        expandedReplies: [...expandedReplies],
        fields: Object.fromEntries(extraDrafts),
        overall: { value: overall.value, dirty: overallDirty },
        identity: identityInput.value
      });
    };
    const emitDraftChange = () => root.dispatchEvent(
      new window.CustomEvent(ARTIFACT_REVIEW_DRAFT_CHANGE_EVENT, {
        bubbles: true,
        detail: snapshotDrafts()
      })
    );
    const focusDescriptor = () => {
      const element = document2.activeElement;
      if (!element || !slot.contains(element)) return null;
      const thread = element.closest("[data-planr-pin-id]");
      return {
        id: element.id,
        pinId: thread?.dataset.planrPinId,
        draftKey: element.dataset.planrDraftKey,
        action: element.dataset.planrThreadAction,
        showPin: element.dataset.planrThreadFocus,
        tag: element.tagName,
        name: element.name,
        start: element.selectionStart,
        end: element.selectionEnd,
        direction: element.selectionDirection
      };
    };
    const restoreFocus = (descriptor) => {
      if (!descriptor) return;
      const thread = descriptor.pinId && document2.getElementById(artifactReviewThreadDomId(descriptor.pinId));
      const target = descriptor.id && document2.getElementById(descriptor.id) || descriptor.draftKey && [...slot.querySelectorAll("[data-planr-draft-key]")].find(
        (field) => field.dataset.planrDraftKey === descriptor.draftKey
      ) || descriptor.action && [...thread?.querySelectorAll("[data-planr-thread-action]") ?? []].find(
        (button) => button.dataset.planrThreadAction === descriptor.action
      ) || descriptor.showPin && thread?.querySelector("[data-planr-thread-focus]") || [...thread?.querySelectorAll("button,input,select,textarea") ?? []].find(
        (field) => field.tagName === descriptor.tag && field.name === descriptor.name
      );
      target?.focus?.({ preventScroll: true });
      if (Number.isInteger(descriptor.start))
        target?.setSelectionRange?.(descriptor.start, descriptor.end, descriptor.direction);
    };
    const showError = (error) => {
      const target = root.querySelector("#planr-review-error");
      if (!target) return;
      target.textContent = error?.message ?? String(error);
      target.hidden = false;
    };
    const clearError = () => {
      const target = root.querySelector("#planr-review-error");
      if (!target) return;
      target.textContent = "";
      target.hidden = true;
    };
    const announce2 = (message) => {
      decisionStatus.textContent = message;
      const live = root.parentElement?.querySelector('[data-planr-slot="review-announcer"]') ?? document2.querySelector('[data-planr-slot="review-announcer"]');
      if (live) live.textContent = message;
    };
    const updateCounts = (pins) => {
      const label = `${pins.length} ${pins.length === 1 ? "comment" : "comments"}`;
      for (const count of root.querySelectorAll(
        '[data-planr-action="feedback"] .planr-count, .planr-review-rail > header .planr-count'
      )) {
        count.textContent = String(pins.length);
        count.setAttribute("aria-label", label);
      }
      const commentsButton = root.querySelector('[data-planr-action="feedback"]');
      commentsButton?.setAttribute("aria-label", commentsButton.dataset.planrReviewLabel || label);
      if (commentsButton?.dataset.planrReviewLabel)
        commentsButton.setAttribute("aria-description", label);
    };
    const render = ({ capture = true } = {}) => {
      if (composing) {
        renderQueued = true;
        return;
      }
      if (capture) captureDrafts();
      const focus = focusDescriptor();
      const scroll = [];
      for (let node = slot; node && root.contains(node); node = node.parentElement)
        scroll.push([node, node.scrollTop, node.scrollLeft]);
      const state = controller.getState();
      const { review, activePinId } = state;
      const allPins = review?.pins ?? [];
      const pins = typeof presentation.filterPin === "function" ? allPins.filter((pin) => presentation.filterPin(pin, state)) : allPins;
      const activeIndex = pins.findIndex((pin) => pin.id === activePinId);
      const visiblePins = pins.slice(0, visibleLimit);
      if (activeIndex >= visibleLimit) visiblePins.push(pins[activeIndex]);
      const fragment = document2.createDocumentFragment();
      const list = createElement(document2, "div", {
        className: "planr-thread-list",
        attributes: { "aria-label": "Comment threads" }
      });
      if (pins.length === 0) {
        list.append(
          createElement(document2, "p", {
            className: "planr-review-empty",
            text: typeof presentation.emptyMessage === "string" ? presentation.emptyMessage : allPins.length ? "No comments match these filters." : "No comments yet. Choose Add comment, then select a point or region in the artifact."
          })
        );
      } else {
        for (const pin of visiblePins) {
          const thread = renderThread(document2, pin, pin.id === activePinId, {
            ...presentation.describePin?.(pin, state),
            compact: presentation.compact === true,
            replyLimit: expandedHistory.get(pin.id) || 2,
            commentExpanded: expandedComments.has(pin.id),
            replyExpanded: expandedReplies.has(pin.id)
          });
          presentation.decorateThread?.({ element: thread, pin, state, document: document2 });
          const reply = thread.querySelector('[name="reply"]');
          if (replyDrafts.has(pin.id)) reply.value = replyDrafts.get(pin.id);
          thread.querySelector(".planr-reply-send").disabled = !reply.value.trim();
          for (const field of thread.querySelectorAll("[data-planr-draft-key]")) {
            if (extraDrafts.has(field.dataset.planrDraftKey))
              field.value = extraDrafts.get(field.dataset.planrDraftKey);
          }
          list.append(thread);
        }
      }
      if (pins.length > visibleLimit)
        list.append(
          createElement(document2, "button", {
            className: "planr-threads-more",
            text: `Show more comments · ${Math.min(visibleLimit, pins.length)} of ${pins.length}`,
            attributes: { type: "button", "data-planr-threads-more": "" }
          })
        );
      fragment.append(list);
      slot.replaceChildren(fragment);
      const identityName2 = controller.getIdentity()?.name ?? "";
      if (document2.activeElement !== identityInput) identityInput.value = identityName2;
      if (identityStatus) {
        identityStatus.dataset.planrIdentityReady = String(Boolean(identityName2));
        identityStatus.textContent = identityName2 ? `Comments will appear as ${identityName2}.` : "Used to sign your comments.";
      }
      overall.maxLength = ARTIFACT_REVIEW_LIMITS.text;
      if (!overallDirty && document2.activeElement !== overall) overall.value = review?.overall ?? "";
      for (const button of decisionButtons) {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.planrDecision === (review?.decision ?? "pending"))
        );
      }
      decisionStatus.textContent = decisionCopy(review?.decision ?? "pending");
      updateCounts(allPins);
      restoreFocus(focus);
      for (const [node, top, left] of scroll) {
        node.scrollTop = top;
        node.scrollLeft = left;
      }
      const openMetric = root.querySelector('[data-planr-metric="open"]');
      if (openMetric)
        openMetric.textContent = `${allPins.filter(({ status }) => status !== "resolved").length} open`;
    };
    const focusThread = (pinId) => {
      const thread = document2.getElementById(artifactReviewThreadDomId(pinId));
      thread?.focus({ preventScroll: true });
      thread?.scrollIntoView?.({ block: "nearest" });
    };
    const emitReview = (review) => {
      const detail = cloneFrozenArtifactReview(review);
      root.dispatchEvent(
        new window.CustomEvent(ARTIFACT_REVIEW_CHANGE_EVENT, {
          detail,
          bubbles: true
        })
      );
    };
    const unsubscribe = controller.subscribe((state, change) => {
      if (destroyed) return;
      if (["review", "review-replaced", "selection"].includes(change.type)) render();
      if (["review", "review-replaced"].includes(change.type) && state.review)
        emitReview(state.review);
    });
    const onInput = (event) => {
      if (event.target !== identityInput) return;
      try {
        controller.setIdentity(event.target.value ? { name: event.target.value } : null);
        const name = controller.getIdentity()?.name ?? "";
        if (identityStatus) {
          identityStatus.dataset.planrIdentityReady = String(Boolean(name));
          identityStatus.textContent = name ? `Comments will appear as ${name}.` : "Used to sign your comments.";
        }
        clearError();
      } catch (error) {
        showError(error);
      }
    };
    const setReplyExpanded = (pinId, expanded, { focus = false } = {}) => {
      const thread = document2.getElementById(artifactReviewThreadDomId(pinId));
      const form = thread?.querySelector("[data-planr-reply-form]");
      const toggle = thread?.querySelector("[data-planr-reply-toggle]");
      if (!form || !toggle) return;
      if (expanded) expandedReplies.add(pinId);
      else expandedReplies.delete(pinId);
      form.hidden = !expanded;
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.textContent = expanded ? "− Reply" : "+ Reply";
      toggle.title = expanded ? "Collapse reply" : "Reply to this comment";
      if (focus)
        (expanded ? form.elements.namedItem("reply") : toggle).focus({ preventScroll: true });
      emitDraftChange();
    };
    const onKeyDown = (event) => {
      const form = event.target?.closest?.("[data-planr-reply-form]");
      if (!form || event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setReplyExpanded(form.dataset.planrReplyForm, false, { focus: true });
      } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (form.elements.namedItem("reply").value.trim()) form.requestSubmit();
      }
    };
    const emitSelection = (pinId) => {
      controller.selectPin(pinId);
      root.dispatchEvent(
        new window.CustomEvent(ARTIFACT_REVIEW_SELECT_EVENT, {
          detail: deepFreeze({ pinId, source: "thread" }),
          bubbles: true
        })
      );
      onSelectPin?.(pinId);
    };
    const onClick = (event) => {
      if (event.target.closest?.("[data-planr-threads-more]")) {
        visibleLimit += presentation.pageSize || 40;
        render();
        return;
      }
      const historyToggle = event.target.closest?.("[data-planr-history-expand]");
      if (historyToggle) {
        const id = historyToggle.dataset.planrHistoryExpand;
        expandedHistory.set(id, (expandedHistory.get(id) || 2) + 20);
        render();
        return;
      }
      const commentToggle = event.target.closest?.("[data-planr-comment-expand]");
      if (commentToggle) {
        const id = commentToggle.dataset.planrCommentExpand;
        if (expandedComments.has(id)) expandedComments.delete(id);
        else expandedComments.add(id);
        render();
        return;
      }
      const replyToggle = event.target?.closest?.("[data-planr-reply-toggle]");
      if (replyToggle) {
        setReplyExpanded(
          replyToggle.dataset.planrReplyToggle,
          replyToggle.getAttribute("aria-expanded") !== "true",
          { focus: true }
        );
        return;
      }
      const action = event.target?.closest?.("[data-planr-thread-action]");
      const focus = event.target?.closest?.("[data-planr-thread-focus]");
      if (action) {
        try {
          const pinId = action.dataset.planrPinId;
          controller.dispatch({
            type: "set-status",
            pinId,
            status: action.dataset.planrThreadAction === "resolve" ? "resolved" : "open"
          });
          announce2(
            action.dataset.planrThreadAction === "resolve" ? "Comment resolved" : "Comment reopened"
          );
          focusThread(pinId);
          clearError();
        } catch (error) {
          showError(error);
        }
        return;
      }
      if (focus) emitSelection(focus.dataset.planrThreadFocus);
    };
    const onSubmit = (event) => {
      const form = event.target?.closest?.("[data-planr-reply-form]");
      if (!form) return;
      event.preventDefault();
      const textarea = form.elements.namedItem("reply");
      const comment = textarea.value;
      if (!comment.trim()) return;
      const wasExpanded = expandedReplies.has(form.dataset.planrReplyForm);
      try {
        textarea.setAttribute("aria-invalid", "false");
        textarea.value = "";
        replyDrafts.delete(form.dataset.planrReplyForm);
        expandedReplies.delete(form.dataset.planrReplyForm);
        controller.dispatch({
          type: "add-reply",
          pinId: form.dataset.planrReplyForm,
          comment
        });
        emitDraftChange();
        announce2("Reply added");
        focusThread(form.dataset.planrReplyForm);
        clearError();
      } catch (error) {
        textarea.value = comment;
        replyDrafts.set(form.dataset.planrReplyForm, comment);
        if (wasExpanded) expandedReplies.add(form.dataset.planrReplyForm);
        textarea?.setAttribute("aria-invalid", "true");
        showError(error);
        textarea?.focus();
      }
    };
    const onOverallChange = () => {
      try {
        const value = overall.value;
        controller.dispatch({ type: "set-overall", overall: value });
        overallDirty = false;
        announce2("Overall note updated");
        clearError();
      } catch (error) {
        showError(error);
      }
    };
    const onDecision = (event) => {
      try {
        const selected = event.currentTarget.dataset.planrDecision;
        const decision = controller.getReview()?.decision === selected ? "pending" : selected;
        controller.dispatch({ type: "set-decision", decision });
        announce2(decisionCopy(decision));
        clearError();
      } catch (error) {
        showError(error);
      }
    };
    const onSelect = (event) => {
      if (event.detail?.source === "thread" || typeof event.detail?.pinId !== "string") return;
      try {
        controller.selectPin(event.detail.pinId);
        focusThread(event.detail.pinId);
      } catch (error) {
        showError(error);
      }
    };
    let lastOpened = null;
    const onThreadOpen = (event) => {
      const thread = event.target.closest?.(".planr-thread[data-planr-pin-id]");
      if (!thread || !slot.contains(thread)) return;
      const pin = controller.getReview()?.pins.find((entry) => entry.id === thread.dataset.planrPinId);
      const key = pin && `${pin.id}:${pin.replies.map((reply) => reply.id).join(",")}`;
      if (!key || lastOpened === key) return;
      lastOpened = key;
      presentation.onThreadOpen?.(pin.id, controller.getState());
      root.dispatchEvent(
        new window.CustomEvent("planr:artifact-thread-open", {
          bubbles: true,
          detail: Object.freeze({ pinId: pin.id })
        })
      );
    };
    const onDraftInput = (event) => {
      const form = event.target.closest?.("[data-planr-reply-form]");
      if (form)
        form.querySelector(".planr-reply-send").disabled = !form.elements.namedItem("reply").value.trim();
      emitDraftChange();
    };
    const onOverallInput = () => {
      overallDirty = true;
      emitDraftChange();
    };
    const onCompositionStart = () => {
      composing = true;
    };
    const onCompositionEnd = () => {
      composing = false;
      if (renderQueued) {
        renderQueued = false;
        render();
      }
    };
    slot.addEventListener("input", onDraftInput);
    slot.addEventListener("focusin", onThreadOpen);
    slot.addEventListener("click", onThreadOpen);
    slot.addEventListener("compositionstart", onCompositionStart);
    slot.addEventListener("compositionend", onCompositionEnd);
    overall.addEventListener("input", onOverallInput);
    identityInput.addEventListener("input", onInput);
    slot.addEventListener("click", onClick);
    slot.addEventListener("submit", onSubmit);
    slot.addEventListener("keydown", onKeyDown);
    overall.addEventListener("change", onOverallChange);
    for (const button of decisionButtons) button.addEventListener("click", onDecision);
    root.addEventListener(ARTIFACT_REVIEW_SELECT_EVENT, onSelect);
    render();
    return Object.freeze({
      controller,
      getReview: () => controller.getReview(),
      getState: () => controller.getState(),
      getIdentity: () => controller.getIdentity(),
      setIdentity: (value) => controller.setIdentity(value),
      dispatch: (action) => controller.dispatch(action),
      replaceReview: (review) => controller.replaceReview(review),
      selectPin: (pinId) => controller.selectPin(pinId),
      render,
      setPresentation(options = {}) {
        if (options.filterKey !== presentation.filterKey || options.pageSize !== void 0 && options.pageSize !== presentation.pageSize)
          visibleLimit = options.pageSize || presentation.pageSize || Infinity;
        presentation = { ...presentation, ...options };
        render();
      },
      snapshotDrafts,
      getReviewOf: () => controller.getReview()?.reviewOf ?? reviewOf,
      restoreDrafts(snapshot) {
        const digest = controller.getReview()?.reviewOf ?? reviewOf;
        if (!snapshot || snapshot.reviewOf !== digest) return false;
        if (typeof snapshot.identity === "string") {
          const name = snapshot.identity.slice(0, ARTIFACT_REVIEW_LIMITS.authorName);
          controller.setIdentity(name.trim() ? { ...controller.getIdentity(), name } : null);
        }
        for (const [id, value] of Object.entries(snapshot.replies ?? {}).slice(
          0,
          ARTIFACT_REVIEW_LIMITS.pins
        )) {
          if (id.length <= ARTIFACT_REVIEW_LIMITS.id && typeof value === "string")
            replyDrafts.set(id, value.slice(0, ARTIFACT_REVIEW_LIMITS.text));
        }
        expandedReplies.clear();
        const expanded = Array.isArray(snapshot.expandedReplies) ? snapshot.expandedReplies : [...replyDrafts.keys()];
        for (const id of expanded.slice(0, ARTIFACT_REVIEW_LIMITS.pins))
          if (typeof id === "string" && id.length <= ARTIFACT_REVIEW_LIMITS.id)
            expandedReplies.add(id);
        for (const [key, value] of Object.entries(snapshot.fields ?? {}).slice(
          0,
          ARTIFACT_REVIEW_LIMITS.pins
        )) {
          if (key.length <= 512 && typeof value === "string")
            extraDrafts.set(key, value.slice(0, ARTIFACT_REVIEW_LIMITS.text));
        }
        overallDirty = snapshot.overall?.dirty === true;
        if (overallDirty && typeof snapshot.overall?.value === "string")
          overall.value = snapshot.overall.value.slice(0, ARTIFACT_REVIEW_LIMITS.text);
        render({ capture: false });
        return true;
      },
      focusThread,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        unsubscribe();
        slot.removeEventListener("input", onDraftInput);
        slot.removeEventListener("focusin", onThreadOpen);
        slot.removeEventListener("click", onThreadOpen);
        slot.removeEventListener("compositionstart", onCompositionStart);
        slot.removeEventListener("compositionend", onCompositionEnd);
        overall.removeEventListener("input", onOverallInput);
        identityInput.removeEventListener("input", onInput);
        slot.removeEventListener("click", onClick);
        slot.removeEventListener("submit", onSubmit);
        slot.removeEventListener("keydown", onKeyDown);
        overall.removeEventListener("change", onOverallChange);
        for (const button of decisionButtons) button.removeEventListener("click", onDecision);
        root.removeEventListener(ARTIFACT_REVIEW_SELECT_EVENT, onSelect);
        if (ownsController) controller.destroy();
      }
    });
  }

  // local-stage-stub:./hosted-viewer.mjs
  function mountHostedArtifactViewer() {
    return null;
  }

  // local-stage-stub:./share-dialog.mjs
  function mountArtifactShareDialog({ root } = {}) {
    const trigger = root?.querySelector?.('[data-planr-action="share"]');
    if (trigger && !trigger.hasAttribute("data-planr-share-adapter")) trigger.hidden = true;
    return null;
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
  function freezeArtifactMetadata(artifact, index) {
    if (!artifact || typeof artifact !== "object") {
      throw new TypeError(`Artifact ${index + 1} must be an object.`);
    }
    if (typeof artifact.id !== "string" || artifact.id.length === 0) {
      throw new TypeError(`Artifact ${index + 1} requires an id.`);
    }
    return Object.freeze({
      id: artifact.id,
      title: typeof artifact.title === "string" && artifact.title.length > 0 ? artifact.title : `Artifact ${index + 1}`,
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
    return artifacts.some(({ id }) => id === requested) ? requested : fallback;
  }
  function normalizeViewMode(value, artifactCount) {
    if (artifactCount < 2) return "single";
    return ["single", "variants", "split"].includes(value) ? value : "variants";
  }
  function createArtifactStagePayload(envelope = {}, { viewer } = {}) {
    const artifacts = Object.freeze(
      (Array.isArray(envelope?.artifacts) ? envelope.artifacts : []).map(freezeArtifactMetadata)
    );
    const sourceViewer = viewer && typeof viewer === "object" ? viewer : envelope?.viewer && typeof envelope.viewer === "object" ? envelope.viewer : {};
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
  function member(value, allowed, fallback) {
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
    return artifacts.some(({ id }) => id === requested) ? requested : fallback;
  }
  function comparisonIdFor(artifacts, activeArtifactId, requested = "") {
    if (requested !== activeArtifactId && artifacts.some(({ id }) => id === requested))
      return requested;
    return artifacts.find(({ id }) => id !== activeArtifactId)?.id ?? "";
  }
  function normalizeViewMode2(value, artifactCount) {
    if (artifactCount < 2) return "single";
    return member(value, VIEW_MODES, "variants");
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
    let status = member(shellModel.status, STATUSES, statusFallback);
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
      reviewMode: member(shellModel.reviewMode, REVIEW_MODES, "interact"),
      zoom: clamp2(
        Number.isInteger(shellModel.zoom) ? shellModel.zoom : ARTIFACT_STAGE_LIMITS.defaultZoom,
        ARTIFACT_STAGE_LIMITS.minZoom,
        ARTIFACT_STAGE_LIMITS.maxZoom
      ),
      railOpen: shellModel.railOpen === void 0 ? presentation === "canvas" : Boolean(shellModel.railOpen),
      theme: member(shellModel.theme, THEMES, "auto"),
      status
    });
  }
  function nextState(state, changes) {
    return Object.freeze({ ...state, ...changes });
  }
  function reduceArtifactStageState(state, action = {}) {
    switch (action.type) {
      case "set-active": {
        const id = availableId2(state.artifacts, action.artifactId);
        if (!id || id === state.activeArtifactId) return state;
        const comparisonArtifactId = id === state.comparisonArtifactId ? state.activeArtifactId : comparisonIdFor(state.artifacts, id, state.comparisonArtifactId);
        return nextState(state, { activeArtifactId: id, comparisonArtifactId });
      }
      case "set-comparison": {
        const id = comparisonIdFor(state.artifacts, state.activeArtifactId, action.artifactId);
        return id === state.comparisonArtifactId ? state : nextState(state, { comparisonArtifactId: id });
      }
      case "set-view-mode": {
        const viewMode = normalizeViewMode2(action.viewMode, state.artifacts.length);
        return viewMode === state.viewMode ? state : nextState(state, { viewMode });
      }
      case "set-review-mode": {
        const reviewMode = member(action.reviewMode, REVIEW_MODES, state.reviewMode);
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
        const theme = member(action.theme, THEMES, state.theme);
        return theme === state.theme ? state : nextState(state, { theme });
      }
      case "cycle-theme": {
        const index = THEMES.indexOf(state.theme);
        return nextState(state, { theme: THEMES[(index + 1) % THEMES.length] });
      }
      case "set-status": {
        const status = member(action.status, STATUSES, state.status);
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
  function clientPointToNormalized(rect, point) {
    assertRect2(rect);
    return Object.freeze({
      x: normalized2((finite2(point?.x ?? point?.clientX) - rect.left) / rect.width),
      y: normalized2((finite2(point?.y ?? point?.clientY) - rect.top) / rect.height)
    });
  }
  function normalizedPointToClient(rect, point) {
    assertRect2(rect);
    return Object.freeze({
      x: rect.left + normalized2(point?.x) * rect.width,
      y: rect.top + normalized2(point?.y) * rect.height
    });
  }
  function parseDataScript(document2, id) {
    const node = document2.getElementById(id);
    if (!node) throw new Error(`Missing artifact shell data: ${id}`);
    return JSON.parse(node.textContent ?? "null");
  }
  function isEditableTarget(target) {
    const HTMLElement = target?.ownerDocument?.defaultView?.HTMLElement;
    return Boolean(
      HTMLElement && target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
    );
  }
  function stageArtifactById(state, id) {
    return state.artifacts.find((artifact) => artifact.id === id) ?? null;
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
      const title = statusPanel.querySelector("strong");
      const detail = statusPanel.querySelector("p");
      if (title) title.textContent = copy.title;
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
    const frameHolds = /* @__PURE__ */ new Map();
    const frameHoldWaiters = /* @__PURE__ */ new Set();
    const frameSlots = /* @__PURE__ */ new Map();
    if (frameBudget !== null) {
      for (const [id, frame] of frames) {
        const host = frame.parentNode;
        if (!host || !root.contains(host) || frame.hasAttribute("src") || frame.hasAttribute("srcdoc"))
          continue;
        const placeholder = document2.createComment("Artifact preview");
        frameSlots.set(id, { host, placeholder });
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
      const visualOrder = state.viewMode === "split" ? [...visible, ...state.artifacts.map(({ id }) => id).filter((id) => !visible.has(id))] : state.artifacts.map(({ id }) => id);
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
      for (const [id, panel] of panels) {
        const isVisible = visible.has(id);
        const isPrimary = id === state.activeArtifactId;
        panel.hidden = !isVisible;
        panel.style.order = String(visualOrder.indexOf(id));
        const artifact = stageArtifactById(state, id);
        panel.setAttribute(
          "aria-label",
          `${isPrimary ? "Primary" : "Comparison"} artifact: ${artifact?.title ?? id}`
        );
        const frame = frames.get(id);
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
      const index = tabs.indexOf(tab);
      if (index < 0) return;
      event.preventDefault();
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
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
        const bounds = layer.getBoundingClientRect();
        emitSelection(layer, {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2
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
      wakeFrameDemand();
      for (const id of [...frameLoads.keys()]) releaseFrame(id);
      for (const remove of cleanup.splice(0)) remove();
      return true;
    }
    const controller = Object.freeze({
      frameBudget,
      holdFrames,
      ensureFrames,
      retryFrames,
      getFrameDiagnostics: () => [...frameDiagnostics.values()],
      getLoadedArtifactIds: () => [...frameLoads].filter(([, record]) => record.status === "ready").map(([id]) => id),
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
      const record = frameLoads.get(artifactId);
      if (!record) return;
      frameLoads.delete(artifactId);
      wakeFrameDemand();
      record.cancelled = true;
      record.abort.abort();
      record.unlisten?.();
      record.detach?.();
      record.reject(error);
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
      if (record.sourceUrl) window.URL.revokeObjectURL(record.sourceUrl);
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
      const record = {
        status: "loading",
        used: ++frameUse,
        cancelled: false,
        abort: typeof window.AbortController === "function" ? new window.AbortController() : { signal: void 0, abort() {
        } }
      };
      record.promise = new Promise((resolve, reject) => {
        record.resolve = resolve;
        record.reject = reject;
      });
      frameLoads.set(artifact.id, record);
      const current = () => !disposed && !record.cancelled && frameLoads.get(artifact.id) === record;
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
        if (!current() || !loaded || record.requireTrust && frame.dataset.planrBridgeTrusted !== "true")
          return;
        record.status = "ready";
        record.unlisten();
        frameStatus(artifact.id, "ready", "ready");
        record.resolve(artifact.id);
      };
      const onLoad = () => {
        loaded = true;
        if (record.requireTrust && frame.dataset.planrBridgeTrusted !== "true") {
          frameStatus(artifact.id, "loading", "bridge");
        }
        ready();
      };
      const onError = () => fail(new Error(`Artifact frame failed: ${artifact.id}`));
      record.unlisten = () => {
        window.clearTimeout(timer);
        frame.removeEventListener("load", onLoad);
        frame.removeEventListener("error", onError);
        frame.removeEventListener("planr:artifact-bridge-ready", ready);
      };
      frameStatus(artifact.id, "loading", "source");
      if (!current()) return record.promise;
      void (async () => {
        const source = await resolveArtifactSource(artifact, {
          frame,
          getState: () => state,
          signal: record.abort.signal
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
          if (typeof detach === "function") record.detach = detach;
          if (!current()) {
            record.detach?.();
            return;
          }
          record.requireTrust = true;
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
          record.sourceUrl = sourceUrl;
          frame.removeAttribute("srcdoc");
          frame.src = sourceUrl;
        }
      })().catch(fail);
      return record.promise;
    }
    function wakeFrameDemand() {
      for (const resolve of frameHoldWaiters) resolve();
      frameHoldWaiters.clear();
    }
    function holdFrames(artifactIds) {
      if (disposed) throw cancelledFrame();
      if (!Array.isArray(artifactIds) || artifactIds.some((id) => !frames.has(id))) {
        throw new TypeError("Requested artifact frames must be known artifact IDs.");
      }
      const ids = [...new Set(artifactIds)];
      for (const id of ids) frameHolds.set(id, (frameHolds.get(id) ?? 0) + 1);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        for (const id of ids) {
          const count = frameHolds.get(id) ?? 0;
          if (count > 1) frameHolds.set(id, count - 1);
          else frameHolds.delete(id);
        }
        wakeFrameDemand();
      };
    }
    function ensureFrames(artifactIds, isCurrent = () => true) {
      if (disposed || !isCurrent()) return Promise.reject(cancelledFrame());
      if (!Array.isArray(artifactIds) || artifactIds.some((id) => typeof id !== "string" || !frames.has(id))) {
        return Promise.reject(new TypeError("Requested artifact frames must be known artifact IDs."));
      }
      const requested = [...new Set(artifactIds)];
      if (frameBudget !== null && requested.length > frameBudget) {
        return Promise.reject(
          new RangeError(`At most ${frameBudget} artifact frames may be requested together.`)
        );
      }
      if (frameBudget === null || requested.every((id) => frameLoads.has(id)))
        return Promise.all(requested.map((id) => assignArtifactSource(stageArtifactById(state, id))));
      const run = async () => {
        if (disposed || !isCurrent()) throw cancelledFrame();
        for (const id of requested) {
          if (disposed || !isCurrent()) throw cancelledFrame();
          if (!frameLoads.has(id)) {
            while (frameLoads.size >= frameBudget) {
              const candidates = [...frameLoads].filter(([loadedId]) => !requested.includes(loadedId) && !frameHolds.has(loadedId)).sort((a, b) => a[1].used - b[1].used);
              if (!candidates.length) {
                if (!frameHolds.size) throw new Error("The artifact frame budget is exhausted.");
                await new Promise((resolve) => frameHoldWaiters.add(resolve));
                if (disposed || !isCurrent()) throw cancelledFrame();
                continue;
              }
              releaseFrame(candidates[0][0]);
            }
          }
          await assignArtifactSource(stageArtifactById(state, id));
        }
        return requested;
      };
      const result = frameQueue.then(run);
      frameQueue = result.catch(() => {
      });
      return result;
    }
    function frameIsReady(id) {
      const frame = frames.get(id);
      return frame?.dataset.planrFrameState === "ready" && (!frame.__openPlanrBridge || frame.dataset.planrBridgeTrusted === "true");
    }
    function setSelectionStatus(status, selection, generation) {
      if (disposed || generation !== activationGeneration || visibleArtifactIds(state).join("|") !== selection)
        return;
      state = reduceArtifactStageState(state, { type: "set-status", status });
      render({ announce: true });
    }
    function cancelInactiveLoads(ids) {
      for (const [id, record] of frameLoads) {
        if (record.status === "loading" && !ids.includes(id) && !frameHolds.has(id)) releaseFrame(id);
      }
    }
    async function activateVisibleFrames() {
      const generation = ++activationGeneration;
      const isCurrent = () => generation === activationGeneration;
      const ids = visibleArtifactIds(state);
      const selection = ids.join("|");
      if (ids.length === 0) return state;
      cancelInactiveLoads(ids);
      if (ids.every(frameIsReady)) {
        setSelectionStatus("ready", selection, generation);
        return state;
      }
      setSelectionStatus("loading", selection, generation);
      try {
        await ensureFrames(ids, isCurrent);
        setSelectionStatus("ready", selection, generation);
      } catch (error) {
        const status = error?.code === "E_ARTIFACT_BROWSER_UNSUPPORTED" ? "unsupported-browser" : "invalid";
        setSelectionStatus(status, selection, generation);
      }
      return state;
    }
    function retryFrames(artifactIds = visibleArtifactIds(state)) {
      if (!Array.isArray(artifactIds) || artifactIds.some((id) => !frames.has(id))) {
        return Promise.reject(new TypeError("Requested artifact frames must be known artifact IDs."));
      }
      for (const id of artifactIds) releaseFrame(id);
      if (artifactIds.some((id) => visibleArtifactIds(state).includes(id))) {
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
            state.artifacts.filter(({ id }) => id !== state.activeArtifactId).map(assignArtifactSource)
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