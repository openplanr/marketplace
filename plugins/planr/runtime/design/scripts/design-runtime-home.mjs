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

export {
  configuredPlanrHome,
  planrHome
};
