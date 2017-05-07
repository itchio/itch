
import {createSelector, createStructuredSelector} from "reselect";
import * as React from "react";
import {connect, I18nProps} from "./connect";

import bob, {IRGBColor} from "../renderer-util/bob";

import GameActions from "./game-actions";
import GameStats from "./game-stats";
import {pathToId} from "../util/navigation";

import {IDispatch, dispatcher} from "../constants/action-types";
import {
  IAppState, IGameRecord, ICaveRecord, IDownloadKey, ITabData,
} from "../types";
import * as actions from "../actions";

import {IBrowserControlProperties} from "./browser-state";
import GameBrowserContextActions from "./game-browser-context-actions";
import Cover from "./basics/cover"; 
import styled from "./styles";

const BrowserContextDiv = styled.div`
  flex-basis: 240px;
  background: ${props => props.theme.sidebarBackground};

  display: flex;
  align-items: stretch;
  flex-direction: column;
  align-items: stretch;

  padding: 12px;
  border-left: 1px solid #3e3e3e;
  box-shadow: 0 0 18px rgba(0, 0, 0, 0.16);
  z-index: 50;
  overflow-y: auto;
  overflow-x: hidden;
`;

const GameActionsContainer = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-grow: 1;
  flex-direction: column;
  padding-right: 0;
  height: auto;
  align-items: stretch;
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
    // FIXME db
    if (!game) {
      return <div/>;
    }
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
      <GameActionsContainer>{this.gameActions()}</GameActionsContainer>
    </BrowserContextDiv>;
  }

  gameActions () {
    const {game} = this.props;
    if (!game) {
      return null;
    }

    return <GameActions vertical game={game} CustomSecondary={GameBrowserContextActions}/>;
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
  tabData: ITabData;
}

export default connect<IProps>(GameBrowserContext, {
  state: () => {
    const marketSelector = createStructuredSelector({
      gameId: (state: IAppState, props: IProps) => +pathToId(props.tabPath),
      tabData: (state: IAppState, props: IProps) => props.tabData,
    });

    return createSelector(
      marketSelector,
      (cs: IContextSelectorResult) => {
        // TODO db
        const game = null;
        // TODO db
        const downloadKey = null;
        // TODO db
        const cave = null;
        return { game, downloadKey, cave };
      },
    );
  },
  dispatch: (dispatch: IDispatch) => ({
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
  }),
});
