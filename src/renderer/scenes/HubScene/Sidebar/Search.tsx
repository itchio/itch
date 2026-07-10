import classNames from "classnames";
import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Dispatch } from "common/types";
import {
  urlForBundle,
  urlForCollection,
  urlForGame,
  urlForSearch,
} from "common/util/navigation";
import React from "react";
import Floater from "renderer/basics/Floater";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { hook } from "renderer/hocs/hook";
import watching, { Watcher } from "renderer/hocs/watching";
import SearchResultsBar from "renderer/scenes/HubScene/Sidebar/SearchResultsBar";
import {
  LocalSearchResult,
  LocalSearchSection,
} from "renderer/scenes/HubScene/Sidebar/SearchResultsBar/SearchResult";
import styled, * as styles from "renderer/styles";
import { TString } from "renderer/t";
import { debounce, isEmpty } from "underscore";
import { injectIntl, IntlShape } from "react-intl";

const SearchContainerContainer = styled.section`
  .relative-wrapper {
    position: relative;
    height: 0;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  padding: 0px 8px;
  margin: 16px 10px;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);

  transition: border-color 0.4s;
  &.open {
    border-color: rgba(255, 255, 255, 0.4);
  }

  input[type="search"] {
    ${styles.searchInput} // mixin!
    width: 100%;
    margin-left: 4px;
    height: 32px;
    font-size: inherit;

    &:focus {
      outline: none;
    }
  }

  .search-icon {
    ${styles.searchIcon};
    font-size: inherit;
  }

  .search-icon-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    transition: opacity 0.2s;
    left: 8px;

    &.enter-pending {
      opacity: 0.5;
    }
  }
`;

@watching
class Search extends React.PureComponent<Props, State> {
  input: HTMLInputElement;

  constructor(props: Search["props"], context: any) {
    super(props, context);
    this.state = {
      open: false,
      loading: false,
      highlight: 0,
      sections: [],
      query: "",
      enterPending: false,
    };
  }

  trigger = debounce((query: string) => {
    if (!this.input || query !== this.input.value) {
      return;
    }
    const { profileId } = this.props;

    if (query == "") {
      this.setState({
        sections: [],
        loading: false,
      });
      return;
    }

    if (!profileId) {
      // search only mounts in the (logged-in) hub scene, so this
      // shouldn't happen - but don't fire a profile-less local search
      return;
    }

    doAsync(async () => {
      this.setState({ loading: true });
      try {
        const res = await rcall(messages.SearchLocal, {
          profileId,
          query,
        });
        if (query === this.state.query) {
          this.setState({ sections: buildSections(res, query) });
        }
      } catch {
        if (query === this.state.query) {
          this.setState({ sections: [] });
        }
      } finally {
        if (query !== this.state.query) {
          return;
        }
        this.setState({ loading: false, highlight: 0 });
        if (this.state.enterPending) {
          this.setState({ enterPending: false });
          if (this.state.open) {
            this.openItchioSearch(query);
          }
        }
      }
    });
  }, 100);

  onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    this.setOpened(true);
  };

  onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    this.setOpened(false);
  };

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.currentTarget.value;
    this.setState({
      query,
      loading: query !== "",
      highlight: 0,
      enterPending: false,
    });
    this.trigger(query);
  };

  flatResults(): LocalSearchResult[] {
    const out: LocalSearchResult[] = [];
    for (const section of this.state.sections) {
      out.push(...section.results);
    }
    return out;
  }

  searchHighlightOffset(offset: number) {
    let highlight = this.state.highlight + offset;
    const numResults = this.flatResults().length + (this.state.query ? 1 : 0);

    if (numResults == 0) {
      highlight = 0;
    } else {
      if (highlight >= numResults) {
        highlight = numResults - 1;
      }
      if (highlight < 0) {
        highlight = 0;
      }
    }

    this.setState({ highlight });
  }

  setSearchHighlight = (index: number) => {
    this.setState({ highlight: index });
  };

  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;

    let passthrough = false;

    if (key === "Escape") {
      // default behavior is to clear - don't
    } else if (key === "ArrowDown") {
      this.searchHighlightOffset(1);
      // default behavior is to jump to end of input - don't
    } else if (key === "ArrowUp") {
      this.searchHighlightOffset(-1);
      // default behavior is to jump to start of input - don't
    } else if (key === "Enter") {
      if (this.state.loading) {
        this.setState({ enterPending: true });
      } else {
        this.openHighlightedResult();
      }
    } else {
      passthrough = true;
    }

    if (!passthrough) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    return true;
  };

  openHighlightedResult = () => {
    const { highlight } = this.state;
    const result = this.flatResults()[highlight - 1];
    if (!result) {
      this.openItchioSearch();
      return;
    }

    this.setOpened(false);
    if (this.input) {
      this.input.blur();
    }
    this.props.dispatch(
      actions.navigate({
        wind: "root",
        url: result.url,
      })
    );
  };

  openItchioSearch = (query = this.state.query) => {
    this.setOpened(false);
    if (this.input) {
      this.input.blur();
    }
    this.props.dispatch(
      actions.navigate({
        wind: "root",
        url: urlForSearch(query),
      })
    );
  };

  subscribe(watcher: Watcher) {
    watcher.on(actions.focusSearch, async (store, action) => {
      if (this.input) {
        this.input.focus();
        this.input.select();
      }
      this.setOpened(true);
    });

    watcher.on(actions.commandBack, async (store, action) => {
      if (this.input) {
        this.input.blur();
      }
      this.setOpened(false);
    });

    watcher.on(actions.closeSearch, async (store, action) => {
      if (this.input) {
        this.input.blur();
      }
      this.setOpened(false);
    });
  }

  override render() {
    const { intl } = this.props;
    const { loading, open } = this.state;

    return (
      <SearchContainerContainer>
        <SearchContainer className={classNames({ open })}>
          <input
            id="search"
            ref={this.gotInput}
            type="search"
            placeholder={TString(intl, ["search.placeholder"]) + "..."}
            onKeyDown={this.onKeyDown}
            onChange={this.onChange}
            onBlur={this.onBlur}
            onFocus={this.onFocus}
          />
          {loading ? (
            <div
              className={classNames("search-icon search-icon-loading", {
                "enter-pending": this.state.enterPending,
              })}
            >
              <Floater tiny />
            </div>
          ) : (
            <span className="icon icon-search search-icon" />
          )}
          <div className="relative-wrapper">
            <SearchResultsBar
              sections={this.state.sections}
              loading={this.state.loading}
              open={this.state.open}
              query={this.state.query}
              highlight={this.state.highlight}
              setSearchHighlight={this.setSearchHighlight}
            />
          </div>
        </SearchContainer>
      </SearchContainerContainer>
    );
  }

  gotInput = (input: HTMLInputElement) => {
    this.input = input;
  };

  setOpened(open: boolean) {
    this.setState({ open });
    const { dispatch } = this.props;
    dispatch(actions.searchVisibilityChanged({ open }));
  }
}

interface Props {
  profileId: number | null;
  dispatch: Dispatch;
  intl: IntlShape;
}

interface State {
  highlight: number;
  loading: boolean;
  open: boolean;
  sections: LocalSearchSection[];
  query: string;
  enterPending: boolean;
}

function buildSections(
  res: messages.SearchLocalResult,
  query: string
): LocalSearchSection[] {
  const sections: LocalSearchSection[] = [];

  if (!isEmpty(res.games)) {
    sections.push({
      labelKey: "search.results.games",
      results: res.games.map((game) => ({
        kind: "game" as const,
        id: game.id,
        title: game.title,
        coverUrl: game.coverUrl,
        stillCoverUrl: game.stillCoverUrl,
        subtitle:
          game.shortText && game.shortText !== "" ? game.shortText : undefined,
        url: urlForGame(game.id),
      })),
    });
  }

  if (!isEmpty(res.bundles)) {
    sections.push({
      labelKey: "search.results.bundles",
      results: res.bundles.map((bundle) => ({
        kind: "bundle" as const,
        id: bundle.id,
        title: bundle.title,
        coverUrl: bundle.coverUrl,
        subtitle: ["bundle.item_count", { itemCount: bundle.gamesCount }],
        url: urlForBundle(bundle.id),
      })),
    });
  }

  if (!isEmpty(res.collections)) {
    sections.push({
      labelKey: "search.results.collections",
      results: res.collections.map((collection) => ({
        kind: "collection" as const,
        id: collection.id,
        title: collection.title,
        subtitle: [
          "collection.item_count",
          { itemCount: collection.gamesCount },
        ],
        url: urlForCollection(collection.id),
      })),
    });
  }

  // order sections by their best match, mirroring butler's per-list
  // ranking: match tier (exact, prefix, substring), then title length.
  // Each list arrives pre-ranked, so its first result is its best. Ties
  // keep the games/bundles/collections order (sort is stable).
  const q = query.toLowerCase();
  const score = (section: LocalSearchSection): number => {
    const title = section.results[0].title;
    const t = title.toLowerCase();
    const tier = t === q ? 0 : t.startsWith(q) ? 1 : 2;
    return tier * 1000 + Math.min(title.length, 999);
  };
  return sections.sort((a, b) => score(a) - score(b));
}

export default hook((map) => ({
  profileId: map((rs) => (rs.profile.profile ? rs.profile.profile.id : null)),
}))(injectIntl(Search));
