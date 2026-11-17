import {vi} from 'vitest';

let expectedMessages = [];
let unexpectedMessages = [];

export const expectConsole = (method, matcher, count = 1) => {
  expectedMessages.push({method, matcher, count, seen: 0});
};

export const resetConsoleMocks = () => {
  expectedMessages = [];
  unexpectedMessages = [];
  for (const method of ['warn', 'error']) {
    vi.spyOn(console, method).mockImplementation((...args) => {
      const message = args.map(String).join(' ');
      const expected = expectedMessages.find((entry) =>
        entry.method === method &&
        entry.seen < entry.count && (typeof entry.matcher === 'string' ?
          message.includes(entry.matcher) : entry.matcher.test(message)));
      if (expected) expected.seen += 1;
      else unexpectedMessages.push(`console.${method}: ${message}`);
    });
  }
};

export const assertExpectedConsole = () => {
  const missing = expectedMessages.filter((entry) => entry.seen !== entry.count)
      .map((entry) => `Expected console.${entry.method} matching ` +
        `${entry.matcher} ${entry.count} time(s), received ${entry.seen}`);
  const failures = [...unexpectedMessages, ...missing];
  if (failures.length) throw new Error(failures.join('\n'));
};
