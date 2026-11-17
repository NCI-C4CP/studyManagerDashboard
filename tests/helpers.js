import { webcrypto } from 'node:crypto';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
export { mockApi, jsonResponse } from './network.js';
export { expectConsole } from './console.js';

let authStub = null;
let signOutHandler = () => {};
const fixtureTimers = new Set();
const fixtureFrames = new Set();
let restoreAnimationFrame;

/**
 * Sets up the test environment with JSDOM and necessary polyfills
 * Must be called in beforeEach hooks
 */
export const setupTestEnvironment = () => {
  // Vitest owns the browser environment. Keep history, window and document
  // attached to that same environment instead of creating a second JSDOM.
  teardownTestEnvironment();
  document.body.replaceChildren();
  sessionStorage.clear();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  window.onload = null;
  window.onhashchange = null;
  const originalRequest = window.requestAnimationFrame;
  const originalCancel = window.cancelAnimationFrame;
  window.requestAnimationFrame = (callback) => {
    const id = originalRequest.call(window, (timestamp) => {
      fixtureFrames.delete(id);
      callback(timestamp);
    });
    fixtureFrames.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    fixtureFrames.delete(id);
    originalCancel.call(window, id);
  };
  restoreAnimationFrame = () => {
    for (const id of fixtureFrames) originalCancel.call(window, id);
    fixtureFrames.clear();
    window.requestAnimationFrame = originalRequest;
    window.cancelAnimationFrame = originalCancel;
  };

  if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
  }
  if (!window.crypto) {
    window.crypto = webcrypto;
  }

  // Stub scrollTo
  window.scrollTo = () => {};
};

/**
 * Tears down the test environment
 * Must be called in afterEach hooks
 */
export const teardownTestEnvironment = () => {
  restoreAnimationFrame?.();
  restoreAnimationFrame = undefined;
  for (const timer of fixtureTimers) clearTimeout(timer);
  fixtureTimers.clear();
  window.onload = null;
  window.onhashchange = null;
  document.body.replaceChildren();
  authStub = null;
  signOutHandler = () => {};
};

/**
 * Installs a Firebase auth stub for testing
 * @param {Object} options - Configuration options
 * @param {string} options.uid - User ID (default: 'test-user')
 * @param {Function} options.onSignOut - Callback when signOut is called
 * @returns {Object} Firebase auth stub
 */
export const installFirebaseStub = ({ uid = 'test-user', onSignOut } = {}) => {
  signOutHandler = typeof onSignOut === 'function' ? onSignOut : () => {};
  let currentUid = uid;

  authStub = {
    get currentUser() {
      return currentUid ? { uid: currentUid, getIdToken: async () => 'fake-id-token' } : null;
    },
    setUid: (nextUid) => {
      currentUid = nextUid || null;
    },
    signOut: () => {
      signOutHandler();
      currentUid = null;
    },
    setPersistence: async () => {},
    onAuthStateChanged: (callback) => {
      const timer = setTimeout(() => {
        fixtureTimers.delete(timer);
        callback(currentUid ? { uid: currentUid, getIdToken: async () => 'fake-id-token' } : null);
      }, 0);
      fixtureTimers.add(timer);
      return () => {
        clearTimeout(timer);
        fixtureTimers.delete(timer);
      };
    },
  };

  global.firebase = {
    auth: () => authStub,
    apps: [],
    initializeApp: () => {},
    app: () => ({}),
  };

  return authStub;
};

/**
 * Gets the current Firebase auth stub
 * @returns {Object} Firebase auth stub
 */
export const getFirebaseAuthStub = () => authStub;

/**
 * Waits for async tasks to complete
 * Useful for ensuring fire-and-forget async operations have completed
 * @param {number} ms - Milliseconds to wait (default: 50)
 * @returns {Promise<void>}
 */
export const waitForAsyncTasks = (ms = 50) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Intercept addEventListener on the current JSDOM's EventTarget to capture
 * promises returned by async event handlers (which are normally fire-and-forget).
 * Solves the CI flake where teardownTestEnvironment() destroys `document`
 * while an async click handler is still in flight.
 *
 * Called after setupTestEnvironment() (needs global.window) and before
 * the test code registers its event listeners.
 *
 * @returns {{ allSettled: () => Promise<void>, restore: () => void }}
 */
