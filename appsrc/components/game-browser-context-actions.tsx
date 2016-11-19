
import * as React from "react";
import * as classNames from "classnames";
import {connect} from "./connect";

import {map} from "underscore";

import listSecondaryActions, {IActionOpts} from "./game-actions/list-secondary-actions";
import {IActionsInfo} from "./game-actions/types";

import {ILocalizer} from "../localizer";
import {IAction} from "../constants/action-types";

import GameBrowserContextAction from "./game-browser-context-action";

class GameBrowserContextActions extends React.Component<IGameBrowserContextActionsProps, void> {
  render () {
    const {items, error} = listSecondaryActions(this.props);

    return <div className={classNames("cave-actions", {error})}>
      {map(items, this.action.bind(this))}
    </div>;
  }

  action (opts: IActionOpts) {
    return <GameBrowserContextAction opts={opts}/>;
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
