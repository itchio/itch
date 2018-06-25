import React from "react";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import Page from "renderer/pages/common/Page";

export default class PreloadPage extends React.PureComponent<Props> {
  render() {
    return <Page />;
  }
}

interface Props extends MeatProps {}
