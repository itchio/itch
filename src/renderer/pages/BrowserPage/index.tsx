import React from "react";
import { withSpace } from "renderer/hocs/withSpace";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import BrowserMeat from "renderer/pages/BrowserPage/BrowserPageContents";
import { Space } from "common/helpers/space";

class BrowserPage extends React.PureComponent<Props, State> {
  constructor(props: Props, context: any) {
    super(props, context);
    this.state = {
      active: props.visible || !props.space.isSleepy(),
    };
  }

  render() {
    const { active } = this.state;
    if (!active) {
      return null;
    }

    const { space } = this.props;
    return <BrowserMeat url={space.url()} {...this.props as any} />;
  }

  static getDerivedStateFromProps(
    props: BrowserPage["props"],
    state: BrowserPage["state"]
  ) {
    if (props.visible && !state.active) {
      return { active: true };
    }

    return null;
  }
}

interface Props extends MeatProps {
  space: Space;
}

interface State {
  active: boolean;
}

export default withSpace(BrowserPage);
