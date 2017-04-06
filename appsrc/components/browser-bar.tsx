
import * as React from "react";
import * as classNames from "classnames";

import BrowserControls from "./browser-controls";

import {IBrowserControlProperties} from "./browser-state";

export class BrowserBar extends React.Component<IProps, void> {
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

interface IProps extends IBrowserControlProperties {}

export default BrowserBar;
