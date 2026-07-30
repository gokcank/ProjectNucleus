import { Hourglass, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import type { WidgetDefinition } from "../types";
import {
  advancePhase,
  BLOCKS_BEFORE_LONG_BREAK,
  createPomodoro,
  formatRemaining,
  pausePomodoro,
  PHASE_LABELS,
  resetPhase,
  startPomodoro,
  tickPomodoro,
} from "./pomodoro-logic";

const TICK_MS = 250;

const iconButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-[10px] bg-black/5 text-neutral-900 hover:bg-black/10 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10 dark:focus:ring-neutral-600";

function PomodoroContent() {
  const [state, setState] = useState(createPomodoro);

  // Ticks off real elapsed time rather than assuming a fixed step, so a
  // throttled interval can't make a 25 minute block run long.
  useEffect(() => {
    if (!state.running) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      setState((prev) => tickPomodoro(prev, delta));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [state.running]);

  return (
    <div className="mt-2">
      <p className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {PHASE_LABELS[state.phase]}
      </p>
      <p className="text-center text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {formatRemaining(state.remainingMs)}
      </p>

      <div
        role="img"
        aria-label={`${state.completedWorkBlocks} of ${BLOCKS_BEFORE_LONG_BREAK} focus blocks done`}
        className="mt-3 flex justify-center gap-1.5"
      >
        {Array.from({ length: BLOCKS_BEFORE_LONG_BREAK }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 w-1.5 rounded-full ${
              index < state.completedWorkBlocks
                ? "bg-neutral-900 dark:bg-neutral-100"
                : "bg-black/15 dark:bg-white/15"
            }`}
          />
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <button
          type="button"
          onClick={() =>
            setState((prev) => (prev.running ? pausePomodoro(prev) : startPomodoro(prev)))
          }
          aria-label={state.running ? "Pause" : "Start"}
          className={iconButtonClass}
        >
          {state.running ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          type="button"
          onClick={() => setState(advancePhase)}
          aria-label="Skip to next block"
          className={iconButtonClass}
        >
          <SkipForward size={16} />
        </button>
        <button
          type="button"
          onClick={() => setState(resetPhase)}
          aria-label="Restart this block"
          className={iconButtonClass}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

export const pomodoroWidget: WidgetDefinition = {
  id: "pomodoro",
  title: "Pomodoro",
  keywords: ["focus"],
  icon: Hourglass,
  defaultWide: false,
  component: PomodoroContent,
};
