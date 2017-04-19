
import {handleActions} from "redux-actions";

import {omit} from "underscore";

import {IMarket, IMarketState, TableName} from "../types";

import * as actionTypes from "../constants/action-types";
import {IAction, IDbReadyPayload, IDbCommitPayload, IDbClosedPayload} from "../constants/action-types";

interface IMarketGetter {
  (): IMarket;
}

type IMarketPrefix = "GLOBAL" | "USER";

interface IActionMap {
  ready: string;
  commit: string;
  closed: string;
}

interface IPrefixActionMap {
  [prefix: string]: IActionMap;
}

const prefixToActions: IPrefixActionMap = {
  GLOBAL: {
    ready: actionTypes.GLOBAL_DB_READY,
    commit: actionTypes.GLOBAL_DB_COMMIT,
    closed: actionTypes.GLOBAL_DB_CLOSED,
  },
  USER: {
    ready: actionTypes.USER_DB_READY,
    commit: actionTypes.USER_DB_COMMIT,
    closed: actionTypes.USER_DB_CLOSED,
  },
};

export default function makeMarketReducer (prefix: IMarketPrefix, getMarket: IMarketGetter, tables: string[]) {
  const initialState = {
    ready: false,
  } as any;
  for (const table of tables) {
    initialState[table] = {};
  }

  const dbActions = prefixToActions[prefix];

  return handleActions({
    [dbActions.ready]: (state: IMarketState, action: IAction<IDbReadyPayload>) => {
      return { ...state, ready: true };
    },

    [dbActions.closed]: (state: IMarketState, action: IAction<IDbClosedPayload>) => {
      return initialState;
    },

    [dbActions.commit]: (state: IMarketState, action: IAction<IDbCommitPayload>) => {
      const {updated = {}, deleted = {}, initial = false} = action.payload;
      const market = getMarket();

      for (const tableName of Object.keys(deleted)) {
        const deletedIds = deleted[tableName];
        const updatedTable = omit(state[tableName] || {}, deletedIds);
        state = {...state, [tableName]: updatedTable};
      }

      for (const tableName of Object.keys(updated)) {
        const updatedIds = updated[tableName];
        const records = market.getEntities(tableName as TableName);

        let updatedTable = (state[tableName] || {}) as any;
        for (const recordId of updatedIds) {
          updatedTable = {...updatedTable, [recordId]: records[recordId]};
        }
        state = {...state, [tableName]: updatedTable};
      }

      if (initial) {
        state = {...state, ready: true};
      }
      return state;
    },
  }, initialState);
}
