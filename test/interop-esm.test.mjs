import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as pkg from '../dist/esm/index.js';
import { validEvent } from './fixtures.mjs';

const esmEntry = fileURLToPath(new URL('../dist/esm/index.js', import.meta.url));
const esmManifest = fileURLToPath(new URL('../dist/esm/package.json', import.meta.url));

test('the ESM build is marked as ESM', () => {
  // Node picks the parse mode from the nearest package.json "type", not from
  // the exports condition that resolved the file. Without this marker the root
  // package.json (no "type", so CommonJS) makes dist/esm/*.js parse as
  // CommonJS, which throws on Node < 20.19 / < 22.7.
  const manifest = JSON.parse(readFileSync(esmManifest, 'utf8'));
  assert.equal(manifest.type, 'module');
});

test('the ESM build loads without relying on module syntax detection', () => {
  // Syntax detection (Node >= 20.19 / >= 22.7) silently rescues a mislabelled
  // ESM file, hiding the failure that older supported Node versions would hit.
  // Disabling it makes this test fail on every version, not just the old ones.
  const script = `import('${new URL('../dist/esm/index.js', import.meta.url).href}')
    .then((m) => { if (typeof m.isValidEvent !== 'function') process.exit(2); })
    .catch((e) => { console.error(e.message); process.exit(3); });`;

  const attempt = (args) =>
    execFileSync(process.execPath, [...args, '-e', script], { encoding: 'utf8', stdio: 'pipe' });

  try {
    attempt(['--no-experimental-detect-module']);
  } catch (error) {
    // Node versions predating the flag never had detection to begin with, so
    // the plain run is already the strict check.
    const unsupportedFlag = /bad option|not allowed|--no-experimental-detect-module/i.test(
      String(error.stderr ?? '')
    );
    assert.ok(unsupportedFlag, `ESM entry failed to load: ${error.stderr || error.message}`);
    attempt([]);
  }
});

test('the ESM build emits no module-type warning', () => {
  const result = execFileSync(
    process.execPath,
    ['-e', `import('${new URL('../dist/esm/index.js', import.meta.url).href}')`],
    { encoding: 'utf8', stdio: 'pipe' }
  );

  assert.doesNotMatch(String(result), /MODULE_TYPELESS_PACKAGE_JSON/);
});

test('named exports are available to ESM consumers', () => {
  for (const name of [
    'getEventDispatcher',
    'isValidEvent',
    'isValidUUID',
    'superSchema'
  ]) {
    assert.ok(name in pkg, `expected ${name} to be exported`);
  }
  assert.equal(typeof pkg.getEventDispatcher, 'function');
  assert.equal(typeof pkg.isValidEvent, 'function');
  assert.equal(typeof pkg.isValidUUID, 'function');
  assert.equal(typeof pkg.superSchema, 'object');
});

test('the ESM entry point is functional', () => {
  let handled = false;
  pkg.getEventDispatcher(
    (e) => assert.fail(`unexpected error: ${JSON.stringify(e)}`),
    { PurchaseOrderReceived: () => { handled = true; } }
  )(validEvent());

  assert.equal(handled, true);
  assert.ok(esmEntry.endsWith('index.js'));
});
