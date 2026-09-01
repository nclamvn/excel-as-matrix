import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sotRoot = process.env.SOT_ROOT
  ? path.resolve(root, process.env.SOT_ROOT)
  : path.join(root, 'governance', 'sot');
const registryDir = path.join(sotRoot, 'registry');
const failures = [];

function sha16(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function parseSourceHashes(text) {
  const sources = new Map();
  let current = null;
  let inSources = false;

  for (const line of text.split(/\r?\n/)) {
    if (line === 'sources:') {
      inSources = true;
      continue;
    }
    if (inSources && /^\S/.test(line)) break;

    const file = line.match(/^  ([^:]+):$/);
    if (inSources && file) {
      current = file[1];
      sources.set(current, {});
      continue;
    }

    const property = line.match(/^    (sha256|size):\s*'?([^']+)'?$/);
    if (current && property) sources.get(current)[property[1]] = property[2];
  }

  return sources;
}

function parseFacts(text) {
  const blocks = text.split(/(?=^- id: )/m).slice(1);
  return blocks.map((block) => {
    const fact = {};
    for (const line of block.split(/\r?\n/)) {
      const property = line.match(/^(?:- |  )(id|status|value|verified_value|evidence|provenance_level):(?:\s(.*))?$/);
      if (property) fact[property[1]] = (property[2] ?? '').trim();
    }
    return fact;
  });
}

const baseline = parseSourceHashes(
  await readFile(path.join(registryDir, 'source_hashes.yaml'), 'utf8')
);

for (const [filename, expected] of baseline) {
  try {
    const content = await readFile(path.join(sotRoot, 'source_canonical', filename));
    if (sha16(content) !== expected.sha256) failures.push(`source hash mismatch: ${filename}`);
    if (String(content.length) !== String(expected.size)) failures.push(`source size mismatch: ${filename}`);
  } catch {
    failures.push(`canonical source missing: ${filename}`);
  }
}

const registryFiles = (await readdir(registryDir))
  .filter((filename) => filename.endsWith('.yaml') && filename !== 'source_hashes.yaml')
  .sort();
const digest = createHash('sha256');
const ids = new Set();
let factCount = 0;

for (const filename of registryFiles) {
  const content = await readFile(path.join(registryDir, filename));
  digest.update(filename);
  digest.update(content);

  for (const fact of parseFacts(content.toString('utf8'))) {
    factCount += 1;
    if (!fact.id) failures.push(`${filename}: fact without id`);
    else if (ids.has(fact.id)) failures.push(`duplicate fact id: ${fact.id}`);
    else ids.add(fact.id);

    if (fact.provenance_level === 'verified_primary' && !fact.evidence) {
      failures.push(`${fact.id}: verified fact without evidence`);
    }
    if (
      fact.provenance_level !== 'verified_primary' &&
      fact.value &&
      fact.value !== "''" &&
      fact.value !== 'null'
    ) {
      failures.push(`${fact.id}: A3 violation exposes an unverified value`);
    }
  }
}

const registryDigest = digest.digest('hex').slice(0, 16);
const token = JSON.parse(await readFile(path.join(sotRoot, 'index', '.publish_token'), 'utf8'));
if (token.check !== 'PASS') failures.push('publish token is not PASS');
if (token.digest !== registryDigest) failures.push('publish token is stale for the current registry');

const result = {
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  sourceCount: baseline.size,
  registryFiles: registryFiles.length,
  factCount,
  registryDigest,
  tokenDigest: token.digest,
  failures,
};

if (process.argv[2]) {
  const destination = path.resolve(root, process.argv[2]);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result));
if (failures.length > 0) process.exitCode = 2;
