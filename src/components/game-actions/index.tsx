
import * as React from "react";
import * as classNames from "classnames";

import {connect, I18nProps} from "../connect";
import {createSelector, createStructuredSelector} from "reselect";

import {size} from "underscore";

import * as os from "../../os";

import actionForGame from "../../util/action-for-game";
import isPlatformCompatible from "../../util/is-platform-compatible";

import MainAction from "./main-action";
import SecondaryActions from "./secondary-actions";

import {IActionsInfo} from "./types";
import GameModel from "../../db/models/game";
import {ICaveSummary} from "../../db/models/cave";
import {IDownloadKeySummary} from "../../db/models/download-key";
import getByIds from "../../db/get-by-ids";

import {
  IAppState,
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

class GameActions extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
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
  game: GameModel;
  showSecondary?: boolean;
  CustomSecondary?: typeof React.Component;
  cave?: ICaveSummary;

  vertical?: boolean;
}

interface IDerivedProps extends IActionsInfo {
  animate: boolean;
  platform: string;
  platformCompatible: boolean;
  progress: number;
  cancellable: boolean;
  pressDownload: boolean;
  update: IGameUpdate;
}

interface IHappenings {
  game: GameModel;
  caves: ICaveSummary[];
  downloadKeys: IDownloadKeySummary[];
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
        caves: (state: IAppState, props: IProps) =>
          getByIds(state.commons.caves, state.commons.caveIdsByGameId[props.game.id]),
        downloadKeys: (state: IAppState, props: IProps) =>
          getByIds(state.commons.downloadKeys, state.commons.downloadKeyIdsByGameId[props.game.id]),
        tasks: (state: IAppState, props: IProps) => state.tasks.tasksByGameId[props.game.id],
        downloads: (state: IAppState, props: IProps) => state.downloads.downloadsByGameId[props.game.id],
        meId: (state: IAppState, props: IProps) => (state.session.credentials.me || { id: "anonymous" }).id,
        mePress: (state: IAppState, props: IProps) =>
          (state.session.credentials.me || { pressUser: false }).pressUser,
        gameUpdates: (state: IAppState, props: IProps) => state.gameUpdates,
      }),
      (happenings: IHappenings) => {
        const { game, caves, downloadKeys, tasks, downloads, meId, mePress, gameUpdates } = happenings;
        let cave;
        if (size(caves) > 0) {
          cave = caves[0];
        }

        const animate = false;
        let action = actionForGame(game, cave);

        const platformCompatible = (action === "open" ? true : isPlatformCompatible(game));
        const cancellable = false;

        let downloadKey;
        if (size(downloadKeys) > 0) {
          // TODO: ignore revoked ones
          downloadKey = downloadKeys[0];
        }
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
