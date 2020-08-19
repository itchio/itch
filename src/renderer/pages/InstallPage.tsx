import { messages } from "common/butlerd";
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

class InstallPage extends React.PureComponent<Props> {
  componentDidMount() {
    const { dispatch, url, gameId } = this.props;
    dispatch(actions.handleItchioURI({ uri: url }));
    dispatchTabEvolve(this.props, {
      url: urlForGame(gameId),
      replace: true,
    });
  }

  render() {
    return null;
  }
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;

  url: string;
  gameId: number;
}

export default withTab(
  hookWithProps(InstallPage)((map) => ({
    url: map((rs, props) => ambientTab(rs, props).location.url),
    gameId: map((rs, props) =>
      parseInt(ambientTab(rs, props).location.query.game_id, 10)
    ),
  }))(InstallPage)
);
