/**
 * Event metadata containing tracing and authorization information
 */
export interface EventMetadata {
  /** Correlation ID - tracks all events and transactions from initial action */
  cid: string;
  /** Transaction ID - tracks all events from same transaction (optional) */
  tid?: string;
  /** Producer ID - unique ID of the event producer */
  pid: string;
  /** User ID - unique ID of user or tenant (optional) */
  uid?: string;
  /** Authorization token - JWT token authorizing the event (optional) */
  token?: string;
}

/**
 * Base event structure for all messages
 */
export interface Event<T = any> {
  /** Unique message ID (UUID) */
  id: string;
  /** Event type name */
  type: string;
  /** Event metadata */
  metadata: EventMetadata;
  /** Event-specific data payload */
  data?: T;
}

/**
 * Error callback function type
 */
export type ErrorCallback = (error: { error: string; message: string }) => void;

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (err: ErrorCallback, event: Event<T>) => void;

/**
 * Map of event type names to their handlers
 */
export interface EventHandlers {
  [eventType: string]: EventHandler | undefined;
  __default__?: EventHandler;
}

/**
 * Event dispatcher function type
 */
export type EventDispatcher = (event: Event) => void;
