/**
 * Undo/redo for the editor. Each commit is one step; typing inside a text
 * block isn't committed until the block is left, so a whole edit undoes at
 * once.
 */

export const HISTORY_LIMIT = 50;

export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

export type HistoryAction<T> =
  | { type: "commit"; next: T }
  | { type: "undo" }
  | { type: "redo" }
  /** Replaces everything without an undo step (loading a saved deck). */
  | { type: "reset"; present: T };

export function initHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

export function historyReducer<T>(state: History<T>, action: HistoryAction<T>): History<T> {
  switch (action.type) {
    case "commit":
      if (Object.is(action.next, state.present)) return state;
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: action.next,
        future: [],
      };
    case "undo": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present].slice(-HISTORY_LIMIT), present: next, future: rest };
    }
    case "reset":
      return initHistory(action.present);
  }
}
