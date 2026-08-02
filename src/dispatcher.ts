import {
  Event,
  EventHandlers,
  EventDispatcher,
  ErrorCallback,
  ValidationOptions
} from './types.js';
import { isValidEvent } from './validator.js';

/**
 * Strips the version suffix from an event type.
 *
 * Only the last `:`-delimited segment is a version, so `Purchase:Order:2` falls
 * back to `Purchase:Order` rather than `Purchase`. Types without a `:` are
 * returned unchanged.
 */
function baseEventName(type: string): string {
  const separator = type.lastIndexOf(':');
  return separator === -1 ? type : type.slice(0, separator);
}

/**
 * Creates an event dispatcher that validates events and routes them to appropriate handlers
 * 
 * The dispatcher:
 * 1. Validates events against the superschema
 * 2. Routes events to specific handlers based on event type
 * 3. Supports versioned event types (e.g., "MyEvent:1", "MyEvent:2")
 * 4. Falls back to base event handler or default handler if specific handler not found
 * 
 * Note that validation is structural only: it checks that the event matches the
 * superschema, not that `metadata.token` is a valid or trusted credential. A
 * dispatched event has not been authenticated or authorized.
 *
 * @param err - Error callback function to handle validation and dispatch errors
 * @param handlers - Map of event types to their handler functions
 * @param options - Optional validation options passed through to `isValidEvent`
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
  handlers: EventHandlers,
  options?: ValidationOptions
): EventDispatcher {
  return function dispatch(event: Event): void {
    // Validate event against superschema
    if (!isValidEvent(event, options)) {
      err({
        error: 'SchemaMismatchError',
        message: 'Event does not match event schema'
      });
      return;
    }

    // Try to find and call the appropriate handler
    // Priority: exact match > base name match > default handler
    const exactHandler = handlers[event.type];
    const baseHandler = handlers[baseEventName(event.type)];
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
