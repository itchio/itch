import { createAction } from "redux-actions";

import {
  BROWSE_INSTALL_LOCATION,
  IBrowseInstallLocationPayload,
  ADD_INSTALL_LOCATION_REQUEST,
  IAddInstallLocationRequestPayload,
  ADD_INSTALL_LOCATION,
  IAddInstallLocationPayload,
  REMOVE_INSTALL_LOCATION_REQUEST,
  IRemoveInstallLocationRequestPayload,
  REMOVE_INSTALL_LOCATION,
  IRemoveInstallLocationPayload,
  MAKE_INSTALL_LOCATION_DEFAULT,
  IMakeInstallLocationDefaultPayload,
  QUERY_FREE_SPACE,
  IQueryFreeSpacePayload,
  FREE_SPACE_UPDATED,
  IFreeSpaceUpdatedPayload,
} from "../constants/action-types";

export const browseInstallLocation = createAction<
  IBrowseInstallLocationPayload
>(BROWSE_INSTALL_LOCATION);
export const addInstallLocationRequest = createAction<
  IAddInstallLocationRequestPayload
>(ADD_INSTALL_LOCATION_REQUEST);
export const addInstallLocation = createAction<IAddInstallLocationPayload>(
  ADD_INSTALL_LOCATION,
);
export const removeInstallLocationRequest = createAction<
  IRemoveInstallLocationRequestPayload
>(REMOVE_INSTALL_LOCATION_REQUEST);
export const removeInstallLocation = createAction<
  IRemoveInstallLocationPayload
>(REMOVE_INSTALL_LOCATION);
export const makeInstallLocationDefault = createAction<
  IMakeInstallLocationDefaultPayload
>(MAKE_INSTALL_LOCATION_DEFAULT);
export const queryFreeSpace = createAction<IQueryFreeSpacePayload>(
  QUERY_FREE_SPACE,
);
export const freeSpaceUpdated = createAction<IFreeSpaceUpdatedPayload>(
  FREE_SPACE_UPDATED,
);
