import { Space } from "common/helpers/space";
import { ITabInstance } from "common/types";
import React from "react";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import BrowserMeat from "./BrowserPageContents";

class BrowserPage extends React.PureComponent<Props, State> {
  constructor(props: Props, context) {
    super(props, context);
    this.state = {
      active: props.visible || !props.tabInstance.sleepy,
    };
  }

  render() {
    const { active } = this.state;
    if (!active) {
      return null;
    }

    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    return <BrowserMeat url={sp.url()} {...this.props as any} />;
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
  tab: string;
  tabInstance: ITabInstance;
}

interface State {
  active: boolean;
}

export default withTab(withTabInstance(BrowserPage));
