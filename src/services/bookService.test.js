import {
  convertToIsbn13,
  cleanPunctuation,
  cleanAuthorName,
  extractYear,
  extractPageCount,
  parseKnihovnyRecord
} from './bookService.js';

function runTests() {
  console.log('Running Knihovny.cz helper tests...');

  // 1. ISBN-10 to ISBN-13 conversion test
  const converted = convertToIsbn13('80-257-0367-7');
  console.assert(converted === '9788025703670', `Expected 9788025703670, got ${converted}`);

  // 2. Clean punctuation test
  const pub = cleanPunctuation('Argo,');
  console.assert(pub === 'Argo', `Expected Argo, got ${pub}`);

  const place = cleanPunctuation('Praha :');
  console.assert(place === 'Praha', `Expected Praha, got ${place}`);

  // 3. Clean author name
  const author = cleanAuthorName('Jean de Nostredame, asi 1507-1577');
  console.assert(author === 'Jean de Nostredame', `Expected Jean de Nostredame, got ${author}`);

  // 4. Extract year
  const year = extractYear('c2011');
  console.assert(year === '2011', `Expected 2011, got ${year}`);

  // 5. Extract pages
  const pages = extractPageCount('218 s. : il. ; 22 cm');
  console.assert(pages === 218, `Expected 218, got ${pages}`);

  // 6. Test parsing sample Knihovny.cz response
  const sampleResponse = {
    "id": "mkp.3521868",
    "title": "Životy slavných a starých provensálských básníků, kteří žili v dobách hrabat z kraje Provença",
    "authors": {
      "primary": { "Jean de Nostredame, asi 1507-1577": [] },
      "secondary": { "Josef Prokop, 1971-": [], "Vojtěch Domlátil, 1979-": [] },
      "corporate": []
    },
    "publishers": ["Argo,"],
    "placesOfPublication": ["Praha :"],
    "publicationDates": ["2011"],
    "physicalDescriptions": ["218 s. : il. ; 22 cm"],
    "isbns": ["978-80-257-0367-0"],
    "issns": [],
    "cnb": "cnb002163342",
    "formats": ["0/BOOKS/"]
  };

  const parsed = parseKnihovnyRecord(sampleResponse, '9788025703670');
  console.assert(parsed.title === 'Životy slavných a starých provensálských básníků, kteří žili v dobách hrabat z kraje Provença', 'Title mismatch');
  console.assert(parsed.author === 'Jean de Nostredame', `Author mismatch: got ${parsed.author}`);
  console.assert(parsed.publisher === 'Argo', `Publisher mismatch: got ${parsed.publisher}`);
  console.assert(parsed.year === '2011', `Year mismatch: got ${parsed.year}`);
  console.assert(parsed.pages === 218, `Pages mismatch: got ${parsed.pages}`);
  console.assert(parsed.isbn === '9788025703670', `ISBN mismatch: got ${parsed.isbn}`);

  console.log('All Knihovny.cz API helper tests passed successfully!');
}

runTests();
