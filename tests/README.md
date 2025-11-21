# Testing Documentation

This directory contains all test files for the Study Manager Dashboard application.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [File Naming Convention](#file-naming-convention)
- [Test Structure](#test-structure)
- [Helper Utilities](#helper-utilities)
- [Writing New Tests](#writing-new-tests)
- [Best Practices](#best-practices)

## Overview

We use **Mocha** as our test framework with **Chai** for assertions. Tests run in a Node.js environment with **JSDOM** to simulate browser APIs.

**Test Runner**: Mocha
**Assertion Library**: Chai (expect style)
**DOM Simulation**: JSDOM
**Module System**: ES Modules via esbuild-register

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (runs tests on file changes)
npm run test:watch

# Run specific test file
npx mocha --require esbuild-register tests/stateManager.spec.js
```

### Understanding Test Output

**Expected Console Messages**: You will see error/warning messages during test runs. These are **intentional** and part of tests that verify error handling works correctly:

- `Failed to load store "stats" Error: decryptString: malformed payload` - Testing tampered encryption handling
- `Participant recovery failed: invalid token` - Testing invalid token handling
- `Error parsing user session: SyntaxError` - Testing malformed JSON handling

These messages indicate the code is **correctly catching and handling errors**. If all tests pass, code is working as expected.

## File Naming Convention

**Pattern**: `tests/<sourceFileName>.spec.js`

Each source file gets exactly one corresponding test file:

```
src/stateManager.js     →  tests/stateManager.spec.js
src/utils.js            →  tests/utils.spec.js
src/crypto.js           →  tests/crypto.spec.js
src/participantLookup.js →  tests/participantLookup.spec.js
```

## Test Structure

### Organizing Tests Within a File

Use nested `describe` blocks to organize tests by module/feature:

```javascript
describe('moduleName', () => {
  // Setup/teardown
  beforeEach(() => { /* ... */ });
  afterEach(() => { /* ... */ });

  describe('featureA', () => {
    it('does something specific', () => { /* ... */ });
    it('handles edge case', () => { /* ... */ });
  });

  describe('featureB', () => {
    it('does something else', () => { /* ... */ });
  });
});
```

### Example: stateManager.spec.js

```javascript
describe('stateManager', () => {
  describe('statsState', () => {
    it('sets and retrieves stats data', async () => { /* ... */ });
    it('persists stats across hydration', async () => { /* ... */ });
  });

  describe('participantState', () => {
    it('encrypts participant token', async () => { /* ... */ });
    it('recovers token from session storage', async () => { /* ... */ });
  });

  describe('userSession', () => {
    it('sets and retrieves user data', () => { /* ... */ });
  });
});
```

## Helper Utilities

All shared test utilities are in `tests/helpers.js`.

### Environment Setup

```javascript
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  installFirebaseStub,
} from './helpers.js';

describe('myModule', () => {
  beforeEach(() => {
    setupTestEnvironment();
    installFirebaseStub({ uid: 'test-user' });
  });

  afterEach(() => {
    teardownTestEnvironment();
  });
});
```

### Async Utilities

```javascript
import { waitForAsyncTasks } from './helpers.js';

it('waits for async encryption', async () => {
  participantState.setParticipant({ id: 1, token: 'secret' });
  await waitForAsyncTasks(); // Wait for fire-and-forget async operations

  expect(sessionStorage.getItem('participantTokenEnc')).to.be.a('string');
});
```

### Console Capture

```javascript
import { captureConsoleWarnings } from './helpers.js';

it('warns when setting invalid data', () => {
  const { warnings, restore } = captureConsoleWarnings();

  someFunction(invalidData);

  expect(warnings.length).to.be.greaterThan(0);
  expect(warnings[0]).to.include('invalid');
  restore();
});
```

### Mock Factories

```javascript
import {
  createMockParticipant,
  createMockUserSession,
  createMockReports,
} from './helpers.js';

it('processes participant data', () => {
  const participant = createMockParticipant('user-42', { id: 42, name: 'Custom Name' });
  const result = processParticipant(participant);
  expect(result).to.be.ok;
});
```

## Writing New Tests

### Step 1: Create Test File

Create a test file matching your source file name:

```bash
# For src/crypto.js
touch tests/crypto.spec.js
```

### Step 2: Set Up Test Structure

```javascript
import { expect } from 'chai';
import { someFunction } from '../src/crypto.js';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
} from './helpers.js';

describe('crypto', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('someFunction', () => {
    it('does what it should', () => {
      const result = someFunction('input');
      expect(result).to.equal('expected');
    });

    it('handles edge case', () => {
      expect(() => someFunction(null)).to.throw();
    });
  });
});
```

### Step 3: Write Tests

Focus on:
- **Happy path** - normal successful execution
- **Edge cases** - boundary conditions, empty inputs, etc.
- **Error handling** - invalid inputs, failures, exceptions
- **Side effects** - state changes, API calls, storage operations

## Best Practices

### 1. Test What Matters

**Do test:**
- Public API behavior
- Error handling
- Edge cases
- State mutations
- Side effects (storage, API calls)

**Don't test:**
- Implementation details
- Private functions (test through public API)
- Third-party libraries

### 2. Keep Tests Independent

Each test should:
- Set up its own data
- Clean up after itself
- Not depend on other tests
- Be runnable in isolation

```javascript
// Good - independent
it('creates user', () => {
  const user = createUser({ name: 'Test' });
  expect(user.name).to.equal('Test');
});

// Bad - depends on previous test
let user;
it('creates user', () => {
  user = createUser({ name: 'Test' });
});
it('retrieves user', () => {
  expect(user.name).to.equal('Test'); // Depends on previous test
});
```

### 3. Use Descriptive Test Names

```javascript
// Good - describes behavior clearly
it('encrypts participant token and stores in sessionStorage', () => { /* ... */ });
it('returns null when participant token is tampered', () => { /* ... */ });

// Bad - vague
it('works', () => { /* ... */ });
it('test 1', () => { /* ... */ });
```

### 4. Arrange-Act-Assert Pattern

```javascript
it('calculates total correctly', () => {
  // Arrange - set up test data
  const items = [{ price: 10 }, { price: 20 }];

  // Act - execute the function
  const total = calculateTotal(items);

  // Assert - verify the result
  expect(total).to.equal(30);
});
```

### 5. Test One Thing at a Time

```javascript
// Good - focused test
it('encrypts data', () => {
  const encrypted = encrypt('data');
  expect(encrypted).to.be.a('string');
  expect(encrypted).to.not.equal('data');
});

it('decrypts data', () => {
  const encrypted = encrypt('data');
  const decrypted = decrypt(encrypted);
  expect(decrypted).to.equal('data');
});

// Bad - testing too much
it('encrypts and decrypts and stores and retrieves', () => {
  // Testing multiple things makes debugging harder
});
```

### 6. Handle Async Properly

```javascript
// Good - async/await
it('fetches data', async () => {
  const data = await fetchData();
  expect(data).to.be.ok;
});

// Good - explicit promise return
it('fetches data', () => {
  return fetchData().then(data => {
    expect(data).to.be.ok;
  });
});

// Bad - missing await
it('fetches data', () => {
  fetchData(); // Promise not awaited - test passes before async completes
  expect(data).to.be.ok;
});
```

### 7. Clean Up Resources

```javascript
describe('myModule', () => {
  let subscription;

  afterEach(() => {
    // Clean up any resources
    if (subscription) {
      subscription.unsubscribe();
    }
    window.sessionStorage.clear();
    // etc.
  });
});
```

## Common Patterns

### Testing Error Handling

```javascript
it('throws error for invalid input', () => {
  expect(() => processData(null)).to.throw('Invalid input');
});

it('returns null for malformed JSON', () => {
  sessionStorage.setItem('data', 'invalid-json{');
  const result = getData();
  expect(result).to.equal(null);
});
```

### Testing State Changes

```javascript
it('updates state correctly', async () => {
  expect(getState().count).to.equal(0);

  await increment();

  expect(getState().count).to.equal(1);
});
```

### Testing Side Effects

```javascript
it('persists data to sessionStorage', async () => {
  await saveData({ key: 'value' });

  const stored = sessionStorage.getItem('data');
  expect(stored).to.be.a('string');

  const parsed = JSON.parse(stored);
  expect(parsed).to.deep.equal({ key: 'value' });
});
```

### Testing Race Conditions

```javascript
it('prevents concurrent recovery attempts', async () => {
  let callCount = 0;
  mockLoader(() => {
    callCount++;
    return Promise.resolve(data);
  });

  await Promise.all([
    recover(),
    recover(),
    recover(),
  ]);

  expect(callCount).to.equal(1); // Should only call once
});
```

### View Detailed Output

```bash
npm test -- --reporter spec
```

## Getting Help

- See `tests/stateManager.spec.js` for examples
- See `tests/helpers.js` for available utilities
- Consult Mocha docs: https://mochajs.org/
- Consult Chai docs: https://www.chaijs.com/
