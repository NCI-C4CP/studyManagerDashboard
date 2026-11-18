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

We use **Vitest** as our test framework. Tests run in a Node.js environment with **JSDOM** to simulate browser APIs.

**Test Runner / Assertion Library**: Vitest
**DOM Simulation**: JSDOM (via Vitest's built-in jsdom environment)
**Module System**: Native ES Modules

## Running Tests

```bash
# Match CI with Node.js 24 and the lockfile (currently Vitest 4.1.12)
npm ci
npm exec vitest -- --version

# Run all tests
npm test

# Watch mode (runs tests on file changes)
npm run test:watch

# Run specific test file
npx vitest run tests/stateManager.spec.js

# Verbose output
npx vitest run --reporter=verbose
```

### Understanding Test Output

Unexpected `console.warn` and `console.error` calls fail the test, including errors caught by application code. Tests that deliberately exercise errors must register the expected message with `expectConsole` or capture and assert it with a local spy. For example:

- `Failed to load store "stats" Error: decryptString: malformed payload` - Testing tampered encryption handling
- `Participant recovery failed: invalid token` - Testing invalid token handling
- `Error parsing user session: SyntaxError` - Testing malformed JSON handling

Assert the resulting fallback state or error UI as well as the message. A passing test only proves the behavior its assertions exercise.

CI runs the full suite once with `npm test`, using the dependencies installed by `npm ci`.

## File Naming Convention

**Pattern**: `tests/<sourceFileName>.spec.js`

Each source file gets exactly one corresponding test file:

```
src/stateManager.js     →  tests/stateManager.spec.js
src/utils.js            →  tests/utils.spec.js
src/crypto.js           →  tests/crypto.spec.js
src/participantLookup.js →  tests/participantLookup.spec.js
index.js                →  tests/index.spec.js
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

Await application promises or use `vi.waitFor` against an observable result. Avoid fixed delays for network responses, tab loading, and DOM updates. `trackAsyncEventHandlers()` can await promises returned by event listeners, drains nested async events, and propagates handler rejections. Restore the tracker in `finally` during teardown. It cannot await work that an event handler starts without returning or awaiting it, so those flows still need observable completion assertions.

Vitest owns the single JSDOM instance. The setup helper clears its DOM, storage, and URL. Teardown cancels fixture animation frames and auth callbacks. Tests must finish the behavior they assert before teardown and remove any persistent window listeners they add.

```javascript
import { participantState } from '../src/stateManager.js';

it('waits for async encryption', async () => {
  await participantState.setParticipant({ id: 1, token: 'secret' });

  expect(sessionStorage.getItem('participantTokenEnc')).toBeTypeOf('string');
});
```

### Console Capture

```javascript
import { expectConsole } from './helpers.js';

it('warns when setting invalid data', () => {
  expectConsole('warn', /invalid data/);
  someFunction(invalidData);
  expect(resultingState()).toEqual(defaultState);
});
```

`expectConsole` defaults to exactly one matching call. Pass a third argument for another count. It fails if the message never appears, appears too many times, or another warning/error is logged.

### HTTP Fixtures

The default fetch stub blocks every request. Register each endpoint and HTTP method explicitly. Fixtures reset between tests, and calls to `mockApi` within a test merge or override individual endpoints.

```javascript
import { mockApi, jsonResponse } from './helpers.js';

const fetchMock = mockApi({
  'GET getFilteredParticipants': () => jsonResponse({ code: 200, data: [participant] }),
  'POST updateParticipantData': () => jsonResponse({ code: 200 }),
});

// Real Response objects keep `ok`, `status`, and `json()` consistent.
mockApi({
  'GET getFilteredParticipants': () => jsonResponse({ code: 401 }, { status: 401 }),
});
```

Keys use the `api` query parameter, or the exact URL for requests without one.

### Mock Factories

```javascript
import {
  createMockParticipant,
  createMockUserSession,
  createMockPhysicalActivityReport,
  createMockParticipantLookupLoader,
} from './helpers.js';

it('processes participant data', () => {
  const participant = createMockParticipant('user-42', { id: 42, name: 'Custom Name' });
  const result = processParticipant(participant);
  expect(result).toBeTruthy();
});
```

### State Management Helpers

```javascript
import { clearAllState, clearSearchState } from './helpers.js';

// Clear all application state (useful for comprehensive reset)
beforeEach(async () => {
  setupTestEnvironment();
  installFirebaseStub({ uid: 'test-user' });
  await clearAllState(); // Clears all state managers, sessionStorage, etc.
});

// Clear only search-related state
beforeEach(async () => {
  await clearSearchState(); // Only clears searchState and uiState
});
```

### DOM Fixture Helpers

```javascript
import { createDOMFixture, cleanupDOMFixture } from './helpers.js';

describe('myModule', () => {
  let mainContent;

  beforeEach(() => {
    setupTestEnvironment();
    // Create a DOM fixture element
    mainContent = createDOMFixture('mainContent', 'div', { class: 'test-container' });
  });

  afterEach(() => {
    // Clean up the fixture
    cleanupDOMFixture(mainContent);
    teardownTestEnvironment();
  });
});
```

### Complete Test Suite Setup

```javascript
import { setupTestSuite } from './helpers.js';

describe('myModule', () => {
  let firebaseStub;
  let cleanup;
  let mainContent;

  beforeEach(async () => {
    // This sets up everything
    const suite = await setupTestSuite({
      firebaseUid: 'test-user',
      onSignOut: () => console.log('Signed out'),
      clearState: true,
      domFixtures: [
        { id: 'mainContent', tagName: 'div' },
        { id: 'sidebar', tagName: 'aside' },
      ],
    });

    firebaseStub = suite.firebaseStub;
    cleanup = suite.cleanup;
    mainContent = suite.domFixtures[0];
  });

  afterEach(() => {
    cleanup(); // Handles all cleanup
  });
});
```

### Global Test Stubs

`tests/testSetup.js` provides lightweight globals to let browser-only modules load in Node/JSDOM:
- `PDFLib` and `download` are stubbed for report generators.
- `showdown` is stubbed for markdown conversions in notifications.
- `requestAnimationFrame` is polyfilled if missing.

If you add a module that depends on a window-global library, stub it here so imports don't fail under Vitest.

## Writing New Tests

### Step 1: Create Test File

Create a test file matching your source file name:

```bash
# For src/crypto.js
touch tests/crypto.spec.js
```

### Step 2: Set Up Test Structure

```javascript
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
      expect(result).toBe('expected');
    });

    it('handles edge case', () => {
      expect(() => someFunction(null)).toThrow();
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
  expect(user.name).toBe('Test');
});

