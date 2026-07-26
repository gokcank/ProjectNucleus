import { Pause, Play, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { WidgetDefinition } from "../types";
import {
  createTimer,
  formatDuration,
  pauseTimer,
  PRESET_MINUTES,
  startTimer,
  tickTimer,
} from "./timer-logic";

const DEFAULT_MINUTES = 5;
const TICK_MS = 250;

const iconButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-[10px] bg-black/5 text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10";

function TimerContent() {
  const [minutes, setMinutes] = useState<number>(DEFAULT_MINUTES);
  const [state, setState] = useState(() => createTimer(DEFAULT_MINUTES));

  useEffect(() => {
    if (!state.running) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      setState((prev) => tickTimer(prev, delta));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [state.running]);

  const selectPreset = (nextMinutes: number) => {
    setMinutes(nextMinutes);
    setState(createTimer(nextMinutes));
  };

  const finished = state.remainingMs <= 0;

  return (
    <div className="mt-2">
      <p className="text-center text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {formatDuration(state.remainingMs)}
      </p>

      <div className="mt-3 flex justify-center gap-1.5">
        {PRESET_MINUTES.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => selectPreset(preset)}
            aria-pressed={minutes === preset}
            className={`rounded-[10px] px-2.5 py-1 text-xs font-medium ${
              minutes === preset
                ? "bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "bg-black/5 text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
            }`}
          >
            {preset}m
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setState((prev) => (state.running ? pauseTimer(prev) : startTimer(prev)))}
          disabled={finished}
          aria-label={state.running ? "Pause" : "Start"}
          className={`${iconButtonClass} disabled:opacity-40`}
        >
          {state.running ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          type="button"
          onClick={() => setState(createTimer(minutes))}
          aria-label="Reset"
          className={iconButtonClass}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

export const timerWidget: WidgetDefinition = {
  id: "timer",
  title: "Timer",
  icon: TimerIcon,
  defaultWide: false,
  component: TimerContent,
};
