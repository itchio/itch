import { createAction } from "redux-actions";

import {
  DB_COMMIT,
  IDbCommitPayload,
  COMMONS_UPDATED,
  ICommonsUpdatedPayload,
} from "../constants/action-types";

export const dbCommit = createAction<IDbCommitPayload>(DB_COMMIT);
export const commonsUpdated = createAction<ICommonsUpdatedPayload>(
  COMMONS_UPDATED
);
