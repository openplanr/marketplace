import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = resolve(process.env.OPENPLANR_ECOSYSTEM_ROOT ?? join(repo, '..'));
const check = process.argv.includes('--check');

function readJson(path) {
  if (!existsSync(path)) throw new Error(`Missing ecosystem input: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const cli = readJson(join(workspace, 'OpenPlanr', 'package.json'));
const pipeline = readJson(join(workspace, 'planr-pipeline', 'package.json'));
const adapters = readJson(join(workspace, 'planr-pipeline', 'registry', 'adapters.json'));
const skills = readJson(join(workspace, 'skills', 'package.json'));
const marketplacePackage = readJson(join(repo, 'package.json'));
const current = readJson(join(repo, 'ecosystem.json'));
const generatedAt = check ? current.generatedAt : new Date().toISOString();

const ecosystem = {
  schemaVersion: '1.0.0',
  generatedAt,
  protocol: { current: adapters.protocolVersion, supported: ['1.0.x', '1.1.x'] },
  components: {
    cli: { version: cli.version, pipelineRange: `^${pipeline.version}` },
    pipeline: { version: pipeline.version, cliRange: `^${cli.version}` },
    skills: { version: skills.version, cliRange: `^${cli.version}` },
    marketplace: { version: marketplacePackage.version },
  },
  adapters: adapters.adapters.map((adapter) => ({
    runtime: adapter.id,
    version: adapter.version,
    capabilityLevel: adapter.capabilityLevel,
    pipelineRange: `^${pipeline.version}`,
  })),
};

const ecosystemText = `${JSON.stringify(ecosystem, null, 2)}\n`;
const manifestPath = join(repo, '.claude-plugin', 'marketplace.json');
const manifest = readJson(manifestPath);
for (const plugin of manifest.plugins) {
  if (plugin.name === 'planr-pipeline') plugin.version = pipeline.version;
  if (plugin.name === 'openplanr') plugin.version = skills.version;
}
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;

const readmePath = join(repo, 'README.md');
const readme = readFileSync(readmePath, 'utf8');
const table = [
  '<!-- ecosystem-table:start -->',
  '| Component | Version | Compatibility |',
  '|---|---:|---|',
  `| OpenPlanr CLI | ${cli.version} | pipeline ${ecosystem.components.cli.pipelineRange} |`,
  `| Pipeline package/plugin | ${pipeline.version} | CLI ${ecosystem.components.pipeline.cliRange} |`,
  `| Runtime skills | ${skills.version} | CLI ${ecosystem.components.skills.cliRange} |`,
  `| Protocol | ${adapters.protocolVersion} | reads v1.0 artifacts; v1.1 capabilities |`,
  '<!-- ecosystem-table:end -->',
].join('\n');
const readmeText = readme.replace(
  /<!-- ecosystem-table:start -->[\s\S]*?<!-- ecosystem-table:end -->/,
  table,
);

const outputs = [
  [join(repo, 'ecosystem.json'), ecosystemText],
  [manifestPath, manifestText],
  [readmePath, readmeText],
];
if (check) {
  const drift = outputs.filter(([path, expected]) => readFileSync(path, 'utf8') !== expected);
  if (drift.length) {
    for (const [path] of drift) process.stderr.write(`DRIFT ${path}\n`);
    process.exit(1);
  }
  process.stdout.write('Marketplace and ecosystem manifest are synchronized\n');
} else {
  for (const [path, content] of outputs) writeFileSync(path, content);
  process.stdout.write('Generated marketplace ecosystem metadata\n');
}
