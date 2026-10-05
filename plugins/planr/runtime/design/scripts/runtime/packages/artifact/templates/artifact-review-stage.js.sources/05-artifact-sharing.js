

  // lib/artifact/resource-pack.mjs
  var encoder = new TextEncoder();
  var decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  var htmlSegmentMagic = encoder.encode(`\0${RESOURCE_HTML_SEGMENT_ENCODING}\0`);

  // lib/artifact/chunked-workspace-client.mjs
  var encoder2 = new TextEncoder();
  var decoder2 = new TextDecoder("utf-8", { fatal: true });

  // lib/artifact/codec.mjs
  var ARTIFACT_FRAGMENT_VERSION = "v1";
  var ARTIFACT_FRAGMENT_PREFIX = `${ARTIFACT_FRAGMENT_VERSION}.`;
  var ARTIFACT_COMPRESSED_LIMIT = 5 * 1024 * 1024;
  var ARTIFACT_EXPANDED_LIMIT = 10 * 1024 * 1024;

  // lib/artifact/sharing-crypto-v2.mjs
  var encoder3 = new TextEncoder();

  // lib/artifact/share-client.mjs
  var ARTIFACT_SHARE_BASE_URL = "https://share.openplanr.dev";
  var ARTIFACT_SHARE_TTLS = Object.freeze(["1d", "7d", "30d"]);
  function shareError(code, message, fix = "") {
    return new PipelineError(code, message, fix);
  }
  function loopback(hostname) {
    return ["127.0.0.1", "localhost", "[::1]"].includes(hostname);
  }
  function normalizeBaseUrl(value = ARTIFACT_SHARE_BASE_URL) {
    let url;
    try {
      url = new globalThis.URL(value);
    } catch {
      throw shareError(ARTIFACT_ERROR_CODES.PASTE_INVALID, "Artifact share service URL is invalid.");
    }
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/" && url.pathname !== "" || url.protocol !== "https:" && !(url.protocol === "http:" && loopback(url.hostname))) {
      throw shareError(
        ARTIFACT_ERROR_CODES.PASTE_INVALID,
        "Artifact share service URL is not a secure origin."
      );
    }
    return url;
  }
  function assertPreparedArtifactPaste(value) {
    const names = [
      "schemaVersion",
      "kind",
      "origin",
      "body",
      "key",
      "custodyToken",
      "fragmentLength",
      "compressedBytes"
    ];
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== names.length || Object.keys(value).some((name) => !names.includes(name)) || value.schemaVersion !== "1.0.0" || value.kind !== "openplanr-artifact-paste-preparation" || normalizeBaseUrl(value.origin).origin !== value.origin || !/^[A-Za-z0-9_-]{43}$/u.test(value.key ?? "") || !/^[A-Za-z0-9_-]{43}$/u.test(value.custodyToken ?? "") || value.key === value.custodyToken || !Number.isSafeInteger(value.fragmentLength) || value.fragmentLength < 1 || value.fragmentLength > 8 * 1024 * 1024 || !Number.isSafeInteger(value.compressedBytes) || value.compressedBytes < 1 || value.compressedBytes > ARTIFACT_COMPRESSED_LIMIT)
      throw shareError(ARTIFACT_ERROR_CODES.PASTE_INVALID, "Prepared paste custody is invalid.");
    assertSharingSecurityContract(value.body, "artifact-paste-v2");
    if ((/* @__PURE__ */ new Set([value.key, value.custodyToken, value.body.id, value.body.creationId])).size !== 4)
      throw shareError(
        ARTIFACT_ERROR_CODES.PASTE_INVALID,
        "Paste private secrets must differ from public identity."
      );
    return value;
  }