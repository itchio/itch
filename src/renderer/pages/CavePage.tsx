import { messages } from "common/butlerd";
import butlerCaller from "renderer/hocs/butlerCaller";
import { ambientTab } from "common/util/navigation";
import React from "react";
import { Dispatch } from "redux";
import { hookWithProps } from "renderer/hocs/hook";
import { withTab } from "renderer/hocs/withTab";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { dispatchTabEvolve } from "renderer/hocs/tab-utils";
import { mcall } from "main/butlerd/mcall";
import { actions } from "common/actions";

const FetchCave = butlerCaller(messages.FetchCave);

class CavePage extends React.PureComponent<Props> {
  render() {
    const { caveId } = this.props;

    return (
      <FetchCave
        params={{ caveId }}
        loadingHandled
        render={this.renderFetchContents}
        onResult={this.onResult}
      />
    );
  }

  renderFetchContents = FetchCave.renderCallback(({ loading }) => (
    <FiltersContainer loading={loading} />
  ));

  onResult = FetchCave.onResultCallback((result) => {
    if (result) {
      const { cave } = result;
      if (cave && cave.game) {
        this.props.dispatch(actions.queueLaunch({ cave }));
        dispatchTabEvolve(this.props, {
          replace: true,
          url: cave.game.url,
          resource: `games/${cave.game.id}`,
        });
      } else {
        // TODO: handle caves not found, etc.
      }
    }
  });
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;

  caveId: string;
  actionName: string;
}

export default withTab(
  hookWithProps(CavePage)((map) => ({
    caveId: map((rs, props) => ambientTab(rs, props).location.firstPathElement),
    actionName: map(
      (rs, props) => ambientTab(rs, props).location.secondPathElement
    ),
  }))(CavePage)
);
