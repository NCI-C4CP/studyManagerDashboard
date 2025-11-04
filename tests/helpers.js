import { JSDOM } from 'jsdom';
import { webcrypto } from 'node:crypto';
import fieldMapping from '../src/fieldToConceptIdMapping.js';

let dom = null;
let authStub = null;
let signOutHandler = () => {};

/**
 * Sets up the test environment with JSDOM and necessary polyfills
 * Must be called in beforeEach hooks
 */
export const setupTestEnvironment = () => {
  if (dom) {
    dom.window.close();
  }

  dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.com/',
  });

  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;
  global.location = window.location;
  global.sessionStorage = window.sessionStorage;
  global.localStorage = window.localStorage;

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback) => setTimeout(callback, 16);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  }
  global.requestAnimationFrame = window.requestAnimationFrame.bind(window);
  global.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

  if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
  }
  if (!window.crypto) {
    window.crypto = webcrypto;
  }
};

/**
 * Tears down the test environment
 * Must be called in afterEach hooks
 */
export const teardownTestEnvironment = () => {
  if (dom) {
    dom.window.close();
    dom = null;
  }
  delete global.window;
  delete global.document;
  delete global.navigator;
  delete global.location;
  delete global.sessionStorage;
  delete global.localStorage;
  delete global.requestAnimationFrame;
  delete global.cancelAnimationFrame;
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
      return currentUid ? { uid: currentUid } : null;
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
      callback(currentUid ? { uid: currentUid } : null);
      return () => {};
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
 * @param {number} ms - Milliseconds to wait (default: 10)
 * @returns {Promise<void>}
 */
export const waitForAsyncTasks = (ms = 10) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
