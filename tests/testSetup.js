// Test setup file that runs before all tests
// Vitest's jsdom environment handles window/document/navigator/etc. automatically.
// This file only provides stubs for browser-global libraries used by application code.

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
