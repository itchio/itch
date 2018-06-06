import React from "react";
import { IMeatProps } from "./meats/types";

class Crashy extends React.PureComponent<IProps> {
  render() {
    if (1 == 1) {
      throw new Error("Just testing error boundaries");
    }
    return null;
  }
}

interface IProps extends IMeatProps {}

export default Crashy;
