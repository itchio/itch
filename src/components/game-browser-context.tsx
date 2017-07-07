import { createSelector, createStructuredSelector } from "reselect";
import * as React from "react";
import { connect } from "./connect";

import bob, { IRGBColor } from "../renderer-util/bob";

import GameActions from "./game-actions";
import GameStats from "./game-stats";
import { pathToId } from "../util/navigation";

import { IGame } from "../db/models/game";
import { ICaveSummary } from "../db/models/cave";
import { IDownloadKey } from "../db/models/download-key";

import { IDispatch, dispatcher } from "../constants/action-types";
import { IAppState, ITabData } from "../types";
import * as actions from "../actions";

import { IBrowserControlProperties } from "./browser-state";
import GameBrowserContextActions from "./game-browser-context-actions";

import styled from "./styles";

const BrowserContextDiv = styled.div`
  background: ${props => props.theme.sidebarBackground};

  display: flex;
  justify-content: center;
  flex-direction: row;

  padding: 6px;
  box-shadow: 0 0 18px rgba(0, 0, 0, 0.16);
  z-index: 50;
  overflow-y: auto;
  overflow-x: hidden;
`;

const GameActionsContainer = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-grow: 0;
  flex-direction: row;
  padding-right: 0;
  height: auto;
  align-items: stretch;
  margin-left: 10px;
`;

export class GameBrowserContext extends React.PureComponent<
  IProps & IDerivedProps,
  IState
> {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    const { game, cave, downloadKey } = this.props;
    if (!game) {
      return <div />;
    }

    return (
      <BrowserContextDiv onContextMenu={this.onContextMenu}>
        <GameStats
          game={game}
          cave={cave}
          downloadKey={downloadKey}
          mdash={true}
        />
        <GameActionsContainer>
          {this.gameActions()}
        </GameActionsContainer>
      </BrowserContextDiv>
    );
  }

  onContextMenu = () => {
    const { game, openGameContextMenu } = this.props;
    openGameContextMenu({ game });
  };

  gameActions() {
    const { game } = this.props;
    if (!game) {
      return null;
    }

    return (
      <GameActions game={game} CustomSecondary={GameBrowserContextActions} />
    );
  }

  componentWillReceiveProps() {
    this.updateColor();
  }

  componentDidMount() {
    this.updateColor();
  }

  updateColor() {
    const { game } = this.props;
    if (game) {
      bob.extractPalette(game.coverUrl, palette => {
        this.setState({ dominantColor: bob.pick(palette) });
      });
    }
  }
}

interface IProps extends IBrowserControlProperties {}

interface IDerivedProps {
  gameId: number;

  game: IGame;
  cave?: ICaveSummary;
  downloadKey: IDownloadKey;

  openGameContextMenu: typeof actions.openGameContextMenu;
}

interface IState {
  dominantColor?: IRGBColor;
}

interface IContextSelectorResult {
  gameId: number;
  tabData: ITabData;
}

export default connect<IProps>(GameBrowserContext, {
  state: () => {
    const marketSelector = createStructuredSelector({
      gameId: (state: IAppState, props: IProps) => +pathToId(props.tabPath),
      tabData: (state: IAppState, props: IProps) => props.tabData,
    });

    return createSelector(marketSelector, (cs: IContextSelectorResult) => {
      const game = cs.tabData.games[cs.gameId];
      // TODO: db
      const downloadKey = null;
      // TODO: db
      const cave = null;
      return { game, downloadKey, cave };
    });
  },
  dispatch: (dispatch: IDispatch) => ({
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
  }),
});
