import { Task, TasksState } from "common/types";
import { first, values } from "underscore";
import { memoize } from "common/util/lru-memoize";

export const getActiveTask = memoize(1, function (tasks: TasksState): Task {
  return first(getRunningTasks(tasks));
});

export const getRunningTasks = memoize(1, function (tasks: TasksState): Task[] {
  return values(tasks.tasks);
});