export const trackAsyncEventHandlers = () => {
  const pending = new Set();
  const errors = [];
  const registrations = [];
  const proto = global.window.EventTarget.prototype;
  const origAddEventListener = proto.addEventListener;
  const origRemoveEventListener = proto.removeEventListener;
  const captureOf = (options) => typeof options === 'boolean' ? options : !!options?.capture;

  proto.addEventListener = function (type, listener, options) {
    if (!listener) return origAddEventListener.call(this, type, listener, options);
    const capture = captureOf(options);
    const existing = registrations.find((entry) =>
      entry.target === this && entry.type === type && entry.listener === listener && entry.capture === capture);
    if (existing) return origAddEventListener.call(this, type, existing.wrappedListener, options);
    const wrappedListener = function (...args) {
      const result = typeof listener === 'function' ? listener.apply(this, args) : listener.handleEvent(...args);
      if (result && typeof result.then === 'function') {
        const tracked = Promise.resolve(result).catch((error) => errors.push(error)).finally(() => pending.delete(tracked));
        pending.add(tracked);
      }
      return result;
    };
    registrations.push({ target: this, type, listener, wrappedListener, capture });
    return origAddEventListener.call(this, type, wrappedListener, options);
  };
  proto.removeEventListener = function (type, listener, options) {
    const entry = registrations.find((item) => item.target === this && item.type === type &&
      item.listener === listener && item.capture === captureOf(options));
    return origRemoveEventListener.call(this, type, entry?.wrappedListener ?? listener, options);
  };

  return {
    // Handlers can dispatch more events while awaiting work. Drain all of them.
    allSettled: async () => {
      while (pending.size) await Promise.all([...pending]);
      if (errors.length) {
        const [error] = errors.splice(0);
        throw error;
      }
    },
    restore: () => {
      proto.addEventListener = origAddEventListener;
      proto.removeEventListener = origRemoveEventListener;
      for (const entry of registrations) {
        origRemoveEventListener.call(entry.target, entry.type, entry.wrappedListener, entry.capture);
      }
    },
  };
};

/**
 * Waits for any UI-driven state persistence (e.g., column toggle updates) to finish.
 * Resets internal trackers afterwards so subsequent tests start clean.
 */
export const flushActiveColumnsUpdates = async () => {
  const module = await import('../src/participantCommons.js');
  const waitForActiveColumnsUpdate = module?.waitForActiveColumnsUpdate || module?.default?.waitForActiveColumnsUpdate;
  if (typeof waitForActiveColumnsUpdate === 'function') {
    await waitForActiveColumnsUpdate();
    await Promise.resolve();
  }
};

/**
 * Resets column-update tracking so subsequent tests start with a resolved promise.
 */
export const resetActiveColumnsUpdateTracking = async () => {
  const module = await import('../src/participantCommons.js');
  const resetActiveColumnsUpdateTracker = module?.resetActiveColumnsUpdateTracker || module?.default?.resetActiveColumnsUpdateTracker;
  if (typeof resetActiveColumnsUpdateTracker === 'function') {
    resetActiveColumnsUpdateTracker();
  }
};

/**
 * Captures console warnings during test execution
 * @returns {Object} Object with warnings array and restore function
 */
export const captureConsoleWarnings = () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  return {
    warnings,
    restore: () => {
      console.warn = originalWarn;
    },
  };
};

/**
 * Captures console errors during test execution
 * @returns {Object} Object with errors array and restore function
 */
export const captureConsoleErrors = () => {
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  return {
    errors,
    restore: () => {
      console.error = originalError;
    },
  };
};

/**
 * Creates a mock participant object with realistic default values
 * Uses concept IDs matching the fieldToConceptIdMapping structure
 * @param {string} uid - User ID (default: 'test-participant-uid')
 * @param {Object} overrides - Properties to override defaults
 * @param {Object} overrides.state - Additional state properties (will be merged with { uid })
 * @returns {Object} Mock participant object with concept ID keys and state property
 */
