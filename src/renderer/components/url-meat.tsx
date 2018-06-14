import React from "react";

import { MeatProps } from "renderer/components/meats/types";

import BrowserMeat from "./browser-meat";
import { Space } from "common/helpers/space";
import { withTab } from "./meats/tab-provider";
import { ITabInstance } from "common/types";
import { withTabInstance } from "./meats/tab-instance-provider";

class UrlMeat extends React.PureComponent<IProps, IState> {
  constructor(props: IProps, context) {
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
    props: UrlMeat["props"],
    state: UrlMeat["state"]
  ) {
    if (props.visible && !state.active) {
      return { active: true };
    }

    return null;
  }
}

interface IProps extends MeatProps {
  tab: string;
  tabInstance: ITabInstance;
}

interface IState {
  active: boolean;
}

export default withTab(withTabInstance(UrlMeat));
