
import {} from "redux-actions";

import * as React from "react";
import * as classNames from "classnames";

import {connect} from "../connect";
import {createSelector, createStructuredSelector} from "reselect";

import {findWhere, first} from "underscore";

import os from "../../util/os";

import actionForGame from "../../util/action-for-game";
import isPlatformCompatible from "../../util/is-platform-compatible";

import MainAction from "./main-action";
import SecondaryActions from "./secondary-actions";

import {IActionsInfo} from "./types";
import {ILocalizer} from "../../localizer";
import {
  IState, IGameRecord, ICaveRecord, IDownloadKey,
  IDownloadItem, ITask, IGameUpdate, IGameUpdatesState,
} from "../../types";

const platform = os.itchPlatform();

class GameActions extends React.Component<IGameActionsProps> {
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

interface IGameActionsProps extends IActionsInfo {
  // specified
  game: IGameRecord;
  showSecondary: boolean;
  CustomSecondary: typeof React.Component;

  // derived
  animate: boolean;
  platformCompatible: boolean;
  progress: number;
  cancellable: boolean;
  cave: ICaveRecord;

  t: ILocalizer;
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

const makeMapStateToProps = () => {
  const selector = createSelector(
    createStructuredSelector({
      game: (state: IState, props: IGameActionsProps) => props.game,
      cave: (state: IState, props: IGameActionsProps) => props.cave || state.globalMarket.cavesByGameId[props.game.id],
      downloadKeys: (state: IState, props: IGameActionsProps) => state.market.downloadKeys,
      task: (state: IState, props: IGameActionsProps) => first(state.tasks.tasksByGameId[props.game.id]),
      download: (state: IState, props: IGameActionsProps) => state.downloads.downloadsByGameId[props.game.id],
      meId: (state: IState, props: IGameActionsProps) => (state.session.credentials.me || {id: "anonymous"}).id,
      mePress: (state: IState, props: IGameActionsProps) =>
        (state.session.credentials.me || {pressUser: false}).pressUser,
      gameUpdates: (state: IState, props: IGameActionsProps) => state.gameUpdates,
    }),
    (happenings: IHappenings) => {
      const {game, cave, downloadKeys, task, download, meId, mePress, gameUpdates} = happenings;

      const animate = false;
      let action = actionForGame(game, cave);

      const platformCompatible = (action === "open" ? true : isPlatformCompatible(game));
      const cancellable = false;
      const downloadKey = findWhere(downloadKeys, {gameId: game.id});
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
        platform,
        mayDownload,
        canBeBought,
        downloadKey,
        pressDownload,
        platformCompatible,
        action,
        task: (task ? task.name : (downloading ? "download" : (cave ? "idle" : null))),
        progress: (task ? task.progress : (downloading ? download.progress : 0)),
      };
    },
  );

  return selector;
};

const mapDispatchToProps = () => ({});

export default connect(
  makeMapStateToProps,
  mapDispatchToProps,
)(GameActions);
