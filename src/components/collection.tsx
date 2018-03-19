import * as React from "react";

import Games from "./games";
import GameFilters from "./game-filters";
import IconButton from "./basics/icon-button";

import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";
import { connect, Dispatchers } from "./connect";

import { actions } from "../actions";
import { Space } from "../helpers/space";
import urls from "../constants/urls";
import BrowserControls from "./browser-controls";

const CollectionDiv = styled.div`
  ${styles.meat()};
`;

class Collection extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tab, tabInstance, loading } = this.props;

    return (
      <CollectionDiv>
        <GameFilters
          loading={loading}
          tab={tab}
          before={
            <BrowserControls
              tab={tab}
              tabInstance={tabInstance}
              url=""
              loading={loading}
            />
          }
        >
          <IconButton
            icon="redo"
            hint={["browser.popout"]}
            hintPosition="bottom"
            onClick={this.popOutBrowser}
          />
        </GameFilters>
        <Games tab={tab} />
      </CollectionDiv>
    );
  }

  popOutBrowser = () => {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const c = sp.collection();
    if (c) {
      // fill in a dummy slug, the app will redirect
      let url = `${urls.itchio}/c/${c.id}/hello`;
      this.props.openInExternalBrowser({ url });
    }
  };
}

interface IProps extends IMeatProps {}

const actionCreators = {
  openInExternalBrowser: actions.openInExternalBrowser,
};

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(Collection, { actionCreators });
