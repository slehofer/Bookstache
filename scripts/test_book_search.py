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
        # All online providers are controlled; no test can silently use saved data or a live service.
        context.route('https://openlibrary.org/**', lambda route: route.fulfill(json={'docs': []}))
        context.route('https://www.knihovny.cz/api/v1/search?**', lambda route: route.fulfill(json={'records': []}))
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
        # A Google rate limit still returns entirely new books from independent catalogs.
        context.unroute('https://www.googleapis.com/books/v1/volumes?**', api)
        context.route('https://www.googleapis.com/books/v1/volumes?**', lambda route: route.fulfill(status=429, body=''))
        provider_requests = []
        def open_library(route):
            provider_requests.append(route.request.url)
            route.fulfill(json={'docs': [{'key': '/works/OL1W', 'title': 'Novinka z Open Library', 'author_name': ['Nový Autor']}]})
        def knihovny(route):
            provider_requests.append(route.request.url)
            route.fulfill(json={'records': [{'id': 'record-2', 'title': 'Novinka z české knihovny', 'authors': {'primary': {'Nový Autor': {}}}}]})
        context.route('https://openlibrary.org/**', open_library)
        context.route('https://www.knihovny.cz/api/v1/search?**', knihovny)
        page.get_by_role('textbox', name='Název nebo autor', exact=True).fill('Nový Autor')
        page.locator('form').get_by_role('button', name='Hledat knihy', exact=True).click()
        expect(page.get_by_role('status')).to_contain_text('Nalezeno knih: 2')
        assert any('author=' in url for url in provider_requests)
        assert any('type=Author' in url for url in provider_requests)
        for title in ['Novinka z Open Library', 'Novinka z české knihovny']:
            card = page.get_by_role('article').filter(has=page.get_by_role('button', name=title, exact=True))
            expect(card).to_be_visible()
            card.get_by_role('button', name=add_label, exact=True).click()
        # Failure of every provider is clearly labelled; manual entry remains available.
        context.route('https://openlibrary.org/**', lambda route: route.fulfill(status=503, body=''))
        context.route('https://www.knihovny.cz/api/v1/search?**', lambda route: route.fulfill(status=503, body=''))
        page.get_by_role('combobox').select_option('title')
        page.get_by_role('textbox', name='Název nebo autor', exact=True).fill('maly princ')
        page.locator('form').get_by_role('button', name='Hledat knihy', exact=True).click()
        expect(page.get_by_role('button', name='Malý princ', exact=True)).to_be_visible()
        expect(page.get_by_role('alert')).to_contain_text('Online katalogy se nepodařilo načíst')
        for title in ['Ručně vložená kniha', 'Další ručně vložená kniha']:
            page.get_by_role('button', name='Vložit novou knihu ručně', exact=True).click()
            form = page.get_by_role('form', name='Nová kniha')
            form.get_by_role('textbox', name='Název knihy').fill(title)
            form.get_by_role('textbox', name='Autor', exact=False).fill('Úplně nový autor')
            form.get_by_role('button', name='Uložit novou knihu', exact=False).click()
            expect(form).not_to_be_visible()
            expect(page.get_by_role('status')).to_contain_text(title)
        page.reload()
        data = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', key)
        books = data if role == 'librarian' else data[user['id']]
        assert all(any(book['title'] == title for book in books) for title in [
            'Novinka z Open Library', 'Novinka z české knihovny', 'Ručně vložená kniha', 'Další ručně vložená kniha'])
        assert not errors, errors
        print(f'PASS: {role}: new online books, Google 429 fallback, author queries, duplicate prevention, manual books without ISBN, persistence after reload')
        context.close()
    browser.close()
