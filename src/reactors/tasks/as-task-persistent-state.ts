import { Context } from "../../context/index";

interface ITaskMap {
  [id: string]: Context;
}

let currentTasks = {} as ITaskMap;

export const getCurrentTasks = () => currentTasks;
