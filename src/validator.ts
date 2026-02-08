import { Event } from './types.js';

/**
 * UUID v4 pattern for validation
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Validates an event against the superschema
 * 
 * @param event - The event to validate
 * @returns true if the event is valid, false otherwise
 */
export function isValidEvent(event: any): event is Event {
  if (!event || typeof event !== 'object') {
    return false;
  }

  // Check required top-level fields
  if (!event.id || typeof event.id !== 'string' || !isValidUUID(event.id)) {
    return false;
  }

  if (!event.type || typeof event.type !== 'string') {
    return false;
  }

  // Check metadata
  if (!event.metadata || typeof event.metadata !== 'object') {
    return false;
  }

  const metadata = event.metadata;

  // Check required metadata fields
  if (!metadata.cid || typeof metadata.cid !== 'string' || !isValidUUID(metadata.cid)) {
    return false;
  }

  if (!metadata.pid || typeof metadata.pid !== 'string' || !isValidUUID(metadata.pid)) {
    return false;
  }

  // Check optional metadata fields if present
  if (metadata.tid !== undefined && (typeof metadata.tid !== 'string' || !isValidUUID(metadata.tid))) {
    return false;
  }

  if (metadata.uid !== undefined && (typeof metadata.uid !== 'string' || !isValidUUID(metadata.uid))) {
    return false;
  }

  if (metadata.token !== undefined && typeof metadata.token !== 'string') {
    return false;
  }

  // Check data field if present
  if (event.data !== undefined && typeof event.data !== 'object') {
    return false;
  }

  return true;
}
