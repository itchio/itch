import { createAction } from "redux-actions";

import {
  BOUNCE,
  IBouncePayload,
  NOTIFY,
  INotifyPayload,
} from "../constants/action-types";

export const bounce = createAction<IBouncePayload>(BOUNCE);
export const notify = createAction<INotifyPayload>(NOTIFY);
