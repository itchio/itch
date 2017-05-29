
import {ITabDataSet} from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

const initialState = {} as ITabDataSet;

export default reducer<ITabDataSet>(initialState, (on) => {
  on(actions.tabDataFetched, (state, action) => {
    const {id, data} = action.payload;

    return {
      ...state,
      [id]: {
        ...data,
      },
    };
  });
});
