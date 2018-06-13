import React from "react";
import { MeatProps } from "./meats/types";

class Crashy extends React.PureComponent<IProps> {
  render() {
    if (1 == 1) {
      throw new Error("Just testing error boundaries");
    }
    return null;
  }
}

interface IProps extends MeatProps {}

export default Crashy;
