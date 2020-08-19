import { WindsState, Action } from "common/types";
import windReducer from "common/reducers/wind";
import { actions } from "common/actions";
import { omit } from "underscore";

const initialState: WindsState = {};

const windOpenedType = actions.windOpened({} as any).type;
const windClosedType = actions.windClosed({} as any).type;

export default function (state: WindsState, action: Action<any>) {
  if (typeof state === "undefined") {
    return initialState;
  }

  if (action) {
    if (action.type === windOpenedType) {
      const { wind } = action.payload as typeof actions.windOpened["payload"];

      let windState = windReducer(undefined, null);
      windState = windReducer(windState, action);

      return {
        ...state,
        [wind]: windState,
      };
    }

    if (action.type === windClosedType) {
      const { wind } = action.payload as typeof actions.windClosed["payload"];
      return omit(state, wind);
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
