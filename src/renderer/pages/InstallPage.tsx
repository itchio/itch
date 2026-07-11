import * as messages from "common/butlerd/messages";
import { Dispatch } from "common/types";
import { ambientTab, urlForGame } from "common/util/navigation";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import {
  dispatchTabEvolve,
  dispatchTabPageUpdate,
} from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { actions } from "common/actions";
import { rendererLogger } from "renderer/logger";

const logger = rendererLogger.child("InstallPage");

class InstallPage extends React.PureComponent<Props> {
  override componentDidMount() {
    const { dispatch, url, gameId } = this.props;
    if (url) {
      dispatch(actions.handleItchioURI({ uri: url }));
    } else {
      logger.warn("no URL for install page tab, not handling itchio URI");
    }
    if (gameId === undefined) {
      // previously this navigated to itch://games/NaN
      logger.warn(
        "missing or unparseable game_id in install page URL, not navigating"
      );
      return;
    }
    dispatchTabEvolve(this.props, {
      url: urlForGame(gameId),
      replace: true,
    });
  }

  override render(): React.ReactNode {
    return null;
  }
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;

  url: string | undefined;
  gameId: number | undefined;
}

export default withTab(
  hookWithProps(InstallPage)((map) => ({
    url: map((rs, props) => ambientTab(rs, props).location?.url),
    gameId: map((rs, props) => {
      const raw = ambientTab(rs, props).location?.query.game_id;
      if (!raw) {
        return undefined;
      }
      const gameId = parseInt(raw, 10);
      return Number.isNaN(gameId) ? undefined : gameId;
    }),
  }))(InstallPage)
);
