import all from "common/reducers/all";
import { RootState, Action } from "common/types";

export default function reduce(rs: RootState, action: Action<any>) {
  return all(rs, action);
}
