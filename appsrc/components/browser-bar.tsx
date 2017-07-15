
import * as React from "react";
import * as classNames from "classnames";

import BrowserControls from "./browser-controls";

import {IBrowserState} from "./browser-state";

export class BrowserBar extends React.Component<IBrowserBarProps> {
  render () {
    const {browserState} = this.props;
    const {loading} = browserState;

    const classes = classNames("browser-bar", {loading});

    return <div className={classes}>
      <div className="controls">
        <BrowserControls {...this.props}/>
      </div>
    </div>;
  }
}

// FIXME: a lot of props are missing from here
interface IBrowserBarProps {
  browserState: IBrowserState;
}

export default BrowserBar;
