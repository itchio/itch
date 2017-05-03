
import {} from "redux-actions";

import * as React from "react";
import * as classNames from "classnames";

import {connect, I18nProps} from "../connect";
import {createSelector, createStructuredSelector} from "reselect";

import {findWhere} from "underscore";

import os from "../../util/os";

import actionForGame from "../../util/action-for-game";
import isPlatformCompatible from "../../util/is-platform-compatible";

import MainAction from "./main-action";
import SecondaryActions from "./secondary-actions";

import {IActionsInfo} from "./types";
import {
  IAppState, IGameRecord, ICaveRecord, IDownloadKey,
  IDownloadItem, ITask, IGameUpdate, IGameUpdatesState,
} from "../../types";

const platform = os.itchPlatform();

import styled from "../styles";
import Filler from "../basics/filler";

const StyledMainAction = styled(MainAction)`
  &.vertical {
    width: 100%;
  }
`;

const GameActionsDiv = styled.div`
  min-height: 3em;
  display: flex;
  align-items: center;
  flex-direction: row;
  flex-grow: 1;

  &.vertical {
    flex-direction: column;
    align-items: stretch;
  }
`;

class GameActions extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {props} = this;
    const {vertical, showSecondary, CustomSecondary} = this.props;

    let taskName = "idle";
    if (props.tasks && props.tasks.length > 0) {
      taskName = props.tasks[0].name;
    }

    const classes = classNames({vertical});

    return <GameActionsDiv className={classes}>
      <StyledMainAction {...props} className={classNames({vertical})}/>
      {vertical
      ? null
      : <Filler/>}
      {showSecondary
        ? <SecondaryActions {...props}/>
        : ""}
      {CustomSecondary
        ? <CustomSecondary {...props}/>
        : ""}
    </GameActionsDiv>;
  }
}

interface IProps {
  game: IGameRecord;
  showSecondary?: boolean;
  CustomSecondary?: typeof React.Component;
  /** if not specified, will be looked up from game */
  cave?: ICaveRecord;

  vertical?: boolean;
}

interface IDerivedProps extends IActionsInfo {
  animate: boolean;
  platform: string;
  platformCompatible: boolean;
  progress: number;
  cancellable: boolean;
  cave: ICaveRecord;
  pressDownload: boolean;
  update: IGameUpdate;
}

interface IHappenings {
  game: IGameRecord;
  cave: ICaveRecord;
  downloadKeys: {
    [id: string]: IDownloadKey;
  };
  tasks: ITask[];
  downloads: IDownloadItem[];
  meId: number;
  mePress: boolean;
  gameUpdates: IGameUpdatesState;
}

export default connect<IProps>(GameActions, {
  state: () => {
    // FIXME: squash code complexity
    const selector = createSelector(
      createStructuredSelector({
        game: (state: IAppState, props: IProps) => props.game,
        // TODO db
        cave: (state: IAppState, props: IProps) => props.cave /* || state.globalMarket.cavesByGameId[props.game.id] */,
        // TODO db
        downloadKeys: (state: IAppState, props: IProps) => ({}) /* state.market.downloadKeys */,
        tasks: (state: IAppState, props: IProps) => state.tasks.tasksByGameId[props.game.id],
        downloads: (state: IAppState, props: IProps) => state.downloads.downloadsByGameId[props.game.id],
        meId: (state: IAppState, props: IProps) => (state.session.credentials.me || { id: "anonymous" }).id,
        mePress: (state: IAppState, props: IProps) =>
          (state.session.credentials.me || { pressUser: false }).pressUser,
        gameUpdates: (state: IAppState, props: IProps) => state.gameUpdates,
      }),
      (happenings: IHappenings) => {
        const { game, cave, downloadKeys, tasks, downloads, meId, mePress, gameUpdates } = happenings;

        const animate = false;
        let action = actionForGame(game, cave);

        const platformCompatible = (action === "open" ? true : isPlatformCompatible(game));
        const cancellable = false;
        const downloadKey = findWhere(downloadKeys, { gameId: game.id });
        const hasMinPrice = game.minPrice > 0;
        const hasDemo = game.hasDemo;

        // FIXME game admins
        const canEdit = game.userId === meId;
        let mayDownload = !!(downloadKey || !hasMinPrice || canEdit || hasDemo);
        let pressDownload = false;
        if (!mayDownload) {
          pressDownload = (game.inPressSystem && mePress);
          if (pressDownload) {
            mayDownload = true;
          }
        }
        const canBeBought = game.canBeBought;

        let update: IGameUpdate;
        if (cave) {
          update = gameUpdates.updates[cave.id];
        }

        return {
          cancellable,
          cave,
          update,
          animate,
          mayDownload,
          canBeBought,
          downloadKey,
          pressDownload,
          platform,
          platformCompatible,
          action,
          downloads,
          tasks,
        };
      },
    );

    return selector;
  },
});
