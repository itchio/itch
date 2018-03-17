import * as React from "react";

import format from "../format";

import { map, each } from "underscore";

import Icon from "../basics/icon";
import TimeAgo from "../basics/time-ago";
import Cover from "../basics/cover";
import Hoverable from "../basics/hover-hoc";

import { Collection } from "../../buse/messages";

const HoverCover = Hoverable(Cover);

export default class CollectionRow extends React.PureComponent<IProps> {
  render() {
    const { collection } = this.props;
    const { title } = collection;

    const games = map(collection.collectionGames, cg => cg.game);

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

    const itemCount = collection.gamesCount;

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
  collection: Collection;

  index: number;
  rowHeight: number;
  interiorPadding: number;
  globalPadding: number;
}
