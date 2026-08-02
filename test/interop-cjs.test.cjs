const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const pkg = require('../dist/cjs/index.js');

const UUID_V4 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

/** Mirrors test/fixtures.mjs; duplicated because that module is ESM-only. */
function validEvent(overrides = {}) {
  return {
    id: UUID_V4,
    type: 'PurchaseOrderReceived',
    metadata: {
      cid: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
      pid: 'b47ac10b-58cc-4372-a567-0e02b2c3d479'
    },
    ...overrides
  };
}

test('the CJS build is marked as CommonJS', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(__dirname, '../dist/cjs/package.json'), 'utf8')
  );
  assert.equal(manifest.type, 'commonjs');
});

test('named exports are available to CommonJS consumers', () => {
  assert.equal(typeof pkg.getEventDispatcher, 'function');
  assert.equal(typeof pkg.isValidEvent, 'function');
  assert.equal(typeof pkg.isValidUUID, 'function');
  assert.equal(typeof pkg.superSchema, 'object');
});

test('the CJS entry point is functional', () => {
  let handled = false;
  pkg.getEventDispatcher(
    (e) => assert.fail(`unexpected error: ${JSON.stringify(e)}`),
    { PurchaseOrderReceived: () => { handled = true; } }
  )(validEvent());

  assert.equal(handled, true);
});

test('both builds behave identically', async () => {
  const esm = await import('../dist/esm/index.js');

  const cases = [
    validEvent(),
    validEvent({ id: 'not-a-uuid' }),
    validEvent({ data: null }),
    validEvent({ data: {} }),
    validEvent({ id: '01937b3f-1c4a-7c3e-8f2a-3b1c4d5e6f70' })
  ];

  for (const event of cases) {
    assert.equal(
      pkg.isValidEvent(event),
      esm.isValidEvent(event),
      `builds disagree on ${JSON.stringify(event.id)}`
    );
  }

  assert.deepEqual(pkg.superSchema, esm.superSchema);
});

test('type declarations are emitted next to both entry points', () => {
  // package.json resolves the "types" condition per build; if a build stops
  // emitting declarations, consumers silently fall back to `any`.
  for (const entry of ['../dist/cjs/index.d.ts', '../dist/esm/index.d.ts']) {
    const declaration = readFileSync(path.join(__dirname, entry), 'utf8');
    assert.match(declaration, /isValidEvent/);
    assert.match(declaration, /getEventDispatcher/);
  }
});
