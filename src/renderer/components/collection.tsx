import React from "react";

import Games from "./games";
import GameFilters from "./game-filters";
import IconButton from "./basics/icon-button";

import styled, * as styles from "./styles";
import { connect, Dispatchers } from "./connect";

import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import urls from "common/constants/urls";
import BrowserControls from "./browser-controls";
import { IMeatProps } from "renderer/components/meats/types";

const CollectionDiv = styled.div`
  ${styles.meat()};
`;

class Collection extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tabInstance, loading } = this.props;

    return (
      <CollectionDiv>
        <GameFilters
          loading={loading}
          before={
            <BrowserControls
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
        <Games />
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

export default connect<IProps>(
  Collection,
  { actionCreators }
);
