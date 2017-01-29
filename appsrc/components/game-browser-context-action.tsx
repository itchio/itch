
import * as React from "react";
import * as classNames from "classnames";
import {connect} from "./connect";

import Icon from "./icon";
import {IAction} from "../constants/action-types";
import {ILocalizer} from "../localizer";

import {IActionOpts} from "./game-actions/list-secondary-actions";
import Ink = require("react-ink");

class GameBrowserContextAction extends React.Component<IGameBrowserContextAction, void> {
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

interface IGameBrowserContextAction {
  t: ILocalizer;
  dispatch: (action: IAction<any>) => void;
  opts: IActionOpts;
}

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({dispatch});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameBrowserContextAction);
