import qrcode from "qrcode-generator";

// The library's default encoder truncates every character to one byte
// (`charCodeAt(i) & 0xff`), which mangles anything outside Latin-1 -- Turkish
// letters included. It ships a UTF-8 encoder of its own, but not on a path
// the package exports; the platform's own encoder does the same job and is
// one line.
qrcode.stringToBytes = (text: string) => Array.from(new TextEncoder().encode(text));

/**
 * Recovery level. "M" is the usual default: it survives a scuffed print or a
 * partly covered screen without inflating the grid the way higher levels do.
 */
const ERROR_CORRECTION = "M";
/** 0 asks the encoder to pick the smallest grid the data fits in. */
const AUTO_SIZE = 0;

export interface QrCode {
  /** Grid width in modules, excluding the quiet zone. */
  moduleCount: number;
  /** One SVG path covering every dark module, in module coordinates. */
  path: string;
}

/**
 * Encodes `text`, or returns null if it cannot be encoded -- which in practice
 * means it is longer than any QR version can hold. The library signals that by
 * throwing, so the caller gets a plain "no" instead of an exception to handle.
 */
export function encodeQr(text: string): QrCode | null {
  if (text === "") return null;

  try {
    const qr = qrcode(AUTO_SIZE, ERROR_CORRECTION);
    qr.addData(text);
    qr.make();

    const moduleCount = qr.getModuleCount();
    // One path beats one rect per module: a mid-size code has several hundred
    // dark modules, and that many DOM nodes is a lot for a card that redraws
    // on every keystroke.
    let path = "";
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        if (qr.isDark(row, col)) path += `M${col},${row}h1v1h-1z`;
      }
    }

    return { moduleCount, path };
  } catch {
    return null;
  }
}
