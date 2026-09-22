import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const digest = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

test('archived ecosystem ledger remains structurally self-consistent', async () => {
  const ecosystem = await readJson('../ecosystem.json');

  assert.match(ecosystem.protocol.current, /^1\.[1-9][0-9]*\.0$/);
  assert.ok(ecosystem.protocol.supported.includes('1.0.x'));
  assert.ok(ecosystem.protocol.supported.includes('1.1.x'));
  assert.match(ecosystem.components.cli.version, /^[0-9]+\.[0-9]+\.[0-9]+$/);
  assert.match(ecosystem.components.pipeline.version, /^[0-9]+\.[0-9]+\.[0-9]+$/);
  assert.match(ecosystem.components.skills.version, /^[0-9]+\.[0-9]+\.[0-9]+$/);
  assert.equal(ecosystem.components.cli.pipelineRange, `^${ecosystem.components.pipeline.version}`);
  assert.equal(ecosystem.components.pipeline.cliRange, `^${ecosystem.components.cli.version}`);
  assert.deepEqual(ecosystem.adapters.map(({ runtime }) => runtime).sort(), ['claude-code', 'codex', 'cursor']);
  assert.ok(ecosystem.adapters.every(({ pipelineRange }) => pipelineRange === `^${ecosystem.components.pipeline.version}`));
});

test('published Claude package is one self-consistent planr projection', async () => {
  const marketplace = await readJson('../.claude-plugin/marketplace.json');
  const pluginManifest = await readJson('../plugins/planr/.claude-plugin/plugin.json');
  const content = await readJson('../plugins/planr/.openplanr-content.json');

  assert.equal(marketplace.plugins.length, 1);
  const [plugin] = marketplace.plugins;
  assert.deepEqual(
    [plugin.name, plugin.source, plugin.version, plugin.strict],
    ['planr', './plugins/planr', marketplace.metadata.version, true],
  );
  assert.equal(pluginManifest.name, 'planr');
  assert.equal(pluginManifest.version, plugin.version);
  assert.equal(content.kind, 'openplanr-host-package-content');
  assert.equal(content.host, 'claude-code');
  assert.equal(content.skillCount, content.files.filter(({ path }) => /^skills\/[^/]+\/SKILL\.md$/u.test(path)).length);
  assert.equal(content.roleCount, content.files.filter(({ path }) => /^agents\/planr-[^/]+\.md$/u.test(path)).length);

  const paths = content.files.map(({ path }) => path);
  assert.equal(new Set(paths).size, paths.length);
  for (const asset of content.files) {
    assert.match(asset.path, /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$)).+/u);
    const bytes = await readFile(new URL(`../plugins/planr/${asset.path}`, import.meta.url));
    assert.equal(digest(bytes), asset.digest, asset.path);
  }
});
