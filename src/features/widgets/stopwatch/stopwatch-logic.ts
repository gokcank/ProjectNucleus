export interface StopwatchState {
  elapsedMs: number;
  running: boolean;
}

export const INITIAL_STOPWATCH: StopwatchState = { elapsedMs: 0, running: false };

export function startStopwatch(state: StopwatchState): StopwatchState {
  return { ...state, running: true };
}

export function pauseStopwatch(state: StopwatchState): StopwatchState {
  return { ...state, running: false };
}

export function resetStopwatch(): StopwatchState {
  return INITIAL_STOPWATCH;
}

export function tickStopwatch(state: StopwatchState, deltaMs: number): StopwatchState {
  if (!state.running) return state;
  return { ...state, elapsedMs: state.elapsedMs + deltaMs };
}

export function formatElapsed(ms: number): string {
  const totalCentiseconds = Math.floor(ms / 10);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}
