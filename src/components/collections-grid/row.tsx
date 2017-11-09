import * as React from "react";

import format from "../format";

import { map, each, filter } from "underscore";

import Icon from "../basics/icon";
import TimeAgo from "../basics/time-ago";
import Cover from "../basics/cover";
import Hoverable from "../basics/hover-hoc";

import { IGameSet } from "../../types";
import { ICollection } from "../../db/models/collection";
import { GAMES_SHOWN_PER_COLLECTION } from "../../fetchers/constants";

const emptyArr = [];

const HoverCover = Hoverable(Cover);

export default class CollectionRow extends React.PureComponent<IProps> {
  render() {
    const { allGames, collection } = this.props;
    const { title } = collection;

    const gameIds = (collection.gameIds || emptyArr)
      .slice(0, GAMES_SHOWN_PER_COLLECTION);
    const games = filter(map(gameIds, gameId => allGames[gameId]), x => !!x);

    const gameItems = map(games, (game, index) => {
      const { coverUrl, stillCoverUrl } = game;
      return (
        <HoverCover
          key={game.id}
          className="fresco--cover"
          coverUrl={coverUrl}
          stillCoverUrl={stillCoverUrl}
          gameId={game.id}
        />
      );
    });

    const cols: JSX.Element[] = [];
    each(gameItems, (item, i) => {
      cols.push(item);
    });

    const itemCount = (collection.gameIds || []).length;

    const { index, rowHeight, interiorPadding, globalPadding } = this.props;

    const translateY = Math.round(
      globalPadding + index * (rowHeight + interiorPadding)
    );
    const style: React.CSSProperties = {
      transform: `translateY(${translateY}px)`,
    };

    return (
      <div
        data-collection-id={collection.id}
        className="grid--row"
        style={style}
      >
        <section className="title">{title}</section>
        <section className="info">
          <Icon icon="tag" />
          <span className="total">
            {format(["collection.summary", { itemCount }])}
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
        <section className="fresco">{cols}</section>
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
