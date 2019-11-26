import { Context } from "main/context";

interface TaskMap {
  [id: string]: Context;
}

let currentTasks = {} as TaskMap;

export const getCurrentTasks = () => currentTasks;
