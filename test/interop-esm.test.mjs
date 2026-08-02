import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
  //
  // The probe must run as ESM (--input-type=module) and use a static import:
  // a dynamic import() from a CommonJS context goes through require(esm)
  // interop instead, which fails differently and would mask the real problem.
  const script =
    `import { isValidEvent } from '${new URL('../dist/esm/index.js', import.meta.url).href}';` +
    `if (typeof isValidEvent !== 'function') process.exit(2);`;

  const run = (args) =>
    spawnSync(process.execPath, [...args, '--input-type=module', '-e', script], {
      encoding: 'utf8'
    });

  let result = run(['--no-experimental-detect-module']);

  // Node versions predating the flag never had detection to begin with, so
  // there the plain run is already the strict check. Match only the launcher's
  // own rejection, so a genuine load failure is never mistaken for it.
  if (result.status !== 0 && /bad option/i.test(result.stderr)) {
    result = run([]);
  }

  assert.equal(
    result.status,
    0,
    `ESM entry failed to load with syntax detection disabled: ${result.stderr}`
  );
});

test('the ESM build emits no module-type warning', () => {
  // Node writes process warnings to stderr, so stdout alone would never show
  // MODULE_TYPELESS_PACKAGE_JSON even when it is emitted.
  const result = spawnSync(
    process.execPath,
    ['-e', `import('${new URL('../dist/esm/index.js', import.meta.url).href}')`],
    { encoding: 'utf8' }
  );

  assert.equal(result.status, 0, `entry failed to load: ${result.stderr}`);
  assert.doesNotMatch(result.stderr, /MODULE_TYPELESS_PACKAGE_JSON/);
  assert.doesNotMatch(result.stderr, /Reparsing as ES module/);
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
