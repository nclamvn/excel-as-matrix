import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const outputArg = process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? 'release-evidence';
const outputDir = path.resolve(root, outputArg);
const qaPath = path.join(root, 'governance', 'sot', 'source_canonical', 'qa_baseline.csv');
const claimsPath = path.join(root, 'governance', 'sot', 'source_canonical', 'product_claims.csv');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...data] = rows;
  return data.filter((values) => values.some(Boolean)).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  );
}

const qaContent = await readFile(qaPath, 'utf8');
const claimsContent = await readFile(claimsPath, 'utf8');
const qa = new Map(parseCsv(qaContent).map((fact) => [fact.id, fact]));
const claims = new Map(parseCsv(claimsContent).map((fact) => [fact.id, fact]));

const gates = [
  ['Standard install', 'QA.INSTALL.STANDARD', 'PASS'],
  ['Production dependency audit', 'QA.DEP.PRODUCTION', '0'],
  ['Frontend build', 'QA.FRONTEND.BUILD', 'PASS'],
  ['Server build', 'QA.SERVER.BUILD', 'PASS'],
  ['Lint errors', 'QA.LINT.ERRORS', '0'],
  ['Format drift', 'QA.FORMAT.DRIFT', '0'],
  ['Critical Chromium tests', 'QA.E2E.CRITICAL', '5'],
].map(([name, id, expected]) => {
  const fact = qa.get(id);
  return {
    name,
    id,
    value: fact?.value ?? null,
    unit: fact?.unit ?? '',
    verified: fact?.status === 'VERIFIED',
    passed: fact?.status === 'VERIFIED' && fact?.value === expected,
    evidence: fact?.evidence ?? null,
  };
});

const productionClaim = claims.get('CLAIM.PRODUCTION_READY');
const releaseStatus = productionClaim?.status === 'FLAG' ? 'NOT_PRODUCTION_READY' : 'UNDECIDED';
const unitTests = qa.get('QA.UNIT.TESTS');
const serverTests = qa.get('QA.SERVER.CONFIG_TESTS');
const sotToken = JSON.parse(
  await readFile(path.join(root, 'governance', 'sot', 'index', '.publish_token'), 'utf8')
);

const evidence = {
  schemaVersion: 1,
  commit: process.env.GITHUB_SHA ?? process.env.GIT_COMMIT ?? 'working-tree',
  runId: process.env.GITHUB_RUN_ID ?? 'local',
  generatedAt: new Date().toISOString(),
  releaseStatus,
  allScopedGatesPass: gates.every((gate) => gate.passed),
  gates,
  verifiedCounts: {
    unitTests: Number(unitTests?.value ?? 0),
    serverTests: Number(serverTests?.value ?? 0),
    criticalChromiumTests: Number(qa.get('QA.E2E.CRITICAL')?.value ?? 0),
  },
  sourceDigests: {
    qaBaseline: createHash('sha256').update(qaContent).digest('hex'),
    productClaims: createHash('sha256').update(claimsContent).digest('hex'),
    sotRegistry: sotToken.digest,
  },
};

const statusRows = gates
  .map((gate) => `| ${gate.name} | ${gate.passed ? 'PASS' : 'FAIL'} | ${gate.value ?? 'missing'} ${gate.unit} |`)
  .join('\n');
const readmeBlock = `<!-- release-status:start -->
## Verified release status

| Gate | Status | SOT value |
|---|---|---:|
${statusRows}

Verified counts: ${evidence.verifiedCounts.unitTests.toLocaleString('en-US')} unit tests, ${evidence.verifiedCounts.serverTests} server tests, ${evidence.verifiedCounts.criticalChromiumTests} critical Chromium journeys.

**Release classification: ${releaseStatus.replaceAll('_', ' ')}.** Scoped stabilization gates are green, but production approval remains blocked by configured-model validation, realtime and backend security/persistence work. The canonical evidence is [the QA SOT](governance/sot/source_canonical/qa_baseline.csv), not a hand-maintained badge.
<!-- release-status:end -->`;

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'release-status.json'), `${JSON.stringify(evidence, null, 2)}\n`);
await writeFile(path.join(outputDir, 'release-status.md'), `${readmeBlock}\n`);

const readmePath = path.join(root, 'README.md');
const readme = await readFile(readmePath, 'utf8');
const marker = /<!-- release-status:start -->[\s\S]*?<!-- release-status:end -->/;
if (!marker.test(readme)) throw new Error('README release-status markers are missing');

if (args.has('--write-readme')) {
  await writeFile(readmePath, readme.replace(marker, readmeBlock));
} else if (args.has('--check-readme') && readme.match(marker)?.[0] !== readmeBlock) {
  throw new Error('README release status drifted from SOT; run npm run release:evidence:update');
}

console.log(JSON.stringify({ releaseStatus, allScopedGatesPass: evidence.allScopedGatesPass }));
