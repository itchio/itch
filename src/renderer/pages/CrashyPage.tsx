import React from "react";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

export default class CrashyPage extends React.PureComponent<Props> {
  override render(): JSX.Element | null {
    if (1 == 1) {
      throw new Error("Just testing error boundaries");
    }
    return null;
  }
}

interface Props extends MeatProps {}
