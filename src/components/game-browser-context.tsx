import { createSelector, createStructuredSelector } from "reselect";
import * as React from "react";
import { connect } from "./connect";

import bob, { IRGBColor } from "../renderer-util/bob";

import MainAction from "./game-actions/main-action";
import GameStats from "./game-stats";
import Filler from "./basics/filler";
import Button from "./basics/button";

import { IGame } from "../db/models/game";
import { ICaveSummary } from "../db/models/cave";
import { IDownloadKey } from "../db/models/download-key";

import { IDispatch, dispatcher } from "../constants/action-types";
import { IAppState, ITabData, ICommonsState } from "../types";
import * as actions from "../actions";

import { IBrowserControlProps } from "./browser-state";

import styled from "./styles";
import getByIds from "../helpers/get-by-ids";

import { first } from "underscore";
import { Space } from "../helpers/space";

const BrowserContextDiv = styled.div`
  background: ${props => props.theme.sidebarBackground};

  display: flex;
  justify-content: center;
  flex-direction: row;

  padding: 10px;
  box-shadow: 0 0 18px rgba(0, 0, 0, 0.16);
  z-index: 50;
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
        <MainAction game={game} wide />
        <GameStats game={game} cave={cave} downloadKey={downloadKey} />
        <Filler />
        <Button discreet label="..." />
      </BrowserContextDiv>
    );
  }

  onContextMenu = () => {
    const { game, openGameContextMenu } = this.props;
    openGameContextMenu({ game });
  };

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
