import classNames from "classnames";
import { actions } from "common/actions";
import urls from "common/constants/urls";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import { hook } from "renderer/hocs/hook";
import watching, { Watcher } from "renderer/hocs/watching";
import GameSearchResult, {
  SetSearchHighlightFunc,
} from "renderer/scenes/HubScene/Sidebar/SearchResultsBar/GameSearchResult";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { each, isEmpty } from "underscore";
import { Game } from "common/butlerd/messages";

const ResultsContainer = styled.div`
  background: ${(props) => props.theme.sidebarBackground};
  z-index: 40;

  position: absolute;
  box-shadow: 0 0 30px ${(props) => props.theme.sidebarBackground};
  border-radius: 0 0 0 2px;

  display: flex;
  flex-direction: column;

  width: 500px;
  max-height: 400px;

  left: -10px;
  top: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;

  /* this scrolls, so we want it to have its own layer */
  will-change: transform;

  flex-grow: 1;

  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

const NoResults = styled.p`
  font-size: ${(props) => props.theme.fontSizes.smaller};
  padding: 8px 12px;
`;

@watching
class SearchResultsBar extends React.PureComponent<Props> {
  render() {
    const { open, games } = this.props;
    if (!open) {
      return null;
    }

    return (
      <ResultsContainer className={classNames("results-container", { open })}>
        {this.resultsGrid(games)}
      </ResultsContainer>
    );
  }

  resultList: Element;
  onResultList = (el: Element) => {
    this.resultList = el;
  };

  onOpenAsTab = () => {
    const { dispatch } = this.props;
    dispatch(actions.closeSearch({}));
    dispatch(
      actions.navigate({
        wind: ambientWind(),
        url: `${urls.itchio}?${encodeURIComponent(this.props.query)}`,
      })
    );
  };

  subscribe(watcher: Watcher) {
    watcher.on(actions.searchFetched, async (store, action) => {
      if (this.resultList) {
        this.resultList.scrollTop = 0;
      }
    });
  }

  resultsGrid(games: Game[]) {
    const { highlight, query, example, loading } = this.props;
    const active = this.props.open;

    const items: React.ReactElement<any>[] = [];

    if (isEmpty(games)) {
      items.push(
        <NoResults key="no-results">
          {loading
            ? T(["sidebar.loading"])
            : query
            ? T(["search.empty.no_results"])
            : T(["search.empty.tagline", { example }])}
        </NoResults>
      );
    } else {
      let index = 0;
      each(games, (game) => {
        items.push(
          <GameSearchResult
            key={`game-${game.id}`}
            game={game}
            index={index}
            chosen={index === highlight}
            active={active}
            loading={loading}
            setSearchHighlight={this.props.setSearchHighlight}
          />
        );
        index++;
      });
    }

    return <ResultList>{items}</ResultList>;
  }
}

interface Props {
  open: boolean;
  highlight: number;
  query: string;
  games: Game[];
  example: string;
  loading: boolean;

  dispatch: Dispatch;
  setSearchHighlight: SetSearchHighlightFunc;
}

export default hook()(SearchResultsBar);
