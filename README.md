# paper-event-superschema

Event superschema for microservices interoperability. This package provides a common schema and utilities for event messages to ensure interoperability across microservices.

## Installation

```bash
npm install @vlinder/paper-event-superschema
```

Requires Node 22 or newer. Tested against 22 and 24 (LTS) and 26 (Current);
18 and 20 are end-of-life and are not supported.

## Features

- ✅ Dual module support (CommonJS and ES Modules)
- ✅ TypeScript type definitions included
- ✅ Event validation utilities
- ✅ Event dispatcher with versioning support
- ✅ Zero runtime dependencies

## Usage

### CommonJS (require)

```javascript
const { 
  getEventDispatcher, 
  isValidEvent, 
  superSchema 
} = require('@vlinder/paper-event-superschema');
```

### ES Modules (import)

```javascript
import { 
  getEventDispatcher, 
  isValidEvent, 
  superSchema 
} from '@vlinder/paper-event-superschema';
```

### TypeScript

```typescript
import { 
  Event, 
  EventMetadata, 
  getEventDispatcher,
  isValidEvent
} from '@vlinder/paper-event-superschema';

// Create an event with proper typing
const event: Event<{ orderId: string }> = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  type: 'PurchaseOrderReceived',
  metadata: {
    cid: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
    pid: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
    uid: 'c47ac10b-58cc-4372-a567-0e02b2c3d479'
  },
  data: {
    orderId: 'd47ac10b-58cc-4372-a567-0e02b2c3d479'
  }
};

// Validate the event
if (isValidEvent(event)) {
  console.log('Event is valid!');
}

// Create a dispatcher
const dispatcher = getEventDispatcher(
  (error) => console.error(error),
  {
    'PurchaseOrderReceived': (err, event) => {
      console.log('Handling purchase order:', event.data);
    },
    '__default__': (err, event) => {
      console.log('Handling unknown event:', event.type);
    }
  }
);

dispatcher(event);
```

## Event Schema

The superschema defines the following structure for all events:

```typescript
interface Event<T = any> {
  id: string;           // UUID - unique message ID
  type: string;         // Event type name
  metadata: {
    cid: string;        // UUID - correlation ID (required)
    pid: string;        // UUID - producer ID (required)
    tid?: string;       // UUID - transaction ID (optional)
    uid?: string;       // UUID - user ID (optional)
    token?: string;     // JWT authorization token (optional)
  };
  data?: T;             // Event-specific data payload
}
```

## API

### `isValidEvent(event: any, options?: ValidationOptions): boolean`

Validates an event against the superschema. The checks mirror `superSchema`
exactly, and the test suite cross-checks the two against a JSON Schema validator
so they cannot drift.

Validation is *structural*. It confirms that an event matches the superschema —
it does not verify `metadata.token`, so a valid event is neither authenticated
nor authorized.

### `isValidUUID(value: string, options?: ValidationOptions): boolean`

Validates if a string is a valid UUID.

Any UUID version is accepted by default, which is what the schema's
`format: "uuid"` specifies — producers legitimately use v1, v4 and v7, the last
of which is common for event IDs because it sorts by creation time. Pass
`{ uuidVersion: 4 }` to require a specific version:

```typescript
isValidUUID('01937b3f-1c4a-7c3e-8f2a-3b1c4d5e6f70');                 // true (v7)
isValidUUID('01937b3f-1c4a-7c3e-8f2a-3b1c4d5e6f70', { uuidVersion: 4 }); // false
```

### `getEventDispatcher(err: ErrorCallback, handlers: EventHandlers, options?: ValidationOptions): EventDispatcher`

Creates an event dispatcher that validates events and routes them to appropriate handlers.

Supports:
- Exact event type matching
- Base event type matching (strips the version suffix)
- Default handler fallback
- Event versioning (e.g., `MyEvent:1`, `MyEvent:2`)

Only the final `:`-delimited segment is treated as a version, so
`Purchase:Order:2` falls back to a `Purchase:Order` handler rather than to
`Purchase`. Events that match no handler and have no `__default__` are ignored.

`options` is forwarded to `isValidEvent`.

### `superSchema`

The JSON Schema definition for the event superschema.

## Scope

This package implements the *receiving* half of the pattern: validating an event
against the superschema and dispatching it to a handler. The event *formatting*
and *sending* helpers described in the paper (defaulting `cid` and `tid` to the
event id, injecting a `pid`) are not implemented yet.

## Documentation

For more information about the design and rationale, see [paper-v1.ipynb](./paper-v1.ipynb).

## Development

```bash
npm ci
npm run build   # emits dist/esm and dist/cjs, each with its own module marker
npm test        # builds first, then runs the suite
```

The dual build works by writing a one-line `package.json` into each output
directory (`{"type":"module"}` and `{"type":"commonjs"}`). Node picks a file's
parse mode from the nearest `package.json`, not from the `exports` condition
that resolved it, so without those markers the ESM output is parsed as
CommonJS and fails on Node versions without module syntax detection.

## License

[Apache License 2.0](./LICENSE)

