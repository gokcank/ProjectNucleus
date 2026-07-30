import { QrCode } from "lucide-react";
import { useMemo, useState } from "react";
import type { WidgetDefinition } from "../types";
import { encodeQr } from "./qr-logic";

/** Modules of blank margin around the code, as the QR spec requires. */
const QUIET_ZONE = 4;

function QrCodeContent() {
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const qr = useMemo(() => encodeQr(trimmed), [trimmed]);

  return (
    <div className="mt-2">
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label="Text to encode"
        placeholder="Text or link…"
        className="w-full rounded-[10px] border border-black/10 bg-black/5 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
      />

      {trimmed === "" && (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Type something to turn it into a QR code.
        </p>
      )}

      {trimmed !== "" && qr === null && (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Too long to fit in a QR code.
        </p>
      )}

      {qr && (
        <div className="mt-2 flex justify-center">
          {/* Always dark-on-white, whatever the app theme: inverting a QR
              code stops some readers from seeing it at all. crispEdges keeps
              module boundaries hard, which is what a scanner needs. */}
          <svg
            viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${qr.moduleCount + QUIET_ZONE * 2} ${qr.moduleCount + QUIET_ZONE * 2}`}
            shapeRendering="crispEdges"
            role="img"
            aria-label={`QR code for ${trimmed}`}
            className="h-auto w-full max-w-44 rounded-[10px] bg-white"
          >
            <path d={qr.path} fill="#000000" />
          </svg>
        </div>
      )}
    </div>
  );
}

export const qrCodeWidget: WidgetDefinition = {
  id: "qrCode",
  title: "QR Code",
  keywords: ["qr", "barcode"],
  icon: QrCode,
  component: QrCodeContent,
};
