/**
 * Event Superschema for Microservices
 * 
 * A common schema for event messages to ensure interoperability across microservices.
 * Provides metadata for tracing, authorization, and message routing.
 * 
 * @packageDocumentation
 */

// Export types
export type {
  Event,
  EventMetadata,
  EventHandler,
  EventHandlers,
  EventDispatcher,
  ErrorCallback
} from './types.js';

// Export schema
export { superSchema } from './schema.js';

// Export validator
export { isValidEvent, isValidUUID } from './validator.js';

// Export dispatcher
export { getEventDispatcher } from './dispatcher.js';
