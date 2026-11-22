import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

export function isNumericIsbn(code) {
  if (typeof code !== 'string') return false;

  if (/^[0-9]{10}$/.test(code)) {
    const sum = [...code].reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
    return sum % 11 === 0;
  }

  // The 979-0 range is reserved for ISMNs.
  if (/^(?:978[0-9]|979[1-9])[0-9]{9}$/.test(code)) {
    const sum = [...code].reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
    return sum % 10 === 0;
  }

  return false;
}

// Helper to decode barcode from image file (uploaded from gallery / device)
export async function decodeBarcodeFromImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.QR_CODE
          ]);

          const zxingReader = new BrowserMultiFormatReader(hints);
          const result = await zxingReader.decodeFromImageElement(img);
          if (result) {
            resolve(result.getText());
          } else {
            reject(new Error('Kód nebyl v obrázku rozpoznán.'));
          }
        } catch (err) {
          reject(new Error('Na vybrané fotografii se nepodařilo nalézt čárový/ISBN kód. Prosím zkuste jiný snímek nebo zadejte kód ručně.'));
        }
      };
      img.onerror = () => reject(new Error('Nepatřičný formát obrázku.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsDataURL(file);
  });
}

// Clean ISBN string (remove hyphens, spaces)
export function sanitizeIsbn(isbnStr) {
  if (!isbnStr) return '';
  return String(isbnStr).replace(/[^0-9X]/gi, '');
}
