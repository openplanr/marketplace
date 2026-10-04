#!/usr/bin/env node
// Generated package-relative launcher; no global runtime or invocation downloads.
import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runOperateReviewNoteValidator as run } from "../../../runtime/operate/scripts/validate-note.mjs";
export * from "../../../runtime/operate/scripts/validate-note.mjs";
if (process.argv[1] && existsSync(resolve(process.argv[1])) &&
  realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]))) {
  try { await run(process.argv.slice(2)); }
  catch (error) { process.stderr.write(`${error.code ?? 'E_OPERATE_NOTE'}: ${error.message}\n`); process.exitCode = 1; }
}
