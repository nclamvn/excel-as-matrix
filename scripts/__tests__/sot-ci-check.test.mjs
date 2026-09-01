import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const checker = path.join(root, 'scripts', 'sot-ci-check.mjs');
const canonicalSot = path.join(root, 'governance', 'sot');

async function withSotCopy(run) {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'excelai-sot-'));
  const sotCopy = path.join(temporaryRoot, 'sot');
  await cp(canonicalSot, sotCopy, { recursive: true });
  try {
    await run(sotCopy);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

function check(sotRoot) {
  return spawnSync(process.execPath, [checker], {
    cwd: root,
    env: { ...process.env, SOT_ROOT: sotRoot },
    encoding: 'utf8',
  });
}

test('accepts the current canonical SOT and fresh token', () => {
  const result = check(canonicalSot);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).status, 'PASS');
});

test('rejects a registry changed after the publish gate', async () => {
  await withSotCopy(async (sotRoot) => {
    const registry = path.join(sotRoot, 'registry', 'qa_baseline.yaml');
    await writeFile(registry, `${await readFile(registry, 'utf8')}\n# stale token\n`);
    const result = check(sotRoot);
    assert.equal(result.status, 2);
    assert.match(result.stdout, /publish token is stale/);
  });
});

test('rejects unverified value exposure under A3', async () => {
  await withSotCopy(async (sotRoot) => {
    const registry = path.join(sotRoot, 'registry', 'product_claims.yaml');
    const content = await readFile(registry, 'utf8');
    await writeFile(
      registry,
      content.replace(
        '- id: CLAIM.PRODUCTION_READY',
        '- id: CLAIM.PRODUCTION_READY\n  value: Production Ready'
      )
    );
    const result = check(sotRoot);
    assert.equal(result.status, 2);
    assert.match(result.stdout, /A3 violation/);
  });
});

test('rejects a canonical source whose SHA-256 changed', async () => {
  await withSotCopy(async (sotRoot) => {
    const source = path.join(sotRoot, 'source_canonical', 'qa_baseline.csv');
    await writeFile(source, `${await readFile(source, 'utf8')}\n`);
    const result = check(sotRoot);
    assert.equal(result.status, 2);
    assert.match(result.stdout, /source hash mismatch/);
  });
});
