// Test setup file that runs before all tests
// This ensures window exists before any ES module imports that access window at module load time
const { JSDOM } = require('jsdom');

const initialDom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.com/',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set up window and other globals before any ES module imports
global.window = initialDom.window;
global.document = initialDom.window.document;
global.navigator = initialDom.window.navigator;
global.location = initialDom.window.location;
global.history = initialDom.window.history;
global.sessionStorage = initialDom.window.sessionStorage;
global.localStorage = initialDom.window.localStorage;

// Also set on globalThis for ES module compatibility
if (typeof globalThis !== 'undefined') {
  globalThis.window = initialDom.window;
  globalThis.document = initialDom.window.document;
  globalThis.navigator = initialDom.window.navigator;
  globalThis.location = initialDom.window.location;
  globalThis.history = initialDom.window.history;
  globalThis.sessionStorage = initialDom.window.sessionStorage;
  globalThis.localStorage = initialDom.window.localStorage;
}

// Stub window.scrollTo for JSDOM
global.window.scrollTo = () => {};
if (typeof globalThis !== 'undefined' && globalThis.window) {
  globalThis.window.scrollTo = () => {};
}

// Polyfill requestAnimationFrame - must be set before window.load event listeners fire
if (!global.window.requestAnimationFrame) {
  global.window.requestAnimationFrame = (callback) => setTimeout(callback, 16);
  global.window.cancelAnimationFrame = (id) => clearTimeout(id);
}
if (typeof globalThis !== 'undefined' && !globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = global.window.requestAnimationFrame.bind(global.window);
  globalThis.cancelAnimationFrame = global.window.cancelAnimationFrame.bind(global.window);
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

if (typeof globalThis !== 'undefined' && !globalThis.PDFLib) {
  globalThis.PDFLib = pdfStub;
}

if (typeof global !== 'undefined' && !global.PDFLib) {
  global.PDFLib = pdfStub;
}

if (typeof window !== 'undefined' && !window.PDFLib) {
  window.PDFLib = pdfStub;
}

if (typeof globalThis !== 'undefined' && typeof globalThis.download !== 'function') {
  globalThis.download = () => {};
}

// Stub showdown for tests (used in notifications)
const showdownStub = {
  Converter: function Converter() {
    this.makeHtml = (str) => str || '';
  },
};
if (typeof globalThis !== 'undefined' && !globalThis.showdown) {
  globalThis.showdown = showdownStub;
}
if (typeof global !== 'undefined' && !global.showdown) {
  global.showdown = showdownStub;
}
if (typeof window !== 'undefined' && !window.showdown) {
  window.showdown = showdownStub;
}
