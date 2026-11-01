export function validateExternalEndpoint(value) {
  if (!value?.trim()) return '';
  let url;
  try { url = new URL(value.trim()); } catch {
    return 'Zadejte platnou HTTPS adresu webové aplikace nebo webhooku.';
  }
  if (url.hostname === 'docs.google.com' || url.hostname === 'sheets.google.com') {
    return 'Odkaz na Google tabulku nestačí. Propojte ji pomocí Apps Scriptu podle návodu níže a vložte adresu nasazení končící /exec.';
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    return 'Použijte HTTPS adresu bez přihlašovacích údajů v odkazu.';
  }
  if (url.hostname === 'script.google.com' && !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)) {
    return 'Vložte adresu nasazené webové aplikace Apps Script ve tvaru https://script.google.com/macros/s/…/exec.';
  }
  return '';
}

// Send saved book to an external Webhook or online Google Sheets script endpoint
export async function sendBookToExternalEndpoint(endpointUrl, book, role) {
  const validationError = validateExternalEndpoint(endpointUrl);
  if (validationError) return { ok: false, message: validationError };
  if (!endpointUrl?.trim() || !book) return { ok: false, message: 'Chybí adresa nebo kniha k odeslání.' };
  const isGoogleScript = new URL(endpointUrl.trim()).hostname === 'script.google.com';

  const payload = {
    event: 'book_added',
    timestamp: new Date().toISOString(),
    userRole: role || 'unknown',
    book: {
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      year: book.year,
      targetAgeGroup: book.targetAgeGroup,
      language: book.language,
      genre: book.genre,
      pages: book.pages,
      addedBy: book.addedBy || role
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpointUrl.trim(), {
      method: 'POST',
      // Apps Script does not handle the JSON CORS preflight. A simple text
      // request still carries JSON, parsed by doPost via e.postData.contents.
      headers: { 'Content-Type': isGoogleScript ? 'text/plain;charset=UTF-8' : 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) return { ok: false, message: `Externí služba odmítla zápis (HTTP ${response.status}). Zkontrolujte adresu a oprávnění.` };
    if (isGoogleScript) {
      const result = await response.json();
      if (result.ok !== true) return { ok: false, message: 'Google tabulka nepotvrdila zápis. Zkontrolujte nastavení Apps Scriptu a jeho protokol spuštění.' };
    }
    return { ok: true, message: 'Externí služba potvrdila přijetí knihy.' };
  } catch (err) {
    return {
      ok: false,
      message: err.name === 'AbortError'
        ? 'Vypršel čas pro potvrzení zápisu. Ověřte tabulku před dalším odesláním.'
        : 'Zápis do externí tabulky se nepodařilo potvrdit. Zkontrolujte připojení, oprávnění webové aplikace a povolení požadavků z prohlížeče (CORS).'
    };
  } finally {
    clearTimeout(timeout);
  }
}
