
import { createAction } from "redux-actions";
import * as uuid from "uuid";

import {
  DISMISS_HISTORY_ITEM, IDismissHistoryItemPayload,
  QUEUE_HISTORY_ITEM, IQueueHistoryItemPayload,
  HISTORY_READ, IHistoryReadPayload,
} from "../constants/action-types";

export const dismissHistoryItem = createAction<IDismissHistoryItemPayload>(DISMISS_HISTORY_ITEM);

const internalQueueHistoryItem = createAction<IQueueHistoryItemPayload>(QUEUE_HISTORY_ITEM);
export const queueHistoryItem = (payload: any) => internalQueueHistoryItem(Object.assign({
  id: uuid.v4(),
  date: Date.now(),
  active: true,
}, payload));

export const historyRead = createAction<IHistoryReadPayload>(HISTORY_READ);
