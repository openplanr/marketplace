// packages/artifact/lib/artifact/internal/planr-home.mjs
import { homedir } from "node:os";
import { join, resolve } from "node:path";
var WARNED = /* @__PURE__ */ Symbol.for("openplanr.home-variable-warning");
function nonBlank(value) {
  return typeof value === "string" && value.trim() ? value : void 0;
}
function warnOnce(message) {
  if (globalThis[WARNED]) return;
  globalThis[WARNED] = true;
  process.stderr.write(`Warning: ${message}
`);
}
function homeVariables(env) {
  const home = nonBlank(env.PLANR_HOME);
  const legacy = nonBlank(env.OPENPLANR_HOME);
  if (legacy === void 0) return { home, legacy };
  const legacyHome = join(legacy, ".planr");
  if (home === void 0) {
    warnOnce(`OPENPLANR_HOME is deprecated; set PLANR_HOME=${legacyHome} instead.`);
    return { home, legacy };
  }
  warnOnce(
    resolve(home) === resolve(legacyHome) ? "OPENPLANR_HOME is deprecated and ignored because PLANR_HOME is set; unset OPENPLANR_HOME." : `PLANR_HOME=${home} and OPENPLANR_HOME=${legacy} name different OpenPlanr homes; using PLANR_HOME. OPENPLANR_HOME is deprecated; unset it.`
  );
  return { home, legacy: void 0 };
}
function configuredPlanrHome(env = process.env) {
  const { home, legacy } = homeVariables(env);
  return home ?? (legacy === void 0 ? void 0 : join(legacy, ".planr"));
}
function planrHome(env = process.env) {
  return configuredPlanrHome(env) ?? join(homedir(), ".planr");
}

