

  // lib/artifact/ui/review-outbox.mjs
  function createReviewOutbox({
    scope,
    indexedDB = globalThis.indexedDB,
    databaseName = "openplanr-review-outbox-v1",
    leaseMs = 3e4,
    now = Date.now,
    validatePayload = (payload) => payload !== null && typeof payload === "object"
  }) {
    for (const value of [scope.workspaceId, scope.revisionId, scope.actorId])
      if (typeof value !== "string" || !value || value.length > 512)
        throw new TypeError("Review custody requires workspace, revision and actor identities.");
    if (!Number.isFinite(leaseMs) || leaseMs < 300)
      throw new TypeError("A review lease must be at least 300ms.");
    const scopeKey = JSON.stringify([scope.workspaceId, scope.revisionId, scope.actorId]);
    const key = (id7) => {
      if (typeof id7 !== "string" || !id7 || id7.length > 512)
        throw new TypeError("A review operation needs a stable identity.");
      return JSON.stringify([scopeKey, id7]);
    };
    let closed6 = false, draining = null;
    const listeners = /* @__PURE__ */ new Set();
    const heartbeats = /* @__PURE__ */ new Set();
    const channel = typeof globalThis.BroadcastChannel === "function" ? new globalThis.BroadcastChannel(databaseName) : null;
    const notify = () => {
      listeners.forEach((listener) => {
        listener();
      });
      channel?.postMessage(scopeKey);
    };
    if (channel)
      channel.onmessage = (event) => {
        if (event.data === scopeKey)
          listeners.forEach((listener) => {
            listener();
          });
      };
    const database = new Promise((resolve, reject) => {
      if (!indexedDB) {
        reject(
          new Error(
            "Durable review storage is unavailable. Enable browser storage before sending feedback."
          )
        );
        return;
      }
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("operations", { keyPath: "key" });
        store.createIndex("scope", "scopeKey", { unique: false });
      };
      request.onerror = () => reject(request.error ?? new Error("Durable review storage could not open."));
      request.onblocked = () => reject(new Error("Close older review tabs to open durable review storage."));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        if (closed6) db.close();
        resolve(db);
      };
    });
    void database.catch(() => {
    });
    async function transaction(mode, work) {
      if (closed6) throw new Error("Review custody has closed.");
      const db = await database;
      return new Promise((resolve, reject) => {
        const tx = db.transaction("operations", mode), store = tx.objectStore("operations");
        let value;
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error ?? new Error("Review storage could not commit."));
        tx.onabort = () => reject(tx.error ?? new Error("Review storage did not commit."));
        const guard = (callback) => () => {
          try {
            callback();
          } catch (error) {
            try {
              tx.abort();
            } catch {
            }
            reject(error);
          }
        };
        guard(
          () => work(
            store,
            (next) => {
              value = next;
            },
            guard
          )
        )();
      });
    }
    const publicEntry = ({
      key: _key,
      scopeKey: _scope,
      leaseOwner: _owner,
      leaseUntil: _until,
      custodyInvalid: _invalid,
      invalidRecord: _record,
      ...entry
    }) => entry;
    function payloadValid(payload) {
      try {
        return validatePayload(payload);
      } catch {
        return false;
      }
    }
    function keyedIdentity(primaryKey) {
      if (typeof primaryKey !== "string") return null;
      try {
        const value = JSON.parse(primaryKey);
        return Array.isArray(value) && value.length === 2 && value[0] === scopeKey && typeof value[1] === "string" && value[1].length > 0 && value[1].length <= 512 ? value[1] : null;
      } catch {
        return null;
      }
    }
    function storedEntry(raw, primaryKey, store) {
      const record2 = raw !== null && typeof raw === "object" ? raw : null;
      const fromKey = keyedIdentity(primaryKey);
      if (record2?.scopeKey !== scopeKey && !fromKey) return null;
      const allowed = /* @__PURE__ */ new Set([
        "key",
        "scopeKey",
        "operationId",
        "payload",
        "status",
        "attempts",
        "createdAt",
        "nextAttemptAt",
        "errorCode",
        "leaseOwner",
        "leaseUntil",
        "custodyInvalid",
        "invalidRecord"
      ]);
      const finiteTime = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
      const integer3 = (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
      if (record2 && Object.keys(record2).every((name) => allowed.has(name)) && fromKey !== null && fromKey === record2.operationId && record2.key === primaryKey && record2.scopeKey === scopeKey && Object.hasOwn(record2, "payload") && ["pending", "quarantined"].includes(String(record2.status)) && integer3(record2.attempts) && finiteTime(record2.createdAt) && finiteTime(record2.nextAttemptAt) && (record2.errorCode === void 0 || typeof record2.errorCode === "string" && record2.errorCode.length <= 120) && (record2.leaseOwner === void 0 && record2.leaseUntil === void 0 || typeof record2.leaseOwner === "string" && record2.leaseOwner.length > 0 && record2.leaseOwner.length <= 128 && finiteTime(record2.leaseUntil)) && (record2.custodyInvalid === true ? record2.status === "quarantined" && record2.errorCode === "malformed_custody" : record2.custodyInvalid === void 0 && record2.invalidRecord === void 0 && payloadValid(record2.payload)))
        return record2;
      const operationId = fromKey ?? `invalid-${globalThis.crypto.randomUUID()}`;
      const repaired = {
        key: key(operationId),
        scopeKey,
        operationId,
        payload: record2 && Object.hasOwn(record2, "payload") ? record2.payload : null,
        status: "quarantined",
        attempts: 0,
        createdAt: 0,
        nextAttemptAt: 0,
        errorCode: "malformed_custody",
        custodyInvalid: true,
        invalidRecord: raw
      };
      store.put(repaired);
      if (primaryKey !== repaired.key) store.delete(primaryKey);
      return repaired;
    }
    function readScoped(store, result, guard) {
      const entries = [];
      const seen = /* @__PURE__ */ new Set();
      const request = store.openCursor();
      request.onsuccess = guard(() => {
        const cursor = request.result;
        if (!cursor) {
          result(entries);
          return;
        }
        const entry = storedEntry(cursor.value, cursor.primaryKey, store);
        if (entry && !seen.has(entry.key)) {
          seen.add(entry.key);
          entries.push(entry);
        }
        cursor.continue();
      });
    }
    async function mutate(id7, update) {
      await transaction("readwrite", (store, _result, guard) => {
        const operationKey = key(id7);
        const request = store.get(operationKey);
        request.onsuccess = guard(() => {
          if (request.result === void 0) return;
          const entry = storedEntry(request.result, operationKey, store);
          if (entry) update(entry, store);
        });
      });
      notify();
    }
    async function claim(owner) {
      return transaction("readwrite", (store, result, guard) => {
        readScoped(
          store,
          (entries) => {
            const time = now();
            const next = entries.filter(
              (entry) => entry.status === "pending" && entry.nextAttemptAt <= time && (!entry.leaseUntil || entry.leaseUntil <= time)
            ).sort(
              (a, b) => a.createdAt - b.createdAt || a.operationId.localeCompare(b.operationId)
            )[0];
            if (!next) {
              result(null);
              return;
            }
            next.leaseOwner = owner;
            next.leaseUntil = time + leaseMs;
            store.put(next);
            result(next);
          },
          guard
        );
      });
    }
    return {
      async enqueue({ operationId, payload }) {
        const immutable = structuredClone(payload), operationKey = key(operationId);
        if (!payloadValid(immutable)) throw new TypeError("Prepared review custody is invalid.");
        await transaction("readwrite", (store, _result, guard) => {
          const request = store.get(operationKey);
          request.onsuccess = guard(() => {
            if (request.result !== void 0) {
              storedEntry(request.result, operationKey, store);
              return;
            }
            store.add({
              key: operationKey,
              scopeKey,
              operationId,
              payload: immutable,
              status: "pending",
              attempts: 0,
              createdAt: now(),
              nextAttemptAt: 0
            });
          });
        });
        notify();
      },
      async list() {
        return transaction("readwrite", (store, result, guard) => {
          readScoped(
            store,
            (entries) => result(
              entries.sort(
                (a, b) => a.createdAt - b.createdAt || a.operationId.localeCompare(b.operationId)
              ).map(publicEntry)
            ),
            guard
          );
        });
      },
      async retry(id7) {
        await mutate(id7, (entry, store) => {
          if (entry.custodyInvalid || entry.leaseUntil && entry.leaseUntil > now()) return;
          entry.status = "pending";
          entry.nextAttemptAt = 0;
          delete entry.errorCode;
          store.put(entry);
        });
      },
      async quarantine(id7, code) {
        await mutate(id7, (entry, store) => {
          if (entry.leaseUntil && entry.leaseUntil > now()) return;
          entry.status = "quarantined";
          entry.nextAttemptAt = 0;
          entry.errorCode = entry.custodyInvalid ? "malformed_custody" : String(code).slice(0, 120);
          store.put(entry);
        });
      },
      async remove(id7) {
        await mutate(id7, (entry, store) => {
          if (!entry.leaseUntil || entry.leaseUntil <= now()) store.delete(entry.key);
        });
      },
      drain(send) {
        if (draining) return draining;
        const owner = globalThis.crypto.randomUUID();
        draining = (async () => {
          while (!closed6) {
            const entry = await claim(owner);
            if (!entry) return;
            const heartbeat = globalThis.setInterval(
              () => {
                void mutate(entry.operationId, (current, store) => {
                  if (current.leaseOwner === owner) {
                    current.leaseUntil = now() + leaseMs;
                    store.put(current);
                  }
                }).catch(() => {
                });
              },
              Math.floor(leaseMs / 3)
            );
            heartbeats.add(heartbeat);
            let outcome;
            try {
              outcome = await send(publicEntry(entry));
            } catch {
              outcome = { status: "retry", code: "network" };
            } finally {
              globalThis.clearInterval(heartbeat);
              heartbeats.delete(heartbeat);
            }
            if (!outcome || !["delivered", "retry", "rejected"].includes(outcome.status))
              outcome = { status: "retry", code: "invalid-delivery-result" };
            await mutate(entry.operationId, (current, store) => {
              if (current.leaseOwner !== owner) return;
              if (outcome.status === "delivered") {
                store.delete(current.key);
                return;
              }
              delete current.leaseOwner;
              delete current.leaseUntil;
              current.attempts += 1;
              current.errorCode = typeof outcome.code === "string" ? outcome.code.slice(0, 120) : outcome.status;
              current.status = outcome.status === "rejected" ? "quarantined" : "pending";
              const requestedDelay = Number.isFinite(outcome.retryAfterMs) ? Math.max(0, Math.min(36e5, outcome.retryAfterMs)) : 0;
              current.nextAttemptAt = outcome.status === "retry" ? now() + Math.max(
                requestedDelay,
                Math.min(6e4, 1e3 * 2 ** Math.min(current.attempts - 1, 6))
              ) : 0;
              store.put(current);
            });
          }
        })().finally(() => {
          draining = null;
        });
        return draining;
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      close() {
        closed6 = true;
        for (const heartbeat of heartbeats) globalThis.clearInterval(heartbeat);
        heartbeats.clear();
        channel?.close();
        listeners.clear();
        void database.then((db) => db.close()).catch(() => {
        });
      }
    };
  }

  // lib/artifact/ui/durable-paste-share.mjs
  var retainedPreparation = /* @__PURE__ */ Symbol("private-paste-preparation-retained");
  function preparation(value) {
    assertPreparedArtifactPaste(value);
    return value;
  }
  function receipt(prepared, value) {
    const url = new URL(`/p/${prepared.body.id}`, prepared.origin);
    url.hash = `k=${prepared.key}&v=2`;
    if (!value || value.url !== url.toString() || value.deletionToken !== prepared.custodyToken || typeof value.expiresAt !== "string" || !Number.isFinite(Date.parse(value.expiresAt)))
      throw new Error("Paste receipt differs from saved private custody.");
    return value;
  }
  function createDurablePasteShare({
    scope,
    create,
    commit,
    indexedDB = globalThis.indexedDB,
    databaseName = "openplanr-paste-custody-v1"
  }) {
    const queues = /* @__PURE__ */ new Map();
    function queueFor(request) {
      const base = scope(), revisionId2 = `${base.revisionId}:${request.ttl ?? "7d"}`, identity = JSON.stringify({ ...base, revisionId: revisionId2 });
      let queue = queues.get(identity);
      if (!queue) {
        queue = createReviewOutbox({ scope: { ...base, revisionId: revisionId2 }, indexedDB, databaseName });
        queues.set(identity, queue);
      }
      return queue;
    }
    const activeReceipt = (entries) => entries.map((entry) => entry.payload).find(
      (value) => value?.kind === "paste-receipt" && typeof value.result?.expiresAt === "string" && Date.parse(value.result.expiresAt) > Date.now()
    );
    return {
      async run(request) {
        if (request.transport !== "short") return create(request);
        const queue = queueFor(request);
        let entries = await queue.list();
        const prior = activeReceipt(entries);
        if (prior) return receipt(preparation(prior.prepared), prior.result ?? null);
        let pending = entries.find(
          (entry) => entry.payload?.kind === "prepared-paste"
        );
        if (pending?.status === "quarantined")
          throw new Error(
            "The saved paste operation was rejected. Its private recovery custody is retained."
          );
        if (!pending) {
          try {
            await create({
              ...request,
              onPreparedPaste: async (value) => {
                const prepared = preparation(value);
                if (prepared.body.ttl !== (request.ttl ?? "7d"))
                  throw new Error("Prepared paste expiry differs.");
                await queue.enqueue({
                  operationId: prepared.body.creationId,
                  payload: { kind: "prepared-paste", prepared }
                });
                throw retainedPreparation;
              }
            });
          } catch (error) {
            if (error !== retainedPreparation) throw error;
          }
          entries = await queue.list();
          pending = entries.find(
            (entry) => entry.payload?.kind === "prepared-paste"
          );
          if (!pending)
            throw new Error(
              "This host did not retain paste custody before publication. Update OpenPlanr and retry."
            );
        }
        await queue.retry(pending.operationId);
        let result = null;
        await queue.drain(async (entry) => {
          const value = entry.payload;
          if (value?.kind === "paste-receipt")
            return { status: "rejected", code: "private-custody-receipt" };
          try {
            const prepared = preparation(value?.prepared);
            const created = receipt(prepared, await commit(prepared));
            const receiptId = `${prepared.body.creationId}:receipt`;
            await queue.enqueue({
              operationId: receiptId,
              payload: { kind: "paste-receipt", prepared, result: created }
            });
            await queue.quarantine(receiptId, "private-custody-receipt");
            result = created;
            return { status: "delivered" };
          } catch (error) {
            const code = error?.code;
            return typeof code === "string" && ["E_ARTIFACT_SHARE_NETWORK", "E_ARTIFACT_PASTE_UNAVAILABLE"].includes(code) ? { status: "retry", code } : { status: "rejected", code: "paste-rejected" };
          }
        });
        if (result) return result;
        const completed = activeReceipt(await queue.list());
        if (completed) return receipt(preparation(completed.prepared), completed.result ?? null);
        throw new Error(
          "Paste publication is pending. Retry this share to resume the saved encrypted operation; another tab may be sending it."
        );
      },
      close() {
        for (const queue of queues.values()) queue.close();
        queues.clear();
      }
    };
  }

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
    const timestamp2 = value instanceof Date ? value.toISOString() : value;
    if (typeof timestamp2 !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp2) || !Number.isFinite(Date.parse(timestamp2))) {
      invalid(`${label} must be an ISO-8601 date-time.`);
    }
    return timestamp2;
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
    const id7 = optionalString(source.id, "author.id", {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.id,
      trim: true
    });
    return deepFreeze(id7 === void 0 ? { name } : { id: id7, name });
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
  function normalizeAnchor(anchor2) {
    if (anchor2 === void 0 || anchor2 === null) return void 0;
    if (typeof anchor2 !== "object" || Array.isArray(anchor2)) invalid("pin.anchor must be an object.");
    const planrId = boundedString(anchor2.planrId, "pin.anchor.planrId", {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.anchor,
      trim: true
    });
    const screen = optionalString(anchor2.screen, "pin.anchor.screen", {
      min: 1,
      max: ARTIFACT_REVIEW_LIMITS.screen,
      trim: true
    });
    return screen === void 0 ? { planrId } : { planrId, screen };
  }
  function normalizeReply(reply2, label = "reply") {
    if (!reply2 || typeof reply2 !== "object" || Array.isArray(reply2))
      invalid(`${label} must be an object.`);
    return {
      id: boundedString(reply2.id, `${label}.id`, {
        min: 1,
        max: ARTIFACT_REVIEW_LIMITS.id,
        trim: true
      }),
      author: normalizeArtifactReviewIdentity(reply2.author),
      comment: boundedString(reply2.comment, `${label}.comment`, {
        min: 1,
        max: ARTIFACT_REVIEW_LIMITS.text,
        trim: true
      }),
      createdAt: isoTimestamp(reply2.createdAt, `${label}.createdAt`)
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
      (reply2, index2) => normalizeReply(reply2, `${label}.replies[${index2}]`)
    );
    const replyIds = new Set(replies.map(({ id: id7 }) => id7));
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
    const anchor2 = normalizeAnchor(pin.anchor);
    if (variant !== void 0) normalized3.variant = variant;
    if (anchor2 !== void 0) normalized3.anchor = anchor2;
    return normalized3;
  }
  function normalizeArtifactReview(review) {
    if (!review || typeof review !== "object" || Array.isArray(review)) {
      invalid("Artifact review must be an object.");
    }
    if (!Array.isArray(review.pins) || review.pins.length > ARTIFACT_REVIEW_LIMITS.pins) {
      invalid(`review.pins must contain no more than ${ARTIFACT_REVIEW_LIMITS.pins} items.`);
    }
    const pins = review.pins.map((pin, index2) => normalizePin(pin, `review.pins[${index2}]`));
    const pinIds = new Set(pins.map(({ id: id7 }) => id7));
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
    const pin = review.pins.find(({ id: id7 }) => id7 === normalizedId);
    if (!pin) {
      throw new ArtifactReviewStateError(
        "E_ARTIFACT_REVIEW_PIN_NOT_FOUND",
        `Unknown feedback pin: ${normalizedId}`
      );
    }
    return pin;
  }
  function preserveOptionalReviewTimestamps(review, next, timestamp2) {
    if (review.createdAt !== void 0) next.createdAt = review.createdAt;
    if (review.updatedAt !== void 0) next.updatedAt = timestamp2;
    return next;
  }
  function reduceArtifactReview(review, action, { createId = defaultCreateId, now = defaultNow } = {}) {
    const current = normalizeArtifactReview(review);
    if (!action || typeof action !== "object" || Array.isArray(action))
      invalid("Review action must be an object.");
    const timestamp2 = dependencyTimestamp(now);
    let next;
    switch (action.type) {
      case "add-pin": {
        if (current.pins.length >= ARTIFACT_REVIEW_LIMITS.pins) {
          invalid(`A review can contain at most ${ARTIFACT_REVIEW_LIMITS.pins} pins.`);
        }
        const author = normalizeArtifactReviewIdentity(action.author);
        const pinInput = action.pin && typeof action.pin === "object" ? action.pin : {};
        const pinId = pinInput.id === void 0 ? uniqueDependencyId(createId, "pin", new Set(current.pins.map(({ id: id7 }) => id7))) : boundedString(pinInput.id, "pin.id", {
          min: 1,
          max: ARTIFACT_REVIEW_LIMITS.id,
          trim: true
        });
        if (current.pins.some(({ id: id7 }) => id7 === pinId)) {
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
          createdAt: pinInput.createdAt ?? timestamp2,
          updatedAt: pinInput.updatedAt ?? timestamp2
        });
        next = preserveOptionalReviewTimestamps(
          current,
          {
            ...current,
            pins: [...current.pins, pin]
          },
          timestamp2
        );
        break;
      }
      case "add-reply": {
        const pin = findPin(current, action.pinId);
        if (pin.replies.length >= ARTIFACT_REVIEW_LIMITS.replies) {
          invalid(`A feedback thread can contain at most ${ARTIFACT_REVIEW_LIMITS.replies} replies.`);
        }
        const replyId = action.id === void 0 ? uniqueDependencyId(createId, "reply", new Set(pin.replies.map(({ id: id7 }) => id7))) : boundedString(action.id, "reply.id", {
          min: 1,
          max: ARTIFACT_REVIEW_LIMITS.id,
          trim: true
        });
        if (pin.replies.some(({ id: id7 }) => id7 === replyId)) {
          throw new ArtifactReviewStateError(
            "E_ARTIFACT_REVIEW_ID_COLLISION",
            `Duplicate reply id: ${replyId}`
          );
        }
        const reply2 = normalizeReply({
          id: replyId,
          author: normalizeArtifactReviewIdentity(action.author),
          comment: action.comment,
          createdAt: action.createdAt ?? timestamp2
        });
        const updatedPin = normalizePin({
          ...pin,
          replies: [...pin.replies, reply2],
          updatedAt: timestamp2
        });
        next = preserveOptionalReviewTimestamps(
          current,
          {
            ...current,
            pins: replacePin(current, updatedPin)
          },
          timestamp2
        );
        break;
      }
      case "set-status": {
        const pin = findPin(current, action.pinId);
        const updatedPin = normalizePin({
          ...pin,
          status: enumValue(action.status, ARTIFACT_REVIEW_STATUSES, "status"),
          updatedAt: timestamp2
        });
        next = preserveOptionalReviewTimestamps(
          current,
          {
            ...current,
            pins: replacePin(current, updatedPin)
          },
          timestamp2
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
          timestamp2
        );
        break;
      case "set-decision":
        next = preserveOptionalReviewTimestamps(
          current,
          {
            ...current,
            decision: enumValue(action.decision, ARTIFACT_REVIEW_DECISIONS, "decision")
          },
          timestamp2
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
        const previousPinIds = nextAction?.type === "add-pin" ? new Set(review?.pins.map(({ id: id7 }) => id7) ?? []) : null;
        review = reduceArtifactReview(ensureReview(), nextAction, { createId, now });
        if (previousPinIds) {
          activePinId = review.pins.find(({ id: id7 }) => !previousPinIds.has(id7))?.id ?? activePinId;
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
        if (activePinId && !review?.pins.some(({ id: id7 }) => id7 === activePinId)) activePinId = null;
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
  function createElement(document2, tagName, { className, text: text5, attributes = {} } = {}) {
    const element = document2.createElement(tagName);
    if (className) element.className = className;
    if (text5 !== void 0) element.textContent = text5;
    for (const [name, value] of Object.entries(attributes)) {
      if (value !== void 0 && value !== null) element.setAttribute(name, String(value));
    }
    return element;
  }
  function artifactReviewThreadDomId(pinId) {
    return annotationDomIds(pinId).thread;
  }
  function displayTimestamp(timestamp2) {
    const canonical = new Date(timestamp2).toISOString();
    return `${canonical.slice(0, 10)} ${canonical.slice(11, 16)} UTC`;
  }
  function renderReply(document2, reply2) {
    const item2 = createElement(document2, "li", {
      className: "planr-reply",
      attributes: { "data-planr-reply-id": reply2.id }
    });
    const heading = createElement(document2, "header");
    heading.append(createElement(document2, "strong", { text: reply2.author.name }));
    const time = createElement(document2, "time", {
      text: displayTimestamp(reply2.createdAt),
      attributes: { datetime: reply2.createdAt }
    });
    heading.append(time);
    item2.append(heading, createElement(document2, "p", { text: reply2.comment }));
    return item2;
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
    for (const reply2 of pin.replies.slice(earlierReplies))
      replies.append(renderReply(document2, reply2));
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
      const thread2 = element.closest("[data-planr-pin-id]");
      return {
        id: element.id,
        pinId: thread2?.dataset.planrPinId,
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
      const thread2 = descriptor.pinId && document2.getElementById(artifactReviewThreadDomId(descriptor.pinId));
      const target = descriptor.id && document2.getElementById(descriptor.id) || descriptor.draftKey && [...slot.querySelectorAll("[data-planr-draft-key]")].find(
        (field) => field.dataset.planrDraftKey === descriptor.draftKey
      ) || descriptor.action && [...thread2?.querySelectorAll("[data-planr-thread-action]") ?? []].find(
        (button) => button.dataset.planrThreadAction === descriptor.action
      ) || descriptor.showPin && thread2?.querySelector("[data-planr-thread-focus]") || [...thread2?.querySelectorAll("button,input,select,textarea") ?? []].find(
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
      for (const count2 of root.querySelectorAll(
        '[data-planr-action="feedback"] .planr-count, .planr-review-rail > header .planr-count'
      )) {
        count2.textContent = String(pins.length);
        count2.setAttribute("aria-label", label);
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
      for (let node2 = slot; node2 && root.contains(node2); node2 = node2.parentElement)
        scroll.push([node2, node2.scrollTop, node2.scrollLeft]);
      const state = controller.getState();
      const { review, activePinId } = state;
      const allPins = review?.pins ?? [];
      const pins = typeof presentation.filterPin === "function" ? allPins.filter((pin) => presentation.filterPin(pin, state)) : allPins;
      const activeIndex = pins.findIndex((pin) => pin.id === activePinId);
      const visiblePins = pins.slice(0, visibleLimit);
      if (activeIndex >= visibleLimit) visiblePins.push(pins[activeIndex]);
      const fragment = document2.createDocumentFragment();
      const list3 = createElement(document2, "div", {
        className: "planr-thread-list",
        attributes: { "aria-label": "Comment threads" }
      });
      if (pins.length === 0) {
        list3.append(
          createElement(document2, "p", {
            className: "planr-review-empty",
            text: typeof presentation.emptyMessage === "string" ? presentation.emptyMessage : allPins.length ? "No comments match these filters." : "No comments yet. Choose Add comment, then select a point or region in the artifact."
          })
        );
      } else {
        for (const pin of visiblePins) {
          const thread2 = renderThread(document2, pin, pin.id === activePinId, {
            ...presentation.describePin?.(pin, state),
            compact: presentation.compact === true,
            replyLimit: expandedHistory.get(pin.id) || 2,
            commentExpanded: expandedComments.has(pin.id),
            replyExpanded: expandedReplies.has(pin.id)
          });
          presentation.decorateThread?.({ element: thread2, pin, state, document: document2 });
          const reply2 = thread2.querySelector('[name="reply"]');
          if (replyDrafts.has(pin.id)) reply2.value = replyDrafts.get(pin.id);
          thread2.querySelector(".planr-reply-send").disabled = !reply2.value.trim();
          for (const field of thread2.querySelectorAll("[data-planr-draft-key]")) {
            if (extraDrafts.has(field.dataset.planrDraftKey))
              field.value = extraDrafts.get(field.dataset.planrDraftKey);
          }
          list3.append(thread2);
        }
      }
      if (pins.length > visibleLimit)
        list3.append(
          createElement(document2, "button", {
            className: "planr-threads-more",
            text: `Show more comments · ${Math.min(visibleLimit, pins.length)} of ${pins.length}`,
            attributes: { type: "button", "data-planr-threads-more": "" }
          })
        );
      fragment.append(list3);
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
      for (const [node2, top, left] of scroll) {
        node2.scrollTop = top;
        node2.scrollLeft = left;
      }
      const openMetric = root.querySelector('[data-planr-metric="open"]');
      if (openMetric)
        openMetric.textContent = `${allPins.filter(({ status }) => status !== "resolved").length} open`;
    };
    const focusThread = (pinId) => {
      const thread2 = document2.getElementById(artifactReviewThreadDomId(pinId));
      thread2?.focus({ preventScroll: true });
      thread2?.scrollIntoView?.({ block: "nearest" });
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
      const thread2 = document2.getElementById(artifactReviewThreadDomId(pinId));
      const form = thread2?.querySelector("[data-planr-reply-form]");
      const toggle = thread2?.querySelector("[data-planr-reply-toggle]");
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
        const id7 = historyToggle.dataset.planrHistoryExpand;
        expandedHistory.set(id7, (expandedHistory.get(id7) || 2) + 20);
        render();
        return;
      }
      const commentToggle = event.target.closest?.("[data-planr-comment-expand]");
      if (commentToggle) {
        const id7 = commentToggle.dataset.planrCommentExpand;
        if (expandedComments.has(id7)) expandedComments.delete(id7);
        else expandedComments.add(id7);
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
      const thread2 = event.target.closest?.(".planr-thread[data-planr-pin-id]");
      if (!thread2 || !slot.contains(thread2)) return;
      const pin = controller.getReview()?.pins.find((entry) => entry.id === thread2.dataset.planrPinId);
      const key = pin && `${pin.id}:${pin.replies.map((reply2) => reply2.id).join(",")}`;
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
      restoreDrafts(snapshot2) {
        const digest7 = controller.getReview()?.reviewOf ?? reviewOf;
        if (!snapshot2 || snapshot2.reviewOf !== digest7) return false;
        if (typeof snapshot2.identity === "string") {
          const name = snapshot2.identity.slice(0, ARTIFACT_REVIEW_LIMITS.authorName);
          controller.setIdentity(name.trim() ? { ...controller.getIdentity(), name } : null);
        }
        for (const [id7, value] of Object.entries(snapshot2.replies ?? {}).slice(
          0,
          ARTIFACT_REVIEW_LIMITS.pins
        )) {
          if (id7.length <= ARTIFACT_REVIEW_LIMITS.id && typeof value === "string")
            replyDrafts.set(id7, value.slice(0, ARTIFACT_REVIEW_LIMITS.text));
        }
        expandedReplies.clear();
        const expanded = Array.isArray(snapshot2.expandedReplies) ? snapshot2.expandedReplies : [...replyDrafts.keys()];
        for (const id7 of expanded.slice(0, ARTIFACT_REVIEW_LIMITS.pins))
          if (typeof id7 === "string" && id7.length <= ARTIFACT_REVIEW_LIMITS.id)
            expandedReplies.add(id7);
        for (const [key, value] of Object.entries(snapshot2.fields ?? {}).slice(
          0,
          ARTIFACT_REVIEW_LIMITS.pins
        )) {
          if (key.length <= 512 && typeof value === "string")
            extraDrafts.set(key, value.slice(0, ARTIFACT_REVIEW_LIMITS.text));
        }
        overallDirty = snapshot2.overall?.dirty === true;
        if (overallDirty && typeof snapshot2.overall?.value === "string")
          overall.value = snapshot2.overall.value.slice(0, ARTIFACT_REVIEW_LIMITS.text);
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