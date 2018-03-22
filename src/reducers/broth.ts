import { actions } from "../actions";
import reducer from "./reducer";

import { IBrothState } from "../types";

const initialState = {
  packages: {},
} as IBrothState;

export default reducer<IBrothState>(initialState, on => {
  on(actions.packagesListed, (state, action) => {
    let packages: IBrothState["packages"] = {};
    const { packageNames } = action.payload;
    for (const packageName of packageNames) {
      packages[packageName] = {
        stage: "idle",
      };
    }
    return { packages };
  });

  on(actions.packageGotVersionPrefix, (state, action) => {
    const { name, versionPrefix } = action.payload;

    let oldPackage = state.packages[name];
    if (oldPackage) {
      return {
        ...state,
        packages: {
          ...state.packages,
          [name]: {
            ...oldPackage,
            versionPrefix,
          },
        },
      };
    }
    return state;
  });

  on(actions.packageStage, (state, action) => {
    const { name, stage } = action.payload;

    let oldPackage = state.packages[name];
    if (oldPackage) {
      return {
        ...state,
        packages: {
          ...state.packages,
          [name]: {
            ...oldPackage,
            progressInfo: null,
            stage,
          },
        },
      };
    }
    return state;
  });

  on(actions.packageProgress, (state, action) => {
    const { name, progressInfo } = action.payload;

    let oldPackage = state.packages[name];
    if (oldPackage) {
      return {
        ...state,
        packages: {
          ...state.packages,
          [name]: {
            ...oldPackage,
            progressInfo,
          },
        },
      };
    }
    return state;
  });
});
