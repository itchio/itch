
import {ISessionMarketState} from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

const initialState = {
  ready: false,
} as ISessionMarketState;

export default reducer<ISessionMarketState>(initialState, (on) => {
  on(actions.userDbReady, (state, action) => {
    return {...state, ready: true};
  });
});