export const createMockParticipant = (uid = 'test-participant-uid', overrides = {}) => {
  const { state: stateOverrides, ...otherOverrides } = overrides;

  return {
    // State property with uid (required for participant structure)
    state: { uid, ...stateOverrides },
    
    // Core participant data
    [fieldMapping.fName]: 'John',
    [fieldMapping.lName]: 'Doe',
    [fieldMapping.prefName]: 'Johnny',
    [fieldMapping.mName]: 'Michael',
    [fieldMapping.email]: 'john.doe@example.com',
    [fieldMapping.cellPhone]: '5551234567',
    [fieldMapping.homePhone]: '5559876543',
    [fieldMapping.verifiedFlag]: fieldMapping.verified,
    token: 'test-token-12345',
    Connect_ID: 'CONN001',
    studyId: 'STUDY001',
    ...otherOverrides,
  };
};

/**
 * Creates a mock user session object with realistic default values
 * This is the logged-in SMDB user object
 * Based on Firebase auth user object structure and app usage patterns
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock user session object
 */
export const createMockUserSession = (overrides = {}) => ({
  // Email is the primary identifier used throughout the app, and UID is used for encryption
  email: 'test.user@example.com',
  name: 'Test User',
  uid: 'test-user-uid-123',
  
  ...overrides,
});

/**
 * Creates a mock physical activity report object
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock physical activity report object
 */
export const createMockPhysicalActivityReport = (overrides = {}) => {
  const reportDate = new Date().toISOString();
  const viewedDate = new Date(Date.now() - 86400000).toISOString();

  return {
    physActReport: {
      // Report timestamp using concept ID as key with 'd_' prefix (date format), phys activity metrics, and view/decline timestamps
      [`d_${fieldMapping.reports.physicalActivity.reportTS}`]: reportDate,
      [`d_${fieldMapping.reports.physicalActivity.aerobicActivity}`]: fieldMapping.reports.physicalActivity.aerobicActivityMeeting,
      [`d_${fieldMapping.reports.physicalActivity.muscleActivity}`]: 150, // minutes per week
      [`d_${fieldMapping.reports.physicalActivity.viewedTS}`]: viewedDate,
      [`d_${fieldMapping.reports.physicalActivity.declinedTS}`]: null,
      status: 'available',
    },
    ...overrides,
  };
};

/**
 * Creates a mock participant lookup loader for testing
 * @param {Function} findParticipantMock - Mock function that returns participant lookup results
 * @returns {Function} Loader function that returns mock participant lookup module
 */
export const createMockParticipantLookupLoader = (findParticipantMock) => {
  return () => Promise.resolve({
    findParticipant: findParticipantMock,
  });
};

/**
 * Clears all application state
 * @param {Object} options - Configuration options
 * @param {boolean} options.clearSessionStorage - Clear sessionStorage (default: true)
 * @param {boolean} options.resetAppStateUID - Reset app state UID (default: true)
 * @param {boolean} options.clearParticipantLookupLoader - Clear lookup loader (default: true)
 * @returns {Promise<void>}
 */
