import * as React from "react";

import { connect } from "./connect";
import format from "./format";

import { map, each, filter } from "underscore";

import { whenClickNavigates } from "./when-click-navigates";

import * as actions from "../actions";

import Icon from "./basics/icon";
import TimeAgo from "./basics/time-ago";
import Ink = require("react-ink");

import { IGameSet } from "../types";
import { ICollection } from "../db/models/collection";
import { fromJSONField } from "../db/json-field";
import { multiDispatcher } from "../constants/action-types";

import styled, * as styles from "./styles";

const CoverDiv = styled.div`
  background-size: cover;
  background-position: 50% 50%;
`;

const CollectionRowDiv = styled.div`
  ${styles.inkContainer()} ${styles.hubItemStyle()};

  height: 100%;
  display: flex;
  flex-direction: column;
  filter: brightness(80%);
  transition: filter 0.1s ease-in-out;

  &:hover {
    filter: brightness(100%);
    cursor: pointer;
  }

  .title {
    padding: 12px 6px 6px 8px;
    flex-shrink: 0;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 0;
  }

  .fresco {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    overflow-x: hidden;
    position: relative;

    padding: 5px;

    .cover {
      width: 207px;
      margin-right: 7px;
      flex-shrink: 0;
      padding-bottom: 0;
    }
  }

  .info {
    flex-shrink: 0;
    padding: 6px;
    color: $secondary-text-color;

    display: flex;

    .icon {
      margin-right: 7px;
      flex-shrink: 0;
    }

    .spacer {
      flex-grow: 1;
    }

    .nice-ago {
      margin-left: 5px;
    }
  }
`;

const emptyArr = [];

export class CollectionRow extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { allGames, collection } = this.props;
    const { title } = collection;

    const gameIds = fromJSONField<number[]>(collection.gameIds, emptyArr).slice(
      0,
      8,
    );
    const games = filter(map(gameIds, gameId => allGames[gameId]), x => !!x);

    const gameItems = map(games, (game, index) => {
      const style: React.CSSProperties = {};
      const coverUrl = game.stillCoverUrl || game.coverUrl;
      if (coverUrl) {
        style.backgroundImage = `url('${coverUrl}')`;
      }
      return <CoverDiv key={index} className="cover" style={style} />;
    });

    const cols: JSX.Element[] = [];
    each(gameItems, (item, i) => {
      cols.push(item);
    });

    const itemCount = (collection.gameIds || []).length;

    return (
      <CollectionRowDiv
        className="hub-item collection-hub-item"
        onMouseDown={this.onMouseDown}
      >
        <section className="title">
          {title}
        </section>
        <section className="fresco">
          {cols}
        </section>
        <section className="info">
          <Icon icon="tag" />
          <span className="total">
            {format(["sidebar.collection.subtitle", { itemCount }])}
          </span>
          <span className="spacer" />
          <Icon icon="history" />
          {format([
            "collection_grid.item.updated_at",
            {
              time_ago: <TimeAgo key="timeago" date={collection.updatedAt} />,
            },
          ])}
        </section>
        <Ink />
      </CollectionRowDiv>
    );
  }

  onMouseDown = (e: React.MouseEvent<any>) => {
    const { navigateToCollection, collection } = this.props;
    whenClickNavigates(e, ({ background }) => {
      navigateToCollection(collection, background);
    });
  };
}

interface IProps {
  collection: ICollection;
  allGames: IGameSet;
}

interface IDerivedProps {
  navigateToCollection: typeof actions.navigateToCollection;
}

export default connect<IProps>(CollectionRow, {
  dispatch: dispatch => ({
    navigateToCollection: multiDispatcher(
      dispatch,
      actions.navigateToCollection,
    ),
  }),
});
