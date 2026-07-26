import { Pause, Play, RotateCcw, Watch } from "lucide-react";
import { useEffect, useState } from "react";
import type { WidgetDefinition } from "../types";
import {
  formatElapsed,
  INITIAL_STOPWATCH,
  pauseStopwatch,
  resetStopwatch,
  startStopwatch,
  tickStopwatch,
} from "./stopwatch-logic";

const TICK_MS = 100;

const iconButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-[10px] bg-black/5 text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10";

function StopwatchContent() {
  const [state, setState] = useState(INITIAL_STOPWATCH);

  useEffect(() => {
    if (!state.running) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      setState((prev) => tickStopwatch(prev, delta));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [state.running]);

  return (
    <div className="mt-2">
      <p className="text-center text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {formatElapsed(state.elapsedMs)}
      </p>

      <div className="mt-3 flex justify-center gap-2">
        <button
          type="button"
          onClick={() =>
            setState((prev) => (state.running ? pauseStopwatch(prev) : startStopwatch(prev)))
          }
          aria-label={state.running ? "Pause" : "Start"}
          className={iconButtonClass}
        >
          {state.running ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          type="button"
          onClick={() => setState(resetStopwatch())}
          aria-label="Reset"
          className={iconButtonClass}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

export const stopwatchWidget: WidgetDefinition = {
  id: "stopwatch",
  title: "Stopwatch",
  icon: Watch,
  defaultWide: false,
  component: StopwatchContent,
};
