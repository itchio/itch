
import {ITabDataSet} from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

const debug = require("debug")(`itch:tab-data-reducer`);

const initialState = {} as ITabDataSet;

let r = reducer<ITabDataSet>(initialState, (on) => {
  on(actions.tabDataFetched, (state, action) => {
    const {id, timestamp, data} = action.payload;
    const oldData = state[id];
    if (oldData && oldData.timestamp && oldData.timestamp > timestamp) {
      // ignore stale data
      debug(`Ignoring stale data for ${id}`);
      return state;
    }

    return {
      ...state,
      [id]: {
        timestamp,
        ...data,
      },
    };
  });
});

if (process.type === "browser") {
  // give a no-op to the browser
  r = (state, action) => ({});
}

export default r;
