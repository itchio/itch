import { Task, TasksState } from "common/types";
import { memoize } from "common/util/lru-memoize";

export const getActiveTask = memoize(1, function (tasks: TasksState):
  | Task
  | undefined {
  return getRunningTasks(tasks)[0];
});

export const getRunningTasks = memoize(1, function (tasks: TasksState): Task[] {
  return Object.values(tasks.tasks);
});
