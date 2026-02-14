# paper-event-superschema

Event superschema for microservices interoperability. This package provides a common schema and utilities for event messages to ensure interoperability across microservices.

## Installation

```bash
npm install @vlinder/paper-event-superschema
```

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

### `isValidEvent(event: any): boolean`

Validates an event against the superschema.

### `isValidUUID(value: string): boolean`

Validates if a string is a valid UUID v4.

### `getEventDispatcher(err: ErrorCallback, handlers: EventHandlers): EventDispatcher`

Creates an event dispatcher that validates events and routes them to appropriate handlers.

Supports:
- Exact event type matching
- Base event type matching (strips version suffix)
- Default handler fallback
- Event versioning (e.g., `MyEvent:1`, `MyEvent:2`)

### `superSchema`

The JSON Schema definition for the event superschema.

## Documentation

For more information about the design and rationale, see [guidelines.ipynb](./guidelines.ipynb).

## License

MIT

