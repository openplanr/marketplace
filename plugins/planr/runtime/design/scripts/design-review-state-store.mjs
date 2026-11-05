import {
  planrHome
} from "./design-runtime-home.mjs";

// packages/artifact/lib/artifact/internal/review-state-store.mjs
import { readdirSync } from "node:fs";
import { join } from "node:path";
var RECORD = /^(?:instance-[A-Za-z0-9_-]{22}|state-(?:default|\d+))\.json$/u;
var AUTHORIZATION_CONTROL_VERSIONS = /* @__PURE__ */ new Set([1, 2]);
function reviewStateDir(env = process.env) {
  return join(planrHome(env), "artifact-daemon");
}
function artifactReviewStatePath(port = 0, env = process.env) {
  const suffix = port === 0 ? "default" : String(port);
  return join(reviewStateDir(env), `state-${suffix}.json`);
}
function reviewStateLockPath(port, env = process.env) {
  const suffix = port === 0 ? "default" : String(port);
  return join(reviewStateDir(env), `start-${suffix}.lock`);
}
function reviewInstanceStatePath(instanceId, env = process.env) {
  return join(reviewStateDir(env), `instance-${instanceId}.json`);
}
function reviewStateRecordPaths(env = process.env) {
  const directory = reviewStateDir(env);
  let names;
  try {
    names = readdirSync(directory);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  return names.filter((name) => RECORD.test(name)).sort().map((name) => join(directory, name));
}
function reviewControlHeaders(state, controlHeader) {
  return AUTHORIZATION_CONTROL_VERSIONS.has(state.serverVersion) ? { authorization: `Bearer ${state.controlToken}` } : { [controlHeader]: state.controlToken };
}

export {
  artifactReviewStatePath,
  reviewStateLockPath,
  reviewInstanceStatePath,
  reviewStateRecordPaths,
  reviewControlHeaders
};
