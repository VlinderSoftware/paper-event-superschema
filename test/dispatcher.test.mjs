import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getEventDispatcher } from '../dist/esm/index.js';
import { UUID_V7, validEvent } from './fixtures.mjs';

/** Records which handler fired, and any errors reported. */
function recorder(handlerNames) {
  const calls = [];
  const errors = [];
  const handlers = {};
  for (const name of handlerNames) {
    handlers[name] = (err, event) => calls.push({ name, event });
  }
  return { calls, errors, handlers, err: (e) => errors.push(e) };
}

test('dispatches to an exactly matching handler', () => {
  const { calls, errors, handlers, err } = recorder(['PurchaseOrderReceived', '__default__']);
  const event = validEvent();

  getEventDispatcher(err, handlers)(event);

  assert.deepEqual(errors, []);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'PurchaseOrderReceived');
  assert.equal(calls[0].event, event);
});

test('prefers an exact versioned handler over the base handler', () => {
  const { calls, handlers, err } = recorder(['PurchaseOrderReceived', 'PurchaseOrderReceived:2']);

  getEventDispatcher(err, handlers)(validEvent({ type: 'PurchaseOrderReceived:2' }));

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'PurchaseOrderReceived:2');
});

test('falls back to the base handler for an unknown version', () => {
  const { calls, handlers, err } = recorder(['PurchaseOrderReceived']);

  getEventDispatcher(err, handlers)(validEvent({ type: 'PurchaseOrderReceived:3' }));

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'PurchaseOrderReceived');
});

test('strips only the last segment of a multi-colon type', () => {
  // The reference implementation uses rsplit(':', 1), so "Purchase:Order:2"
  // falls back to "Purchase:Order" -- not to "Purchase".
  const { calls, handlers, err } = recorder(['Purchase:Order', 'Purchase']);

  getEventDispatcher(err, handlers)(validEvent({ type: 'Purchase:Order:2' }));

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'Purchase:Order');
});

test('falls back to the default handler when no type matches', () => {
  const { calls, handlers, err } = recorder(['SomethingElse', '__default__']);

  getEventDispatcher(err, handlers)(validEvent({ type: 'Unhandled' }));

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, '__default__');
});

test('ignores an event with no matching handler and no default', () => {
  const { calls, errors, handlers, err } = recorder(['SomethingElse']);

  getEventDispatcher(err, handlers)(validEvent({ type: 'Unhandled' }));

  assert.deepEqual(calls, []);
  assert.deepEqual(errors, []);
});

test('reports SchemaMismatchError and dispatches nothing for an invalid event', () => {
  const { calls, errors, handlers, err } = recorder(['PurchaseOrderReceived', '__default__']);

  getEventDispatcher(err, handlers)({ id: 'not-a-uuid', type: 'PurchaseOrderReceived' });

  assert.deepEqual(calls, []);
  assert.deepEqual(errors, [
    { error: 'SchemaMismatchError', message: 'Event does not match event schema' }
  ]);
});

test('passes the error callback through to the handler', () => {
  const errors = [];
  const err = (e) => errors.push(e);
  let received;

  getEventDispatcher(err, {
    PurchaseOrderReceived: (handlerErr) => {
      received = handlerErr;
    }
  })(validEvent());

  assert.equal(received, err);
});

test('accepts unvalidated input, as bus consumers supply', () => {
  // Events arrive as parsed JSON of unknown shape; the dispatcher is what
  // establishes they are Events, so it must accept anything.
  const { calls, errors, handlers, err } = recorder(['PurchaseOrderReceived']);
  const dispatch = getEventDispatcher(err, handlers);

  for (const junk of [null, undefined, 42, 'string', [], {}]) {
    dispatch(junk);
  }

  assert.deepEqual(calls, []);
  assert.equal(errors.length, 6);
  assert.ok(errors.every((e) => e.error === 'SchemaMismatchError'));
});

test('forwards validation options', () => {
  const { calls, errors, handlers, err } = recorder(['PurchaseOrderReceived']);
  const dispatch = getEventDispatcher(err, handlers, { uuidVersion: 4 });

  dispatch(validEvent({ id: UUID_V7 }));

  assert.deepEqual(calls, []);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].error, 'SchemaMismatchError');
});
