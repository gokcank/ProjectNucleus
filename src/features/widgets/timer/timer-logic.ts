export interface TimerState {
  remainingMs: number;
  running: boolean;
}

export const PRESET_MINUTES = [5, 10, 25] as const;

export function createTimer(minutes: number): TimerState {
  return { remainingMs: minutes * 60_000, running: false };
}

export function startTimer(state: TimerState): TimerState {
  if (state.remainingMs <= 0) return state;
  return { ...state, running: true };
}

export function pauseTimer(state: TimerState): TimerState {
  return { ...state, running: false };
}

export function tickTimer(state: TimerState, deltaMs: number): TimerState {
  if (!state.running) return state;
  const remainingMs = Math.max(0, state.remainingMs - deltaMs);
  return { remainingMs, running: remainingMs > 0 };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
