
import * as React from "react";
import {connect} from "./connect";

import {map} from "underscore";
import * as actions from "../actions";

import {ICollectionRecordSet} from "../types";
import {IDispatch, dispatcher} from "../constants/action-types";

export class CollectionGrid extends React.Component<ICollectionGridProps> {
  render () {
    const {collections} = this.props;
    const {navigate} = this.props;

    return <div>
      {map(collections, (collection) => {
        const {id, title} = collection;

        return <div key={id} className="collection-hub-item" onClick={() => navigate(`collections/${id}`)}>
          {title} ({(collection.gameIds || []).length})
        </div>;
      })}
    </div>;
  }
}

interface ICollectionGridProps {
  // specified
  collections: ICollectionRecordSet;

  // derived
  navigate: typeof actions.navigate;
}

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: IDispatch) => ({
  navigate: dispatcher(dispatch, actions.navigate),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectionGrid);
