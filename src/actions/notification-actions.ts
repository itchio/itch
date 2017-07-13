import { createAction } from "redux-actions";

import {
  BOUNCE,
  IBouncePayload,
  NOTIFY,
  INotifyPayload,
  NOTIFY_HTML5,
  INotifyHtml5Payload,
} from "../constants/action-types";

export const bounce = createAction<IBouncePayload>(BOUNCE);
export const notify = createAction<INotifyPayload>(NOTIFY);
export const notifyHtml5 = createAction<INotifyHtml5Payload>(NOTIFY_HTML5);
