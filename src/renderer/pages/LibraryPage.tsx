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
import {
  Collection,
  FetchCollectionGamesParams,
  CollectionGame,
  FetchProfileCollectionsParams,
  DownloadKey,
} from "common/butlerd/messages";
import classNames from "classnames";
import { Spinner } from "renderer/basics/LoadingCircle";

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

      background: rgba(255, 255, 255, 0.05);
    }

    .item {
      cursor: pointer;
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
        background: rgba(255, 255, 255, 0.04);
      }

      &.active {
        background: #7b3232;
      }
    }
  }

  .main {
    flex-grow: 1;

    h2 {
      font-size: ${fontSizes.large};

      position: sticky;
      top: 0;
      display: flex;
      flex-direction: row;
      align-items: center;

      background: ${p => p.theme.colors.shellBg};
      border-bottom: 1px solid ${p => p.theme.colors.shellBorder};
      z-index: 2;
      margin-bottom: 1em;

      .filler {
        flex-grow: 1;
      }

      .spinner {
        margin-left: 1em;
      }
    }
  }

  & > .main {
    overflow-y: scroll;
  }

  & > .sidebar {
    overflow-y: auto;
  }
`;

type ViewTarget =
  | ViewTargetInstalled
  | ViewTargetOwned
  | ViewTargetDashboard
  | ViewTargetCollection;

interface ViewTargetInstalled {
  type: "installed";
}

interface ViewTargetOwned {
  type: "owned";
}

interface ViewTargetDashboard {
  type: "dashboard";
}

interface ViewTargetCollection {
  type: "collection";
  collection: Collection;
}

interface ItemProps {
  className: string;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

function makeItemProps(
  currentTarget: ViewTarget,
  setTarget: (vt: ViewTarget) => void
): (itemTarget: ViewTarget) => ItemProps {
  return (itemTarget: ViewTarget) => {
    let active = true;

    let a = currentTarget as Record<string, any>;
    let b = itemTarget as Record<string, any>;

    for (const k of Object.keys(b)) {
      if (a[k] !== b[k]) {
        active = false;
        break;
      }
    }

    return {
      className: classNames("item", { active }),
      onClick: () => setTarget(itemTarget),
    };
  };
}

export const LibraryPage = () => {
  const [target, setTarget] = useState<ViewTarget>({ type: "installed" });
  let iprops = makeItemProps(target, setTarget);

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
        <div {...iprops({ type: "installed" })}>
          <Icon icon="install" />
          <FormattedMessage id="sidebar.installed" />
        </div>
        <div {...iprops({ type: "owned" })}>
          <Icon icon="heart-filled" />
          <FormattedMessage id="sidebar.owned" />
        </div>
        <div {...iprops({ type: "dashboard" })}>
          <Icon icon="rocket" />
          <FormattedMessage id="sidebar.dashboard" />
        </div>
        <div className="separator" />
        <div className="heading">
          <FormattedMessage id="sidebar.collections" />
        </div>
        <CollectionList target={target} setTarget={setTarget} />
      </div>
      <Container className="main">
        <ViewContents target={target} />
      </Container>
    </LibraryLayout>
  );
};

const ViewContents = (props: { target: ViewTarget }) => {
  const { target } = props;

  switch (target.type) {
    case "installed":
      return <ViewInstalled />;
    case "owned":
      return <ViewOwned />;
    case "dashboard":
      return <ViewDashboard />;
    case "collection":
      return <ViewCollection collection={target.collection} />;
  }
};

const ViewInstalled = () => {
  return (
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
    </Container>
  );
};

const ViewOwned = () => {
  const profile = useProfile();
  const socket = useSocket();
  let [loading, setLoading] = useState(true);
  let [items, setItems] = useState<DownloadKey[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let params: FetchProfileCollectionsParams = {
          profileId: profile!.id,
        };

        let res = await socket.call(messages.FetchProfileOwnedKeys, params);
        setItems(res.items);

        params.fresh = true;
        res = await socket.call(messages.FetchProfileOwnedKeys, params);
        setItems(res.items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <h2>
        <FormattedMessage id="sidebar.owned" />
      </h2>
      <Call
        rc={messages.FetchProfileOwnedKeys}
        params={{ profileId: profile!.id, limit: 15 }}
        render={({ items }) => (
          <GameGrid items={items} getGame={key => key.game} />
        )}
      />
    </>
  );
};

const ViewDashboard = () => {
  const profile = useProfile();
  return (
    <>
      <h2>
        <FormattedMessage id="sidebar.dashboard" />
      </h2>
      <Call
        rc={messages.FetchProfileGames}
        params={{ profileId: profile!.id, limit: 15 }}
        render={({ items }) => (
          <GameGrid items={items} getGame={key => key.game} />
        )}
      />
    </>
  );
};

const ViewCollection = (props: { collection: Collection }) => {
  const socket = useSocket();
  let [loading, setLoading] = useState(true);
  let [items, setItems] = useState<CollectionGame[]>([]);

  const c = props.collection;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let params: FetchCollectionGamesParams = {
          profileId: profile!.id,
          collectionId: c.id,
          limit: 200,
        };

        let res = await socket.call(messages.FetchCollectionGames, params);
        setItems(res.items);

        params.fresh = true;
        res = await socket.call(messages.FetchCollectionGames, params);
        setItems(res.items);
      } finally {
        setLoading(false);
      }
    })();
  }, [props.collection.id]);

  const profile = useProfile();
  return (
    <>
      <h2>
        {c.title} {loading && <Spinner />}
      </h2>
      <GameGrid items={items} getGame={key => key.game} />
    </>
  );
};

const CollectionList = (props: {
  target: ViewTarget;
  setTarget: (vt: ViewTarget) => void;
}) => {
  const iprops = makeItemProps(props.target, props.setTarget);

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
          <div key={c.id} {...iprops({ type: "collection", collection: c })}>
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
