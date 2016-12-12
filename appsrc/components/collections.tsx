
import * as React from "react";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";
import Fuse  = require("fuse.js");

import urls from "../constants/urls";
import * as actions from "../actions";

import {map, sortBy} from "underscore";

import GameGridFilters from "./game-grid-filters";
import CollectionHubItem from "./collection-hub-item";
import HubFiller from "./hub-filler";

import {IState, ICollectionRecord, ICollectionRecordSet} from "../types";
import {IAction, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

const recency = (x: ICollectionRecord) => x.updatedAt ? -(new Date(x.updatedAt)) : 0;

export class Collections extends React.Component<ICollectionsProps, void> {
  fuse: Fuse<ICollectionRecord>;

  constructor () {
    super();
    this.fuse = new Fuse([], {
      keys: [
        { name: "title", weight: 1.0 },
      ],
      threshold: 0.4,
    });
  }

  render () {
    const {t, filterQuery = "", collections, navigate} = this.props;

    const recentCollections = sortBy(collections, recency);
    const tab = "collections";

    this.fuse.set(recentCollections);
    const filteredCollections = (
      filterQuery.length > 0
      ? this.fuse.search(filterQuery)
      : recentCollections) as ICollectionRecord[];

    const hiddenCount = filteredCollections.length - recentCollections.length;

    const fillerItems: JSX.Element[] = [];
    for (let i = 0; i < 12; i++) {
      fillerItems.push(<HubFiller key={`filler-${i}`}/>);
    }

    return <div className="collections-meat">
      <GameGridFilters tab={tab} showBinaryFilters={false}>
        <span className="link" onClick={(e) => navigate(`url/${urls.myCollections}`)}>
          {t("outlinks.manage_collections")}
        </span>
      </GameGridFilters>
      <div className="hub-grid">
        {map(filteredCollections, (collection) =>
          <CollectionHubItem collection={collection}/>,
        )}
        {fillerItems}
        {hiddenCount > 0
        ? <div className="hidden-count">
          {t("grid.hidden_count", {count: hiddenCount})}
        </div>
    : ""}
      </div>
    </div>;
  }
}

interface ICollectionsProps {
  // derived
  collections: ICollectionRecordSet;
  filterQuery: string;

  t: ILocalizer;

  navigate: typeof actions.navigate;
}

const mapStateToProps = createStructuredSelector({
  collections: (state: IState) => state.market.collections || {},
  filterQuery: (state: IState) => state.session.navigation.filters.collections,
});

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  navigate: dispatcher(dispatch, actions.navigate),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Collections);
