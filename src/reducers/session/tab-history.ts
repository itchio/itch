import reducer from "../reducer";
import { ITabHistorySet } from "../../types/index";
import { actions } from "../../actions/index";
import { omit, last } from "underscore";

const initialState = {};

export default reducer<ITabHistorySet>(initialState, on => {
  on(actions.evolveTab, (state, action) => {
    const { tab, path, replace } = action.payload;
    let entry = state[tab];
    if (!entry) {
      entry = {
        paths: [path],
      };
    } else {
      const lastPath = last(entry.paths);

      if (replace) {
        console.log(`(${lastPath}) replace (${path})`);
        entry = {
          paths: [...entry.paths.slice(0, entry.paths.length - 1), path],
        };
      } else {
        console.log(`(${lastPath}) push (${path})`);
        entry = {
          paths: [...entry.paths, path],
        };
      }
    }

    // max history depth
    entry = {
      ...entry,
      paths: entry.paths.slice(0, 50),
    };

    return {
      ...state,
      [tab]: entry,
    };
  });

  on(actions.closeTab, (state, action) => {
    const { tab } = action.payload;
    return omit(state, tab);
  });
});
