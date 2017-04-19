
import * as React from "react";
import {connect, I18nProps} from "./connect";

import urls from "../constants/urls";
import * as actions from "../actions";

// TODO: GameFilters doesn't belong in Collections view
import GameFilters from "./game-filters";

import {dispatcher} from "../constants/action-types";

import CollectionsGrid from "./collections-grid";

export class Collections extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, navigate} = this.props;

    const tab = "collections";

    return <div className="collections-meat">
      <GameFilters tab={tab} showBinaryFilters={false} showLayoutPicker={false}>
        <span className="link" onClick={(e) => navigate(`url/${urls.myCollections}`)}>
          {t("outlinks.manage_collections")}
        </span>
      </GameFilters>
      <CollectionsGrid/>
    </div>;
  }
}

interface IProps {}

interface IDerivedProps {
  navigate: typeof actions.navigate;
}

export default connect<IProps>(Collections, {
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
