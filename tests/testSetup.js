import { beforeEach, afterEach, afterAll, vi } from 'vitest';
import { installNetworkIsolation, resetNetworkMocks, assertNoUnexpectedRequests } from './network.js';
import { resetConsoleMocks, assertExpectedConsole } from './console.js';

installNetworkIsolation();

beforeEach(() => {
  assertNoUnexpectedRequests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetNetworkMocks();
  resetConsoleMocks();
});

afterAll(assertNoUnexpectedRequests);

afterEach(() => {
  try {
    assertNoUnexpectedRequests();
    assertExpectedConsole();
  } finally {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});

// Vitest owns window/document/navigator. These browser-library stubs support
// modules imported by the tests, alongside the request and console guards above.

// Stub window.scrollTo for JSDOM
window.scrollTo = () => {};

// Polyfill requestAnimationFrame if missing
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (callback) => setTimeout(callback, 16);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
}

// Stub PDFLib and download for tests that import report modules in Node/JSDOM
const pdfStub = {
  PDFDocument: {
    load: async () => ({
      getPages: () => [
        {
          drawImage: () => {},
          drawText: () => {},
        },
      ],
      embedPng: async () => ({}),
      embedFont: async () => ({}),
      save: async () => new Uint8Array(),
    }),
  },
  StandardFonts: {
    Helvetica: 'Helvetica',
    HelveticaBold: 'Helvetica-Bold',
  },
  rgb: () => ({}),
};

globalThis.PDFLib = pdfStub;
globalThis.download = () => {};

// Stub showdown for tests (used in notifications)
const showdownStub = {
  Converter: function Converter() {
    this.makeHtml = (str) => str || '';
  },
};
globalThis.showdown = showdownStub;
