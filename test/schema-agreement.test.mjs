// The package ships two descriptions of the same thing: `superSchema` (the JSON
// Schema quoted from the paper) and `isValidEvent` (a dependency-free
// hand-written check). Nothing forces them to agree, and in practice they drift.
// This test pins them together by running the whole fixture corpus through both.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { isValidEvent, superSchema } from '../dist/esm/index.js';
import { INVALID_EVENTS, UUID_V4, VALID_EVENTS, validEvent } from './fixtures.mjs';

const ajv = addFormats(new Ajv({ strict: true }));
const validateAgainstSchema = ajv.compile(superSchema);

test('superSchema is a compilable JSON Schema', () => {
  assert.equal(typeof validateAgainstSchema, 'function');
});

test('superSchema matches the structure defined in the paper', () => {
  assert.deepEqual([...superSchema.required], ['id', 'type', 'metadata']);
  assert.deepEqual([...superSchema.properties.metadata.required], ['cid', 'pid']);
  assert.deepEqual(Object.keys(superSchema.properties.metadata.properties), [
    'cid',
    'tid',
    'pid',
    'uid',
    'token'
  ]);
});

test('isValidEvent agrees with superSchema on every fixture', () => {
  for (const [label, event] of [...VALID_EVENTS, ...INVALID_EVENTS]) {
    const bySchema = validateAgainstSchema(event);
    const byValidator = isValidEvent(event);

    assert.equal(
      byValidator,
      bySchema,
      `"${label}": isValidEvent returned ${byValidator} but superSchema says ${bySchema}`
    );
  }
});

test('the fixture corpus labels each case correctly', () => {
  // Guards against a fixture being filed under the wrong list, which would make
  // the agreement test above pass while asserting the wrong thing.
  for (const [label, event] of VALID_EVENTS) {
    assert.equal(validateAgainstSchema(event), true, `"${label}" should satisfy superSchema`);
  }
  for (const [label, event] of INVALID_EVENTS) {
    assert.equal(validateAgainstSchema(event), false, `"${label}" should violate superSchema`);
  }
});

test('known deliberate divergence: urn:uuid: prefixes are rejected', () => {
  // RFC 4122 permits a "urn:uuid:" prefix and ajv-formats accepts it, but no
  // producer following the paper emits one and accepting it here would let a
  // non-canonical id through. Asserted rather than ignored so the difference
  // stays visible.
  const urnEvent = validEvent({ id: `urn:uuid:${UUID_V4}` });

  assert.equal(validateAgainstSchema(urnEvent), true);
  assert.equal(isValidEvent(urnEvent), false);
});
