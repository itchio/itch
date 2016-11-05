
import {handleActions} from "redux-actions";

import {ISessionCachedCollectionsState} from "../../types";

import {
  IAction,
  ICollectionGamesFetchedPayload,
  ILogoutPayload,
} from "../../constants/action-types";

const initialState = {
  fetched: {},
} as ISessionCachedCollectionsState;

export default handleActions<ISessionCachedCollectionsState, any>({
  COLLECTION_GAMES_FETCHED: (state: ISessionCachedCollectionsState,
                             action: IAction<ICollectionGamesFetchedPayload>) => {
    const {collectionId} = action.payload;

    const {fetched} = state;
    return Object.assign({}, state, {
      fetched: Object.assign({}, fetched, {
        [collectionId]: Date.now(),
      }),
    });
  },

  LOGOUT: (state: ISessionCachedCollectionsState, action: IAction<ILogoutPayload>) => {
    return initialState;
  },
}, initialState);
