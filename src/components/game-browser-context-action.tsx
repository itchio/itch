
import * as React from "react";
import * as classNames from "classnames";
import {connect, I18nProps} from "./connect";

import Icon from "./basics/icon";
import {IDispatch} from "../constants/action-types";

import {IActionOpts} from "./game-actions/list-secondary-actions";
import Ink = require("react-ink");

class GameBrowserContextAction extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, dispatch, opts} = this.props;
    const {action, icon, hint, label, type = "action", classes = []} = opts;
    const spanClasses = classNames("secondary-action", `type-${type}`, classes);

    const textLabel = "" + label;
    const style: React.CSSProperties = {
      position: "relative",
    };

    return <span style={style} key={textLabel}
        className={spanClasses}
        data-rh-at="left"
        data-rh={hint}
        onClick={() => dispatch(action)}>
      <Icon icon={icon}/> {t.format(label)}
      {type === "separator" ? null : <Ink/>}
    </span>;
  }
}

interface IProps {
  opts: IActionOpts;
}

interface IDerivedProps {
  dispatch: IDispatch;
}

export default connect<IProps>(GameBrowserContextAction, {
  dispatch: (dispatch) => ({dispatch}),
});