// Bad - depends on previous test
let user;
it('creates user', () => {
  user = createUser({ name: 'Test' });
});
it('retrieves user', () => {
  expect(user.name).toBe('Test'); // Depends on previous test
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
  expect(total).toBe(30);
});
```

### 5. Test One Thing at a Time

```javascript
// Good - focused test
it('encrypts data', () => {
  const encrypted = encrypt('data');
  expect(encrypted).toBeTypeOf('string');
  expect(encrypted).not.toBe('data');
});

it('decrypts data', () => {
  const encrypted = encrypt('data');
  const decrypted = decrypt(encrypted);
  expect(decrypted).toBe('data');
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
  expect(data).toBeTruthy();
});

// Good - explicit promise return
it('fetches data', () => {
  return fetchData().then(data => {
    expect(data).toBeTruthy();
  });
});

// Bad - missing await
it('fetches data', () => {
  fetchData(); // Promise not awaited - test passes before async completes
  expect(data).toBeTruthy();
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
  expect(() => processData(null)).toThrow('Invalid input');
});

it('returns null for malformed JSON', () => {
  sessionStorage.setItem('data', 'invalid-json{');
  const result = getData();
  expect(result).toBeNull();
});
```

### Testing State Changes

```javascript
it('updates state correctly', async () => {
  expect(getState().count).toBe(0);

  await increment();

  expect(getState().count).toBe(1);
});
```

### Testing Side Effects

```javascript
it('persists data to sessionStorage', async () => {
  await saveData({ key: 'value' });

  const stored = sessionStorage.getItem('data');
  expect(stored).toBeTypeOf('string');

  const parsed = JSON.parse(stored);
  expect(parsed).toEqual({ key: 'value' });
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

  expect(callCount).toBe(1); // Should only call once
});
```

### View Detailed Output

```bash
npx vitest run --reporter=verbose
```

## Getting Help

- See `tests/stateManager.spec.js` for examples
- See `tests/helpers.js` for available utilities
- Consult Vitest docs: https://vitest.dev/
