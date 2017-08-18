import allInitial from "./all";
import { IAction } from "../constants/action-types";
import { IAppState } from "../types/index";

let all = allInitial;

if (module.hot) {
  module.hot.accept(() => {
    console.log(`Refreshing reducers...`);
    all = require("./all").default;
  });
}

export default function reduce(state: IAppState, action: IAction<any>) {
  return all(state, action);
}
