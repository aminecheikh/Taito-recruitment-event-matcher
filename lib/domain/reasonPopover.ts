/**
 * Which "why this applicant matches" popover is open. Only one at a time. Hover opens it for a quick
 * look and leaving closes it; a click, tap, Enter or Space pins it open until clicked again, Esc or a
 * click outside. While one is pinned, hovering another does not steal it.
 */
export type PopoverState = { key: string | null; pinned: boolean };
export type PopoverAction =
  | { type: "hover"; key: string }
  | { type: "leave"; key: string }
  | { type: "toggle"; key: string }
  | { type: "close" };

export const CLOSED: PopoverState = { key: null, pinned: false };

export function popoverReducer(state: PopoverState, action: PopoverAction): PopoverState {
  switch (action.type) {
    case "hover":
      return state.pinned ? state : { key: action.key, pinned: false };
    case "leave":
      return !state.pinned && state.key === action.key ? CLOSED : state;
    case "toggle":
      return state.key === action.key && state.pinned ? CLOSED : { key: action.key, pinned: true };
    case "close":
      return CLOSED;
  }
}
