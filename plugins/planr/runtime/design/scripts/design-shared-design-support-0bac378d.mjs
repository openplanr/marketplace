import {
  isProcessAlive
} from "./design-loopback-server.mjs";

// packages/design/lib/design/document-state.mjs
import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";
var hash = (value) => createHash("sha256").update(value).digest("hex");
var json = (value) => `${JSON.stringify(value, null, 2)}
`;
function readJson(path, fallback = void 0) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== void 0) return fallback;
    throw error;
  }
}
function atomicJson(path, value, { mode } = {}) {
  atomicBytes(path, json(value), mode);
}
function atomicBytes(path, bytes, mode) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, bytes, { mode: 384, flag: "wx" });
    if (mode !== void 0) chmodSync(temporary, mode);
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}
function recoverDesignPublication(root, { ownsRenderLock = false } = {}) {
  const journalPath = join(root, ".design/publication.json");
  let journal = readJson(journalPath, null);
  if (!journal) return;
  const lockPath = join(root, ".design/render.lock");
  let recoveryOwner;
  if (!ownsRenderLock) {
    const lock = readJson(lockPath, null);
    if (lock && isProcessAlive(lock.pid)) return;
    if (lock) rmSync(lockPath, { force: true });
    recoveryOwner = randomUUID();
    let descriptor;
    try {
      descriptor = openSync(lockPath, "wx", 384);
      writeFileSync(
        descriptor,
        json({ pid: process.pid, owner: recoveryOwner, createdAt: Date.now() })
      );
    } catch (error) {
      if (error.code === "EEXIST") return;
      throw error;
    } finally {
      if (descriptor !== void 0) closeSync(descriptor);
    }
  }
  try {
    journal = readJson(journalPath, null);
    if (!journal) return;
    const pointer = readJson(join(root, ".design/current.json"), null);
    const manifestPath = join(root, "finalized.json");
    if (pointer?.revision === journal.revision) atomicJson(manifestPath, journal.manifest);
    else if ((pointer?.revision ?? null) === journal.previousRevision) {
      if (journal.previousManifest === null) rmSync(manifestPath, { force: true });
      else atomicBytes(manifestPath, Buffer.from(journal.previousManifest, "base64"));
    } else if (pointer?.revision && /^[a-f0-9]{64}$/u.test(pointer.revision)) {
      atomicJson(
        manifestPath,
        readJson(join(root, ".design/revisions", pointer.revision, "render.json")).manifest
      );
    } else
      throw new Error("Design publication recovery could not identify the committed revision.");
    rmSync(journalPath, { force: true });
  } finally {
    if (recoveryOwner && readJson(lockPath, null)?.owner === recoveryOwner)
      rmSync(lockPath, { force: true });
  }
}
function designSpecPath(root) {
  return /(?:^|\/)output\/feats\/feat-[^/]+\/design$/u.test(root.replaceAll("\\", "/")) ? join(dirname(root), "design-spec.md") : join(root, "design-spec.md");
}
function currentDesign(file, { recoverPublication = true } = {}) {
  const root = realpathSync(dirname(resolve(file)));
  if (recoverPublication) recoverDesignPublication(root);
  else {
    try {
      lstatSync(join(root, ".design/publication.json"));
      throw Object.assign(
        new Error(
          "Design publication state is pending or needs recovery. Finish or recover it with the Design utility; repair or restore an invalid .design/publication.json before retrying Plan handoff inspection."
        ),
        { code: "E_DESIGN_PUBLICATION_PENDING", statusCode: 409 }
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const pointer = readJson(join(root, ".design/current.json"), null);
  if (!pointer || !/^[a-f0-9]{64}$/u.test(pointer.revision))
    throw new Error("Design has no completed render. Run the render utility first.");
  const directory = join(root, ".design/revisions", pointer.revision);
  const prepared = readJson(join(directory, "render.json"));
  return {
    ...prepared,
    root,
    directory,
    file: resolve(file),
    verification: readJson(join(root, ".design/verification", `${pointer.revision}.json`), {
      status: "unverified",
      revision: pointer.revision
    })
  };
}

export {
  hash,
  json,
  readJson,
  atomicJson,
  atomicBytes,
  recoverDesignPublication,
  designSpecPath,
  currentDesign
};
