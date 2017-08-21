import { createSelector, createStructuredSelector } from "reselect";
import * as React from "react";
import { connect } from "./connect";

import bob, { IRGBColor } from "../renderer-util/bob";

import GameActions from "./game-actions";
import GameStats from "./game-stats";

import { IGame } from "../db/models/game";
import { ICaveSummary } from "../db/models/cave";
import { IDownloadKey } from "../db/models/download-key";

import { IDispatch, dispatcher } from "../constants/action-types";
import { IAppState, ITabData, ICommonsState } from "../types";
import * as actions from "../actions";

import { IBrowserControlProps } from "./browser-state";
import GameBrowserContextActions from "./game-browser-context-actions";

import styled from "./styles";
import getByIds from "../helpers/get-by-ids";

import { first } from "underscore";
import { Space } from "../helpers/space";

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

interface IProps extends IBrowserControlProps {}

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
  tabData: ITabData;
  commons: ICommonsState;
}

export default connect<IProps>(GameBrowserContext, {
  state: () => {
    const marketSelector = createStructuredSelector({
      tabData: (state: IAppState, props: IProps) => props.tabData,
      commons: (state: IAppState, props: IProps) => state.commons,
    });

    return createSelector(marketSelector, (cs: IContextSelectorResult) => {
      const game = new Space(cs.tabData).game();
      if (!game) {
        return {};
      }

      // TODO: DRY out a few places that do the same thing
      const downloadKeys = getByIds(
        cs.commons.downloadKeys,
        cs.commons.downloadKeyIdsByGameId[game.id],
      );
      const downloadKey = first(downloadKeys);

      const caves = getByIds(
        cs.commons.caves,
        cs.commons.caveIdsByGameId[game.id],
      );
      const cave = first(caves);

      return { game, downloadKey, cave };
    });
  },
  dispatch: (dispatch: IDispatch) => ({
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
  }),
});
