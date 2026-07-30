export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

export interface PomodoroState {
  phase: PomodoroPhase;
  remainingMs: number;
  running: boolean;
  /**
   * Work blocks finished in the current cycle. Counts up to
   * `BLOCKS_BEFORE_LONG_BREAK`, then starts over once the long break is done.
   */
  completedWorkBlocks: number;
}

export const PHASE_MINUTES: Record<PomodoroPhase, number> = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
};

export const PHASE_LABELS: Record<PomodoroPhase, string> = {
  work: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};

export const BLOCKS_BEFORE_LONG_BREAK = 4;

function phaseDurationMs(phase: PomodoroPhase): number {
  return PHASE_MINUTES[phase] * 60_000;
}

export function createPomodoro(): PomodoroState {
  return {
    phase: "work",
    remainingMs: phaseDurationMs("work"),
    running: false,
    completedWorkBlocks: 0,
  };
}

export function startPomodoro(state: PomodoroState): PomodoroState {
  return { ...state, running: true };
}

export function pausePomodoro(state: PomodoroState): PomodoroState {
  return { ...state, running: false };
}

/** Restarts the current phase's clock, leaving cycle progress alone. */
export function resetPhase(state: PomodoroState): PomodoroState {
  return { ...state, remainingMs: phaseDurationMs(state.phase), running: false };
}

/**
 * Moves to the next phase, paused rather than running. Deliberately not
 * auto-starting: the panel hides itself whenever it loses focus, so a break
 * that started on its own would just drain unseen.
 *
 * Skipping by hand and running out of time take this same path, so a skipped
 * block still counts towards the cycle — "skip" means move on, not undo.
 */
export function advancePhase(state: PomodoroState): PomodoroState {
  if (state.phase === "work") {
    const completedWorkBlocks = state.completedWorkBlocks + 1;
    const phase: PomodoroPhase =
      completedWorkBlocks >= BLOCKS_BEFORE_LONG_BREAK ? "longBreak" : "shortBreak";
    return {
      phase,
      remainingMs: phaseDurationMs(phase),
      running: false,
      completedWorkBlocks,
    };
  }

  return {
    phase: "work",
    remainingMs: phaseDurationMs("work"),
    running: false,
    // The long break closes the cycle, so progress starts over after it.
    completedWorkBlocks: state.phase === "longBreak" ? 0 : state.completedWorkBlocks,
  };
}

export function tickPomodoro(state: PomodoroState, deltaMs: number): PomodoroState {
  if (!state.running) return state;
  const remainingMs = state.remainingMs - deltaMs;
  if (remainingMs > 0) return { ...state, remainingMs };
  // Any overshoot is dropped rather than carried into the next phase -- after
  // a suspend or a long stretch with the panel hidden, advancing a single
  // phase is the honest outcome; racing through several is not.
  return advancePhase(state);
}

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
