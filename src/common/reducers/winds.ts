import { WindsState, Action } from "common/types";
import windReducer from "common/reducers/wind";
import { actions, typeOf } from "common/actions";

const initialState: WindsState = {};

const windOpenedType = typeOf(actions.windOpened);
const windClosedType = typeOf(actions.windClosed);

export default function (
  state: WindsState | undefined,
  action: Action<any>
): WindsState {
  if (typeof state === "undefined") {
    return initialState;
  }

  if (action) {
    if (action.type === windOpenedType) {
      const { wind } = action.payload as (typeof actions.windOpened)["payload"];

      // dummy action: lets each sub-reducer return its initial state
      let windState = windReducer(undefined, { type: "" });
      windState = windReducer(windState, action);

      return {
        ...state,
        [wind]: windState,
      };
    }

    if (action.type === windClosedType) {
      const { wind } = action.payload as (typeof actions.windClosed)["payload"];
      const newState = { ...state };
      delete newState[wind];
      return newState;
    }

    if (action.payload && action.payload.wind) {
      const { wind } = action.payload;
      if (typeof state[wind] !== "undefined") {
        return {
          ...state,
          [wind]: windReducer(state[wind], action),
        };
      }
    }

    let newState: WindsState = {};
    let changed = false;
    for (const k of Object.keys(state)) {
      newState[k] = windReducer(state[k], action);
      if (state[k] !== newState[k]) {
        changed = true;
      }
    }
    if (changed) {
      return newState;
    }
  }

  return state;
}