export const clearAllState = async (options = {}) => {
  const {
    clearSessionStorage = true,
    resetAppStateUID: shouldResetUID = true,
    clearParticipantLookupLoader = true,
  } = options;

  // Import state managers dynamically to avoid circular dependencies
  const stateManagerModule = await import('../src/stateManager.js');
  const {
    statsState,
    roleState,
    uiState,
    participantState,
    userSession,
    reportsState,
    searchState,
    appState,
    resetAppStateUID,
    setParticipantLookupLoader,
  } = stateManagerModule?.default ?? stateManagerModule;

  // Reset app state UID first (needed for encrypted stores to recognize new session)
  // This prevents stores from trying to reload data for the wrong user
  if (shouldResetUID) {
    resetAppStateUID?.();
  }

  // Clear sessionStorage to prevent any data reloads
  // This must happen before clearing stores, otherwise stores might reload from sessionStorage
  if (clearSessionStorage) {
    window.sessionStorage.clear();
  }

  // Clear search state cache (module-level variables)
  // This clears searchMetadataCache and searchResultsCache which persist across tests
  searchState?.clearSearchResults?.();

  // Clear all encrypted stores (this writes defaults to appState)
  // After sessionStorage is cleared, these .clear() calls write fresh defaults to appState
  statsState?.clear?.();
  roleState?.clear?.();
  uiState?.clear?.();
  participantState?.clearParticipant?.();
  userSession?.clearUser?.();
  reportsState?.clearReports?.();
  
  // Reconstruct appState to ensure clean state
  // Get the encrypted store defaults that were just set
  const currentAppState = appState?.getState();
  
  // Reconstruct appState from scratch with fresh object references (no stale references persist from previous tests)
  appState?.setState({
    hasUnsavedChanges: false,
    participant: null,
    reports: null,
    stats: currentAppState?.stats ? JSON.parse(JSON.stringify(currentAppState.stats)) : currentAppState?.stats,
    roleFlags: currentAppState?.roleFlags ? JSON.parse(JSON.stringify(currentAppState.roleFlags)) : currentAppState?.roleFlags,
    uiFlags: currentAppState?.uiFlags ? JSON.parse(JSON.stringify(currentAppState.uiFlags)) : currentAppState?.uiFlags,
  });
  
  // Verify reports and participant are null
  const verifiedState = appState?.getState ? appState.getState() : {};
  if (verifiedState?.reports !== null || verifiedState?.participant !== null) {
    // If verification fails, force clear
    appState?.setState?.((state) => {
      return {
        hasUnsavedChanges: false,
        participant: null,
        reports: null,
        stats: state?.stats,
        roleFlags: state?.roleFlags,
        uiFlags: state?.uiFlags,
      };
    });
  }
  
  // Double-check search state cache is cleared
  searchState?.clearSearchResults?.();

  // Reset participant lookup loader
  if (clearParticipantLookupLoader) {
    setParticipantLookupLoader?.();
  }
  
  await flushActiveColumnsUpdates();
  await resetActiveColumnsUpdateTracking();
};

/**
 * Clears only search-related state
 * Uses dynamic import to avoid circular dependencies
 * @returns {Promise<void>}
 */
export const clearSearchState = async () => {
  const { searchState, uiState } = await import('../src/stateManager.js');
  searchState.clearSearchResults();
  uiState.clear();
};

/**
 * Creates a DOM fixture element and appends it to document.body
 * @param {string} id - Element ID
 * @param {string} tagName - HTML tag name (default: 'div')
 * @param {Object} attributes - Additional attributes to set
 * @returns {HTMLElement} Created element
 */
export const createDOMFixture = (id, tagName = 'div', attributes = {}) => {
  const element = document.createElement(tagName);
  element.id = id;
  
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  document.body.appendChild(element);
  return element;
};

/**
 * Removes a DOM fixture element
 * @param {HTMLElement} element - Element to remove
 */
export const cleanupDOMFixture = (element) => {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
};

/**
 * Sets up a complete test suite with common initialization
 * Returns cleanup function for use in afterEach
 * @param {Object} options - Configuration options
 * @param {string} options.firebaseUid - Firebase user ID (default: 'test-user')
 * @param {Function} options.onSignOut - Sign out callback
 * @param {boolean} options.clearState - Clear all state (default: true)
 * @param {Array<Object>} options.domFixtures - Array of {id, tagName, attributes} for DOM fixtures
 * @returns {Promise<Object>} { firebaseStub, cleanup, domFixtures }
 */
export const setupTestSuite = async (options = {}) => {
  let {
    firebaseUid = 'test-user',
    onSignOut,
    clearState = true,
    domFixtures = [],
  } = options;

  // Setup environment
  setupTestEnvironment();
  
  // Install Firebase stub
  const firebaseStub = installFirebaseStub({ uid: firebaseUid, onSignOut });
  
  // Clear state
  if (clearState) {
    await clearAllState();
  }
  
  // Create DOM fixtures
  domFixtures = domFixtures.map(({ id, tagName = 'div', attributes = {} }) =>
    createDOMFixture(id, tagName, attributes)
  );
  
  // Return cleanup function
  const cleanup = () => {
    domFixtures.forEach(cleanupDOMFixture);
    teardownTestEnvironment();
  };
  
  return { firebaseStub, cleanup, domFixtures };
};
