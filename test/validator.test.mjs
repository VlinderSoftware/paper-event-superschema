import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isValidEvent, isValidUUID } from '../dist/esm/index.js';
import {
  INVALID_EVENTS,
  UUID_NIL,
  UUID_V1,
  UUID_V4,
  UUID_V7,
  VALID_EVENTS,
  validEvent,
  withMetadata
} from './fixtures.mjs';

test('isValidUUID accepts any UUID version by default', () => {
  for (const [label, value] of [
    ['v1', UUID_V1],
    ['v4', UUID_V4],
    ['v7', UUID_V7],
    ['nil', UUID_NIL],
    ['uppercase', UUID_V4.toUpperCase()]
  ]) {
    assert.equal(isValidUUID(value), true, `expected ${label} UUID to be accepted`);
  }
});

test('isValidUUID rejects malformed values', () => {
  for (const value of [
    '',
    'not-a-uuid',
    'f47ac10b58cc4372a5670e02b2c3d479',
    'f47ac10b-58cc-4372-a567-0e02b2c3d47',
    `${UUID_V4}-extra`,
    ` ${UUID_V4}`,
    `${UUID_V4}\n`,
    'g47ac10b-58cc-4372-a567-0e02b2c3d479'
  ]) {
    assert.equal(isValidUUID(value), false, `expected ${JSON.stringify(value)} to be rejected`);
  }
});

test('isValidUUID can require a specific version', () => {
  assert.equal(isValidUUID(UUID_V4, { uuidVersion: 4 }), true);
  assert.equal(isValidUUID(UUID_V7, { uuidVersion: 4 }), false);
  assert.equal(isValidUUID(UUID_V1, { uuidVersion: 4 }), false);
  assert.equal(isValidUUID(UUID_NIL, { uuidVersion: 4 }), false);

  assert.equal(isValidUUID(UUID_V7, { uuidVersion: 7 }), true);
  assert.equal(isValidUUID(UUID_V4, { uuidVersion: 7 }), false);
});

test('isValidEvent accepts events matching the superschema', () => {
  for (const [label, event] of VALID_EVENTS) {
    assert.equal(isValidEvent(event), true, `expected "${label}" to be valid`);
  }
});

test('isValidEvent rejects events that do not match the superschema', () => {
  for (const [label, event] of INVALID_EVENTS) {
    assert.equal(isValidEvent(event), false, `expected "${label}" to be invalid`);
  }
});

test('isValidEvent accepts non-v4 UUIDs, as format: "uuid" requires', () => {
  assert.equal(isValidEvent(validEvent({ id: UUID_V7 })), true);
  assert.equal(isValidEvent(withMetadata({ cid: UUID_V1 })), true);
});

test('isValidEvent applies uuidVersion to every UUID field', () => {
  const strict = { uuidVersion: 4 };

  assert.equal(isValidEvent(validEvent(), strict), true);
  assert.equal(isValidEvent(validEvent({ id: UUID_V7 }), strict), false);
  assert.equal(isValidEvent(withMetadata({ cid: UUID_V7 }), strict), false);
  assert.equal(isValidEvent(withMetadata({ pid: UUID_V7 }), strict), false);
  assert.equal(isValidEvent(withMetadata({ tid: UUID_V7 }), strict), false);
  assert.equal(isValidEvent(withMetadata({ uid: UUID_V7 }), strict), false);
});

test('isValidEvent treats data as a JSON Schema object, not typeof object', () => {
  assert.equal(isValidEvent(validEvent({ data: {} })), true);
  assert.equal(isValidEvent(validEvent({ data: null })), false);
  assert.equal(isValidEvent(validEvent({ data: [] })), false);
});

test('isValidEvent does not throw on hostile input', () => {
  const cyclic = validEvent();
  cyclic.data = {};
  cyclic.data.self = cyclic.data;

  assert.equal(isValidEvent(cyclic), true);
  assert.equal(isValidEvent(undefined), false);
  assert.equal(isValidEvent(Object.create(null)), false);
});
