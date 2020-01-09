import { GameRecord } from "common/butlerd/messages";
import React from "react";
import styled from "styled-components";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { Button } from "renderer/basics/Button";
import { FormattedMessage } from "react-intl";

interface Props {
  records: GameRecord[];
  setRecords: React.Dispatch<React.SetStateAction<GameRecord[]>>;
}

const coverWidth = 300;
const coverHeight = 215;
const rowHeight = 35;

const GameListDiv = styled.div`
  .row {
    height: ${rowHeight}px;
    display: flex;
    align-items: center;
    text-align: left;
    margin: 4px 0;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-left: none;
      border-right: none;
    }

    &.header {
      font-weight: bold;
    }
  }

  .cover,
  .status,
  .installed {
    margin-right: 1em;
  }

  .cover {
    width: ${(rowHeight / coverHeight) * coverWidth}px;
    height: ${rowHeight}px;
  }

  .status {
    flex-basis: 100px;
  }

  .installed {
    flex-basis: 100px;
  }

  .title {
    flex-grow: 1;
    color: inherit;
  }

  a {
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .controls {
    flex-basis: 200px;
  }
`;

const CompactButton = styled(Button)`
  padding: 4px 1em;
  min-width: initial;
  min-height: initial;
`;

export const GameList = (props: Props) => {
  return (
    <GameListDiv>
      <div className="row header">
        <div className="cover"></div>
        <div className="title">Title</div>
        <div className="status">Status</div>
        <div className="installed">Installed</div>
        <div className="controls"></div>
      </div>
      {props.records.map(r => {
        return (
          <div className="row" key={r.id}>
            <img className="cover" src={r.cover} />
            <a className="title" href={`itch://games/${r.id}`}>
              {r.title}
            </a>
            <div className="status">{r.owned ? "Owned" : null}</div>
            <div className="installed">
              {r.installedAt ? <TimeAgo date={r.installedAt} /> : null}
            </div>
            <div className="controls">
              <CompactButton
                label={<FormattedMessage id="grid.item.install" />}
              ></CompactButton>
            </div>
          </div>
        );
      })}
    </GameListDiv>
  );
};
