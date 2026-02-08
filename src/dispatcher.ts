import { Event, EventHandlers, EventDispatcher, ErrorCallback } from './types.js';
import { isValidEvent } from './validator.js';

/**
 * Creates an event dispatcher that validates events and routes them to appropriate handlers
 * 
 * The dispatcher:
 * 1. Validates events against the superschema
 * 2. Routes events to specific handlers based on event type
 * 3. Supports versioned event types (e.g., "MyEvent:1", "MyEvent:2")
 * 4. Falls back to base event handler or default handler if specific handler not found
 * 
 * @param err - Error callback function to handle validation and dispatch errors
 * @param handlers - Map of event types to their handler functions
 * @returns Event dispatcher function
 * 
 * @example
 * ```typescript
 * const dispatcher = getEventDispatcher(
 *   (error) => console.error(error),
 *   {
 *     'PurchaseOrderReceived': handlePurchaseOrder,
 *     'PurchaseOrderReceived:2': handlePurchaseOrderV2,
 *     '__default__': handleUnknownEvent
 *   }
 * );
 * 
 * dispatcher(event);
 * ```
 */
export function getEventDispatcher(
  err: ErrorCallback,
  handlers: EventHandlers
): EventDispatcher {
  return function dispatch(event: Event): void {
    // Validate event against superschema
    if (!isValidEvent(event)) {
      err({ 
        error: 'SchemaMismatchError', 
        message: 'Event does not match event schema' 
      });
      return;
    }

    // Extract base event name (remove version suffix if present)
    const baseEventName = event.type.includes(':') 
      ? event.type.split(':')[0]
      : event.type;

    // Try to find and call the appropriate handler
    // Priority: exact match > base name match > default handler
    const exactHandler = handlers[event.type];
    const baseHandler = handlers[baseEventName];
    const defaultHandler = handlers.__default__;

    if (exactHandler) {
      exactHandler(err, event);
    } else if (baseHandler) {
      baseHandler(err, event);
    } else if (defaultHandler) {
      defaultHandler(err, event);
    }
    // If no handler found and no default, silently ignore the event
  };
}
