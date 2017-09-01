import allInitial from "./all";
import { IAction } from "../constants/action-types";
import { IRootState } from "../types/index";

let all = allInitial;

if (module.hot) {
  module.hot.accept(() => {
    console.log(`Refreshing reducers...`);
    all = require("./all").default;
  });
}

export default function reduce(rs: IRootState, action: IAction<any>) {
  return all(rs, action);
}
