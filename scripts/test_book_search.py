"""Browser integration checks against the production build, with controlled API responses.
Run npm run build, then python scripts/test_book_search.py.
"""
import json
import mimetypes
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1] / 'dist'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    for role in ['reader', 'librarian']:
        context = browser.new_context()
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        user = {'id': 'search-test', 'name': 'Test', 'role': role}
        page.add_init_script('localStorage.setItem("bookstache_user", ' + json.dumps(json.dumps(user)) + ')')
        def serve(route):
            path = route.request.url.split('/Bookstache/', 1)[-1].split('?', 1)[0]
            file = root / (path or 'index.html')
            if file.is_file():
                route.fulfill(body=file.read_bytes(), content_type=mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
            else:
                route.fulfill(status=404, body='')
        context.route('http://bookstache.test/Bookstache/**', serve)
        requests = []
        def api(route):
            requests.append(route.request.url)
            route.fulfill(json={'items': [
                {'id': 'no-isbn-1', 'volumeInfo': {'title': 'Nová kniha', 'authors': ['Test Autor']}},
                {'id': 'no-isbn-2', 'volumeInfo': {'title': 'Druhá kniha', 'authors': ['Test Autor']}}
            ]})
        context.route('https://www.googleapis.com/books/v1/volumes?**', api)
        page.goto('http://bookstache.test/Bookstache/#search')
        expect(page.get_by_role('heading', name='Najděte další příběh')).to_be_visible()
        # Both desktop and mobile navigation provide an entry to search.
        for width in [1440, 390]:
            page.set_viewport_size({'width': width, 'height': 900})
            page.get_by_role('button', name='Skener & Vložení' if width == 1440 else 'Skener', exact=True).click()
            page.get_by_role('button', name='Hledat knihy', exact=True).click()
            expect(page.get_by_role('heading', name='Najděte další příběh')).to_be_visible()
            assert page.url.endswith('#search')
        page.reload()
        expect(page.get_by_role('heading', name='Najděte další příběh')).to_be_visible()
        page.get_by_role('combobox').select_option('author')
        page.get_by_role('textbox', name='Název nebo autor', exact=True).fill('Test Autor')
        page.locator('form').get_by_role('button', name='Hledat knihy', exact=True).click()
        expect(page.get_by_role('status')).to_contain_text('Nalezeno knih: 2')
        assert 'inauthor' in requests[-1]
        add_label = 'Přidat do katalogu' if role == 'librarian' else 'Přidat do sbírky'
        page.get_by_role('button', name=add_label, exact=True).first.click()
        page.get_by_role('button', name=add_label, exact=True).click()
        expect(page.get_by_role('button', name='Již uloženo', exact=True)).to_have_count(2)
        key = 'bookstache_public_catalog' if role == 'librarian' else 'bookstache_reader_collections'
        data = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', key)
        books = data if role == 'librarian' else data[user['id']]
        assert all(any(book['title'] == title for book in books) for title in ['Nová kniha', 'Druhá kniha'])
        # API failure preserves accent-insensitive local title search.
        context.unroute('https://www.googleapis.com/books/v1/volumes?**', api)
        context.route('https://www.googleapis.com/books/v1/volumes?**', lambda route: route.fulfill(status=503, body=''))
        page.get_by_role('combobox').select_option('title')
        page.get_by_role('textbox', name='Název nebo autor', exact=True).fill('maly princ')
        page.locator('form').get_by_role('button', name='Hledat knihy', exact=True).click()
        expect(page.get_by_role('button', name='Malý princ', exact=True)).to_be_visible()
        expect(page.get_by_role('alert')).to_contain_text('Online vyhledávání není dostupné')
        assert not errors, errors
        print(f'PASS: {role}: author search, two books without ISBN, duplicate prevention, persistence, local fallback')
        context.close()
    browser.close()
