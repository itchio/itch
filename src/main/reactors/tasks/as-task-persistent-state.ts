import { Context } from "../../context/index";

interface TaskMap {
  [id: string]: Context;
}

let currentTasks = {} as TaskMap;

export const getCurrentTasks = () => currentTasks;
