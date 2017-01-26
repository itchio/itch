
import * as React from "react";
import {connect} from "./connect";
import {createSelector, createStructuredSelector} from "reselect";
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
  render () {
    const {t, collections, hiddenCount, navigate} = this.props;

    const tab = "collections";

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
        {map(collections, (collection) =>
          <CollectionHubItem key={collection.id} collection={collection}/>,
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
  collections: ICollectionRecord[];
  hiddenCount: number;

  t: ILocalizer;

  navigate: typeof actions.navigate;
}

const mapStateToProps = () => {
  const getCollections = (state: IState, props: ICollectionsProps) => state.market.collections || {};
  const getFilterQuery = (state: IState, props: ICollectionsProps) => state.session.navigation.filters.collections;

  const getSortedCollections = createSelector(
    getCollections,
    (collections) => {
      return sortBy(collections, recency);
    },
  );

  const fuse = new Fuse([], {
    keys: [
      { name: "title", weight: 1.0 },
    ],
    threshold: 0.4,
  });

  const getFilteredCollections = createSelector(
    getSortedCollections,
    getFilterQuery,
    (sortedCollections, filterQuery) => {
      if (filterQuery) {
        fuse.set(sortedCollections);
        const filteredCollections = fuse.search(filterQuery);
        return {
          collections: filteredCollections,
          hiddenCount: sortedCollections.length - filteredCollections.length,
        };
      } else {
        return {
          collections: sortedCollections,
          hiddenCount: 0,
        };
      }
    },
  );

  return getFilteredCollections;
};

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  navigate: dispatcher(dispatch, actions.navigate),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Collections);
