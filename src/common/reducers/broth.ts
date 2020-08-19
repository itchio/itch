import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { BrothState } from "common/types";

const initialState = {
  packageNames: [],
  packages: {},
} as BrothState;

export default reducer<BrothState>(initialState, (on) => {
  on(actions.packagesListed, (state, action) => {
    let packages: BrothState["packages"] = {};
    const { packageNames } = action.payload;
    for (const packageName of packageNames) {
      packages[packageName] = {
        stage: "idle",
      };
    }
    return { packages, packageNames };
  });

  on(actions.packageGotVersionPrefix, (state, action) => {
    const { name, version, versionPrefix } = action.payload;

    let oldPackage = state.packages[name];
    if (oldPackage) {
      return {
        ...state,
        packages: {
          ...state.packages,
          [name]: {
            ...oldPackage,
            version,
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

  on(actions.packageNeedRestart, (state, action) => {
    const { name, availableVersion } = action.payload;

    let oldPackage = state.packages[name];
    if (oldPackage) {
      return {
        ...state,
        packages: {
          ...state.packages,
          [name]: {
            ...oldPackage,
            progressInfo: null,
            stage: "need-restart",
            availableVersion,
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
