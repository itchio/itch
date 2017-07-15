
import * as React from "react";
import {connect} from "./connect";
import * as classNames from "classnames";

import {IState} from "../types";

interface IWhitelist {
  [key: string]: boolean;
}

const HALLOWEEN_WHITELIST = {
  windows8: true,
  tux: true,
  apple: true,
} as IWhitelist;

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
class Icon extends React.Component<IIconProps> {
  render () {
    const {icon, classes, halloween} = this.props;
    if (!icon) {
      return <span/>;
    }

    let trueIcon = icon;
    if (halloween && !HALLOWEEN_WHITELIST[icon]) {
      trueIcon = "pumpkin";
    }

    const className = classNames(`icon icon-${trueIcon}`, classes);
    return <span className={className} data-tip={this.props["data-tip"]}/>;
  }
}

const mapStateToProps = (state: IState) => ({
  halloween: state.status.bonuses.halloween,
});

interface IIconProps {
  halloween: boolean;
  icon: string;
  classes: string[];
  ["data-tip"]: string;
}

export default connect(mapStateToProps)(Icon);
