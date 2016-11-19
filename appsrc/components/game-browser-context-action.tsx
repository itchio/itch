
import * as React from "react";
import * as classNames from "classnames";
import {connect} from "./connect";

import Icon from "./icon";
import {IAction} from "../constants/action-types";
import {ILocalizer} from "../localizer";

import {IActionOpts} from "./game-actions/list-secondary-actions";

class GameBrowserContextAction extends React.Component<IGameBrowserContextAction, void> {
  render () {
    const {t, dispatch, opts} = this.props;
    const {action, icon, hint, label, type = "action", classes = []} = opts;
    const spanClasses = classNames("secondary-action", `type-${type}`, classes, {
      ["hint--top"]: !!hint,
    });

    const textLabel = "" + label;

    return <span key={textLabel} className={spanClasses} data-hint={hint} onClick={() => dispatch(action)}>
      <Icon icon={icon}/> {t.format(label)}
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
  mapDispatchToProps
)(GameBrowserContextAction);
