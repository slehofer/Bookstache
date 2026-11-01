import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shortBookDescription, fetchBookDescription } from './bookDescription.js';
import { parseKnihovnyRecord } from './bookService.js';

test('short annotations use plain text and retain complete words', () => {
  assert.equal(shortBookDescription('<p>Příběh <b>přátelství</b> &amp; odvahy.</p><script>evil()</script>'), 'Příběh přátelství & odvahy.');
  assert.equal(shortBookDescription({ value: '  Kniha\n o světě.  ' }), 'Kniha o světě.');
  assert.equal(shortBookDescription(['', 'Příběh o vesmíru.']), 'Příběh o vesmíru.');
  const long = shortBookDescription('Příběh přátelství a dobrodružství. '.repeat(30));
  assert.ok(long.length <= 350);
  assert.ok(long.endsWith('…'));
  assert.equal(shortBookDescription('Informace získány z databáze Open Library.'), '');
  assert.equal(shortBookDescription('Záznam z veřejného katalogu Knihovny.cz (ID: test).'), '');
  assert.equal(shortBookDescription(undefined), '');
});

test('Knihovny annotations contain actual summary text, never a source placeholder', () => {
  assert.equal(parseKnihovnyRecord({ summary: ['Příběh rodiny na venkově.'] }, '9780000000000').description, 'Příběh rodiny na venkově.');
  assert.equal(parseKnihovnyRecord({}, '9780000000000').description, '');
});

test('missing descriptions are fetched from the edition or its work and deduplicated', async (t) => {
  const paths = [];
  t.mock.method(globalThis, 'fetch', async url => {
    paths.push(url);
    return new Response(JSON.stringify(url.includes('/isbn/')
      ? { works: [{ key: '/works/OL123W' }] }
      : { description: { value: 'Cesta za dobrodružstvím.' } }));
  });
  const results = await Promise.all([fetchBookDescription('9780000000001'), fetchBookDescription('9780000000001')]);
  assert.deepEqual(results, ['Cesta za dobrodružstvím.', 'Cesta za dobrodružstvím.']);
  assert.deepEqual(paths, ['https://openlibrary.org/isbn/9780000000001.json', 'https://openlibrary.org/works/OL123W.json']);
  assert.equal(await fetchBookDescription('9780000000001'), results[0]);
  assert.equal(paths.length, 2);
});

test('unavailable summaries stay empty without breaking book details', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  assert.equal(await fetchBookDescription('9780000000002'), '');
  assert.equal(await fetchBookDescription('not-an-isbn'), '');
});
