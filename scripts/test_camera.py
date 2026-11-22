"""Camera regression using the real ZXing decoder and Chromium media API.

Run Vite first, then: python scripts/test_camera.py [http://127.0.0.1:5175/Bookstache/]
Requires Python Playwright and Chromium (provided by the cloud environment).
No physical camera, external book APIs or mocked scanner implementation are used.
"""
import base64
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ISBN_QR_CODES = ['9788073816216', '8025703673']
EXPECTED_ISBNS = ['9788020719805', '9788073816216', '9788025703670']
QR_WITH_URL = 'https://book.test/9788073816216'
INVALID_ISBN = '9788020719806'
# EAN-13 modules for the first ISBN, including start, middle and end guards.
EAN13 = (
    '101' '0111011' '0001001' '0001001' '0001101' '0011011' '0001101'
    '01010' '1000100' '1100110' '1110100' '1001000' '1110010' '1001110' '101'
)
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5175/Bookstache/'


def qr_matrices(codes):
    source = """
import zxing from '@zxing/library';
const codes = %s;
console.log(JSON.stringify(codes.map(code => {
 const m = new zxing.QRCodeWriter().encode(code, zxing.BarcodeFormat.QR_CODE, 160, 160, new Map());
 return Array.from({length:160}, (_,y) => Array.from({length:160}, (_,x) => m.get(x,y)));
})));
""" % json.dumps(codes)
    return json.loads(subprocess.check_output(
        ['node', '--input-type=module', '-e', source], cwd=ROOT, text=True))


def write_video(path, qr_with_url, isbn_qrs):
    # Two camera pixels per module are lost when the decoder uses the mobile preview size.
    barcode = [int(module) for module in EAN13 for _ in range(2)]
    # The URL comes first so the test fails if it opens a book before the ISBN barcode.
    matrices = [qr_with_url, [barcode] * 120, *isbn_qrs]
    blank = bytes([235]) * (640 * 480)
    chroma = bytes([128]) * (640 * 480 // 2)
    with path.open('wb') as video:
        video.write(b'YUV4MPEG2 W640 H480 F10:1 Ip A1:1 C420jpeg\n')
        for matrix in matrices:
            # Two seconds without a code, then six seconds holding the code.
            # Holding a code must not immediately reopen its modal after save.
            image = bytearray(blank)
            top = (480 - len(matrix)) // 2
            left = (640 - len(matrix[0])) // 2
            for y, row in enumerate(matrix):
                for x, black in enumerate(row):
                    image[(top + y) * 640 + left + x] = 16 if black else 235
            for frame, count in [(blank, 20), (image, 60)]:
                for _ in range(count):
                    video.write(b'FRAME\n' + frame + chroma)


def upload_qr(page, matrix):
    image = page.evaluate("""matrix => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = matrix.length;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'black';
        matrix.forEach((row, y) => row.forEach((black, x) => {
            if (black) context.fillRect(x, y, 1, 1);
        }));
        return canvas.toDataURL('image/png').split(',')[1];
    }""", matrix)
    page.locator('#file-upload-input').set_input_files({
        'name': 'code.png', 'mimeType': 'image/png', 'buffer': base64.b64decode(image)
    })


with tempfile.TemporaryDirectory(prefix='bookstache-camera-') as directory, sync_playwright() as p:
    video = Path(directory) / 'isbn.y4m'
    qr_with_url, invalid_isbn_qr, *isbn_qrs = qr_matrices([QR_WITH_URL, INVALID_ISBN, *ISBN_QR_CODES])
    write_video(video, qr_with_url, isbn_qrs)
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), args=[
        '--no-sandbox', '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream', f'--use-file-for-fake-video-capture={video}'
    ])
    page = browser.new_page(viewport={'width': 320, 'height': 720})
    errors = []
    downloads = []
    page.on('download', lambda download: downloads.append(download.suggested_filename))
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""
localStorage.setItem('bookstache_auto_csv', 'true');
localStorage.setItem('bookstache_webhook_url', '');
localStorage.setItem('bookstache_public_catalog', '[]');
window.cameraStreams = [];
window.cameraTracks = [];
const getMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
navigator.mediaDevices.getUserMedia = async (...args) => {
 const stream = await getMedia(...args);
 cameraStreams.push(stream);
 cameraTracks.push(stream.getVideoTracks()[0]);
 return stream;
};
""")
    page.goto(URL, wait_until='domcontentloaded')
    modal = page.get_by_role('heading', name='Nalezená kniha', exact=True)
    save = page.get_by_role('button', name='Uložit do veřejné knihovny', exact=True)
    for index, code in enumerate(EXPECTED_ISBNS):
        save.wait_for(timeout=20000)
        expect(page.locator('.fixed').get_by_text(code, exact=True)).to_be_visible()
        assert page.evaluate('cameraStreams.length') == 1, 'Camera was reacquired after a scan'
        if index == 1:
            page.get_by_role('button', name='Zrušit', exact=True).click()
        else:
            save.click()
        modal.wait_for(state='hidden')
        page.wait_for_timeout(1500)
        assert not modal.is_visible(), 'Same ISBN immediately reopened the modal'
        assert page.evaluate('cameraStreams.length') == 1, 'Saving restarted the camera'
        assert page.evaluate("cameraTracks[0].readyState === 'live'")
        time_before = page.locator('video').evaluate('(v) => v.currentTime')
        page.wait_for_timeout(300)
        assert page.locator('video').evaluate('(v) => v.currentTime') > time_before, 'Video froze'
        print(f'PASS: decoded {code}, {"cancelled" if index == 1 else "saved"}, same live camera', flush=True)
    page.get_by_role('button', name='Ruční zadání ISBN', exact=True).click()
    page.wait_for_function("cameraTracks[0].readyState === 'ended'")
    page.get_by_role('button', name='Živá kamera', exact=True).click()
    page.wait_for_function('cameraStreams.length === 2')
    page.wait_for_function("document.querySelector('video')?.readyState >= 2")
    assert page.locator('video').count() == 1
    page.get_by_role('button', name='Katalog (').click()
    page.wait_for_function("cameraTracks[1].readyState === 'ended'")
    page.get_by_role('button', name='Skener', exact=True).click()
    page.get_by_role('button', name='Nahrát fotku ze zařízení', exact=True).click()
    upload_qr(page, invalid_isbn_qr)
    expect(page.get_by_text('Vyberte fotku s platným číselným ISBN o 10 nebo 13 číslicích.')).to_be_visible()
    expect(page.get_by_role('dialog')).not_to_be_visible()
    upload_qr(page, isbn_qrs[1])
    duplicate = page.get_by_role('dialog', name='Kniha už je uložená')
    expect(duplicate.get_by_role('alert')).to_contain_text('už je ve veřejném katalogu')
    duplicate.get_by_role('button', name='Zrušit', exact=True).click()
    expect(duplicate).not_to_be_visible()
    assert page.evaluate("JSON.parse(localStorage.getItem('bookstache_public_catalog')).length") == 2
    assert not downloads, downloads
    assert not errors, errors
    print('PASS: ignored URL QR; blocked invalid ISBN photo; warned before adding a duplicate photo', flush=True)
    print('PASS: tab switch and navigation release camera; no JavaScript page errors', flush=True)
    browser.close()
