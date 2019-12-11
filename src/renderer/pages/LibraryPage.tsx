import { messages } from "common/butlerd";
import React, { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Container } from "renderer/basics/Container";
import { ErrorState } from "renderer/basics/ErrorState";
import { useProfile, useSocket } from "renderer/contexts";
import { GameGrid } from "renderer/pages/GameGrid";
import { Call } from "renderer/use-butlerd";
import styled from "styled-components";
import { fontSizes, mixins } from "renderer/theme";
import { Icon } from "renderer/basics/Icon";
import { Collection } from "common/butlerd/messages";

const LibraryLayout = styled.div`
  display: flex;
  flex-direction: row;
  max-height: 100%;

  .sidebar {
    width: 280px;
    font-size: ${fontSizes.large};
    background: rgba(255, 255, 255, 0.05);
    border-right: 1px solid rgba(255, 255, 255, 0.06);

    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;

    .separator {
      height: 2px;
      width: 100%;
      background: rgba(255, 255, 255, 0.2);
    }

    .heading {
      padding: 1.4em;
      text-transform: uppercase;
      font-size: ${fontSizes.small};
      font-weight: bold;

      background: rgba(255, 255, 255, 0.1);
    }

    .item {
      display: flex;
      flex-direction: row;
      align-items: center;

      padding: 1.2em 0.4em;
      font-size: ${fontSizes.normal};

      .title {
        ${mixins.singleLine};
      }

      .count {
        flex-shrink: 0;
        margin-left: 1em;
        font-size: ${fontSizes.small};
        background: rgba(0, 0, 0, 0.4);
        color: ${p => p.theme.colors.text2};
        padding: 4px;
        border-radius: 2px;
      }

      .filler {
        flex-grow: 1;
        flex-shrink: 0;
        flex-basis: 4px;
      }

      .icon {
        flex-shrink: 0;
        display: inline-block;
        width: 45px;
        text-align: center;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.07);
      }
    }
  }

  .main {
    flex-grow: 1;
  }

  & > .main,
  & > .sidebar {
    overflow-y: auto;
  }
`;

export const LibraryPage = () => {
  const profile = useProfile();
  if (!profile) {
    return (
      <ErrorState
        error={new Error("Missing profile - this should never happen")}
      />
    );
  }

  return (
    <LibraryLayout>
      <div className="sidebar">
        <div className="item">
          <Icon icon="search" />
          Search
        </div>
        <div className="heading">
          <FormattedMessage id="sidebar.category.basics" />
        </div>
        <div className="item">
          <Icon icon="install" />
          Installed items
        </div>
        <div className="item">
          <Icon icon="heart-filled" />
          Owned items
        </div>
        <div className="item">
          <Icon icon="rocket" />
          Dashboard
        </div>
        <div className="separator" />
        <div className="heading">
          <FormattedMessage id="sidebar.collections" />
        </div>
        <CollectionList />
      </div>
      <Container className="main">
        <h2>
          <FormattedMessage id="sidebar.installed" />
        </h2>
        <Call
          rc={messages.FetchCaves}
          params={{ limit: 15 }}
          render={({ items }) => (
            <GameGrid items={items} getGame={cave => cave.game} />
          )}
        />

        <h2>
          <FormattedMessage id="sidebar.owned" />
        </h2>
        <Call
          rc={messages.FetchProfileOwnedKeys}
          params={{ profileId: profile.id, limit: 15 }}
          render={({ items }) => (
            <GameGrid items={items} getGame={key => key.game} />
          )}
        />
      </Container>
    </LibraryLayout>
  );
};

const CollectionList = (props: {}) => {
  const profile = useProfile();
  const socket = useSocket();
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    (async () => {
      let { items } = await socket.call(messages.FetchProfileCollections, {
        profileId: profile!.id,
        sortBy: "updatedAt",
      });
      console.log(items);
      setCollections(items);
    })();
  }, []);

  return (
    <>
      {collections.map(c => {
        return (
          <div className="item" key={c.id}>
            <Icon icon="tag" />
            <span className="title">{c.title}</span>
            {c.gamesCount && <span className="count">{c.gamesCount}</span>}
          </div>
        );
      })}
    </>
  );
};

export default LibraryPage;
