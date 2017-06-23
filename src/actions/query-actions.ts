import { createAction } from "redux-actions";

import {
  REGISTER_QUERY,
  IRegisterQueryPayload,
  LIBERATE_QUERY,
  ILiberateQueryPayload,
  FETCHED_QUERY,
  IFetchedQueryPayload,
} from "../constants/action-types";

export const registerQuery = createAction<IRegisterQueryPayload>(
  REGISTER_QUERY,
);
export const liberateQuery = createAction<ILiberateQueryPayload>(
  LIBERATE_QUERY,
);
export const fetchedQuery = createAction<IFetchedQueryPayload>(FETCHED_QUERY);
