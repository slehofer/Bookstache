"""Camera regression using the real html5-qrcode decoder and Chromium media API.

Run Vite first, then: python scripts/test_camera.py [http://127.0.0.1:5175/Bookstache/]
Requires Python Playwright and Chromium (provided by the cloud environment).
No physical camera, external book APIs or mocked scanner implementation are used.
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CODES = ['9788020719805', '9788073816216', '9788074914101']
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5175/Bookstache/'


def write_video(path):
    # The scanner accepts both QR and linear barcodes containing an ISBN.
    source = """
import zxing from '@zxing/library';
const codes = %s;
console.log(JSON.stringify(codes.map(code => {
 const m = new zxing.QRCodeWriter().encode(code, zxing.BarcodeFormat.QR_CODE, 160, 160, new Map());
 return Array.from({length:160}, (_,y) => Array.from({length:160}, (_,x) => m.get(x,y)));
})));
""" % json.dumps(CODES)
    matrices = json.loads(subprocess.check_output(
        ['node', '--input-type=module', '-e', source], cwd=ROOT, text=True))
    blank = bytes([235]) * (640 * 480)
    chroma = bytes([128]) * (640 * 480 // 2)
    with path.open('wb') as video:
        video.write(b'YUV4MPEG2 W640 H480 F10:1 Ip A1:1 C420jpeg\n')
        for matrix in matrices:
            # Two seconds without a code, then six seconds holding the code.
            # Holding a code must not immediately reopen its modal after save.
            image = bytearray(blank)
            for y, row in enumerate(matrix):
                for x, black in enumerate(row):
                    image[(160 + y) * 640 + 240 + x] = 16 if black else 235
            for frame, count in [(blank, 20), (image, 60)]:
                for _ in range(count):
                    video.write(b'FRAME\n' + frame + chroma)


with tempfile.TemporaryDirectory(prefix='bookstache-camera-') as directory, sync_playwright() as p:
    video = Path(directory) / 'isbn.y4m'
    write_video(video)
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), args=[
        '--no-sandbox', '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream', f'--use-file-for-fake-video-capture={video}'
    ])
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""
localStorage.setItem('bookstache_auto_csv', 'false');
localStorage.setItem('bookstache_webhook_url', '');
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
    for index, code in enumerate(CODES):
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
    page.get_by_role('button', name='Veřejný katalog').click()
    page.wait_for_function("cameraTracks[1].readyState === 'ended'")
    assert not errors, errors
    print('PASS: tab switch and navigation release camera; no JavaScript page errors', flush=True)
    browser.close()
