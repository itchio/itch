import { Context } from "../../context/index";

export interface ITaskMap {
  [id: string]: Context;
}

let currentTasks = {} as ITaskMap;

export const getCurrentTasks = () => currentTasks;