// packages/artifact/lib/artifact/internal/server-util.mjs
import { randomBytes } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, join as join2 } from "node:path";
var LOOPBACK_HOST = "127.0.0.1";
function codedError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== void 0) error.details = details;
  return error;
}
function readJsonState(path) {
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
function readPrivateJsonState(path, { maxBytes = 16384 } = {}) {
  let fd;
  const unsafe = () => codedError("E_PRIVATE_STATE_INVALID", "Private owner state is unsafe or malformed.");
  try {
    const directory = lstatSync(dirname(path));
    if (!directory.isDirectory() || directory.isSymbolicLink() || process.platform !== "win32" && (directory.mode & 63 || directory.uid !== process.getuid()))
      throw unsafe();
    fd = openSync(
      path,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0)
    );
    const before = fstatSync(fd);
    if (!before.isFile() || before.size < 2 || before.size > maxBytes || process.platform !== "win32" && (before.mode & 63 || before.uid !== process.getuid()))
      throw unsafe();
    const bytes = Buffer.alloc(before.size);
    for (let offset = 0; offset < bytes.length; ) {
      const count = readSync(fd, bytes, offset, bytes.length - offset, offset);
      if (!count) throw unsafe();
      offset += count;
    }
    const after = fstatSync(fd);
    if (after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs)
      throw unsafe();
    const value = JSON.parse(bytes.toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw unsafe();
    return value;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw unsafe();
  } finally {
    if (fd !== void 0) closeSync(fd);
  }
}
function writePrivateJsonState(path, value, { mode = 384 } = {}) {
  mkdirSync(dirname(path), { recursive: true, mode: 448 });
  const temporary = `${path}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}
`, { mode, flag: "wx" });
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}
function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === "EPERM";
  }
}
function listenLoopback(server, port = 0, { host = LOOPBACK_HOST } = {}) {
  if (host !== LOOPBACK_HOST) {
    return Promise.reject(
      codedError("E_LOOPBACK_HOST", `Refusing non-loopback bind host: ${host}`)
    );
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    return Promise.reject(codedError("E_LOOPBACK_PORT", `Invalid loopback port: ${String(port)}`));
  }
  return new Promise((resolveListen, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      const address = server.address();
      if (!address || typeof address === "string" || address.address !== LOOPBACK_HOST) {
        closeHttpServer(server).finally(
          () => reject(
            codedError(
              "E_LOOPBACK_BIND",
              "Server did not bind to the required IPv4 loopback interface."
            )
          )
        );
        return;
      }
      resolveListen(address.port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen({ port, host, exclusive: true });
  });
}
function closeHttpServer(server) {
  if (!server?.listening) return Promise.resolve();
  return new Promise((resolveClose, reject) => {
    server.close((error) => error ? reject(error) : resolveClose());
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
  });
}
function readRequestBody(req, { maxBytes, encoding = null } = {}) {
  if (!Number.isInteger(maxBytes) || maxBytes < 1) {
    return Promise.reject(
      codedError("E_REQUEST_BODY_LIMIT", "A positive request byte limit is required.")
    );
  }
  const declared = Number(req.headers?.["content-length"]);
  if (Number.isFinite(declared) && declared > maxBytes) {
    req.resume?.();
    return Promise.reject(
      codedError("E_REQUEST_BODY_LIMIT", `Request body exceeds ${maxBytes} bytes.`, {
        maxBytes,
        declaredBytes: declared
      })
    );
  }
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let bytes = 0;
    let settled = false;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    req.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.byteLength;
      if (bytes > maxBytes) {
        chunks.length = 0;
        rejectOnce(
          codedError("E_REQUEST_BODY_LIMIT", `Request body exceeds ${maxBytes} bytes.`, {
            maxBytes,
            receivedBytes: bytes
          })
        );
        return;
      }
      if (!settled) chunks.push(buffer);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      const body = Buffer.concat(chunks, bytes);
      resolveBody(encoding ? body.toString(encoding) : body);
    });
    req.on("error", rejectOnce);
    req.on(
      "aborted",
      () => rejectOnce(codedError("E_REQUEST_ABORTED", "Request body was aborted."))
    );
  });
}
function assertLoopbackRequest(req, { port, mutating = false, internal = false, hosts = [LOOPBACK_HOST] } = {}) {
  const allowedHosts = new Set(hosts);
  const hostHeaders = req.headersDistinct?.host;
  const receivedHost = req.headers?.host;
  const separator = typeof receivedHost === "string" ? receivedHost.lastIndexOf(":") : -1;
  const receivedName = separator > 0 ? receivedHost.slice(0, separator) : "";
  const receivedPort = separator > 0 ? receivedHost.slice(separator + 1) : "";
  const expectedHost = `${receivedName}:${port}`;
  const expectedOrigin = `http://${expectedHost}`;
  if (!allowedHosts.has(receivedName) || receivedPort !== String(port) || Array.isArray(hostHeaders) && hostHeaders.length !== 1) {
    throw codedError("E_LOOPBACK_HOST", "Loopback Host header rejected.");
  }
  const origin = req.headers?.origin;
  if (origin !== void 0 && origin !== expectedOrigin) {
    throw codedError("E_LOOPBACK_ORIGIN", "Loopback Origin header rejected.");
  }
  if (mutating && !internal && origin !== expectedOrigin) {
    throw codedError(
      "E_LOOPBACK_ORIGIN",
      "State-changing browser requests require the exact loopback origin."
    );
  }
  if (internal && origin !== void 0) {
    throw codedError(
      "E_LOOPBACK_ORIGIN",
      "Internal control requests must not carry a browser Origin."
    );
  }
  const fetchSite = String(req.headers?.["sec-fetch-site"] ?? "").toLowerCase();
  if (fetchSite && !["none", "same-origin"].includes(fetchSite)) {
    throw codedError("E_LOOPBACK_FETCH_SITE", "Cross-site loopback request rejected.");
  }
  return { expectedHost, expectedOrigin };
}
async function probeLoopbackJson(port, path = "/health", { fetchImpl = fetch, timeout = 800 } = {}) {
  try {
    const response = await fetchImpl(`http://${LOOPBACK_HOST}:${port}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeout)
    });
    if (!response.ok) return null;
    const value = await response.json();
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}
var wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
function* startLockSteps(path, {
  timeout = 5e3,
  poll = 25,
  pid = process.pid,
  now = () => Date.now(),
  isAlive = isProcessAlive,
  readRecord = (recordPath) => readFileSync(recordPath, "utf8")
} = {}) {
  mkdirSync(dirname(path), { recursive: true, mode: 448 });
  const started = now();
  if (existsSync(path)) {
    throw codedError(
      "E_START_LOCK_LEGACY",
      `A legacy startup lock must be cleared after confirming its owner is stopped: ${path}`
    );
  }
  const directory = `${path}.writers`;
  mkdirSync(directory, { recursive: true, mode: 448 });
  const directoryInfo = lstatSync(directory);
  if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) {
    throw codedError("E_START_LOCK_UNSAFE", `Startup lock directory is unsafe: ${directory}`);
  }
  const owner = randomBytes(16).toString("hex");
  const name = `${pid}-${owner}.json`;
  const recordPath = join2(directory, name);
  const announce = (ticket) => writePrivateJsonState(recordPath, { pid, owner, ticket });
  const writers = () => {
    const result = [];
    for (const entry of readdirSync(directory)) {
      if (!entry.endsWith(".json")) continue;
      const match = /^([1-9]\d*)-([a-f0-9]{32})\.json$/u.exec(entry);
      if (!match)
        throw codedError("E_START_LOCK_UNSAFE", `Startup lock record is invalid: ${entry}`);
      const entryPath = join2(directory, entry);
      let info;
      try {
        info = lstatSync(entryPath);
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
      }
      if (!info.isFile() || info.isSymbolicLink() || info.size > 1024) {
        throw codedError("E_START_LOCK_UNSAFE", `Startup lock record is unsafe: ${entry}`);
      }
      let value;
      try {
        value = JSON.parse(readRecord(entryPath));
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw codedError("E_START_LOCK_UNSAFE", `Startup lock record cannot be read: ${entry}`);
      }
      if (value?.pid !== Number(match[1]) || value?.owner !== match[2] || !Number.isSafeInteger(value.ticket) || value.ticket < 0)
        throw codedError("E_START_LOCK_UNSAFE", `Startup lock record is invalid: ${entry}`);
      if (!isAlive(value.pid)) {
        rmSync(entryPath, { force: true });
        continue;
      }
      result.push({ ...value, name: entry });
    }
    return result;
  };
  try {
    announce(0);
    const ticket = Math.max(0, ...writers().map((writer) => writer.ticket)) + 1;
    if (!Number.isSafeInteger(ticket)) {
      throw codedError("E_START_LOCK_UNSAFE", "Startup lock ticket limit reached.");
    }
    announce(ticket);
    while (now() - started <= timeout) {
      const blocked = writers().some(
        (writer) => writer.name !== name && (writer.ticket === 0 || writer.ticket < ticket || writer.ticket === ticket && writer.name < name)
      );
      if (!blocked) {
        return () => {
          const current = readJsonState(recordPath);
          if (current?.owner === owner && current?.pid === pid) rmSync(recordPath, { force: true });
        };
      }
      yield poll;
    }
    throw codedError("E_START_LOCK_TIMEOUT", `Timed out waiting for startup lock: ${path}`);
  } catch (error) {
    rmSync(recordPath, { force: true });
    throw error;
  }
}
async function acquireStartLock(path, options = {}) {
  const steps = startLockSteps(path, options);
  let step = steps.next();
  while (!step.done) {
    try {
      await (options.waitImpl ?? wait)(step.value);
    } catch (error) {
      steps.throw(error);
      throw error;
    }
    step = steps.next();
  }
  return step.value;
}

export {
  configuredPlanrHome,
  planrHome,
  LOOPBACK_HOST,
  readPrivateJsonState,
  writePrivateJsonState,
  isProcessAlive,
  listenLoopback,
  closeHttpServer,
  readRequestBody,
  assertLoopbackRequest,
  probeLoopbackJson,
  acquireStartLock
};
