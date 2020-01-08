import classNames from "classnames";
import { messages } from "common/butlerd";
import {
  Collection,
  FetchGameRecordsParams,
  GameRecord,
  GameRecordsSource,
} from "common/butlerd/messages";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { Container } from "renderer/basics/Container";
import { ErrorState } from "renderer/basics/ErrorState";
import { Icon } from "renderer/basics/Icon";
import { Spinner } from "renderer/basics/LoadingCircle";
import { useProfile, useSocket } from "renderer/contexts";
import { GameGrid } from "renderer/pages/GameGrid";
import { fontSizes, mixins } from "renderer/theme";
import styled from "styled-components";
import { IconButton } from "renderer/basics/IconButton";
import { GameList } from "renderer/pages/GameList";

const LibraryLayout = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 100%;
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

      padding: 1em 0.4em;
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
        background: ${p => p.theme.colors.activeBg};
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

type Source = SourceInstalled | SourceOwned | SourceProfile | SourceCollection;

interface SourceInstalled {
  source: GameRecordsSource.Installed;
}

interface SourceOwned {
  source: GameRecordsSource.Owned;
}

interface SourceProfile {
  source: GameRecordsSource.Profile;
}

interface SourceCollection {
  source: GameRecordsSource.Collection;
  collection: Collection;
}

interface ItemProps {
  className: string;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

function makeItemProps(
  currentSource: Source,
  setSource: (vt: Source) => void
): (itemSource: Source) => ItemProps {
  return (itemSource: Source) => {
    let active = true;

    let a = currentSource as Record<string, any>;
    let b = itemSource as Record<string, any>;

    for (const k of Object.keys(b)) {
      if (a[k] !== b[k]) {
        active = false;
        break;
      }
    }

    return {
      "data-source": itemSource.source,
      className: classNames("item", { active }),
      onClick: () => setSource(itemSource),
    };
  };
}

export const LibraryPage = () => {
  const [source, setSource] = useState<Source>({
    source: GameRecordsSource.Installed,
  });
  let iprops = makeItemProps(source, setSource);

  const profile = useProfile();
  if (!profile) {
    return (
      <ErrorState
        error={new Error("Missing profile - this should never happen")}
      />
    );
  }

  const mainRef = useRef<HTMLDivElement>(null);
  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [mainRef]);

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
        <div {...iprops({ source: GameRecordsSource.Installed })}>
          <Icon icon="install" />
          <FormattedMessage id="sidebar.installed" />
        </div>
        <div {...iprops({ source: GameRecordsSource.Owned })}>
          <Icon icon="heart-filled" />
          <FormattedMessage id="sidebar.owned" />
        </div>
        <div {...iprops({ source: GameRecordsSource.Profile })}>
          <Icon icon="rocket" />
          <FormattedMessage id="sidebar.dashboard" />
        </div>
        <div className="separator" />
        <div className="heading">
          <FormattedMessage id="sidebar.collections" />
        </div>
        <CollectionList source={source} setSource={setSource} />
      </div>
      <Container className="main" ref={mainRef}>
        <ViewContents source={source} scrollToTop={scrollToTop} />
      </Container>
    </LibraryLayout>
  );
};

const ViewContents = (props: { source: Source; scrollToTop: () => void }) => {
  const { source } = props;
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const profile = useProfile();
  const socket = useSocket();
  let [loading, setLoading] = useState(true);
  let [records, setRecords] = useState<GameRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // TODO: pagination

        setLoading(true);
        let params: FetchGameRecordsParams = {
          profileId: profile!.id,
          source: props.source.source,
          limit: 200,
          collectionId:
            source.source === GameRecordsSource.Collection
              ? source.collection.id
              : undefined,
        };

        let res = await socket.call(messages.FetchGameRecords, params);
        if (cancelled) {
          return;
        }
        props.scrollToTop();
        setRecords(res.records);

        if (res.stale) {
          params.fresh = true;
          res = await socket.call(messages.FetchGameRecords, params);
          if (cancelled) {
            return;
          }
          setRecords(res.records);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(source), props.scrollToTop]);

  return (
    <>
      <h2>
        <ViewTitle source={source} />
        {loading && <Spinner />}
        <Filler />
        <span>Sort by</span>
        <select>
          <option value="one">one</option>
          <option value="two">two</option>
          <option value="three">thre</option>
        </select>
        <LayoutButton
          icon="grid"
          className={classNames({ active: layout === "grid" })}
          onClick={() => setLayout("grid")}
        />
        <LayoutButton
          icon="list"
          className={classNames({ active: layout === "list" })}
          onClick={() => setLayout("list")}
        />
      </h2>
      {layout === "grid" ? (
        <GameGrid records={records} setRecords={setRecords} />
      ) : (
        <GameList records={records} setRecords={setRecords} />
      )}
    </>
  );
};

const LayoutButton = styled(IconButton)`
  border: 1px solid transparent;
  border-radius: 2;

  &.active {
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const Filler = styled.div`
  flex-grow: 1;
`;

const ViewTitle = (props: { source: Source }) => {
  const { source } = props;
  switch (source.source) {
    case GameRecordsSource.Installed:
      return <FormattedMessage id="sidebar.installed" />;
    case GameRecordsSource.Owned:
      return <FormattedMessage id="sidebar.owned" />;
    case GameRecordsSource.Profile:
      return <FormattedMessage id="sidebar.dashboard" />;
    case GameRecordsSource.Collection:
      return <>{source.collection.title}</>;
  }
};

const CollectionList = (props: {
  source: Source;
  setSource: (vt: Source) => void;
}) => {
  const iprops = makeItemProps(props.source, props.setSource);

  const profile = useProfile();
  const socket = useSocket();
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    (async () => {
      let { items } = await socket.callWithRefresh(
        messages.FetchProfileCollections,
        {
          profileId: profile!.id,
          sortBy: "updatedAt",
        }
      );
      setCollections(items);
    })();
  }, []);

  return (
    <>
      {collections.map(c => {
        return (
          <div
            key={c.id}
            {...iprops({ source: GameRecordsSource.Collection, collection: c })}
          >
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
