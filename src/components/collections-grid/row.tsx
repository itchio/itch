import * as React from "react";

import format from "../format";

import { map, each, filter } from "underscore";

import Icon from "../basics/icon";
import TimeAgo from "../basics/time-ago";

import { IGameSet } from "../../types";
import { ICollection } from "../../db/models/collection";
import { fromJSONField } from "../../db/json-field";

const emptyArr = [];

export default class CollectionRow extends React.PureComponent<IProps> {
  render() {
    const { allGames, collection } = this.props;
    const { title } = collection;

    const gameIds = fromJSONField<number[]>(collection.gameIds, emptyArr).slice(
      0,
      8,
    );
    const games = filter(map(gameIds, gameId => allGames[gameId]), x => !!x);

    const gameItems = map(games, (game, index) => {
      const coverUrl = game.stillCoverUrl || game.coverUrl;
      return <img className="fresco--cover" key={index} src={coverUrl} />;
    });

    const cols: JSX.Element[] = [];
    each(gameItems, (item, i) => {
      cols.push(item);
    });

    const itemCount = (collection.gameIds || []).length;

    const { index, rowHeight, interiorPadding, globalPadding } = this.props;

    const style: React.CSSProperties = {
      transform: `translateY(${globalPadding +
        index * (rowHeight + interiorPadding)}px)`,
    };

    return (
      <div
        data-collection-id={collection.id}
        className="grid--row"
        style={style}
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
      </div>
    );
  }
}

interface IProps {
  collection: ICollection;
  allGames: IGameSet;

  index: number;
  rowHeight: number;
  interiorPadding: number;
  globalPadding: number;
}
