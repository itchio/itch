
import {ISessionCachedCollectionsState} from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

const initialState = {
  fetched: {},
} as ISessionCachedCollectionsState;

export default reducer<ISessionCachedCollectionsState>(initialState, (on) => {
  on(actions.collectionGamesFetched, (state, action) => {
    const {collectionId, fetchedAt} = action.payload;

    return {
      ...state,
      fetched: {
        ...state.fetched,
        [collectionId]: fetchedAt,
      },
    };
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
