export const DESCRIPTION_MAX_LENGTH = 350;

export function shortBookDescription(value) {
  if (Array.isArray(value)) value = value.find(item => shortBookDescription(item)) || '';
  if (value && typeof value === 'object') value = value.value;
  if (typeof value !== 'string') return '';
  let text = value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ');
  // Catalogs may return HTML. Render only plain text in the book detail.
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  text = text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
    if (entity[0] !== '#') return entities[entity.toLowerCase()] || match;
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  }).replace(/\s+/g, ' ').trim();
  if (/^(Záznam z veřejného katalogu Knihovny\.cz|Informace získány z databáze Open Library\.|Popis knihy z veřejné databáze Google Books\.)/.test(text)) return '';
  if (text.length <= DESCRIPTION_MAX_LENGTH) return text;
  const excerpt = text.slice(0, DESCRIPTION_MAX_LENGTH - 1);
  const space = excerpt.lastIndexOf(' ');
  return excerpt.slice(0, space > 0 ? space : excerpt.length).trimEnd() + '…';
}

const pendingDescriptions = new Map();

// Open Library stores plot summaries on editions or their associated works.
export function fetchBookDescription(isbn) {
  const code = String(isbn || '').replace(/[-\s]/g, '');
  if (!/^(\d{13}|\d{9}[\dXx])$/.test(code)) return Promise.resolve('');
  if (pendingDescriptions.has(code)) return pendingDescriptions.get(code);
  const read = async (path) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(`https://openlibrary.org${path}.json`, { signal: controller.signal });
      return response.ok ? await response.json() : null;
    } finally {
      clearTimeout(timer);
    }
  };
  const promise = (async () => {
    try {
      const edition = await read(`/isbn/${code}`);
      const description = shortBookDescription(edition?.description);
      if (description) return description;
      const work = edition?.works?.[0]?.key;
      if (!/^\/works\/OL\d+W$/.test(work || '')) return '';
      return shortBookDescription((await read(work))?.description);
    } catch {
      // Missing annotations must never prevent viewing or saving a book.
      return '';
    }
  })();
  pendingDescriptions.set(code, promise);
  promise.then(description => {
    if (!description) pendingDescriptions.delete(code);
  });
  return promise;
}
