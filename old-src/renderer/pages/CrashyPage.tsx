import React from "react";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

export default class CrashyPage extends React.PureComponent<Props> {
  render() {
    if (1 == 1) {
      throw new Error("Just testing error boundaries");
    }
    return null as JSX.Element;
  }
}

interface Props extends MeatProps {}
