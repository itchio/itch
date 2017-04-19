
import {} from "redux-actions";

import * as React from "react";
import * as classNames from "classnames";

import {connect, I18nProps} from "../connect";
import {createSelector, createStructuredSelector} from "reselect";

import {findWhere, first} from "underscore";

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

class GameActions extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {props} = this;
    const {showSecondary, CustomSecondary} = props;

    const classes = classNames("game-actions", `action-${props.action}`, `task-${props.task}`, {
      incompatible: !props.platformCompatible,
      uninstalled: !props.cave,
    });

    return <div className={classes}>
      <MainAction {...props}/>
      {showSecondary
        ? <SecondaryActions {...props}/>
        : ""}
      {CustomSecondary
        ? <CustomSecondary {...props}/>
        : ""}
    </div>;
  }

}

interface IProps {
  game: IGameRecord;
  showSecondary?: boolean;
  CustomSecondary?: typeof React.Component;
  /** if not specified, will be looked up from game */
  cave?: ICaveRecord;
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
  task: ITask;
  download: IDownloadItem;
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
        cave: (state: IAppState, props: IProps) => props.cave || state.globalMarket.cavesByGameId[props.game.id],
        downloadKeys: (state: IAppState, props: IProps) => state.market.downloadKeys,
        task: (state: IAppState, props: IProps) => first(state.tasks.tasksByGameId[props.game.id]),
        download: (state: IAppState, props: IProps) => state.downloads.downloadsByGameId[props.game.id],
        meId: (state: IAppState, props: IProps) => (state.session.credentials.me || { id: "anonymous" }).id,
        mePress: (state: IAppState, props: IProps) =>
          (state.session.credentials.me || { pressUser: false }).pressUser,
        gameUpdates: (state: IAppState, props: IProps) => state.gameUpdates,
      }),
      (happenings: IHappenings) => {
        const { game, cave, downloadKeys, task, download, meId, mePress, gameUpdates } = happenings;

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

        const downloading = download && !download.finished;

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
          task: (task ? task.name : (downloading ? "download" : (cave ? "idle" : null))),
          progress: (task ? task.progress : (downloading ? download.progress : 0)),
        };
      },
    );

    return selector;
  },
});
