
import * as React from "react";
import * as classNames from "classnames";
import {connect} from "./connect";

import {map} from "underscore";

import Icon from "./icon";

import listSecondaryActions, {IActionOpts} from "./game-actions/list-secondary-actions";
import {IActionsInfo} from "./game-actions/types";

import {ILocalizer} from "../localizer";
import {IAction} from "../constants/action-types";

class GameBrowserContextActions extends React.Component<IGameBrowserContextActionsProps, void> {
  render () {
    const {items, error} = listSecondaryActions(this.props);

    return <div className={classNames("cave-actions", {error})}>
      {map(items, this.action.bind(this))}
    </div>;
  }

  action (opts: IActionOpts) {
    const {t, dispatch} = this.props;
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

interface IGameBrowserContextActionsProps extends IActionsInfo {
  t: ILocalizer;
  dispatch: (action: IAction<any>) => void;
}

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({dispatch});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameBrowserContextActions);
