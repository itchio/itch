
import {createAction} from "redux-actions";

import {
  TASK_STARTED, ITaskStartedPayload,
  TASK_PROGRESS, ITaskProgressPayload,
  TASK_ENDED, ITaskEndedPayload,

  ABORT_TASK, IAbortTaskPayload,
} from "../constants/action-types";

export const taskStarted = createAction<ITaskStartedPayload>(TASK_STARTED);
export const taskProgress = createAction<ITaskProgressPayload>(TASK_PROGRESS);
export const taskEnded = createAction<ITaskEndedPayload>(TASK_ENDED);

export const abortTask = createAction<IAbortTaskPayload>(ABORT_TASK);
