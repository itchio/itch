import { Space } from "common/helpers/space";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { withSpace } from "renderer/hocs/withSpace";
import IconButton from "renderer/basics/IconButton";
import { Dispatch } from "common/types";
import { hook } from "renderer/hocs/hook";
import { actions } from "common/actions";
import { ambientWind } from "common/util/navigation";

class BrowserBar extends React.PureComponent<Props> {
  render() {
    const { space } = this.props;
    return (
      <FiltersContainer loading={space.isLoading()}>
        <IconButton icon="more_vert" onClick={this.onMore} />
      </FiltersContainer>
    );
  }

  onMore = (ev: React.MouseEvent<HTMLElement>) => {
    const { dispatch, space } = this.props;
    const { clientX, clientY } = ev;
    dispatch(
      actions.popupContextMenu({
        wind: ambientWind(),
        clientX,
        clientY,
        template: [
          {
            localizedLabel: ["browser.popout"],
            action: actions.openInExternalBrowser({
              url: space.url(),
            }),
          },
          {
            type: "separator",
          },
          {
            localizedLabel: ["browser.open_devtools"],
            action: actions.openDevTools({
              wind: ambientWind(),
              tab: space.tab,
            }),
          },
        ],
      })
    );
  };
}

interface Props {
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(hook()(BrowserBar));
