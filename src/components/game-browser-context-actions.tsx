
import * as React from "react";
import {connect, I18nProps} from "./connect";

import {map} from "underscore";

import listSecondaryActions from "./game-actions/list-secondary-actions";
import {IActionsInfo} from "./game-actions/types";
import * as actions from "../actions";

import {IDispatch} from "../constants/action-types";

import GameBrowserContextAction from "./game-browser-context-action";

import watching, {Watcher} from "./watching";

const GENEROSITY_PREWARM = 500;
const GENEROSITY_TIMEOUT = 1000;
import delay from "../reactors/delay";

import styled from "./styles";

const ActionsDiv = styled.div`
  flex-grow: 1;

  display: flex;
  flex-direction: column;

  padding-left: 20px;
`;

/**
 * Displays install, share, buy now buttons and so on.
 */
@watching
class GameBrowserContextActions extends React.PureComponent<IProps & IDerivedProps & I18nProps, IState> {
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
    const {items} = listSecondaryActions(this.props);

    return <ActionsDiv>
      {map(items, (opts, i) => {
        const key = `${opts.type}-${opts.icon}-${opts.label}`;
        return <GameBrowserContextAction opts={opts} key={key}/>;
      })}
    </ActionsDiv>;
  }
}

interface IProps extends IActionsInfo {}

interface IDerivedProps {
  dispatch: IDispatch;
}

interface IState {
  encouragingGenerosity: boolean;
}

export default connect<IProps>(GameBrowserContextActions, {
  dispatch: (dispatch) => ({dispatch}),
});
