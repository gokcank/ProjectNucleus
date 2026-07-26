export interface ClipboardHistoryState {
  entries: string[];
}

export const INITIAL_HISTORY: ClipboardHistoryState = { entries: [] };

const MAX_ENTRIES = 10;

/** Adds `text` to the front of the history, skipping empty and duplicate-of-latest values. */
export function addEntry(state: ClipboardHistoryState, text: string): ClipboardHistoryState {
  if (text.trim() === "") return state;
  if (state.entries[0] === text) return state;
  return { entries: [text, ...state.entries].slice(0, MAX_ENTRIES) };
}

export function clearHistory(): ClipboardHistoryState {
  return INITIAL_HISTORY;
}
