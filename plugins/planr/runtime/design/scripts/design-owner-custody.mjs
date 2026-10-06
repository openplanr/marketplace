// packages/artifact/lib/artifact/owner-custody.mjs
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

// packages/protocol/src/names.mjs
var PLANNING_FOLDER = ".planr";
var CLI_COMMAND = "openplanr";

// packages/artifact/lib/artifact/owner-custody.mjs
function custodyError(message, code = "E_OWNER_CUSTODY_LOCATION") {
  return Object.assign(new Error(message), { code, status: 400 });
}
function pathExists(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
function assertDirectoryAncestry(root, label) {
  for (let path = root; dirname(path) !== path; path = dirname(path)) {
    if (pathExists(path) && lstatSync(path).isSymbolicLink())
      throw custodyError(`${label} custody directory must not contain symbolic links.`);
  }
}
function assertPrivateFile(path, label) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || process.platform !== "win32" && (stat.mode & 63 || stat.uid !== process.getuid()))
    throw custodyError(
      `${label} owner custody must be a private 0600 file.`,
      "E_OWNER_CUSTODY_INVALID"
    );
}
function physicalDirectoryPath(directory) {
  let existing = resolve(directory);
  const missing = [];
  while (!existsSync(existing) && dirname(existing) !== existing) {
    missing.unshift(basename(existing));
    existing = dirname(existing);
  }
  return join(realpathSync(existing), ...missing);
}
function assertPrivateDirectory(root, label, recoveryOutput = false) {
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink() || !recoveryOutput && process.platform !== "win32" && (stat.mode & 63 || stat.uid !== process.getuid()))
    throw custodyError(`${label} custody must use a private local directory.`);
}
function ensurePrivateDirectory(root, { label = "Owner", recoveryOutput = false } = {}) {
  if (recoveryOutput) root = physicalDirectoryPath(root);
  assertDirectoryAncestry(root, label);
  mkdirSync(root, { recursive: true, mode: 448 });
  assertPrivateDirectory(root, label, recoveryOutput);
}
function readCustody(path, { label = "Owner", format, recoveryInput = false } = {}) {
  if (recoveryInput && existsSync(path)) {
    assertPrivateFile(path, label);
    path = realpathSync(path);
  }
  assertDirectoryAncestry(dirname(path), label);
  if (!pathExists(path)) return null;
  assertPrivateDirectory(dirname(path), label, recoveryInput);
  assertPrivateFile(path, label);
  let record;
  try {
    record = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw custodyError(`${label} owner custody is invalid.`, "E_OWNER_CUSTODY_INVALID");
  }
  if (record?.kind !== format || record.schemaVersion !== "1.0.0" || !record.custody)
    throw custodyError(`${label} owner custody is invalid.`, "E_OWNER_CUSTODY_INVALID");
  return record;
}
function writeCustody(path, record, { label = "Owner" } = {}) {
  assertDirectoryAncestry(dirname(path), label);
  assertPrivateDirectory(dirname(path), label);
  if (existsSync(path)) assertPrivateFile(path, label);
  const temp = `${path}.${randomBytes(8).toString("hex")}.tmp`;
  const fd = openSync(temp, "wx", 384);
  try {
    writeFileSync(fd, `${JSON.stringify(record)}
`);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  try {
    renameSync(temp, path);
    if (process.platform !== "win32") {
      chmodSync(path, 384);
      const directory = openSync(dirname(path), "r");
      try {
        fsyncSync(directory);
      } finally {
        closeSync(directory);
      }
    }
  } catch (error) {
    try {
      unlinkSync(temp);
    } catch {
    }
    throw error;
  }
}

export {
  PLANNING_FOLDER,
  CLI_COMMAND,
  ensurePrivateDirectory,
  readCustody,
  writeCustody
};
