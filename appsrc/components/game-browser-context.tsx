
import {createSelector, createStructuredSelector} from "reselect";
import * as React from "react";
import * as classNames from "classnames";
import {connect} from "./connect";

import bob, {IRGBColor} from "../renderer-util/bob";

import GameActions from "./game-actions";
import GameStats from "./game-stats";
import {pathToId} from "../util/navigation";

import {findWhere} from "underscore";

import {ILocalizer} from "../localizer";
import {IDispatch, dispatcher} from "../constants/action-types";
import {
  IState, IGameRecord, ICaveRecord, IDownloadKey, ITabData,
  IUserMarketState, IGlobalMarketState,
} from "../types";
import * as actions from "../actions";

import {IBrowserState} from "./browser-state";
import GameBrowserContextActions from "./game-browser-context-actions";

export class GameBrowserContext extends React.Component<IGameBrowserContextProps, IGameBrowserContextState> {
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
    const barStyle = {};

    const {browserState, game} = this.props;
    const {loading} = browserState;
    const barClasses = classNames("browser-context", "game-browser-context", {loading});

    const {coverUrl, stillCoverUrl} = game;

    // FIXME: DRY — duplicate code from HubItem
    let gif: boolean;
    const coverStyle = {} as React.CSSProperties;
    if (coverUrl) {
      if (this.state.hover) {
        coverStyle.backgroundImage = `url('${coverUrl}')`;
      } else {
        if (stillCoverUrl) {
          gif = true;
          coverStyle.backgroundImage = `url('${stillCoverUrl}')`;
        } else {
          coverStyle.backgroundImage = `url('${coverUrl}')`;
        }
      }
    }

    return <div className={barClasses} style={barStyle} onContextMenu={this.onContextMenu.bind(this)}>
      <div className="cover" style={coverStyle}
        onMouseEnter={this.onMouseEnter.bind(this)}
        onMouseLeave={this.onMouseLeave.bind(this)}>
      {gif
        ? <span className="gif-marker">gif</span>
        : ""
      }
      </div>
      <GameStats game={game} mdash={false}/>
      {this.gameActions()}
    </div>;
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

interface IGameBrowserContextProps {
  gameId: number;
  game: IGameRecord;
  cave?: ICaveRecord;
  downloadKey: IDownloadKey;

  tabData: ITabData;
  tabPath: string;
  browserState: IBrowserState;

  openGameContextMenu: typeof actions.openGameContextMenu;

  t: ILocalizer;
}

// optional everything because react typings is overzealous
interface IGameBrowserContextState {
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

const mapStateToProps = () => {
  const marketSelector = createStructuredSelector({
    gameId: (state: IState, props: IGameBrowserContextProps) => +pathToId(props.tabPath),
    userMarket: (state: IState, props: IGameBrowserContextProps) => state.market,
    globalMarket: (state: IState, props: IGameBrowserContextProps) => state.globalMarket,
    tabData: (state: IState, props: IGameBrowserContextProps) => props.tabData,
  });

  return createSelector(
    marketSelector,
    (cs: IContextSelectorResult) => {
      const getGame = (market: IGamesHolder) => ((market || {}).games || {})[cs.gameId];
      const game = getGame(cs.userMarket) || getGame(cs.tabData);
      const keys = (cs.userMarket || {} as IUserMarketState).downloadKeys || {};
      const downloadKey = findWhere(keys, {gameId: cs.gameId});
      const cave = cs.globalMarket.cavesByGameId[cs.gameId];
      return {game, downloadKey, cave};
    },
  );
};

const mapDispatchToProps = (dispatch: IDispatch) => ({
  openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameBrowserContext);
