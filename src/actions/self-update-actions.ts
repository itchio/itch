import { createAction } from "redux-actions";

import {
  CHECK_FOR_SELF_UPDATE,
  ICheckForSelfUpdatePayload,
  CHECKING_FOR_SELF_UPDATE,
  ICheckingForSelfUpdatePayload,
  SELF_UPDATE_AVAILABLE,
  ISelfUpdateAvailablePayload,
  SELF_UPDATE_NOT_AVAILABLE,
  ISelfUpdateNotAvailablePayload,
  SELF_UPDATE_ERROR,
  ISelfUpdateErrorPayload,
  SELF_UPDATE_DOWNLOADED,
  ISelfUpdateDownloadedPayload,
  SHOW_AVAILABLE_SELF_UPDATE,
  IShowAvailableSelfUpdatePayload,
  APPLY_SELF_UPDATE_REQUEST,
  IApplySelfUpdateRequestPayload,
  APPLY_SELF_UPDATE,
  IApplySelfUpdatePayload,
  SNOOZE_SELF_UPDATE,
  ISnoozeSelfUpdatePayload,
  DISMISS_STATUS,
  IDismissStatusPayload,
  STATUS_MESSAGE,
  IStatusMessagePayload,
  DISMISS_STATUS_MESSAGE,
  IDismissStatusMessagePayload,
} from "../constants/action-types";

export const checkForSelfUpdate = createAction<ICheckForSelfUpdatePayload>(
  CHECK_FOR_SELF_UPDATE,
);
export const checkingForSelfUpdate = createAction<
  ICheckingForSelfUpdatePayload
>(CHECKING_FOR_SELF_UPDATE);
export const selfUpdateAvailable = createAction<ISelfUpdateAvailablePayload>(
  SELF_UPDATE_AVAILABLE,
);
export const selfUpdateNotAvailable = createAction<
  ISelfUpdateNotAvailablePayload
>(SELF_UPDATE_NOT_AVAILABLE);
export const selfUpdateError = createAction<ISelfUpdateErrorPayload>(
  SELF_UPDATE_ERROR,
);
export const selfUpdateDownloaded = createAction<ISelfUpdateDownloadedPayload>(
  SELF_UPDATE_DOWNLOADED,
);
export const showAvailableSelfUpdate = createAction<
  IShowAvailableSelfUpdatePayload
>(SHOW_AVAILABLE_SELF_UPDATE);
export const applySelfUpdateRequest = createAction<
  IApplySelfUpdateRequestPayload
>(APPLY_SELF_UPDATE_REQUEST);
export const applySelfUpdate = createAction<IApplySelfUpdatePayload>(
  APPLY_SELF_UPDATE,
);
export const snoozeSelfUpdate = createAction<ISnoozeSelfUpdatePayload>(
  SNOOZE_SELF_UPDATE,
);
export const dismissStatus = createAction<IDismissStatusPayload>(
  DISMISS_STATUS,
);

export const statusMessage = createAction<IStatusMessagePayload>(
  STATUS_MESSAGE,
);
export const dismissStatusMessage = createAction<IDismissStatusMessagePayload>(
  DISMISS_STATUS_MESSAGE,
);
