
import * as React from "react";
import * as classNames from "classnames";
import {connect} from "./connect";

import {map} from "underscore";

import listSecondaryActions from "./game-actions/list-secondary-actions";
import {IActionsInfo} from "./game-actions/types";
import * as actions from "../actions";

import {ILocalizer} from "../localizer";
import {IDispatch} from "../constants/action-types";

import GameBrowserContextAction from "./game-browser-context-action";

import watching, {Watcher} from "./watching";

const GENEROSITY_PREWARM = 500;
const GENEROSITY_TIMEOUT = 1000;
import delay from "../reactors/delay";

/**
 * Displays install, share, buy now buttons and so on.
 */
@watching
class GameBrowserContextActions extends React.Component
    <IGameBrowserContextActionsProps, IGameBrowserContextActionsState> {
  constructor () {
    super();
    this.state = {
      encouragingGenerosity: false,
    };
  }

  subscribe (watcher: Watcher) {
    watcher.on(actions.encourageGenerosity, async (store, action) => {
      const {level} = action.payload;

      if (level === "discreet") {
        await delay(GENEROSITY_PREWARM);
        this.setState({encouragingGenerosity: true});
        await delay(GENEROSITY_TIMEOUT);
        this.setState({encouragingGenerosity: false});
      }
    });
  }

  render () {
    const {items, error} = listSecondaryActions(this.props);

    return <div className={classNames("cave-actions", {
      error,
      ["encouraging-generosity"]: this.state.encouragingGenerosity,
    })}>
      {map(items, (opts, i) => {
        const key = `${opts.type}-${opts.icon}-${opts.label}`;
        return <GameBrowserContextAction opts={opts} key={key}/>;
      })}
    </div>;
  }
}

interface IGameBrowserContextActionsProps extends IActionsInfo {
  t: ILocalizer;
  dispatch: IDispatch;
}

interface IGameBrowserContextActionsState {
  encouragingGenerosity: boolean;
}

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: IDispatch) => ({dispatch});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameBrowserContextActions);
