"""Build first, then run: python scripts/test_book_duplicates.py.
Verifies independent catalog/personal copies and persistence with controlled local data.
"""
import json
import mimetypes
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1] / 'dist'
original = {
    'id': 'original', 'isbn': '9788073816216', 'title': 'Testovací kniha',
    'author': 'Testovací autor', 'publisher': 'Nakladatel', 'year': '2020',
    'description': 'Popis knihy.', 'genre': 'Román', 'language': 'Čeština',
    'pages': 120, 'targetAgeGroup': 'Dospělí', 'coverUrl': '',
    'isAvailable': False, 'borrowedBy': 'Původní čtenář', 'dueDate': '2026-12-01'
}
without_isbn = {**original, 'id': 'without-isbn', 'isbn': '', 'title': 'Kniha bez ISBN', 'isAvailable': True, 'borrowedBy': None, 'dueDate': None}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    for role in ['librarian', 'reader']:
        context = browser.new_context(viewport={'width': 1440, 'height': 1000})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        user = {'id': 'copy-user', 'name': 'Test', 'role': role}
        seed = {
            'bookstache_user': user,
            'bookstache_public_catalog': [original, without_isbn],
            'bookstache_reader_collections': {'copy-user': [original, without_isbn], 'other-user': [original]},
            'bookstache_loans': []
        }
        page.add_init_script('''if (!localStorage.getItem('duplicate-test-seeded')) {
            for (const [key, value] of Object.entries(''' + json.dumps(seed) + ''')) localStorage.setItem(key, JSON.stringify(value));
            localStorage.setItem('bookstache_webhook_url', '');
            localStorage.setItem('duplicate-test-seeded', 'true');
        }''')
        def serve(route):
            path = route.request.url.split('/Bookstache/', 1)[-1].split('?', 1)[0]
            file = root / (path or 'index.html')
            if file.is_file():
                route.fulfill(body=file.read_bytes(), content_type=mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
            else:
                route.fulfill(status=404, body='')
        context.route('**/*', lambda route: route.abort())
        context.route('http://bookstache.test/Bookstache/**', serve)
        view = 'catalog' if role == 'librarian' else 'my-collection'
        page.goto('http://bookstache.test/Bookstache/#' + view)
        for title in [original['title'], original['title'], without_isbn['title']]:
            page.get_by_role('button', name='Duplikovat knihu: ' + title, exact=True).first.click()
        expect(page.locator('tbody tr')).to_have_count(5)
        def saved_books():
            key = 'bookstache_public_catalog' if role == 'librarian' else 'bookstache_reader_collections'
            data = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', key)
            return data if role == 'librarian' else data['copy-user']
        books = saved_books()
        assert len({book['id'] for book in books}) == 5
        assert next(book for book in books if book['id'] == 'original') == original
        copies = [book for book in books if book.get('duplicatedFrom') == 'original']
        assert len(copies) == 2
        for copy in copies:
            assert copy['isAvailable'] and copy['borrowedBy'] is None and copy['dueDate'] is None
            for key in ['title', 'author', 'isbn', 'description', 'publisher', 'year', 'pages', 'genre']:
                assert copy[key] == original[key]
        other = page.evaluate('JSON.parse(localStorage.getItem("bookstache_reader_collections"))["other-user"]')
        assert other == [original]
        assert page.evaluate('JSON.parse(localStorage.getItem("bookstache_loans"))') == []
        if role == 'librarian':
            row = page.locator('tbody tr').filter(has_text='Další exemplář').filter(has_text=original['title']).first
            row.get_by_role('button', name='Vytvořit výpůjčku', exact=True).click()
            page.get_by_placeholder('např. Jan Novák').fill('Nový čtenář')
            page.get_by_role('button', name='Potvrdit výpůjčku', exact=True).click()
            loans = page.evaluate('JSON.parse(localStorage.getItem("bookstache_loans"))')
            assert len(loans) == 1 and loans[0]['bookId'] in [copy['id'] for copy in copies]
            assert next(book for book in saved_books() if book['id'] == 'original') == original
        # Deleting a copy without ISBN leaves the original in place.
        row = page.locator('tbody tr').filter(has_text='Další exemplář').filter(has_text=without_isbn['title'])
        if role == 'librarian':
            page.once('dialog', lambda dialog: dialog.accept())
            row.get_by_role('button', name='Smazat knihu', exact=True).click()
        else:
            row.get_by_role('button', name='Odebrat', exact=True).click()
        expect(page.locator('tbody tr')).to_have_count(4)
        page.reload()
        expect(page.locator('tbody tr')).to_have_count(4)
        assert any(book['id'] == 'without-isbn' for book in saved_books())
        # Duplication is also available on a narrow screen.
        page.set_viewport_size({'width': 390, 'height': 844})
        expect(page.get_by_role('button', name='Duplikovat knihu: ' + without_isbn['title'], exact=True)).to_be_visible()
        if role == 'reader':
            page.evaluate("window.location.hash = 'catalog'")
            expect(page.get_by_role('heading', name='Kompletní katalog knihovny')).to_be_visible()
            expect(page.get_by_role('button', name='Duplikovat knihu:', exact=False)).to_have_count(0)
        assert not errors, errors
        print(f'PASS: {role}: unique copies with same ISBN, independent loan state, deletion, persistence, mobile action, role access')
        context.close()
    browser.close()
