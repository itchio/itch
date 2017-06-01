
import {ITabParamsSet} from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

const initialState = {} as ITabParamsSet;

const emptyObj = {};

export default reducer<ITabParamsSet>(initialState, (on) => {
  on(actions.tabParamsChanged, (state, action) => {
    const {id, params} = action.payload;

    return {
      ...state,
      [id]: {
        ...(state[id] || emptyObj),
        ...params,
      },
    };
  });
});

