import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendBookToExternalEndpoint, validateExternalEndpoint } from './externalSyncService.js';

const endpoint = 'https://script.google.com/macros/s/test-deployment/exec';
const book = { isbn: '9788020719805', title: 'Babička', author: 'Božena Němcová', description: 'Krátký příběh o životě na vesnici.' };

test('rejects document links, development URLs and unsafe addresses before sending', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', () => { calls++; });
  for (const url of ['https://docs.google.com/spreadsheets/d/test/edit',
    'https://sheets.google.com/', 'https://script.google.com/macros/s/test/dev',
    'http://example.com/hook', 'https://user:password@example.com/hook', 'not-a-url']) {
    assert.ok(validateExternalEndpoint(url), url);
    assert.equal((await sendBookToExternalEndpoint(url, book)).ok, false);
  }
  assert.equal(calls, 0);
  assert.equal(validateExternalEndpoint(''), '');
});

test('Apps Script uses a simple POST and requires explicit write acknowledgement', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, endpoint);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'text/plain;charset=UTF-8');
    assert.notEqual(options.mode, 'no-cors');
    const payload = JSON.parse(options.body);
    assert.equal(payload.book.isbn, book.isbn);
    assert.equal('description' in payload.book, false);
    assert.equal(payload.userRole, 'knihovnik');
    return new Response(JSON.stringify({ ok: true }));
  });
  assert.equal((await sendBookToExternalEndpoint(` ${endpoint} `, book, 'knihovnik')).ok, true);
});

test('HTTP failures, application failures, login pages and network errors never report success', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch');
  for (const response of [new Response('', { status: 403 }),
    new Response('{"ok":false}'), new Response('<html>Login required</html>')]) {
    mock.mock.mockImplementation(async () => response);
    assert.equal((await sendBookToExternalEndpoint(endpoint, book)).ok, false);
  }
  mock.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
  assert.equal((await sendBookToExternalEndpoint(endpoint, book)).ok, false);
  mock.mock.mockImplementation(async () => { throw new DOMException('Aborted', 'AbortError'); });
  assert.match((await sendBookToExternalEndpoint(endpoint, book)).message, /Vypršel čas/);
});

test('generic webhooks retain JSON requests and accept successful HTTP status', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.headers['Content-Type'], 'application/json');
    return new Response(null, { status: 204 });
  });
  assert.equal((await sendBookToExternalEndpoint('https://example.com/hook', book)).ok, true);
});

test('provided Apps Script writes a text row under a lock and acknowledges only completed writes', async () => {
  const { readFileSync } = await import('node:fs');
  const { runInNewContext } = await import('node:vm');
  const source = readFileSync(new URL('../../public/google-apps-script.gs', import.meta.url), 'utf8');
  let held = false;
  let flushed = false;
  let writtenRow;
  let headers;
  const lock = {
    waitLock() { held = true; },
    hasLock() { return held; },
    releaseLock() { held = false; }
  };
  const sheet = {
    getLastRow() { return headers ? 1 : 0; },
    appendRow(values) { headers = values; },
    getRange(row, col, rows, cols) {
      assert.equal(held, true);
      assert.deepEqual([row, col, rows, cols], [2, 1, 1, 12]);
      return { setValues(values) { writtenRow = values[0]; } };
    }
  };
  const sandbox = {
    LockService: { getScriptLock: () => lock },
    SpreadsheetApp: {
      openById: () => ({ getSheetByName: () => sheet }),
      flush() { flushed = true; }
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput(text) { return { setMimeType: () => JSON.parse(text) }; }
    },
    console: { error() {} }
  };
  runInNewContext(source, sandbox);
  const payload = { event: 'book_added', timestamp: '2026-11-01T12:00:00Z', book: { ...book, title: '=FORMULA()' } };
  assert.equal(sandbox.doPost({ postData: { contents: JSON.stringify(payload) } }).ok, true);
  assert.equal(flushed, true);
  assert.equal(writtenRow[0], "'9788020719805");
  assert.equal(writtenRow[1], "'=FORMULA()");
  assert.equal(held, false);
  sandbox.SpreadsheetApp.openById = () => { throw new Error('Permission denied'); };
  assert.equal(sandbox.doPost({ postData: { contents: JSON.stringify(payload) } }).ok, false);
  assert.equal(held, false);
  assert.equal(sandbox.doPost({ postData: { contents: '{}' } }).ok, false);
});
