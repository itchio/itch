import { actions } from "common/actions";
import reducer from "./reducer";

import { ISystemState } from "common/types";

const initialState = {} as ISystemState;

export default reducer<ISystemState>(initialState, on => {
  on(actions.systemAssessed, (state, action) => {
    const { system } = action.payload;
    return {
      ...state,
      ...system,
    };
  });

  on(actions.proxySettingsDetected, (state, action) => {
    const { proxy, source } = action.payload;
    return {
      ...state,
      proxy,
      proxySource: source,
    };
  });
});
