import allInitial from "common/reducers/all";
import { RootState, Action } from "common/types";

let all = allInitial;

let extModule = module as typeof module & { hot?: { accept?: any } };

if (extModule.hot) {
  extModule.hot.accept("./all", () => {
    console.log(`Refreshing reducers...`);
    all = require("./all").default;
  });
}

export default function reduce(rs: RootState, action: Action<any>) {
  return all(rs, action);
}
