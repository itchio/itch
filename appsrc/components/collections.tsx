
import * as React from "react";
import {connect} from "./connect";

import urls from "../constants/urls";
import * as actions from "../actions";

// TODO: GameFilters doesn't belong in Collections view
import GameFilters from "./game-filters";

import {IDispatch, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

import CollectionsGrid from "./collections-grid";

export class Collections extends React.Component<ICollectionsProps> {
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

interface ICollectionsProps {
  // derived
  t: ILocalizer;

  navigate: typeof actions.navigate;
}

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  navigate: dispatcher(dispatch, actions.navigate),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Collections);
