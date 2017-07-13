import * as React from "react";
import { connect } from "./connect";

import { map } from "underscore";
import * as actions from "../actions";

import { ICollectionSet } from "../types";
import { dispatcher } from "../constants/action-types";

import { fromJSONField } from "../db/json-field";

export class CollectionGrid extends React.PureComponent<
  IProps & IDerivedProps
> {
  render() {
    const { collections } = this.props;
    const { navigate } = this.props;

    return (
      <div>
        {map(collections, collection => {
          const { id, title } = collection;

          return (
            <div
              key={id}
              className="collection-hub-item"
              onClick={() => navigate(`collections/${id}`)}
            >
              {title} ({fromJSONField<number[]>(collection.gameIds, []).length})
            </div>
          );
        })}
      </div>
    );
  }
}

interface IProps {
  collections: ICollectionSet;
}

interface IDerivedProps {
  navigate: typeof actions.navigate;
}

export default connect<IProps>(CollectionGrid, {
  dispatch: dispatch => ({
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
