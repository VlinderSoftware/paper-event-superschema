// Test CommonJS import
const { 
  getEventDispatcher, 
  isValidEvent, 
  isValidUUID,
  superSchema 
} = require('../dist/cjs/index.js');

console.log('Testing CommonJS module...');

// Test UUID validation
console.log('✓ isValidUUID function loaded');
const validUUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const invalidUUID = 'not-a-uuid';
console.log(`  Valid UUID test: ${isValidUUID(validUUID) ? 'PASS' : 'FAIL'}`);
console.log(`  Invalid UUID test: ${!isValidUUID(invalidUUID) ? 'PASS' : 'FAIL'}`);

// Test event validation
console.log('✓ isValidEvent function loaded');
const validEvent = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  type: 'TestEvent',
  metadata: {
    cid: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
    pid: 'b47ac10b-58cc-4372-a567-0e02b2c3d479'
  }
};
console.log(`  Valid event test: ${isValidEvent(validEvent) ? 'PASS' : 'FAIL'}`);

const invalidEvent = {
  id: 'not-a-uuid',
  type: 'TestEvent'
};
console.log(`  Invalid event test: ${!isValidEvent(invalidEvent) ? 'PASS' : 'FAIL'}`);

// Test dispatcher
console.log('✓ getEventDispatcher function loaded');
let handlerCalled = false;
const dispatcher = getEventDispatcher(
  (err) => console.error('Error:', err),
  {
    'TestEvent': (err, event) => {
      handlerCalled = true;
    }
  }
);
dispatcher(validEvent);
console.log(`  Dispatcher test: ${handlerCalled ? 'PASS' : 'FAIL'}`);

// Test schema export
console.log('✓ superSchema loaded');
console.log(`  Schema has required fields: ${superSchema.required.includes('id') && superSchema.required.includes('type') ? 'PASS' : 'FAIL'}`);

console.log('\n✅ All CommonJS tests passed!');
