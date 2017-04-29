
import {createSelector, createStructuredSelector} from "reselect";
import * as React from "react";
import {connect, I18nProps} from "./connect";

import bob, {IRGBColor} from "../renderer-util/bob";

import GameActions from "./game-actions";
import GameStats from "./game-stats";
import {pathToId} from "../util/navigation";

import {findWhere} from "underscore";

import {IDispatch, dispatcher} from "../constants/action-types";
import {
  IAppState, IGameRecord, ICaveRecord, IDownloadKey, ITabData,
  IUserMarketState, IGlobalMarketState,
} from "../types";
import * as actions from "../actions";

import {IBrowserControlProperties} from "./browser-state";
import GameBrowserContextActions from "./game-browser-context-actions";
import Cover from "./basics/cover"; 
import styled from "./styles";

const BrowserContextDiv = styled.div`
  flex-basis: 240px;
  background: $sidebar-background-color;

  display: flex;
  align-items: stretch;
  flex-direction: column;
`;

export class GameBrowserContext extends React.Component<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {
      hover: false,
    };
  }

  onContextMenu () {
    const {game, openGameContextMenu} = this.props;
    openGameContextMenu({game});
  }

  render () {
    const {game} = this.props;
    const {coverUrl, stillCoverUrl} = game;
    const {hover} = this.state;

    return <BrowserContextDiv
        onContextMenu={this.onContextMenu.bind(this)}>
      <Cover
        coverUrl={coverUrl}
        stillCoverUrl={stillCoverUrl}
        hover={hover}
        onMouseEnter={this.onMouseEnter.bind(this)}
        onMouseLeave={this.onMouseLeave.bind(this)}
      />
      <GameStats game={game} mdash={false}/>
      {this.gameActions()}
    </BrowserContextDiv>;
  }

  gameActions () {
    const {game} = this.props;
    if (!game) {
      return null;
    }

    return <GameActions game={game} CustomSecondary={GameBrowserContextActions}/>;
  }

  componentWillReceiveProps () {
    this.updateColor();
  }

  componentDidMount () {
    this.updateColor();
  }

  updateColor () {
    const {game} = this.props;
    if (game) {
      bob.extractPalette(game.coverUrl, (palette) => {
        this.setState({dominantColor: bob.pick(palette)});
      });
    }
  }

  onMouseEnter () {
    this.setState({hover: true});
  }

  onMouseLeave () {
    this.setState({hover: false});
  }
}

interface IProps extends IBrowserControlProperties {}

interface IDerivedProps {
  gameId: number;

  game: IGameRecord;
  cave?: ICaveRecord;
  downloadKey: IDownloadKey;

  openGameContextMenu: typeof actions.openGameContextMenu;
}

// optional everything because react typings is overzealous
// TODO: check if still needed
interface IState {
  hover?: boolean;
  dominantColor?: IRGBColor;
}

interface IContextSelectorResult {
  gameId: number;
  globalMarket: IGlobalMarketState;
  userMarket: IUserMarketState;
  tabData: ITabData;
}

interface IGamesHolder {
  games?: {
    [gameId: string]: IGameRecord;
  };
}

export default connect<IProps>(GameBrowserContext, {
  state: () => {
    const marketSelector = createStructuredSelector({
      gameId: (state: IAppState, props: IProps) => +pathToId(props.tabPath),
      userMarket: (state: IAppState, props: IProps) => state.market,
      globalMarket: (state: IAppState, props: IProps) => state.globalMarket,
      tabData: (state: IAppState, props: IProps) => props.tabData,
    });

    return createSelector(
      marketSelector,
      (cs: IContextSelectorResult) => {
        const getGame = (market: IGamesHolder) => ((market || {}).games || {})[cs.gameId];
        const game = getGame(cs.userMarket) || getGame(cs.tabData);
        const keys = (cs.userMarket || {} as IUserMarketState).downloadKeys || {};
        const downloadKey = findWhere(keys, { gameId: cs.gameId });
        const cave = cs.globalMarket.cavesByGameId[cs.gameId];
        return { game, downloadKey, cave };
      },
    );
  },
  dispatch: (dispatch: IDispatch) => ({
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
  }),
});
