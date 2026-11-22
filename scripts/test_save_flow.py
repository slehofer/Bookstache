"""Run against Vite: python scripts/test_save_flow.py [base URL].

Requires Python Playwright and Chromium, supplied by the cloud environment.
Checks both roles with the former auto-download preference still enabled.
"""
import json
import shutil
import sys
from playwright.sync_api import expect, sync_playwright

url = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5176/Bookstache/'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), args=[
        '--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'
    ])
    for role in ['librarian', 'reader']:
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        downloads, errors = [], []
        page.on('download', lambda d: downloads.append(d.suggested_filename))
        page.on('pageerror', lambda e: errors.append(str(e)))
        user = {'id': 'save-test-' + role, 'name': 'Testovací uživatel', 'role': role}
        page.add_init_script('localStorage.setItem("bookstache_user", ' + json.dumps(json.dumps(user)) + ');' + """
localStorage.setItem('bookstache_auto_csv', 'true');
localStorage.setItem('bookstache_webhook_url', '');
localStorage.setItem('bookstache_public_catalog', '[]');
window.cameraTracks = [];
const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
navigator.mediaDevices.getUserMedia = async (...args) => {
 const stream = await gum(...args);
 cameraTracks.push(stream.getVideoTracks()[0]);
 return stream;
};
""")
        page.goto(url, wait_until='domcontentloaded')
        page.wait_for_function("document.querySelector('video')?.readyState >= 2")
        save_name = 'Uložit do veřejné knihovny' if role == 'librarian' else 'Uložit do osobní sbírky'
        key = 'bookstache_public_catalog' if role == 'librarian' else 'bookstache_reader_collections'
        def saved_books():
            data = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', key)
            return data if role == 'librarian' else data[user['id']]

        # Save twice from manual ISBN, verifying reset and return to live camera.
        for isbn in ['9788020719805', '9788073816216']:
            page.get_by_role('button', name='Ruční zadání ISBN', exact=True).click()
            page.get_by_placeholder('např. 9788020719805').fill(isbn)
            page.get_by_role('button', name='Vyhledat knihu', exact=True).click()
            page.get_by_role('button', name=save_name, exact=True).click()
            expect(page.get_by_role('heading', name='Nalezená kniha', exact=True)).not_to_be_visible()
            page.wait_for_function("document.querySelector('video')?.readyState >= 2")
            expect(page.locator('#qr-reader-region')).to_be_visible()
            assert page.get_by_placeholder('např. 9788020719805').count() == 0
            assert any(book['isbn'] == isbn for book in saved_books())
        # Saving from the image tab also returns to live scanning.
        page.get_by_role('button', name='Nahrát fotku ze zařízení', exact=True).click()
        page.get_by_role('button', name='1984 (Orwell)').click()
        page.get_by_role('button', name=save_name, exact=True).click()
        page.wait_for_function("document.querySelector('video')?.readyState >= 2")
        expect(page.locator('#qr-reader-region')).to_be_visible()
        originals = saved_books()
        original = next(book for book in originals if book['isbn'] == '9788020719805')
        page.get_by_role('button', name='Ruční zadání ISBN', exact=True).click()
        page.get_by_placeholder('např. 9788020719805').fill('80-207-1980-6')
        lookup = page.get_by_role('button', name='Vyhledat knihu', exact=True)
        duplicate = page.get_by_role('dialog', name='Kniha už je uložená')
        lookup.click()
        destination = 've veřejném katalogu' if role == 'librarian' else 've vaší osobní sbírce'
        expect(duplicate.get_by_role('alert')).to_contain_text(destination)
        duplicate.get_by_role('button', name='Zrušit', exact=True).click()
        assert saved_books() == originals
        lookup.click()
        duplicate.get_by_role('button', name='Uložit další výtisk', exact=True).click()
        expect(duplicate).not_to_be_visible()
        page.wait_for_function("document.querySelector('video')?.readyState >= 2")
        copy, *existing = saved_books()
        assert copy['isbn'] == original['isbn'] and copy['duplicatedFrom'] == original['id']
        assert copy['id'] != original['id'] and existing == originals
        assert not downloads, downloads
        assert not errors, errors
        print(f'PASS: {role}: saves persist, no automatic downloads, immediate return to live scanner', flush=True)
        print(f'PASS: {role}: existing ISBN warns, cancel preserves original, explicit copy gets its own record', flush=True)
        if role == 'librarian':
            page.get_by_role('button', name='Veřejný katalog').click()
            with page.expect_download() as download:
                page.get_by_role('button', name='Export CSV', exact=True).click()
            assert download.value.suggested_filename.endswith('.csv')
            print('PASS: explicit catalog CSV export still works', flush=True)
        context.close()
    browser.close()
