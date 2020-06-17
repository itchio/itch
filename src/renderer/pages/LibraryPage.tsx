import { socket } from "renderer";
import classNames from "classnames";
import { messages } from "common/butlerd";
import {
  Collection,
  FetchGameRecordsParams,
  GameRecord,
  GameRecordsSource,
} from "@itchio/valet/messages";
import { LocalizedString } from "common/types";
import _ from "lodash";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { FormattedMessage } from "react-intl";
import { Ellipsis } from "renderer/basics/Ellipsis";
import { Icon } from "renderer/basics/Icon";
import { MultiDropdown } from "renderer/basics/MultiDropdown";
import { useProfile } from "renderer/contexts";
import { Dropdown } from "renderer/Dropdown";
import { GameGrid } from "renderer/pages/GameGrid";
import { GameList } from "renderer/pages/GameList";
import { fontSizes, mixins } from "common/theme";
import styled from "styled-components";
import { usePreferences } from "renderer/use-preferences";
import { TabLayout } from "common/preferences";
import { useAsyncCb } from "renderer/use-async-cb";
import { queries } from "common/queries";

const LibraryLayout = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;

  min-height: 100%;
  max-height: 100%;

  .sidebar {
    width: 280px;
    font-size: ${fontSizes.large};
    flex-shrink: 0;

    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;

    padding-top: 1em;

    .separator {
      height: 2px;
      width: 100%;
    }

    .heading {
      padding: 1.4em;
      text-transform: uppercase;
      font-size: ${fontSizes.small};
      font-weight: 900;
    }

    .item {
      cursor: pointer;
      display: flex;
      flex-direction: row;
      align-items: center;

      padding: 1em 0.4em;

      font-size: ${fontSizes.normal};
      color: ${(p) => p.theme.colors.text3};

      .title {
        ${mixins.singleLine};
      }

      .count {
        flex-shrink: 0;
        margin-left: 1em;
        font-size: ${fontSizes.small};
        background: rgba(0, 0, 0, 0.4);
        color: ${(p) => p.theme.colors.text2};
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
        color: ${(p) => p.theme.colors.text2};
      }

      &.active {
        color: ${(p) => p.theme.colors.text1};
      }
    }
  }

  .main {
    display: flex;
    flex-direction: column;
    overflow-x: hidden;

    flex-grow: 1;
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

  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollToTop = useCallback(() => {
    bodyRef.current?.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [bodyRef]);

  return (
    <LibraryLayout>
      <div className="sidebar">
        <div
          className="item"
          onClick={() => {
            location.href = "https://itch.io";
          }}
        >
          <Icon icon="itchio" />
          <FormattedMessage id="sidebar.explore" />
        </div>
        <div className="heading">
          <FormattedMessage id="sidebar.library" />
        </div>
        <div {...iprops({ source: GameRecordsSource.Installed })}>
          <Icon icon="install" />
          <FormattedMessage id="sidebar.installed" />
        </div>
        <div {...iprops({ source: GameRecordsSource.Owned })}>
          <Icon icon="book" />
          <FormattedMessage id="sidebar.owned" />
        </div>
        <div {...iprops({ source: GameRecordsSource.Profile })}>
          <Icon icon="pencil" />
          <FormattedMessage id="sidebar.dashboard" />
        </div>
        <div className="separator" />
        <div className="heading">
          <FormattedMessage id="sidebar.collections" />
        </div>
        <CollectionList source={source} setSource={setSource} />
      </div>
      <div className="main">
        <Viewport ref={bodyRef} source={source} scrollToTop={scrollToTop} />
      </div>
    </LibraryLayout>
  );
};

const originalSorts = {
  [GameRecordsSource.Owned]: [
    {
      value: "default",
      label: "Acquisition date",
      directions: ["Recent first", "Oldest first"],
    },
    {
      value: "title",
      label: "Title",
      directions: ["Alphabetical", "Reverse alphabetical"],
    },
  ] as const,
  [GameRecordsSource.Profile]: [
    {
      value: "default",
      label: "Title",
      directions: ["Alphabetical", "Reverse alphabetical"],
    },
    {
      value: "views",
      label: "Views",
      directions: ["Most views first", "Least views first"],
    },
    {
      value: "downloads",
      label: "Downloads",
      directions: ["Most downloads first", "Least views first"],
    },
    {
      value: "purchases",
      label: "Purchases",
      directions: ["Most purchases first", "Least purchases first"],
    },
  ] as const,
  [GameRecordsSource.Collection]: [
    {
      value: "default",
      label: "Collection order",
      directions: ["Default", "Reversed"],
    },
    {
      value: "title",
      label: "Title",
      directions: ["Alphabetical", "Reverse alphabetical"],
    },
  ] as const,
  [GameRecordsSource.Installed]: [
    {
      value: "default",
      label: "Recency",
      directions: ["Recent first", "Oldest first"],
    },
    {
      value: "installedSize",
      label: "Installed size",
      directions: ["Biggest first", "Smallest first"],
    },
    {
      value: "title",
      label: "Title",
      directions: ["Alphabetical", "Reverse alphabetical"],
    },
    {
      value: "playTime",
      label: "Play time",
      directions: ["Most played first", "Least played first"],
    },
  ] as const,
};

type SortBy =
  | typeof originalSorts[GameRecordsSource.Owned][number]["value"]
  | typeof originalSorts[GameRecordsSource.Profile][number]["value"]
  | typeof originalSorts[GameRecordsSource.Collection][number]["value"]
  | typeof originalSorts[GameRecordsSource.Installed][number]["value"];

const sorts = (originalSorts as any) as {
  [key in GameRecordsSource]: {
    value: SortBy;
    label: LocalizedString;
    directions: [LocalizedString, LocalizedString];
  }[];
};

const Viewport = React.forwardRef(
  (props: { source: Source; scrollToTop: () => void }, ref: any) => {
    const { source, scrollToTop } = props;

    const profile = useProfile();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<GameRecord[]>([]);

    const preferences = usePreferences();
    const layout = preferences?.layout ?? "grid";
    const [setLayout] = useAsyncCb(async (layout: TabLayout) => {
      await socket.query(queries.updatePreferences, {
        preferences: { layout },
      });
    }, []);

    const [sortBy, setSortBy] = useState<SortBy>("default");
    const [filterBy, setFilterBy] = useState<string[]>([]);
    const [reverse, setReverse] = useState(false);

    const filterByInstalled = useMemo(() => _.includes(filterBy, "installed"), [
      filterBy,
    ]);
    const filterByOwned = useMemo(() => _.includes(filterBy, "owned"), [
      filterBy,
    ]);

    useEffect(() => {
      if (
        !_.includes(
          _.map(sorts[source.source], (s) => s.value),
          sortBy
        )
      ) {
        setSortBy("default");
      }
    }, [source.source, sortBy]);

    const sourceSource = source.source;
    const sourceCollectionId =
      source.source === GameRecordsSource.Collection
        ? source.collection.id
        : undefined;

    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          let params: FetchGameRecordsParams = {
            profileId: profile.id,
            limit: 200, // TODO: pagination
            source: sourceSource,
            collectionId: sourceCollectionId,
            sortBy: sortBy === "default" ? undefined : sortBy,
            filters: {
              installed: filterByInstalled,
              owned: filterByOwned,
            },
            reverse,
          };

          let res = await socket.call(
            messages.FetchGameRecords,
            params,
            (convo) => {
              convo.onNotification(messages.Log, (params) => {
                console.log(params.message);
              });
            }
          );
          if (cancelled) {
            return;
          }
          scrollToTop();
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
    }, [
      sourceSource,
      sourceCollectionId,
      filterByInstalled,
      filterByOwned,
      sortBy,
      reverse,
      profile,
      scrollToTop,
    ]);

    let currentSort = _.find(sorts[source.source], (s) => s.value === sortBy);

    return (
      <>
        <ViewHeader>
          <ViewTitle source={source} />
          {loading && <Ellipsis />}
          <Filler />
          <Spacer />
          <MultiDropdown
            prefix={<PrefixIcon icon="filter" />}
            empty={"No filters"}
            onChange={(filterBy) => setFilterBy(filterBy)}
            options={[
              { value: "installed", label: "Installed" },
              { value: "owned", label: "Owned" },
            ]}
            values={filterBy}
          />
          <Spacer />
          <Dropdown
            name="sort-field"
            groupPosition="start"
            prefix={<PrefixIcon icon="arrange2" />}
            value={sortBy}
            options={sorts[source.source]}
            onChange={(s) => {
              setSortBy(s);
              setReverse(false);
            }}
          />
          <Dropdown
            name="sort-direction"
            groupPosition="end"
            onChange={(val) => setReverse(val === "true")}
            options={[
              { value: "false", label: currentSort?.directions[0] ?? "Normal" },
              {
                value: "true",
                label: currentSort?.directions[1] ?? "Reversed",
              },
            ]}
            value={reverse ? "true" : "false"}
            renderValue={(option) =>
              _.find(sorts[source.source], (s) => s.value === sortBy)
                ?.directions[option.value === "true" ? 1 : 0]
            }
          />
          <Spacer />
          <Dropdown
            name="layout"
            onChange={(layout) => setLayout(layout)}
            options={
              [
                { value: "grid", label: "Grid" },
                { value: "list", label: "List" },
              ] as {
                value: TabLayout;
                label: LocalizedString;
              }[]
            }
            value={layout}
            renderValue={(option) => <Icon icon={option.value} />}
          />
        </ViewHeader>
        <ViewBody ref={ref}>
          {layout === "grid" ? (
            <GameGrid records={records} setRecords={setRecords} />
          ) : (
            <GameList records={records} setRecords={setRecords} />
          )}
        </ViewBody>
      </>
    );
  }
);

const PrefixIcon = styled(Icon)`
  margin-right: 1em;
`;

const Filler = styled.div`
  flex-grow: 1;
`;

const Spacer = styled.div`
  flex-shrink: 0;
  flex-basis: 0.5em;
`;

const ViewBody = styled.div`
  overflow-y: auto;
  flex-grow: 1;
`;

const ViewHeader = styled.div`
  font-size: ${fontSizes.large};
  font-weight: 800;

  flex-shrink: 0;

  padding: 10px 20px;
  display: flex;
  flex-direction: row;
  align-items: center;

  background: ${(p) => p.theme.colors.shellBg};
  z-index: 2;

  .filler {
    flex-grow: 1;
  }

  .spinner {
    margin-left: 1em;
  }
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
  }, [profile]);

  return (
    <>
      {collections.map((c) => {
        return (
          <div
            key={c.id}
            {...iprops({ source: GameRecordsSource.Collection, collection: c })}
          >
            <Icon icon="tag" />
            <span className="title">{c.title}</span>
            {c.gamesCount > 0 ? (
              <span className="count">{c.gamesCount}</span>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

export default LibraryPage;
