import { CircleStop, FolderOpen, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../../services/logger-service";
import {
  getRecorderStatus,
  revealRecording,
  startRecording,
  stopRecording,
} from "../../../services/screen-recorder-service";
import type { WidgetDefinition } from "../types";

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function ScreenRecorderContent() {
  const [supported, setSupported] = useState<boolean | null>(null);
  // GNOME does not report whether a recording is running, so this card is the
  // only thing that knows -- it started it. Deliberately never overwritten by
  // a status read, and it survives the panel hiding because cards stay mounted.
  const [recording, setRecording] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [file, setFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRecorderStatus()
      .then((status) => {
        if (!cancelled) setSupported(status.supported);
      })
      .catch((err: unknown) => {
        logWarn(`Screen recorder unavailable: ${String(err)}`);
        if (!cancelled) setSupported(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Counts from the real start time rather than accumulating ticks, so the
  // duration stays honest while the panel is hidden and not being repainted.
  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const start = () => {
    setError(null);
    startRecording()
      .then((status) => {
        setRecording(true);
        setStartedAt(Date.now());
        setFile(status.lastFile);
      })
      .catch((err: unknown) => {
        logWarn(`Could not start recording: ${String(err)}`);
        setError("Could not start recording.");
      });
  };

  const stop = () => {
    stopRecording()
      .then(() => {
        setRecording(false);
        setStartedAt(null);
      })
      .catch((err: unknown) => {
        logWarn(`Could not stop recording: ${String(err)}`);
        setError("Could not stop recording.");
      });
  };

  const reveal = () => {
    if (!file) return;
    revealRecording(file).catch((err: unknown) => {
      logWarn(`Could not reveal recording: ${String(err)}`);
    });
  };

  if (supported === null) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Checking recorder...</p>
    );
  }

  if (!supported) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        This desktop has no screen recorder.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={recording ? stop : start}
        className={`flex h-10 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-medium ${
          recording
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-neutral-900 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        }`}
      >
        {recording ? <CircleStop size={16} /> : <Video size={16} />}
        {recording ? `Stop · ${formatElapsed(elapsed)}` : "Record screen"}
      </button>

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {!recording && file && (
        <button
          type="button"
          onClick={reveal}
          title={file}
          className="mt-2 flex w-full items-center gap-2 rounded-[10px] bg-black/5 px-2 py-1.5 text-left text-xs text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
        >
          <span className="min-w-0 flex-1 truncate">{file.split("/").pop()}</span>
          <FolderOpen size={14} className="shrink-0 text-neutral-500 dark:text-neutral-400" />
        </button>
      )}
    </div>
  );
}

export const screenRecorderWidget: WidgetDefinition = {
  id: "screenRecorder",
  title: "Screen Recorder",
  keywords: ["record", "video"],
  icon: Video,
  defaultWide: false,
  component: ScreenRecorderContent,
};
