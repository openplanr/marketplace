

  // lib/artifact/live-room-integrity.mjs
  var ARTIFACT_ROOM_GENESIS_HASH = `sha256:${"0".repeat(64)}`;
  var ARTIFACT_ROOM_MAX_CLOCK_SKEW_MS = 5 * 60 * 1e3;
  var ARTIFACT_ROOM_CAPABILITIES = Object.freeze({
    reviewer: "reviewer-write",
    owner: "owner-verdict",
    management: "room-management"
  });
  var textEncoder = new TextEncoder();

  // lib/artifact/live-room-v3.mjs
  var encoder4 = new TextEncoder();
  var decoder3 = new TextDecoder("utf-8", { fatal: true });
  var preparations = /* @__PURE__ */ new WeakMap();
  function assertLiveRoomV3RecoveryMatchesPreparation(prepared, recovery) {
    const state = preparations.get(prepared), names = [
      "schemaVersion",
      "kind",
      "origin",
      "body",
      "key",
      "reviewOf",
      "inputDigest",
      "ownerSigner"
    ];
    if (!state || !recovery || typeof recovery !== "object" || Array.isArray(recovery) || Object.keys(recovery).length !== names.length || Object.keys(recovery).some((name) => !names.includes(name)) || Object.values(Object.getOwnPropertyDescriptors(recovery)).some(
      (descriptor) => !("value" in descriptor)
    ) || recovery.schemaVersion !== "2.0.0" || recovery.kind !== "openplanr-live-room-recovery")
      throw new TypeError("Room recovery differs from its private preparation.");
    assertSharingSecurityContract(recovery.body, "artifact-room-create-v3");
    const expected = {
      origin: state.origin,
      body: state.body,
      key: state.key,
      reviewOf: state.reviewOf,
      inputDigest: state.inputDigest
    };
    const actual = {
      origin: recovery.origin,
      body: recovery.body,
      key: recovery.key,
      reviewOf: recovery.reviewOf,
      inputDigest: recovery.inputDigest
    };
    if (canonicalizeJson(expected) !== canonicalizeJson(actual))
      throw new TypeError("Room recovery differs from its private preparation.");
    return recovery;
  }

  // lib/artifact/live-room.mjs
  var ARTIFACT_ROOM_EVENT_KINDS = Object.freeze([
    "pin",
    "reply",
    "pin_status",
    "recommendation",
    "owner_decision",
    "review_snapshot"
  ]);
  var ARTIFACT_ROOM_TTLS = Object.freeze(["1d", "7d", "30d"]);
  var MAX_ARTIFACT_HTML_BYTES = 10 * 1024 * 1024;