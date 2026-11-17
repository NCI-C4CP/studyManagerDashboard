import {vi} from 'vitest';

let routes = new Map();
let unexpectedRequests = [];
let fetchMock;

const rejectRequest = (message) => {
  unexpectedRequests.push(message);
  throw new Error(message);
};

// Installed before test modules import. Restoring a test's globals returns to
// this guard, never to Node's network transport.
export const installNetworkIsolation = () => {
  global.fetch = async (input) =>
    rejectRequest(`Request outside a test fixture: ${String(input)}`);
};

export const jsonResponse = (body, {status = 200, ...options} = {}) =>
  new Response(JSON.stringify(body), {
    ...options,
    status,
    headers: {'Content-Type': 'application/json', ...options.headers},
  });

export const resetNetworkMocks = () => {
  routes = new Map();
  unexpectedRequests = [];
  fetchMock = vi.fn(async (input, options = {}) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    const method = String(options.method ?? input?.method ?? 'GET')
        .toUpperCase();
    let parsedUrl;
    try {
      parsedUrl = new URL(url, window.location.href);
    } catch {
      return rejectRequest(`Invalid request URL: ${method} ${url}`);
    }
    const api = parsedUrl.searchParams.get('api');
    const key = `${method} ${api ?? parsedUrl.href}`;
    const handler = routes.get(key);
    if (!handler) {
      return rejectRequest(`Unmocked request: ${method} ${url}`);
    }
    return typeof handler === 'function' ?
      handler(url, options) : handler.clone();
  });
  vi.stubGlobal('fetch', fetchMock);
};

// Merge endpoint fixtures so nested suites can override individual responses.
export const mockApi = (handlers) => {
  for (const [key, handler] of Object.entries(handlers)) {
    routes.set(key, handler);
  }
  return fetchMock;
};

// Application code often catches fetch errors. Still fail the originating test.
export const assertNoUnexpectedRequests = () => {
  const messages = unexpectedRequests.splice(0);
  if (messages.length) throw new Error(messages.join('\n'));
};
