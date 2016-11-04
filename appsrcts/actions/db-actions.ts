
import { createAction } from "redux-actions";

import {
  GLOBAL_DB_COMMIT, IDbCommitPayload,
  GLOBAL_DB_READY, IDbReadyPayload,
  GLOBAL_DB_CLOSED, IDbClosedPayload,

  USER_DB_COMMIT,
  USER_DB_READY,
  USER_DB_CLOSED,
} from "../constants/action-types";

export const globalDbCommit = createAction<IDbCommitPayload>(GLOBAL_DB_COMMIT);
export const globalDbReady = createAction<IDbReadyPayload>(GLOBAL_DB_READY);
export const globalDbClosed = createAction<IDbClosedPayload>(GLOBAL_DB_CLOSED);

export const userDbCommit = createAction<IDbCommitPayload>(USER_DB_COMMIT);
export const userDbReady = createAction<IDbReadyPayload>(USER_DB_READY);
export const userDbClosed = createAction<IDbClosedPayload>(USER_DB_CLOSED);
