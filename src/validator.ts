import { Event, ValidationOptions } from './types.js';

/**
 * Version-agnostic UUID pattern.
 *
 * The superschema specifies `format: "uuid"`, which places no constraint on the
 * UUID version. Producers legitimately use v1, v4 and v7 (the latter is common
 * for event IDs because it sorts by creation time), so the default must accept
 * all of them or events valid under the schema would be rejected here.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pattern for a specific RFC 9562 UUID version, with the variant bits pinned.
 */
function versionedUUIDPattern(version: number): RegExp {
  return new RegExp(
    `^[0-9a-f]{8}-[0-9a-f]{4}-${version.toString(16)}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
    'i'
  );
}

/**
 * Validates if a string is a valid UUID
 *
 * By default any UUID version is accepted, matching the `format: "uuid"`
 * constraint in the superschema. Pass `version` to require a specific one.
 *
 * @param value - The string to validate
 * @param options - Optional validation options
 * @returns true if the value is a valid UUID, false otherwise
 *
 * @example
 * ```typescript
 * isValidUUID('01937b3f-1c4a-7c3e-8f2a-3b1c4d5e6f70');              // true (v7)
 * isValidUUID('01937b3f-1c4a-7c3e-8f2a-3b1c4d5e6f70', { version: 4 }); // false
 * ```
 */
export function isValidUUID(value: string, options?: ValidationOptions): boolean {
  const version = options?.uuidVersion;
  if (version === undefined) {
    return UUID_PATTERN.test(value);
  }
  return versionedUUIDPattern(version).test(value);
}

/**
 * True for values the superschema's `{ "type": "object" }` accepts.
 *
 * JSON Schema's "object" excludes both null and arrays, neither of which a bare
 * `typeof x === 'object'` check filters out.
 */
function isSchemaObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates that a value is a UUID string, or absent.
 */
function isOptionalUUID(value: unknown, options?: ValidationOptions): boolean {
  return value === undefined || (typeof value === 'string' && isValidUUID(value, options));
}

/**
 * Validates an event against the superschema
 *
 * The checks here mirror `superSchema` exactly; `test/schema-agreement.test.mjs`
 * cross-checks the two against a JSON Schema validator so they cannot drift.
 *
 * @param event - The event to validate
 * @param options - Optional validation options
 * @returns true if the event is valid, false otherwise
 */
export function isValidEvent(event: any, options?: ValidationOptions): event is Event {
  if (!isSchemaObject(event)) {
    return false;
  }

  // Check required top-level fields
  if (typeof event.id !== 'string' || !isValidUUID(event.id, options)) {
    return false;
  }

  if (typeof event.type !== 'string') {
    return false;
  }

  // Check metadata
  if (!isSchemaObject(event.metadata)) {
    return false;
  }

  const metadata = event.metadata;

  // Check required metadata fields
  if (typeof metadata.cid !== 'string' || !isValidUUID(metadata.cid, options)) {
    return false;
  }

  if (typeof metadata.pid !== 'string' || !isValidUUID(metadata.pid, options)) {
    return false;
  }

  // Check optional metadata fields if present
  if (!isOptionalUUID(metadata.tid, options) || !isOptionalUUID(metadata.uid, options)) {
    return false;
  }

  if (metadata.token !== undefined && typeof metadata.token !== 'string') {
    return false;
  }

  // Check data field if present
  if (event.data !== undefined && !isSchemaObject(event.data)) {
    return false;
  }

  return true;
}
