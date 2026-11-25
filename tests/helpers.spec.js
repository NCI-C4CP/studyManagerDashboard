import {
  setupTestEnvironment,
  teardownTestEnvironment,
  installFirebaseStub,
  trackAsyncEventHandlers,
  mockApi,
  jsonResponse,
  expectConsole,
} from './helpers.js';
import {assertNoUnexpectedRequests, resetNetworkMocks} from './network.js';
import {assertExpectedConsole, resetConsoleMocks} from './console.js';

describe('test harness', () => {
  const originalWindow = window;
  let tracker;

  beforeEach(() => setupTestEnvironment());
  afterEach(() => {
    tracker?.restore();
    tracker = undefined;
    vi.useRealTimers();
    teardownTestEnvironment();
  });

  it('keeps global aliases and events in one browser environment', () => {
    expect(window).toBe(originalWindow);
    expect(document.defaultView).toBe(window);
    expect(history).toBe(window.history);
    history.replaceState(null, '', '#fixture');
    expect(location.hash).toBe('#fixture');
    const button = document.createElement('button');
    expect(() => button.dispatchEvent(new Event('click'))).not.toThrow();
  });

  it('preserves event listener identity', async () => {
    tracker = trackAsyncEventHandlers();
    const target = document.createElement('button');
    const listener = vi.fn(async () => {});
    target.addEventListener('click', listener);
    target.addEventListener('click', listener);
    target.click();
    await tracker.allSettled();
    expect(listener).toHaveBeenCalledOnce();
    target.removeEventListener('click', listener);
    target.click();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('drains nested async handlers and listener objects', async () => {
    tracker = trackAsyncEventHandlers();
    const target = document.createElement('button');
    const finished = vi.fn();
    target.addEventListener('click', async () => {
      await Promise.resolve();
      target.dispatchEvent(new Event('loaded'));
    });
    target.addEventListener('loaded', {handleEvent: async () => {
      await Promise.resolve();
      finished();
    }});
    target.click();
    await tracker.allSettled();
    expect(finished).toHaveBeenCalledOnce();
  });

  it('surfaces rejected async event handlers', async () => {
    tracker = trackAsyncEventHandlers();
    const target = document.createElement('button');
    target.addEventListener('click', async () => {
      throw new Error('handler failed');
    });
    target.click();
    await expect(tracker.allSettled()).rejects.toThrow('handler failed');
  });

  it('cancels an unsubscribed Firebase auth callback', () => {
    vi.useFakeTimers();
    const auth = installFirebaseStub();
    const callback = vi.fn();
    const unsubscribe = auth.onAuthStateChanged(callback);
    unsubscribe();
    vi.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
  });

  it('records caught unmocked request errors', async () => {
    await fetch('https://example.com/?api=missing').catch(() => {});
    expect(assertNoUnexpectedRequests).toThrow('Unmocked request: GET');
    resetNetworkMocks();
  });

  it('blocks requests after global stubs have been restored', async () => {
    vi.unstubAllGlobals();
    await expect(fetch('https://example.com/'))
        .rejects.toThrow('Request outside a test fixture');
    expect(assertNoUnexpectedRequests)
        .toThrow('Request outside a test fixture');
    resetNetworkMocks();
  });

  it('matches methods and returns realistic HTTP responses', async () => {
    mockApi({'GET example': () => jsonResponse({code: 200})});
    const response = await fetch('https://example.com/?api=example');
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({code: 200});
    const anotherResponse = await fetch('https://example.com/?api=example');
    expect(await anotherResponse.json()).toEqual({code: 200});
    await expect(fetch('https://example.com/?api=example', {method: 'POST'}))
        .rejects.toThrow('Unmocked request: POST');
    expect(assertNoUnexpectedRequests).toThrow('Unmocked request: POST');
    resetNetworkMocks();
    expect(jsonResponse({code: 401}, {status: 401}).ok).toBe(false);
  });

  it('accepts expected warnings and rejects unexpected errors', () => {
    expectConsole('warn', /expected warning/);
    console.warn('expected warning');
    expect(assertExpectedConsole).not.toThrow();
    console.error('unexpected error');
    expect(assertExpectedConsole).toThrow('unexpected error');
    resetConsoleMocks();
  });

  it('requires the expected number of console messages', () => {
    expectConsole('error', /expected error/);
    expect(assertExpectedConsole).toThrow('received 0');
    console.error('expected error');
    console.error('expected error');
    expect(assertExpectedConsole).toThrow('console.error: expected error');
    resetConsoleMocks();
  });
});
