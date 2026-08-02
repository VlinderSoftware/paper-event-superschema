// Shared event fixtures.
//
// Every entry is a case where the hand-written validator and the exported JSON
// Schema must agree; schema-agreement.test.mjs runs the whole corpus through
// both. Add new edge cases here rather than in a single test file.

export const UUID_V1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
export const UUID_V4 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
export const UUID_V7 = '01937b3f-1c4a-7c3e-8f2a-3b1c4d5e6f70';
export const UUID_NIL = '00000000-0000-0000-0000-000000000000';

const CID = 'a47ac10b-58cc-4372-a567-0e02b2c3d479';
const PID = 'b47ac10b-58cc-4372-a567-0e02b2c3d479';

/** A minimal event satisfying every required field. */
export function validEvent(overrides = {}) {
  return {
    id: UUID_V4,
    type: 'PurchaseOrderReceived',
    metadata: { cid: CID, pid: PID },
    ...overrides
  };
}

/** A valid event with `metadata` merged rather than replaced. */
export function withMetadata(metadata) {
  return validEvent({ metadata: { cid: CID, pid: PID, ...metadata } });
}

export const VALID_EVENTS = [
  ['minimal required fields', validEvent()],
  ['empty type', validEvent({ type: '' })],
  ['versioned type', validEvent({ type: 'PurchaseOrderReceived:2' })],
  ['v1 id', validEvent({ id: UUID_V1 })],
  ['v7 id', validEvent({ id: UUID_V7 })],
  ['nil id', validEvent({ id: UUID_NIL })],
  ['uppercase id', validEvent({ id: UUID_V4.toUpperCase() })],
  ['empty data object', validEvent({ data: {} })],
  ['populated data object', validEvent({ data: { orderId: UUID_V4, items: [] } })],
  ['optional tid', withMetadata({ tid: UUID_V4 })],
  ['optional uid', withMetadata({ uid: UUID_V7 })],
  ['optional token', withMetadata({ token: 'ey.not.a.real.jwt' })],
  ['empty token', withMetadata({ token: '' })],
  ['all optional metadata', withMetadata({ tid: UUID_V1, uid: UUID_V4, token: 'tok' })],
  ['unknown top-level property', validEvent({ producedAt: '2026-02-08T00:00:00Z' })],
  ['unknown metadata property', withMetadata({ region: 'eu-west-1' })]
];

export const INVALID_EVENTS = [
  ['null', null],
  ['array', []],
  ['string', 'not-an-event'],
  ['number', 42],
  ['empty object', {}],
  ['missing id', { type: 'T', metadata: { cid: CID, pid: PID } }],
  ['missing type', { id: UUID_V4, metadata: { cid: CID, pid: PID } }],
  ['missing metadata', { id: UUID_V4, type: 'T' }],
  ['non-uuid id', validEvent({ id: 'not-a-uuid' })],
  ['numeric id', validEvent({ id: 12345 })],
  ['non-string type', validEvent({ type: 7 })],
  ['null metadata', validEvent({ metadata: null })],
  ['array metadata', validEvent({ metadata: [] })],
  ['metadata missing cid', validEvent({ metadata: { pid: PID } })],
  ['metadata missing pid', validEvent({ metadata: { cid: CID } })],
  ['non-uuid cid', withMetadata({ cid: 'nope' })],
  ['non-uuid pid', withMetadata({ pid: 'nope' })],
  ['non-uuid tid', withMetadata({ tid: 'nope' })],
  ['non-uuid uid', withMetadata({ uid: 'nope' })],
  ['non-string token', withMetadata({ token: 1234 })],
  ['null data', validEvent({ data: null })],
  ['array data', validEvent({ data: [1, 2] })],
  ['string data', validEvent({ data: 'payload' })],
  ['uuid with wrong grouping', validEvent({ id: 'f47ac10b58cc4372a5670e02b2c3d479' })],
  ['uuid with trailing text', validEvent({ id: `${UUID_V4}-extra` })]
];
