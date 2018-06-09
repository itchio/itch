import allInitial from "./all";
import { IRootState, IAction } from "common/types/index";

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
