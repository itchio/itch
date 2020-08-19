import { actions } from "common/actions";
import { Dispatch } from "common/types";
import { ambientTab, ambientWind } from "common/util/navigation";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import IconButton from "renderer/basics/IconButton";
import { hookWithProps } from "renderer/hocs/hook";
import { withTab } from "renderer/hocs/withTab";

class BrowserBar extends React.PureComponent<Props> {
  render() {
    const { loading } = this.props;
    return (
      <FiltersContainer loading={loading}>
        <IconButton icon="more_vert" onClick={this.onMore} />
      </FiltersContainer>
    );
  }

  onMore = (ev: React.MouseEvent<HTMLElement>) => {
    const { dispatch, tab, url } = this.props;
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
              url,
            }),
          },
          {
            type: "separator",
          },
          {
            localizedLabel: ["browser.open_devtools"],
            action: actions.openDevTools({
              wind: ambientWind(),
              tab,
            }),
          },
        ],
      })
    );
  };
}

interface Props {
  tab: string;
  dispatch: Dispatch;

  url: string;
  loading: boolean;
}

export default withTab(
  hookWithProps(BrowserBar)((map) => ({
    url: map((rs, props) => ambientTab(rs, props).location.url),
    loading: map((rs, props) => ambientTab(rs, props).loading),
  }))(BrowserBar)
);
